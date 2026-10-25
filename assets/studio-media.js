/* Shared by the studio and its media tests. PCM narration is mono, 24 kHz, 16-bit. */
(function(root){
  'use strict';
  function captionCues(text,duration,mode='phrases'){
    if(mode==='off'||!String(text||'').trim())return [];
    const words=String(text).trim().split(/\s+/),groups=[];
    const size=mode==='scene'?words.length:8;
    for(let i=0;i<words.length;i+=size)groups.push(words.slice(i,i+size).join(' '));
    return groups.map((text,i)=>({text,start:duration*i/groups.length,end:duration*(i+1)/groups.length}));
  }
  function srt(scenes){
    let offset=0,index=1;const lines=[];
    const stamp=n=>{const ms=Math.round(n*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
    for(const scene of scenes){for(const cue of captionCues(scene.body,scene.duration,scene.captionMode))lines.push(`${index++}\n${stamp(offset+cue.start)} --> ${stamp(offset+cue.end)}\n${cue.text}\n`);offset+=Number(scene.duration);}
    return lines.join('\n');
  }
  function narrationSignature(scenes,voice){return JSON.stringify([voice,scenes.map(s=>[s.id,s.narration===undefined?s.body:s.narration,Number(s.duration)])]);}
  function combineNarration(clips,durations){
    if(clips.length!==durations.length)throw new Error('Every scene needs narration timing.');
    const samples=Math.round(durations.reduce((n,d)=>n+d,0)*24000),wav=new Uint8Array(44+samples*2),v=new DataView(wav.buffer);
    const text=(at,s)=>{for(let i=0;i<s.length;i++)wav[at+i]=s.charCodeAt(i);};
    text(0,'RIFF');v.setUint32(4,36+samples*2,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples*2,true);
    let offset=0;
    clips.forEach((pcm,i)=>{if(pcm.byteLength%2||pcm.byteLength>Math.round(durations[i]*24000)*2)throw new Error('Narration is longer than its scene.');wav.set(pcm,44+Math.round(offset*24000)*2);offset+=durations[i];});return wav;
  }
  const api={captionCues,srt,narrationSignature,combineNarration};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioMedia=api;
})(typeof window==='object'?window:globalThis);
