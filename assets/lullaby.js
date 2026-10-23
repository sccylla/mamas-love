/* Try native autoplay; otherwise start on the first trusted interaction. */
(() => {
  'use strict';
  if(document.getElementById('siteLullaby')) return;
  const read=(store,key)=>{try{return store.getItem(key)}catch{return null}};
  const write=(store,key,value)=>{try{store.setItem(key,String(value))}catch{}};
  const tracks=[
    {id:'moonlight-hush',title:'Moonlight Hush'},
    {id:'little-cloud',title:'Little Cloud'},
    {id:'twilight-cradle',title:'Twilight Cradle'},
    {id:'starry-dreams',title:'Starry Dreams'},
    {id:'softly-home',title:'Softly Home'}
  ];
  const trackKey='ml-lullaby-last-track';
  const previous=read(localStorage,trackKey)||read(sessionStorage,trackKey);
  const choices=tracks.filter(track=>track.id!==previous);
  const track=choices[Math.floor(Math.random()*choices.length)];
  write(localStorage,trackKey,track.id);write(sessionStorage,trackKey,track.id);
  // A fresh page load starts a new tune; pausing lasts for this page visit.
  let enabled=true;
  let interrupted=false,unavailable=false,armed=false,resumeWhenVisible=false;
  const audio=document.createElement('audio');
  audio.id='siteLullaby';audio.src=`assets/audio/${track.id}.mp3`;audio.dataset.track=track.id;audio.loop=true;audio.preload='auto';audio.volume=.65;audio.autoplay=true;audio.setAttribute('playsinline','');audio.hidden=true;
  const button=document.createElement('button');
  button.type='button';button.id='lullabyToggle';button.className='lullaby-control';button.setAttribute('aria-controls',audio.id);button.setAttribute('aria-pressed','false');
  const paths={play:'<path d="m9 5 10 7-10 7V5Z"/>',pause:'<path d="M9 5v14M15 5v14"/>'};
  function update(){
    const playing=!audio.paused&&!audio.ended;
    const label=playing?'Pause lullaby':unavailable?'Retry lullaby':'Play lullaby';
    button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',label);button.title=playing?`Pause ${track.title}`:unavailable?'Retry loading the lullaby':`Play ${track.title}`;
    button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[playing?'pause':'play']}</svg><span>${label}</span>`;
  }
  function disarm(){if(!armed)return;document.removeEventListener('pointerup',unlock,true);document.removeEventListener('keydown',unlock,true);armed=false}
  function arm(){if(armed||!enabled||interrupted||unavailable)return;armed=true;document.addEventListener('pointerup',unlock,true);document.addEventListener('keydown',unlock,true)}
  async function start(explicit=false){
    if(document.hidden){resumeWhenVisible=enabled;return;}
    if(explicit){enabled=true;interrupted=false;if(unavailable){unavailable=false;audio.load()}}
    if(!enabled||interrupted)return;
    if(explicit)window.dispatchEvent(new Event('mamas:lullaby-play'));
    try{await audio.play();disarm();}catch(error){if(error.name==='NotAllowedError')arm();else if(error.name!=='AbortError'){unavailable=true;disarm();}}finally{update()}
  }
  function unlock(event){
    if(!event.isTrusted||event.target.closest('#lullabyToggle,.track-actions,.now'))return;
    if(event.type==='keydown'&&['Tab','Shift','Control','Alt','Meta','Escape'].includes(event.key))return;
    start();
  }
  button.addEventListener('click',()=>{
    if(!audio.paused){enabled=false;disarm();audio.pause();update();}
    else start(true);
  });
  audio.addEventListener('playing',()=>{unavailable=false;disarm();update()});
  audio.addEventListener('pause',update);
  audio.addEventListener('play',()=>{window.dispatchEvent(new Event('mamas:lullaby-play'));update()});
  audio.addEventListener('error',()=>{unavailable=true;disarm();update()});
  window.addEventListener('mamas:other-audio-play',()=>{interrupted=true;disarm();audio.pause();update()});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){resumeWhenVisible=!audio.paused;audio.pause();}
    else if(resumeWhenVisible&&enabled&&!interrupted){resumeWhenVisible=false;start();}
  });
  window.addEventListener('pagehide',()=>{audio.pause()});
  window.addEventListener('pageshow',event=>{if(event.persisted&&enabled&&!interrupted)start()});
  document.body.append(audio);const header=document.querySelector('.site-header .nav,.site-head .head,.site-head .head-inner');if(header){button.classList.add('lullaby-header');header.insertBefore(button,header.querySelector('.nav-cta,.menu-btn,.home'));document.body.classList.add('has-lullaby-control');}else document.body.append(button);update();
  if(enabled)start();
})();
