'use strict';
const assert=require('node:assert/strict');const cms=require('../lib/cms');const video=require('../lib/studio-video');
(async()=>{
 const original={fetch:global.fetch,redis:cms.redis},store=new Map();let payload;
 try{
 cms.redis=async([op,key,value])=>op==='GET'?store.get(key):store.set(key,value);
 global.fetch=async(url,init)=>{payload=init.body?JSON.parse(init.body):null;return {ok:true,json:async()=>({name:'models/veo-3.1-generate-preview/operations/test_job'})};};
 const job=await video.start({prompt:'A realistic mother smiles and walks through a sunlit room',format:'portrait'},'owner');
 assert.equal(job.status,'pending');assert.equal(payload.parameters.durationSeconds,8);assert.equal(payload.parameters.aspectRatio,'9:16');
 await assert.rejects(()=>video.job(job.jobId,'other'),e=>e.status===404);
 await assert.rejects(()=>video.start({prompt:'test',format:'square'},'owner'),e=>e.status===400);
 global.fetch=async()=>({ok:true,json:async()=>({done:false})});assert.equal((await video.poll(job.jobId,'owner')).status,'pending');
 global.fetch=async()=>({ok:true,json:async()=>({done:true,response:{generateVideoResponse:{generatedSamples:[{video:{uri:'https://evil.example/video.mp4'}}]}}})});
 await assert.rejects(()=>video.poll(job.jobId,'owner'),e=>e.status===502);
 global.fetch=async()=>({ok:true,json:async()=>({done:true,response:{generateVideoResponse:{generatedSamples:[{video:{uri:'https://generativelanguage.googleapis.com/v1beta/files/clip:download?alt=media'}}]}}})});
 const result=await video.poll(job.jobId,'owner');assert.equal(result.status,'ready');assert.equal(result.url,`/api/studio-video?id=${job.jobId}`);
 assert.equal((await video.job(job.jobId,'owner')).status,'ready');
 console.log('Veo job creation, aspect ratio, ownership, pending state, download host validation and completed job persistence passed (mock provider).');
 }finally{global.fetch=original.fetch;cms.redis=original.redis;}
})().catch(e=>{console.error(e);process.exitCode=1;});
