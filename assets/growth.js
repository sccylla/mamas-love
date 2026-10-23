/* Shared weekly banners for baby development and pregnancy, separate from the trackers. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
  const baby = document.body.dataset.page === 'baby-growth';
  const total = baby ? 52 : 42;
  function wombVisual(week, hero=false) {
    let index=0, early=false, label='';
    if(week<=2){early=true;index=0;label='Before conception';}
    else if(week===3){early=true;index=1;label='Fertilisation & dividing cells';}
    else {
      const anchors=[4,8,12,16,20,28,36,40];
      index=anchors.reduce((best,value,i)=>Math.abs(value-week)<Math.abs(anchors[best]-week)?i:best,0);
      label=index===0?'Implantation & early structures':index===1?'Early embryo':index<=3?'Developing fetus':index<=5?'Growing in the womb':'Preparing for birth';
    }
    const x=early?index*100:(index%4)*100/3;
    const y=early?0:Math.floor(index/4)*100;
    return `<figure class="womb-banner${hero?' womb-banner-hero':''}"><div class="womb-stage${early?' womb-stage-early':''}" style="--womb-x:${x}%;--womb-y:${y}%;--womb-ratio:${early?1:index<4?443.5/407:443.5/480};--womb-height:${early?100:index<4?887/407*100:887/480*100}%" role="img" aria-label="Illustrative womb stage: ${escape(label)}. Schematic, not to scale."></div><figcaption><span class="womb-week-label">${hero?'IN THE WOMB':'PREGNANCY · WEEK '+String(week).padStart(2,'0')}</span><strong>${escape(label)}</strong><small>Stage illustration · not to scale</small></figcaption></figure>`;
  }
  function render() {
    const weeks = (baby ? window.MAMAS_BABY_GROWTH : window.MAMAS_GROWTH) || [];
    const sources = (baby ? window.MAMAS_BABY_GROWTH_SOURCES : window.MAMAS_GROWTH_SOURCES) || [];
    const filters = baby ? [['all','All weeks'],['1','Weeks 1–13'],['2','Weeks 14–26'],['3','Weeks 27–39'],['4','Weeks 40–52']] : [['all','All weeks'],['1','1st trimester'],['2','2nd trimester'],['3','3rd trimester']];
    return `<nav class="growth-phase-nav container" aria-label="Development stages"><a href="growth.html"${!baby?' aria-current="page"':''}><span>01</span> Pregnancy · week 1 to birth</a><a href="baby-growth.html"${baby?' aria-current="page"':''}><span>02</span> After birth · the first year</a></nav><section class="growth-hero container${baby?'':' growth-hero-prenatal'}"><div class="growth-hero-copy"><a class="growth-back" href="${baby ? 'baby.html' : 'pregnancy.html'}">${baby ? 'Baby age & development' : 'Pregnancy & care'}</a><span class="growth-kicker">${baby ? "YOUR BABY’S FIRST YEAR" : "FROM WEEK 1 TO BIRTH"}</span><h1>${baby ? "Baby growth," : "Inside the womb,"}<br><em>week by week.</em></h1><p>${baby ? "From newborn days to the first birthday. Explore weekly development themes and simple activities to try together, without a timetable to keep up with." : "See how pregnancy develops, from the weeks before conception to an embryo, a growing baby, and birth. Each week pairs an illustrated stage with practical information."}</p><a class="growth-hero-link" href="#weeks">Find your week ${arrow}</a>${!baby?`<a class="growth-birth-link" href="#birth">Birth & first hours</a>`:''}<div class="growth-hero-facts"><span>Weeks 1–${total}</span><span>${baby ? "First year of life" : "Three trimesters"}</span><span>${baby ? "Play & connection" : "Practical care notes"}</span></div></div>${baby ? `<div class="growth-hero-image"><img src="assets/hero-family.webp" alt="Mother with her child" width="900" height="1000" fetchpriority="high"><span class="growth-image-note">A guide to typical development.<br>Every baby is different.</span></div>` : `<div class="pregnancy-hero-illustration">${wombVisual(36,true)}<span class="pregnancy-hero-caption">Illustrated development inside the womb</span></div>`}</section>${baby ? `<nav class="growth-page-nav container" aria-label="On this page"><a href="#weeks">Weekly cards</a><a href="#day-one">Milestone overview</a><a href="#growth">Physical growth</a><a href="#when-to-call">When to call</a></nav>` : ''}<span id="week-by-week" aria-hidden="true"></span><section class="growth-section container" id="weeks" aria-labelledby="growthHeading"><div class="growth-section-head"><div><span class="eyebrow">ONE WEEK AT A TIME</span><h2 class="heading" id="growthHeading">Find your week.</h2></div><a class="growth-current-link" id="growthCurrentLink" href="${baby ? 'baby.html#tracker' : 'pregnancy.html#tracker'}">${baby ? 'Calculate baby’s age' : 'Calculate my week'} ${arrow}</a></div><p class="growth-dating-note">${baby ? "Each week suggests a theme to notice or explore, not a deadline for a new skill. Look at progress over time and use age-based milestone checklists." : "Pregnancy is dated from your last period, so weeks 1 and 2 usually come before conception. Pictures show representative stages and are not exact weekly measurements."}</p><div class="growth-controls"><div class="growth-filters" aria-label="${baby ? 'Filter weeks by age range' : 'Filter weeks by trimester'}">${filters.map(([id,label],i)=>`<button type="button" data-growth-filter="${id}" aria-pressed="${i===0}">${label}</button>`).join('')}</div><label class="growth-jump" for="growthWeekSelect">Jump to week<select id="growthWeekSelect"><option value="">Select week</option>${weeks.map(w=>`<option value="${w.week}">Week ${w.week}</option>`).join('')}</select></label></div><p class="growth-count" id="growthCount" role="status">${weeks.length} weekly cards</p><div class="growth-grid" id="growthGrid">${weeks.map(w=>`<article class="growth-card growth-trimester-${w.trimester}" id="week-${w.week}" data-week="${w.week}" data-trimester="${w.trimester}" aria-labelledby="week-title-${w.week}" tabindex="-1">${!baby?wombVisual(w.week):''}<div class="growth-card-top"><div class="growth-week-number" aria-hidden="true"><span>WEEK</span><strong>${String(w.week).padStart(2,'0')}</strong></div><div class="growth-card-title"><span class="growth-trimester-label">${baby ? escape(w.stage) : ({1:'First',2:'Second',3:'Third'}[w.trimester] + ' trimester')}</span><h3 id="week-title-${w.week}"><a href="#week-${w.week}" aria-label="Week ${w.week}: ${escape(w.title)}">${escape(w.title)}</a></h3><span class="growth-current-badge" hidden>Your estimated week</span></div></div><p class="growth-development">${escape(w.development)}</p><div class="growth-care"><span class="growth-care-label">${baby ? 'TRY TOGETHER' : 'FOR YOU'}</span><p>${escape(w.care)}</p></div>${w.checkpoint ? `<aside class="growth-checkpoint"><strong>${escape(w.checkpoint.title)}</strong><p>${escape(w.checkpoint.text)}</p></aside>` : ''}</article>`).join('')}</div>${!baby?`<article class="birth-banner" id="birth" aria-labelledby="birthHeading">${wombVisual(40,true)}<div class="birth-banner-copy"><span class="eyebrow">FROM PREGNANCY TO PARENTHOOD</span><h2 id="birthHeading">Birth & the first hours.</h2><p>The timing and type of birth vary. Your maternity team will support the birth and assess your baby afterwards.</p><p>Ask about skin-to-skin contact, feeding support and newborn checks, according to your care needs.</p><a href="baby-growth.html">Continue to development after birth ${arrow}</a></div></article>`:''}<aside class="growth-sources"><div><span class="eyebrow">ABOUT THIS GUIDE</span><h2>Information to support your care.</h2><p>${baby ? "Babies develop at different rates. These weekly themes do not replace age-based milestone checks or an assessment. Ask a clinician about concerns, especially any loss of a skill." : "These summaries describe typical development, not an assessment of your baby’s growth. Follow your maternity team’s confirmed dates and advice."}</p></div><div><h3>Sources & further reading</h3>${sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.label)} ${arrow}</a>`).join('')}</div></aside>${!baby?`<section class="growth-after-birth"><div><span class="eyebrow">NEXT · AFTER YOUR BABY ARRIVES</span><h2>Then, the first year.</h2><p>Continue with feeding, movement, communication and play in the weeks after birth.</p></div><a class="btn btn-plum" href="baby-growth.html">Explore development after birth ${arrow}</a></section>`:''}</section>${baby ? window.MAMAS_FIRST_YEAR_NOTES || '' : ''}`;
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
