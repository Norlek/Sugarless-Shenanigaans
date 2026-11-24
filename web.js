/* ============================================================
   SUGARLESS SHENANIGANS — LIQUID GLASS LAYER (iOS 26 inspired)
   Add before </body>, AFTER your existing scripts:
   <script src="liquid-glass.js"></script>
   Pure additive layer: no edits to your HTML/CSS needed.
   ============================================================ */
(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const CHROMIUM = /Chrome\//.test(navigator.userAgent);
const $ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

/* ---------- SVG FILTERS: refraction lens + gooey metaballs ---------- */
document.body.insertAdjacentHTML('beforeend', `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="lgRefract" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".007 .011" numOctaves="2" seed="7" result="n"/>
    <feGaussianBlur in="n" stdDeviation="2.2" result="b"/>
    <feDisplacementMap in="SourceGraphic" in2="b" scale="46" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="lgGoo" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="b"/>
    <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/>
  </filter>
</svg>`);

/* ---------- CSS ---------- */
const css = `
@property --ang{syntax:'<angle>';inherits:false;initial-value:0deg}
:root{--lg-in:inset 0 1.5px 0 rgba(255,250,240,.38),inset 0 -22px 34px -14px rgba(231,189,130,.14),inset 0 0 46px rgba(255,241,223,.045)}
:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:12px}

/* liquid metaball backdrop */
.lg-blobs{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;opacity:.6;filter:url(#lgGoo) blur(14px);translate:calc(var(--px,0)*38px) calc(var(--py,0)*38px + var(--sy,0)*-1px)}
.lg-blobs i{position:absolute;width:38vmax;height:38vmax;border-radius:50%;will-change:transform}
.lg-blobs i:nth-child(1){left:48%;top:-8%;background:radial-gradient(circle,#b8582a,#7a2f14);animation:lgA 22s ease-in-out infinite}
.lg-blobs i:nth-child(2){left:-10%;top:48%;background:radial-gradient(circle,#8a3a1a,#4a1a0c);animation:lgB 27s ease-in-out infinite}
.lg-blobs i:nth-child(3){left:58%;top:58%;width:30vmax;height:30vmax;background:radial-gradient(circle,#d19558,#8a5524);animation:lgC 31s ease-in-out infinite}
.lg-blobs i:nth-child(4){left:18%;top:6%;width:24vmax;height:24vmax;background:radial-gradient(circle,#9c4a22,#55200e);animation:lgB 19s ease-in-out infinite reverse}
.lg-blobs i:nth-child(5){left:34%;top:70%;width:20vmax;height:20vmax;background:radial-gradient(circle,#e7bd82,#a8672f);opacity:.6;animation:lgA 25s ease-in-out infinite reverse}
@keyframes lgA{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-14vw,16vh) scale(1.28)}66%{transform:translate(7vw,30vh) scale(.82)}}
@keyframes lgB{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(22vw,-12vh) scale(1.2)}75%{transform:translate(10vw,14vh) scale(.88)}}
@keyframes lgC{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(-20vw,-24vh) scale(1.35)}70%{transform:translate(-8vw,-6vh) scale(.8)}}

/* loader dissolves like liquid */
.loader{transition:opacity 1s var(--ease-out),visibility 1s,transform 1.1s var(--ease-out),filter 1s!important}
.loader.done{transform:scale(1.18);filter:blur(28px)}
.loader img{animation:lgPulse 2.2s ease-in-out infinite}
@keyframes lgPulse{50%{transform:scale(1.07);filter:drop-shadow(0 0 34px rgba(231,189,130,.55))}}

/* floating glass capsule navigation */
nav{top:14px;left:50%;width:min(1120px,calc(100% - 28px));height:72px;padding:0 16px 0 28px;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(44,20,11,.26);box-shadow:var(--lg-in),0 18px 50px rgba(0,0,0,.45);transform:translateX(-50%);transition:top .6s ${SPRING},height .6s ${SPRING},width .7s ${SPRING},background .4s,box-shadow .4s}
nav.scrolled{top:10px;height:60px;width:min(960px,calc(100% - 28px));background:rgba(38,17,9,.42);border-color:rgba(255,255,255,.15)}
.logo{width:116px;height:46px}
.links{position:relative;gap:6px}
.links a{position:relative;z-index:1;padding:11px 16px}
.lg-pill{position:absolute;top:50%;left:0;height:36px;margin-top:-18px;border-radius:99px;background:rgba(255,241,223,.1);border:1px solid rgba(255,255,255,.2);box-shadow:var(--lg-in),0 6px 18px rgba(0,0,0,.3);backdrop-filter:blur(6px) saturate(1.8);pointer-events:none;z-index:0;opacity:0}

/* specular edge: rotating light caught on the glass rim */
.lg::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.3px;pointer-events:none;z-index:3;
 background:conic-gradient(from var(--ang),rgba(255,255,255,.75),rgba(255,255,255,.04) 16%,rgba(255,206,150,.42) 38%,rgba(255,255,255,.04) 58%,rgba(255,255,255,.7) 80%,rgba(255,255,255,.75));
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:lgSpin 9s linear infinite}
@keyframes lgSpin{to{--ang:360deg}}

/* glass surfaces */
.card,.nutrient,.ingredient-visual,.stage{border-color:rgba(255,255,255,.12)}
.card{border-radius:36px;background:radial-gradient(340px circle at var(--mx,50%) var(--my,0%),rgba(255,236,205,.2),transparent 62%),var(--glass-bg);box-shadow:var(--lg-in),0 26px 60px rgba(0,0,0,.42)}
.card:hover{box-shadow:var(--lg-in),0 34px 80px rgba(0,0,0,.55),0 0 70px rgba(231,189,130,.13)}
.nutrient{position:relative;border-radius:30px;background:radial-gradient(240px circle at var(--mx,50%) var(--my,0%),rgba(255,236,205,.2),transparent 62%),var(--glass-bg);box-shadow:var(--lg-in),0 16px 36px rgba(0,0,0,.35)}
.nutrient:hover{box-shadow:var(--lg-in),0 22px 50px rgba(0,0,0,.5),0 0 40px rgba(231,189,130,.15)}
.stage,.ingredient-visual{border-radius:44px;box-shadow:var(--lg-in),0 30px 70px rgba(0,0,0,.5)}
.stage-tip,.reset-view-btn{box-shadow:var(--lg-in)}
.modal-box{border-radius:38px;border-color:rgba(255,255,255,.16);box-shadow:var(--lg-in),0 40px 100px rgba(0,0,0,.75);backdrop-filter:blur(30px) saturate(1.7)}
.tag{background:rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.2);transition:transform .5s ${SPRING},background .3s}
.tag:hover{transform:translateY(-3px) scale(1.07);background:rgba(231,189,130,.18)}

/* reflective / refractive lens glass (Chromium) */
html.lg-ref :is(nav,.card,.nutrient,.stage-tip,.reset-view-btn,.btn.outline){backdrop-filter:blur(9px) url(#lgRefract) saturate(1.8) brightness(1.08);-webkit-backdrop-filter:blur(9px) url(#lgRefract) saturate(1.8) brightness(1.08)}

/* jelly buttons */
.btn,.nav-button{position:relative;overflow:hidden;transition:transform .55s ${SPRING},box-shadow .4s,filter .3s,background .3s,border-color .3s}
.btn:hover{transform:translateY(-3px) scale(1.045)}
.btn:active,.nav-button:active{transform:scale(.93)!important;transition-duration:.12s}
.btn::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-130%)}
.btn:hover::after{transform:translateX(130%);transition:transform .9s var(--ease-out)}
.lg-rip{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.5),rgba(255,255,255,.12) 42%,transparent 70%);transform:scale(0);animation:lgRip .95s cubic-bezier(.2,.8,.2,1) forwards;z-index:4}
@keyframes lgRip{to{transform:scale(1);opacity:0}}

/* springs own the transform of live elements */
.reveal{transition:none!important}
.lg-tilt.visible{transform:perspective(900px) translate3d(0,var(--ty,0px),0) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) scale(var(--sc,1))!important;transition:border-color .45s,box-shadow .45s!important;will-change:transform}
.lg-ch{display:inline-block;will-change:transform,filter,opacity}
:is(.hero h1,.heading h2,.ingredient-copy h2,.final h2) em{background:linear-gradient(100deg,#b77b45,#f6dca8 30%,#fff6e2 45%,#e7bd82 60%,#b77b45);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:lgShine 6s ease-in-out infinite}
@keyframes lgShine{0%,100%{background-position:100% 0}50%{background-position:0 0}}

/* floating glass bubbles */
.lg-bub{position:absolute;bottom:-120px;border-radius:50%;pointer-events:none;border:1px solid rgba(255,255,255,.4);background:radial-gradient(circle at 30% 26%,rgba(255,255,255,.55),rgba(255,255,255,.07) 45%,rgba(255,200,150,.1));box-shadow:inset 0 0 18px rgba(255,255,255,.2),0 8px 24px rgba(0,0,0,.3);backdrop-filter:blur(2px) brightness(1.2);animation:lgRise linear infinite}
@keyframes lgRise{0%{transform:translate(0,0) scale(.7);opacity:0}10%{opacity:1}50%{transform:translate(28px,-260px) scale(1)}100%{transform:translate(-22px,-620px) scale(1.12);opacity:0}}

/* glass lens cursor */
.lg-cursor{position:fixed;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;z-index:300;border:1px solid rgba(255,244,228,.55);background:radial-gradient(circle at 30% 24%,rgba(255,255,255,.4),rgba(255,255,255,.04) 62%);backdrop-filter:blur(1.5px) saturate(1.9) brightness(1.18);-webkit-backdrop-filter:blur(1.5px) saturate(1.9) brightness(1.18);box-shadow:inset 0 0 14px rgba(255,255,255,.3),0 10px 28px rgba(0,0,0,.4);will-change:transform;opacity:0}

/* ingredient modal: spring in / melt out */
.modal.open{animation:lgBd .55s var(--ease-out) both}
.modal.open .modal-box{animation:lgIn .8s ${SPRING} both}
.modal.open .group,.modal.open .btn{animation:lgTag .75s ${SPRING} both;animation-delay:calc(var(--i,0)*70ms + 220ms)}
.modal.open .tag{animation:lgTag .7s ${SPRING} both;animation-delay:calc(var(--i,0)*24ms + 320ms)}
.modal.lg-closing{animation:lgBdOut .4s ease-in forwards}
.modal.lg-closing .modal-box{animation:lgOut .4s cubic-bezier(.6,0,.9,.4) forwards}
@keyframes lgBd{from{backdrop-filter:blur(0);background:rgba(6,2,1,0)}}
@keyframes lgBdOut{to{backdrop-filter:blur(0);background:rgba(6,2,1,0)}}
@keyframes lgIn{from{opacity:0;transform:translateY(90px) scale(.62);filter:blur(22px)}}
@keyframes lgOut{to{opacity:0;transform:translateY(60px) scale(.7);filter:blur(20px)}}
@keyframes lgTag{from{opacity:0;transform:translateY(26px) scale(.8);filter:blur(8px)}}

@media (max-width:640px){
 nav{height:60px;padding:0 12px 0 18px}
 .logo{width:96px;height:40px}
 .links{top:calc(100% + 10px);border-radius:30px;border:1px solid rgba(255,255,255,.16);background:rgba(34,15,8,.55);backdrop-filter:blur(30px) saturate(1.8);box-shadow:var(--lg-in),0 24px 60px rgba(0,0,0,.5)}
 .lg-pill{display:none}
 .card,.nutrient,.stage,.ingredient-visual{border-radius:28px}
}
@media (prefers-reduced-motion:reduce){.lg-blobs i,.lg::before,.lg-bub{animation:none!important}}
`;
const st = document.createElement('style');
st.textContent = css;
document.head.appendChild(st);

const blobs = document.createElement('div');
blobs.className = 'lg-blobs';
blobs.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
document.body.prepend(blobs);

$('nav,.card,.nutrient,.stage,.ingredient-visual,.btn,.nav-button,.stage-tip,.reset-view-btn')
  .forEach(el => el.classList.add('lg'));
$('.lg-ch').forEach(() => {});
if (FINE && CHROMIUM) document.documentElement.classList.add('lg-ref');

if (RM) return;

/* ---------- spring physics ---------- */
class S {
  constructor(v = 0, k = 170, d = 15) { this.v = this.t = v; this.p = 0; this.k = k; this.d = d; }
  step(h) { this.p += (-this.k * (this.v - this.t) - this.d * this.p) * h; this.v += this.p * h; return this.v; }
  get idle() { return Math.abs(this.v - this.t) < .001 && Math.abs(this.p) < .001; }
}

/* ---------- split headings into letters ---------- */
function split(el) {
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(w => {
        if (!w.trim()) return f.append(w);
        const wd = document.createElement('span');
        wd.style.cssText = 'display:inline-block;white-space:nowrap';
        [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'lg-ch'; s.textContent = ch; wd.append(s); });
        f.append(wd);
      });
      c.replaceWith(f);
    } else if (c.nodeName === 'EM') c.classList.add('lg-ch');
    else if (c.nodeType === 1 && c.nodeName !== 'BR') walk(c);
  });
  walk(el);
  const chars = $('.lg-ch', el);
  chars.forEach(c => c.style.opacity = 0);
  return chars;
}
function playChars(chars, base = 0, gap = 36) {
  chars.forEach((c, i) => {
    const a = c.animate(
      [{ opacity: 0, transform: 'translateY(.75em) rotate(9deg) scale(.7)', filter: 'blur(16px)' },
       { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 1250, delay: base + i * gap, easing: 'cubic-bezier(.22,1.35,.36,1)', fill: 'both' });
    a.onfinish = () => { c.style.opacity = ''; a.cancel(); };
  });
}
const heroChars = split(document.querySelector('.hero h1'));
const headChars = new Map($('.heading h2,.ingredient-copy h2,.final h2').map(h => [h, split(h)]));

/* ---------- entrance choreography ---------- */
let heroGo = false;
const startHero = () => { if (heroGo) return; heroGo = true; playChars(heroChars, 0, 42); };
window.addEventListener('load', () => setTimeout(startHero, 900));
setTimeout(startHero, 3200);

const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; io.unobserve(el);
  const hero = !!el.closest('.hero');
  const d = (el.classList.contains('delay1') ? 130 : el.classList.contains('delay2') ? 260 : 0) + (hero ? 850 : 0);
  el.animate(
    [{ opacity: 0, transform: 'translateY(80px) scale(.88) rotateX(-12deg)', filter: 'blur(18px)' },
     { opacity: 1, transform: 'none', filter: 'blur(0)' }],
    { duration: 1300, delay: d, easing: 'cubic-bezier(.22,1.25,.36,1)', fill: 'backwards' });
  const hc = headChars.get(el.querySelector('h2')) || headChars.get(el);
  if (hc) playChars(hc, d + 150, 24);
}), { threshold: .14 });
$('.reveal').forEach(el => io.observe(el));
$('.ingredient-copy h2,.final h2').forEach(h => {
  const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { o.disconnect(); playChars(headChars.get(h), 120, 24); } }), { threshold: .4 });
  o.observe(h);
});

