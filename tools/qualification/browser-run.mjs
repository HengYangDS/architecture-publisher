import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {encodeBrowserReport} from '../../editions/ethos/browser-report.mjs';
import {chromium} from 'playwright-core';
import {sha256} from '../../src/integrations/ethos/projection.mjs';
import {readEthosAtlasOutput} from '../../editions/ethos/atlas-output.mjs';
import {describeEthosBrowser} from '../../editions/ethos/browser.mjs';
import {observationName,browserCoverageGaps} from '../../editions/ethos/browser-obligations.mjs';
import {viewportFindings} from '../../editions/ethos/browser-viewport.mjs';
import {measureViewport,exerciseStory,exerciseExports,exerciseDisclosures} from './browser-observer.mjs';

const file=path.resolve(process.argv[2]),mode=process.argv[3];
if(!['smoke','full'].includes(mode))throw Error('Select smoke or full browser qualification');
const config=JSON.parse(await fs.readFile(file));
if(!path.isAbsolute(config.browserExecutable??'')||!path.isAbsolute(config.output??''))
  throw Error('Explicit browser executable and output required');
const selected=await readEthosAtlasOutput(config.atlas),target=await describeEthosBrowser(config.atlas);
const output=path.join(config.output,mode);await fs.mkdir(output,{recursive:false});
const allowed=new Map(selected.members.map(m=>['/'+m.path,m.content]));
const standalone=await fs.readFile(config.standalone);
if(sha256(standalone)!==config.standaloneSha256)throw Error('Standalone changed');
allowed.set('/standalone.html',standalone);
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname,bytes=allowed.get(name);
  if(name==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(!bytes){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:config.browserExecutable,headless:true,chromiumSandbox:true,timeout:15000});
