'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
(async()=>{
 const root=path.resolve(__dirname,'../video-studio');
 const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.png':'image/png','.wav':'audio/wav','.woff2':'font/woff2'};
 const server=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(route==='/'?'/index.html':route));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],apis=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>{apis.push(r.request().url());return r.abort();});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>document.querySelector('#scene-title').value.length>0);
  assert.equal(await page.locator('#paid-storyboard').getAttribute('open'),null);
  await page.locator('#topic').fill('My free video\nWelcome | Hello mama. Welcome.');await page.locator('#create-checklist').click();
  await page.waitForFunction(()=>document.querySelector('#scene-title').value==='Welcome');
  await page.locator('#scene-duration').fill('2');
  assert.equal(await page.locator('#narration-voice').inputValue(),'local-en');
  await page.locator('#generate-narration').click();
  await page.locator('#narration-status').filter({hasText:'Voiceover ready'}).waitFor({timeout:65000});
  assert.match(await page.locator('#audio-info').textContent(),/Free computer narration/);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#scene-title').value==='Welcome');
  assert.match(await page.locator('#audio-info').textContent(),/Free computer narration/);
  await page.locator('#export-top').click();const download=page.waitForEvent('download');await page.locator('#export-start').click();const file=await download;await file.saveAs('/tmp/free-studio-export.webm');
  const metadata=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-of','json','/tmp/free-studio-export.webm'],{encoding:'utf8'}));
  if(file.suggestedFilename().endsWith('.mp4')){assert.ok(metadata.streams.some(s=>s.codec_name==='h264'));assert.ok(metadata.streams.some(s=>s.codec_name==='aac'));}
  assert.ok(metadata.streams.some(s=>s.codec_type==='video'));assert.ok(metadata.streams.some(s=>s.codec_type==='audio'));
  const pcm=execFileSync('ffmpeg',['-v','error','-i','/tmp/free-studio-export.webm','-vn','-f','f32le','-ac','1','-ar','16000','pipe:1']);let peak=0;for(let i=0;i+4<=pcm.length;i+=4)peak=Math.max(peak,Math.abs(pcm.readFloatLE(i)));assert.ok(peak>.05,'Generated narration is audible');
  await page.locator('#export-close').click();
  await page.locator('#load-free-demo').click();await page.waitForFunction(()=>document.querySelector('#project-title').value==='Baby essentials from six months');
  assert.match(await page.locator('#audio-info').textContent(),/example voiceover/);
  assert.equal(await page.locator('#remove-image').isVisible(),true);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#project-title').value==='Baby essentials from six months');
  assert.equal(await page.locator('#remove-image').isVisible(),true);
  assert.deepEqual(apis,[],'Free workflow makes no API requests');assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/free-studio-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/free-studio-mobile.png',fullPage:true});
  console.log('PASS: standalone static hosting; no API requests; list-to-scenes; real free speech synthesis; audio persistence; exported audio/video; realistic photo example; mobile layout.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
