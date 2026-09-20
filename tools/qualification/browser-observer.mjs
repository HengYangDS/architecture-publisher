// Migrated from the verified browser observer a5cc0b15e06fbdc71b3ac3adaf105a0b50b270ae583a1ae28ad05dff07e54f00.
// Execution adapter: native installed Playwright, exact HTTP artifact input.
// The observer functions below are byte-identical to the pinned historical source.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {viewportFindings,storyFindings} from '../../editions/ethos/browser-viewport.mjs';
import {ATLAS_EXPORTS,ATLAS_DISCLOSURES,observationName} from '../../editions/ethos/browser-obligations.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
/** Runs in the page; reports bounding boxes and CTM, not exact glyph ink. */
export function measureViewport(){
 const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const visible=e=>{let opacity=1;for(let p=e;p instanceof Element;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden')return 0;opacity*=Number(s.opacity);}return opacity;};
 const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>0.5;
 const graph=document.querySelector('.diagram-container > svg'),panel=graph?.parentElement;
 const texts=[...(graph?.querySelectorAll('text')??[])].map((e,i)=>{const m=e.getScreenCTM(),s=getComputedStyle(e);return{id:i,text:e.textContent.trim(),box:box(e),opacity:visible(e),owner:e.closest('[data-node-id]')?.getAttribute('data-node-id')??null,effectiveFont:m?parseFloat(s.fontSize)*Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d)):null};});
 const painted=texts.filter(t=>t.opacity>0&&t.box.width>0&&t.box.height>0),overlaps=[];
 for(let i=0;i<painted.length;i++)for(let j=i+1;j<painted.length;j++)if(overlap(painted[i].box,painted[j].box))overlaps.push({a:painted[i].text,b:painted[j].text});
 const panelBox=panel?box(panel):null;
 const overflow=painted.filter(t=>panelBox&&(t.box.x<panelBox.x-0.5||t.box.right>panelBox.right+0.5||t.box.y<panelBox.y-0.5||t.box.bottom>panelBox.bottom+0.5)).map(t=>t.text);
 const notes=[...document.querySelectorAll('.container > .cards,.container > [data-resource-comparison],.container > [data-verification-details],.container > [data-write-boundary]')];
 const notesHidden=notes.filter(e=>!visible(e)).map(e=>e.className||e.tagName);
 // Measure text-node line fragments, not overlapping parent/child boxes.
 // Range client rects distinguish legitimate wrapping from actual collisions.
 const supportText=[],supportTruncations=[];let textNodeId=0;
 for(const root of document.querySelectorAll('.container > .header,.container > .guided-views,.container > [data-ethos-atlas-navigation],.container > .cards,.container > [data-resource-comparison],.container > [data-verification-details],.container > [data-write-boundary]')){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  for(let node;node=walker.nextNode();){
   if(!node.textContent.trim()||!visible(node.parentElement)||!node.parentElement.checkVisibility({checkVisibilityCSS:true,contentVisibilityAuto:true})||node.parentElement.closest('script,style'))continue;
   const range=document.createRange();range.selectNodeContents(node);
   const owner=node.parentElement.closest('td,th,li,.card,.guided-story-caption,.header,[data-resource-comparison],[data-verification-details],[data-write-boundary]')??root;
   const id=++textNodeId,clippers=[];
   for(let e=node.parentElement;e;e=e.parentElement){const s=getComputedStyle(e);if(/hidden|clip|auto|scroll/.test(s.overflowX+' '+s.overflowY))clippers.push({box:box(e),x:s.overflowX!=='visible',y:s.overflowY!=='visible',ellipsis:s.textOverflow==='ellipsis'});}
   const fragments=[];
   for(const r of range.getClientRects())if(r.width&&r.height){
    let x=r.x,y=r.y,right=r.right,bottom=r.bottom;
    for(const c of clippers){if(c.ellipsis&&(x<c.box.x-1||right>c.box.right+1))supportTruncations.push({text:node.textContent.trim(),reason:'ellipsis'});if(c.x){x=Math.max(x,c.box.x);right=Math.min(right,c.box.right);}if(c.y){y=Math.max(y,c.box.y);bottom=Math.min(bottom,c.box.bottom);}}
    const rect={x,y,right,bottom,width:right-x,height:bottom-y};
    if(rect.width>0&&rect.height>0&&!fragments.some(f=>JSON.stringify(f)===JSON.stringify(rect))){fragments.push(rect);supportText.push({id,text:node.textContent.trim(),box:rect,owner:box(owner)});}
   }
  }
 }
 const supportOverlaps=[],supportOverflow=[];
 for(let i=0;i<supportText.length;i++){
  const a=supportText[i];if(a.box.x<a.owner.x-1||a.box.right>a.owner.right+1)supportOverflow.push({text:a.text,box:a.box,owner:a.owner});
  for(let j=i+1;j<supportText.length;j++)if(a.id!==supportText[j].id&&overlap(a.box,supportText[j].box))supportOverlaps.push({a:a.text,b:supportText[j].text});
 }
 const occludedText=[];
 for(const t of painted){const r=t.box,cx=(r.x+r.right)/2,cy=(r.y+r.bottom)/2;if(r.x<0||r.right>innerWidth||r.y<0||r.bottom>innerHeight||panelBox&&(cx<panelBox.x||cx>panelBox.right||cy<panelBox.y||cy>panelBox.bottom))continue;const e=document.elementFromPoint(cx,cy);if(e&&!panel?.contains(e))occludedText.push({text:t.text,owner:t.owner,coveredBy:e.id||e.className||e.tagName});}
 const subtitle=document.querySelector('.subtitle');
 return{viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
  graphCount:document.querySelectorAll('.diagram-container > svg').length,texts:painted,hiddenTexts:texts.filter(t=>t.opacity===0).map(t=>t.text),overlaps,overflow,occludedText,notesHidden,supportText,supportOverlaps,supportOverflow,supportTruncations,
  subtitleVisible:!!subtitle&&visible(subtitle)>0&&box(subtitle).height>0,panel:panelBox,svg:graph?box(graph):null,
  present:document.documentElement.getAttribute('data-present'),detail:panel?.getAttribute('data-detail-level'),motion:document.documentElement.getAttribute('data-motion'),
  scope:subtitle?.textContent,bodyOverflow:getComputedStyle(document.body).overflow,notes:notes.map(e=>({kind:e.className,box:box(e),visible:visible(e)>0})),
  camera:window.Archify?.view?.state(),story:window.Archify?.guidedViews?.beat()??null};
}

