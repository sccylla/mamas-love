/* One navigation tree for the main pages and the standalone tools. */
(() => {
  'use strict';
  const groups = [
    { label: 'Pregnancy', links: [['pregnancy.html', 'Pregnancy tracker'], ['growth.html', 'Growth in the womb'], ['postpartum.html', 'After birth']] },
    { label: 'Baby & names', links: [['baby.html', 'Baby age & milestones'], ['baby-growth.html', 'The first year'], ['names.html', 'Baby Name Ideas'], ['sounds.html#lullabyDownloads', 'Music & MP3 downloads']] },
    { label: 'Women’s health', links: [['wellbeing.html', 'Health information'], ['period.html', 'Period tracker'], ['scanner.html', 'Test reader']] }
  ];
  const current = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const active = href => href.split('#')[0].replace('.html', '') === current || (current === 'video' && href === 'videos.html') || (current === 'health' && href === 'wellbeing.html') || (current === 'pregnancy-growth' && href === 'growth.html');
  const link = ([href, label]) => `<a href="${href}"${active(href) ? ' aria-current="page"' : ''}>${label}</a>`;
  function header() {
    return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header site-navigation"><div class="nav container"><a class="brand brand-lockup" href="index.html" aria-label="Mama’s Love home"><img class="brand-logo" src="assets/brand/mamas-love-logo-on-dark.svg" width="334" height="86" alt="Mama’s Love"></a><nav class="nav-links" aria-label="Main navigation">${groups.map(group => `<details class="nav-group"${group.links.some(([href]) => active(href)) ? ' data-current="true"' : ''}><summary>${group.label}<span aria-hidden="true">⌄</span></summary><div class="nav-dropdown">${group.links.map(link).join('')}</div></details>`).join('')}${link(['/video-studio/', 'Video studio'])}${link(['videos.html', 'Videos'])}${link(['learn.html', 'Blog'])}${link(['community.html', 'Support'])}</nav><div class="nav-cta"><a class="nav-tool-link" href="index.html#tools">Open trackers <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a></div><button id="menuToggle" class="menu-btn" type="button" aria-label="Open menu" aria-controls="mobilePanel" aria-expanded="false"><span class="menu-icon"></span></button></div><nav class="mobile-panel" id="mobilePanel" aria-label="Mobile navigation"><a class="mobile-home" href="index.html">Home</a>${groups.map(group => `<div class="mobile-nav-group"><span>${group.label}</span>${group.links.map(link).join('')}</div>`).join('')}<div class="mobile-nav-group"><span>Read & connect</span>${link(['/video-studio/', 'Video studio'])}${link(['videos.html', 'Videos'])}${link(['learn.html', 'Blog'])}${link(['community.html', 'Support'])}</div></nav><nav class="site-shortcuts" aria-label="Popular sections"><div class="shortcut-inner container shell"><a href="sounds.html#lullabyDownloads"><span aria-hidden="true">♫</span> Music & downloads</a><a href="videos.html">Videos & steps</a><a href="names.html">Baby Name Ideas</a><a href="growth.html">Pregnancy week by week</a><a href="index.html#tools">Trackers</a><a href="learn.html">Blog</a></div></nav></header>`;
  }
  window.MamasNavigation = { header };
  if (!document.body.dataset.page && !document.getElementById('workspace')) {
    document.querySelector('.site-head')?.remove();
    const main = document.querySelector('main');
    if (main) { main.id = 'main'; main.tabIndex = -1; main.insertAdjacentHTML('beforebegin', header()); }
    const toggle = document.getElementById('menuToggle'), panel = document.getElementById('mobilePanel');
    const close = () => { panel.classList.remove('active'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); };
    toggle?.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; panel.classList.toggle('active', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
    panel?.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.addEventListener('pointerdown', event => { if (!event.target.closest('.site-navigation')) close(); });
    matchMedia('(min-width:1101px)').addEventListener('change', event => { if (event.matches) close(); });
  }
  document.addEventListener('click', event => { for (const group of document.querySelectorAll('.nav-group[open]')) if (!group.contains(event.target)) group.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') for (const group of document.querySelectorAll('.nav-group[open]')) { group.open = false; group.querySelector('summary').focus(); } });
})();
