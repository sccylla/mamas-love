/* High-resolution keepsake cards. All artwork and fonts stay on this site. */
(() => {
  'use strict';
  const themes = {
    plum: { paper: '#38243f', shade: '#57335c', ink: '#fff4e8', muted: '#e2c9d3', gold: '#d8b77e', dark: true },
    rose: { paper: '#f6e3de', shade: '#eec8d1', ink: '#482c43', muted: '#7e5e6c', gold: '#a5784d', dark: false },
    sage: { paper: '#e1e8d9', shade: '#cbd9c9', ink: '#314d44', muted: '#5b7369', gold: '#8e7948', dark: false }
  };
  const fonts = Promise.all([
    new FontFace('NameCardSerif', 'url(assets/fonts/cormorant-garamond-latin-600-normal.woff2)').load(),
    new FontFace('NameCardSans', 'url(assets/fonts/dm-sans-latin-variable.woff2)', { weight: '100 1000' }).load()
  ]).then(loaded => { loaded.forEach(font => document.fonts.add(font)); }).catch(() => {});
  const logos = new Map();
  function logo(dark) {
    if (!logos.has(dark)) logos.set(dark, new Promise(resolve => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null);
      image.src = `assets/brand/mamas-love-logo${dark ? '-on-dark' : ''}.svg`;
    }));
    return logos.get(dark);
  }
  function tracking(ctx, value, x, y, size, gap, color) {
    ctx.font = `600 ${size}px NameCardSans,Arial,sans-serif`; ctx.fillStyle = color;
    const letters = [...value], width = letters.reduce((sum, letter) => sum + ctx.measureText(letter).width, 0) + Math.max(0, letters.length - 1) * gap;
    let left = x - width / 2;
    for (const letter of letters) { ctx.fillText(letter, left, y); left += ctx.measureText(letter).width + gap; }
  }
  function lines(ctx, value, width) {
    const result = []; let line = '';
    for (const word of String(value).trim().split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width > width && line) { result.push(line); line = word; } else line = trial;
    }
    if (line) result.push(line);
    return result;
  }
  function sprig(ctx, x, y, direction, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1); ctx.strokeStyle = color; ctx.globalAlpha = .6; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-22, -58, -33, -118, -15, -192); ctx.stroke();
    for (let index = 0; index < 5; index++) {
      const left = index % 2 ? -1 : 1, top = -25 - index * 31;
      ctx.beginPath(); ctx.moveTo(-13, top); ctx.bezierCurveTo(-13 + left * 42, top - 5, -13 + left * 48, top - 41, -14, top - 28); ctx.stroke();
    }
    ctx.restore();
  }
  async function render(name, style = 'plum') {
    await fonts;
    const theme = themes[style] || themes.plum, mark = await logo(theme.dark);
    const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 1125;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 1800, 1125); gradient.addColorStop(0, theme.paper); gradient.addColorStop(1, theme.shade);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1800, 1125);
    ctx.strokeStyle = theme.gold; ctx.lineWidth = 2; ctx.strokeRect(55, 55, 1690, 1015);
    ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.strokeRect(69, 69, 1662, 987); ctx.globalAlpha = 1;
    sprig(ctx, 1660, 300, 1, theme.gold); sprig(ctx, 140, 300, -1, theme.gold);
    tracking(ctx, 'A NAME TO TREASURE', 900, 181, 22, 7, theme.gold);
    const origin = name.c === 'Oriki' ? 'YORÙBÁ ORÍKÌ' : name.c === 'Yoruba' ? 'YORÙBÁ' : String(name.c).toUpperCase();
    const gender = name.g === 'girl' ? 'GIRL NAME' : name.g === 'boy' ? 'BOY NAME' : 'UNISEX NAME';
    tracking(ctx, `${origin}  ·  ${gender}`, 900, 301, 20, 3, theme.muted);
    let size = 168;
    do { ctx.font = `600 ${size}px NameCardSerif,Georgia,serif`; if (ctx.measureText(name.n).width <= 1450 || size <= 48) break; size -= 2; } while (true);
    const bounds = ctx.measureText(name.n);
    ctx.fillStyle = theme.ink; ctx.textAlign = 'center';
    ctx.fillText(name.n, 900, 451 + ((bounds.actualBoundingBoxAscent || size * .7) - (bounds.actualBoundingBoxDescent || 0)) / 2);
    ctx.textAlign = 'left'; ctx.strokeStyle = theme.gold; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(660, 565); ctx.lineTo(856, 565); ctx.moveTo(944, 565); ctx.lineTo(1140, 565); ctx.stroke();
    ctx.save(); ctx.translate(900, 565); ctx.rotate(Math.PI / 4); ctx.strokeRect(-10, -10, 20, 20); ctx.restore();
    tracking(ctx, 'THE MEANING', 900, 644, 17, 5, theme.gold);
    let meaningSize = 35, meaning;
    do { ctx.font = `400 ${meaningSize}px NameCardSans,Arial,sans-serif`; meaning = lines(ctx, name.m, 1320); if (meaning.length <= 4 || meaningSize <= 20) break; meaningSize--; } while (true);
    const lineHeight = meaningSize * 1.5;
    ctx.textAlign = 'center'; ctx.fillStyle = theme.ink;
    meaning.forEach((line, index) => ctx.fillText(line, 900, 725 + index * lineHeight));
    ctx.textAlign = 'left'; ctx.strokeStyle = theme.gold; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(126, 914); ctx.lineTo(1674, 914); ctx.stroke(); ctx.globalAlpha = 1;
    if (mark) ctx.drawImage(mark, 126, 958, 320, 82.4);
    else { ctx.font = '600 36px NameCardSerif,Georgia,serif'; ctx.fillStyle = theme.ink; ctx.fillText('Mama’s Love', 126, 1011); }
    tracking(ctx, 'CHOSEN WITH LOVE', 1475, 979, 14, 3, theme.gold);
    ctx.textAlign = 'right'; ctx.fillStyle = theme.muted; ctx.font = '400 23px NameCardSans,Arial,sans-serif'; ctx.fillText('mamaslove.ng', 1674, 1022);
    return canvas;
  }
  window.MamasNameCard = { render };
})();
