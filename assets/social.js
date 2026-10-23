(()=>{
  if(document.getElementById('mamas-social-dock')) return;
  const style=document.createElement('style');
  style.textContent=`
    :root{--ml-social-plum:#4b2d46;--ml-social-rose:#ed6b99;--ml-social-shadow:0 18px 50px rgba(75,45,70,.22)}
    .ml-social-dock{position:fixed;right:18px;top:50%;transform:translateY(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;align-items:stretch}
    .ml-social-title{background:rgba(75,45,70,.97);color:#fff;border-radius:16px;padding:9px 12px;font:800 11px/1.1 'DM Sans',system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-align:center;box-shadow:var(--ml-social-shadow)}
    .ml-social-btn{display:flex;align-items:center;gap:10px;min-width:158px;padding:12px 14px;border-radius:16px;color:#fff!important;text-decoration:none!important;font:800 13px/1 'DM Sans',system-ui,sans-serif;box-shadow:var(--ml-social-shadow);transition:transform .18s ease,box-shadow .18s ease}
    .ml-social-btn:hover{transform:translateX(-4px);box-shadow:0 22px 58px rgba(75,45,70,.28)}
    .ml-social-btn svg{width:21px;height:21px;flex:0 0 21px;fill:currentColor}
    .ml-social-facebook{background:linear-gradient(135deg,#1877f2,#0d5ed0)}
    .ml-social-tiktok{background:linear-gradient(135deg,#111,#4b2d46)}
    .ml-social-email{background:linear-gradient(135deg,#ed6b99,#c94d7b)}
    .ml-social-label{white-space:nowrap}
    .ml-social-footer{margin:36px auto 18px;width:min(1180px,calc(100% - 28px));padding:18px;border:1px solid rgba(75,45,70,.10);border-radius:22px;background:linear-gradient(135deg,#fff7fa,#fff3ed);display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
    .ml-social-footer b{width:100%;text-align:center;color:#4b2d46;font:700 20px/1.1 Georgia,serif;margin-bottom:3px}
    .ml-social-footer a{display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border-radius:999px;text-decoration:none!important;font:800 12px/1 'DM Sans',system-ui,sans-serif}
    .ml-social-footer .fb{background:#eaf2ff;color:#155dc2}.ml-social-footer .tt{background:#f1ecf2;color:#32202f}.ml-social-footer .em{background:#ffe8f0;color:#b63f6c}
    @media(max-width:760px){
      body{padding-bottom:82px!important}
      .ml-social-dock{left:10px;right:10px;top:auto;bottom:10px;transform:none;flex-direction:row;gap:8px;background:rgba(255,250,248,.96);border:1px solid rgba(75,45,70,.10);border-radius:20px;padding:8px;box-shadow:0 16px 45px rgba(75,45,70,.22);backdrop-filter:blur(14px)}
      .ml-social-title{display:none}.ml-social-btn{min-width:0;flex:1;justify-content:center;padding:12px 8px;border-radius:14px;font-size:11px;box-shadow:none}.ml-social-btn:hover{transform:none}.ml-social-btn svg{width:19px;height:19px;flex-basis:19px}
    }
  `;
  document.head.appendChild(style);
  const dock=document.createElement('aside');
  dock.id='mamas-social-dock'; dock.className='ml-social-dock'; dock.setAttribute('aria-label',"Mama's Love social links");
  dock.innerHTML=`
    <div class="ml-social-title">Connect with us</div>
    <a class="ml-social-btn ml-social-facebook" href="https://facebook.com/mamaslove" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24"><path d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v9h3.2z"/></svg><span class="ml-social-label">Facebook</span></a>
    <a class="ml-social-btn ml-social-tiktok" href="https://tiktok.com/@.mamaslove" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24"><path d="M15.6 3c.4 2.2 1.7 3.5 3.9 3.7v3.1c-1.5 0-2.8-.4-3.9-1.2v6.1c0 4-2.8 6.3-6.1 6.3A6 6 0 0 1 3.5 15c0-3.5 2.7-6 6.5-6v3.2c-.4-.1-.7-.1-1-.1-1.6 0-2.5 1.1-2.5 2.8 0 1.8 1.2 3 2.9 3 2 0 3-1.2 3-3.7V3h3.2z"/></svg><span class="ml-social-label">TikTok</span></a>
    <a class="ml-social-btn ml-social-email" href="mailto:mamaslovelies@gmail.com"><svg viewBox="0 0 24 24"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm9 7.1L20.7 7H3.3L12 12.1zm0 2.3L3 9.1V17h18V9.1l-9 5.3z"/></svg><span class="ml-social-label">Email</span></a>
  `;
  document.body.appendChild(dock);
  const footer=document.createElement('div'); footer.className='ml-social-footer';
  footer.innerHTML=`<b>Stay connected with Mama's Love</b><a class="fb" href="https://facebook.com/mamaslove" target="_blank" rel="noopener noreferrer">Facebook · @mamaslove</a><a class="tt" href="https://tiktok.com/@.mamaslove" target="_blank" rel="noopener noreferrer">TikTok · @.mamaslove</a><a class="em" href="mailto:mamaslovelies@gmail.com">mamaslovelies@gmail.com</a>`;
  const existingFooter=document.querySelector('footer'); if(existingFooter) existingFooter.parentNode.insertBefore(footer,existingFooter); else document.body.appendChild(footer);
})();