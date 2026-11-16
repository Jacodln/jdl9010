/* Deep Listening Training - app.js
   Step 0: shared language layer (Thai / English) used by every page.
   Later modules (participant, coach, manual) plug in through window.DL. */
(function () {
  'use strict';

  var STORAGE_KEY = 'dl_lang';
  var DEFAULT_LANG = 'th';

  var STRINGS = {
    th: {
      appName: 'Deep Listening Training',
      langButton: 'EN',
      langLabel: 'เปลี่ยนเป็นภาษาอังกฤษ',
      navParticipant: 'ผู้ฝึก',
      navCoach: 'โค้ช',
      navManual: 'คู่มือ',
      participantTitle: 'หน้าผู้ฝึก',
      coachTitle: 'หน้าโค้ช',
      manualTitle: 'หน้าคู่มือ',
      placeholder: 'หน้านี้อยู่ระหว่างการสร้าง',
      intro: 'Deep Listening Training คือการฟังอย่างลึกซึ้ง หรือฟังให้ได้ยินในสิ่งที่เขาไม่ได้พูด โปรแกรมนี้ยืนและสนับสนุนให้คุณได้ผลลัพธ์ในสิ่งที่คุณต้องการ เป็นมากกว่า Deep Listening เชื้อเชิญให้คุณใช้โปรแกรมนี้เป็นเครื่องมือทดสอบ performance ของคุณ'
    },
    en: {
      appName: 'Deep Listening Training',
      langButton: 'ไทย',
      langLabel: 'Switch to Thai',
      navParticipant: 'Participant',
      navCoach: 'Coach',
      navManual: 'Manual',
      participantTitle: 'Participant page',
      coachTitle: 'Coach page',
      manualTitle: 'Manual page',
      placeholder: 'This page is under construction',
      intro: 'Deep Listening Training is deep listening: hearing what is not said. This program stands with you and supports you in getting the results you want. It is more than deep listening. We invite you to use this program as a tool to test your own performance.'
    }
  };

  var listeners = [];

  function getLang() {
    var lang = DEFAULT_LANG;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS[saved]) { lang = saved; }
    } catch (e) { /* storage unavailable: use default */ }
    return lang;
  }

  function t(key) {
    var lang = getLang();
    var table = STRINGS[lang] || STRINGS[DEFAULT_LANG];
    if (table[key] !== undefined) { return table[key]; }
    return STRINGS[DEFAULT_LANG][key] !== undefined ? STRINGS[DEFAULT_LANG][key] : key;
  }

  function apply() {
    var lang = getLang();
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }

    var labelled = document.querySelectorAll('[data-i18n-label]');
    for (var j = 0; j < labelled.length; j++) {
      labelled[j].setAttribute('aria-label', t(labelled[j].getAttribute('data-i18n-label')));
    }

    for (var k = 0; k < listeners.length; k++) {
      try { listeners[k](lang); } catch (e) { /* one module must not break the others */ }
    }
  }

  function setLang(lang) {
    if (!STRINGS[lang]) { return; }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    apply();
  }

  function toggleLang() {
    setLang(getLang() === 'th' ? 'en' : 'th');
  }

  /* Modules add their own texts: DL.addStrings('th', { key: 'value' }) */
  function addStrings(lang, extra) {
    if (!STRINGS[lang]) { return; }
    for (var key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) { STRINGS[lang][key] = extra[key]; }
    }
    apply();
  }

  function onLangChange(fn) {
    if (typeof fn === 'function') { listeners.push(fn); }
  }

  window.DL = {
    t: t,
    getLang: getLang,
    setLang: setLang,
    addStrings: addStrings,
    onLangChange: onLangChange
  };

  function start() {
    var btn = document.getElementById('langToggle');
    if (btn) { btn.addEventListener('click', toggleLang); }
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
