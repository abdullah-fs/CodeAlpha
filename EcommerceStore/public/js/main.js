// Add to cart without reloading the page
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message, isError) {
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = 'toast'), 2200);
}

document.querySelectorAll('form.js-add').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form)),
      });
      const data = await res.json();
      if (typeof data.count === 'number') document.getElementById('cart-count').textContent = data.count;
      showToast(data.message, !data.ok);
    } catch (err) {
      showToast('Could not add to cart. Try again.', true);
    } finally {
      btn.disabled = false;
    }
  });
});
