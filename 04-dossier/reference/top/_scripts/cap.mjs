// usage: node cap.mjs slug url [settleMs] [steps]
// Desktop 1440x900: intro screencast (sampled ~120ms), 7 scroll stops, scroll-transition screencast,
// project click transition screencast; phone 390x844; metrics -> report.json
import { chromium, devices } from '/Users/nazarakanov/development/dossier/hybrid/node_modules/playwright/index.mjs';
import fs from 'fs';
const [slug, url, settleArg, stepsArg] = process.argv.slice(2);
const SETTLE = +(settleArg || 6000), STEPS = +(stepsArg || 7);
const OUT = `/Users/nazarakanov/development/dossier/reference/top/shots/${slug}`;
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const KEYS = ['gsap', 'ScrollTrigger', 'SplitText', 'lenis', 'locomotive-scroll', 'THREE', 'three.module', 'ogl', 'pixi', 'barba', 'swup', 'taxi', 'highway', 'lottie', 'howler', 'Howl(', 'AudioContext', 'mix-blend-mode', 'clip-path', 'gl_FragColor', 'Rive', 'theatre', 'framer-motion', 'motion/react', 'webflow', 'nuxt', '__NEXT_DATA__', 'astro'];
const browser = await chromium.launch(process.env.OLDGL ? { args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] } : { channel: 'chromium', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const report = { url, slug, when: new Date().toISOString(), libs: {}, scripts: [], stops: [], seq: {} };
const log = (...a) => console.log(slug, ...a);

async function screencast(page, name, ms, act) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
  const opts = { format: 'jpeg', quality: 60, maxWidth: 720, maxHeight: 450, everyNthFrame: 1 };
  try { await cdp.send('Page.startScreencast', opts); } catch (e) { await page.waitForTimeout(600); try { await cdp.send('Page.startScreencast', opts); } catch (e2) { log('screencast fail', name); } }
  const t0 = Date.now() / 1000;
  if (act) { try { await act(); } catch (e) { log('act', e.message.split('\n')[0]); } }
  await page.waitForTimeout(ms - (Date.now() / 1000 - t0) * 1000);
  try { await cdp.send('Page.stopScreencast'); } catch {}
  await cdp.detach().catch(() => {});
  const dir = `${OUT}/seq_${name}`; fs.mkdirSync(dir, { recursive: true });
  // sample every 120ms
  const start = frames.length ? Math.min(t0, frames[0].t) : t0; let next = start, n = 0; const kept = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const nt = i + 1 < frames.length ? frames[i + 1].t : 1e12;
    while (next < nt && next <= start + ms / 1000) {
      if (f.t <= next + 0.001) { const p = `${dir}/${String(n).padStart(2, '0')}_${Math.round((next - start) * 1000)}ms.jpg`; fs.writeFileSync(p, Buffer.from(f.d, 'base64')); kept.push(p); n++; }
      next += 0.12;
    }
  }
  report.seq[name] = { rawFrames: frames.length, kept: kept.length };
  return kept;
}

