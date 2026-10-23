/* Shared weekly banners for baby development and pregnancy, separate from the trackers. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
  const baby = document.body.dataset.page === 'growth';
  const total = baby ? 52 : 42;
  function render() {
    const weeks = (baby ? window.MAMAS_BABY_GROWTH : window.MAMAS_GROWTH) || [];
    const sources = (baby ? window.MAMAS_BABY_GROWTH_SOURCES : window.MAMAS_GROWTH_SOURCES) || [];
    const filters = baby ? [['all','All weeks'],['1','Weeks 1–13'],['2','Weeks 14–26'],['3','Weeks 27–39'],['4','Weeks 40–52']] : [['all','All weeks'],['1','1st trimester'],['2','2nd trimester'],['3','3rd trimester']];
    return `<section class="growth-hero container"><div class="growth-hero-copy"><a class="growth-back" href="${baby ? 'baby.html' : 'pregnancy.html'}">${baby ? 'Baby age & development' : 'Pregnancy & care'}</a><span class="growth-kicker">${baby ? "YOUR BABY’S FIRST YEAR" : "YOUR WEEKLY GROWTH GUIDE"}</span><h1>${baby ? "Baby growth," : "Pregnancy,"}<br><em>week by week.</em></h1><p>${baby ? "From newborn days to the first birthday. Explore weekly development themes and simple activities to try together, without a timetable to keep up with." : "What’s developing, what may be changing, and a practical note for each week. Explore at your own pace."}</p><a class="growth-hero-link" href="#weeks">Find your week ${arrow}</a><div class="growth-hero-facts"><span>Weeks 1–${total}</span><span>${baby ? "First year of life" : "Three trimesters"}</span><span>${baby ? "Play & connection" : "Practical care notes"}</span></div></div><div class="growth-hero-image"><img src="assets/${baby ? 'hero-family.webp' : 'pregnancy-alt.webp'}" alt="${baby ? 'Mother with her child' : 'Expectant mother during pregnancy'}" width="900" height="1000" fetchpriority="high"><span class="growth-image-note">A guide to typical development.<br>${baby ? "Every baby is different." : "Every pregnancy is different."}</span></div></section>${baby ? `<nav class="growth-page-nav container" aria-label="On this page"><a href="#weeks">Weekly cards</a><a href="#day-one">Milestone overview</a><a href="#growth">Physical growth</a><a href="#when-to-call">When to call</a></nav>` : ''}<span id="week-by-week" aria-hidden="true"></span><section class="growth-section container" id="weeks" aria-labelledby="growthHeading"><div class="growth-section-head"><div><span class="eyebrow">ONE WEEK AT A TIME</span><h2 class="heading" id="growthHeading">Find your week.</h2></div><a class="growth-current-link" id="growthCurrentLink" href="${baby ? 'baby.html#tracker' : 'pregnancy.html#tracker'}">${baby ? 'Calculate baby’s age' : 'Calculate my week'} ${arrow}</a></div><p class="growth-dating-note">${baby ? "Each week suggests a theme to notice or explore, not a deadline for a new skill. Look at progress over time and use age-based milestone checklists." : "Pregnancy is dated from the first day of your last period. Weeks 1 and 2 usually come before conception."}</p><div class="growth-controls"><div class="growth-filters" aria-label="${baby ? 'Filter weeks by age range' : 'Filter weeks by trimester'}">${filters.map(([id,label],i)=>`<button type="button" data-growth-filter="${id}" aria-pressed="${i===0}">${label}</button>`).join('')}</div><label class="growth-jump" for="growthWeekSelect">Jump to week<select id="growthWeekSelect"><option value="">Select week</option>${weeks.map(w=>`<option value="${w.week}">Week ${w.week}</option>`).join('')}</select></label></div><p class="growth-count" id="growthCount" role="status">${weeks.length} weekly cards</p><div class="growth-grid" id="growthGrid">${weeks.map(w=>`<article class="growth-card growth-trimester-${w.trimester}" id="week-${w.week}" data-week="${w.week}" data-trimester="${w.trimester}" aria-labelledby="week-title-${w.week}" tabindex="-1"><div class="growth-card-top"><div class="growth-week-number" aria-hidden="true"><span>WEEK</span><strong>${String(w.week).padStart(2,'0')}</strong></div><div class="growth-card-title"><span class="growth-trimester-label">${baby ? escape(w.stage) : ({1:'First',2:'Second',3:'Third'}[w.trimester] + ' trimester')}</span><h3 id="week-title-${w.week}"><a href="#week-${w.week}" aria-label="Week ${w.week}: ${escape(w.title)}">${escape(w.title)}</a></h3><span class="growth-current-badge" hidden>Your estimated week</span></div></div><p class="growth-development">${escape(w.development)}</p><div class="growth-care"><span class="growth-care-label">${baby ? 'TRY TOGETHER' : 'FOR YOU'}</span><p>${escape(w.care)}</p></div>${w.checkpoint ? `<aside class="growth-checkpoint"><strong>${escape(w.checkpoint.title)}</strong><p>${escape(w.checkpoint.text)}</p></aside>` : ''}</article>`).join('')}</div><aside class="growth-sources"><div><span class="eyebrow">ABOUT THIS GUIDE</span><h2>Information to support your care.</h2><p>${baby ? "Babies develop at different rates. These weekly themes do not replace age-based milestone checks or an assessment. Ask a clinician about concerns, especially any loss of a skill." : "These summaries describe typical development, not an assessment of your baby’s growth. Follow your maternity team’s confirmed dates and advice."}</p></div><div><h3>Sources & further reading</h3>${sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.label)} ${arrow}</a>`).join('')}</div></aside></section>${baby ? window.MAMAS_FIRST_YEAR_NOTES || '' : ''}`;
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
      document.getElementById('growthCount').textContent = `${count} weekly cards${value === 'all' ? '' : baby ? ` · Weeks ${(Number(value)-1)*13+1}–${Math.min(Number(value)*13,total)}` : ` · ${value === '1' ? 'First' : value === '2' ? 'Second' : 'Third'} trimester`}`;
      if (select.value && document.getElementById('week-'+select.value)?.hidden) select.value = '';
    }
    function goToWeek(week, scroll=true) {
      if (!Number.isInteger(week) || week < 1 || week > total) return;
      const card = document.getElementById('week-'+week);
      if (!card) return;
      if (card.hidden) setFilter(card.dataset.trimester);
      select.value = String(week);
      if (scroll) requestAnimationFrame(() => { card.focus({preventScroll:true}); card.scrollIntoView({behavior:'instant',block:'center'}); });
    }
    buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.growthFilter)));
    select.addEventListener('change', () => { if (select.value) { const week=Number(select.value); if(location.hash === '#week-'+week) goToWeek(week); else location.hash='week-'+week; } });
    window.addEventListener('hashchange', () => { const match=location.hash.match(/^#week-(\d+)$/); if(match) goToWeek(Number(match[1])); });
    // The saved tracker dates stay in this browser.
    try {
      const valid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
      const saved=JSON.parse(localStorage.getItem(baby?'ml-baby':'ml-preg') || 'null');
      let start=null;
      if(baby && valid(saved?.dob)) start=new Date(saved.dob+'T12:00:00');
      if(!baby) {
        start=valid(saved?.lmp)?new Date(saved.lmp+'T12:00:00'):null;
        if(!start&&valid(saved?.due)){start=new Date(saved.due+'T12:00:00');start.setDate(start.getDate()-280);}
      }
      if(start&&Number.isFinite(start.getTime())){
        const days=Math.round((new Date().getTime()-start.getTime())/86400000);
        if(days>=0&&days<(baby?366:301)){
          const week=Math.max(1,Math.min(total,Math.floor(days/7)+(baby?1:0)));
          const card=document.getElementById('week-'+week);
          card.classList.add('is-current');card.querySelector('.growth-current-badge').hidden=false;
          const link=document.getElementById('growthCurrentLink');link.href='#week-'+week;link.innerHTML=`Go to ${baby?'baby’s':'my'} week · ${week} ${arrow}`;
        }
      }
    } catch {}
    const match=location.hash.match(/^#week-(\d+)$/);
    if(match) goToWeek(Number(match[1]));
  }
  window.MamasGrowth={render,init};
})();
