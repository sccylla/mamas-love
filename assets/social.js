(()=>{
  if(document.getElementById('mamas-social-dock')) return;
  const contacts=[['2348163030911','+234 816 303 0911'],['2290145389531','+229 01 45 38 95 31']];
  const contactMenu=(kind,label,path)=>`<details class="ml-contact-menu"><summary class="ml-social-btn ml-social-${kind}" aria-label="${label}: choose a number" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span class="ml-social-label">${label}</span></summary><div class="ml-contact-options"><span>${label} Mama’s Love</span>${contacts.map(([number,display])=>`<a href="${kind==='whatsapp'?'https://wa.me/'+number:'tel:+'+number}"${kind==='whatsapp'?' target="_blank" rel="noopener noreferrer"':''} aria-label="${label} ${display}">${display}</a>`).join('')}</div></details>`;
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
    .ml-social-whatsapp{background:linear-gradient(135deg,#167a53,#105e43)}
    .ml-social-call{background:linear-gradient(135deg,#744b91,#503364)}
    .ml-contact-menu{position:relative;min-width:0}
    .ml-contact-menu summary{list-style:none;cursor:pointer;box-sizing:border-box}
    .ml-contact-menu summary::-webkit-details-marker{display:none}
    .ml-contact-menu[open] summary{outline:2px solid #e4ee9c;outline-offset:3px}
    .ml-social-dock :focus-visible{outline:3px solid #e4ee9c;outline-offset:3px}
    .ml-contact-options{position:absolute;right:calc(100% + 12px);top:50%;transform:translateY(-50%);width:250px;box-sizing:border-box;padding:14px;border:1px solid #a879a7;border-radius:16px;background:#382145;box-shadow:0 12px 36px #21102f55;color:#fff0f5}
    .ml-contact-options>span{display:block;margin:0 0 9px;font:650 12px/1.5 'DM Sans',Arial,sans-serif;color:#e7c4db}
    .ml-contact-options a{display:flex;align-items:center;min-height:44px;padding:8px 11px;border-radius:9px;color:#fff0f5;text-decoration:none;font:600 14px/1.5 'DM Sans',Arial,sans-serif;box-sizing:border-box}
    .ml-contact-options a:hover{background:#69436d}
    .ml-social-email{background:linear-gradient(135deg,#ed6b99,#c94d7b)}
    .ml-social-label{white-space:nowrap}
    .ml-social-footer{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:3px 18px;margin:0;padding:0;width:auto;border:0;background:none}
    .ml-social-footer a{display:inline-flex;align-items:center;min-height:32px;padding:3px 0;color:#f3c1d7!important;text-decoration:none;font:600 11px/1.6 'DM Sans',system-ui,sans-serif;text-underline-offset:4px}
    .ml-social-footer a:hover{color:#e4ee9c!important;text-decoration:underline}
    .ml-social-footer a:focus-visible{outline:2px solid #e4ee9c;outline-offset:3px}
    @media(max-width:760px){
      body{padding-bottom:82px!important}
      .hero{grid-template-columns:1fr!important}
      .subhero{grid-template-columns:1fr!important}
      .hero-grid{grid-template-columns:1fr!important}
      .ml-social-dock{left:10px;right:10px;top:auto;bottom:10px;transform:none;flex-direction:row;gap:8px;background:rgba(255,250,248,.96);border:1px solid rgba(75,45,70,.10);border-radius:20px;padding:8px;box-shadow:0 16px 45px rgba(75,45,70,.22);backdrop-filter:blur(14px)}
      .ml-social-title{display:none}.ml-social-btn{min-width:0;flex:1;justify-content:center;padding:12px 8px;border-radius:14px;font-size:11px;box-shadow:none}.ml-social-btn:hover{transform:none}.ml-social-btn svg{width:19px;height:19px;flex-basis:19px}
      .ml-social-dock{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:5px;padding:7px}
      .ml-social-dock .ml-social-btn{flex-direction:column;gap:6px;width:100%;box-sizing:border-box;min-height:50px;padding:6px 2px;font-size:9px;line-height:1.2}
      .ml-contact-options{position:fixed;left:12px;right:12px;bottom:94px;top:auto;transform:none;width:auto}
    }
    @media(prefers-reduced-motion:reduce){.ml-social-btn{transition:none}.ml-social-btn:hover{transform:none}}
  `;
  document.head.appendChild(style);
  const dock=document.createElement('aside');
  dock.id='mamas-social-dock'; dock.className='ml-social-dock'; dock.setAttribute('aria-label',"Mama's Love social and contact links");
  dock.innerHTML=`
    <div class="ml-social-title">Connect with us</div>
    <a class="ml-social-btn ml-social-facebook" aria-label="Facebook" title="Facebook" href="https://facebook.com/mamaslove" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24"><path d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.8v9h3.2z"/></svg><span class="ml-social-label">Facebook</span></a>
    <a class="ml-social-btn ml-social-tiktok" aria-label="TikTok" title="TikTok" href="https://tiktok.com/@.mamaslove" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24"><path d="M15.6 3c.4 2.2 1.7 3.5 3.9 3.7v3.1c-1.5 0-2.8-.4-3.9-1.2v6.1c0 4-2.8 6.3-6.1 6.3A6 6 0 0 1 3.5 15c0-3.5 2.7-6 6.5-6v3.2c-.4-.1-.7-.1-1-.1-1.6 0-2.5 1.1-2.5 2.8 0 1.8 1.2 3 2.9 3 2 0 3-1.2 3-3.7V3h3.2z"/></svg><span class="ml-social-label">TikTok</span></a>
    ${contactMenu('whatsapp','WhatsApp','M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.4-.2-3.1.8.8-3-.2-.4A8 8 0 1 1 12 20Zm4.5-5.9-1.7-.8c-.3-.1-.5-.1-.7.2l-.7.9c-.1.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.3 0-.4.1-.6l.5-.6c.2-.2.2-.4.1-.6l-.8-1.9c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-.7 2.6.4 1.5 2.4 4.4 5.5 5.5 1.4.5 2.3.5 3.1-.1.5-.4.8-1.1.8-1.5 0-.2-.1-.2-.4-.3Z')}
    ${contactMenu('call','Call','M6.6 2.5 3.1 4a2 2 0 0 0-1.1 2.2c1.6 8 7.8 14.2 15.8 15.8A2 2 0 0 0 20 20.9l1.5-3.5a1 1 0 0 0-.5-1.3l-4-1.8a1 1 0 0 0-1.2.3l-1.7 2.1a15 15 0 0 1-6.8-6.8l2.1-1.7a1 1 0 0 0 .3-1.2L7.9 3a1 1 0 0 0-1.3-.5Z')}
    <a class="ml-social-btn ml-social-email" aria-label="Email" title="Email" href="mailto:mamaslovelies@gmail.com"><svg viewBox="0 0 24 24"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm9 7.1L20.7 7H3.3L12 12.1zm0 2.3L3 9.1V17h18V9.1l-9 5.3z"/></svg><span class="ml-social-label">Email</span></a>
  `;
  document.body.appendChild(dock);
  const contactMenus=[...dock.querySelectorAll('.ml-contact-menu')];
  const closeContacts=()=>contactMenus.forEach(menu=>{menu.open=false});
  contactMenus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)contactMenus.forEach(other=>{if(other!==menu)other.open=false})}));
  document.addEventListener('click',event=>{if(!dock.contains(event.target))closeContacts()});
  dock.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=contactMenus.find(menu=>menu.open);closeContacts();open?.querySelector('summary').focus()}});
  const footer=document.createElement('nav'); footer.className='ml-social-footer';footer.setAttribute('aria-label','Follow Mama’s Love');
  footer.innerHTML=`<a href="https://facebook.com/mamaslove" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://tiktok.com/@.mamaslove" target="_blank" rel="noopener noreferrer">TikTok</a><a href="mailto:mamaslovelies@gmail.com" aria-label="Email Mama’s Love">Email</a>`;
  const existingFooter=document.querySelector('footer');
  const slot=existingFooter?.querySelector('[data-footer-social]');
  if(slot) slot.appendChild(footer); else if(existingFooter) existingFooter.appendChild(footer);
})();
