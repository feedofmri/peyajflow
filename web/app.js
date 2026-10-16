(() => {
'use strict';

// ─── Data ────────────────────────────────────────────────────────────────
const BN = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const INR = n => n.toLocaleString('en-IN');
const LOTS = [
  { id: 'karim', name: 'করিম মিয়া', qty: 40, price: 1300, km: 3, x: 200, y: 40 },
  { id: 'rafiq', name: 'রফিক', qty: 35, price: 1280, km: 5, x: 110, y: 22 },
  { id: 'selina', name: 'সেলিনা', qty: 30, price: 1320, km: 6, x: 250, y: 96 },
  { id: 'habib', name: 'হাবিব', qty: 30, price: 1300, km: 8, x: 140, y: 108 },
];
const ORDER_NEED = 134; // 5 tonnes ≈ 134 maunds
const ROLES = [
  { id: 'farmer', bn: 'কৃষক', en: 'Farmer', icon: 'ph-duotone ph-plant', line: 'ন্যায্য দামে পেঁয়াজ বিক্রি করুন' },
  { id: 'middleman', bn: 'ব্যাপারী', en: 'Middleman', icon: 'ph-duotone ph-truck', line: 'মজুদ খুঁজুন, অর্ডার পূরণ করুন' },
  { id: 'buyer', bn: 'ক্রেতা', en: 'Buyer', icon: 'ph-duotone ph-storefront', line: 'গ্রেড করা পেঁয়াজ সরাসরি কিনুন' },
];
const FLOWS = {
  smart: [
    { id: 'full', bn: 'সম্পূর্ণ ডেমো', en: 'The whole story, in stage order', screens: ['S01', 'S01b', 'S02', 'F01', 'F02', 'F02b', 'F03', 'F04', 'B01', 'M01', 'M02', 'F05', 'D01f', 'F06', 'F06b'] },
    { id: 'signin', bn: 'সাইন ইন ও ভূমিকা', en: 'Login with OTP and choose a role', screens: ['S01', 'S01b', 'S02'] },
    { id: 'smart', bn: 'কৃষক · স্মার্ট প্রাইস', en: 'Karim checks the fair price and grades his onions', screens: ['F01', 'F02', 'F02b', 'F03'] },
    { id: 'sell', bn: 'কৃষক · বিক্রি ও ডিল', en: 'Karim posts 40 maunds and accepts an offer', screens: ['F04', 'F05', 'D01f'] },
    { id: 'middleman', bn: 'ব্যাপারী · অর্ডার পূরণ', en: 'Rahim combines four lots into one truck', screens: ['M01', 'M02', 'D01m'] },
    { id: 'buyer', bn: 'ক্রেতা · চাহিদা ও অর্ডার', en: 'Nadia posts demand and tracks her order', screens: ['B01', 'B02', 'D01b'] },
    { id: 'alert', bn: '৪ সপ্তাহ পর · দামের সতর্কতা', en: 'Price hits ৳1,650; Karim sells the rest', screens: ['F06', 'F06b'] },
  ],
  basic: [
    { id: 'sms-deal', bn: 'SMS-এ অফার ও ডিল', en: 'Offer arrives, Karim replies ১, deal confirmed', screens: ['P1', 'P2', 'P3', 'P4'] },
    { id: 'sms-alert', bn: 'সাপ্তাহিক দামের খবর', en: 'Weekly price and advice by SMS', screens: ['P5'] },
  ],
};
const FLOW_BY_ID = {};
Object.values(FLOWS).flat().forEach(f => { FLOW_BY_ID[f.id] = f; });
const CAP = { S01: 'S01 · Login', S01b: 'S01 · OTP', S02: 'S02 · Role selection', F01: 'F01 · Farmer home', F02: 'F02 · Photo grade', F02b: 'F02 · Analysing', F03: 'F03 · Grade result', F04: 'F04 · Post stock', B01: 'B01 · Post demand', M01: 'M01 · Nearby stock and orders', M02: 'M02 · Combine and offer', F05: 'F05 · Offer received', D01f: 'D01 · Deal done (farmer)', D01m: 'D01 · Deal done (middleman)', D01b: 'D01 · Deal done (buyer)', F06: 'F06 · Price alert', F06b: 'F06 · Sell now', B02: 'B02 · Buyer orders', P1: 'P01 · New message', P2: 'P01 · Offer SMS', P3: 'P01 · Reply ১', P4: 'P01 · Confirmation SMS', P5: 'P01 · Weekly price alert' };

// Variants the design exposed as tweaks. Override with ?advice=sell|part and ?otp=error|loading.
const params = new URLSearchParams(location.search);
const ADVICE = ['wait', 'sell', 'part'].includes(params.get('advice')) ? params.get('advice') : 'wait';
const OTP = ['filled', 'error', 'loading'].includes(params.get('otp')) ? params.get('otp') : 'filled';

// ─── State ───────────────────────────────────────────────────────────────
const state = {
  mode: 'smart', flow: null, idx: 0,
  role: 'farmer', qty: 40, pickup: 'home', posted: false,
  sel: { karim: true, rafiq: true, selina: true, habib: true },
  tab: 'stock', mapOpen: false, grade: 'A',
  pay: { bKash: true, Nagad: false, Bank: false }, offersSent: false,
};
try {
  const s = JSON.parse(localStorage.getItem('pf-demo') || 'null');
  if (s && FLOW_BY_ID[s.flow]) Object.assign(state, { mode: s.mode, flow: s.flow, idx: s.idx || 0 });
  else if (s && FLOWS[s.mode]) state.mode = s.mode;
} catch (e) {}

const curFlow = () => FLOW_BY_ID[state.flow] || null;
const curScreen = () => { const f = curFlow(); return f ? f.screens[Math.min(state.idx, f.screens.length - 1)] : null; };
const nextFlowOf = id => { const l = FLOWS[state.mode]; return l[l.findIndex(f => f.id === id) + 1] || null; };

let timers = { auto: 0, adv: 0, toast: 0 };
let lastKey = null, enteredAt = 0;

function set(patch) {
  Object.assign(state, typeof patch === 'function' ? patch(state) : patch);
  render();
}

function go(d) {
  const f = curFlow(); if (!f) return;
  const n = state.idx + d;
  if (n >= f.screens.length) {
    const nf = nextFlowOf(f.id);
    set(nf ? { flow: nf.id, idx: 0 } : { flow: null, idx: 0 });
    window.scrollTo(0, 0);
    return;
  }
  set({ idx: Math.max(0, n) });
}

// ─── Shared screen parts ─────────────────────────────────────────────────
const SHADOW = '0 24px 60px -24px rgba(62,26,76,.35),0 0 0 1px rgba(62,26,76,.08)';
const shell = (label, inner, extra = '') =>
  `<div data-screen-label="${label}" style="width:360px;height:800px;background:#FAF7FB;border-radius:32px;overflow:hidden;box-shadow:${SHADOW};display:flex;flex-direction:column;${extra}">${inner}</div>`;
const status = (time = '9:41', wifi = true) =>
  `<div style="height:32px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;flex-shrink:0;position:relative"><span>${time}</span><span style="display:flex;gap:5px"><i class="ph-fill ph-cell-signal-full"></i>${wifi ? '<i class="ph-fill ph-wifi-high"></i>' : ''}<i class="ph-fill ph-battery-full"></i></span></div>`;
const lang = (fs, pad) =>
  `<div style="display:flex;background:#F0E8F4;border-radius:999px;padding:3px;font-size:${fs}px;font-weight:600"><span style="padding:${pad};border-radius:999px;background:#fff;color:#5B2A6E;box-shadow:0 1px 2px rgba(0,0,0,.08)">বাংলা</span><span style="padding:${pad};color:#6B5E73">EN</span></div>`;
const backBar = title =>
  `<div style="height:48px;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:18px;font-weight:700;flex-shrink:0"><i class="ph ph-arrow-left" style="padding:8px;font-size:22px"></i>${title}</div>`;
const primary = (label, { next = 'fast', action = '', h = 52, bg = '#5B2A6E', fs = 17, fw = 600, extra = '' } = {}) =>
  `<div data-next="${next}"${action ? ` data-action="${action}"` : ''} style="height:${h}px;border-radius:14px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-size:${fs}px;font-weight:${fw};${extra}">${label}</div>`;
const sub = t => `<span style="font-weight:400;opacity:.8;font-size:14px">· ${t}</span>`;
const spinner = (size, color) =>
  `<span style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${color};border-top-color:transparent;display:inline-block;box-sizing:border-box;animation:pfspin 0.8s linear infinite"></span>`;
const photo = (label, style) =>
  `<div style="${style};background:repeating-linear-gradient(45deg,#E9DFEE 0 6px,#F3ECF6 6px 12px);display:flex;align-items:flex-end;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:#8A7D92;box-sizing:border-box">${label}</div>`;

const NAV = {
  farmer: [['house', 'হোম'], ['package', 'আমার মজুদ'], ['handshake', 'অফার'], ['user-circle', 'প্রোফাইল']],
  middleman: [['map-trifold', 'বাজার'], ['receipt', 'অর্ডার'], ['handshake', 'ডিল'], ['user-circle', 'প্রোফাইল']],
  buyer: [['plus-circle', 'চাহিদা'], ['receipt', 'অর্ডার'], ['handshake', 'ডিল'], ['user-circle', 'প্রোফাইল']],
};
// One bottom bar per role, identical on every in-app screen; only the active tab changes.
const nav = (role, active) =>
  `<div style="height:64px;flex-shrink:0;background:#fff;border-top:1px solid #EEE6F2;display:flex">${NAV[role].map(([icon, label], i) => {
    const on = i === active;
    const badge = role === 'farmer' && i === 2 && !on
      ? '<span style="position:absolute;top:8px;left:52px;background:#C62828;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center">১</span>' : '';
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;position:relative;color:${on ? '#5B2A6E' : '#6B5E73'};font-weight:${on ? 600 : 400}"><i class="${on ? 'ph-fill' : 'ph'} ph-${icon}" style="font-size:24px"></i>${label}${badge}</div>`;
  }).join('')}</div>`;

const farmerGreeting = () =>
  `<div style="padding:6px 18px 10px;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0">
    <div style="display:flex;flex-direction:column;gap:6px"><div style="font-size:18px;font-weight:700">আসসালামু আলাইকুম, করিম ভাই</div><div style="display:flex;gap:4px;align-items:center;font-size:14px;color:#5B2A6E;background:#F0E8F4;padding:3px 10px;border-radius:999px;align-self:flex-start;font-weight:500"><i class="ph-fill ph-map-pin"></i>সাঁথিয়া, পাবনা</div></div>
    ${lang(12, '3px 9px')}
  </div>`;

const avatar = (size, fs) =>
  `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#F0E8F4;color:#5B2A6E;display:flex;align-items:center;justify-content:center;${fs ? `font-size:${fs}px;` : ''}font-weight:700">র</div>`;
