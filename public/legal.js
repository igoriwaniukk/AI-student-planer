// Shared by /privacy and /support: the PL/EN switch and the contact email.
// Put the Pulgo contact address here once it exists; until then the pages
// say it's coming soon instead of showing an address that doesn't work.
var PULGO_CONTACT_EMAIL = '';

(function () {
  var saved = null;
  try { saved = localStorage.getItem('pulgo.legalLang'); } catch { /* storage blocked */ }
  var query = new URLSearchParams(location.search).get('lang');
  var lang = query || saved || ((navigator.language || '').toLowerCase().indexOf('pl') === 0 ? 'pl' : 'en');
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'pl';
    document.documentElement.lang = lang;
    try { localStorage.setItem('pulgo.legalLang', lang); } catch { /* storage blocked */ }
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
  }
  setLang(lang);
  document.addEventListener('DOMContentLoaded', function () {
    setLang(lang);
    document.querySelectorAll('.langs button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
    document.querySelectorAll('[data-contact]').forEach(function (el) {
      if (PULGO_CONTACT_EMAIL) {
        el.innerHTML = '';
        var a = document.createElement('a');
        a.href = 'mailto:' + PULGO_CONTACT_EMAIL;
        a.textContent = PULGO_CONTACT_EMAIL;
        el.appendChild(a);
      }
    });
  });
})();