function playbackState(){
 const p=document.querySelector('#guided-views'),g=window.Archify.guidedViews;
 return{chapter:g.active(),beat:g.beat(),playing:g.isPlaying(),handoff:g.handoff(),follow:p.getAttribute('data-story-follow'),label:document.querySelector('#guided-view-play-label').textContent,camera:window.Archify.view.state()};
}

/** Target state can settle before CSS transform/opacity paint. Compare paint. */
function storyPaintStable(previous,current){
 if(!previous||previous.story?.nodeId!==current.story?.nodeId)return false;
 const signature=m=>({svg:m.svg,panel:m.panel,texts:m.texts.filter(t=>t.owner===m.story.nodeId).map(t=>({box:t.box,opacity:t.opacity}))});
 const before=signature(previous),after=signature(current);
 return after.texts.length>0&&JSON.stringify(before)===JSON.stringify(after);
}

async function exerciseStory(page,{target,output,state,typography,viewport}){
 const views=await page.locator('#archify-guided-views-data').evaluate(e=>JSON.parse(e.textContent));
 const expected=views.flatMap(v=>v.focus.map((nodeId,index)=>({chapter:v.id,nodeId,index}))),seen=[],samples=[],findings=[];
 await page.locator('#guided-view-play').click();
 const start=Date.now(),deadline=start+views.length*18000+expected.length*1400;
 // Collect paint in the page. Transferring the full geometry on every poll can
 // itself skip a natural beat; the controller receives only small progress.
 await page.evaluate(({measureSource,stableSource})=>{
  const measure=(0,eval)('('+measureSource+')'),stable=(0,eval)('('+stableSource+')');
  const collected={seen:[],samples:[],done:false},sampled=new Set();
  let priorKey='',lastPaint=null,lastAt=0;
  window.__architectureStoryObservation=collected;
  function observe(now){
   if(collected.done)return;
   if(now-lastAt>=80){
    lastAt=now;const g=Archify.guidedViews,beat=g.beat(),chapter=g.active(),key=beat?chapter+'/'+beat.index:'';
    if(key&&key!==priorKey){collected.seen.push({chapter,nodeId:beat.nodeId,index:beat.index});priorKey=key;lastPaint=null;}
    if(key&&!sampled.has(key)&&!g.handoff()&&document.querySelector('#guided-views').getAttribute('data-story-follow')==='settled'){
     const measured=measure();
     if(measured.story?.nodeId===beat.nodeId&&stable(lastPaint,measured)){sampled.add(key);collected.samples.push({chapter,beat,elapsedMs:performance.now()-collected.startedAt,camera:Archify.view.state(),measured});}
     lastPaint=measured;
    }
    if(!g.isPlaying()&&/replay/i.test(document.querySelector('#guided-view-play-label').textContent))collected.done=true;
   }
   if(!collected.done)collected.animationFrame=requestAnimationFrame(observe);
  }
  collected.startedAt=performance.now();collected.animationFrame=requestAnimationFrame(observe);
 },{measureSource:measureViewport.toString(),stableSource:storyPaintStable.toString()});
 const captured=new Map();
 while(Date.now()<deadline){
  const current=await page.evaluate(()=>{const c=window.__architectureStoryObservation;return{done:c.done,count:c.samples.length,latest:c.samples.at(-1)?{chapter:c.samples.at(-1).chapter,beat:c.samples.at(-1).beat}:null};});
  if(current.latest?.beat.index===0){
   const key=current.latest.chapter+'/0';
   if(!captured.has(key)){
    const screenshot=observationName({page:target.id,htmlSha256:target.htmlSha256,viewport,state,part:'story-'+current.latest.chapter+'-0'})+'.png';
    await page.screenshot({path:path.join(output,'screenshots',screenshot)});captured.set(key,screenshot);
   }
  }
  if(current.done)break;
  await page.waitForTimeout(100);
 }
 const collected=await page.evaluate(()=>{const c=window.__architectureStoryObservation;c.done=true;cancelAnimationFrame(c.animationFrame);return{seen:c.seen,samples:c.samples};});
 seen.push(...collected.seen);
 for(const sample of collected.samples){const issues=storyFindings(sample.measured,typography);samples.push({...sample,focal:sample.measured.texts.filter(t=>t.owner===sample.beat.nodeId),supportTruncations:sample.measured.supportTruncations,findings:issues,screenshot:captured.get(sample.chapter+'/'+sample.beat.index)??null});}
 const end=await page.evaluate(playbackState);
 if(end.playing||!/replay/i.test(end.label))findings.push({code:'story-did-not-complete',state:end});
 if(JSON.stringify(seen)!==JSON.stringify(expected))findings.push({code:'beat-order',expected,actual:seen});
 if(samples.length!==expected.length)findings.push({code:'unobserved-settled-beats',expected:expected.length,actual:samples.length});
 // Replay, pause and resume use the public controls at natural clock speed.
 await page.locator('#guided-view-play').click();
 await page.waitForFunction(()=>Archify.guidedViews.beat()?.index===0&&Archify.guidedViews.isPlaying(),{},{timeout:6000});
 const replay=await page.evaluate(playbackState);
 if(replay.chapter!==views[0].id)findings.push({code:'replay-not-at-start',state:replay});
 await page.locator('#guided-view-play').click();const paused=await page.evaluate(playbackState);
 await page.waitForTimeout(400);const retained=await page.evaluate(playbackState);
 if(paused.playing||retained.playing||JSON.stringify(paused.beat)!==JSON.stringify(retained.beat))findings.push({code:'pause-not-retained'});
 await page.locator('#guided-view-play').click();
 const resumed=(await page.evaluate(playbackState)).playing;
 if(!resumed)findings.push({code:'resume-not-playing'});
 await page.locator('#guided-view-play').click();
 await page.locator('#guided-view-all').click();
 await page.waitForFunction(()=>!Archify.guidedViews.isPlaying()&&!Archify.guidedViews.active()&&!Archify.guidedViews.beat(),{},{timeout:6000});
 await page.evaluate(async()=>{await Archify.readerLayout.whenStable();await Archify.viewerChromeLayout.whenStable();});
 const reset=await page.evaluate(measureViewport);
 const resetFindings=viewportFindings(reset,typography);
 if(resetFindings.length)findings.push({code:'reset-layout',detail:resetFindings});
 return{page:target.id,state,viewport:{width:viewport[0],height:viewport[1]},expected,seen,samples,findings,replay,paused,retained,resumed,reset,resetCamera:reset.camera,durationMs:Date.now()-start};
}