const measure = () => {
  const vis = [...document.querySelectorAll('body *')].filter((e) => {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)) return false;
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
  });
  const out = []; const seen = new Set();
  for (const e of vis) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    const key = [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.textTransform].join('|');
    if (seen.has(key)) continue; seen.add(key);
    out.push({ text: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 36), ff: cs.fontFamily.split(',')[0].replace(/["']/g, '').slice(0, 40), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight, tt: cs.textTransform, color: cs.color, left: Math.round(r.left), top: Math.round(r.top) });
    if (out.length > 30) break;
  }
  return { y: Math.round(scrollY), docH: document.documentElement.scrollHeight, samples: out };
};

// ---------- desktop ----------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const hits = {};
page.on('response', async (r) => { try { const u = r.url(); const ct = r.headers()['content-type'] || ''; if (/javascript|css|html/.test(ct) || /\.(m?js|css)(\?|$)/.test(u)) { const t = await r.text(); report.scripts.push(u.slice(0, 140)); for (const k of KEYS) if (t.includes(k)) hits[k] = (hits[k] || 0) + 1; } if (/audio|mpeg|ogg/.test(ct) || /\.(mp3|ogg|wav|m4a)(\?|$)/.test(u)) (report.audioReqs ||= []).push(u.slice(0, 140)); if (/video/.test(ct) || /\.(mp4|webm|m3u8)(\?|$)/.test(u)) (report.videoReqs ||= []).push(u.slice(0, 140)); } catch {} });
let navErr = null;
try { await page.goto(url, { waitUntil: 'commit', timeout: 45000 }); } catch (e) { navErr = e.message.split('\n')[0]; }
await screencast(page, 'intro', 3600);
if (navErr) log('nav', navErr);
await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(SETTLE);
await page.screenshot({ path: `${OUT}/d0_loaded.jpg`, type: 'jpeg', quality: 78 });
// gates / cookies
const gate = await page.evaluate(() => {
  const re = /^(enter|start|explore|accept( all)?|agree|ok|got it|allow( all)?|i agree|continue|enter site|enter without sound|without sound|sound off|skip|同意|入る|enter with sound|play)$/i;
  const els = [...document.querySelectorAll('button, a, [role=button], div, span')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.width < 500 && re.test(e.textContent.trim()); });
  const e = els.find((x) => /without|off/i.test(x.textContent)) || els[0];
  if (e) { const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  return null;
});
if (process.env.GATE_TEXT) { try { await page.getByText(process.env.GATE_TEXT, { exact: false }).first().click({ timeout: 5000 }); report.gate = process.env.GATE_TEXT; await page.waitForTimeout(+(process.env.GATE_WAIT || 3000)); } catch (e) { log('gate', e.message.split('\n')[0]); } }
else if (process.env.GATE_XY) { const [gx, gy] = process.env.GATE_XY.split(',').map(Number); await page.mouse.click(gx, gy); report.gate = 'xy'; await page.waitForTimeout(+(process.env.GATE_WAIT || 3000)); }
else if (gate) { report.gate = gate.text; await page.mouse.click(gate.x, gate.y).catch(() => {}); await page.waitForTimeout(2500); }
// cursor probe
await page.mouse.move(300, 300); await page.waitForTimeout(300);
const before = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return (cs.position === 'fixed' || cs.position === 'absolute') && cs.pointerEvents === 'none'; }).map((e, i) => { e.dataset.cp = i; const r = e.getBoundingClientRect(); return [i, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
await page.mouse.move(900, 600, { steps: 8 }); await page.waitForTimeout(600);
report.cursor = await page.evaluate((before) => {
  const moved = [];
  for (const [i, x, y, w, h] of before) { const e = document.querySelector(`[data-cp="${i}"]`); if (!e) continue; const r = e.getBoundingClientRect(); if (Math.abs(r.left - x) > 200 && Math.abs(r.top - y) > 100 && r.width < 400 && r.width > 0) moved.push({ cls: (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || e.tagName).toString().slice(0, 60), w: Math.round(r.width), h: Math.round(r.height), blend: getComputedStyle(e).mixBlendMode, bg: getComputedStyle(e).backgroundColor }); }
  return { bodyCursor: getComputedStyle(document.body).cursor, htmlCursor: getComputedStyle(document.documentElement).cursor, followers: moved.slice(0, 4) };
}, before);
await page.screenshot({ path: `${OUT}/d0.jpg`, type: 'jpeg', quality: 78 });
report.stops.push(await page.evaluate(measure));
report.dom = await page.evaluate(() => ({
  title: document.title,
  fontsLoaded: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/["']/g, '')} ${f.weight}${f.style !== 'normal' ? ' ' + f.style : ''}`))].slice(0, 20),
  canvas: [...document.querySelectorAll('canvas')].map((c) => { const gl = c.getContext('webgl2') ? 'webgl2' : c.getContext('webgl') ? 'webgl' : '2d/other'; return `${c.width}x${c.height} ${gl}`; }).slice(0, 5),
  video: document.querySelectorAll('video').length, audio: document.querySelectorAll('audio').length,
  bodyBg: getComputedStyle(document.body).backgroundColor, htmlBg: getComputedStyle(document.documentElement).backgroundColor,
  soundUI: [...document.querySelectorAll('button,a,[role=button],div,span')].filter((e) => e.childElementCount < 3 && /\bsound|audio|music|mute\b/i.test(e.textContent.trim()) && e.textContent.trim().length < 30).map((e) => e.textContent.trim()).slice(0, 4),
  blends: [...new Set([...document.querySelectorAll('*')].map((e) => getComputedStyle(e).mixBlendMode).filter((m) => m !== 'normal'))],
  globals: ['gsap', 'ScrollTrigger', 'Lenis', 'lenis', 'THREE', 'PIXI', 'barba', 'Howler', 'Webflow', '__NUXT__', '__NEXT_DATA__', 'next'].filter((k) => window[k] !== undefined),
}));
const H = 900;
for (let s = 1; s <= STEPS; s++) {
  const doStep = async () => { for (let k = 0; k < 8; k++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(35); } };
  if (s === 2) { await screencast(page, 'scroll', 2200, doStep); }
  else { await doStep(); await page.waitForTimeout(1500); }
  await page.screenshot({ path: `${OUT}/d${s}.jpg`, type: 'jpeg', quality: 78 });
  report.stops.push(await page.evaluate(measure));
}
// project click transition: go back to top, look for a work/project link
await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.wheel(0, -20000); await page.waitForTimeout(1500);
const link = await page.evaluate((base) => {
  const as = [...document.querySelectorAll('a[href]')].filter((a) => { try { const u = new URL(a.href, location.href); return u.host === location.host && u.pathname !== location.pathname && /(work|project|case|stud|portfolio|films?|clip)s?\//i.test(u.pathname + '/') && u.pathname.split('/').filter(Boolean).length >= 1; } catch { return false; } });
  const pick = as.find((a) => /(work|project|case)s?\/[^/]+/i.test(new URL(a.href).pathname)) || as[0];
  return pick ? pick.href : null;
}, url);
report.clickLink = link;
if (link) {
  try {
    const h = await page.$(`a[href="${new URL(link).pathname}"], a[href="${link}"]`);
    if (h) { await h.scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(1200); await h.hover().catch(() => {}); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/d_hover.jpg`, type: 'jpeg', quality: 78 }); }
    await screencast(page, 'click', 2800, async () => { if (h) await h.click({ timeout: 4000 }).catch(async () => { await page.evaluate((l) => { location.href = l; }, link); }); else await page.evaluate((l) => { location.href = l; }, link); });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/d_project.jpg`, type: 'jpeg', quality: 78 });
    report.projectPage = await page.evaluate(measure).catch(() => null);
    for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(35); }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/d_project2.jpg`, type: 'jpeg', quality: 78 });
  } catch (e) { log('click', e.message.split('\n')[0]); }
}
report.libs = hits;
await ctx.close();
// ---------- phone ----------
const mctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
const m = await mctx.newPage();
try { await m.goto(url, { waitUntil: 'load', timeout: 45000 }); } catch (e) { log('mnav', e.message.split('\n')[0]); }
await m.waitForTimeout(SETTLE);
await m.screenshot({ path: `${OUT}/m0.jpg`, type: 'jpeg', quality: 78 });
report.mobile0 = await m.evaluate(measure).catch(() => null);
await m.mouse.wheel(0, 900).catch(() => {}); await m.evaluate(() => window.scrollBy(0, 900)); await m.waitForTimeout(1800);
await m.screenshot({ path: `${OUT}/m1.jpg`, type: 'jpeg', quality: 78 });
await mctx.close(); await browser.close();
// summary metrics
const all = report.stops.flatMap((s) => s.samples);
const sizes = all.map((x) => x.fs).filter(Boolean);
report.typeScale = { max: Math.max(...sizes), min: Math.min(...sizes), ratio: +(Math.max(...sizes) / Math.min(...sizes)).toFixed(1) };
report.families = [...new Set(all.map((x) => x.ff))];
report.minLeft = Math.min(...report.stops[0].samples.map((x) => x.left).filter((x) => x >= 0));
report.scripts = report.scripts.slice(0, 20);
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
log('done', JSON.stringify({ ts: report.typeScale, fam: report.families.slice(0, 5), libs: Object.keys(hits), link, seq: report.seq, cursor: report.cursor }));
