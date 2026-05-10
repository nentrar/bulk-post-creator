const PREVIEW_SIZE = 540;

let bgImage = null;
let bgImageNative = null;
let csvRows = [];
let csvRaw = '';
let fields = [];
let selectedFormat = 'jpeg';
let selectedDelim = ',';
let currentPreviewRow = 0;
let fontsLoaded = {};
let fieldCounter = 0;

const fontOptions = [
  'Oswald', 'Roboto', 'Lato', 'Montserrat', 'Playfair Display',
  'Raleway', 'PT Sans', 'Merriweather', 'Open Sans', 'Ubuntu',
  'Nunito', 'Bebas Neue', 'Dancing Script', 'Pacifico', 'Anton',
  'Exo 2', 'Righteous', 'Permanent Marker', 'Abril Fatface', 'Lobster',
];

// ── Font loading ─────────────────────────────────────────────────────────────

function loadGoogleFont(family) {
  if (fontsLoaded[family]) return Promise.resolve();
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    link.onload = () => { fontsLoaded[family] = true; document.fonts.ready.then(resolve); };
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

// ── Upload zones ──────────────────────────────────────────────────────────────

function makeZoneClickable(zoneId, inputId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });
}

makeZoneClickable('img-zone', 'img-input');
makeZoneClickable('csv-zone', 'csv-input');

document.getElementById('img-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      bgImageNative = img;
      bgImage = img;
      document.querySelector('#img-name span').textContent = file.name;
      document.getElementById('img-name').style.display = 'flex';
      renderPreview();
      renderOverlays();
      checkReady();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('csv-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    csvRaw = ev.target.result;
    parseCSV();
    document.querySelector('#csv-name span').textContent = `${file.name} (${csvRows.length} rows)`;
    document.getElementById('csv-name').style.display = 'flex';
    document.getElementById('nav-row').style.display = csvRows.length > 1 ? 'flex' : 'none';
    currentPreviewRow = 0;
    updateNavIdx();
    renderPreview();
    checkReady();
  };
  reader.readAsText(file);
});

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCSV() {
  const lines = csvRaw.trim().split('\n').filter(l => l.trim());
  csvRows = lines.map(line => {
    const cols = line.split(selectedDelim).map(c => c.trim().replace(/^"|"$/g, ''));
    return { lp: cols[0], values: cols.slice(1) };
  });
  const prev = document.getElementById('csv-preview');
  prev.style.display = 'block';
  prev.textContent =
    csvRows.slice(0, 5).map(r => `${r.lp}: ${r.values.join(' | ')}`).join('\n') +
    (csvRows.length > 5 ? `\n...+${csvRows.length - 5} more` : '');
}

document.querySelectorAll('.delim-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.delim-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDelim = btn.dataset.delim;
    if (csvRaw) { parseCSV(); updateNavIdx(); renderPreview(); checkReady(); }
  });
});

// ── Fields ────────────────────────────────────────────────────────────────────

document.getElementById('add-field-btn').addEventListener('click', addField);

function addField() {
  const id = ++fieldCounter;
  const field = {
    id,
    label: `Field ${id}`,
    font: 'Oswald',
    size: 80,
    color: '#ffffff',
    x: 0.08,
    y: 0.3 + fields.length * 0.18,
    maxWidth: 0.85,
    lineHeight: 1.2,
    align: 'left',
  };
  fields.push(field);
  loadGoogleFont(field.font).then(() => { renderPreview(); renderOverlays(); });
  renderFieldList();
  checkReady();
}

function removeField(id) {
  fields = fields.filter(f => f.id !== id);
  renderFieldList();
  renderOverlays();
  renderPreview();
  checkReady();
}

