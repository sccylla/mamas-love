'use strict';
const assert = require('node:assert/strict');
const file = require('node:path').join(__dirname, '../api/comments.js');
const lists = new Map(), rates = new Map(), commands = [];
let broken = false;
const originalFetch = global.fetch;
global.fetch = async (url, opts) => {
  if (broken) throw new Error('offline');
  assert.equal(url, 'https://test-redis.example');
  assert.equal(opts.headers.Authorization, 'Bearer private-test-token');
  const cmd = JSON.parse(opts.body); commands.push(cmd);
  let result;
  if (cmd[0] === 'LRANGE') result = (lists.get(cmd[1]) || []).slice(0, 50);
  else if (cmd[0] === 'EVAL') {
    const n = rates.get(cmd[3]) || 0;
    if (n >= 5) result = [0, 500];
    else { rates.set(cmd[3], n + 1); lists.set(cmd[4], [cmd[5], ...(lists.get(cmd[4]) || [])]); result = [1, 0]; }
  } else throw new Error('Unexpected command');
  return { ok: true, json: async () => ({ result }) };
};
function handler() { delete require.cache[require.resolve(file)]; return require(file); }
async function call(method, body, options = {}) {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(v) { this.body = JSON.parse(v); } };
  const request = { method, url: '/api/comments?post='+(options.post || 'cycle'), body, headers: { host: 'mamas-love.vercel.app', 'x-forwarded-proto': 'https', 'content-type': 'application/json', 'x-forwarded-for': options.ip || '203.0.113.10', ...(options.headers || {}) } };
  await handler()(request, response); return response;
}
let count = 0;
async function test(name, fn) { await fn(); count++; console.log('PASS '+name); }
const good = { post: 'cycle', name: '  Alice  ', comment: ' This was helpful. ', website: '' };
(async () => {
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  await test('disconnected storage never claims success', async () => {
    for (const method of ['GET', 'POST']) { const r = await call(method, method==='POST' ? good : undefined); assert.equal(r.statusCode, 503); assert.equal(r.body.code, 'COMMENTS_UNAVAILABLE'); }
  });
  process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'private-test-token';
  await test('separate visitors and handler instances share stored comments', async () => {
    const first = await call('POST', good, { headers: { origin: 'https://mamas-love.vercel.app' } }); assert.equal(first.statusCode, 201); assert.equal(first.body.comment.name, 'Alice'); assert.equal(first.body.comment.comment, 'This was helpful.');
    const second = await call('POST', { ...good, name: 'Bob', comment: 'A second visitor.' }, { ip: '203.0.113.11' }); assert.equal(second.statusCode, 201);
    const read = await call('GET'); assert.equal(read.statusCode, 200); assert.deepEqual(read.body.comments.map(c=>c.name), ['Bob','Alice']); assert.notEqual(read.body.comments[0].id, read.body.comments[1].id); assert.ok(Date.parse(read.body.comments[0].createdAt));
    const other = await call('GET', undefined, { post:'pregnancy' }); assert.deepEqual(other.body.comments, []);
    assert.equal(read.headers['Cache-Control'], 'no-store');
  });
  await test('unknown post and invalid payloads cannot write', async () => {
    for (const body of [{...good,post:'unknown'}, {...good,name:'X'}, {...good,name:'a'.repeat(61)}, {...good,comment:'x'}, {...good,comment:'x'.repeat(2001)}, {...good,website:'https://spam.example'}, {...good,name:'A\nB'}, [], null]) assert.equal((await call('POST',body)).statusCode,400);
    assert.equal((await call('GET', undefined, {post:'unknown'})).statusCode,400);
    assert.equal((await call('POST', '{bad')).statusCode,400);
    assert.equal((await call('POST', {...good, comment:'x'.repeat(11000)})).statusCode,413);
    assert.equal((await call('POST', good, {headers:{'content-type':'text/plain'}})).statusCode,415);
  });
  await test('cross-origin writes and unsupported methods are rejected', async () => {
    for (const origin of ['https://evil.example','https://mamas-love.vercel.app.evil.example','null','http://mamas-love.vercel.app']) assert.equal((await call('POST',good,{headers:{origin}})).statusCode,403);
    assert.equal((await call('DELETE')).statusCode,405);
    const sameOrigin = await call('POST', good, { ip:'203.0.113.12', headers:{origin:'https://mamas-love.vercel.app'} }); assert.equal(sameOrigin.statusCode,201);
  });
  await test('per-visitor atomic rate limit and anonymised keys', async () => {
    for (let i=0;i<5;i++) assert.equal((await call('POST',good,{ip:'198.51.100.80'})).statusCode,201);
    const blocked = await call('POST',good,{ip:'198.51.100.80'});assert.equal(blocked.statusCode,429);assert.equal(blocked.body.code,'RATE_LIMITED');assert.equal(blocked.headers['Retry-After'],'500');
    assert.ok(!commands.filter(c=>c[0]==='EVAL').some(c=>c[3].includes('198.51.100.80')));
    assert.equal((await call('POST',good,{ip:'198.51.100.81'})).statusCode,201);
  });
  await test('comments remain text and are never interpolated into HTML', async () => {
    const r=await call('POST',{...good,name:'<img src=x>',comment:'<script>alert(1)</script>'},{ip:'203.0.113.13'});assert.equal(r.statusCode,201);assert.equal(r.body.comment.comment,'<script>alert(1)</script>');assert.match(r.headers['Content-Type'],/application\/json/);
  });
  await test('storage failures do not claim comment publication', async () => {
    broken=true;
    for (const method of ['GET','POST']) {const r=await call(method,good);assert.equal(r.statusCode,503);assert.equal(r.body.code,'COMMENTS_UNAVAILABLE');}
    broken=false;
  });
  await test('Vercel KV variable aliases are supported', async () => {
    process.env.KV_REST_API_URL=process.env.UPSTASH_REDIS_REST_URL;process.env.KV_REST_API_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN;delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.equal((await call('GET')).statusCode,200);
  });
  console.log(JSON.stringify({tests:count,errors:0}));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.fetch=originalFetch});
