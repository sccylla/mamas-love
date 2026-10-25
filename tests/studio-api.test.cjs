'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/studio');
const cms=require('../lib/cms');
async function call(method,body){let value;const res={setHeader(){},end(s){value=JSON.parse(s);}};await handler({method,body,headers:{origin:'http://localhost',host:'localhost','content-type':'application/json'}},res);return {status:res.statusCode,value};}
(async()=>{
 const saved={key:process.env.GEMINI_API_KEY,fetch:global.fetch,session:cms.session,redis:cms.redis};
 try{
 delete process.env.GEMINI_API_KEY;
 assert.equal((await call('GET')).value.configured,false);
 assert.equal((await call('POST',{action:'image',prompt:'A mother'})).status,503);
 process.env.GEMINI_API_KEY='test-only';
 assert.equal((await call('POST',{action:'image',prompt:''})).status,400);
 assert.equal((await call('POST',{action:'image',prompt:'A mother'})).status,401);
 cms.session=async()=>({username:'test'});cms.redis=async()=>1;
 let payload;
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({scenes:Array.from({length:3},()=>({title:'A quiet morning',body:'A little care',imagePrompt:'Sunlit room, documentary portrait'}))})}]}}]})};};
 const story=await call('POST',{action:'storyboard',prompt:'A morning with mama'});
 assert.equal(story.status,200);assert.equal(story.value.scenes.length,3);assert.ok(payload.generationConfig.responseSchema);
 global.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'dGVzdA=='}}]}}]})});
 assert.match((await call('POST',{action:'image',prompt:'Sunlit nursery'})).value.image,/^data:image\/png;base64,/);
 global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/L16;codec=pcm;rate=24000',data:Buffer.alloc(48000).toString('base64')}}]}}]})};};
 const narration=await call('POST',{action:'narration',prompt:'You are doing beautifully.',voice:'Kore'});
 assert.equal(narration.status,200);assert.equal(narration.value.duration,1);
 const wav=Buffer.from(narration.value.audio.split(',')[1],'base64');assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),24000);assert.equal(wav.length,48044);
 assert.equal(payload.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Kore');
 assert.equal((await call('POST',{action:'narration',prompt:'Hi',voice:'invalid'})).status,400);
 global.fetch=async()=>({ok:true,json:async()=>({candidates:[]})});
 assert.equal((await call('POST',{action:'narration',prompt:'Hello'})).status,502);
 assert.equal((await call('POST',{action:'image',prompt:'Sunlit nursery'})).status,502);
 global.fetch=async()=>({ok:false,status:429});
 assert.equal((await call('POST',{action:'image',prompt:'Sunlit nursery'})).status,429);
 cms.redis=async()=>31;
 assert.equal((await call('POST',{action:'image',prompt:'Sunlit nursery'})).status,429);
 console.log('Studio API checks passed, including narration WAV encoding, voice validation and missing audio (mock provider; no live AI calls).');
 }finally{if(saved.key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=saved.key;global.fetch=saved.fetch;cms.session=saved.session;cms.redis=saved.redis;}
})().catch(e=>{console.error(e);process.exitCode=1;});
