// Small helpers: AJAX like/follow, delete confirmation, character counter
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message, isError) {
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = 'toast'), 2200);
}

async function post(url) {
  const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (res.status === 401 && data.login) {
    window.location.href = '/login';
    return null;
  }
  if (!data.ok) {
    showToast(data.message || 'Something went wrong.', true);
    return null;
  }
  return data;
}

// Like button
document.querySelectorAll('form.js-like').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.like-btn');
    const data = await post(form.action);
    if (!data) return;
    btn.classList.toggle('liked', data.liked);
    btn.setAttribute('aria-pressed', data.liked ? 'true' : 'false');
    btn.querySelector('.heart').textContent = data.liked ? '\u2665' : '\u2661';
    btn.querySelector('.like-count').textContent = data.count;
  });
});

// Follow button
document.querySelectorAll('form.js-follow').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.follow-btn');
    const data = await post(form.action);
    if (!data) return;
    btn.textContent = data.following ? 'Following' : 'Follow';
    btn.classList.toggle('secondary', data.following);
    const fc = document.getElementById('follower-count');
    if (fc) fc.textContent = data.count;
  });
});

// Confirm before delete
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Character counter on the post box
document.querySelectorAll('.compose textarea').forEach((ta) => {
  const counter = ta.closest('.compose').querySelector('.counter');
  if (!counter) return;
  const update = () => (counter.textContent = `${ta.value.length} / ${counter.dataset.max}`);
  ta.addEventListener('input', update);
  update();
});