const verified = '<span style="display:flex;gap:3px;align-items:center;color:#1B5E20;font-weight:600"><i class="ph-fill ph-seal-check"></i>যাচাইকৃত</span><span style="display:flex;gap:3px;align-items:center"><i class="ph-fill ph-star" style="color:#F9A825"></i>4.7 (৩২ ডিল)</span>';

// ─── Smartphone screens ──────────────────────────────────────────────────
const S = {};

S.S01 = () => shell('S01 Login', `
  ${status()}
  <div style="flex:1;display:flex;flex-direction:column;padding:56px 24px 0;gap:40px">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="width:72px;height:72px;border-radius:20px;background:#fff;box-shadow:0 0 0 1px #EEE6F2,0 6px 16px -6px rgba(91,42,110,.3);display:flex;align-items:center;justify-content:center"><img src="assets/peyajflow-icon.png" alt="PeyajFlow" style="width:46px;height:52px;object-fit:contain;display:block"></div>
      <div style="font-size:32px;font-weight:700;letter-spacing:-0.02em;color:#5B2A6E">PeyajFlow</div>
      <div style="display:flex;flex-direction:column;gap:2px"><div style="font-size:20px;font-weight:600">ন্যায্য দামে পেঁয়াজ, সরাসরি</div><div style="font-size:14px;color:#6B5E73">Fair price, direct</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="font-size:16px;font-weight:600">মোবাইল নম্বর <span style="font-weight:400;color:#6B5E73;font-size:14px">· Mobile number</span></div>
      <div style="display:flex;height:56px;border-radius:14px;background:#fff;box-shadow:0 0 0 2px #5B2A6E;overflow:hidden">
        <div style="padding:0 14px;display:flex;align-items:center;font-size:18px;font-weight:600;color:#6B5E73;background:#F3ECF6">+88</div>
        <div style="flex:1;display:flex;align-items:center;padding:0 14px;font-size:18px;letter-spacing:0.04em">01711-<span style="color:#A99BB2">XXXXXX</span><span style="width:2px;height:22px;background:#5B2A6E;margin-left:2px"></span></div>
      </div>
      <div style="font-size:14px;color:#6B5E73">পাসওয়ার্ড লাগবে না। SMS-এ কোড যাবে।</div>
    </div>
  </div>
  <div style="padding:16px 24px 20px;display:flex;flex-direction:column;gap:16px">
    ${primary(`OTP পাঠান ${sub('Send OTP')}`)}
    <div style="display:flex;justify-content:center">${lang(14, '6px 16px')}</div>
  </div>`, 'position:relative');

S.S01b = () => {
  const err = OTP === 'error', loading = OTP === 'loading';
  const digits = err ? ['৪', '৮', '২', '১'] : ['৪', '৮', '২', '৬'];
  const ring = err ? '0 0 0 2px #C62828' : '0 0 0 2px #5B2A6E';
  return shell('S01 OTP', `
  ${status()}
  <div style="height:52px;display:flex;align-items:center;padding:0 12px;font-size:24px"><i class="ph ph-arrow-left" style="padding:10px"></i></div>
  <div style="flex:1;display:flex;flex-direction:column;padding:20px 24px 0;gap:32px">
    <div style="display:flex;flex-direction:column;gap:6px"><div style="font-size:26px;font-weight:700">কোড দিন</div><div style="font-size:16px;color:#6B5E73;line-height:1.5">+88 01711-XXXXXX নম্বরে ৪ সংখ্যার কোড পাঠানো হয়েছে</div><div style="font-size:14px;color:#6B5E73">Enter the 4-digit code · auto-read from SMS</div></div>
    <div style="display:flex;gap:12px">${digits.map(d => `<div style="width:64px;height:68px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;box-shadow:${ring}">${d}</div>`).join('')}</div>
    ${err ? '<div style="display:flex;gap:8px;align-items:center;color:#C62828;font-size:16px;font-weight:500;margin-top:-16px"><i class="ph-fill ph-warning-circle" style="font-size:20px"></i><span>ভুল কোড, আবার চেষ্টা করুন · Wrong code</span></div>' : ''}
    <div style="font-size:15px;color:#6B5E73;display:flex;gap:6px;align-items:center"><i class="ph ph-clock"></i>আবার পাঠান ৩০ সেকেন্ডে · Resend in 30s</div>
  </div>
  <div style="padding:16px 24px 20px;display:flex;flex-direction:column;gap:16px">
    ${primary(loading ? `<span style="display:flex;gap:10px;align-items:center">${spinner(18, '#fff')}যাচাই হচ্ছে…</span>` : `<span>যাচাই করুন ${sub('Verify')}</span>`, { extra: 'gap:10px' })}
    <div style="display:flex;justify-content:center">${lang(14, '6px 16px')}</div>
  </div>`);
};

S.S02 = () => shell('S02 Role', `
  ${status()}
  <div style="height:52px;display:flex;align-items:center;justify-content:flex-end;padding:0 20px">${lang(13, '4px 12px')}</div>
  <div style="flex:1;display:flex;flex-direction:column;padding:16px 20px 0;gap:24px">
    <div style="display:flex;flex-direction:column;gap:4px;padding:0 4px"><div style="font-size:30px;font-weight:700">আপনি কে?</div><div style="font-size:15px;color:#6B5E73">Who are you?</div></div>
    <div style="display:flex;flex-direction:column;gap:14px">
      ${ROLES.map(r => {
        const s = state.role === r.id;
        return `<div data-action="role:${r.id}" style="display:flex;gap:16px;align-items:center;padding:18px;border-radius:18px;background:#fff;box-shadow:${s ? '0 0 0 2.5px #5B2A6E' : '0 0 0 1px #E6DDEB'};cursor:pointer;position:relative">
          <div style="width:60px;height:60px;border-radius:16px;background:#F0E8F4;color:#5B2A6E;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0"><i class="${r.icon}"></i></div>
          <div style="display:flex;flex-direction:column;gap:3px;flex:1"><div style="font-size:20px;font-weight:700">${r.bn} <span style="font-size:14px;font-weight:500;color:#6B5E73">/ ${r.en}</span></div><div style="font-size:15px;color:#4A3D52;line-height:1.4">${r.line}</div></div>
          <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;background:${s ? '#5B2A6E' : 'transparent'};box-shadow:${s ? 'none' : 'inset 0 0 0 2px #D9C6E2'}"><i class="ph-bold ph-check"></i></div>
        </div>`;
      }).join('')}
    </div>
  </div>
  <div style="padding:16px 20px 24px">${primary(`শুরু করুন ${sub('Start')}`)}</div>`);

const ADVICE_CARDS = {
  wait: { ring: '#F3DFA6', chipBg: '#F9A825', chipFg: '#3D2A00', icon: 'ph-hourglass-medium', label: 'অপেক্ষা করুন', conf: 'নিশ্চয়তা: উচ্চ · High', reason: 'আগামী ৩–৪ সপ্তাহে দাম বাড়তে পারে', tipBg: '#FEF6E0', tipFg: '#5C3F00', tip: '৪০ মণ এখন বিক্রি, ৬০ মণ রাখুন' },
  sell: { ring: '#BFDDC1', chipBg: '#2E7D32', chipFg: '#fff', icon: 'ph-check-circle', label: 'এখন বিক্রি করুন', conf: 'নিশ্চয়তা: উচ্চ · High', reason: 'দাম এখন সর্বোচ্চের কাছাকাছি, সামনে কমতে পারে', tipBg: '#E6F2E7', tipFg: '#1B5E20', tip: '১০০ মণ এখন বিক্রি করুন' },
  part: { ring: '#D9C6E2', chipBg: '#5B2A6E', chipFg: '#fff', icon: 'ph-chart-pie-slice', label: 'আংশিক বিক্রি', conf: 'নিশ্চয়তা: মাঝারি · Medium', reason: 'দাম স্থির, কিছু বিক্রি করে বাকিটা রাখুন', tipBg: '#F0E8F4', tipFg: '#3E1A4C', tip: '৪০ মণ এখন বিক্রি, ৬০ মণ রাখুন' },
};

