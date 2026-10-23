/* Bold, high-resolution keepsakes. Preview and download use the same renderer. */
(() => {
  'use strict';
  const themes = {
    plum: { paper:'#c5a5fa', panel:'#6840a3', ink:'#352044', name:'#f0f88f', accent:'#ff94b5', strip:'#f5eba7', bubble:'#e9ddff' },
    rose: { paper:'#ffacc7', panel:'#ad326f', ink:'#472044', name:'#fff2a2', accent:'#bda4f6', strip:'#f5dfed', bubble:'#ffdae5' },
    sage: { paper:'#d3ed92', panel:'#33635c', ink:'#263f3b', name:'#f8edbe', accent:'#ffac9d', strip:'#f8e5b9', bubble:'#edf5d2' }
  };
  const extended = 'U+0100-02FF,U+0300-036F,U+1E00-1EFF,U+2020,U+20A0-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const fonts = Promise.all([
    new FontFace('NameCardFunky','url(assets/fonts/lilita-one-latin-400-normal.woff2)',{unicodeRange:'U+0000-00FF,U+2000-206F,U+20AC,U+2122'}).load(),
    new FontFace('NameCardFunky','url(assets/fonts/lilita-one-latin-ext-400-normal.woff2)',{unicodeRange:extended}).load(),
    new FontFace('NameCardSans','url(assets/fonts/dm-sans-latin-variable.woff2)',{weight:'100 1000',unicodeRange:'U+0000-00FF,U+2000-206F,U+20AC,U+2122'}).load(),
    new FontFace('NameCardSans','url(assets/fonts/dm-sans-latin-ext-variable.woff2)',{weight:'100 1000',unicodeRange:extended}).load()
  ]).then(loaded=>loaded.forEach(font=>document.fonts.add(font))).catch(()=>{});
  const logo = new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src='assets/brand/mamas-love-logo.svg';});
  function round(ctx,x,y,w,h,r,fill,stroke,width=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function star(ctx,x,y,r,fill,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();for(let i=0;i<16;i++){const angle=i*Math.PI/8,rad=i%2?r*.43:r;ctx.lineTo(Math.cos(angle)*rad,Math.sin(angle)*rad)}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#352044';ctx.lineWidth=4;ctx.stroke();ctx.restore()}
  function wrap(ctx,value,width){
    const result=[];let line='';
    for(const word of String(value).trim().split(/\s+/)){
      const trial=line?`${line} ${word}`:word;
      if(ctx.measureText(trial).width<=width){line=trial;continue;}
      if(line){result.push(line);line='';}
      for(const char of word){if(line&&ctx.measureText(line+char).width>width){result.push(line);line='';}line+=char;}
    }
    if(line)result.push(line);return result;
  }
  function capsule(ctx,label,x,y,w,theme){round(ctx,x+6,y+7,w,67,33,theme.ink);round(ctx,x,y,w,67,33,theme.bubble,theme.ink,3);ctx.fillStyle=theme.ink;ctx.font='700 31px NameCardSans,Arial,sans-serif';ctx.textAlign='center';ctx.fillText(label,x+w/2,y+45);ctx.textAlign='left'}
  async function render(name,style='plum',options={}){
    await fonts;const mark=await logo,theme=themes[style]||themes.plum;
    const displayName=String(name.n).normalize('NFC');
    const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1350;const ctx=canvas.getContext('2d');
    ctx.fillStyle=theme.paper;ctx.fillRect(0,0,1800,1350);
    // Oversized cut-paper forms and bold borders keep the small preview vivid.
    ctx.fillStyle=theme.accent;ctx.beginPath();ctx.ellipse(1760,65,300,195,-.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=theme.bubble;ctx.beginPath();ctx.ellipse(0,1310,320,155,.45,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=theme.ink;ctx.lineWidth=5;ctx.strokeRect(31,31,1738,1288);
    if(mark)ctx.drawImage(mark,100,77,390,100.4);else{ctx.fillStyle=theme.ink;ctx.font='48px NameCardFunky,Arial,sans-serif';ctx.fillText('Mama’s Love',105,139)}
    ctx.font='700 29px NameCardSans,Arial,sans-serif';ctx.fillStyle=theme.ink;ctx.textAlign='right';ctx.fillText('A NAME TO CELEBRATE',1686,133);ctx.textAlign='left';
    const origin=name.c==='Oriki'?'YORÙBÁ ORÍKÌ':name.c==='Yoruba'?'YORÙBÁ':String(name.c).toUpperCase();
    ctx.font='700 31px NameCardSans,Arial,sans-serif';capsule(ctx,origin,102,211,Math.max(245,ctx.measureText(origin).width+80),theme);
    const gender=name.g==='girl'?'GIRL NAME':name.g==='boy'?'BOY NAME':'UNISEX NAME';capsule(ctx,gender,1370,211,325,theme);
    // The name is the main event: more than twice the previous display size.
    ctx.save();ctx.translate(900,500);ctx.rotate(-.025);
    round(ctx,-800,-186,1600,411,85,theme.ink);round(ctx,-815,-201,1600,411,85,theme.panel,theme.ink,5);
    let size=370;do{ctx.font=`400 ${size}px NameCardFunky,Arial,sans-serif`;if(ctx.measureText(displayName).width<=1450||size<=118)break;size-=2}while(true);
    const bounds=ctx.measureText(displayName),baseline=((bounds.actualBoundingBoxAscent||size*.7)-(bounds.actualBoundingBoxDescent||0))/2-3;
    ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=12;ctx.strokeStyle=theme.ink;
    ctx.fillStyle=theme.accent;ctx.strokeText(displayName,12,baseline+15);ctx.fillText(displayName,12,baseline+15);
    ctx.strokeText(displayName,0,baseline);ctx.fillStyle=theme.name;ctx.fillText(displayName,0,baseline);ctx.restore();
    star(ctx,1240,239,48,theme.accent,.16);star(ctx,133,676,61,theme.name,-.15);
    round(ctx,123,773,1560,140,36,theme.ink);round(ctx,112,762,1560,140,36,theme.strip,theme.ink,4);
    ctx.font='800 32px NameCardSans,Arial,sans-serif';ctx.fillStyle=theme.ink;ctx.fillText('SAY IT',170,844);
    ctx.beginPath();ctx.moveTo(337,792);ctx.lineTo(337,869);ctx.lineWidth=2;ctx.strokeStyle=theme.ink;ctx.stroke();
    const pronunciation=String(options.pronunciation??name.p??window.MamasPronunciation?.suggest(name)??'').trim()||'Your pronunciation';
    let pronunciationSize=80,spoken;do{ctx.font=`650 ${pronunciationSize}px NameCardSans,Arial,sans-serif`;spoken=wrap(ctx,pronunciation,1235);if(spoken.length<=2||pronunciationSize<=30)break;pronunciationSize-=2}while(true);
    if(spoken.length>1&&pronunciationSize>54){pronunciationSize=54;ctx.font=`650 ${pronunciationSize}px NameCardSans,Arial,sans-serif`;spoken=wrap(ctx,pronunciation,1235);}
    ctx.fillStyle=theme.ink;const step=pronunciationSize*1.16,first=830-(spoken.length-1)*step/2+pronunciationSize*.34;
    spoken.forEach((line,index)=>ctx.fillText(line,379,first+index*step));
    ctx.font='800 29px NameCardSans,Arial,sans-serif';ctx.fillText('WHAT IT MEANS',115,978);
    let meaningSize=90,meaning;do{ctx.font=`550 ${meaningSize}px NameCardSans,Arial,sans-serif`;meaning=wrap(ctx,name.m,1540);if((meaning.length<=3&&(meaning.length-1)*meaningSize*1.2+meaningSize*.25<=176)||meaningSize<=32)break;meaningSize-=2}while(true);
    meaning.forEach((line,index)=>ctx.fillText(line,110,1068+index*meaningSize*1.2));
    ctx.strokeStyle=theme.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(110,1252);ctx.lineTo(1688,1252);ctx.stroke();
    ctx.font='700 28px NameCardSans,Arial,sans-serif';ctx.fillText('LITTLE NAME. BIG LOVE.',110,1302);ctx.textAlign='right';ctx.font='600 32px NameCardSans,Arial,sans-serif';ctx.fillText('mamaslove.ng',1686,1302);
    return canvas;
  }
  window.MamasNameCard={render};
})();
