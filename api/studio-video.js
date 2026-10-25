'use strict';
const {Readable}=require('node:stream');
const cms=require('../lib/cms');
const video=require('../lib/studio-video');
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')throw cms.fail(405,'Method not allowed.');
  const session=await cms.session(req),id=new URL(req.url,'http://localhost').searchParams.get('id'),record=await video.job(id,session.username);
  if(record.status!=='ready'||!record.uri)throw cms.fail(409,'The scene is still generating.');
  if(!process.env.GEMINI_API_KEY)throw cms.fail(503,'Configure the server Gemini key.');
  const upstream=await fetch(record.uri,{headers:{'x-goog-api-key':process.env.GEMINI_API_KEY},redirect:'error',signal:AbortSignal.timeout(110000)});
  if(!upstream.ok||!upstream.body||!/^video\//.test(upstream.headers.get('content-type')||''))throw cms.fail(502,'The generated clip could not be downloaded. It may have expired; generate it again.');
  res.statusCode=200;res.setHeader('Content-Type','video/mp4');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const stream=Readable.fromWeb(upstream.body);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){if(!res.headersSent)cms.errorReply(res,error);else res.destroy();}
};