/* ---------- glass bubbles inside the ingredient visual ---------- */
const iv = document.querySelector('.ingredient-visual');
if (iv) for (let i = 0; i < 9; i++) {
  const b = document.createElement('i'), s = 18 + Math.random() * 74;
  b.className = 'lg-bub';
  b.style.cssText = `width:${s}px;height:${s}px;left:${6 + Math.random() * 84}%;animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 16}s`;
  iv.append(b);
}

/* ---------- liquid modal ---------- */
const modal = document.getElementById('modal');
const _open = window.openIngredients, _close = window.closeIngredients;
let closing = false;
window.openIngredients = function (e) {
  closing = false;
  $('.modal-box .group,.modal-box > .btn').forEach((g, i) => g.style.setProperty('--i', i));
  $('.modal-box .tag').forEach((t, i) => t.style.setProperty('--i', i % 40));
  _open(e);
};
window.closeIngredients = function () {
  if (closing || !modal.classList.contains('open')) return;
  closing = true; modal.classList.add('lg-closing');
  setTimeout(() => { _close(); modal.classList.remove('lg-closing'); closing = false; }, 400);
};

/* ---------- tilt + specular light on glass ---------- */
const tilts = [];
if (FINE) $('.card,.nutrient,.ingredient-visual').forEach(el => {
  el.classList.add('lg-tilt');
  const s = { el, rx: new S(0, 190, 15), ry: new S(0, 190, 15), ty: new S(0, 240, 17), sc: new S(1, 240, 15), live: false };
  tilts.push(s);
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    s.ry.t = (px - .5) * 16; s.rx.t = -(py - .5) * 16; s.ty.t = -9; s.sc.t = 1.03; s.live = true;
    el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
  });
  el.addEventListener('pointerleave', () => { s.rx.t = s.ry.t = s.ty.t = 0; s.sc.t = 1; });
});

