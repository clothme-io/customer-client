import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function handler({configured=true,claimError,sendError}={}) {
 const calls=[];const module={exports:{}};
 const mocks={
  'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},
  '../../../src/lib/email/sendAppDownload.js':{downloadEmailConfig:()=>{if(!configured)throw Error('disabled');return {};},sendAppDownload:async args=>{calls.push(['send',args]);if(sendError)throw Error(sendError);return 'email-id';}},
  '../../../src/lib/email/downloadRequestStore.js':{claimDownloadRequest:async args=>{calls.push(['claim',args]);if(claimError)throw Error(claimError);}},
 };
 const source=fs.readFileSync(new URL('../../app/api/app-download/route.js',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:name=>mocks[name],console:{error(){}}});
 return {calls,post:body=>module.exports.POST(new Request('https://clothme.io/api/app-download',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}))};
}
const valid={email:' Person@Example.com ',requestId:'10000000-0000-4000-8000-000000000001'};
test('validation and disabled sending never contact Resend',async()=>{
 const h=handler();assert.equal((await h.post({...valid,email:'bad'})).status,400);assert.equal((await h.post(null)).status,400);assert.equal(h.calls.length,0);
 const disabled=handler({configured:false});assert.equal((await disabled.post(valid)).status,503);assert.equal(disabled.calls.length,0);
 assert.equal((await h.post({...valid,company:'bot'})).status,200);assert.equal(h.calls.length,0);
});
test('successful requests claim before sending and normalize the recipient',async()=>{
 const h=handler();assert.equal((await h.post(valid)).status,200);assert.deepEqual(h.calls.map(c=>c[0]),['claim','send']);assert.equal(h.calls[1][1].email,'person@example.com');
});
test('rate limits and provider errors never report success',async()=>{
 const limited=handler({claimError:'RATE_LIMITED'});assert.equal((await limited.post(valid)).status,429);assert.equal(limited.calls.length,1);
 assert.equal((await handler({sendError:'failed'}).post(valid)).status,502);
});
