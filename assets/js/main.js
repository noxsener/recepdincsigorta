// Site-wide theme selector. Light is the first-visit default; visitor preference persists across pages.
(function initThemeSelector(){
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');
  const getSavedTheme = () => { try { return localStorage.getItem('recepDincTheme'); } catch (error) { return null; } };
  const initialTheme = getSavedTheme() === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', initialTheme);
  function applyTheme(theme, save = true) {
    root.setAttribute('data-theme', theme);
    if (save) { try { localStorage.setItem('recepDincTheme', theme); } catch (error) { /* Continue when storage is unavailable. */ } }
    const isDark = theme === 'dark';
    if (button) {
      const icon = button.querySelector('.theme-toggle-icon');
      const label = button.querySelector('.theme-toggle-label');
      if (icon) icon.textContent = isDark ? '☼' : '☾';
      if (label) label.textContent = isDark ? 'Açık tema' : 'Koyu tema';
      button.setAttribute('aria-label', isDark ? 'Açık temaya geç' : 'Koyu temaya geç');
      button.setAttribute('aria-pressed', String(isDark));
      button.title = isDark ? 'Açık temaya geç' : 'Koyu temaya geç';
    }
  }
  applyTheme(initialTheme, false);
  if (button) button.addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

// Menü, teklif formu ve WhatsApp akışı. WhatsApp numarası form üzerindeki
// data-whatsapp özniteliğinden okunur (CMS'te ILETISIM / WHATSAPP parametresi).
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const quoteForm = document.getElementById('quoteForm');
const formFeedback = document.getElementById('formFeedback');
const toast = document.getElementById('toast');
const WHATSAPP_NUMBER = ((quoteForm && quoteForm.dataset.whatsapp) || document.body.dataset.whatsapp || '').replace(/\D/g, '');
const SITE_NAME = document.body.dataset.siteName || '';
let toastTimer;

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 5200);
}

function whatsappIsConfigured() {
  return /^\d{10,15}$/.test(WHATSAPP_NUMBER);
}

function openWhatsApp(message) {
  if (!whatsappIsConfigured()) {
    showToast('WhatsApp numarası henüz tanımlanmamış. Lütfen daha sonra tekrar deneyin.');
    return false;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  return true;
}

function setFeedback(message, kind = '') {
  if (!formFeedback) return;
  formFeedback.textContent = message;
  formFeedback.className = `form-feedback ${kind}`.trim();
}

function selectBranch(branch) {
  if (!quoteForm || !branch) return;
  const option = Array.from(quoteForm.elements.branch.options).find(item => item.text === branch || item.value === branch);
  if (option) quoteForm.elements.branch.value = option.value;
}

if (quoteForm) {
  selectBranch(new URLSearchParams(window.location.search).get('branch'));
  document.querySelectorAll('[data-branch]').forEach(link => {
    link.addEventListener('click', () => selectBranch(link.getAttribute('data-branch')));
  });

  quoteForm.addEventListener('submit', event => {
    event.preventDefault();
    setFeedback('');

    const fullName = quoteForm.elements.fullName.value.trim();
    const phone = quoteForm.elements.phone.value.trim();
    const branch = quoteForm.elements.branch.value;
    const note = quoteForm.elements.note.value.trim();
    const consent = quoteForm.elements.consent.checked;

    if (!fullName || !phone || !branch || !consent) {
      setFeedback('Lütfen yıldızlı alanları doldurun ve iletişim onayını işaretleyin.', 'error');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setFeedback('Lütfen geçerli bir telefon numarası girin.', 'error');
      quoteForm.elements.phone.focus();
      return;
    }

    const message = [
      `Merhaba ${SITE_NAME}, teklif almak istiyorum.`,
      '',
      `Ad Soyad: ${fullName}`,
      `Telefon: ${phone}`,
      `Sigorta Türü: ${branch}`,
      note ? `Not: ${note}` : ''
    ].filter(Boolean).join('\n');

    if (whatsappIsConfigured()) {
      setFeedback('WhatsApp mesajı yeni sekmede açılıyor. Gönderim işlemini WhatsApp üzerinden tamamlayın.', 'success');
      openWhatsApp(message);
    } else {
      setFeedback('WhatsApp numarası tanımlı olmadığı için form gönderilemedi.', 'error');
    }
  });
}

const footerWhatsapp = document.getElementById('footerWhatsapp');
if (footerWhatsapp) {
  footerWhatsapp.addEventListener('click', () => {
    openWhatsApp(`Merhaba ${SITE_NAME}, sigorta seçenekleri hakkında bilgi almak istiyorum.`);
  });
}
