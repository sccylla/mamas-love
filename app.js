const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const MS_DAY=86400000;
const addDays=(date,days)=>{const d=new Date(date);d.setDate(d.getDate()+days);return d};
const startDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const daysBetween=(a,b)=>Math.floor((startDay(b)-startDay(a))/MS_DAY);
const fmt=d=>new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(d);
const fmtShort=d=>new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short'}).format(d);
const escapeHtml=s=>String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m]));

$('#year').textContent=new Date().getFullYear();
const nav=$('.nav'), navToggle=$('.nav-toggle');
navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',open)});
$$('.nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');navToggle.setAttribute('aria-expanded','false')}));

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(el=>observer.observe(el));

$$('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  $$('.tracker-panel').forEach(p=>{p.classList.remove('active');p.hidden=true});
  const panel=document.getElementById(btn.dataset.target);panel.hidden=false;panel.classList.add('active');
}));

const pregnancyNotes=[
  [4,'A tiny embryo is implanting and early support structures are developing.'],[8,'Major organs are beginning to form, and the embryo is changing quickly.'],[12,'The fetus has formed many key structures and is becoming more active.'],[16,'Bones are strengthening and coordinated movement is increasing.'],[20,'You are around the halfway point; movement may become easier to notice.'],[24,'Lungs and the nervous system continue to mature while growth accelerates.'],[28,'The third trimester begins around now; brain development is especially active.'],[32,'Baby is gaining fat and practicing movements needed after birth.'],[36,'Many babies are settling into a head-down position and continuing to gain weight.'],[40,'Your estimated due window is here, though normal birth timing can vary.']
];
const pregnancyNote=week=>pregnancyNotes.find(([w])=>week<=w)?.[1]||'Pregnancy timing can vary. Stay in touch with your maternity-care team as you approach or pass your due date.';

function setStored(id,val){try{localStorage.setItem('mamasLove:'+id,JSON.stringify(val))}catch(e){}}
function getStored(id){try{return JSON.parse(localStorage.getItem('mamasLove:'+id)||'null')}catch(e){return null}}

$('#pregnancyForm').addEventListener('submit',e=>{e.preventDefault();
  const raw=$('#lmpDate').value, cycle=Number($('#pregCycle').value); if(!raw)return;
  const lmp=new Date(raw+'T00:00:00'), today=startDay(new Date()), ageDays=daysBetween(lmp,today);
  if(ageDays<0){$('#pregnancyResult').innerHTML=errorCard('That LMP date is in the future. Please check the date.');return}
  const adjusted=ageDays-(cycle-28), week=Math.max(0,Math.floor(adjusted/7)), day=Math.max(0,adjusted%7);
  const due=addDays(lmp,280+(cycle-28)); const progress=Math.min(100,Math.max(0,adjusted/280*100));
  const trimester=week<14?'First trimester':week<28?'Second trimester':'Third trimester';
  $('#pregnancyResult').innerHTML=`<div class="result-wrap"><div class="result-head"><div><span class="tracker-kicker">Your pregnancy today</span><h4>${week} weeks, ${day} days</h4></div><span class="result-badge">${trimester}</span></div><div class="meter"><i style="width:${progress}%"></i></div><div class="result-grid"><div class="stat"><small>Estimated due date</small><b>${fmt(due)}</b></div><div class="stat"><small>Pregnancy progress</small><b>${Math.round(progress)}%</b></div><div class="stat"><small>Week</small><b>${week} of ~40</b></div></div><div class="development-note"><strong>This week:</strong> ${pregnancyNote(week)}</div></div>`;
  setStored('pregnancy',{raw,cycle});
});