S.F01 = () => {
  const a = ADVICE_CARDS[ADVICE];
  return shell('F01 Farmer home', `
  ${status()}
  ${farmerGreeting()}
  <div style="flex:1;overflow:auto;padding:4px 16px 12px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#5B2A6E;color:#fff;border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:15px;opacity:.85">আজকের ন্যায্য দাম · Today's fair price</div>
      <div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:32px;font-weight:700;letter-spacing:-0.01em">৳1,250–1,350</span><span style="font-size:17px;opacity:.85">/ মণ</span></div>
      <div style="display:flex;gap:10px;align-items:center;font-size:14px"><span style="display:flex;align-items:center;gap:3px;background:#E6F2E7;color:#1B5E20;padding:2px 8px;border-radius:999px;font-weight:600"><i class="ph-bold ph-trend-up"></i>বাড়ছে</span><span style="opacity:.85">গতকাল ৳1,220 · Yesterday</span></div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;box-shadow:0 0 0 1px ${a.ring}">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:6px;align-items:center;background:${a.chipBg};color:${a.chipFg};padding:5px 12px;border-radius:999px;font-size:16px;font-weight:700"><i class="ph-fill ${a.icon}"></i>${a.label}</span><span style="font-size:13px;color:#6B5E73;font-weight:500">${a.conf}</span></div>
      <div style="font-size:16px;line-height:1.45">${a.reason}</div>
      <div style="display:flex;gap:8px;align-items:center;background:${a.tipBg};border-radius:12px;padding:8px 10px;font-size:16px;font-weight:600;color:${a.tipFg}"><i class="ph-fill ph-lightbulb"></i>${a.tip}</div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:12px 14px 8px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between;font-size:14px"><span style="font-weight:600">৬ সপ্তাহের দাম</span><span style="display:flex;gap:10px;color:#6B5E73;font-size:12px"><span style="display:flex;gap:4px;align-items:center"><span style="width:14px;height:2px;background:#5B2A6E"></span>আগে</span><span style="display:flex;gap:4px;align-items:center"><span style="width:14px;border-top:2px dashed #2E7D32"></span>পূর্বাভাস</span></span></div>
      <svg viewBox="0 0 300 112" width="300" height="104" style="display:block">
        <line x1="0" y1="71.7" x2="300" y2="71.7" stroke="#EEE6F2"></line><line x1="0" y1="33" x2="300" y2="33" stroke="#EEE6F2"></line>
        <polygon points="194,61.4 240,38.3 286,21.6 286,44.7 240,53.7" fill="#2E7D32" fill-opacity="0.12"></polygon>
        <polyline points="10,89.7 56,84.6 102,78.1 148,71.7 194,61.4" fill="none" stroke="#5B2A6E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
        <polyline points="194,61.4 240,46 286,33.1" fill="none" stroke="#2E7D32" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"></polyline>
        <circle cx="194" cy="61.4" r="5" fill="#5B2A6E" stroke="#fff" stroke-width="2"></circle>
        <text x="194" y="108" font-size="11" text-anchor="middle" fill="#5B2A6E" font-weight="600" font-family="Hind Siliguri">আজ</text>
        <text x="10" y="108" font-size="11" fill="#8A7D92" font-family="Hind Siliguri">৪ সপ্তাহ আগে</text>
        <text x="286" y="108" font-size="11" text-anchor="end" fill="#8A7D92" font-family="Hind Siliguri">+২</text>
        <text x="298" y="29" font-size="10" text-anchor="end" fill="#8A7D92">1,500</text><text x="298" y="68" font-size="10" text-anchor="end" fill="#8A7D92">1,200</text>
      </svg>
    </div>
    <div style="background:#fff;border-radius:18px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;gap:10px;align-items:center"><i class="ph-duotone ph-warehouse" style="font-size:26px;color:#5B2A6E"></i><div style="font-size:16px;font-weight:600">আমার মজুদ: ১০০ মণ</div></div>
      <div style="display:flex;gap:4px;align-items:center;font-size:15px;font-weight:600;color:#5B2A6E;padding:6px 12px;border-radius:10px;box-shadow:0 0 0 1.5px #5B2A6E"><i class="ph ph-seal-check"></i>Grade</div>
    </div>
  </div>
  <div style="padding:10px 16px 10px;display:flex;flex-direction:column;gap:8px;flex-shrink:0;background:#FAF7FB">
    ${primary('<i class="ph-fill ph-camera" style="font-size:22px"></i>পেঁয়াজের ছবি তুলুন')}
    <div style="height:44px;border-radius:14px;color:#5B2A6E;display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;font-weight:600;box-shadow:0 0 0 1.5px #D9C6E2"><i class="ph ph-storefront"></i>বিক্রির জন্য দিন</div>
  </div>
  ${nav('farmer', 0)}`);
};

S.F02 = () => `<div data-screen-label="F02 Camera" style="width:360px;height:800px;background:#16101A;border-radius:32px;overflow:hidden;box-shadow:0 24px 60px -24px rgba(62,26,76,.35);display:flex;flex-direction:column;color:#fff;position:relative">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,#221A27 0 10px,#1C1520 10px 20px)"></div>
  <div style="position:absolute;left:50%;top:330px;transform:translate(-50%,-50%);font-family:'JetBrains Mono',monospace;font-size:11px;color:#6E6176">live camera feed</div>
  ${status()}
  <div style="position:relative;display:flex;justify-content:space-between;align-items:center;padding:8px 16px">
    <div style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:22px"><i class="ph ph-x"></i></div>
    <div style="background:rgba(0,0,0,.55);padding:8px 16px;border-radius:999px;font-size:16px;font-weight:600">ছবি ১/৩</div>
    <div style="height:44px;padding:0 12px;border-radius:22px;background:rgba(0,0,0,.45);display:flex;align-items:center;gap:4px;font-size:13px"><i class="ph-fill ph-lightning" style="font-size:20px;color:#F9A825"></i>ফ্ল্যাশ</div>
  </div>
  <div style="position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px">
    <div style="width:270px;height:270px;border-radius:50%;border:3px dashed rgba(255,255,255,.85);box-shadow:0 0 0 2000px rgba(0,0,0,.25)"></div>
    <div style="background:rgba(0,0,0,.6);padding:12px 18px;border-radius:14px;font-size:17px;font-weight:500;text-align:center;line-height:1.45;max-width:280px">১০–১৫টি পেঁয়াজ একসাথে রেখে ছবি তুলুন<div style="font-size:13px;opacity:.75">Place 10–15 onions together</div></div>
  </div>
  <div style="position:relative;padding:20px 32px 40px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.5)">
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px"><div style="width:48px;height:48px;border-radius:12px;background:#3A2E40;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:22px"><i class="ph ph-images"></i></div>গ্যালারি</div>
    <div data-next="fast" style="width:80px;height:80px;border-radius:50%;border:4px solid #fff;display:flex;align-items:center;justify-content:center"><div style="width:64px;height:64px;border-radius:50%;background:#fff"></div></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px"><div style="width:48px;height:48px;border-radius:50%;background:#3A2E40;display:flex;align-items:center;justify-content:center;font-size:22px"><i class="ph ph-camera-rotate"></i></div>ঘোরান</div>
  </div>
</div>`;

S.F02b = () => shell('F02 Analysing', `
  ${status()}
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:0 32px">
    <div style="display:flex;gap:8px">${[1, 2, 3].map(n => photo('photo ' + n, 'width:84px;height:84px;border-radius:14px;padding-bottom:6px')).join('')}</div>
    <div style="color:#5B2A6E">${spinner(44, '#5B2A6E')}</div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center"><div style="font-size:24px;font-weight:700">বিশ্লেষণ হচ্ছে…</div><div style="font-size:15px;color:#6B5E73">Analysing size, neck and sprouting</div></div>
    <div style="width:220px;height:6px;border-radius:3px;background:#EEE6F2;overflow:hidden"><div style="width:65%;height:100%;background:#5B2A6E;border-radius:3px"></div></div>
  </div>`);

const check = (t, warn) => `<div style="display:flex;gap:6px;align-items:center;font-size:16px"><i class="ph-fill ${warn ? 'ph-warning' : 'ph-check-circle'}" style="color:${warn ? '#C77A00' : '#2E7D32'};font-size:20px"></i>${t}</div>`;

S.F03 = () => shell('F03 Grade result', `
  ${status()}
  ${backBar('গ্রেড ফলাফল')}
  <div style="flex:1;overflow:auto;padding:0 16px 12px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;gap:8px">${[1, 2, 3].map(n => photo('photo ' + n, 'flex:1;height:64px;border-radius:12px;padding-bottom:4px')).join('')}</div>
    <div style="background:#fff;border-radius:20px;padding:16px;display:flex;gap:16px;align-items:center">
      <div style="width:88px;height:88px;border-radius:22px;background:#2E7D32;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0"><div style="font-size:12px;font-weight:600;letter-spacing:.08em;opacity:.9">GRADE</div><div style="font-size:44px;font-weight:700;line-height:1">A</div></div>
      <div style="display:flex;flex-direction:column;gap:8px">${check('বড় আকার')}${check('শুকনো গলা')}${check('অঙ্কুর নেই')}${check('২% দাগ', true)}</div>
    </div>
    <div style="font-size:13px;color:#6B5E73;margin-top:-6px;padding:0 4px;display:flex;justify-content:space-between"><span>Large · Dry neck · No sprouting · 2% spots</span><span style="font-weight:600">নিশ্চয়তা: উচ্চ</span></div>
    <div style="background:#5B2A6E;color:#fff;border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:4px">
      <div style="font-size:15px;opacity:.85">এই গ্রেডের প্রস্তাবিত দাম · Suggested</div>
      <div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:34px;font-weight:700">৳1,300</span><span style="font-size:17px;opacity:.85">/ মণ</span></div>
      <div style="font-size:14px;opacity:.85">সীমা ৳1,250–1,350 · Range</div>
    </div>
    <div style="background:#FBE9E9;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
      <i class="ph-fill ph-scales" style="font-size:22px;color:#C62828;margin-top:2px"></i>
      <div style="display:flex;flex-direction:column;gap:2px"><div style="font-size:16px;line-height:1.45;color:#7A1414;font-weight:500">ব্যাপারীর প্রস্তাব ৳1,000 — ন্যায্য দামের চেয়ে ৳300 কম</div><div style="font-size:13px;color:#8F3A3A">Trader offered ৳1,000 — ৳300 below fair</div></div>
    </div>
  </div>
  <div style="padding:10px 16px 20px;display:flex;flex-direction:column;gap:6px;flex-shrink:0">
    ${primary(`বিক্রির জন্য দিন ${sub('Post for sale')}`)}
    <div style="height:44px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:16px;font-weight:600;color:#5B2A6E"><i class="ph ph-arrow-counter-clockwise"></i>আবার ছবি তুলুন</div>
  </div>
  ${nav('farmer', 1)}`);

