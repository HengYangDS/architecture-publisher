#!/usr/bin/env node
import {readSourceBundle} from '../source/bundle.mjs';

const usage = 'architecture source verify <manifest-path> --sha256 <digest>';
const args = process.argv.slice(2);
if (args.length !== 5 || args[0] !== 'source' || args[1] !== 'verify' || args[3] !== '--sha256') {
  process.stdout.write(JSON.stringify({status: 'error', error: {code: 'usage', message: usage}}) + '\n');
  process.exitCode = 2;
} else {
  try {
    const verified = await readSourceBundle(args[2], args[4]);
    const members = verified.members.map(({content, ...member}) => member);
    process.stdout.write(JSON.stringify({status: 'verified', ...verified, members}) + '\n');
  } catch (error) {
    const code = error.code ?? 'verification_failed';
    process.stdout.write(JSON.stringify({status: 'error', error: {code, message: code}}) + '\n');
    process.exitCode = 1;
  }
}
