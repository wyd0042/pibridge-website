const byId = id => document.getElementById(id);
const status = byId('status');
const loginForm = byId('login-form');
const uploadForm = byId('upload-form');

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '操作失败，请稍后再试。');
  return result;
}

async function showSession() {
  try {
    await request('/api/offer-modify/session');
    byId('login-panel').hidden = true;
    byId('tool-panel').hidden = false;
    status.textContent = '';
  } catch {
    byId('login-panel').hidden = false;
    byId('tool-panel').hidden = true;
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = byId('login-button');
  button.disabled = true;
  status.textContent = '正在验证…';
  try {
    await request('/api/offer-modify/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: byId('username').value, password: byId('password').value }),
    });
    byId('username').value = '';
    byId('password').value = '';
    await showSession();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  const file = byId('offer').files[0];
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    status.textContent = '请选择 PDF 文件。';
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    status.textContent = '文件不能超过 4 MB。';
    return;
  }
  const button = byId('process-button');
  button.disabled = true;
  status.textContent = '正在处理第一页…';
  try {
    const response = await fetch('/api/offer-modify/process', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', body: new FormData(uploadForm),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || (response.status === 413 ? '文件不能超过 4 MB。' : '处理失败，请检查 PDF 后重试。'));
    }
    const image = await response.blob();
    const href = URL.createObjectURL(image);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${file.name.replace(/\.pdf$/i, '')}-redacted.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
    uploadForm.reset();
    status.textContent = '处理完成，PNG 已开始下载。请检查文件后再对外发送。';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

showSession();
