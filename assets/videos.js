/* One video collection for the homepage, library and existing preview link. */
(() => {
  'use strict';
  const videos=window.MAMAS_VIDEOS||[];
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const url=path=>esc(path)+'?v=videos-2';
  function lesson(video,featured){
    const title=featured?'h3':'h2',prefix=featured?'featured-':'';
    return `<article class="video-lesson${featured?' video-lesson-featured':''}" id="${prefix+esc(video.id)}" aria-labelledby="${prefix+esc(video.id)}-title"><div class="lesson-player"><video controls playsinline preload="metadata" poster="${url(video.poster)}" aria-label="${esc(video.title)}" aria-describedby="${prefix+esc(video.id)}-status"><source src="${url(video.video)}" type="video/mp4">Download the video below to watch it.</video><p class="lesson-status" id="${prefix+esc(video.id)}-status" role="status">Press play to watch.</p></div><div class="lesson-content"><span class="lesson-kicker">${esc(video.category)} · ${esc(video.duration)}</span><${title} class="lesson-title" id="${prefix+esc(video.id)}-title">${esc(video.title)}.</${title}><p class="lesson-description">${esc(video.description)}</p><section class="lesson-written" aria-labelledby="${prefix+esc(video.id)}-steps"><h${featured?'4':'3'} id="${prefix+esc(video.id)}-steps">The steps to remember</h${featured?'4':'3'}><ol class="lesson-steps">${video.steps.map((step,index)=>`<li><span class="lesson-step-number" aria-hidden="true">0${index+1}</span><div><strong>${esc(step.title)}</strong><p>${esc(step.text)}</p></div></li>`).join('')}</ol></section><div class="lesson-actions"><a class="lesson-download" href="${url(video.video)}" download="${esc(video.download)}">Download video · MP4</a>${featured?`<a class="lesson-secondary" href="videos.html#${esc(video.id)}">Video & written steps</a>`:`<a class="lesson-secondary" href="${url(video.pack)}" download="mamas-love-safer-sleep-pack.zip">Video + caption · ZIP</a>`}</div>${featured?'':`<details class="lesson-sharing"><summary>Save or share this video</summary><ol><li>Press Play to watch the lesson.</li><li>Choose Download video to save the MP4 to your device.</li><li>Use the written reminders here, or share the video with someone who cares for your baby.</li></ol><a href="${url(video.caption)}" download="mamas-love-caption.txt">Download a caption for your post</a></details>`}</div></article>`;
  }
  function mount(){
    for(const host of document.querySelectorAll('[data-video-library]'))host.innerHTML=videos.map(video=>lesson(video,false)).join('');
    for(const host of document.querySelectorAll('[data-video-feature]'))host.innerHTML=`<section class="video-feature-section" id="videos" aria-labelledby="videoFeatureHeading"><div class="container"><div class="video-feature-heading"><div><span class="lesson-kicker">MAMA’S LOVE VIDEOS</span><h2 id="videoFeatureHeading">Watch a little.<br>Learn something useful.</h2></div><div><p>Short lessons, clear steps and something useful to take into your day.</p><a href="videos.html">Open the video library <span aria-hidden="true">→</span></a></div></div>${videos.slice(0,1).map(video=>lesson(video,true)).join('')}</div></section>`;
    const players=[...document.querySelectorAll('.lesson-player video')];
    for(const player of players){
      player.addEventListener('play',()=>{window.dispatchEvent(new CustomEvent('mamas:other-audio-play',{detail:{video:player}}));});
      const fail=()=>{player.closest('.lesson-player').querySelector('.lesson-status').textContent='Preview unavailable. Use Download video to save and watch the MP4.'};
      player.addEventListener('error',fail);player.querySelector('source')?.addEventListener('error',fail);
    }
    window.addEventListener('mamas:other-audio-play',event=>players.forEach(player=>{if(event.detail?.video!==player)player.pause()}));
    window.addEventListener('mamas:lullaby-play',()=>players.forEach(player=>player.pause()));
    if(location.hash){let hash=location.hash.slice(1);try{hash=decodeURIComponent(hash)}catch{}const target=document.getElementById(hash);if(target)requestAnimationFrame(()=>target.scrollIntoView());}
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount,{once:true}):mount();
})();
