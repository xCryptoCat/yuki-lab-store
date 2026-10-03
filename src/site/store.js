import '../index.js'; // defines <yukizo-hero>

/* ------------------------------------------------------------------
   Site settings — edit these
   ------------------------------------------------------------------ */
const CONTACT_EMAIL = 'sakuseed0327@gmail.com';

/* What the store manager says about each product (ja / en). */
const LINES = {
  welcome: {
    ja: 'いらっしゃいませ！店長の<strong>ユキゾウ</strong>です。棚の商品を{act}と、ぼくがご案内するゾウ。',
    en: "Welcome to Yuki Lab! I'm <strong>Yukizo</strong>, the store manager. {act} anything on the shelves and I'll tell you about it.",
  },
  act: { ja: { hover: 'ゆびさす', touch: 'タップする' }, en: { hover: 'Point at', touch: 'Tap' } },
  runner: {
    ja: '<strong>ユキゾウダッシュ</strong>！夜の地下鉄を全力で走るのは、ぼくだゾウ。ブラウザでもためし走りできるよ！',
    en: "<strong>Yukizo Dash</strong>! That's me, sprinting through the subway at night. You can even try it in your browser!",
  },
  sim: {
    ja: '<strong>ヒーローカンパニー</strong>。警備会社の社長になって、街のヒーローをめざすシミュレーションです。',
    en: '<strong>Hero Company</strong>: run a security firm and become the town\'s heroes.',
  },
  game: {
    ja: '<strong>オリジナルゲーム</strong>も受注制作中。販促ゲームや研修シミュレーションもおまかせ！',
    en: '<strong>Custom games</strong>, made to order: promo games, training sims and more.',
  },
  xlsx: {
    ja: '<strong>Excel</strong>の集計表やダッシュボード。めんどうな手作業を、関数でスッキリ！',
    en: '<strong>Excel</strong> trackers and dashboards. Formulas take care of the tedious bits.',
  },
  docx: {
    ja: '<strong>Word</strong>のマニュアルや提案書を、読みやすく整えます。',
    en: '<strong>Word</strong> manuals and proposals, laid out so they read easily.',
  },
  pptx: {
    ja: '<strong>PowerPoint</strong>で、伝わるプレゼン資料をつくります。',
    en: '<strong>PowerPoint</strong> decks that get your point across.',
  },
  music: {
    ja: '<strong>音楽制作</strong>。BGMもテーマソングもつくれるし、うちのレーベル<strong>Yuki Record</strong>からリリースもできるゾウ。♪',
    en: '<strong>Music</strong>: BGM, jingles, even a theme song, and we can release it on our own label, <strong>Yuki Record</strong>. ♪',
  },
  video: {
    ja: '<strong>動画制作</strong>。会社紹介からSNSのショート動画まで、企画からおまかせ！',
    en: '<strong>Video</strong>, from company films to social shorts. We can plan it all.',
  },
  edit: {
    ja: '<strong>動画編集</strong>。お手持ちの素材に、カットやテロップ、BGMを入れて仕上げます。',
    en: '<strong>Video editing</strong>: your footage, cut and finished with captions and music.',
  },
  lp: {
    ja: '<strong>ランディングページ</strong>。かっこいい系も、かわいい系も。作品例を見ていってほしいゾウ！',
    en: "<strong>Landing pages</strong>, cool or cute, built to turn visitors into enquiries. Come see some examples!",
  },
  site: {
    ja: '<strong>Webサイト</strong>。会社の顔を、スマホでも見やすく。',
    en: '<strong>Websites</strong> that represent you and look great on phones.',
  },
  mascot: {
    ja: '<strong>3Dキャラクター</strong>。ほら、ぼくみたいに動いて、目でカーソルを追いかけるゾウ！',
    en: '<strong>3D mascots</strong>, like me! I move, and my eyes follow your cursor.',
  },
  secapp: {
    ja: '<strong>セキュリティアプリ</strong>。警備の現場を知る Yuki Security グループの得意分野です。',
    en: '<strong>Security apps</strong>, our specialty thanks to Yuki Security\'s field experience.',
  },
  app: {
    ja: '<strong>業務アプリ</strong>。社内の「紙と電話」を、アプリでラクにします。',
    en: '<strong>Business apps</strong> that replace paper forms and phone calls.',
  },
  logo: {
    ja: '<strong>ロゴデザイン</strong>。ぼくの帽子の「Y」みたいに、ひと目でわかる顔をつくるゾウ。',
    en: "<strong>Logo design</strong>: a face people know at a glance, like the Y on my cap.",
  },
  uiux: {
    ja: '<strong>UI/UXデザイン</strong>。アプリやWebを、迷わず使える画面に設計します。',
    en: '<strong>UI/UX design</strong>: app and web screens nobody gets lost in.',
  },
  graphic: {
    ja: '<strong>デザイン全般</strong>。チラシやポスター、バナーもおまかせください！',
    en: '<strong>Graphic design</strong>: flyers, posters, banners and more.',
  },
  thanks: {
    ja: '<strong>スタンプコンプリート</strong>、ありがとうだゾウ！気になる商品があったら、なんでも聞いてね。',
    en: "You collected <strong>every stamp</strong> — thank you! Ask me about anything that caught your eye.",
  },
  salute: {
    ja: 'はいっ、敬礼！ご用命は<strong>ユキラボ</strong>へ！',
    en: 'Salute! For anything you need, call on <strong>Yuki Lab</strong>!',
  },
};
const HINT = {
  hover: { ja: 'クリックで売り場へ →', en: 'Click to visit the aisle →' },
  touch: { ja: 'もう一度タップで売り場へ →', en: 'Tap again to visit the aisle →' },
};
const META = {
  ja: {
    title: 'Yuki Lab Store｜ユキラボ ストア',
    description: 'Yuki Lab（ユキラボ）は Yuki Security のクリエイティブ部門。ゲーム、Excel・Word・PowerPoint 資料、音楽・動画制作、ロゴ・UI/UX デザイン、Webサイト、セキュリティアプリまで、店長ユキゾウがご案内します。',
  },
  en: {
    title: 'Yuki Lab Store — games, video, design, web & apps',
    description: 'Yuki Lab is the creative studio of Yuki Security. Games, Excel / Word / PowerPoint documents, music and video, logo and UI/UX design, websites and security apps, made to order with Yukizo the store manager as your guide.',
  },
};
const HERO_LABEL = {
  ja: 'ユキゾウ — Yuki Lab ストアの店長。水色のゾウのマスコット。Enterで敬礼します。',
  en: "Yukizo, the store manager of Yuki Lab: a light-blue elephant mascot in a navy officer's uniform. Press Enter to make him salute.",
};

