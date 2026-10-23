/* Week-by-week pregnancy guide, separate from the date calculators. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
  function render() {
    const weeks = window.MAMAS_GROWTH || [];
    return `<section class="growth-hero container"><div class="growth-hero-copy"><a class="growth-back" href="pregnancy.html">Pregnancy & care</a><span class="growth-kicker">YOUR WEEKLY GROWTH GUIDE</span><h1>Pregnancy,<br><em>week by week.</em></h1><p>What’s developing, what may be changing, and a practical note for each week. Explore at your own pace.</p><a class="growth-hero-link" href="#weeks">Find your week ${arrow}</a><div class="growth-hero-facts"><span>Weeks 1–42</span><span>Three trimesters</span><span>Practical care notes</span></div></div><div class="growth-hero-image"><img src="assets/pregnancy-alt.webp" alt="Expectant mother during pregnancy" width="900" height="1000" fetchpriority="high"><span class="growth-image-note">A guide to typical development.<br>Every pregnancy is different.</span></div></section><section class="growth-section container" id="weeks" aria-labelledby="growthHeading"><div class="growth-section-head"><div><span class="eyebrow">ONE WEEK AT A TIME</span><h2 class="heading" id="growthHeading">Find your week.</h2></div><a class="growth-current-link" id="growthCurrentLink" href="pregnancy.html#tracker">Calculate my week ${arrow}</a></div><p class="growth-dating-note">Pregnancy is dated from the first day of your last period. Weeks 1 and 2 usually come before conception.</p><div class="growth-controls"><div class="growth-filters" aria-label="Filter weeks by trimester">${[['all','All weeks'],['1','1st trimester'],['2','2nd trimester'],['3','3rd trimester']].map(([id,label],i)=>`<button type="button" data-growth-filter="${id}" aria-pressed="${i===0}">${label}</button>`).join('')}</div><label class="growth-jump" for="growthWeekSelect">Jump to week<select id="growthWeekSelect"><option value="">Select week</option>${weeks.map(w=>`<option value="${w.week}">Week ${w.week}</option>`).join('')}</select></label></div><p class="growth-count" id="growthCount" role="status">${weeks.length} weekly cards</p><div class="growth-grid" id="growthGrid">${weeks.map(w=>`<article class="growth-card growth-trimester-${w.trimester}" id="week-${w.week}" data-week="${w.week}" data-trimester="${w.trimester}" aria-labelledby="week-title-${w.week}" tabindex="-1"><div class="growth-card-top"><div class="growth-week-number" aria-hidden="true"><span>WEEK</span><strong>${String(w.week).padStart(2,'0')}</strong></div><div class="growth-card-title"><span class="growth-trimester-label">${{1:'First',2:'Second',3:'Third'}[w.trimester]} trimester</span><h3 id="week-title-${w.week}"><a href="#week-${w.week}" aria-label="Week ${w.week}: ${escape(w.title)}">${escape(w.title)}</a></h3><span class="growth-current-badge" hidden>Your estimated week</span></div></div><p class="growth-development">${escape(w.development)}</p><div class="growth-care"><span class="growth-care-label">FOR YOU</span><p>${escape(w.care)}</p></div></article>`).join('')}</div><aside class="growth-sources"><div><span class="eyebrow">ABOUT THIS GUIDE</span><h2>Information to support your care.</h2><p>These summaries describe typical development, not an assessment of your baby’s growth. Follow your maternity team’s confirmed dates and advice.</p></div><div><h3>Sources & further reading</h3>${(window.MAMAS_GROWTH_SOURCES || []).map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.label)} ${arrow}</a>`).join('')}</div></aside></section>`;
  }
  function init() {
    const grid = document.getElementById('growthGrid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.growth-card')];
    const buttons = [...document.querySelectorAll('[data-growth-filter]')];
    const select = document.getElementById('growthWeekSelect');
    function setFilter(value) {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.growthFilter === value)));
      let count = 0;
      cards.forEach(card => { card.hidden = value !== 'all' && card.dataset.trimester !== value; if (!card.hidden) count++; });
      document.getElementById('growthCount').textContent = `${count} weekly cards${value === 'all' ? '' : ` · ${value === '1' ? 'First' : value === '2' ? 'Second' : 'Third'} trimester`}`;
      if (select.value && document.getElementById('week-'+select.value)?.hidden) select.value = '';
    }
    function goToWeek(week, scroll=true) {
      if (!Number.isInteger(week) || week < 1 || week > 42) return;
      const card = document.getElementById('week-'+week);
      if (!card) return;
      if (card.hidden) setFilter(card.dataset.trimester);
      select.value = String(week);
      if (scroll) requestAnimationFrame(() => { card.focus({preventScroll:true}); card.scrollIntoView({behavior:'instant',block:'center'}); });
    }
    buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.growthFilter)));
    select.addEventListener('change', () => { if (select.value) { const week=Number(select.value); if(location.hash === '#week-'+week) goToWeek(week); else location.hash='week-'+week; } });
    window.addEventListener('hashchange', () => { const match=location.hash.match(/^#week-(\d+)$/); if(match) goToWeek(Number(match[1])); });
    // Reuse the same pregnancy dates as the tracker, without sending them anywhere.
    try {
      const saved=JSON.parse(localStorage.getItem('ml-preg') || 'null');
      const valid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
      let start=valid(saved?.lmp)?new Date(saved.lmp+'T12:00:00'):null;
      if (!start && valid(saved?.due)) { start=new Date(saved.due+'T12:00:00');start.setDate(start.getDate()-280); }
      if (start && Number.isFinite(start.getTime())) {
        const days=Math.round((new Date().getTime()-start.getTime())/86400000);
        if(days>=0 && days<301) {
          const week=Math.max(1,Math.min(42,Math.floor(days/7)));
          const card=document.getElementById('week-'+week);
          card.classList.add('is-current');card.querySelector('.growth-current-badge').hidden=false;
          const link=document.getElementById('growthCurrentLink');link.href='#week-'+week;link.innerHTML=`Go to my week · ${week} ${arrow}`;
        }
      }
    } catch {}
    const match=location.hash.match(/^#week-(\d+)$/);
    if(match) goToWeek(Number(match[1]));
  }
  window.MamasGrowth={render,init};
})();
