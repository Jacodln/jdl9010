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
      listen: 'ฟัง',
      stopListen: 'หยุดฟัง',
      listenLabel: 'ฟังหน้านี้อ่านออกเสียง',
      textSmaller: 'ลดขนาดตัวอักษร',
      textBigger: 'เพิ่มขนาดตัวอักษร',
      noVoice: 'อุปกรณ์นี้ยังไม่มีเสียงอ่านภาษานี้',
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
      listen: 'Listen',
      stopListen: 'Stop',
      listenLabel: 'Read this page aloud',
      textSmaller: 'Smaller text',
      textBigger: 'Larger text',
      noVoice: 'This device has no voice for this language yet',
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

  /* ---- Reading tools: read aloud + text size ----
     SPEECH maps each language code to its speech-voice code.
     To add a language: add it to STRINGS and to SPEECH. */
  var SPEECH = { th: 'th-TH', en: 'en-US' };
  var synth = window.speechSynthesis || null;
  var FS_KEY = 'dl_fs';

  function getFs() {
    try {
      var v = parseInt(localStorage.getItem(FS_KEY), 10);
      if (v >= 80 && v <= 200) { return v; }
    } catch (e) { /* ignore */ }
    return 100;
  }

  function setFs(v) {
    v = Math.max(80, Math.min(200, v));
    try { localStorage.setItem(FS_KEY, String(v)); } catch (e) { /* ignore */ }
    var m = document.querySelector('main');
    if (m) { m.style.zoom = v / 100; }
  }

  function setSpeaking(on) {
    var b = document.getElementById('dlListen');
    if (!b) { return; }
    b.setAttribute('data-i18n', on ? 'stopListen' : 'listen');
    b.textContent = t(on ? 'stopListen' : 'listen');
  }

  function stopSpeech() {
    if (synth) { synth.cancel(); }
    setSpeaking(false);
  }

  function pickVoice(lang) {
    var code = (SPEECH[lang] || lang).toLowerCase();
    var voices = synth.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang.toLowerCase().replace('_', '-') === code) { return voices[i]; }
    }
    for (var j = 0; j < voices.length; j++) {
      if (voices[j].lang.toLowerCase().indexOf(lang) === 0) { return voices[j]; }
    }
    return null;
  }

  function speak() {
    if (!synth) { return; }
    if (synth.speaking) { stopSpeech(); return; }
    var main = document.querySelector('main');
    if (!main) { return; }
    var lang = getLang();
    var parts = main.innerText.split(/\n+/).filter(function (s) { return s.trim(); });
    var voice = pickVoice(lang);
    parts.forEach(function (text, idx) {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH[lang] || lang;
      if (voice) { u.voice = voice; }
      if (idx === parts.length - 1) { u.onend = function () { setSpeaking(false); }; }
      u.onerror = function () { setSpeaking(false); };
      synth.speak(u);
    });
    setSpeaking(true);
  }

  function makeButton(id, key, labelKey, handler) {
    var b = document.createElement('button');
    b.type = 'button';
    if (id) { b.id = id; }
    b.setAttribute('data-i18n', key);
    b.setAttribute('data-i18n-label', labelKey);
    b.style.cssText = 'min-height:44px;min-width:48px;padding:8px 14px;font:inherit;color:inherit;background:transparent;border:1px solid #999;border-radius:8px;cursor:pointer';
    b.addEventListener('click', handler);
    return b;
  }

  function buildTools() {
    var main = document.querySelector('main');
    if (!main || document.getElementById('dlTools')) { return; }
    var bar = document.createElement('div');
    bar.id = 'dlTools';
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px';
    if (synth) { bar.appendChild(makeButton('dlListen', 'listen', 'listenLabel', speak)); }
    var small = makeButton('', 'A-', 'textSmaller', function () { setFs(getFs() - 10); });
    var big = makeButton('', 'A+', 'textBigger', function () { setFs(getFs() + 10); });
    small.removeAttribute('data-i18n'); small.textContent = 'A-';
    big.removeAttribute('data-i18n'); big.textContent = 'A+';
    bar.appendChild(small);
    bar.appendChild(big);
    main.insertBefore(bar, main.firstChild);
    setFs(getFs());
  }

  onLangChange(function () { if (synth) { stopSpeech(); } });
  window.addEventListener('pagehide', function () { if (synth) { synth.cancel(); } });

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
    buildTools();
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