const row = (label, value, last) =>
  `<div style="display:flex;justify-content:space-between;align-items:center;min-height:52px${last ? '' : ';border-bottom:1px solid #F1EBF4'}"><span style="font-size:16px;font-weight:600">${label}</span>${value}</div>`;

S.F04 = () => {
  const q = BN(state.qty), seg = on => `background:${on ? '#fff' : 'transparent'};color:${on ? '#5B2A6E' : '#6B5E73'}`;
  return shell('F04 Post stock', `
  ${status()}
  ${backBar('বিক্রির জন্য দিন')}
  <div style="flex:1;overflow:auto;padding:4px 16px 12px;display:flex;flex-direction:column;gap:10px">
    <div style="background:#fff;border-radius:16px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;flex-direction:column;gap:2px"><div style="font-size:16px;font-weight:600">পরিমাণ</div><div style="font-size:13px;color:#6B5E73">পরামর্শ অনুযায়ী</div></div>
      <div style="display:flex;align-items:center;gap:4px">
        <div data-action="qty:-5" style="width:44px;height:44px;border-radius:12px;background:#F0E8F4;color:#5B2A6E;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer"><i class="ph-bold ph-minus"></i></div>
        <div style="min-width:80px;text-align:center;font-size:20px;font-weight:700">${q} মণ</div>
        <div data-action="qty:5" style="width:44px;height:44px;border-radius:12px;background:#5B2A6E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer"><i class="ph-bold ph-plus"></i></div>
      </div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:4px 14px;display:flex;flex-direction:column">
      ${row('গ্রেড', '<span style="background:#2E7D32;color:#fff;font-size:15px;font-weight:700;padding:3px 12px;border-radius:8px;display:flex;gap:4px;align-items:center"><i class="ph-fill ph-seal-check"></i>A</span>')}
      ${row('চাওয়া দাম', '<span style="display:flex;align-items:center;gap:6px;font-size:17px;font-weight:700;padding:6px 10px;border-radius:10px;box-shadow:0 0 0 1.5px #D9C6E2">৳1,300 <span style="font-size:14px;font-weight:400;color:#6B5E73">/ মণ</span><i class="ph ph-pencil-simple" style="color:#5B2A6E"></i></span>')}
      ${row('অবস্থান', '<span style="font-size:16px;color:#4A3D52;display:flex;gap:4px;align-items:center"><i class="ph ph-map-pin"></i>সাঁথিয়া, পাবনা</span>')}
      ${row('কবে থেকে', '<span style="font-size:16px;color:#5B2A6E;font-weight:600;display:flex;gap:6px;align-items:center"><i class="ph ph-calendar-blank"></i>আজ</span>', true)}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="font-size:16px;font-weight:600;padding:0 4px">পিকআপ</div>
      <div style="display:flex;background:#F0E8F4;border-radius:14px;padding:4px;gap:4px">
        <div data-action="pickup:home" style="flex:1;min-height:48px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:15px;font-weight:600;cursor:pointer;${seg(state.pickup === 'home')}"><i class="ph ph-house-line"></i>বাড়ি থেকে নেবে</div>
        <div data-action="pickup:market" style="flex:1;min-height:48px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:15px;font-weight:600;cursor:pointer;${seg(state.pickup === 'market')}"><i class="ph ph-truck"></i>হাটে দেব</div>
      </div>
    </div>
  </div>
  <div style="flex-shrink:0;padding:12px 16px 20px;display:flex;flex-direction:column;gap:10px;background:#fff;border-top:1px solid #EEE6F2">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:15px;color:#6B5E73">মোট</span><span style="font-size:18px;font-weight:700">${q} মণ × ৳1,300 = ৳${INR(state.qty * 1300)}</span></div>
    ${primary(`পোস্ট করুন ${sub('Post')}`, { next: 'slow', action: 'post' })}
  </div>
  ${state.posted ? `<div style="position:absolute;left:16px;right:16px;top:92px;background:#22172A;color:#fff;border-radius:16px;padding:14px 16px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 12px 30px -8px rgba(0,0,0,.4)">
    <i class="ph-fill ph-eye" style="font-size:22px;color:#8BD08F;margin-top:1px"></i><div style="font-size:16px;line-height:1.45">আপনার পেঁয়াজ ৩ জন ক্রেতা ও ব্যাপারী দেখছেন</div>
  </div>` : ''}
  ${nav('farmer', 1)}`, 'position:relative');
};

const field = (inner, extra = '') => `<div style="height:50px;border-radius:12px;background:#fff;box-shadow:0 0 0 1.5px #D9C6E2;display:flex;align-items:center;${extra}">${inner}</div>`;
const label = t => `<div style="font-size:15px;font-weight:600">${t}</div>`;

S.B01 = () => shell('B01 Post demand', `
  ${status()}
  <div style="padding:4px 18px 12px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0"><div style="display:flex;flex-direction:column"><div style="font-size:20px;font-weight:700">নতুন চাহিদা</div><div style="font-size:13px;color:#6B5E73">নাদিয়া রহমান · কারওয়ান বাজার</div></div>${lang(12, '3px 9px')}</div>
  <div style="flex:1;overflow:auto;padding:0 16px 12px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;flex-direction:column;gap:6px">${label('পরিমাণ · Quantity')}
      <div style="display:flex;gap:8px">${field('5', 'flex:1;padding:0 14px;font-size:18px;font-weight:700')}<div style="display:flex;background:#F0E8F4;border-radius:12px;padding:3px;font-size:14px;font-weight:600"><span style="padding:0 12px;display:flex;align-items:center;border-radius:9px;background:#5B2A6E;color:#fff">টন</span><span style="padding:0 12px;display:flex;align-items:center;color:#6B5E73">মণ</span></div></div>
      <div style="font-size:13px;color:#6B5E73">≈ ১৩৪ মণ</div></div>
    <div style="display:flex;flex-direction:column;gap:6px">${label('গ্রেড · Grade')}
      <div style="display:flex;gap:8px">${['A', 'B', 'C'].map(g => { const s = state.grade === g; return `<div data-action="grade:${g}" style="flex:1;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:4px;font-size:17px;font-weight:700;cursor:pointer;background:${s ? '#5B2A6E' : '#fff'};color:${s ? '#fff' : '#22172A'};box-shadow:${s ? 'none' : '0 0 0 1.5px #D9C6E2'}">Grade ${g}</div>`; }).join('')}</div></div>
    <div style="display:flex;flex-direction:column;gap:6px">${label('লক্ষ্য দাম · Target price / মণ')}
      <div style="display:flex;gap:8px;align-items:center">${field('৳1,250', 'flex:1;padding:0 14px;font-size:17px;font-weight:600')}<span style="color:#6B5E73">–</span>${field('৳1,350', 'flex:1;padding:0 14px;font-size:17px;font-weight:600')}</div></div>
    <div style="display:flex;gap:8px">
      <div style="flex:1.3;display:flex;flex-direction:column;gap:6px">${label('কোথায়')}${field('<i class="ph ph-map-pin" style="color:#5B2A6E"></i>কারওয়ান বাজার, ঢাকা', 'gap:6px;padding:0 12px;font-size:15px')}</div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">${label('কবের মধ্যে')}${field('<i class="ph ph-calendar-blank" style="color:#5B2A6E"></i>২৩ অক্টো', 'gap:6px;padding:0 12px;font-size:15px')}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">${label('পেমেন্ট · Payment')}
      <div style="display:flex;gap:8px">${['bKash', 'Nagad', 'Bank'].map(p => { const s = state.pay[p]; return `<div data-action="pay:${p}" style="height:40px;padding:0 14px;border-radius:999px;display:flex;align-items:center;gap:6px;font-size:15px;font-weight:600;cursor:pointer;background:${s ? '#F0E8F4' : '#fff'};color:${s ? '#5B2A6E' : '#22172A'};box-shadow:${s ? '0 0 0 1.5px #5B2A6E' : '0 0 0 1.5px #D9C6E2'}">${s ? '✓ ' : ''}${p}</div>`; }).join('')}</div></div>
    <div style="background:#E6F2E7;border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;color:#1B5E20"><i class="ph-fill ph-lightning" style="font-size:20px;margin-top:2px"></i><div style="display:flex;flex-direction:column;gap:2px"><div style="font-size:15px;font-weight:600;line-height:1.45">পাবনায় ১৮০ মণ Grade A পেঁয়াজ পাওয়া যাচ্ছে</div><div style="font-size:13px">180 maunds Grade A available in Pabna</div></div></div>
  </div>
  <div style="padding:10px 16px 10px;flex-shrink:0">${primary('চাহিদা পোস্ট করুন')}</div>
  ${nav('buyer', 0)}`);

