/* Home-only interactions: billboard, material controls and testimonial slider. */
(function () {
  if (window.__SITE_INDEX_READY__) return;
  window.__SITE_INDEX_READY__ = true;

  const billboard = document.querySelector('.billboard');
  if (billboard) {
    const images = (billboard.dataset.futureImages || '').split(',').map((item) => item.trim()).filter(Boolean);
    const strips = [...billboard.querySelectorAll('.strip')];
    let index = 0;
    let topDown = true;
    let isTransitioning = false;
    let isResizing = false;
    let autoplayTimer = 0;
    let resizeTimer = 0;
    const transitionTimers = new Set();
    const stripDelay = 78;
    const stripDuration = 680;
    const autoplayDelay = 5000;

    const currentLayer = document.createElement('div');
    const wipeLayer = document.createElement('div');
    const currentImage = document.createElement('img');
    currentLayer.className = 'billboard-layer is-current';
    wipeLayer.className = 'billboard-wipe';
    currentImage.alt = '';
    currentImage.decoding = 'async';
    currentImage.fetchPriority = 'high';
    currentLayer.append(currentImage);
    strips.forEach((strip) => wipeLayer.append(strip));
    billboard.prepend(currentLayer, wipeLayer);

    const ensureStrip = (strip) => {
      let panel = strip.querySelector('.strip-panel');
      if (panel) return panel;
      strip.textContent = '';
      panel = document.createElement('div');
      panel.className = 'strip-panel';
      ['current', 'next'].forEach((name) => {
        const face = document.createElement('div');
        const img = document.createElement('img');
        face.className = `strip-face strip-${name}`;
        img.alt = '';
        img.decoding = 'async';
        face.append(img);
        panel.append(face);
      });
      strip.append(panel);
      return panel;
    };
    strips.forEach(ensureStrip);

    const wait = (delay, callback) => {
      const timer = window.setTimeout(() => {
        transitionTimers.delete(timer);
        callback();
      }, delay);
      transitionTimers.add(timer);
      return timer;
    };
    const clearTransitionTimers = () => {
      transitionTimers.forEach((timer) => window.clearTimeout(timer));
      transitionTimers.clear();
    };
    const decodeImage = (img) => {
      if (typeof img.decode === 'function') return img.decode().catch(() => undefined);
      return Promise.resolve();
    };
    const preloadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => decodeImage(img).then(() => resolve(src));
      img.onerror = reject;
      img.src = src;
    });
    const setImageLayer = (img, src) => {
      if (img.getAttribute('src') !== src) img.src = src;
    };
    const syncSlices = (currentSrc, nextSrc = currentSrc) => {
      const width = billboard.offsetWidth;
      const height = billboard.offsetHeight;
      if (!width || !height || !strips.length) return;
      const baseHeight = height / strips.length;
      strips.forEach((strip, itemIndex) => {
        const panel = ensureStrip(strip);
        const isSwapped = strip.classList.contains('is-swapped');
        const top = Math.round(baseHeight * itemIndex);
        const bottom = itemIndex === strips.length - 1 ? height : Math.round(baseHeight * (itemIndex + 1));
        strip.style.top = `${top}px`;
        strip.style.height = `${bottom - top}px`;
        [...panel.querySelectorAll('img')].forEach((img) => {
          const face = img.closest('.strip-face');
          const isNextFace = face?.classList.contains('strip-next');
          const src = isSwapped
            ? (isNextFace ? currentSrc : nextSrc)
            : (isNextFace ? nextSrc : currentSrc);
          setImageLayer(img, src);
          img.style.width = `${width}px`;
          img.style.height = `${height}px`;
          img.style.top = `${-top}px`;
        });
      });
    };
    const resetStrips = () => {
      strips.forEach((strip) => {
        strip.classList.remove('is-top-down', 'is-bottom-up', 'is-flipping');
        const panel = strip.querySelector('.strip-panel');
        if (panel) panel.style.removeProperty('will-change');
      });
    };
    const scheduleAutoplay = () => {
      window.clearTimeout(autoplayTimer);
      if (images.length > 1) autoplayTimer = window.setTimeout(reveal, autoplayDelay);
    };
    const reveal = () => {
      if (images.length < 2 || !strips.length || isTransitioning || isResizing) {
        scheduleAutoplay();
        return;
      }
      const nextIndex = (index + 1) % images.length;
      const nextSrc = images[nextIndex];
      isTransitioning = true;
      clearTransitionTimers();
      syncSlices(images[index], nextSrc);
      setImageLayer(currentImage, nextSrc);
      billboard.classList.add('is-transitioning');
      const ordered = topDown ? strips : [...strips].reverse();
      const shouldSwap = !strips[0].classList.contains('is-swapped');
      strips.forEach((strip) => {
        strip.classList.remove('is-flipping', 'is-top-down', 'is-bottom-up');
        strip.classList.add(topDown ? 'is-top-down' : 'is-bottom-up');
      });
      billboard.offsetHeight;
      ordered.forEach((strip, position) => {
        wait(position * stripDelay, () => {
          const panel = strip.querySelector('.strip-panel');
          if (panel) panel.style.willChange = 'transform';
          strip.classList.add('is-flipping');
          strip.classList.toggle('is-swapped', shouldSwap);
        });
      });
      wait(((strips.length - 1) * stripDelay) + stripDuration + 80, () => {
        index = nextIndex;
        resetStrips();
        syncSlices(images[index], images[index]);
        billboard.classList.remove('is-transitioning');
        topDown = !topDown;
        isTransitioning = false;
        scheduleAutoplay();
      });
    };
    const setupBillboard = () => {
      if (!images.length) return;
      Promise.all(images.map(preloadImage)).then(() => {
        setImageLayer(currentImage, images[index]);
        syncSlices(images[index], images[index]);
        billboard.classList.add('is-loaded');
        scheduleAutoplay();
      }).catch(() => {
        setImageLayer(currentImage, images[index]);
        syncSlices(images[index], images[index]);
      });
    };
    const handleResize = () => {
      isResizing = true;
      clearTransitionTimers();
      resetStrips();
      billboard.classList.remove('is-transitioning');
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        syncSlices(images[index], images[index]);
        isTransitioning = false;
        isResizing = false;
        scheduleAutoplay();
      }, 160);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    setupBillboard();
    let billboardTicking = false;
    const syncBillboard = () => {
      billboard.style.transform = `scale(${1 + Math.min(window.scrollY, 800) / 30000})`;
      billboardTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (billboardTicking) return;
      billboardTicking = true;
      window.requestAnimationFrame(syncBillboard);
    }, { passive: true });
    syncBillboard();
  }

  document.querySelectorAll('button[data-material]').forEach((button) => {
    button.type = 'button';
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
    document.querySelectorAll('button[data-material]').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('button[data-material]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    const material = button.dataset.material;
    const wall = document.querySelector('.material-wall');
    const copy = document.querySelector('.matter-copy');
    if (wall) wall.dataset.material = material;
    if (copy) copy.textContent = { vinyl: 'Vinyl keeps the composition crisp with steady horizontal rhythm.', fiber: 'Fiber cement brings a denser, finer panel cadence.', board: 'Board & batten turns the elevation vertical and architectural.' }[material];
    });
  });
  document.querySelectorAll('button[data-rhythm]').forEach((button) => {
    button.type = 'button';
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
    document.querySelectorAll('button[data-rhythm]').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('button[data-rhythm]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    const facade = document.querySelector('.rhythm-facade');
    if (facade) facade.dataset.rhythm = button.dataset.rhythm;
    });
  });

  const craftGrid = document.querySelector('.craft-grid-cards');
  if (craftGrid) {
    if ('IntersectionObserver' in window) {
      const craftObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          craftGrid.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.25 });
      craftObserver.observe(craftGrid);
    } else {
      craftGrid.classList.add('is-visible');
    }
  }

  const mosaicTiles = document.querySelector('.mosaic-tiles');
  if (mosaicTiles) {
    if ('IntersectionObserver' in window) {
      const mosaicObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          mosaicTiles.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      mosaicObserver.observe(mosaicTiles);
    } else {
      mosaicTiles.classList.add('is-visible');
    }
  }

  const faqPhoto = document.querySelector('.faq-photo');
  const faqSection = document.querySelector('.faq-section');
  if (faqPhoto && faqSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const faqDesktopQuery = window.matchMedia('(min-width: 851px)');
    let faqTicking = false;
    const syncFaqParallax = () => {
      faqTicking = false;
      if (!faqDesktopQuery.matches) {
        faqPhoto.style.transform = '';
        return;
      }
      const rect = faqSection.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const offset = (progress - 0.5) * 120;
      faqPhoto.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)`;
    };
    window.addEventListener('scroll', () => {
      if (faqTicking) return;
      faqTicking = true;
      window.requestAnimationFrame(syncFaqParallax);
    }, { passive: true });
    window.addEventListener('resize', syncFaqParallax, { passive: true });
    syncFaqParallax();
  }

  const craftStats = document.querySelector('.craft-stats');
  if (craftStats) {
    const counters = [...craftStats.querySelectorAll('.craft-stat strong')].map((counter) => {
      const original = counter.textContent.trim();
      const value = Number(original.replace(/[^\d]/g, ''));
      const prefix = original.match(/^\D+/)?.[0] || '';
      const suffix = original.match(/\D+$/)?.[0] || '';
      counter.dataset.countTo = String(value);
      counter.dataset.prefix = prefix;
      counter.dataset.suffix = suffix;
      counter.textContent = `${prefix}0${suffix}`;
      return counter;
    }).filter((counter) => Number.isFinite(Number(counter.dataset.countTo)));

    const formatCounter = (counter, value) => {
      counter.textContent = `${counter.dataset.prefix}${Math.round(value).toLocaleString('en-US')}${counter.dataset.suffix}`;
    };
    const runCounters = () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      counters.forEach((counter) => {
        const target = Number(counter.dataset.countTo);
        if (reduceMotion) {
          formatCounter(counter, target);
          return;
        }
        const duration = 1300;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          formatCounter(counter, target * eased);
          if (progress < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
    };

    if ('IntersectionObserver' in window) {
      const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounters();
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.35 });
      statsObserver.observe(craftStats);
    } else {
      runCounters();
    }
  }

  const rippleStats = document.querySelector('.ripple-stats');
  if (rippleStats) {
    const rippleCounters = [...rippleStats.querySelectorAll('.ripple-stat strong')].map((counter) => {
      const original = counter.textContent.trim();
      const value = Number(original.replace(/[^\d]/g, ''));
      const prefix = original.match(/^\D+/)?.[0] || '';
      const suffix = original.match(/\D+$/)?.[0] || '';
      counter.dataset.countTo = String(value);
      counter.dataset.prefix = prefix;
      counter.dataset.suffix = suffix;
      counter.textContent = `${prefix}0${suffix}`;
      return counter;
    }).filter((counter) => Number.isFinite(Number(counter.dataset.countTo)));

    const formatRippleCounter = (counter, value) => {
      counter.textContent = `${counter.dataset.prefix}${Math.round(value).toLocaleString('en-US')}${counter.dataset.suffix}`;
    };
    const runRippleCounters = () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rippleCounters.forEach((counter) => {
        const target = Number(counter.dataset.countTo);
        if (reduceMotion) {
          formatRippleCounter(counter, target);
          return;
        }
        const duration = 1300;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          formatRippleCounter(counter, target * eased);
          if (progress < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      });
    };

    if ('IntersectionObserver' in window) {
      const rippleObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runRippleCounters();
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.35 });
      rippleObserver.observe(rippleStats);
    } else {
      runRippleCounters();
    }
  }

}());