const root = document.documentElement;
root.classList.add('js'); // (also set in <head>; see the safety net there)
window.__yukiReady = true;
const yukizo = document.getElementById('yukizo');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const canHover = matchMedia('(hover: hover) and (pointer: fine)'); // only picks the welcome wording
const lang = () => (root.lang === 'en' ? 'en' : 'ja');

/* ---------- speech bubble (typed out, announced once to screen readers) ---------- */
const bubbleLive = document.getElementById('bubble-live');
const bubbleHint = document.getElementById('bubble-hint');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 'welcome', idleTimer = 0, typeTimer = 0;

function lineFor(key) {
  const l = lang();
  let html = LINES[key][l];
  if (key === 'welcome') html = html.replace('{act}', LINES.act[l][canHover.matches ? 'hover' : 'touch']);
  return html;
}
/** Reveal `html` one character at a time, keeping <strong> runs intact. */
function typeOut(html) {
  clearInterval(typeTimer);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const runs = [...tpl.content.childNodes].map((n) => ({ strong: n.nodeName === 'STRONG', text: n.textContent }));
  const total = runs.reduce((a, r) => a + [...r.text].length, 0);
  const render = (n) => {
    let left = n, out = '';
    for (const r of runs) {
      const chars = [...r.text], part = chars.slice(0, Math.max(0, left)).join('');
      left -= chars.length;
      if (!part) break;
      const safe = part.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      out += r.strong ? `<strong>${safe}</strong>` : safe;
    }
    bubbleText.innerHTML = out;
  };
  if (reduceMotion.matches) { bubbleText.innerHTML = html; bubbleText.classList.remove('typing'); return 0; }
  let n = 0;
  bubbleText.classList.add('typing');
  const step = Math.max(1, Math.round(total / 60)); // long lines type a little faster
  const seconds = (Math.ceil(total / step) * 22) / 1000;
  typeTimer = setInterval(() => {
    n += step;
    render(n);
    if (n >= total) { clearInterval(typeTimer); bubbleText.innerHTML = html; bubbleText.classList.remove('typing'); }
  }, 22);
  return seconds;
}
function say(key, { pop = true, type = true, hint = '' } = {}) {
  current = key;
  const html = lineFor(key);
  if (type) {
    const seconds = typeOut(html);
    if (seconds) yukizo.talk(seconds + 0.12); // his mouth moves while the line types out
  } else { clearInterval(typeTimer); bubbleText.classList.remove('typing'); bubbleText.innerHTML = html; }
  bubbleLive.textContent = html.replace(/<[^>]+>/g, '');
  bubbleHint.textContent = hint;
  bubble.classList.remove('hide');
  if (pop && !reduceMotion.matches) {
    bubble.classList.remove('pop');
    void bubble.offsetWidth; // restart the animation
    bubble.classList.add('pop');
  }
  clearTimeout(idleTimer);
  if (key !== 'welcome') idleTimer = setTimeout(() => say('welcome'), 9000);
}
bubble.classList.add('hide');

