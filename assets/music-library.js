/* The same downloadable piano playlist on the homepage and sound-library page. */
(() => {
  'use strict';
  const tracks = [
    ['brahms-lullaby', 'Brahms’ Lullaby', 'A gentle piano arrangement of the familiar bedtime melody.', '01', 'rose'],
    ['twinkle-lullaby', 'Twinkle, Twinkle', 'The classic little-star melody, played softly on piano.', '02', 'lilac'],
    ['softly-home-piano', 'Softly Home', 'An original Mama’s Love piano lullaby for a quieter evening.', '03', 'lime']
  ];
  function mount() {
    for (const host of document.querySelectorAll('[data-music-library]')) {
      if (host.dataset.musicReady) continue;
      host.dataset.musicReady = 'true';
      host.innerHTML = `<section class="music-showcase" id="lullabyDownloads" aria-labelledby="musicHeading"><div class="container shell"><div class="music-heading"><div><span class="music-eyebrow">A LITTLE MUSIC, A LITTLE CALM</span><h2 id="musicHeading">Press play.<br><em>Keep a lullaby.</em></h2></div><div><p>Listen here or download an MP3 to play later. Three gentle piano favourites, ready when you are.</p><a class="music-all" href="sounds.html#soundLibrary">Explore all music & sleep sounds <span aria-hidden="true">↗</span></a></div></div><div class="music-picks">${tracks.map(([id,title,description,number,color]) => `<article class="music-pick music-${color}"><div class="music-cover" aria-hidden="true"><span class="music-number">${number}</span><svg viewBox="0 0 200 125" fill="none"><path d="M117 17a44 44 0 1 0 42 59 39 39 0 0 1-42-59Z" fill="currentColor"/><path d="M159 23v18m-9-9h18M45 32v12m-6-6h12M155 92v12m-6-6h12" stroke="currentColor" stroke-width="2"/><circle cx="33" cy="89" r="2" fill="currentColor"/></svg><span class="music-format">PIANO · MP3</span></div><div class="music-pick-body"><h3>${title}</h3><p>${description}</p><audio controls preload="metadata" playsinline aria-label="Play ${title}" src="assets/audio/${id}.mp3"></audio><a class="music-download" href="assets/audio/${id}.mp3" download="mamas-love-${id}.mp3">Download MP3 <span aria-hidden="true">↓</span></a></div></article>`).join('')}</div><p class="music-listening-note">Start quietly and adjust for your room. Keep speakers away from your baby’s ears.</p></div></section>`;
    }
    const players = [...document.querySelectorAll('.music-pick audio')];
    players.forEach(player => {
      player.volume = .45;
      player.addEventListener('play', () => {
        if (typeof window.stopAll === 'function') window.stopAll();
        window.dispatchEvent(new CustomEvent('mamas:other-audio-play', {detail:{player}}));
        players.forEach(other => { if (other !== player) other.pause(); });
      });
    });
    window.addEventListener('mamas:lullaby-play', () => players.forEach(player => player.pause()));
    // Generated sound previews and MP3 players use one shared interruption event.
    window.addEventListener('mamas:other-audio-play', event => {
      if (!event.detail?.player) players.forEach(player => player.pause());
    });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount, {once:true}) : mount();
})();
