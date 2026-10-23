/* Static approximate guides, included automatically on every catalogue card. */
(() => {
  'use strict';
  const guides = window.MAMAS_PRONUNCIATION_DATA || {};
  function suggest(name) {
    return guides[`${name.c}|${name.n}`] || String(name.n || '').trim();
  }
  window.MamasPronunciation = { suggest };
})();
