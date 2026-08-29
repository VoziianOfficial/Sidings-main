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
  const zoneContent = { main: ['Main Wall', 'The primary wall establishes the facade’s panel rhythm and overall proportion.'], gable: ['Gable', 'The gable closes the roof geometry and shifts the facade into a more vertical cadence.'], corners: ['Corners', 'Corner trim resolves the meeting point of each siding plane into one controlled edge.'], openings: ['Openings', 'Windows and doors break the field of panels with measured, protected cut lines.'], trim: ['Trim', 'Trim provides a precise visual boundary between panels, openings and roof lines.'] };
  const activateZone = (button) => {
    const zoning = button.closest('.premium-zoning');
    const zone = button.dataset.zoneControl;
    const zoneName = zoning?.querySelector('[data-zone-name]');
    const zoneCopy = zoning?.querySelector('[data-zone-copy]');
    const content = [button.dataset.zoneTitle || zoneContent[zone]?.[0], button.dataset.zoneCopyText || zoneContent[zone]?.[1]];
    if (!zoning || !zone || !content[0] || !content[1] || !zoneName || !zoneCopy) return;
    zoning.dataset.zone = zone;
    zoneName.textContent = content[0];
    zoneCopy.textContent = content[1];
    zoning.querySelectorAll('[data-zone-control]').forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
  };
  document.querySelectorAll('[data-zone-control]').forEach((button) => { const zoning = button.closest('.premium-zoning'); button.type = 'button'; button.setAttribute('aria-pressed', String(zoning?.dataset.zone === button.dataset.zoneControl)); button.addEventListener('click', () => activateZone(button)); button.addEventListener('pointerenter', () => activateZone(button)); });
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

  const initDetailAccordion = (accordion) => {
    const items = [...accordion.querySelectorAll('.detail-accordion-item')];
    if (!items.length) return;
    if (!items.some((item) => item.classList.contains('is-open'))) items[0].classList.add('is-open');
    const openItem = (item, focusItem = false) => {
      items.forEach((entry) => {
        const isOpen = entry === item;
        entry.classList.toggle('is-open', isOpen);
        entry.querySelector('.detail-trigger')?.setAttribute('aria-expanded', String(isOpen));
      });
      if (focusItem) item.querySelector('.detail-trigger')?.focus();
    };
    items.forEach((item, index) => {
      const trigger = item.querySelector('.detail-trigger');
      if (!trigger) return;
      trigger.type = 'button';
      trigger.setAttribute('aria-expanded', String(item.classList.contains('is-open')));
      trigger.addEventListener('click', () => openItem(item));
      trigger.addEventListener('keydown', (event) => {
        const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const lastIndex = items.length - 1;
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? lastIndex : event.key === 'ArrowDown' ? Math.min(index + 1, lastIndex) : Math.max(index - 1, 0);
        openItem(items[nextIndex], true);
      });
    });
  };
  document.querySelectorAll('[data-detail-accordion]').forEach(initDetailAccordion);

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

  const animatePackageAmounts = (grid) => {
    if (grid.dataset.amountsCounted === 'true') return;
    grid.dataset.amountsCounted = 'true';
    const amounts = [...grid.querySelectorAll('.package-amount')];
    amounts.forEach((amount, index) => {
      const finalText = amount.textContent.trim();
      const valueMatch = finalText.match(/\d[\d,.\s]*/);
      if (!valueMatch) return;
      const target = Number(valueMatch[0].replace(/[^\d.]/g, ''));
      if (!Number.isFinite(target)) return;
      const prefix = finalText.slice(0, valueMatch.index);
      const suffix = finalText.slice(valueMatch.index + valueMatch[0].length);
      const format = (value) => `${prefix}${Math.round(value).toLocaleString('en-US')}${suffix}`;
      if (reduceMotion.matches) {
        amount.textContent = finalText;
        return;
      }
      const duration = 1150;
      const delay = index * 120;
      const startedAt = performance.now() + delay;
      const easeOut = (value) => 1 - Math.pow(1 - value, 3);
      amount.textContent = format(0);
      const tick = (now) => {
        if (now < startedAt) {
          window.requestAnimationFrame(tick);
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        amount.textContent = format(target * easeOut(progress));
        if (progress < 1) window.requestAnimationFrame(tick);
        else amount.textContent = finalText;
      };
      window.requestAnimationFrame(tick);
    });
  };

  const packageGrids = document.querySelectorAll('.package-grid');
  if (packageGrids.length) {
    if (!('IntersectionObserver' in window)) {
      packageGrids.forEach((grid) => {
        grid.classList.add('is-visible');
        animatePackageAmounts(grid);
      });
    } else {
      const packageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          animatePackageAmounts(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      packageGrids.forEach((grid) => packageObserver.observe(grid));
    }
  }

  const highlightSplits = document.querySelectorAll('.highlight-split');
  if (highlightSplits.length) {
    if (!('IntersectionObserver' in window)) {
      highlightSplits.forEach((split) => split.classList.add('in-view'));
    } else {
      const highlightObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      highlightSplits.forEach((split) => highlightObserver.observe(split));
    }
  }

  const composeSwipers = document.querySelectorAll('.compose-swiper');
  if (composeSwipers.length && window.Swiper) {
    composeSwipers.forEach((swiperEl) => {
      if (swiperEl.swiper) return;
      const visual = swiperEl.closest('.compose-visual');
      const fill = visual?.querySelector('.compose-progress-fill');
      const currentEl = visual?.querySelector('.compose-count-current');
      const totalEl = visual?.querySelector('.compose-count-total');
      const slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
      if (!slideCount) return;
      if (totalEl) totalEl.textContent = String(slideCount).padStart(2, '0');
      const updateProgress = (swiper) => {
        const index = swiper.realIndex || 0;
        if (fill) {
          fill.style.width = `${100 / slideCount}%`;
          fill.style.transform = `translateX(${index * 100}%)`;
        }
        if (currentEl) currentEl.textContent = String(index + 1).padStart(2, '0');
      };
      new window.Swiper(swiperEl, {
        loop: true,
        speed: 620,
        grabCursor: true,
        navigation: {
          nextEl: visual?.querySelector('.compose-next') || null,
          prevEl: visual?.querySelector('.compose-prev') || null,
        },
        on: { init: updateProgress, slideChange: updateProgress },
      });
    });
  }

  const initComposeTabs = (section) => {
    const tabs = [...section.querySelectorAll('.compose-tab')];
    const panels = [...section.querySelectorAll('.compose-panel')];
    const wrap = section.querySelector('.compose-panels');
    if (!tabs.length || !panels.length || !wrap) return;
    let locked = false;
    const activate = (key, focusTab = false) => {
      if (locked) return;
      const current = panels.find((panel) => panel.classList.contains('is-active'));
      const next = panels.find((panel) => panel.dataset.tabPanel === key);
      if (!next || next === current) return;
      locked = true;
      tabs.forEach((tab) => {
        const isActive = tab.dataset.tabTarget === key;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });
      wrap.style.height = `${wrap.getBoundingClientRect().height}px`;
      if (current) {
        current.classList.add('is-leaving');
        current.classList.remove('is-active');
      }
      window.setTimeout(() => {
        if (current) current.classList.remove('is-leaving');
        next.classList.add('is-active', 'is-entering');
        window.requestAnimationFrame(() => {
          wrap.style.height = `${next.scrollHeight}px`;
          window.requestAnimationFrame(() => next.classList.remove('is-entering'));
        });
        window.setTimeout(() => {
          wrap.style.height = '';
          locked = false;
        }, 640);
      }, 300);
      if (focusTab) tabs.find((tab) => tab.dataset.tabTarget === key)?.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.tabTarget));
      tab.addEventListener('keydown', (event) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const lastIndex = tabs.length - 1;
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? lastIndex : event.key === 'ArrowRight' ? Math.min(index + 1, lastIndex) : Math.max(index - 1, 0);
        activate(tabs[nextIndex].dataset.tabTarget, true);
      });
    });
  };
  document.querySelectorAll('.compose-section').forEach(initComposeTabs);
}());