/* ---------- arrival: loading state, greeting, no-WebGL fallback ---------- */
const loading = document.getElementById('manager-loading');
const hasWebGL = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context right away
    return !!gl;
  } catch (e) { return false; }
})();
function showFallback() {
  if (root.classList.contains('no-webgl')) return;
  root.classList.add('no-webgl');
  document.querySelector('.manager-fallback').hidden = false;
  loading.classList.add('done');
  say('welcome', { type: false });
  requestAnimationFrame(() => { stageRO.observe(document.querySelector('.manager-fallback')); placeStage(); });
}
yukizo.addEventListener('yukizo-error', showFallback);

/* stand Yukizo on his dais, and keep the bubble just above his head, however big the stage gets */
const manager = document.querySelector('.manager');
const spot = document.querySelector('.spot');
const dais = document.querySelector('.dais');
const DAIS_TOP = 0.28; // middle of the dais top, as a share of the dais height (.dais::before is 56% tall)
function placeStage() {
  if (root.classList.contains('no-webgl')) { // the photo stands in for him: the bubble sits just above it
    const img = document.querySelector('.manager-fallback');
    manager.style.setProperty('--head-y', `${Math.round(img.getBoundingClientRect().top - manager.getBoundingClientRect().top)}px`);
    manager.style.setProperty('--bubble-h', `${bubble.offsetHeight}px`);
    manager.classList.add('anchored');
    return;
  }
  const feet = yukizo.feet?.(), head = yukizo.headTop?.();
  if (!feet || !head) return;
  const d = dais.getBoundingClientRect();
  if (d.height) {
    const lift = spot.getBoundingClientRect().bottom - (d.top + d.height * DAIS_TOP);
    yukizo.style.marginBottom = `${Math.round(lift - (yukizo.clientHeight - feet.y))}px`;
  }
  const top = yukizo.getBoundingClientRect().top - manager.getBoundingClientRect().top;
  manager.style.setProperty('--head-y', `${Math.round(top + head.y)}px`);
  manager.style.setProperty('--bubble-h', `${bubble.offsetHeight}px`);
  manager.classList.add('anchored');
}
const stageRO = new ResizeObserver(() => requestAnimationFrame(placeStage));
stageRO.observe(yukizo);
stageRO.observe(dais);
stageRO.observe(bubble); // lines differ in length
if (!hasWebGL) {
  showFallback();
} else {
  yukizo.ready.then(() => {
    loading.classList.add('done');
    placeStage();
    // greet once he has popped in — unless a visitor already pointed at something
    setTimeout(() => { if (current === 'welcome' && bubble.classList.contains('hide')) say('welcome'); }, 1300);
  });
}

