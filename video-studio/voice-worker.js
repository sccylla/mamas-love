/* Free local speech synthesis. No credentials or remote inference requests. */
'use strict';
let ready;
self.onmessage=async({data})=>{
 try{
  if(typeof data.text!=='string'||!data.text.trim()||data.text.length>220)throw new Error('Use 1–220 characters per scene.');
  if(!ready)ready=(async()=>{
   importScripts('vendor/mespeak/mespeak.js');
   const responses=await Promise.all(['config.json','en.json'].map(name=>fetch('vendor/mespeak/'+name)));
   if(responses.some(r=>!r.ok))throw new Error('The free voice files could not load.');
   const [config,voice]=await Promise.all(responses.map(r=>r.json()));
   meSpeak.loadConfig(config);meSpeak.loadVoice(voice);
  })();
  await ready;
  const bytes=new Uint8Array(meSpeak.speak(data.text,{rawdata:'array',speed:155,pitch:55,amplitude:100}));
  if(bytes.length<44)throw new Error('Speech generation returned no audio.');
  self.postMessage({id:data.id,wav:bytes.buffer},[bytes.buffer]);
 }catch(error){ready=null;self.postMessage({id:data.id,error:error.message||'The free voice could not be generated.'});}
};