S.M01 = () => {
  const total = LOTS.filter(l => state.sel[l.id]).reduce((a, l) => a + l.qty, 0);
  const covered = total >= ORDER_NEED;
  const tab = (key, text, extra = '') => { const on = state.tab === key; return `<div data-action="tab:${key}" style="flex:1;height:44px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:15px;font-weight:600;cursor:pointer;color:${on ? '#5B2A6E' : '#6B5E73'};box-shadow:${on ? 'inset 0 -3px 0 #5B2A6E' : 'none'}">${text}${extra}</div>`; };
  const pinBg = l => state.sel[l.id] ? '#5B2A6E' : '#8A7D92';
  return shell('M01 Nearby stock', `
  ${status()}
  <div style="padding:4px 18px 10px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0"><div style="display:flex;flex-direction:column"><div style="font-size:20px;font-weight:700">রহিম ব্যাপারী</div><div style="font-size:13px;color:#6B5E73;display:flex;gap:4px;align-items:center"><i class="ph-fill ph-map-pin"></i>সুজানগর, পাবনা</div></div><div data-action="map" style="height:40px;padding:0 12px;border-radius:12px;display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;cursor:pointer;background:${state.mapOpen ? '#5B2A6E' : '#fff'};color:${state.mapOpen ? '#fff' : '#5B2A6E'};box-shadow:0 0 0 1.5px #5B2A6E"><i class="ph ph-map-trifold"></i>ম্যাপ</div></div>
  <div style="display:flex;padding:0 16px;gap:4px;flex-shrink:0;border-bottom:1px solid #EEE6F2">
    ${tab('stock', 'নিকটের মজুদ')}
    ${tab('orders', 'ক্রেতার চাহিদা', '<span style="background:#C62828;color:#fff;font-size:10px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center">১</span>')}
  </div>
  <div style="flex:1;overflow:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px">
    <div style="background:#3E1A4C;color:#fff;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;gap:6px;align-items:center;font-size:12px;font-weight:600;letter-spacing:.04em;opacity:.8"><i class="ph-fill ph-storefront"></i>খোলা অর্ডার · OPEN ORDER</div>
      <div style="font-size:15px;line-height:1.45;font-weight:500">নাদিয়া রহমান, কারওয়ান বাজার — ৫ টন Grade A, ৳1,250–1,350, ৭ দিন</div>
      <div style="align-self:flex-start;height:36px;padding:0 14px;border-radius:10px;background:#fff;color:#3E1A4C;display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700">Fill this order<i class="ph-bold ph-arrow-right"></i></div>
    </div>
    ${state.mapOpen ? `<div style="height:150px;border-radius:16px;background:#E8EFE4;position:relative;overflow:hidden;flex-shrink:0;box-shadow:0 0 0 1px #D8E2D2">
      <div style="position:absolute;left:-20px;top:70px;width:420px;height:18px;background:#C9DCEB;transform:rotate(-12deg)"></div>
      <div style="position:absolute;left:150px;top:-10px;width:6px;height:180px;background:#fff;transform:rotate(18deg)"></div>
      <div style="position:absolute;left:8px;bottom:6px;font-size:11px;color:#55704A;font-weight:600">সুজানগর</div><div style="position:absolute;right:8px;top:6px;font-size:11px;color:#55704A;font-weight:600">সাঁথিয়া</div>
      <div style="position:absolute;left:70px;top:96px;width:16px;height:16px;border-radius:50%;background:#22172A;border:3px solid #fff"></div>
      ${LOTS.map(l => `<div style="position:absolute;left:${l.x}px;top:${l.y}px;display:flex;flex-direction:column;align-items:center"><div style="background:${pinBg(l)};color:#fff;font-size:11px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap">${BN(l.qty)} মণ</div><div style="width:2px;height:6px;background:${pinBg(l)}"></div></div>`).join('')}
    </div>` : ''}
    ${state.tab === 'stock' ? `<div style="display:flex;flex-direction:column;gap:8px">
      ${LOTS.map(l => { const s = state.sel[l.id]; return `<div data-action="lot:${l.id}" style="background:#fff;border-radius:14px;padding:10px 12px;display:flex;gap:12px;align-items:center;cursor:pointer;box-shadow:${s ? '0 0 0 2px #5B2A6E' : '0 0 0 1px #E6DDEB'}">
        <div style="width:24px;height:24px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;background:${s ? '#5B2A6E' : '#fff'};box-shadow:${s ? 'none' : 'inset 0 0 0 2px #C9BDD0'}"><i class="ph-bold ph-check"></i></div>
        <div style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:repeating-linear-gradient(45deg,#E9DFEE 0 5px,#F3ECF6 5px 10px)"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:2px"><div style="font-size:16px;font-weight:600">${l.name}</div><div style="font-size:14px;color:#4A3D52">${BN(l.qty)} মণ · ৳${INR(l.price)} · ${l.km} km</div></div>
        <span style="background:#2E7D32;color:#fff;font-size:13px;font-weight:700;padding:2px 8px;border-radius:6px">A</span>
      </div>`; }).join('')}
    </div>` : `<div style="background:#fff;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between"><span style="font-size:16px;font-weight:700">নাদিয়া রহমান</span><span style="font-size:13px;color:#6B5E73">ঢাকা</span></div>
      <div style="font-size:14px;color:#4A3D52;line-height:1.5">৫ টন (≈১৩৪ মণ) · Grade A · ৳1,250–1,350 / মণ · ৭ দিনের মধ্যে · bKash</div>
    </div>`}
  </div>
  <div style="flex-shrink:0;padding:12px 16px 20px;background:#fff;border-top:1px solid #EEE6F2;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;gap:6px;align-items:center;font-size:16px;font-weight:600;color:${covered ? '#1B5E20' : '#7A5200'}"><i class="${covered ? 'ph-fill ph-check-circle' : 'ph-fill ph-hourglass-medium'}" style="font-size:20px"></i>${covered ? `নির্বাচিত: ${BN(total)} মণ — অর্ডার পূরণ ✓` : `নির্বাচিত: ${BN(total)} মণ — আরও ${BN(ORDER_NEED - total)} মণ দরকার`}</div>
    ${primary('একসাথে অফার দিন')}
  </div>
  ${nav('middleman', 0)}`);
};

const kicker = t => `<div style="font-size:13px;font-weight:700;letter-spacing:.06em;color:#6B5E73;padding:0 2px">${t}</div>`;

S.M02 = () => shell('M02 Combine and offer', `
  ${status()}
  ${backBar('একসাথে অফার')}
  <div style="flex:1;overflow:auto;padding:0 16px 12px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;flex-direction:column;gap:6px">
      ${kicker('কৃষকদের অফার')}
      <div style="background:#fff;border-radius:14px;padding:2px 12px">
        ${LOTS.map(l => `<div style="display:flex;align-items:center;gap:8px;min-height:48px;border-bottom:1px solid #F1EBF4">
          <div style="flex:1;font-size:15px;font-weight:600">${l.name}<div style="font-size:12px;color:#6B5E73;font-weight:400">${BN(l.qty)} মণ</div></div>
          <div style="font-size:14px;font-weight:600;padding:4px 8px;border-radius:8px;box-shadow:0 0 0 1.5px #D9C6E2">৳${INR(l.price)}</div>
          <div style="width:72px;text-align:right;font-size:15px;font-weight:700">৳${INR(l.qty * l.price)}</div>
        </div>`).join('')}
        <div style="display:flex;justify-content:space-between;min-height:42px;align-items:center;font-size:14px;color:#6B5E73"><span>কৃষকদের মোট · ১৩৫ মণ</span><span style="font-weight:700;color:#22172A">৳1,75,400</span></div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;font-size:13px;color:#1B5E20;padding:0 2px"><i class="ph-fill ph-shield-check"></i>প্রত্যেক কৃষক তাঁর নিজের দাম দেখতে পান</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${kicker('ট্রাক ও পিকআপ')}
      <div style="background:#fff;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:16px;font-size:14px"><span style="display:flex;gap:6px;align-items:center"><i class="ph ph-calendar-blank" style="color:#5B2A6E;font-size:18px"></i>কাল, সকাল ১০টা</span><span style="display:flex;gap:6px;align-items:center"><i class="ph ph-truck" style="color:#5B2A6E;font-size:18px"></i>৫ টন ট্রাক × ১</span></div>
        <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#4A3D52">
          <span style="width:10px;height:10px;border-radius:50%;background:#5B2A6E"></span>সুজানগর<span style="flex:1;border-top:2px dashed #D9C6E2"></span><span style="width:10px;height:10px;border-radius:50%;background:#5B2A6E"></span>সাঁথিয়া<span style="flex:1;border-top:2px dashed #D9C6E2"></span><i class="ph-fill ph-flag-checkered" style="font-size:14px"></i>ঢাকা
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${kicker('ক্রেতাকে কোট · নাদিয়া রহমান')}
      <div style="background:#5B2A6E;color:#fff;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:15px;opacity:.85">১৩৫ মণ · ঢাকায় পৌঁছানো</span><span style="font-size:22px;font-weight:700">৳1,420<span style="font-size:13px;font-weight:400;opacity:.85"> / মণ</span></span></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;opacity:.85"><span>মোট</span><span>৳1,91,700</span></div>
      </div>
      <div style="background:#FEF6E0;border-radius:12px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#5C3F00"><span style="display:flex;gap:6px;align-items:center"><i class="ph ph-eye-slash"></i>শুধু আপনি দেখছেন · মার্জিন</span><span style="font-weight:700">৳120 / মণ</span></div>
    </div>
  </div>
  <div style="padding:10px 16px 20px;flex-shrink:0;background:#fff;border-top:1px solid #EEE6F2">${primary('<i class="ph-fill ph-paper-plane-tilt"></i>অফার পাঠান', { next: 'slow', action: 'send' })}</div>
  ${state.offersSent ? `<div data-action="closeSent" style="position:absolute;inset:0;background:rgba(34,23,42,.45);display:flex;align-items:flex-end;cursor:pointer;z-index:2">
    <div style="width:100%;background:#fff;border-radius:24px 24px 0 0;padding:28px 24px 32px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:#2E7D32;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px"><i class="ph-bold ph-check"></i></div>
      <div style="font-size:19px;font-weight:700;line-height:1.4">৪ জন কৃষক ও ১ জন ক্রেতাকে অফার পাঠানো হয়েছে</div>
      <div style="font-size:14px;color:#6B5E73">Offers sent to 4 farmers and 1 buyer</div>
    </div>
  </div>` : ''}
  ${nav('middleman', 0)}`, 'position:relative');

