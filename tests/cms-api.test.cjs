'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fixture = require('./helpers/redis.cjs');
let count = 0;
async function test(name, run) { await run(); count++; console.log('PASS ' + name); }
(async () => {
 const storage = await fixture();
 const salt = crypto.randomBytes(24).toString('hex');
 const password = 'cms-test-password';
 process.env.ADMIN_PASSWORD_HASH = `scrypt:${salt}:${crypto.scryptSync(password, salt, 64, {N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}`;
 process.env.UPSTASH_REDIS_REST_URL = storage.url; process.env.UPSTASH_REDIS_REST_TOKEN = 'cms-test-token';
 const app = require('../scripts/dev-server.cjs'); await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${app.address().port}`; let cookie = '';
 async function call(path, input, options = {}) {
  const response = await fetch(base + path, { method: input === undefined ? 'GET' : 'POST', headers: { ...(cookie && options.auth !== false ? {cookie} : {}), ...(input === undefined ? {} : {'Content-Type':'application/json',Origin:base}), ...(options.headers || {}) }, ...(input === undefined ? {} : {body: typeof input === 'string' ? input : JSON.stringify(input)}) });
  const data = (response.headers.get('content-type') || '').includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { status:response.status, data, headers:response.headers };
 }
 const login = () => call('/api/admin', {action:'login',username:'admin',password});
 const validPost = { title:'A story from the nursery', summary:'A practical note for new parents.', category:'Personal stories',author:'Mama’s Love',image:'baby.webp',imageAlt:'A sleeping baby',sections:[{heading:'A quieter evening',paragraphs:['A short story for the blog.']}],sources:[],gallery:[],status:'draft',revision:0 };
 let post, imageURL;
 try {
  await test('anonymous users cannot read drafts, edit posts or upload pictures', async () => {
   assert.equal((await call('/api/admin')).data.authenticated,false);
   assert.equal((await call('/api/posts?admin=1')).status,401);
   assert.equal((await call('/api/posts',validPost)).status,401);
   assert.equal((await call('/api/media',{data:'anything'})).status,401);
  });
  await test('wrong credentials fail; login returns a private expiring session', async () => {
   assert.equal((await call('/api/admin',{action:'login',username:'admin',password:'wrong'})).status,401);
   const result=await login(); assert.equal(result.status,200);
   const set=result.headers.get('set-cookie');assert.match(set,/HttpOnly/);assert.match(set,/SameSite=Strict/);assert.match(set,/Max-Age=43200/);
   cookie=set.split(';')[0];assert.equal((await call('/api/admin')).data.authenticated,true);
   assert.equal((await call('/api/posts?admin=1')).data.posts.length,10);
  });
  await test('source files are not served; cross-origin and malformed writes fail', async () => {
   for(const path of ['/lib/admin-credentials.js','/data/posts.json','/.env','/scripts/dev-server.cjs'])assert.equal((await call(path)).status,404);
   assert.equal((await call('/api/posts',validPost,{headers:{Origin:'https://evil.example'}})).status,403);
   assert.equal((await call('/api/posts',validPost,{headers:{Origin:''}})).status,403);
   assert.equal((await call('/api/posts','{bad')).status,400);
   assert.equal((await call('/api/posts',validPost,{headers:{'Content-Type':'text/plain'}})).status,415);
   assert.equal((await call('/api/posts',{...validPost,title:'x'.repeat(190000)})).status,413);
   assert.equal((await call('/api/posts',{...validPost,sources:[{label:'Bad',url:'javascript:alert(1)'}]})).status,400);
  });
  await test('drafts persist across requests and are excluded from the public collection', async () => {
   const saved=await call('/api/posts',validPost);assert.equal(saved.status,200);post=saved.data.post;assert.equal(post.revision,1);assert.ok(post.id);assert.deepEqual(post.gallery,[]);assert.deepEqual(post.sources,[]);
   assert.equal((await call('/api/posts')).data.posts.some(item=>item.id===post.id),false);
   assert.equal((await call('/api/posts?admin=1')).data.posts.some(item=>item.id===post.id),true);
   assert.equal((await call('/api/comments',{post:post.id,name:'Alice',comment:'Hello there.'})).status,400);
  });
  await test('pictures require real image signatures and are stored for all visitors', async () => {
   assert.equal((await call('/api/media',{data:'data:image/svg+xml;base64,PHN2Zz4='})).status,400);
   assert.equal((await call('/api/media',{data:'data:image/png;base64,'+Buffer.from('not a valid picture at all today').toString('base64')})).status,400);
   const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlWQAAAAASUVORK5CYII=','base64');
   const uploaded=await call('/api/media',{data:'data:image/png;base64,'+png.toString('base64')});assert.equal(uploaded.status,201);imageURL=uploaded.data.url;
   const image=await call(imageURL,undefined,{auth:false});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(image.data,png);
   assert.equal((await call('/api/media?id=not-an-image')).status,404);
  });
  await test('publication is shared, comments work, and concurrent edits cannot overwrite', async () => {
   const result=await call('/api/posts',{...post,status:'published',image:imageURL,gallery:[{url:imageURL,alt:'A picture'}]});assert.equal(result.status,200);post=result.data.post;assert.equal(post.revision,2);
   const publicPosts=(await call('/api/posts',undefined,{auth:false})).data.posts;assert.equal(publicPosts[0].id,post.id);assert.equal(publicPosts[0].image,imageURL);
   assert.equal((await call('/api/comments',{post:post.id,name:'Alice',comment:'Thank you for sharing.'})).status,201);
   assert.equal((await call('/api/comments?post='+post.id)).data.comments.length,1);
   assert.equal((await call('/api/posts',{...post,revision:1,title:'A stale change'})).status,409);
  });
  await test('all existing posts can be edited without changing their links', async () => {
   const original=(await call('/api/posts?admin=1')).data.posts.find(item=>item.id==='cycle');
   const edited=await call('/api/posts',{...original,title:'Understanding your menstrual cycle'});assert.equal(edited.status,200);assert.equal(edited.data.post.id,'cycle');
   assert.equal((await call('/api/posts')).data.posts.find(item=>item.id==='cycle').title,'Understanding your menstrual cycle');
  });
  await test('unpublishing removes the post and closes public comments', async () => {
   const result=await call('/api/posts',{...post,status:'draft'});assert.equal(result.status,200);post=result.data.post;
   assert.equal((await call('/api/posts')).data.posts.some(item=>item.id===post.id),false);
   assert.equal((await call('/api/comments?post='+post.id)).status,400);
  });
  await test('storage failures cannot claim successful login or publication', async () => {
   storage.break(true);assert.equal((await login()).status,503);assert.equal((await call('/api/posts',post)).status,503);storage.break(false);
  });
  await test('logout revokes the stored session; forged and expired sessions fail', async () => {
   const old=cookie;assert.equal((await call('/api/admin',{action:'logout'})).status,200);cookie=old;assert.equal((await call('/api/posts?admin=1')).status,401);
   cookie='mamas_admin='+'a'.repeat(64);assert.equal((await call('/api/posts',validPost)).status,401);
   const result=await login();cookie=result.headers.get('set-cookie').split(';')[0];
   const token=cookie.split('=')[1];const key='mamas:cms:session:'+crypto.createHash('sha256').update(token).digest('hex');storage.expires.set(key,Date.now()-1);
   assert.equal((await call('/api/posts?admin=1')).status,401);cookie='';
  });
  await test('login attempts are rate limited with a retry interval', async () => {
   let result;for(let i=0;i<11;i++)result=await call('/api/admin',{action:'login',username:'admin',password:'wrong'});
   assert.equal(result.status,429);assert.equal(result.headers.get('retry-after'),'900');
  });
  await test('missing storage never creates a browser-only admin session', async () => {
   delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
   const result=await login();assert.equal(result.status,503);assert.equal(result.data.code,'STORAGE_NOT_CONFIGURED');
   assert.equal((await call('/api/posts')).data.posts.length,10);
  });
  console.log(JSON.stringify({tests:count,errors:0}));
 }finally{await Promise.all([new Promise(resolve=>app.close(resolve)),new Promise(resolve=>storage.server.close(resolve))]);}
})().catch(error=>{console.error(error);process.exitCode=1});