/* ---------- magnetic buttons ---------- */
const mags = [];
if (FINE) $('.btn,.nav-button').forEach(el => {
  const m = { el, x: new S(0, 220, 14), y: new S(0, 220, 14) };
  mags.push(m);
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    m.x.t = (e.clientX - r.left - r.width / 2) * .3; m.y.t = (e.clientY - r.top - r.height / 2) * .38;
  });
  el.addEventListener('pointerleave', () => { m.x.t = m.y.t = 0; });
});
$('.btn,.nav-button,.card').forEach(el => el.addEventListener('pointerdown', e => {
  const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement('span');
  s.className = 'lg-rip';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.append(s); setTimeout(() => s.remove(), 1000);
}));

/* ---------- sliding glass pill in the nav ---------- */
const links = document.getElementById('links');
const pillLinks = $('a', links).filter(a => !a.classList.contains('nav-button'));
const pill = document.createElement('div');
pill.className = 'lg-pill'; links.prepend(pill);
const P = { x: new S(0, 260, 22), w: new S(0, 260, 22), o: new S(0, 200, 24) };
let activeLink = null, hoverLink = null;
const setPill = a => {
  if (!a) { P.o.t = 0; return; }
  if (P.o.v < .05) { P.x.v = P.x.t = a.offsetLeft; P.w.v = P.w.t = a.offsetWidth; }
  P.x.t = a.offsetLeft; P.w.t = a.offsetWidth; P.o.t = 1;
};
pillLinks.forEach(a => {
  a.addEventListener('pointerenter', () => { hoverLink = a; setPill(a); });
  a.addEventListener('pointerleave', () => { hoverLink = null; setPill(activeLink); });
});
const secObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  activeLink = pillLinks.find(a => a.getAttribute('href') === '#' + e.target.id) || null;
  if (!hoverLink) setPill(activeLink);
}), { rootMargin: '-45% 0px -50% 0px' });
['story', 'ingredients', 'nutrition'].forEach(id => secObs.observe(document.getElementById(id)));
const heroObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { activeLink = null; if (!hoverLink) setPill(null); } }), { rootMargin: '-45% 0px -50% 0px' });
heroObs.observe(document.querySelector('.hero'));