S.F05 = () => shell('F05 Offer received', `
  ${status()}
  <div style="margin:6px 16px 0;background:#5B2A6E;color:#fff;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:center"><i class="ph-fill ph-bell-ringing" style="font-size:24px;color:#F9A825"></i><div style="display:flex;flex-direction:column"><span style="font-size:18px;font-weight:700">নতুন অফার!</span><span style="font-size:13px;opacity:.85">New offer · ২ মিনিট আগে</span></div></div>
  <div style="flex:1;padding:16px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#fff;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;gap:12px;align-items:center">
        ${avatar(52, 20)}
        <div style="display:flex;flex-direction:column;gap:3px"><div style="font-size:18px;font-weight:700">রহিম ব্যাপারী</div><div style="display:flex;gap:8px;align-items:center;font-size:13px;color:#4A3D52"><span>সুজানগর</span>${verified}</div></div>
      </div>
      <div style="background:#FAF7FB;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:24px;font-weight:700;letter-spacing:-0.01em">৪০ মণ × ৳1,300</div>
        <div style="font-size:28px;font-weight:700;color:#5B2A6E">= ৳52,000</div>
        <div style="align-self:flex-start;display:flex;gap:6px;align-items:center;background:#E6F2E7;color:#1B5E20;font-size:15px;font-weight:600;padding:5px 12px;border-radius:999px"><i class="ph-fill ph-check-circle"></i>ন্যায্য দাম ✓ <span style="font-weight:400;font-size:13px">আজকের সীমার মধ্যে</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:10px;align-items:center;font-size:16px"><i class="ph-duotone ph-truck" style="font-size:24px;color:#5B2A6E"></i><span>কাল সকাল ১০টা, বাড়ি থেকে</span></div>
        <div style="display:flex;gap:10px;align-items:center;font-size:16px"><i class="ph-duotone ph-wallet" style="font-size:24px;color:#5B2A6E"></i><span>bKash, পিকআপের সময়</span></div>
      </div>
    </div>
  </div>
  <div style="padding:10px 16px 20px;display:flex;flex-direction:column;gap:8px;flex-shrink:0">
    ${primary('<i class="ph-bold ph-check"></i>গ্রহণ করুন', { h: 56, bg: '#2E7D32', fs: 19, fw: 700 })}
    <div style="height:48px;border-radius:14px;box-shadow:0 0 0 1.5px #C9BDD0;color:#22172A;display:flex;align-items:center;justify-content:center;gap:8px;font-size:17px;font-weight:600"><i class="ph ph-x"></i>না</div>
    <div style="height:40px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:16px;font-weight:600;color:#5B2A6E"><i class="ph ph-chats-circle"></i>দাম নিয়ে কথা বলুন</div>
  </div>
  ${nav('farmer', 2)}`);

const CONFETTI = [
  'left:52px;top:96px;width:8px;height:14px;background:#5B2A6E;transform:rotate(20deg);border-radius:2px',
  'left:290px;top:120px;width:8px;height:14px;background:#F9A825;transform:rotate(-30deg);border-radius:2px',
  'left:96px;top:200px;width:6px;height:6px;background:#2E7D32;border-radius:50%',
  'left:258px;top:220px;width:8px;height:12px;background:#2E7D32;transform:rotate(45deg);border-radius:2px',
  'left:220px;top:84px;width:6px;height:6px;background:#5B2A6E;border-radius:50%',
  'left:36px;top:170px;width:8px;height:12px;background:#F9A825;transform:rotate(-15deg);border-radius:2px',
];
const DEAL = {
  farmer: { body: '<div style="font-size:20px;font-weight:600"><span style="font-size:26px;font-weight:700;color:#2E7D32">৳52,000</span> bKash-এ জমা হয়েছে</div><div style="background:#E6F2E7;color:#1B5E20;border-radius:12px;padding:8px 14px;font-size:15px;font-weight:600;line-height:1.4">ব্যাপারীর প্রথম প্রস্তাবের চেয়ে ৳12,000 বেশি</div>', rate: 'রহিম ব্যাপারীকে রেটিং দিন' },
  middleman: { body: '<div style="font-size:20px;font-weight:600">ট্রাক ভর্তি: ১৩৫ মণ পৌঁছেছে</div><div style="font-size:14px;color:#6B5E73">Truck full: 135 maunds delivered</div>', rate: 'করিম মিয়াকে রেটিং দিন' },
  buyer: { body: '<div style="font-size:20px;font-weight:600;line-height:1.4">৫ টন Grade A কারওয়ান বাজারে পৌঁছেছে</div><div style="font-size:14px;color:#6B5E73">5 tonnes Grade A delivered to Karwan Bazar</div>', rate: 'রহিম ব্যাপারীকে রেটিং দিন' },
};
const dealStep = t => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;font-weight:500"><div style="width:28px;height:28px;border-radius:50%;background:#2E7D32;color:#fff;display:flex;align-items:center;justify-content:center"><i class="ph-bold ph-check"></i></div>${t}</div>`;
const dealLine = '<div style="flex:.6;height:2px;background:#2E7D32;margin-top:14px"></div>';

const deal = role => () => shell('D01 Deal done', `
  ${CONFETTI.map(c => `<div style="position:absolute;${c}"></div>`).join('')}
  ${status()}
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:72px 24px 0;gap:14px;text-align:center">
    <div style="width:104px;height:104px;border-radius:50%;background:#2E7D32;color:#fff;display:flex;align-items:center;justify-content:center;font-size:56px;box-shadow:0 0 0 12px #E6F2E7"><i class="ph-bold ph-check"></i></div>
    <div style="font-size:30px;font-weight:700;margin-top:18px">বিক্রি সম্পন্ন!</div>
    <div style="display:flex;flex-direction:column;gap:10px;align-items:center">${DEAL[role].body}</div>
    <div style="display:flex;align-items:flex-start;width:100%;margin-top:22px">${dealStep('অফার গৃহীত')}${dealLine}${dealStep('পিকআপ')}${dealLine}${dealStep('পেমেন্ট')}</div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:center;margin-top:24px"><div style="font-size:15px;color:#4A3D52">${DEAL[role].rate}</div><div style="display:flex;gap:6px;font-size:32px;color:#F9A825">${'<i class="ph-fill ph-star"></i>'.repeat(5)}</div></div>
  </div>
  <div style="padding:10px 16px 20px;display:flex;flex-direction:column;gap:8px;flex-shrink:0">
    ${primary('হোমে যান')}
    <div style="height:44px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:16px;font-weight:600;color:#5B2A6E"><i class="ph ph-receipt"></i>রসিদ দেখুন</div>
  </div>
  ${nav(role, 2)}`, 'position:relative');
S.D01f = deal('farmer');
S.D01m = deal('middleman');
S.D01b = deal('buyer');

S.F06 = () => `<div data-screen-label="F06 Lock screen" style="width:360px;height:800px;background:#2A1633;border-radius:32px;overflow:hidden;box-shadow:0 24px 60px -24px rgba(62,26,76,.5);display:flex;flex-direction:column;color:#fff">
  ${status('গ্রামীণফোন', false)}
  <div style="display:flex;flex-direction:column;align-items:center;padding-top:56px;gap:4px"><i class="ph-fill ph-lock-simple" style="font-size:18px;opacity:.8"></i><div style="font-size:84px;font-weight:300;letter-spacing:-0.03em;line-height:1.05">10:24</div><div style="font-size:17px;opacity:.85">শুক্রবার, ১৩ নভেম্বর</div></div>
  <div data-next="fast" style="margin:48px 12px 0;background:rgba(255,255,255,.94);color:#22172A;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;gap:8px;align-items:center;font-size:13px;color:#6B5E73"><div style="width:22px;height:22px;border-radius:6px;background:#fff;box-shadow:0 0 0 1px #E6DDEB;display:flex;align-items:center;justify-content:center"><img src="assets/peyajflow-icon.png" alt="" style="width:14px;height:16px;object-fit:contain;display:block"></div><span style="font-weight:600;color:#22172A">PeyajFlow</span><span style="margin-left:auto">এখন</span></div>
    <div style="font-size:16px;line-height:1.45">দাম এখন <b>৳1,650/মণ</b>। বাকি ৬০ মণ বিক্রির ভালো সময়।</div>
  </div>
  <div style="margin-top:auto;padding:0 40px 36px;display:flex;justify-content:space-between;align-items:center">
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:22px"><i class="ph-fill ph-flashlight"></i></div>
    <div style="width:120px;height:5px;border-radius:3px;background:#fff;opacity:.8"></div>
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:22px"><i class="ph-fill ph-camera"></i></div>
  </div>
</div>`;

