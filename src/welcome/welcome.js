// Set logo via extension URL so relative paths never break
const logoEl = document.getElementById('nav-logo');
if (logoEl && typeof chrome !== 'undefined' && chrome.runtime) {
  logoEl.src = chrome.runtime.getURL('icons/icon128.png');
}

let cur = 0;
const total = 3;

function open_(url) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

function nav(d) {
  const next = cur + d;
  if (next < 0 || next >= total) return;
  cur = next;
  render();
}

function render() {
  for (let i = 0; i < total; i++) {
    document.getElementById('s' + i).classList.toggle('on', i === cur);
    const p = document.getElementById('p' + i);
    p.className = 'step-pip';
    if (i < cur) p.classList.add('done');
    else if (i === cur) p.classList.add('active');
  }

  const isLast = cur === total - 1;
  document.getElementById('backBtn').style.display = cur > 0 ? '' : 'none';
  document.getElementById('footerBtns').style.display = isLast ? 'none' : '';
  document.getElementById('launcher').style.display = isLast ? 'flex' : 'none';

  const nb = document.getElementById('nextBtn');
  if (nb) nb.textContent = cur === 0 ? 'Get started →' : 'Next →';

  if (cur === 1) {
    setTimeout(() => {
      const f = document.getElementById('demo-fill');
      if (f) f.style.width = '62%';
    }, 120);
  }
}

// Wire buttons via addEventListener — no inline onclick allowed under MV3 CSP
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('backBtn')?.addEventListener('click', () => nav(-1));
  document.getElementById('nextBtn')?.addEventListener('click', () => nav(1));

  // launcher back button
  document.querySelector('.launcher .btn-back')?.addEventListener('click', () => nav(-1));

  // platform open buttons
  document.getElementById('lbtn-claude')?.addEventListener('click',    () => open_('https://claude.ai'));
  document.getElementById('lbtn-chatgpt')?.addEventListener('click',   () => open_('https://chatgpt.com'));
  document.getElementById('lbtn-gemini')?.addEventListener('click',    () => open_('https://gemini.google.com'));
  document.getElementById('lbtn-deepseek')?.addEventListener('click',  () => open_('https://chat.deepseek.com'));

  render();
});