function renderFieldList() {
  const list = document.getElementById('field-list');
  list.innerHTML = '';
  fields.forEach(f => {
    const el = document.createElement('div');
    el.className = 'field-item';
    el.innerHTML = `
      <div class="field-row">
        <span class="field-tag">F${f.id}</span>
        <input class="field-name-input" type="text" value="${f.label}" placeholder="Label" data-id="${f.id}" data-prop="label">
        <button class="btn-remove" data-id="${f.id}" aria-label="Remove field">
          <i class="ti ti-x" aria-hidden="true" style="font-size:14px"></i>
        </button>
      </div>
      <div class="field-opts">
        <div>
          <label>Font</label>
          <select data-id="${f.id}" data-prop="font">
            ${fontOptions.map(fn => `<option value="${fn}" ${fn === f.font ? 'selected' : ''}>${fn}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Size (px)</label>
          <input type="number" min="10" max="400" value="${f.size}" data-id="${f.id}" data-prop="size">
        </div>
        <div>
          <label>Color</label>
          <input type="color" value="${f.color}" data-id="${f.id}" data-prop="color">
        </div>
        <div>
          <label>Align</label>
          <select data-id="${f.id}" data-prop="align">
            <option value="left"   ${f.align === 'left'   ? 'selected' : ''}>Left</option>
            <option value="center" ${f.align === 'center' ? 'selected' : ''}>Center</option>
            <option value="right"  ${f.align === 'right'  ? 'selected' : ''}>Right</option>
          </select>
        </div>
        <div>
          <label>Max width (%)</label>
          <input type="number" min="10" max="100" value="${Math.round(f.maxWidth * 100)}" data-id="${f.id}" data-prop="maxWidth">
        </div>
        <div>
          <label>Line height</label>
          <input type="number" min="0.8" max="3" step="0.05" value="${f.lineHeight}" data-id="${f.id}" data-prop="lineHeight">
        </div>
      </div>`;

    el.querySelector('.btn-remove').addEventListener('click', () => removeField(f.id));

    el.querySelectorAll('[data-prop]').forEach(input => {
      input.addEventListener('change', async () => {
        const fld = fields.find(x => x.id == input.dataset.id);
        if (!fld) return;
        let val = input.value;
        if (input.type === 'number') val = parseFloat(val);
        if (input.dataset.prop === 'maxWidth') val = val / 100;
        if (input.dataset.prop === 'size') val = parseInt(val);
        fld[input.dataset.prop] = val;
        if (input.dataset.prop === 'font') await loadGoogleFont(val);
        renderPreview();
        renderOverlays();
      });
    });

    list.appendChild(el);
  });
}

// ── Canvas & text rendering ───────────────────────────────────────────────────

function wrapText(ctx, text, x, y, maxWidth, lineHeight, fontSize, align) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  lines.forEach((line, i) => {
    let lx = x;
    if (align === 'center') lx = x + maxWidth / 2;
    else if (align === 'right') lx = x + maxWidth;
    ctx.fillText(line, lx, y + i * fontSize * lineHeight);
  });

  return lines.length;
}

function drawField(ctx, txt, f, size) {
  if (!txt) return;
  const nativeW = bgImageNative ? bgImageNative.naturalWidth : PREVIEW_SIZE;
  const scaledSize = Math.round(f.size * (size / nativeW));
  const maxPx = f.maxWidth * size;
  ctx.save();
  ctx.font = `${scaledSize}px '${f.font}', sans-serif`;
  ctx.fillStyle = f.color;
  ctx.textAlign = f.align;
  ctx.textBaseline = 'top';
  wrapText(ctx, txt, f.x * size, f.y * size, maxPx, f.lineHeight, scaledSize, f.align);
  ctx.restore();
}

function getRowTexts(rowIdx) {
  if (!csvRows.length) return fields.map(f => f.label);
  const row = csvRows[rowIdx] || csvRows[0];
  return fields.map((_, i) => row.values[i] || '');
}

function renderPreview() {
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

  if (!bgImage) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.fillStyle = '#999';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Upload an image', PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
    return;
  }

  const nW = bgImageNative.naturalWidth;
  const nH = bgImageNative.naturalHeight;
  const dim = Math.min(nW, nH);
  const ox = (nW - dim) / 2;
  const oy = (nH - dim) / 2;
  ctx.drawImage(bgImageNative, ox, oy, dim, dim, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

  const texts = getRowTexts(currentPreviewRow);
  fields.forEach((f, i) => drawField(ctx, texts[i] || '', f, PREVIEW_SIZE));
}

// ── Draggable overlays ────────────────────────────────────────────────────────

function renderOverlays() {
  const wrap = document.getElementById('canvas-wrap');
  wrap.querySelectorAll('.overlay-field').forEach(el => el.remove());

  fields.forEach(f => {
    const el = document.createElement('div');
    el.className = 'overlay-field';
    el.innerHTML = `<i class="ti ti-grip-horizontal" aria-hidden="true" style="font-size:10px;margin-right:4px"></i>${f.label}`;
    const nativeW = bgImageNative ? bgImageNative.naturalWidth : PREVIEW_SIZE;
    const scaledSize = Math.max(11, Math.round(f.size * (PREVIEW_SIZE / nativeW)));
    el.style.cssText = `left:${f.x * PREVIEW_SIZE}px;top:${f.y * PREVIEW_SIZE}px;font-size:${scaledSize}px;font-family:'${f.font}',sans-serif;color:${f.color};`;
    makeDraggable(el, f);
    wrap.appendChild(el);
  });
}

function makeDraggable(el, f) {
  let startX, startY, origX, origY;

  const onMove = e => {
    const ev = e.touches ? e.touches[0] : e;
    const newLeft = Math.max(0, Math.min(PREVIEW_SIZE - 10, origX + ev.clientX - startX));
    const newTop  = Math.max(0, Math.min(PREVIEW_SIZE - 10, origY + ev.clientY - startY));
    el.style.left = newLeft + 'px';
    el.style.top  = newTop  + 'px';
    f.x = newLeft / PREVIEW_SIZE;
    f.y = newTop  / PREVIEW_SIZE;
    renderPreview();
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  };

  el.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    origX = parseFloat(el.style.left); origY = parseFloat(el.style.top);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  });

  el.addEventListener('touchstart', e => {
    e.preventDefault();
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    origX = parseFloat(el.style.left); origY = parseFloat(el.style.top);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  });
}

// ── Validation & state ────────────────────────────────────────────────────────

function showError(msg) {
  const box = document.getElementById('error-box');
  document.getElementById('error-msg').textContent = msg;
  box.style.display = msg ? 'flex' : 'none';
}

function validateCSV() {
  const fc = fields.length;
  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    if (row.values.length < fc) {
      return `Row ${i + 1} (lp=${row.lp}): expected ${fc} value${fc > 1 ? 's' : ''} but found ${row.values.length}. Check delimiter or field count.`;
    }
  }
  return null;
}

function checkReady() {
  const ok = bgImage && csvRows.length > 0 && fields.length > 0;
  document.getElementById('generate-btn').disabled = !ok;
  if (ok) {
    const err = validateCSV();
    showError(err || '');
    document.getElementById('generate-btn').disabled = !!err;
  } else {
    showError('');
  }
}

// ── Format selector ───────────────────────────────────────────────────────────

document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedFormat = btn.dataset.fmt;
  });
});

// ── Preview navigation ────────────────────────────────────────────────────────

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentPreviewRow > 0) { currentPreviewRow--; updateNavIdx(); renderPreview(); }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentPreviewRow < csvRows.length - 1) { currentPreviewRow++; updateNavIdx(); renderPreview(); }
});

function updateNavIdx() {
  document.getElementById('nav-idx').textContent = `Row ${currentPreviewRow + 1} / ${csvRows.length}`;
}

// ── Generate ZIP ──────────────────────────────────────────────────────────────

document.getElementById('generate-btn').addEventListener('click', async () => {
  const err = validateCSV();
  if (err) { showError(err); return; }
  showError('');

  const bar  = document.getElementById('progress-bar');
  const fill = document.getElementById('progress-fill');
  bar.style.display = 'block';
  fill.style.width = '0%';

  const zip = new JSZip();
  const nW  = bgImageNative.naturalWidth;
  const nH  = bgImageNative.naturalHeight;
  const dim = Math.min(nW, nH);
  const ox  = (nW - dim) / 2;
  const oy  = (nH - dim) / 2;

  const offCanvas = document.createElement('canvas');
  offCanvas.width  = dim;
  offCanvas.height = dim;
  const ctx = offCanvas.getContext('2d');

  const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const extMap  = { jpeg: 'jpg',        png: 'png',       webp: 'webp'       };
  const mime    = mimeMap[selectedFormat];
  const ext     = extMap[selectedFormat];
  const quality = selectedFormat === 'png' ? undefined : 0.92;

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    ctx.clearRect(0, 0, dim, dim);
    ctx.drawImage(bgImageNative, ox, oy, dim, dim, 0, 0, dim, dim);

    fields.forEach((f, fi) => {
      const txt = row.values[fi] || '';
      if (!txt) return;
      ctx.save();
      ctx.font = `${f.size}px '${f.font}', sans-serif`;
      ctx.fillStyle = f.color;
      ctx.textAlign = f.align;
      ctx.textBaseline = 'top';
      wrapText(ctx, txt, f.x * dim, f.y * dim, f.maxWidth * dim, f.lineHeight, f.size, f.align);
      ctx.restore();
    });

    const base64 = offCanvas.toDataURL(mime, quality).split(',')[1];
    zip.file(`post_${String(row.lp).padStart(3, '0')}.${ext}`, base64, { base64: true });

    fill.style.width = Math.round(((i + 1) / csvRows.length) * 100) + '%';
    await new Promise(r => setTimeout(r, 0));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `posts_${Date.now()}.zip`;
  a.click();

  bar.style.display = 'none';
  fill.style.width = '0%';
});

// ── Init ──────────────────────────────────────────────────────────────────────

renderPreview();
