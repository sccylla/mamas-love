'use strict';
const crypto=require('node:crypto');
const cms=require('./cms');
const base='https://generativelanguage.googleapis.com/v1beta/';
const jobKey=id=>`mamas:studio:video:${id}`;
async function provider(path,init={}){
 const r=await fetch(base+path,{...init,headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY,...init.headers},signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw cms.fail(r.status===429?429:502,r.status===429?'Veo quota exhausted or provider busy. Try later.':'Veo rejected the request. Check billing, model access, and the scene prompt.');
 return r.json();
}
async function job(id,username){
 if(!/^[a-f0-9]{32}$/.test(id||''))throw cms.fail(400,'Invalid video job.');
 let value=await cms.redis(['GET',jobKey(id)]);try{value=JSON.parse(value);}catch{value=null;}
 if(!value||value.owner!==username)throw cms.fail(404,'This video job has expired or is unavailable. Generate it again.');return value;
}
async function save(id,value){await cms.redis(['SET',jobKey(id),JSON.stringify(value),'EX',172800]);}
async function start(input,username){
 if(!['portrait','landscape'].includes(input.format))throw cms.fail(400,'Veo scenes support portrait or landscape. Choose 9:16 or 16:9.');
 const model=process.env.GEMINI_VIDEO_MODEL||'veo-3.1-generate-preview';
 if(!/^[a-zA-Z0-9._-]+$/.test(model))throw cms.fail(503,'Invalid server video model.');
 const instance={prompt:`Create a photorealistic cinematic scene with natural human movement and believable anatomy. No text or watermarks. ${input.prompt}`};
 if(input.image){const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.image);if(!match||match[2].length>2800000)throw cms.fail(400,'The reference image must be PNG, JPG or WebP under 2 MB.');instance.image={mimeType:match[1],bytesBase64Encoded:match[2]};}
 const result=await provider(`models/${model}:predictLongRunning`,{method:'POST',body:JSON.stringify({instances:[instance],parameters:{aspectRatio:input.format==='portrait'?'9:16':'16:9',durationSeconds:8}})});
 if(!/^models\/[a-zA-Z0-9._-]+\/operations\/[a-zA-Z0-9_-]+$/.test(result.name||''))throw cms.fail(502,'Veo did not return a valid generation job.');
 const id=crypto.randomBytes(16).toString('hex');await save(id,{owner:username,operation:result.name,status:'pending'});return {jobId:id,status:'pending'};
}
async function poll(id,username){
 const value=await job(id,username);if(value.status==='ready')return {jobId:id,status:'ready',url:`/api/studio-video?id=${id}`};
 if(value.status==='failed')throw cms.fail(502,'Veo could not generate this scene. Revise the prompt and generate again.');
 const result=await provider(value.operation);
 if(!result.done)return {jobId:id,status:'pending'};
 const uri=result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
 if(result.error||!uri){value.status='failed';await save(id,value);throw cms.fail(502,'Veo returned no video. The prompt may have been filtered; revise it and retry.');}
 let url;try{url=new URL(uri);}catch{throw cms.fail(502,'Veo returned an invalid download URL.');}
 if(url.origin!=='https://generativelanguage.googleapis.com'||!url.pathname.startsWith('/v1beta/files/')||url.username||url.password)throw cms.fail(502,'Veo returned an unsupported video location.');
 value.status='ready';value.uri=uri;await save(id,value);return {jobId:id,status:'ready',url:`/api/studio-video?id=${id}`};
}
module.exports={start,poll,job};
