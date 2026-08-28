/* Shared configuration, navigation and small non-conflicting reveal effects. */
(function () {
  const config = window.SIDINGS_CONFIG;
  if (!config) return;

  document.title = config.browserTitle;
  document.querySelectorAll('link[rel*="icon"]').forEach((icon) => { icon.href = config.favicon; });
  document.querySelectorAll('[data-company]').forEach((el) => { el.textContent = config.companyName; });
  document.querySelectorAll('[data-logo]').forEach((el) => { el.src = config.logo; });
  document.querySelectorAll('[data-email]').forEach((el) => { el.textContent = config.email; el.href = `mailto:${config.email}`; });
  document.querySelectorAll('[data-disclaimer]').forEach((el) => { el.textContent = config.disclaimer; });

  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => header?.classList.toggle('compact', window.scrollY > 30), { passive: true });
  document.querySelector('.mobile-toggle')?.addEventListener('click', () => document.querySelector('.nav')?.classList.toggle('open'));
  document.querySelectorAll('.faq-question').forEach((button) => button.addEventListener('click', () => button.closest('.faq-item')?.classList.toggle('open')));

  if (window.AOS) {
    document.querySelectorAll('.page-intro, .faq-title, .services-head > div:first-child').forEach((el) => el.setAttribute('data-aos', 'fade-up'));
    window.AOS.init({ duration: 560, once: true, offset: 80, easing: 'ease-out-cubic', disable: 'mobile' });
  }
}());