S.F06b = () => shell('F06 Sell now', `
  ${status('10:24')}
  ${farmerGreeting()}
  <div style="flex:1;overflow:auto;padding:4px 16px 12px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#5B2A6E;color:#fff;border-radius:20px;padding:16px 18px;display:flex;flex-direction:column;gap:6px">
      <div style="font-size:15px;opacity:.85">আজকের ন্যায্য দাম · Today's fair price</div>
      <div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:36px;font-weight:700">৳1,650</span><span style="font-size:17px;opacity:.85">/ মণ</span></div>
      <div style="display:flex;gap:10px;align-items:center;font-size:14px"><span style="display:flex;align-items:center;gap:3px;background:#E6F2E7;color:#1B5E20;padding:2px 8px;border-radius:999px;font-weight:600"><i class="ph-bold ph-trend-up"></i>+২৭%</span><span style="opacity:.85">৪ সপ্তাহ আগে ৳1,300</span></div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 0 1.5px #2E7D32">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:6px;align-items:center;background:#2E7D32;color:#fff;padding:6px 14px;border-radius:999px;font-size:17px;font-weight:700"><i class="ph-fill ph-check-circle"></i>এখন বিক্রি করুন</span><span style="font-size:13px;color:#6B5E73;font-weight:500">নিশ্চয়তা: উচ্চ · High</span></div>
      <div style="font-size:16px;line-height:1.45">দাম পূর্বাভাস অনুযায়ী বেড়েছে। বাকি মজুদ বিক্রির ভালো সময়।</div>
      <div style="background:#E6F2E7;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:2px;color:#1B5E20"><span style="font-size:14px">আপনার বাকি ৬০ মণ</span><span style="font-size:24px;font-weight:700">৬০ মণ × ৳1,650 = ৳99,000</span></div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;gap:10px;align-items:center"><i class="ph-duotone ph-warehouse" style="font-size:26px;color:#5B2A6E"></i><div style="font-size:16px;font-weight:600">আমার মজুদ: ৬০ মণ</div></div>
      <span style="font-size:13px;color:#6B5E73">৪০ মণ বিক্রি হয়েছে</span>
    </div>
  </div>
  <div style="padding:10px 16px 10px;flex-shrink:0">${primary('বাকি ৬০ মণ পোস্ট করুন')}</div>
  ${nav('farmer', 0)}`);