/* ---------- language ---------- */
function setLang(l) {
  root.lang = l;
  try { localStorage.setItem('yukilab-lang', l); } catch (e) {}
  yukizo.setAttribute('label', HERO_LABEL[l]);
  applyMeta(l);
  if (!bubble.classList.contains('hide')) say(current, { pop: false, type: false, hint: bubbleHint.textContent ? hintFor() : '' });
}
function syncLangButtons(l) {
  for (const b of document.querySelectorAll('[data-set-lang]')) b.setAttribute('aria-pressed', String(b.dataset.setLang === l));
}
function applyMeta(l) {
  syncLangButtons(l);
  document.title = META[l].title;
  document.querySelector('meta[name="description"]').setAttribute('content', META[l].description);
}
const hintFor = () => HINT[canHover.matches ? 'hover' : 'touch'][lang()];
for (const b of document.querySelectorAll('[data-set-lang]')) b.addEventListener('click', () => setLang(b.dataset.setLang));
yukizo.setAttribute('label', HERO_LABEL[lang()]);
applyMeta(lang());

/* ---------- shelf products: the manager presents them ---------- */
let lastPresent = -1e9;
function present(btn, fromFocus) {
  for (const p of document.querySelectorAll('.product.active')) p.classList.remove('active');
  btn.classList.add('active');
  say(btn.dataset.item, { hint: hintFor() });
  if (fromFocus) {
    const r = btn.getBoundingClientRect();
    yukizo.lookAt(r.left + r.width / 2, r.top + r.height / 2);
  }
  const now = performance.now();
  if (now - lastPresent > 3600) {
    lastPresent = now;
    yukizo.gesture('proud'); // open palm toward the shelves, fist on chest
  }
}
for (const btn of document.querySelectorAll('.product')) {
  btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') present(btn, false); });
  btn.addEventListener('pointerleave', () => btn.classList.remove('active'));
  btn.addEventListener('focus', () => present(btn, true));
  btn.addEventListener('blur', () => btn.classList.remove('active'));
  // touch: the first tap introduces the product, a second tap goes to its aisle.
  // (Read the state at pointerdown, because the tap's focus event already introduces it.)
  let touchIntro = false;
  btn.addEventListener('pointerdown', (e) => { touchIntro = e.pointerType !== 'mouse' && current !== btn.dataset.item; });
  btn.addEventListener('click', () => {
    if (touchIntro) {
      touchIntro = false;
      present(btn, false);
      revealBubble();
      return;
    }
    goToAisle(btn.dataset.aisle);
  });
}
/** Phones: if his bubble has scrolled up out of sight, bring it back so the tapped product's line can be read. */
function revealBubble() {
  const navH = document.querySelector('.nav').offsetHeight;
  const top = bubble.getBoundingClientRect().top;
  if (top < navH) window.scrollBy({ top: top - navH - 36, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}
/** Scroll to an aisle and move keyboard focus there too, so Tab continues from the aisle. */
function goToAisle(id) {
  const aisle = document.getElementById(id);
  if (!aisle) return;
  aisle.scrollIntoView({ block: 'start' });
  const h = aisle.matches('h2, h3') ? aisle : aisle.querySelector('h2, h3');
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

/* ---------- salutes ---------- */
yukizo.addEventListener('yukizo-salute', () => say('salute'));
document.getElementById('try-salute')?.addEventListener('click', () => {
  document.getElementById('top').scrollIntoView({ block: 'start' });
  const go = () => yukizo.salute();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) go();
  else setTimeout(go, 750);
});

/* ---------- floor-guide drawer (tablet & phone) ---------- */
const drawer = document.getElementById('drawer');
const menuBtn = document.getElementById('menu-btn');
// while open, everything behind the drawer is inert (unclickable, unfocusable, hidden from screen readers)
const behindDrawer = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.skip'),
  document.getElementById('sticky-cta'), document.getElementById('rally'), document.querySelector('.brand'), document.querySelector('.nav .lang'), document.querySelector('.nav-cta')];
function setMenu(open) {
  if (open === !drawer.hidden) return;
  drawer.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  root.classList.toggle('menu-open', open);
  for (const el of behindDrawer) el && (el.inert = open);
  if (open) drawer.querySelector('a').focus({ preventScroll: true });
}
menuBtn.addEventListener('click', () => setMenu(drawer.hidden));
drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close], a')) setMenu(false); });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); menuBtn.focus(); }
  if (e.key === 'Tab' && !drawer.hidden) { // cycle: menu button ↔ drawer items
    const f = [menuBtn, ...drawer.querySelectorAll('a, button')], i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
});
matchMedia('(min-width: 1121px)').addEventListener('change', (m) => m.matches && setMenu(false));