const progress={source:target.source,outputManifestSha256:target.outputManifestSha256,mode,status:'running',startedAt:new Date().toISOString(),completed:[],errors:[]};
const checkpoint=async()=>{const p=path.join(output,'progress.json');await fs.writeFile(p+'.next',JSON.stringify(progress,null,2)+'\n');await fs.rename(p+'.next',p);};
let expired=false;
const deadline=setTimeout(()=>{expired=true;browser.close().catch(()=>{});},mode==='smoke'?300000:70*60*1000);
const close=()=>{expired=true;browser.close().catch(()=>{});};
process.once('SIGTERM',close);process.once('SIGINT',close);
const reports=[];
try{
  for(const viewport of target.viewports){
    const destination=path.join(output,viewport.join('x'));
    await fs.mkdir(destination);await fs.mkdir(path.join(destination,'screenshots'));await fs.mkdir(path.join(destination,'exports'));
    const report={status:'RUNNING',scenario:'story',source:target.source,artifactManifestSha256:target.outputManifestSha256,viewports:[viewport],pages:target.pages,browserVersion:browser.version(),observations:[],stories:[],exports:[],disclosures:[],errors:[]};
    reports.push({destination,report});
    for(const item of target.pages){
      if(expired)throw Error('Owned browser deadline reached');
      progress.current={viewport,page:item.id};await checkpoint();
      const context=await browser.newContext({viewport:{width:viewport[0],height:viewport[1]},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:true});
      try{
        await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin||['data:','blob:','about:'].includes(u.protocol))return route.continue();report.errors.push({code:'external-request',origin:u.origin});return route.abort();});
        const page=await context.newPage();page.on('pageerror',e=>report.errors.push({code:'page-error',message:e.message}));
        const response=await page.goto(origin+'/'+item.path+'?theme=light',{waitUntil:'load',timeout:20000});
        if(response.status()!==200||sha256(await response.body())!==item.htmlSha256)throw Error('Served page differs');
        for(const state of ['document','present']){
          if(state==='present')await page.locator('#btn-present').click();
          await page.evaluate(async()=>{await document.fonts.ready;await Archify.readerLayout.whenStable();await Archify.viewerChromeLayout.whenStable();});
          const before=await page.evaluate(measureViewport);await page.waitForTimeout(350);const measured=await page.evaluate(measureViewport),findings=viewportFindings(measured,target.typography);
          if(JSON.stringify(before.svg)!==JSON.stringify(measured.svg)||before.scrollHeight!==measured.scrollHeight)findings.push({code:'unstable-layout'});
          const screenshot=observationName({page:item.id,htmlSha256:item.htmlSha256,viewport,state,part:'viewport'})+'.png';await page.screenshot({path:path.join(destination,'screenshots',screenshot)});
          report.observations.push({page:item.id,htmlSha256:item.htmlSha256,state,viewport:{width:viewport[0],height:viewport[1]},measured,findings,screenshot});
          if(findings.length)throw Error('Layout findings '+item.id+'/'+state+': '+JSON.stringify(findings));
          if(mode==='full'){
            const story=await exerciseStory(page,{target:item,output:destination,state,viewport,typography:target.typography});report.stories.push(story);
            if(story.findings.length||story.samples.some(s=>s.findings.length))throw Error('Story findings '+item.id+'/'+state+': '+JSON.stringify(story.findings));
          }
        }
        if(mode==='full'){
          await page.locator('#btn-present').click();
          const exports=await exerciseExports(page,{target:item,output:destination,viewport});
          for(const result of exports)if(result.file)result.file=path.relative(destination,result.file).split(path.sep).join('/');
          report.exports.push({page:item.id,viewport:{width:viewport[0],height:viewport[1]},results:exports});
          const results=await exerciseDisclosures(page,{target:item,output:destination,viewport,typography:target.typography});report.disclosures.push({page:item.id,viewport:{width:viewport[0],height:viewport[1]},results});
          if(results.some(r=>r.findings.length))throw Error('Disclosure layout findings');
        }
        progress.completed.push({viewport,page:item.id,mode,status:'PASS_BOUNDED'});
      }finally{await context.close();}
      await checkpoint();console.log(JSON.stringify(progress.completed.at(-1)));
    }
  }
  const context=await browser.newContext({viewport:{width:1600,height:1000},serviceWorkers:'block'});
  try{
    await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin||['data:','blob:','about:'].includes(u.protocol))return route.continue();progress.errors.push('standalone-external:'+u.origin);return route.abort();});
    const page=await context.newPage();page.on('pageerror',e=>progress.errors.push(e.message));
    await page.goto(origin+'/standalone.html');
    for(const item of target.pages){
      await page.evaluate(p=>window.__atlasNavigate(p,'?theme=light',''),item.path);
      const frame=page.frameLocator('#atlas');await frame.locator('.diagram-container > svg').waitFor();
      await frame.locator('body').evaluate(async()=>{await document.fonts.ready;await Archify.readerLayout.whenStable();await Archify.viewerChromeLayout.whenStable();});
      const svg=await frame.locator('.diagram-container > svg').getAttribute('viewBox');
      if(!svg)throw Error('Standalone missing complete diagram');
    }
    await page.evaluate(()=>window.__atlasNavigate('index.html','?theme=light',''));
    await page.frameLocator('#atlas').locator('.diagram-container > svg').waitFor();
    await page.screenshot({path:path.join(output,'standalone.png')});progress.standalone={pages:target.pages.length,sha256:config.standaloneSha256};
  }finally{await context.close();}
  progress.status=progress.errors.length?'FAIL':'PASS_BOUNDED';
}catch(error){progress.status='FAIL';progress.errors.push(error.message);process.exitCode=1;}
finally{
  clearTimeout(deadline);process.removeListener('SIGTERM',close);process.removeListener('SIGINT',close);await browser.close();await new Promise(resolve=>server.close(resolve));
  progress.browserClosed=true;progress.finishedAt=new Date().toISOString();
  for(const{destination,report}of reports){
    report.browserClosed=true;report.status=progress.status;
    if(mode==='full'&&progress.status==='PASS_BOUNDED'){
      const gaps=browserCoverageGaps(report,target.pages,report.viewports[0],target.typography);
      if(gaps.length){report.status='FAIL';progress.status='FAIL';progress.errors.push(...gaps);process.exitCode=1;}
    }
    const encoded=encodeBrowserReport(report);
    await fs.writeFile(path.join(destination,encoded.name),encoded.content,{flag:'wx'});
  }
  await checkpoint();console.log(JSON.stringify({status:progress.status,completed:progress.completed.length,errors:progress.errors,browserClosed:true}));
}