S.B02 = () => {
  const steps = ['অফার এসেছে', 'নিশ্চিত', 'পথে', 'পৌঁছেছে'];
  return shell('B02 Buyer orders', `
  ${status()}
  <div style="padding:4px 18px 12px;flex-shrink:0"><div style="font-size:20px;font-weight:700">আমার অর্ডার</div><div style="font-size:13px;color:#6B5E73">My orders</div></div>
  <div style="flex:1;padding:0 16px;display:flex;flex-direction:column;gap:12px">
    <div style="background:#fff;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:18px;font-weight:700">৫ টন · Grade A</span><span style="font-size:13px;color:#6B5E73">#PF-24816</span></div>
      <div style="display:flex;align-items:flex-start">
        ${steps.map((t, i) => { const done = i < 2, cur = i === 2; return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;position:relative">
          <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;background:${done ? '#2E7D32' : cur ? '#5B2A6E' : '#fff'};box-shadow:${done || cur ? 'none' : 'inset 0 0 0 2px #D9C6E2'};position:relative;z-index:1"><i class="${done ? 'ph-bold ph-check' : cur ? 'ph-fill ph-truck' : 'ph ph-circle'}"></i></div>
          <div style="font-size:12px;line-height:1.3;font-weight:${cur ? 700 : 500};color:${done || cur ? '#22172A' : '#6B5E73'}">${t}</div>
        </div>`; }).join('')}
      </div>
      <div style="font-size:14px;color:#4A3D52;display:flex;gap:6px;align-items:center"><i class="ph ph-map-pin"></i>কারওয়ান বাজার, ঢাকা · ২৩ অক্টোবরের মধ্যে</div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 0 0 1.5px #5B2A6E">
      <div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#5B2A6E">নতুন কোট · NEW QUOTE</div>
      <div style="display:flex;gap:12px;align-items:center">${avatar(44)}<div style="display:flex;flex-direction:column;gap:2px"><div style="font-size:16px;font-weight:700">রহিম ব্যাপারী</div><div style="display:flex;gap:8px;font-size:13px;color:#4A3D52">${verified}</div></div></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;background:#FAF7FB;border-radius:12px;padding:12px"><span style="font-size:15px">১৩৫ মণ · ঢাকায় পৌঁছানো</span><span style="font-size:20px;font-weight:700">৳1,420<span style="font-size:13px;font-weight:400;color:#6B5E73"> / মণ</span></span></div>
      <div style="display:flex;gap:8px;align-items:center;font-size:14px;color:#4A3D52"><i class="ph-duotone ph-truck" style="font-size:20px;color:#5B2A6E"></i>৫ টন ট্রাক · পৌঁছাবে আনুমানিক কাল সন্ধ্যা ৭টা</div>
    </div>
  </div>
  <div style="padding:10px 16px 10px;display:flex;gap:8px;flex-shrink:0">
    <div style="flex:1;height:52px;border-radius:14px;box-shadow:0 0 0 1.5px #D9C6E2;color:#5B2A6E;display:flex;align-items:center;justify-content:center;gap:6px;font-size:15px;font-weight:600"><i class="ph ph-navigation-arrow"></i>ট্রাক ট্র্যাক</div>
    ${primary('কোট গ্রহণ করুন', { fs: 16, extra: 'flex:1.4;gap:6px' })}
  </div>
  ${nav('buyer', 1)}`);
};

// ─── Basic phone (SMS) screens — all SMS text is Bangla ──────────────────
const KEYS = [['১', ''], ['২', 'কখগ'], ['৩', 'ঘঙচ'], ['৪', 'ছজঝ'], ['৫', 'টঠড'], ['৬', 'ঢণত'], ['৭', 'থদধন'], ['৮', 'পফব'], ['৯', 'ভমযর'], ['*', ''], ['০', '␣'], ['#', '']];
const basicPhone = (label, title, body, softL, softR, pressed) => `<div data-screen-label="${label}" style="width:360px;height:800px;display:flex;align-items:center;justify-content:center">
<div style="width:304px;height:676px;background:#2A2A2E;border-radius:46px 46px 38px 38px;padding:26px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px;box-shadow:inset 0 2px 0 #4A4A50,0 24px 50px -20px rgba(0,0,0,.5)">
<div style="align-self:center;width:52px;height:6px;border-radius:3px;background:#151517"></div>
<div data-next="fast" style="height:318px;background:#C9D8B9;border-radius:8px;box-shadow:inset 0 0 0 3px #111;padding:12px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font-family:'Hind Siliguri',sans-serif;color:#1E2A14;overflow:hidden">
<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;border-bottom:1.5px solid #8FA07E;padding-bottom:4px"><span>${title}</span><span>▮▮▮ ১০:০২</span></div>
<div style="flex:1;display:flex;flex-direction:column;gap:8px;font-size:15px;line-height:1.45">${body}</div>
<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:1.5px solid #8FA07E;padding-top:4px"><span>${softL}</span><span>${softR}</span></div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px"><div style="width:50px;height:18px;border-radius:9px;background:#3E3E44"></div><div data-next="fast" style="width:54px;height:34px;border-radius:14px;background:#3E3E44;box-shadow:inset 0 0 0 2px #55555C"></div><div style="width:50px;height:18px;border-radius:9px;background:#3E3E44"></div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:'Hind Siliguri','Inter',sans-serif">${KEYS.map(([k, sub]) => `<div style="height:40px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:17px;font-weight:600;${k === pressed ? 'background:#F9A825;color:#22172A;box-shadow:0 0 0 3px rgba(249,168,37,.35)' : 'background:#3A3A40;color:#E8E8EA'}">${k}<span style="font-size:10px;font-weight:400;opacity:.7">${sub}</span></div>`).join('')}</div>
</div></div>`;

S.P1 = () => basicPhone('P01 New message', 'বার্তা',
  '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center"><i class="ph-duotone ph-envelope-simple" style="font-size:56px"></i><div style="font-size:21px;font-weight:700">১টি নতুন বার্তা</div><div>PeyajFlow থেকে</div></div>',
  'পড়ুন', 'পরে');
S.P2 = () => basicPhone('P01 Offer SMS', 'PeyajFlow',
  '<div>PeyajFlow: রহিম ব্যাপারী ৪০ মণ পেঁয়াজ ৳১,৩০০/মণ দরে কিনতে চান = <b>৳৫২,০০০</b>। পিকআপ কাল সকাল ১০টা। আজকের ন্যায্য দাম ৳১,২৫০–১,৩৫০। গ্রহণ করতে ১, বাতিল করতে ২ লিখে পাঠান।</div>',
  'উত্তর', 'পেছনে');
S.P3 = () => basicPhone('P01 Reply', 'উত্তর · PeyajFlow',
  '<div>বার্তা লিখুন:</div><div style="height:52px;border:2px solid #1E2A14;border-radius:4px;display:flex;align-items:center;padding:0 10px;font-size:26px;font-weight:700">১<span style="width:2px;height:28px;background:#1E2A14;margin-left:3px"></span></div><div style="font-size:14px">১ = গ্রহণ · ২ = বাতিল</div>',
  'পাঠান', 'মুছুন', '১');
S.P4 = () => basicPhone('P01 Confirmed SMS', 'PeyajFlow',
  '<div>PeyajFlow: ডিল নিশ্চিত। পিকআপ কাল সকাল ১০টা। পিকআপের সময় <b>৳৫২,০০০</b> আপনার bKash-এ পাঠানো হবে।</div><div>রেফ: PF-24816</div>',
  'ঠিক আছে', 'পেছনে');
S.P5 = () => basicPhone('P01 Price alert SMS', 'PeyajFlow',
  '<div>PeyajFlow: আজ পেঁয়াজের দাম ৳১,২৫০–১,৩৫০/মণ (সাঁথিয়া)।</div><div>পরামর্শ: <b>অপেক্ষা করুন</b>, দাম বাড়তে পারে।</div><div>শুনতে 0961XXXXXXX নম্বরে মিসড কল দিন।</div>',
  'উত্তর', 'পেছনে');

// ─── Pages ───────────────────────────────────────────────────────────────
function homeView() {
  const list = FLOWS[state.mode];
  const card = (mode, icon, bn, en) => `<button type="button" data-action="mode:${mode}" class="pf-card ${state.mode === mode ? 'on' : 'off'}">
    <i class="ph-duotone ${icon}" style="font-size:32px"></i>
    <div class="pf-bn" style="font-size:19px;font-weight:600">${bn}</div>
    <div style="font-size:15px;font-style:italic;opacity:.85">${en}</div>
  </button>`;
  return `<div data-screen-label="Home" style="max-width:560px;margin:0 auto;padding:var(--space-8) var(--space-4);box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-8)">
  <header style="display:flex;flex-direction:column;gap:var(--space-2)">
    <div style="font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-700)">FutureMakers 2026 · ডেমো</div>
    <div style="display:flex;align-items:center;gap:var(--space-3)"><img src="assets/peyajflow-icon.png" alt="" style="width:48px;height:54px;object-fit:contain;display:block"><h1 style="margin:0;font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:48px;line-height:1.05;letter-spacing:-0.01em">PeyajFlow</h1></div>
    <div class="pf-bn" style="font-size:21px;line-height:1.4">ন্যায্য দামে পেঁয়াজ, সরাসরি</div>
    <div style="font-size:17px;font-style:italic;color:var(--color-neutral-700)">Fair price, direct. One marketplace for farmers, middlemen and buyers.</div>
  </header>
  <div style="display:flex;flex-direction:column;gap:var(--space-3)">
    <div style="font-size:16px;color:var(--color-neutral-700)">ফোন বেছে নিন · <i>Choose a phone</i></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)">
      ${card('smart', 'ph-device-mobile', 'স্মার্টফোন', 'Smartphone app')}
      ${card('basic', 'ph-phone', 'সাধারণ ফোন', 'Basic phone · SMS')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div style="display:flex;align-items:baseline;justify-content:space-between"><h2 style="margin:0;font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:28px">ফ্লো <span style="font-weight:400;font-style:italic;font-size:18px;color:var(--color-neutral-700)">Flows</span></h2><span style="font-size:15px;color:var(--color-neutral-700)">${BN(list.length)}টি</span></div>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      ${list.map((fl, i) => `<button type="button" data-action="open:${fl.id}" class="pf-flow">
        <div style="font-family:var(--font-heading);font-size:30px;font-weight:600;color:var(--color-accent);line-height:1">${BN(String(i + 1).padStart(2, '0'))}</div>
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
          <div class="pf-bn" style="font-size:19px;font-weight:600;line-height:1.35">${fl.bn}</div>
          <div style="font-size:16px;font-style:italic;color:var(--color-neutral-700);line-height:1.35;text-wrap:pretty">${fl.en}</div>
          <div class="pf-bn" style="font-size:14px;color:var(--color-neutral-700)">${BN(fl.screens.length)}টি স্ক্রিন</div>
        </div>
        <i class="ph-duotone ph-arrow-right" style="font-size:24px;color:var(--color-accent-700)"></i>
      </button>`).join('')}
    </div>
  </div>
  <div style="font-size:16px;font-style:italic;color:var(--color-neutral-700);display:flex;gap:var(--space-2);align-items:center"><i class="ph-duotone ph-hand-swipe-left" style="font-size:22px"></i>Swipe or use the arrows to move between screens.</div>
</div>`;
}

function viewerView() {
  const f = curFlow(), cur = curScreen(), n = f.screens.length, last = state.idx === n - 1;
  const vw = window.innerWidth, vh = window.innerHeight;
  const availW = Math.min(vw, 640) - 16, availH = vh - 72 - 96 - 8;
  const scale = Math.max(0.3, Math.min(1, availW / 360, availH / 800));
  const nextLabel = last ? (nextFlowOf(f.id) ? 'পরের ফ্লো' : 'শেষ · সব ফ্লো') : 'পরবর্তী';
  const hint = cur === 'F02b' ? 'Analysing… moves on by itself'
    : state.idx === 0 ? (state.mode === 'basic' ? 'Tap the phone screen or swipe to continue' : 'Tap the main button in the app, or swipe') : '';
  const elapsed = (performance.now() - enteredAt) / 1000;
  // Pulse the button to tap for the first few seconds of each screen, without restarting on re-render.
  const pulse = elapsed < 5.2;
  return `<div style="height:100dvh;display:flex;flex-direction:column;overflow:hidden">
  <div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;padding:calc(var(--space-2) + env(safe-area-inset-top)) var(--space-3) var(--space-2);box-sizing:border-box">
    <div style="display:flex;gap:3px;height:3px">${f.screens.map((_, i) => `<div style="flex:1;border-radius:2px;background:${i <= state.idx ? 'var(--color-accent)' : 'var(--color-neutral-300)'}"></div>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:var(--space-2);height:52px">
      <button type="button" data-action="home" class="pf-home"><i class="ph-duotone ph-house" style="font-size:20px"></i><span class="pf-bn" style="font-size:15px;font-weight:600">হোম</span></button>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <div class="pf-bn" style="font-size:17px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.bn}</div>
        <div style="font-size:14px;font-style:italic;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${CAP[cur]}</div>
      </div>
      <div class="pf-bn" style="font-size:16px;font-weight:600;flex-shrink:0">${BN(state.idx + 1)} / ${BN(n)}</div>
    </div>
  </div>
  <div id="pf-swipe" style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:pan-y">
    <div style="width:${Math.round(360 * scale)}px;height:${Math.round(800 * scale)}px;position:relative;flex-shrink:0">
      <div id="pf-stage"${pulse ? ' class="pf-pulse"' : ''} style="position:absolute;left:0;top:0;width:360px;height:800px;transform:scale(${scale});transform-origin:0 0;font-family:'Inter','Hind Siliguri',sans-serif;color:#22172A${pulse ? `;--pd:${(1 - elapsed).toFixed(2)}s` : ''}">${S[cur]()}</div>
    </div>
  </div>
  <div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;padding:var(--space-1) var(--space-3) calc(var(--space-3) + env(safe-area-inset-bottom));box-sizing:border-box">
    <div style="text-align:center;font-size:14px;font-style:italic;color:var(--color-neutral-700);min-height:20px">${hint}</div>
    <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:var(--space-2)">
      <button type="button" data-action="prev" class="pf-prev"${state.idx === 0 ? ' disabled' : ''}><i class="ph-duotone ph-caret-left" style="font-size:20px"></i><span class="pf-bn" style="font-weight:600">আগে</span></button>
      <button type="button" data-action="next" class="pf-next"><span class="pf-bn" style="font-weight:600">${nextLabel}</span><i class="ph-duotone ph-caret-right" style="font-size:20px"></i></button>
    </div>
  </div>
</div>`;
}

// ─── Render loop ─────────────────────────────────────────────────────────
const app = document.getElementById('app');

function render() {
  const f = curFlow();
  const key = f ? state.flow + ':' + state.idx : null;
  if (key !== lastKey) {
    lastKey = key;
    enteredAt = performance.now();
    clearTimeout(timers.auto);
    clearTimeout(timers.adv);
    // The "Analysing…" loader moves on by itself, as the spec describes.
    if (curScreen() === 'F02b') timers.auto = setTimeout(() => { if (curScreen() === 'F02b') go(1); }, 2000);
  }
  try { localStorage.setItem('pf-demo', JSON.stringify({ mode: state.mode, flow: state.flow, idx: state.idx })); } catch (e) {}
  app.innerHTML = `<div class="pf-root">${f ? viewerView() : homeView()}</div>`;
}

// In-app taps that change demo state without leaving the screen.
const ACTIONS = {
  mode: m => set({ mode: m }),
  open: id => { set({ flow: id, idx: 0 }); window.scrollTo(0, 0); },
  home: () => set({ flow: null, idx: 0 }),
  prev: () => go(-1),
  next: () => go(1),
  role: r => set({ role: r }),
  qty: d => set(s => ({ qty: Math.min(100, Math.max(5, s.qty + Number(d))) })),
  pickup: p => set({ pickup: p }),
  post: () => {
    set({ posted: true });
    clearTimeout(timers.toast);
    timers.toast = setTimeout(() => set({ posted: false }), 3000);
  },
  grade: g => set({ grade: g }),
  pay: p => set(s => ({ pay: { ...s.pay, [p]: !s.pay[p] } })),
  tab: t => set({ tab: t }),
  map: () => set(s => ({ mapOpen: !s.mapOpen })),
  lot: id => set(s => ({ sel: { ...s.sel, [id]: !s.sel[id] } })),
  send: () => set({ offersSent: true }),
  closeSent: () => set({ offersSent: false }),
};

app.addEventListener('click', e => {
  const nextEl = e.target.closest('[data-next]');
  const actEl = e.target.closest('[data-action]');
  if (actEl) {
    const [name, arg] = actEl.getAttribute('data-action').split(':');
    if (ACTIONS[name]) ACTIONS[name](arg);
  }
  // The app's main button advances, after a beat so its own feedback (toast, sheet) is seen.
  if (nextEl && curFlow()) {
    const slow = nextEl.getAttribute('data-next') === 'slow';
    clearTimeout(timers.adv);
    timers.adv = setTimeout(() => go(1), slow ? 1400 : 220);
  }
});

let tx = 0, ty = 0;
app.addEventListener('touchstart', e => {
  if (!e.target.closest('#pf-swipe')) return;
  tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
}, { passive: true });
app.addEventListener('touchend', e => {
  if (!e.target.closest('#pf-swipe')) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
}, { passive: true });

window.addEventListener('keydown', e => {
  if (!state.flow) return;
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft') go(-1);
});
window.addEventListener('resize', () => { if (state.flow) render(); });

render();
})();
