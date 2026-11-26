import { DEFAULT_CONTENT } from '/defaults.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const MOCK = location.hostname === 'localhost' && new URLSearchParams(location.search).has('mock');
let PASS = '';
try { PASS = sessionStorage.getItem('tenshi_pass') || ''; } catch (e) { }
let C = clone(DEFAULT_CONTENT), dirty = false, toRemove = [], busy = 0;

function merge(dst, src) {
  if (!src || typeof src !== 'object') return dst;
  for (const k in src) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], v);
    else if (v !== undefined) dst[k] = v;
  }
  return dst;
}
const get = path => path.split('.').reduce((o, k) => o == null ? o : o[k], C);
function set(path, v) {
  const ks = path.split('.'); let o = C;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = v;
}
function status(msg, cls = '') { const s = $('#st'); s.textContent = msg; s.className = 'st ' + cls; }
function markDirty() { dirty = true; status('Unsaved changes', 'dirty'); }

async function api(path, opts = {}) {
  const r = await fetch(path, Object.assign({ headers: { 'content-type': 'application/json', 'x-admin-pass': PASS } }, opts));
  let j = {}; try { j = await r.json(); } catch (e) { }
  if (!r.ok) throw new Error(j.error || ('Request failed (' + r.status + ')'));
  return j;
}

/* ---------- login ---------- */
async function login(p) {
  PASS = p;
  const j = await api('/api/auth', { method: 'POST', body: JSON.stringify({ pass: p }) });
  try { sessionStorage.setItem('tenshi_pass', p); localStorage.setItem('tenshi_dev', '1'); } catch (e) { }
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  const chip = $('#store');
  if (j.storage) { chip.textContent = 'storage connected'; chip.className = 'chip ok'; }
  else { chip.textContent = 'storage not connected'; chip.className = 'chip bad'; status('Storage is not connected yet. See step 3 of the setup guide. Saving won’t work until then.', 'err'); }
  await load();
}
$('#lf').addEventListener('submit', async e => {
  e.preventDefault(); $('#lerr').textContent = '';
  try { await login($('#pass').value.trim()); } catch (err) { $('#lerr').textContent = err.message; }
});
if (PASS) login(PASS).catch(() => { PASS = ''; });

/* ---------- load + bind ---------- */
async function load() {
  try {
    const r = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
    const j = r.ok ? await r.json() : {};
    C = merge(clone(DEFAULT_CONTENT), j);
  } catch (e) { C = clone(DEFAULT_CONTENT); }
  bind(); dirty = false; if (!$('#st').classList.contains('err')) status('Everything is up to date');
}
function bind() {
  for (const el of $$('[data-k]')) {
    const k = el.dataset.k, v = get(k);
    el.value = el.hasAttribute('data-lines') ? (Array.isArray(v) ? v.join('\n') : (v || '')) : (v == null ? '' : v);
    el.oninput = () => { set(k, el.hasAttribute('data-lines') ? el.value.split('\n').map(s => s.trim()).filter(Boolean) : el.value); markDirty(); };
  }
  for (const el of $$('[data-file]')) renderFile(el);
  const ph = $('[data-photos]'); renderPhotosPicker(ph); renderPhotos();
}

