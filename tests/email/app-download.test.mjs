import test from 'node:test';
import assert from 'node:assert/strict';
import { appDownloadTemplate } from '../../src/lib/email/appDownloadTemplate.js';
import { downloadEmailConfig, sendAppDownload } from '../../src/lib/email/sendAppDownload.js';
const env={APP_DOWNLOAD_EMAIL_ENABLED:'true',APP_DOWNLOAD_URL:'https://clothme.io/download',EMAIL_LOGO_URL:'https://clothme.io/email/clothme-logo.png',RESEND_API_KEY:'test'};
test('disabled or placeholder configuration cannot send',()=>{
 for(const change of [{APP_DOWNLOAD_EMAIL_ENABLED:'false'},{APP_DOWNLOAD_URL:'https://example.com/clothme-download'},{RESEND_API_KEY:''},{APP_DOWNLOAD_URL:'http://clothme.io/download'}])
  assert.throws(()=>downloadEmailConfig({...env,...change}));
});
test('email has logo, no-reply sender, escaped link, and plain text',()=>{
 const config=downloadEmailConfig(env); assert.equal(config.from,'ClothME <noreply@clothme.io>');
 const t=appDownloadTemplate({...config,downloadUrl:'https://clothme.io/download?a=1&b="x"'});
 assert.match(t.html,/alt="ClothME"/);assert.match(t.html,/&amp;b=&quot;x&quot;/);assert.match(t.text,/https:\/\/clothme.io\/download/);assert.doesNotMatch(t.html,/waitlist|5%/);
});
test('retries use the same idempotency key and recipient',async()=>{
 const calls=[];const input={email:'customer@example.com',requestId:'same-request',config:downloadEmailConfig(env),fetcher:async(url,options)=>{calls.push({url,...options});return Response.json({id:'email-id'});}};
 assert.equal(await sendAppDownload(input),'email-id');await sendAppDownload(input);
 assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
 assert.deepEqual(JSON.parse(calls[0].body).to,['customer@example.com']);
});
test('provider rejection and malformed success are not reported as sent',async()=>{
 for(const response of [Response.json({message:'failure'},{status:429}),Response.json({})])
 await assert.rejects(sendAppDownload({email:'a@example.com',requestId:'id',config:downloadEmailConfig(env),fetcher:async()=>response}));
});
