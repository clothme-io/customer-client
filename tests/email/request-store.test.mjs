import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { randomUUID } from 'node:crypto';

test('database claims serialize concurrent tabs, retries, and replica rate limits', {skip:!process.env.EMAIL_TEST_DATABASE_URL}, async()=>{
 const database='email_test_'+randomUUID().replaceAll('-','');
 const admin=new pg.Client({connectionString:process.env.EMAIL_TEST_DATABASE_URL});await admin.connect();
 await admin.query(`CREATE DATABASE ${database}`);
 const url=new URL(process.env.EMAIL_TEST_DATABASE_URL);url.pathname='/'+database;
 const db=new pg.Client({connectionString:url.href});await db.connect();
 process.env.DATABASE_URL=url.href;process.env.DATABASE_SSL='false';process.env.RESEND_API_KEY='integration-test';
 delete process.env.DB_USER;delete process.env.DB_PASS;
 let store;
 try {
  const source=fs.readFileSync(new URL('../../src/migrations/20261003_000001_app_download_requests.ts',import.meta.url),'utf8');
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:()=>({sql:(parts)=>parts.join('')})});
  await module.exports.up({db:{execute:query=>db.query(query)}});
  store=await import('../../src/lib/email/downloadRequestStore.js');
  const args={email:'test@example.com',ip:'127.0.0.1',requestId:randomUUID()};
  await Promise.all([store.claimDownloadRequest(args),store.claimDownloadRequest(args)]);
  assert.equal((await db.query('SELECT count(*) FROM app_download_requests')).rows[0].count,'1');
  await assert.rejects(store.claimDownloadRequest({...args,email:'other@example.com'}),/REQUEST_CONFLICT/);
  await assert.rejects(store.claimDownloadRequest({...args,requestId:randomUUID()}),/RATE_LIMITED/);
  const concurrent=await Promise.allSettled(Array.from({length:10},(_,i)=>store.claimDownloadRequest({email:`test${i}@example.com`,ip:'shared-ip',requestId:randomUUID()})));
  assert.equal(concurrent.filter(x=>x.status==='fulfilled').length,8);
  await db.query("UPDATE app_download_requests SET created_at=now()-interval '24 hours'");
  await assert.rejects(store.claimDownloadRequest(args),/REQUEST_CONFLICT/);
  await module.exports.down({db:{execute:query=>db.query(query)}});
 } finally {
  await store?.closeDownloadRequestStore();await db.end();await admin.query(`DROP DATABASE ${database}`);await admin.end();
 }
});
