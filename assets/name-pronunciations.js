/* Approximate, editable respellings, not a phonetic or tonal dictionary. */
(() => {
  'use strict';
  const common = {
    abigail:'AB-ih-gayl', abigale:'AB-ih-gayl', ada:'AY-duh', adam:'AD-um',
    adrian:'AY-dree-un', alexander:'al-ig-ZAN-der', alice:'AL-iss', amelia:'uh-MEE-lee-uh',
    amina:'ah-MEE-nah', amir:'ah-MEER', amira:'ah-MEER-ah', anna:'AN-uh',
    arabella:'ar-uh-BEL-uh', aria:'AR-ee-uh', ariel:'AR-ee-el', ariella:'ah-ree-EL-ah',
    ava:'AY-vuh', benjamin:'BEN-juh-min', bella:'BEL-uh', caleb:'KAY-lub',
    charlotte:'SHAR-lut', chloe:'KLOH-ee', daniel:'DAN-yul', david:'DAY-vid',
    elijah:'ih-LY-juh', elizabeth:'ih-LIZ-uh-buth', ella:'EL-uh', emily:'EM-uh-lee',
    emma:'EM-uh', ethan:'EE-thun', eva:'EE-vuh', evelyn:'EV-uh-lin',
    ezra:'EZ-ruh', fatima:'FAH-tih-mah', gabriel:'GAY-bree-ul', grace:'GRAYS',
    hannah:'HAN-uh', harper:'HAR-per', henry:'HEN-ree', ibrahim:'ib-rah-HEEM',
    isaac:'EYE-zuk', isabella:'iz-uh-BEL-uh', isla:'EYE-luh', james:'JAYMZ',
    jasmine:'JAZ-min', joseph:'JOH-zuf', layla:'LAY-luh', leo:'LEE-oh',
    leah:'LEE-uh', liam:'LEE-um', lily:'LIL-ee', lucas:'LOO-kus',
    luna:'LOO-nuh', maryam:'MAR-yam', maya:'MY-uh', mia:'MEE-uh',
    mila:'MEE-luh', nathan:'NAY-thun', noah:'NOH-uh', nora:'NOR-uh',
    oliver:'OL-ih-ver', olivia:'oh-LIV-ee-uh', omar:'OH-mar', rayyan:'ray-YAHN',
    rebecca:'ruh-BEK-uh', rose:'ROHZ', samuel:'SAM-yoo-ul', sarah:'SAIR-uh',
    scarlett:'SKAR-let', sofia:'soh-FEE-uh', sophia:'soh-FEE-uh', theo:'THEE-oh',
    william:'WIL-yum', yusuf:'YOO-soof', zara:'ZAH-ruh', zoe:'ZOH-ee'
  };
  const yoruba = {
    adesewa:'ah-deh-sheh-wah', adewale:'ah-deh-wah-leh', arike:'ah-ree-keh',
    ayomide:'ah-yaw-mee-deh', ayodele:'ah-yaw-deh-leh', folake:'faw-lah-keh',
    ife:'ee-feh', ifeoluwa:'ee-feh-aw-loo-wah', morenike:'maw-reh-nee-keh',
    oluwafemi:'aw-loo-wah-feh-mee', oluwaseun:'aw-loo-wah-sheh-oon',
    simisola:'see-mee-shaw-lah', temiloluwa:'teh-mee-law-loo-wah',
    temi:'teh-mee', tolu:'taw-loo', yetunde:'yeh-toon-deh',
    yewande:'yeh-wahn-deh', yinka:'yeen-kah'
  };
  function suggest(name) {
    const key = name.n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    if (name.c === 'Yoruba' || name.c === 'Oriki') return yoruba[key] || '';
    return common[key] || '';
  }
  window.MamasPronunciation = { suggest };
})();