$('#periodForm').addEventListener('submit',e=>{e.preventDefault();
  const raw=$('#periodDate').value, cycle=Number($('#cycleLength').value), plen=Number($('#periodLength').value); if(!raw)return;
  const last=new Date(raw+'T00:00:00'), today=startDay(new Date()); if(last>today){$('#periodResult').innerHTML=errorCard('That period date is in the future. Please check the date.');return}
  let next=addDays(last,cycle); while(next<today) next=addDays(next,cycle);
  const prev=addDays(next,-cycle), day=Math.max(1,daysBetween(prev,today)+1), ovulation=addDays(next,-14), fertileStart=addDays(ovulation,-5), fertileEnd=addDays(ovulation,1), periodEnd=addDays(next,plen-1);
  const daysTo=Math.max(0,daysBetween(today,next));
  $('#periodResult').innerHTML=`<div class="result-wrap"><div class="result-head"><div><span class="tracker-kicker">Cycle forecast</span><h4>Cycle day ${day}</h4></div><span class="result-badge">${daysTo===0?'Estimated period day':daysTo+' days to next period'}</span></div><div class="meter"><i style="width:${Math.min(100,day/cycle*100)}%"></i></div><div class="result-grid"><div class="stat"><small>Next period</small><b>${fmt(next)} – ${fmtShort(periodEnd)}</b></div><div class="stat"><small>Estimated ovulation</small><b>${fmt(ovulation)}</b></div><div class="stat"><small>Estimated fertile window</small><b>${fmtShort(fertileStart)} – ${fmtShort(fertileEnd)}</b></div></div><div class="development-note"><strong>Remember:</strong> Cycle predictions are estimates. Stress, illness, travel, breastfeeding, perimenopause and other factors can shift ovulation and bleeding.</div></div>`;
  setStored('period',{raw,cycle,plen});
});

const stageForMonths=m=>m<2?0:m<4?1:m<6?2:m<9?3:4;
const stageNames=['Connecting & settling','Smiles & stronger control','Reaching & exploring','Movement & recognition','Communication & mobility'];
$('#newbornForm').addEventListener('submit',e=>{e.preventDefault();
  const raw=$('#babyDob').value, gest=Number($('#birthGestation').value||40); if(!raw)return;
  const dob=new Date(raw+'T00:00:00'), today=startDay(new Date()), ageDays=daysBetween(dob,today); if(ageDays<0){$('#newbornResult').innerHTML=errorCard("Baby's birth date is in the future. Please check the date.");return}
  const chronoWeeks=Math.floor(ageDays/7), chronoMonths=ageDays/30.4375; const earlyWeeks=Math.max(0,40-gest); const correctedDays=Math.max(0,ageDays-earlyWeeks*7); const correctedWeeks=Math.floor(correctedDays/7), correctedMonths=correctedDays/30.4375; const useCorrected=gest<37 && ageDays<730; const stage=stageForMonths(useCorrected?correctedMonths:chronoMonths);
  $$('#milestoneTimeline article').forEach((el,i)=>el.classList.toggle('active-stage',i===stage));
  const correctedStat=useCorrected?`<div class="stat"><small>Corrected age</small><b>${correctedWeeks} weeks</b></div>`:`<div class="stat"><small>Birth gestation</small><b>${gest} weeks</b></div>`;
  $('#newbornResult').innerHTML=`<div class="result-wrap"><div class="result-head"><div><span class="tracker-kicker">Baby today</span><h4>${chronoWeeks} weeks old</h4></div><span class="result-badge">${stageNames[stage]}</span></div><div class="meter"><i style="width:${Math.min(100,chronoMonths/12*100)}%"></i></div><div class="result-grid"><div class="stat"><small>Age in days</small><b>${ageDays} days</b></div>${correctedStat}<div class="stat"><small>First-year progress</small><b>${Math.min(100,Math.round(chronoMonths/12*100))}%</b></div></div><div class="development-note"><strong>Development note:</strong> Milestones are ranges, not deadlines. ${useCorrected?'Because baby was born before 37 weeks, corrected age can be useful when discussing development with a clinician.':'Look for steady progress across movement, communication, social interaction and feeding.'}</div></div>`;
  setStored('newborn',{raw,gest:$('#birthGestation').value});
});
function errorCard(msg){return `<div class="empty-result"><span>!</span><h4>Please check your entry</h4><p>${escapeHtml(msg)}</p></div>`}

