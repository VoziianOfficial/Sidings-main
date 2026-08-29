/* Installation controls. Every interaction changes the illustrated structure. */
(function () {
  if (window.__SITE_SERVICE_READY__) return;
  window.__SITE_SERVICE_READY__ = true;

  const setActive = (selector, active) => document.querySelectorAll(selector).forEach((item) => {
    const isActive = item === active;
    item.classList.toggle('active', isActive);
    if (item.matches('button')) item.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelectorAll('[data-scale]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { const lab = button.closest('.premium-scale'); const group = button.closest('.material-controls'); if (group) group.querySelectorAll('[data-scale]').forEach((item) => { const isActive = item === button; item.classList.toggle('active', isActive); item.setAttribute('aria-pressed', String(isActive)); }); else setActive('[data-scale]', button); if (lab) lab.dataset.profile = button.dataset.scale; }); });
  document.querySelectorAll('[data-trim]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { setActive('[data-trim]', button); const composer = document.querySelector('.premium-trim'); if (composer) composer.dataset.trimStyle = button.dataset.trim; }); });
  const zoning = document.querySelector('.premium-zoning');
  const zoneName = document.querySelector('[data-zone-name]');
  const zoneCopy = document.querySelector('[data-zone-copy]');
  const zoneContent = { main: ['Main Wall', 'The primary wall establishes the facade’s panel rhythm and overall proportion.'], gable: ['Gable', 'The gable closes the roof geometry and shifts the facade into a more vertical cadence.'], corners: ['Corners', 'Corner trim resolves the meeting point of each siding plane into one controlled edge.'], openings: ['Openings', 'Windows and doors break the field of panels with measured, protected cut lines.'], trim: ['Trim', 'Trim provides a precise visual boundary between panels, openings and roof lines.'] };
  const activateZone = (button) => { const zone = button.dataset.zoneControl; if (!zoning || !zoneContent[zone] || !zoneName || !zoneCopy) return; zoning.dataset.zone = zone; zoneName.textContent = zoneContent[zone][0]; zoneCopy.textContent = zoneContent[zone][1]; setActive('[data-zone-control]', button); };
  document.querySelectorAll('[data-zone-control]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(zoning?.dataset.zone === button.dataset.zoneControl)); button.addEventListener('click', () => activateZone(button)); button.addEventListener('pointerenter', () => activateZone(button)); });
  const initServiceAccordion = (accordion) => {
    const panels = [...accordion.querySelectorAll('.gallery-panel')];
    if (!panels.length) return;
    if (!panels.some((panel) => panel.classList.contains('is-active'))) panels[0].classList.add('is-active');
    let locked = false;
    const unlockAfter = () => {
      window.setTimeout(() => {
        locked = false;
        accordion.classList.add('ready');
      }, 1280);
    };
    const activatePanel = (panel, focusPanel = false) => {
      if (locked || panel.classList.contains('is-active')) return;
      locked = true;
      const current = panels.find((item) => item.classList.contains('is-active'));
      if (current) current.classList.add('is-collapsing');
      window.setTimeout(() => {
        panels.forEach((item) => {
          const isActive = item === panel;
          item.classList.toggle('is-active', isActive);
          item.classList.remove('is-collapsing');
          item.setAttribute('aria-expanded', String(isActive));
        });
      }, 180);
      if (focusPanel) panel.focus({ preventScroll: true });
      unlockAfter();
    };
    panels.forEach((panel, index) => {
      panel.setAttribute('aria-expanded', String(panel.classList.contains('is-active')));
      panel.addEventListener('click', () => activatePanel(panel));
      panel.addEventListener('keydown', (event) => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const lastIndex = panels.length - 1;
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? lastIndex : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? Math.min(index + 1, lastIndex) : Math.max(index - 1, 0);
        activatePanel(panels[nextIndex], true);
      });
    });
  };
  document.querySelectorAll('[data-service-accordion]').forEach(initServiceAccordion);

  const parallaxImages = [...document.querySelectorAll('[data-parallax-image]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (parallaxImages.length) {
    const activeImages = new Set();
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      if (reduceMotion.matches) return;
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const strength = window.innerWidth < 620 ? 12 : window.innerWidth < 1024 ? 18 : 34;
      activeImages.forEach((image) => {
        const frame = image.parentElement;
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const progress = ((rect.top + rect.height / 2) - viewport / 2) / (viewport + rect.height);
        const offset = Math.max(-1, Math.min(1, progress)) * -strength;
        image.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.04)`;
      });
    };
    const requestParallax = () => {
      if (ticking || reduceMotion.matches) return;
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    };
    if (!('IntersectionObserver' in window)) {
      parallaxImages.forEach((image) => activeImages.add(image));
      requestParallax();
    } else {
      const parallaxObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeImages.add(entry.target);
          else activeImages.delete(entry.target);
        });
        requestParallax();
      }, { rootMargin: '18% 0px' });
      parallaxImages.forEach((image) => parallaxObserver.observe(image));
    }
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    reduceMotion.addEventListener?.('change', () => {
      if (reduceMotion.matches) parallaxImages.forEach((image) => { image.style.transform = ''; });
      else requestParallax();
    });
  }

  const insightCards = document.querySelectorAll('.reveal-insight');
  if (insightCards.length) {
    if (!('IntersectionObserver' in window)) {
      insightCards.forEach((card) => card.classList.add('in-view'));
    } else {
      const insightObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.18 });
      insightCards.forEach((card) => insightObserver.observe(card));
    }
  }

  const galleries = document.querySelectorAll('.service-gallery');
  if (galleries.length) {
    if (!('IntersectionObserver' in window)) {
      galleries.forEach((gallery) => {
        gallery.classList.add('in-view');
        window.setTimeout(() => gallery.classList.add('ready'), 760);
      });
    } else {
      const galleryObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          window.setTimeout(() => entry.target.classList.add('ready'), 760);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.24 });
      galleries.forEach((gallery) => galleryObserver.observe(gallery));
    }
  }
}());
