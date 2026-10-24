/* One concise footer for the main site and standalone tools. */
(() => {
  'use strict';
  const defaultBrand = `<a class="brand brand-lockup" href="index.html" aria-label="Mama’s Love home"><img src="assets/brand/mamas-love-logo-on-dark.svg" width="334" height="86" alt="Mama’s Love"></a>`;
  function render(brand=defaultBrand) {
    const links=[['index.html#tools','Trackers'],['pregnancy.html','Pregnancy'],['growth.html','Growth in the womb'],['period.html','Periods'],['baby.html','Baby care'],['videos.html','Videos'],['learn.html','Blog'],['names.html','Baby names'],['sounds.html','Lullabies'],['community.html','Support']];
    const contacts=[['2348163030911','+234 816 303 0911'],['2290145389531','+229 01 45 38 95 31']];
    return `<footer class="footer footer-compact"><div class="footer-compact-inner"><div class="footer-compact-top"><div class="footer-compact-identity">${brand}<p>Women’s health, pregnancy and early parenthood.</p></div><nav class="footer-compact-nav" aria-label="Footer navigation">${links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</nav></div><div class="footer-contact" id="contact"><span class="footer-contact-label">Get in touch</span><address class="footer-contact-numbers">${contacts.map(([number,label])=>`<div class="footer-contact-number"><span>${label}</span><div><a class="footer-whatsapp" href="https://wa.me/${number}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${label}">WhatsApp</a><a href="tel:+${number}" aria-label="Call ${label}">Call</a></div></div>`).join('')}</address></div><p class="footer-compact-note">Tracker entries stay on your device. Health information and estimates do not replace medical advice.</p><div class="footer-compact-bottom"><span>© ${new Date().getFullYear()} Mama’s Love · <a href="admin.html">Admin</a></span><div data-footer-social></div></div></div></footer>`;
  }
  window.MamasFooter={render};
  // Standalone tools don't load app.js; their footer uses the same component.
  if (!document.body.dataset.page) {
    const footer=document.querySelector('footer');
    if(footer) footer.outerHTML=render();
  }
})();
