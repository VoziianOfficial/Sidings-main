/* Home-only interactions: billboard, material controls, sliders and comparison. */
(function () {
  const billboard = document.querySelector('.billboard');
  if (billboard) {
    const images = (billboard.dataset.futureImages || '').split(',').map((item) => item.trim()).filter(Boolean);
    const strips = [...billboard.querySelectorAll('.strip')];
    let index = 0;
    let topDown = true;
    const reveal = () => {
      if (images.length < 2 || !strips.length) return;
      index = (index + 1) % images.length;
      const ordered = topDown ? strips : [...strips].reverse();
      ordered.forEach((strip, position) => {
        window.setTimeout(() => {
          strip.style.setProperty('--billboard-shift', topDown ? '-24px' : '24px');
          strip.classList.add('is-changing');
        }, position * 65);
        window.setTimeout(() => {
          strip.style.backgroundImage = `url('${images[index]}')`;
          strip.classList.remove('is-changing');
        }, 180 + (position * 65));
      });
      topDown = !topDown;
    };
    window.setInterval(reveal, 7000);
    window.addEventListener('scroll', () => { billboard.style.transform = `scale(${1 + Math.min(window.scrollY, 800) / 30000})`; }, { passive: true });
  }

  document.querySelectorAll('[data-material]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-material]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const material = button.dataset.material;
    const wall = document.querySelector('.material-wall');
    const copy = document.querySelector('.matter-copy');
    if (wall) wall.dataset.material = material;
    if (copy) copy.textContent = { vinyl: 'Vinyl keeps the composition crisp with steady horizontal rhythm.', fiber: 'Fiber cement brings a denser, finer panel cadence.', board: 'Board & batten turns the elevation vertical and architectural.' }[material];
  }));
  document.querySelectorAll('[data-rhythm]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-rhythm]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const facade = document.querySelector('.rhythm-facade');
    if (facade) facade.dataset.rhythm = button.dataset.rhythm;
  }));

  const repairModel = document.querySelector('.repair-model');
  let repairLocked = false;
  const runRepair = () => { repairLocked = !repairLocked; repairModel?.classList.toggle('is-repaired', repairLocked); };
  repairModel?.addEventListener('click', runRepair);
  repairModel?.addEventListener('pointerenter', () => repairModel.classList.add('is-repaired'));
  repairModel?.addEventListener('pointerleave', () => { if (!repairLocked) repairModel.classList.remove('is-repaired'); });
  repairModel?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); runRepair(); } });

  const setupSwiper = (selector, options) => {
    const element = document.querySelector(selector);
    if (!element || !window.Swiper) return;
    new window.Swiper(element, { loop: true, grabCursor: true, simulateTouch: true, watchSlidesProgress: true, ...options });
  };
  setupSwiper('.project-swiper', { slidesPerView: 'auto', spaceBetween: 14, navigation: { nextEl: '.show-next', prevEl: '.show-prev' }, on: { init(swiper) { swiper.slides.forEach((slide) => slide.classList.toggle('active', slide.classList.contains('swiper-slide-active'))); }, slideChange(swiper) { swiper.slides.forEach((slide) => slide.classList.toggle('active', slide.classList.contains('swiper-slide-active'))); } } });
  setupSwiper('.testimonial-swiper', { slidesPerView: 'auto', spaceBetween: 14, autoplay: { delay: 5200, disableOnInteraction: false } });

  const comparison = document.querySelector('.compare');
  if (comparison) {
    const before = comparison.querySelector('.compare-before');
    const handle = comparison.querySelector('.compare-handle');
    let dragging = false;
    const update = (event) => {
      const rect = comparison.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      const percent = Math.max(3, Math.min(97, ((point.clientX - rect.left) / rect.width) * 100));
      before.style.width = `${percent}%`;
      handle.style.left = `${percent}%`;
    };
    comparison.addEventListener('pointerdown', (event) => { dragging = true; comparison.setPointerCapture(event.pointerId); update(event); });
    comparison.addEventListener('pointermove', (event) => { if (dragging) update(event); });
    comparison.addEventListener('pointerup', () => { dragging = false; });
  }

  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = form.querySelector('.form-result');
    try {
      const response = await fetch('send.php', { method: 'POST', body: new FormData(form) });
      const data = await response.json();
      result.textContent = data.success ? 'Успешно отправлено' : (data.message || 'Не удалось отправить.');
      if (data.success) form.reset();
    } catch { result.textContent = 'Не удалось отправить.'; }
  });
}());