/* ---------- scrollspy: highlight the aisle you're in ---------- */
const spyLinks = [...document.querySelectorAll('[data-spy]')];
// every major section reports in; sections without a nav link (storefront, order, contact) clear the highlight
const spy = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      for (const a of spyLinks) {
        if (a.dataset.spy === en.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
for (const id of ['top', 'aisle-games', 'aisle-office', 'aisle-media', 'aisle-web', 'aisle-apps', 'aisle-design', 'manager', 'order', 'contact']) spy.observe(document.getElementById(id));

/* ---------- phone: sticky "ask the manager" once the storefront is gone ---------- */
const sticky = document.getElementById('sticky-cta');
let pastHero = false, atContact = false;
const syncSticky = () => {
  const show = pastHero && !atContact;
  sticky.classList.toggle('show', show);
  sticky.setAttribute('aria-hidden', String(!show));
  sticky.tabIndex = show ? 0 : -1;
};
new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; syncSticky(); }).observe(document.getElementById('top'));
new IntersectionObserver(([en]) => { atContact = en.isIntersecting; syncSticky(); }, { threshold: 0.15 }).observe(document.getElementById('contact'));

/* ---------- nav background once scrolled ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries)
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
        setTimeout(() => (en.target.style.transitionDelay = ''), 900); // keep hover effects snappy
      }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 70}ms`;
  io.observe(el);
});

/* ---------- contact ---------- */
for (const a of document.querySelectorAll('[data-need]'))
  a.addEventListener('click', () => {
    const box = document.querySelector(`#contact-form input[value="${a.dataset.need}"]`);
    if (box) box.checked = true;
  });

const NEEDS = {
  games: { ja: 'ゲーム', en: 'Games' },
  office: { ja: 'Excel・Word・PowerPoint', en: 'Excel / Word / PowerPoint' },
  media: { ja: '音楽・動画', en: 'Music & video' },
  web: { ja: 'LP・Webサイト', en: 'Landing pages & websites' },
  apps: { ja: 'アプリ', en: 'Apps' },
  design: { ja: 'ロゴ・UI/UX・デザイン', en: 'Logo, UI/UX & design' },
};
const mailLink = document.getElementById('mail-link');
mailLink.href = `mailto:${CONTACT_EMAIL}`;
mailLink.textContent = CONTACT_EMAIL;
const copyBtn = document.getElementById('copy-mail');
const copyLabel = copyBtn.innerHTML;
let copyTimer = 0;
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    copyBtn.classList.add('ok');
    copyBtn.innerHTML = '<span lang="ja">コピーしました</span><span lang="en">Copied</span>';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyBtn.classList.remove('ok'); copyBtn.innerHTML = copyLabel; }, 1800);
  } catch (e) {
    getSelection().selectAllChildren(mailLink);
  }
});
const form = document.getElementById('contact-form');
const err = document.getElementById('form-error');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const l = lang(), f = new FormData(form);
  const name = String(f.get('name') || '').trim(), message = String(f.get('message') || '').trim();
  const company = String(f.get('company') || '').trim();
  const nameInput = form.elements.namedItem('name'), messageInput = form.elements.namedItem('message');
  nameInput.setAttribute('aria-invalid', String(!name));
  messageInput.setAttribute('aria-invalid', String(!message));
  if (!name || !message) {
    err.textContent = l === 'ja' ? 'お名前とご相談内容を入力してください。' : 'Please enter your name and a message.';
    err.hidden = false;
    (name ? messageInput : nameInput).focus();
    return;
  }
  err.hidden = true;
  const needs = f.getAll('need').map((n) => NEEDS[n][l]).join(l === 'ja' ? '、' : ', ') || '—';
  const subject = l === 'ja' ? `【Yuki Lab ご相談】${needs}` : `Yuki Lab enquiry: ${needs}`;
  const body = l === 'ja'
    ? `お名前：${name}\n会社名：${company || '—'}\nご相談の内容：${needs}\n\n${message}\n`
    : `Name: ${name}\nCompany: ${company || '—'}\nInterested in: ${needs}\n\n${message}\n`;
  location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.getElementById('form-sent').hidden = false;
});