async function exerciseExports(page,{target,output,viewport}){
 const results=[];
 for(const format of ATLAS_EXPORTS){
  const variant=['route','reach'].includes(format);
  if(variant)await page.evaluate(variant=>{
   Archify.routeProbe.clear();Archify.focus.clear();
   const edge=document.querySelector('.diagram-container > svg [data-edge-from]');
   if(!edge)throw Error('No declared relationship for variant export');
   const from=edge.getAttribute('data-edge-from'),to=edge.getAttribute('data-edge-to');
   if(variant==='route'){Archify.routeProbe.begin({source:from});Archify.routeProbe.choose(to);if(!Archify.routeProbe.exportSnapshot())throw Error('Route did not resolve');}
   else{Archify.focus.set(from,{toggle:false});Archify.focus.reach('downstream',{toggle:false});if(!Archify.focus.reachabilitySnapshot())throw Error('Reach did not resolve');}
  },format);
  await page.locator('#btn-export').click();
  const button=page.locator(variant?`#export-menu [data-action="${format}-share-card"]`:`#export-menu [data-format="${format}"]`);
  if(await button.isDisabled()){
   const capability=await page.evaluate(()=>({animation:document.querySelector('.diagram-container > svg').getAttribute('data-animation'),canRecord:Archify.motion.canRecord()}));
   if(format!=='webm'||capability.animation==='trace')throw Error('Required export unexpectedly disabled: '+format);
   results.push({format,status:'NOT_APPLICABLE',reason:'No authored trace animation; guided story is not a trace recording',capability});
   await page.locator('#btn-export').click();continue;
  }
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:20000}),button.click()]);
  const failure=await download.failure();if(failure)throw Error('Export download: '+failure);
  const file=path.join(output,'exports',observationName({page:target.id,htmlSha256:target.htmlSha256,viewport,state:'document',part:format})+'.'+(format==='share-card'||variant?'png':format));
  if(await fs.lstat(file).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;}))throw Error('Export output already exists');
  await download.saveAs(file);const bytes=await fs.readFile(file);
  const receipt=await page.evaluate(()=>Object.fromEntries([...document.documentElement.attributes].filter(a=>a.name.startsWith('data-last-export')).map(a=>[a.name,a.value])));
  if(receipt['data-last-export-error']||Number(receipt['data-last-export-bytes'])!==bytes.length||receipt['data-last-export-canonical']!==(variant?'false':'true')||variant&&receipt['data-last-export-'+format+'-state-clean']!=='true')throw Error('Export receipt mismatch: '+JSON.stringify(receipt));
  if(format==='svg'&&!bytes.toString().includes('<svg'))throw Error('Not an SVG export');
  const dimensions=['png','share-card','route','reach'].includes(format)?{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)}:null;
  if(dimensions&&receipt['data-last-export-width']&&(dimensions.width!==Number(receipt['data-last-export-width'])||dimensions.height!==Number(receipt['data-last-export-height'])))throw Error('Export dimensions disagree with completed bytes');
  let content=null;
  if(format==='svg'){
   content=await page.evaluate(source=>{
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw Error('Invalid SVG export');
    const original=[...document.querySelector('.diagram-container > svg').querySelectorAll('text')].map(e=>e.textContent.trim());
    const exported=[...doc.querySelectorAll('text')].filter(e=>!e.closest('[data-atlas-export-scope]')).map(e=>e.textContent.trim());
    return{original,exported,scope:doc.querySelector('[data-atlas-export-scope]')?.textContent,viewBox:doc.documentElement.getAttribute('viewBox')};
   },bytes.toString());
   if(JSON.stringify(content.original)!==JSON.stringify(content.exported))throw Error('Exported diagram text changed');
  }else if(format!=='webm'){
   content=await page.evaluate(async({encoded,format})=>{
    const image=new Image();image.src='data:image/'+(['share-card','route','reach'].includes(format)?'png':format)+';base64,'+encoded;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,32,32);
    const pixels=ctx.getImageData(0,0,32,32).data;let min=255,max=0;for(let i=0;i<pixels.length;i+=4){const value=(pixels[i]+pixels[i+1]+pixels[i+2])/3;min=Math.min(min,value);max=Math.max(max,value);}
    return{width:image.naturalWidth,height:image.naturalHeight,luminanceRange:max-min};
   },{encoded:bytes.toString('base64'),format});
   if(content.width<=0||content.height<=0||content.luminanceRange<10)throw Error('Blank or invalid decoded export: '+format);
  }
  results.push({format,file,bytes:bytes.length,sha256:sha(bytes),dimensions,receipt,content});
 }
 await page.evaluate(()=>{Archify.routeProbe.clear();Archify.focus.clear();});
 return results;
}

async function exerciseDisclosures(page,{target,output,typography,viewport}){
 const results=[];
 // The original source IDs are optional drill-down, but must render correctly
 // when opened. License disclosure is attribution, not architecture copy.
 const disclosures=page.locator(ATLAS_DISCLOSURES);
 for(let i=0;i<await disclosures.count();i++){
  const item=disclosures.nth(i);await item.locator('summary').click();
  await page.evaluate(async()=>{await Archify.readerLayout.whenStable();await Archify.viewerChromeLayout.whenStable();});
  const measured=await page.evaluate(measureViewport),findings=viewportFindings(measured,typography),screenshot=observationName({page:target.id,htmlSha256:target.htmlSha256,viewport,state:'document',part:`disclosure-${i}`})+'.png';
  await page.screenshot({path:path.join(output,'screenshots',screenshot),fullPage:true});
  results.push({index:i,measured,findings,screenshot});await item.locator('summary').click();
 }
 return results;
}

export {exerciseStory,exerciseExports,exerciseDisclosures};
