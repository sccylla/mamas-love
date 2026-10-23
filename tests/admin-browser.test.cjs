'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const fixture=require('./helpers/redis.cjs');
(async()=>{
 const storage=await fixture();
 const salt=crypto.randomBytes(24).toString('hex');const password='browser-test-password';
 process.env.ADMIN_PASSWORD_HASH=`scrypt:${salt}:${crypto.scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}`;
 process.env.UPSTASH_REDIS_REST_URL=storage.url;process.env.UPSTASH_REDIS_REST_TOKEN='cms-test-token';
 const app=require('../scripts/dev-server.cjs');await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${app.address().port}`;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext();const p=await context.newPage();const errors=[];p.on('pageerror',error=>errors.push(error.message));
  await p.goto(base+'/admin.html');await p.locator('#loginPanel').waitFor({state:'visible'});
  for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Login overflow '+width)}
  await p.locator('[name=password]').fill(password);await p.locator('#loginForm button').click();await p.locator('#workspace').waitFor({state:'visible'});assert.equal(await p.locator('.post-item').count(),10);
  await p.locator('#postTitle').fill('A gentler evening with your baby');await p.locator('#postSummary').fill('Small moments that helped our family settle into a bedtime routine.');
  await p.locator('#postCategory').fill('Personal stories');await p.locator('#postAuthor').fill('Mama’s Love team');
  await p.locator('#postBody').fill('## Our evening routine\n\nA warm bath, a story, and time together.\n\nWe make room for quiet moments.\n\n## Make it your own\n\nText stays safe: <img src=x onerror="window.cmsInjected=true">');
  await p.locator('#postSources').fill('NHS: Baby care | https://www.nhs.uk/conditions/baby/');
  await p.locator('#coverUpload').setInputFiles(path.join(__dirname,'../assets/pregnancy.webp'));await p.waitForFunction(()=>!document.getElementById('editorFields').disabled);await p.locator('#coverPreview').waitFor();assert.match(await p.locator('#coverPreview').getAttribute('src'),/^\/api\/media\?id=/);
  await p.locator('#coverAlt').fill('A pregnancy portrait');
  await p.locator('#galleryUpload').setInputFiles(path.join(__dirname,'../assets/baby.webp'));await p.waitForFunction(()=>!document.getElementById('editorFields').disabled);await p.locator('.gallery-item input').fill('A quiet moment with baby');
  await p.locator('#previewButton').click();await p.locator('#previewPanel').waitFor({state:'visible'});assert.equal(await p.locator('#previewArticle h2').count(),2);assert.equal(await p.evaluate(()=>Boolean(window.cmsInjected)),false);await p.locator('#closePreview').click();
  await p.locator('#savePost').click();await p.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Draft saved'));
  const draftList=await (await p.request.get(base+'/api/posts?admin=1')).json();let post=draftList.posts.find(post=>post.title==='A gentler evening with your baby');assert.equal(post.status,'draft');assert.equal(post.gallery.length,1);
  const anon=await browser.newContext();const visitor=await anon.newPage();visitor.on('pageerror',error=>errors.push(error.message));
  assert.equal((await (await visitor.request.get(base+'/api/posts')).json()).posts.some(item=>item.id===post.id),false);
  await p.locator('#postStatus').selectOption('published');await p.locator('#savePost').click();await p.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Published.'));
  await visitor.goto(base+'/learn.html#'+post.id);await visitor.locator('#articleHeading').filter({hasText:'A gentler evening with your baby'}).waitFor({state:'visible'});
  assert.equal(await visitor.locator('.post-byline strong').innerText(),'Mama’s Love team');assert.equal(await visitor.locator('.post-photo-gallery img').count(),1);assert.equal(await visitor.locator('.post-photo-gallery figcaption').innerText(),'A quiet moment with baby');assert.equal(await visitor.locator('#articleParagraphs img').count(),1);assert.equal(await visitor.evaluate(()=>Boolean(window.cmsInjected)),false);
  await visitor.locator('#commentName').fill('A reader');await visitor.locator('#commentBody').fill('Thank you for sharing your story.');await visitor.locator('#commentForm button[type=submit]').click();await visitor.locator('.comment-item').waitFor();
  await visitor.goto(base+'/learn.html');await visitor.locator('[data-guide-category="Personal stories"]').click();assert.equal(await visitor.locator('#guideGrid .guide-card').count(),1);
  await visitor.goto(base+'/');await visitor.locator('#homeGuides [data-article="'+post.id+'"]').waitFor();
  await p.locator('#postSearch').fill('count your menstrual');await p.locator('.post-item').click();await p.locator('#postTitle').fill('A clear guide to your menstrual cycle');await p.locator('#savePost').click();await p.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Published.'));
  assert.ok((await p.locator('#postBody').inputValue()).includes('first day'));await visitor.goto(base+'/learn.html#cycle');await visitor.locator('#articleHeading').filter({hasText:'A clear guide to your menstrual cycle'}).waitFor({state:'visible'});
  for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Editor overflow '+width)}
  await p.locator('#postSearch').fill('');await p.evaluate(()=>{scrollTo(0,0);document.getElementById('postBody').scrollTop=0});await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'/tmp/mamas-admin-desktop.png',fullPage:true});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'/tmp/mamas-admin-mobile.png',fullPage:true});
  await p.reload();await p.locator('#workspace').waitFor({state:'visible'});assert.equal(await p.locator('.post-item').count(),11);
  await p.locator('#logout').click();await p.locator('#loginPanel').waitFor({state:'visible'});assert.equal((await p.request.get(base+'/api/posts?admin=1')).status(),401);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({login:'passed',uploads:'cover and gallery',draftPrivacy:'passed',publishing:'independent visitor sees post and photos',comments:'passed',editingExistingPosts:'passed',publicFiltersAndHomepage:'passed',responsiveLayouts:8,sessionReloadAndLogout:'passed',javascriptErrors:errors}));
 }finally{if(browser)await browser.close();await Promise.all([new Promise(resolve=>app.close(resolve)),new Promise(resolve=>storage.server.close(resolve))]);}
})().catch(error=>{console.error(error);process.exitCode=1});