/* ---------- uploads ---------- */
let blobUpload = null;
async function uploadFile(file, slot, onProg) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
  const pathname = `media/${slot}-${safe}`;
  if (MOCK) {
    const r = await fetch('/api/mock-upload?name=' + encodeURIComponent(pathname), { method: 'PUT', body: file });
    const j = await r.json(); onProg && onProg(100); return { url: j.url };
  }
  if (!blobUpload) blobUpload = (await import('/blob-client.js')).upload;
  return await blobUpload(pathname, file, {
    access: 'public', handleUploadUrl: '/api/upload', clientPayload: PASS, contentType: file.type || undefined,
    multipart: file.size > 15 * 1024 * 1024, onUploadProgress: e => onProg && onProg(e.percentage)
  });
}
function renderFile(box) {
  const path = box.dataset.file, cur = get(path);
  box.textContent = '';
  const name = document.createElement('div'); name.className = 'name';
  if (cur && cur.url) { const b = document.createElement('b'); b.textContent = cur.name || 'file'; name.appendChild(b); }
  else name.textContent = 'nothing uploaded';
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = box.dataset.accept || '';
  const up = document.createElement('button'); up.className = 'btn sm'; up.textContent = cur && cur.url ? 'Replace' : 'Upload'; up.type = 'button';
  up.onclick = () => inp.click();
  const prog = document.createElement('div'); prog.className = 'prog'; const bar = document.createElement('i'); prog.appendChild(bar);
  box.append(name, up);
  if (cur && cur.url) {
    const rm = document.createElement('button'); rm.className = 'btn sm danger'; rm.textContent = 'Remove'; rm.type = 'button';
    rm.onclick = () => { toRemove.push(cur.url); set(path, null); markDirty(); renderFile(box); };
    box.appendChild(rm);
    if (path.startsWith('music.')) { const a = document.createElement('audio'); a.controls = true; a.preload = 'none'; a.src = cur.url; box.appendChild(a); }
  }
  box.append(prog, inp);
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    prog.style.display = 'block'; up.disabled = true; busy++; status('Uploading ' + f.name + '…', 'dirty');
    try {
      const res = await uploadFile(f, path.replace(/\W+/g, '-'), p => bar.style.width = p + '%');
      const prev = get(path); if (prev && prev.url) toRemove.push(prev.url);
      set(path, { url: res.url, name: f.name, type: f.type || '' });
      busy--; renderFile(box); await save('Uploaded and saved ✓');
    } catch (e) { busy--; status('Upload failed: ' + e.message, 'err'); prog.style.display = 'none'; up.disabled = false; }
  };
}
function renderPhotosPicker(box) {
  box.textContent = '';
  const name = document.createElement('div'); name.className = 'name'; name.textContent = 'add as many as you like. they fade one after another';
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
  const up = document.createElement('button'); up.className = 'btn sm'; up.textContent = 'Add photos'; up.type = 'button'; up.onclick = () => inp.click();
  const prog = document.createElement('div'); prog.className = 'prog'; const bar = document.createElement('i'); prog.appendChild(bar);
  box.append(name, up, prog, inp);
  inp.onchange = async () => {
    const files = [...(inp.files || [])]; if (!files.length) return;
    prog.style.display = 'block'; up.disabled = true; busy++;
    const list = get('ending.photos') || []; set('ending.photos', list);
    try {
      for (let i = 0; i < files.length; i++) {
        status(`Uploading photo ${i + 1} of ${files.length}…`, 'dirty');
        const res = await uploadFile(files[i], 'photo', p => bar.style.width = ((i + p / 100) / files.length * 100) + '%');
        list.push({ url: res.url, name: files[i].name, type: files[i].type }); renderPhotos();
      }
      busy--; prog.style.display = 'none'; up.disabled = false; inp.value = '';
      await save('Photos uploaded and saved ✓');
    } catch (e) { busy--; status('Upload failed: ' + e.message, 'err'); prog.style.display = 'none'; up.disabled = false; }
  };
}
function renderPhotos() {
  const g = $('#photos'); g.textContent = '';
  const list = get('ending.photos') || [];
  list.forEach((ph, i) => {
    const d = document.createElement('div'); d.className = 'ph';
    const im = document.createElement('img'); im.src = ph.url; im.alt = ''; im.loading = 'lazy'; d.appendChild(im);
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.type = 'button';
    x.onclick = () => { toRemove.push(ph.url); list.splice(i, 1); markDirty(); renderPhotos(); };
    const mv = document.createElement('div'); mv.className = 'mv';
    const l = document.createElement('button'); l.textContent = '‹'; l.type = 'button'; l.onclick = () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; markDirty(); renderPhotos(); } };
    const r = document.createElement('button'); r.textContent = '›'; r.type = 'button'; r.onclick = () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; markDirty(); renderPhotos(); } };
    mv.append(l, r); d.append(x, mv); g.appendChild(d);
  });
}

/* ---------- save ---------- */
async function save(okMsg = 'Saved ✓  She’ll see it the next time the game opens.') {
  const b = $('#save'); b.disabled = true; status('Saving…', 'dirty');
  try {
    await api('/api/save', { method: 'POST', body: JSON.stringify({ content: C, remove: toRemove }) });
    toRemove = []; dirty = false; status(okMsg, 'ok');
  } catch (e) { status('Could not save: ' + e.message, 'err'); }
  b.disabled = false;
}
$('#save').addEventListener('click', () => save());
window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
