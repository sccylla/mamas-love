/* Floral, high-resolution keepsakes. Preview and download use the same renderer. */
(() => {
  'use strict';
  const themes = {
    plum: { paper:'#76518c', shade:'#442752', card:'#efdef4', ink:'#4a2854', name:'#773775', accent:'#d5a1c6', strip:'#dfc3e9', gold:'#e4c48a' },
    rose: { paper:'#b45c85', shade:'#71334f', card:'#fae0e8', ink:'#632849', name:'#9b3c6b', accent:'#ecadca', strip:'#f1bed4', gold:'#e5bc83' },
    sage: { paper:'#578270', shade:'#294f43', card:'#e6eedc', ink:'#2c4b3e', name:'#3f725a', accent:'#a3c5ac', strip:'#d1e1c2', gold:'#ddc99b' }
  };
  const extended = 'U+0100-02FF,U+0300-036F,U+1E00-1EFF,U+2020,U+20A0-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const fonts = Promise.all([
    new FontFace('NameCardFunky','url(assets/fonts/lilita-one-latin-400-normal.woff2)',{unicodeRange:'U+0000-00FF,U+2000-206F,U+20AC,U+2122'}).load(),
    new FontFace('NameCardFunky','url(assets/fonts/lilita-one-latin-ext-400-normal.woff2)',{unicodeRange:extended}).load(),
    new FontFace('NameCardSans','url(assets/fonts/dm-sans-latin-variable.woff2)',{weight:'100 1000',unicodeRange:'U+0000-00FF,U+2000-206F,U+20AC,U+2122'}).load(),
    new FontFace('NameCardSans','url(assets/fonts/dm-sans-latin-ext-variable.woff2)',{weight:'100 1000',unicodeRange:extended}).load()
  ]).then(loaded=>loaded.forEach(font=>document.fonts.add(font))).catch(()=>{});
  const logo = new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src='assets/brand/mamas-love-logo-on-dark.svg';});
  const bouquet = new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src='assets/illustrations/name-card-bouquet.png?v=floral-1';});
  function round(ctx,x,y,w,h,r,fill,stroke,width=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function floralCorner(ctx,image,x,y,size,flipX=false,flipY=false){
    if(!image)return;ctx.save();ctx.translate(x+(flipX?size:0),y+(flipY?size:0));ctx.scale(flipX?-1:1,flipY?-1:1);ctx.drawImage(image,0,0,size,size);ctx.restore();
  }
  function diamond(ctx,x,y,color){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=color;ctx.fillRect(-5,-5,10,10);ctx.restore();}
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
  async function render(name,style='plum',options={}){
    await fonts;const [mark,blooms]=await Promise.all([logo,bouquet]),theme=themes[style]||themes.plum;
    const displayName=String(name.n).normalize('NFC');
    const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1350;const ctx=canvas.getContext('2d');
    const background=ctx.createLinearGradient(0,0,1800,1350);background.addColorStop(0,theme.paper);background.addColorStop(1,theme.shade);ctx.fillStyle=background;ctx.fillRect(0,0,1800,1350);
    // Real botanical artwork frames a protected reading area on all four sides.
    floralCorner(ctx,blooms,-55,-85,720);
    floralCorner(ctx,blooms,1135,-85,720,true);
    floralCorner(ctx,blooms,-55,760,720,false,true);
    floralCorner(ctx,blooms,1135,760,720,true,true);
    ctx.strokeStyle=theme.gold;ctx.lineWidth=3;ctx.strokeRect(34,34,1732,1282);
    if(mark)ctx.drawImage(mark,705,60,390,100.4);else{ctx.fillStyle='#fff1f4';ctx.font='48px NameCardFunky,Arial,sans-serif';ctx.textAlign='center';ctx.fillText('Mama’s Love',900,130);ctx.textAlign='left';}
    const origin=name.c==='Oriki'?'YORÙBÁ ORÍKÌ':name.c==='Yoruba'?'YORÙBÁ':String(name.c).toUpperCase();
    const gender=name.g==='girl'?'GIRL NAME':name.g==='boy'?'BOY NAME':'UNISEX NAME';
    const metadata=`${origin}  ·  ${gender}`;ctx.font='700 31px NameCardSans,Arial,sans-serif';const metadataWidth=Math.max(600,ctx.measureText(metadata).width+100);
    round(ctx,900-metadataWidth/2,195,metadataWidth,65,32,theme.card,theme.gold,2);ctx.fillStyle=theme.ink;ctx.textAlign='center';ctx.fillText(metadata,900,239);ctx.textAlign='left';
    ctx.save();ctx.shadowColor='#25132933';ctx.shadowBlur=30;ctx.shadowOffsetY=10;
    const paper=ctx.createLinearGradient(150,280,1650,1240);paper.addColorStop(0,theme.card);paper.addColorStop(1,theme.strip);
    round(ctx,146,286,1508,954,62,paper);ctx.restore();
    round(ctx,158,298,1484,930,52,null,theme.gold,3);round(ctx,171,311,1458,904,42,null,theme.gold+'88',1);
    ctx.strokeStyle=theme.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(660,682);ctx.lineTo(856,682);ctx.moveTo(944,682);ctx.lineTo(1140,682);ctx.stroke();diamond(ctx,900,682,theme.gold);
    ctx.save();ctx.translate(900,492);
    let size=370;do{ctx.font=`400 ${size}px NameCardFunky,Arial,sans-serif`;if(ctx.measureText(displayName).width<=1380||size<=118)break;size-=2}while(true);
    const bounds=ctx.measureText(displayName),baseline=((bounds.actualBoundingBoxAscent||size*.7)-(bounds.actualBoundingBoxDescent||0))/2-3;
    ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle=theme.card;
    ctx.fillStyle=theme.accent;ctx.strokeText(displayName,6,baseline+9);ctx.fillText(displayName,6,baseline+9);
    ctx.strokeText(displayName,0,baseline);ctx.fillStyle=theme.name;ctx.fillText(displayName,0,baseline);ctx.restore();
    round(ctx,215,762,1370,140,32,theme.strip,theme.gold,2);
    ctx.font='800 29px NameCardSans,Arial,sans-serif';ctx.fillStyle=theme.ink;ctx.fillText('SAY IT',255,843);
    ctx.beginPath();ctx.moveTo(399,792);ctx.lineTo(399,869);ctx.lineWidth=1.5;ctx.strokeStyle=theme.gold;ctx.stroke();
    const pronunciation=String(options.pronunciation??name.p??window.MamasPronunciation?.suggest(name)??'').trim()||displayName;
    let pronunciationSize=80,spoken;do{ctx.font=`650 ${pronunciationSize}px NameCardSans,Arial,sans-serif`;spoken=wrap(ctx,pronunciation,1095);if(spoken.length<=2||pronunciationSize<=30)break;pronunciationSize-=2}while(true);
    if(spoken.length>1&&pronunciationSize>54){pronunciationSize=54;ctx.font=`650 ${pronunciationSize}px NameCardSans,Arial,sans-serif`;spoken=wrap(ctx,pronunciation,1095);}
    ctx.fillStyle=theme.ink;const step=pronunciationSize*1.16,first=830-(spoken.length-1)*step/2+pronunciationSize*.34;
    spoken.forEach((line,index)=>ctx.fillText(line,445,first+index*step));
    ctx.font='800 29px NameCardSans,Arial,sans-serif';ctx.fillText('WHAT IT MEANS',236,978);
    let meaningSize=90,meaning;do{ctx.font=`550 ${meaningSize}px NameCardSans,Arial,sans-serif`;meaning=wrap(ctx,name.m,1328);if((meaning.length<=3&&(meaning.length-1)*meaningSize*1.2+meaningSize*.25<=140)||meaningSize<=32)break;meaningSize-=2}while(true);
    meaning.forEach((line,index)=>ctx.fillText(line,232,1060+index*meaningSize*1.2));
    ctx.fillStyle='#fff3ec';ctx.font='600 32px NameCardSans,Arial,sans-serif';ctx.textAlign='center';ctx.fillText('mamaslove.ng',900,1302);
    return canvas;
  }
  window.MamasNameCard={render};
})();