/* ---------- スタンプラリー: visit every aisle, collect a stamp from each ---------- */
const STAMPS = [
  ['games', 'aisle-games', { ja: 'ゲーム', en: 'Games' }],
  ['office', 'aisle-office', { ja: 'オフィス', en: 'Office' }],
  ['media', 'aisle-media', { ja: '音楽・動画', en: 'Music & video' }],
  ['web', 'aisle-web', { ja: 'Web', en: 'Web' }],
  ['apps', 'aisle-apps', { ja: 'アプリ', en: 'Apps' }],
  ['design', 'aisle-design', { ja: 'デザイン', en: 'Design' }],
];
const ALL = STAMPS.length;
const rally = document.getElementById('rally');
const rallyBtn = document.getElementById('rally-btn');
const rallyCard = document.getElementById('rally-card');
const toast = document.getElementById('toast');
let stamps = new Set();
try { stamps = new Set(JSON.parse(localStorage.getItem('yukilab-stamps') || '[]')); } catch (e) {}
let thanked = false;
try { thanked = localStorage.getItem('yukilab-thanked') === '1'; } catch (e) {}

function renderRally(fresh) {
  const n = stamps.size;
  document.getElementById('rally-count').textContent = `${n}/${ALL}`;
  rally.querySelectorAll('.rally-dots i').forEach((d, i) => d.classList.toggle('on', i < n));
  for (const li of rally.querySelectorAll('[data-stamp]')) {
    li.classList.toggle('on', stamps.has(li.dataset.stamp));
    li.classList.toggle('fresh', li.dataset.stamp === fresh);
    li.style.setProperty('--r', `${-18 + ((li.dataset.stamp.length * 7) % 16)}deg`); // each stamp lands a bit crooked
  }
  document.getElementById('rally-done').hidden = n < ALL;
  document.getElementById('rally-sub').hidden = n >= ALL;
}
let toastTimer = 0;
function showToast(html) {
  toast.innerHTML = html;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function award(key, label) {
  if (stamps.has(key)) return;
  stamps.add(key);
  try { localStorage.setItem('yukilab-stamps', JSON.stringify([...stamps])); } catch (e) {}
  renderRally(key);
  const l = lang(), n = stamps.size, done = n === ALL;
  const title = done
    ? (l === 'ja' ? 'スタンプコンプリート！' : 'Stamp card complete!')
    : (l === 'ja' ? `「${label.ja}」のスタンプをゲット！` : `${label.en} stamp collected!`);
  const sub = done ? (l === 'ja' ? 'ご来店ありがとうございます' : 'Thanks for visiting every aisle') : `${n}/${ALL}`;
  showToast(`<span class="toast-stamp" aria-hidden="true">ユ</span><span>${title}<small>${sub}</small></span>`);
}
renderRally();
const dwell = new Map();
const rallyIO = new IntersectionObserver((entries) => {
  for (const en of entries) {
    const [key, , label] = STAMPS.find(([, id]) => id === en.target.id);
    clearTimeout(dwell.get(key));
    if (en.isIntersecting) dwell.set(key, setTimeout(() => award(key, label), 900)); // a real visit, not a scroll-past
  }
}, { threshold: 0.35 });
for (const [, id] of STAMPS) rallyIO.observe(document.getElementById(id));

function setRallyCard(open) {
  rallyCard.hidden = !open;
  rallyBtn.setAttribute('aria-expanded', String(open));
}
rallyBtn.addEventListener('click', () => setRallyCard(rallyCard.hidden));
rallyCard.addEventListener('click', (e) => { if (e.target.closest('a')) setRallyCard(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !rallyCard.hidden) { setRallyCard(false); rallyBtn.focus(); } });
addEventListener('pointerdown', (e) => { if (!rallyCard.hidden && !rally.contains(e.target)) setRallyCard(false); });
// the card appears once the visitor has left the storefront; back at the storefront, a completed card earns a thank-you
new IntersectionObserver(([en]) => {
  if (!en.isIntersecting) rally.hidden = false;
  else if (stamps.size === ALL && !thanked && !root.classList.contains('no-webgl')) {
    thanked = true;
    try { localStorage.setItem('yukilab-thanked', '1'); } catch (e) {}
    setTimeout(() => { yukizo.salute(); say('thanks'); }, 600); // salute first: it announces its own line
  }
}, { threshold: 0.6 }).observe(document.getElementById('top'));

document.getElementById('year').textContent = new Date().getFullYear();