const guides={
  postpartum:{label:'Postpartum',title:'The first six weeks: a practical recovery guide',body:`<p>After birth, the body needs time to heal. Vaginal bleeding usually changes over days and weeks, while soreness, uterine cramping, breast changes and fatigue can all be part of early recovery.</p><ul><li>Prioritize hydration, regular meals, rest and pain relief recommended by your clinician.</li><li>Pelvic-floor symptoms, wound pain or urinary problems are worth discussing early rather than waiting.</li><li>Strong sadness, anxiety, panic, frightening thoughts or feeling unable to cope deserve prompt support.</li><li>Heavy bleeding, chest pain, seizures, severe headache with vision changes, or breathing difficulty need urgent medical attention.</li></ul><p>Keep postpartum appointments even when you feel well; they are a chance to discuss healing, feeding, contraception, sleep and mental health.</p>`},
  'pregnancy-redflags':{label:'Pregnancy',title:'Symptoms that deserve urgent attention',body:`<p>Pregnancy symptoms can change quickly. Contact urgent maternity or emergency care for severe symptoms rather than relying on a tracker.</p><ul><li>Heavy bleeding, severe abdominal pain, fainting or seizures.</li><li>Chest pain, major breathing difficulty, sudden severe swelling, or a severe headache with vision changes.</li><li>Leaking fluid when you think your waters may have broken, especially preterm.</li><li>Later in pregnancy, a clear reduction in your baby's usual movement pattern should be assessed promptly.</li></ul><p>Local maternity services may give you specific instructions based on your stage of pregnancy and medical history.</p>`},
  'cycle-guide':{label:"Women's health",title:'Getting to know your normal cycle',body:`<p>Tracking the first day of bleeding, cycle length, pain, mood, discharge and other symptoms can help you notice your own pattern.</p><ul><li>Cycles can shift with stress, travel, illness, major weight change, breastfeeding and life stage.</li><li>Seek care for very heavy bleeding, severe pain, bleeding after sex, pregnancy concerns, or a major persistent change from your usual pattern.</li><li>Fertile-window calculations are estimates and should not be treated as reliable birth control.</li></ul>`},
  'baby-care':{label:'Baby care',title:'Feeding, diapers and early cues',body:`<p>Newborns communicate through cues long before they can follow a schedule. Early feeding cues can include stirring, bringing hands toward the mouth and rooting.</p><ul><li>Feeding patterns vary by age and feeding method; growth and hydration matter more than comparing babies.</li><li>Wet diapers usually become more frequent over the first days of life.</li><li>Seek professional help if a baby feeds very poorly, is difficult to wake, has breathing difficulty, looks blue/grey, shows signs of dehydration, or you are worried about fever.</li></ul><p>For feeding and growth concerns, a pediatric or maternal-child health professional can assess the whole picture.</p>`}
};
const modal=$('#guideModal');
$$('[data-modal]').forEach(btn=>btn.addEventListener('click',()=>{const g=guides[btn.dataset.modal];$('#modalLabel').textContent=g.label;$('#modalTitle').textContent=g.title;$('#modalBody').innerHTML=g.body;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}));
$$('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeModal));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}

$('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();const input=$('input',e.currentTarget);$('#newsletterMessage').textContent=`Thanks — ${input.value} is on the Mama's Love early-access list for this demo.`;input.value=''});

const preg=getStored('pregnancy');if(preg){$('#lmpDate').value=preg.raw;$('#pregCycle').value=preg.cycle;$('#pregnancyForm').requestSubmit()}
const per=getStored('period');if(per){$('#periodDate').value=per.raw;$('#cycleLength').value=per.cycle;$('#periodLength').value=per.plen}
const nb=getStored('newborn');if(nb){$('#babyDob').value=nb.raw;$('#birthGestation').value=nb.gest||''}

const lullabyTracks=[
  {title:'Moonlight Hush',description:'A slow, warm bedtime melody.',step:.62,notes:[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,493.88,440,392,329.63,293.66]},
  {title:'Little Cloud',description:'A light melody that gently floats.',step:.54,notes:[329.63,392,440,392,349.23,329.63,293.66,329.63,392,493.88,440,392,349.23,293.66,261.63,293.66]},
  {title:"Mama’s Arms",description:'A slower, comforting cuddle-time tune.',step:.7,notes:[220,261.63,329.63,261.63,246.94,293.66,349.23,293.66,220,261.63,329.63,392,349.23,329.63,261.63,246.94]}
];
let lullabyCtx=null,lullabyMaster=null,lullabyPlaying=false,lullabyIndex=0,lullabyTimer=null,lullabyNodes=[],lullabySession=0,autoplayPending=true;
const player=$('.lullaby-player'),lullabyToggle=$('#lullabyToggle'),floatingToggle=$('#floatingLullabyToggle'),lullabyIcon=$('#lullabyIcon'),autoplayNote=$('#autoplayNote');

function setupLullabyAudio(){
  if(lullabyCtx)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){autoplayNote.textContent='Audio is not supported in this browser.';return;}
  lullabyCtx=new AC();
  lullabyMaster=lullabyCtx.createGain();
  lullabyMaster.gain.value=Number($('#lullabyVolume').value)/100*.18;
  lullabyMaster.connect(lullabyCtx.destination);
}
function clearLullabyNodes(){lullabyNodes.forEach(n=>{try{n.stop()}catch(e){}});lullabyNodes=[];}
function scheduleLullabyLoop(session){
  if(!lullabyPlaying||session!==lullabySession||!lullabyCtx)return;
  const track=lullabyTracks[lullabyIndex],start=lullabyCtx.currentTime+.06,step=track.step;
  track.notes.forEach((freq,i)=>{
    const t=start+i*step,dur=step*.9;
    const gain=lullabyCtx.createGain();
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.62,t+.08);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);gain.connect(lullabyMaster);
    const osc=lullabyCtx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(freq,t);osc.connect(gain);osc.start(t);osc.stop(t+dur+.03);lullabyNodes.push(osc);
    const soft=lullabyCtx.createOscillator(),softGain=lullabyCtx.createGain();
    soft.type='triangle';soft.frequency.setValueAtTime(freq/2,t);softGain.gain.setValueAtTime(.0001,t);softGain.gain.exponentialRampToValueAtTime(.12,t+.12);softGain.gain.exponentialRampToValueAtTime(.0001,t+dur);soft.connect(softGain);softGain.connect(lullabyMaster);soft.start(t);soft.stop(t+dur+.03);lullabyNodes.push(soft);
  });
  const patternMs=track.notes.length*step*1000;
  lullabyTimer=setTimeout(()=>scheduleLullabyLoop(session),Math.max(500,patternMs-100));
}
function updateLullabyUI(){
  const t=lullabyTracks[lullabyIndex];
  $('#lullabyTitle').textContent=t.title;$('#lullabyDescription').textContent=t.description;$('#floatingTrackTitle').textContent=t.title;
  $$('.lullaby-track').forEach((b,i)=>b.classList.toggle('active',i===lullabyIndex));
  if(player)player.classList.toggle('playing',lullabyPlaying);
  if(lullabyIcon)lullabyIcon.textContent=lullabyPlaying?'Ⅱ':'▶';
  if(floatingToggle)floatingToggle.textContent=lullabyPlaying?'Ⅱ':'▶';
  if(lullabyToggle)lullabyToggle.setAttribute('aria-label',lullabyPlaying?'Pause lullaby':'Play lullaby');
  if(floatingToggle)floatingToggle.setAttribute('aria-label',lullabyPlaying?'Pause lullaby':'Play lullaby');
}
async function startLullaby(fromUser=false){
  setupLullabyAudio();if(!lullabyCtx)return false;
  try{await lullabyCtx.resume()}catch(e){}
  if(lullabyCtx.state!=='running'){
    autoplayPending=true;autoplayNote.textContent='Your browser paused autoplay — tap Play or interact with the page to begin.';return false;
  }
  clearTimeout(lullabyTimer);clearLullabyNodes();lullabyPlaying=true;autoplayPending=false;lullabySession++;
  scheduleLullabyLoop(lullabySession);updateLullabyUI();autoplayNote.textContent=fromUser?'Playing softly ♫':'Autoplay started softly ♫';return true;
}
function stopLullaby(){autoplayPending=false;lullabyPlaying=false;lullabySession++;clearTimeout(lullabyTimer);clearLullabyNodes();updateLullabyUI();autoplayNote.textContent='Paused — press play whenever you want a softer moment.';}
function toggleLullaby(){lullabyPlaying?stopLullaby():startLullaby(true)}
function chooseLullaby(i){
  const was=lullabyPlaying;lullabyIndex=(i+lullabyTracks.length)%lullabyTracks.length;
  if(was){lullabySession++;clearTimeout(lullabyTimer);clearLullabyNodes();scheduleLullabyLoop(lullabySession)}
  updateLullabyUI();
}
if(lullabyToggle)lullabyToggle.addEventListener('click',toggleLullaby);
if(floatingToggle)floatingToggle.addEventListener('click',toggleLullaby);
$('#prevLullaby')?.addEventListener('click',()=>chooseLullaby(lullabyIndex-1));
$('#nextLullaby')?.addEventListener('click',()=>chooseLullaby(lullabyIndex+1));
$$('.lullaby-track').forEach((b,i)=>b.addEventListener('click',()=>chooseLullaby(i)));
$('#lullabyVolume')?.addEventListener('input',e=>{if(lullabyMaster)lullabyMaster.gain.setTargetAtTime(Number(e.target.value)/100*.18,lullabyCtx.currentTime,.04)});
updateLullabyUI();
setTimeout(()=>$('#floatingLullaby')?.classList.add('show'),1800);

window.addEventListener('load',()=>{
  startLullaby(false).then(started=>{
    if(!started){
      const unlock=()=>{if(autoplayPending&&!lullabyPlaying)startLullaby(false);document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)};
      document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
    }
  });
});
