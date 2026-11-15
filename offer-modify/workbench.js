const byId = id => document.getElementById(id);
const upload = byId('upload');
const status = byId('status');
const canvas = byId('source');
const context = canvas.getContext('2d');
const source = new Image();
const labels = {
  originalSchool: '原院校', originalProgramme: '原专业', school: '录取院校',
  programme: '录取项目', offerDate: '发函日期（YYYY-MM-DD）',
  intake: '入学月份（YYYY-MM）', offerType: '录取类型',
};
const fields = Object.fromEntries(Object.entries(labels).map(([key, caption]) => {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.maxLength = 180;
  label.append(caption, input);
  byId('fields').append(label);
  return [key, input];
}));
let offer;
let masks = [];
let start;
let version = 0;

function invalidate() {
  version += 1;
  byId('result').hidden = true;
}

function draw(draft) {
  const { width, height } = canvas;
  context.drawImage(source, 0, 0);
  context.strokeStyle = '#1873cc';
  context.fillStyle = '#1873cc25';
  context.lineWidth = 3;
  for (const [x1, y1, x2, y2] of draft ? [...masks, draft] : masks) {
    context.fillRect(x1 * width, y1 * height, (x2 - x1) * width, (y2 - y1) * height);
    context.strokeRect(x1 * width, y1 * height, (x2 - x1) * width, (y2 - y1) * height);
  }
  byId('undo').disabled = masks.length === 0;
  byId('clear').disabled = masks.length === 0;
}

async function send(path, data) {
  const response = await fetch(path, { method: 'POST', body: data });
  if (response.status === 413) throw new Error('文件超过 32 MB。');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '处理失败。');
  return result;
}

byId('offer').addEventListener('input', () => {
  invalidate();
  byId('editor').hidden = true;
  status.textContent = '';
});
upload.addEventListener('submit', async event => {
  event.preventDefault();
  invalidate();
  const current = version;
  const data = new FormData(upload);
  byId('editor').hidden = true;
  status.textContent = '正在读取文件和识别字段…';
  try {
    const result = await send('/inspect', data);
    if (current !== version) return;
    source.src = result.image;
    await source.decode();
    if (current !== version) return;
    offer = data.get('offer');
    masks = [];
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    for (const [key, input] of Object.entries(fields)) input.value = result.fields[key] || '';
    byId('editor').hidden = false;
    draw();
    showDownload(result);
    status.textContent = `已处理第一页，自动遮盖 ${result.maskCount} 处。请核对后下载。`;
  } catch (error) {
    if (current === version) status.textContent = error.message;
  }
});

function point(event) {
  const bounds = canvas.getBoundingClientRect();
  return [
    Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
  ];
}

function rectangle(end) {
  return [Math.min(start[0], end[0]), Math.min(start[1], end[1]),
    Math.max(start[0], end[0]), Math.max(start[1], end[1])];
}

canvas.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  canvas.setPointerCapture(event.pointerId);
  start = point(event);
});
canvas.addEventListener('pointermove', event => {
  if (start && event.isPrimary) draw(rectangle(point(event)));
});
canvas.addEventListener('pointerup', event => {
  if (!start || !event.isPrimary) return;
  const box = rectangle(point(event));
  start = null;
  if (box[2] - box[0] > .003 && box[3] - box[1] > .003 && masks.length < 100) {
    masks.push(box);
    invalidate();
  }
  draw();
});
canvas.addEventListener('pointercancel', () => { start = null; draw(); });
byId('undo').addEventListener('click', () => { masks.pop(); invalidate(); draw(); });
byId('clear').addEventListener('click', () => { masks = []; invalidate(); draw(); });
byId('fields').addEventListener('input', invalidate);
byId('review').addEventListener('click', async () => {
  invalidate();
  const current = version;
  const data = new FormData();
  data.set('offer', offer);
  data.set('masks', JSON.stringify(masks));
  data.set('fields', JSON.stringify(Object.fromEntries(
    Object.entries(fields).map(([key, input]) => [key, input.value.trim()]),
  )));
  status.textContent = '正在生成预览…';
  try {
    const result = await send('/export', data);
    if (current !== version) return;
    showDownload(result);
    status.textContent = '已生成预览，请核对后下载。';
  } catch (error) {
    if (current === version) status.textContent = error.message;
  }
});

function showDownload(result) {
  byId('preview').src = result.image;
  byId('download-image').href = result.image;
  const json = byId('download-json');
  if (json.href.startsWith('blob:')) URL.revokeObjectURL(json.href);
  json.href = URL.createObjectURL(new Blob(
    [JSON.stringify(result.fields, null, 2) + '\n'], { type: 'application/json' },
  ));
  byId('result').hidden = false;
}