/* ---------- glass lens cursor ---------- */
let lens = null, cx = new S(innerWidth / 2, 330, 28), cy = new S(innerHeight / 2, 330, 28), cs = new S(1, 300, 17);
let mx = 0, my = 0;
if (FINE) {
  lens = document.createElement('div'); lens.className = 'lg-cursor'; document.body.append(lens);
  addEventListener('pointermove', e => { cx.t = e.clientX; cy.t = e.clientY; lens.style.opacity = 1; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    const t = e.target.closest && e.target.closest('a,button,.card,.nutrient,#chocolate,.tag');
    cs.t = !t ? 1 : t.id === 'chocolate' ? .55 : t.matches('a,button,.tag') ? 1.75 : 1.35; });
  addEventListener('pointerdown', () => cs.t *= .7);
  addEventListener('pointerup', () => cs.t /= .7);
  document.documentElement.addEventListener('pointerleave', () => lens.style.opacity = 0);
  addEventListener('pointermove', e => {
    const g = e.target.closest && e.target.closest('.lg');
    if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
  }, { passive: true });
}

/* ---------- scroll-velocity liquid skew ---------- */
const skewEls = $('.cards,.nutrients,.ingredient-layout,.final').map(el => ({ el, s: new S(0, 120, 12) }));
let lastY = scrollY, sv = 0;
const px = new S(0, 40, 12), py = new S(0, 40, 12), sy = new S(0, 60, 14);

