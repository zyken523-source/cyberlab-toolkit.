/* MURDANY // CYBERLAB — app.js v2.0 */

const API = ''; // backend belum diset

/* ─── Matrix rain ─────────────────────────────────────── */
(function(){
  const c = document.getElementById('matrix');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, cols, drops;
  const chars = 'アカサタナハマヤラワ0123456789ABCDEF<>/\\[]{}#$%&';

  function resize(){
    w = c.width = innerWidth;
    h = c.height = innerHeight;
    cols = Math.floor(w / 14);
    drops = Array(cols).fill(0).map(() => Math.random() * -100);
  }
  resize();
  addEventListener('resize', resize);

  setInterval(() => {
    ctx.fillStyle = 'rgba(2,5,10,0.08)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '14px monospace';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    for (let i = 0; i < drops.length; i++){
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 14, drops[i] * 14);
      if (drops[i] * 14 > h && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5;
    }
  }, 50);
})();

/* ─── Clock ───────────────────────────────────────────── */
setInterval(() => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}, 1000);

/* ─── Boot sequence ───────────────────────────────────── */
(function(){
  const el = document.getElementById('bootText');
  const ov = document.getElementById('boot');
  if (!el || !ov) return;
  const lines = [
    '[ OK ] Initializing MURDANY CyberLab v2.0',
    '[ OK ] Loading scope manager...',
    '[ OK ] Loading report builder...',
    '[ OK ] Loading recon engine...',
    '[ OK ] Ethical-mode: VERIFIED',
    '',
    '   ▸ ACCESS GRANTED · WELCOME, MURDANY'
  ];
  let i = 0;
  (function step(){
    if (i >= lines.length){
      setTimeout(() => ov.classList.add('done'), 400);
      return;
    }
    el.textContent += lines[i++] + '\n';
    setTimeout(step, 140);
  })();
})();

/* ─── Tab switching ───────────────────────────────────── */
let currentTool = 'dns';
const $panelScope  = document.getElementById('panel-scope');
const $panelReport = document.getElementById('panel-report');
const $panelScan   = document.getElementById('panel-scan');

document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    const isSpecial = (currentTool === 'scope' || currentTool === 'report');
    $panelScope.style.display  = currentTool === 'scope'  ? '' : 'none';
    $panelReport.style.display = currentTool === 'report' ? '' : 'none';
    $panelScan.style.display   = isSpecial ? 'none' : '';
  });
});

/* ─── Scope Manager ───────────────────────────────────── */
const SCOPE_KEY = 'murdany_scope';
let scopeList = JSON.parse(localStorage.getItem(SCOPE_KEY) || '[]');
const $scopeInput = document.getElementById('scopeInput');
const $scopeList  = document.getElementById('scopeList');

function renderScope(){
  $scopeList.innerHTML = '';
  if (scopeList.length === 0){
    $scopeList.innerHTML = '<li style="color:#4a8fa8">[ kosong ] belum ada domain</li>';
    return;
  }
  scopeList.forEach((d, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${d}</span>`;
    const b = document.createElement('button');
    b.textContent = 'HAPUS';
    b.onclick = () => {
      scopeList.splice(i, 1);
      saveScope();
    };
    li.appendChild(b);
    $scopeList.appendChild(li);
  });
}

function saveScope(){
  localStorage.setItem(SCOPE_KEY, JSON.stringify(scopeList));
  renderScope();
}

function isInScope(domain){
  return scopeList.some(s => domain === s || domain.endsWith('.' + s));
}

document.getElementById('scopeAdd').addEventListener('click', () => {
  const d = $scopeInput.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!d) return;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)){
    alert('Format domain tidak valid');
    return;
  }
  if (scopeList.includes(d)){
    alert('Sudah ada di scope');
    return;
  }
  scopeList.push(d);
  saveScope();
  $scopeInput.value = '';
});

$scopeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('scopeAdd').click();
});

renderScope();

/* ─── Report Builder ──────────────────────────────────── */
function buildReport(){
  const g = id => document.getElementById(id).value.trim();
  const title   = g('r-title');
  const summary = g('r-summary');
  const steps   = g('r-steps');
  const impact  = g('r-impact');
  const poc     = g('r-poc');
  const fix     = g('r-fix');

  if (!title || !summary || !steps || !impact){
    return '[!] Title, Summary, Steps, dan Impact wajib diisi.';
  }

  return `# ${title}

## Summary
${summary}

## Steps to Reproduce
${steps}

## Impact
${impact}

## Proof of Concept
${poc || '(screenshot attached)'}

## Suggested Fix
${fix || '(direkomendasikan oleh researcher)'}

---
_Report generated by MURDANY CyberLab_`;
}

document.getElementById('r-generate').addEventListener('click', () => {
  document.getElementById('r-output').textContent = buildReport();
});

document.getElementById('r-copy').addEventListener('click', async () => {
  const t = buildReport();
  document.getElementById('r-output').textContent = t;
  if (t.startsWith('[!]')) return;
  try {
    await navigator.clipboard.writeText(t);
    alert('Laporan dicopy ke clipboard!');
  } catch {
    alert('Gagal copy — salin manual.');
  }
});

/* ─── Execute scan ────────────────────────────────────── */
const $target = document.getElementById('target');
const $result = document.getElementById('result');
const $run    = document.getElementById('run');

$run.addEventListener('click', async () => {
  const target = $target.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!target){
    $result.textContent = '[!] target kosong.';
    return;
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(target)){
    $result.textContent = '[!] Format domain tidak valid.';
    return;
  }
  if (!isInScope(target)){
    $result.textContent =
      `[!] TARGET DI LUAR SCOPE\n` +
      `[!] ${target} tidak ada di Scope Manager.\n` +
      `[!] Tambahkan lewat tab [ SCOPE ] hanya jika Anda punya izin.`;
    return;
  }
  if (!API){
    $result.textContent =
      `[>] target : ${target}\n` +
      `[>] modul  : ${currentTool.toUpperCase()}\n` +
      `[!] Backend API belum diset.\n` +
      `[!] Modul scan akan jalan setelah Cloudflare Worker dideploy.`;
    return;
  }

  $run.disabled = true;
  $result.textContent = `[>] scanning ${target}...`;

  try {
    const res = await fetch(`${API}/api/${currentTool}?target=${encodeURIComponent(target)}`);
    const data = await res.json();
    $result.textContent = JSON.stringify(data, null, 2);
  } catch(e){
    $result.textContent = 'Error: ' + e.message;
  } finally {
    $run.disabled = false;
  }
});

$target.addEventListener('keydown', e => {
  if (e.key === 'Enter') $run.click();
});

document.getElementById('clear').addEventListener('click', () => {
  $result.textContent = '[!] cleared. _';
});

addEventListener('load', () => setTimeout(() => $target.focus(), 1400));