/* ---------- master loop ---------- */
let last = performance.now();
(function loop(now) {
  const h = Math.min((now - last) / 1000, 1 / 30); last = now;
  const y = scrollY; sv = (y - lastY) * .9; lastY = y;
  skewEls.forEach(o => {
    o.s.t = clamp(sv * .09, -2.2, 2.2); const v = o.s.step(h);
    o.el.style.transform = Math.abs(v) > .01 ? `skewY(${v.toFixed(3)}deg)` : '';
  });
  px.t = mx; py.t = my; sy.t = y * .12;
  blobs.style.setProperty('--px', px.step(h).toFixed(4));
  blobs.style.setProperty('--py', py.step(h).toFixed(4));
  blobs.style.setProperty('--sy', sy.step(h).toFixed(2));
  tilts.forEach(s => {
    if (!s.live) return;
    const el = s.el, rx = s.rx.step(h), ry = s.ry.step(h), ty = s.ty.step(h), sc = s.sc.step(h);
    el.style.setProperty('--rx', rx.toFixed(3) + 'deg'); el.style.setProperty('--ry', ry.toFixed(3) + 'deg');
    el.style.setProperty('--ty', ty.toFixed(2) + 'px'); el.style.setProperty('--sc', sc.toFixed(4));
    if (s.rx.idle && s.ry.idle && s.ty.idle && s.sc.idle && s.sc.t === 1) {
      ['--rx', '--ry', '--ty', '--sc'].forEach(k => el.style.removeProperty(k)); s.live = false;
    }
  });
  mags.forEach(m => { const x = m.x.step(h), y2 = m.y.step(h); m.el.style.translate = (Math.abs(x) + Math.abs(y2) > .02 || !m.x.idle) ? `${x.toFixed(2)}px ${y2.toFixed(2)}px` : ''; });
  if (pillLinks.length) {
    pill.style.opacity = clamp(P.o.step(h), 0, 1).toFixed(3);
    pill.style.width = Math.max(0, P.w.step(h)).toFixed(1) + 'px';
    pill.style.transform = `translateX(${P.x.step(h).toFixed(1)}px)`;
  }
  if (lens) {
    const x = cx.step(h), y2 = cy.step(h), s = cs.step(h), sp = Math.hypot(cx.p, cy.p), ang = Math.atan2(cy.p, cx.p);
    const k = 1 + Math.min(sp / 2600, .55);
    lens.style.transform = `translate3d(${x.toFixed(1)}px,${y2.toFixed(1)}px,0) rotate(${ang}rad) scale(${(s * k).toFixed(3)},${(s / k).toFixed(3)})`;
  }
  requestAnimationFrame(loop);
})(last);
})();
