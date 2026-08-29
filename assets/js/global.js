/* Shared configuration, navigation and small non-conflicting reveal effects. */
(function () {
  if (window.__SITE_GLOBAL_READY__) return;
  window.__SITE_GLOBAL_READY__ = true;

  const clean = (value) => (typeof value === 'string' ? value.trim() : '');
  const getConfigValue = (key) => clean(window.SiteConfig?.[key]);
  const getSiteConfig = () => ({
    companyName: getConfigValue('companyName'),
    logo: getConfigValue('logo'),
    favicon: getConfigValue('favicon'),
    email: getConfigValue('email'),
    disclaimer: getConfigValue('disclaimer'),
    browserTitle: getConfigValue('browserTitle')
  });
  const safeMailto = (value) => clean(value).replace(/[\r\n]/g, '');
  const fillTemplate = (template, values) => clean(template).replace(/\{(companyName|email|disclaimer|browserTitle)\}/g, (match, key) => values[key] || '');

  function applySiteConfig(root = document) {
    const values = getSiteConfig();
    const scope = root instanceof Document || root instanceof DocumentFragment || root instanceof HTMLElement ? root : document;
    const findAll = (selector) => {
      const elements = [...scope.querySelectorAll(selector)];
      if (scope instanceof HTMLElement && scope.matches(selector)) elements.unshift(scope);
      return elements;
    };

    const pageTitle = clean(document.body?.dataset.pageTitle);
    if (values.browserTitle) {
      document.title = pageTitle && pageTitle.toLowerCase() !== 'home'
        ? `${pageTitle} | ${values.browserTitle}`
        : values.browserTitle;
    }

    document.querySelectorAll('link[rel*="icon"]').forEach((icon) => {
      if (values.favicon) icon.href = values.favicon;
      else icon.removeAttribute('href');
    });

    findAll('[data-config]').forEach((el) => {
      const key = clean(el.dataset.config);
      if (!Object.prototype.hasOwnProperty.call(values, key)) return;
      el.textContent = values[key] || '';
    });

    if (values.companyName) {
      findAll('[data-company]').forEach((el) => { el.textContent = values.companyName; });
    } else {
      findAll('[data-company]').forEach((el) => { el.textContent = ''; });
    }

    findAll('[data-config-template]').forEach((el) => {
      el.textContent = fillTemplate(el.dataset.configTemplate, values);
    });
    findAll('[data-config-aria-template]').forEach((el) => {
      const label = fillTemplate(el.dataset.configAriaTemplate, values);
      if (label) el.setAttribute('aria-label', label);
      else el.removeAttribute('aria-label');
    });
    findAll('[data-config-alt-template]').forEach((el) => {
      el.alt = fillTemplate(el.dataset.configAltTemplate, values);
    });

    findAll('[data-logo], [data-config-logo]').forEach((el) => {
      if (!values.logo) {
        el.removeAttribute('src');
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.src = values.logo;
      if (values.companyName && (!el.alt || el.hasAttribute('data-logo') || el.hasAttribute('data-config-logo'))) {
        el.alt = values.companyName;
      }
    });

    findAll('[data-email], [data-mobile-email], [data-config-email-link]').forEach((el) => {
      const mailto = safeMailto(values.email);
      el.textContent = values.email || '';
      if (mailto) el.href = `mailto:${mailto}`;
      else el.removeAttribute('href');
    });

    if (values.disclaimer) {
      findAll('[data-disclaimer]').forEach((el) => { el.textContent = values.disclaimer; });
    } else {
      findAll('[data-disclaimer]').forEach((el) => { el.textContent = ''; });
    }
  }

  window.applySiteConfig = applySiteConfig;
  applySiteConfig();

  const initConsentCard = () => {
    if (window.__SITE_CONSENT_READY__) return;
    window.__SITE_CONSENT_READY__ = true;

    const storageKey = 'sidingsConsent';
    const getConsent = () => {
      try {
        return window.localStorage.getItem(storageKey);
      } catch (error) {
        return null;
      }
    };
    const setConsent = (value) => {
      window.SidingsConsent = value;
      try {
        window.localStorage.setItem(storageKey, value);
      } catch (error) {
        document.documentElement.dataset.sidingsConsent = value;
      }
    };

    const existingConsent = getConsent();
    if (existingConsent === 'accepted' || existingConsent === 'declined') {
      window.SidingsConsent = existingConsent;
      return;
    }
    if (document.querySelector('[data-consent-card]')) return;

    const card = document.createElement('aside');
    card.className = 'consent-card';
    card.dataset.consentCard = 'true';
    card.setAttribute('aria-label', 'Privacy and cookie notice');
    card.innerHTML = `
      <p class="consent-copy">We use cookies to improve your experience. By continuing, you agree to our Privacy and Cookie Policy.</p>
      <div class="consent-actions">
        <a class="consent-link" href="privacy-policy.html">Privacy Policy</a>
        <button class="consent-btn consent-decline" type="button">Decline</button>
        <button class="consent-btn consent-accept" type="button">Accept</button>
      </div>
    `;

    const updateOffset = () => {
      if (!card.isConnected || !card.classList.contains('is-visible')) return;
      const height = Math.ceil(card.getBoundingClientRect().height);
      const bottom = Number.parseFloat(getComputedStyle(card).bottom) || 0;
      document.body.style.setProperty('--consent-offset', `${height + bottom + 10}px`);
      document.body.classList.add('has-consent-card');
    };
    const hide = (value) => {
      setConsent(value);
      card.classList.remove('is-visible');
      card.classList.add('is-hiding');
      document.body.classList.remove('has-consent-card');
      document.body.style.removeProperty('--consent-offset');
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateOffset);
      window.setTimeout(() => card.remove(), 460);
    };

    card.querySelector('.consent-accept')?.addEventListener('click', () => hide('accepted'));
    card.querySelector('.consent-decline')?.addEventListener('click', () => hide('declined'));
    document.body.append(card);

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(updateOffset) : null;
    resizeObserver?.observe(card);
    window.addEventListener('resize', updateOffset, { passive: true });
    window.requestAnimationFrame(() => {
      card.classList.add('is-visible');
      updateOffset();
    });
  };
  initConsentCard();

  const initBeforeAfter = (root) => {
    if (!root || root.dataset.beforeAfterReady === 'true') return;
    const stage = root.querySelector('.before-after-media');
    const handle = root.querySelector('.before-after-handle');
    if (!stage || !handle) return;
    root.dataset.beforeAfterReady = 'true';

    const min = Number(handle.getAttribute('aria-valuemin')) || 2;
    const max = Number(handle.getAttribute('aria-valuemax')) || 98;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    let current = 50;
    let target = 50;
    let rect = stage.getBoundingClientRect();
    let frame = 0;
    let dragging = false;
    let introDone = false;
    let userControlled = false;

    const clamp = (value) => Math.min(max, Math.max(min, value));
    const syncRect = () => { rect = stage.getBoundingClientRect(); };
    const commit = (value) => {
      current = clamp(value);
      root.style.setProperty('--before-after-pos', `${current.toFixed(2)}%`);
      handle.setAttribute('aria-valuenow', String(Math.round(current)));
    };
    const requestCommit = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const delta = target - current;
        if (Math.abs(delta) < .08) {
          commit(target);
          return;
        }
        commit(current + delta * .22);
        requestCommit();
      });
    };
    const setTarget = (value, immediate = false) => {
      target = clamp(value);
      if (immediate) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        commit(target);
        return;
      }
      requestCommit();
    };
    const valueFromClientX = (clientX) => {
      const width = rect.width || 1;
      return ((clientX - rect.left) / width) * 100;
    };
    const takeControl = () => {
      userControlled = true;
      introDone = true;
      root.classList.add('is-user-controlled');
    };
    const animateIntro = () => {
      if (introDone || userControlled || reduceMotion.matches) return;
      introDone = true;
      const keyframes = [[0, 25], [.52, 65], [1, 50]];
      const duration = 1800;
      const started = performance.now();
      const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const step = (now) => {
        if (userControlled) return;
        const progress = Math.min(1, (now - started) / duration);
        let from = keyframes[0];
        let to = keyframes[1];
        if (progress > keyframes[1][0]) {
          from = keyframes[1];
          to = keyframes[2];
        }
        const local = (progress - from[0]) / (to[0] - from[0]);
        const eased = ease(Math.max(0, Math.min(1, local)));
        setTarget(from[1] + (to[1] - from[1]) * eased);
        if (progress < 1) window.requestAnimationFrame(step);
      };
      setTarget(25, true);
      window.requestAnimationFrame(step);
    };

    commit(current);
    stage.addEventListener('pointerenter', (event) => {
      syncRect();
      root.classList.add('is-hovered');
      if (hoverQuery.matches && !dragging) setTarget(valueFromClientX(event.clientX));
    });
    stage.addEventListener('pointerleave', () => {
      root.classList.remove('is-hovered');
    });
    stage.addEventListener('pointermove', (event) => {
      if (!dragging && !hoverQuery.matches) return;
      if (dragging) takeControl();
      setTarget(valueFromClientX(event.clientX));
    }, { passive: true });
    stage.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      syncRect();
      dragging = true;
      takeControl();
      root.classList.add('is-dragging');
      stage.setPointerCapture?.(event.pointerId);
      setTarget(valueFromClientX(event.clientX));
    });
    const stopDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener('pointerup', stopDrag);
    stage.addEventListener('pointercancel', stopDrag);
    handle.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      takeControl();
      const step = event.shiftKey ? 10 : 4;
      const next = event.key === 'Home' ? min : event.key === 'End' ? max : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? target + step : target - step;
      setTarget(next, event.key === 'Home' || event.key === 'End');
    });
    window.addEventListener('resize', syncRect, { passive: true });

    if (!('IntersectionObserver' in window)) {
      root.classList.add('is-visible');
      animateIntro();
    } else {
      const observer = new IntersectionObserver((entries, instance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          root.classList.add('is-visible');
          window.setTimeout(animateIntro, 260);
          instance.unobserve(root);
        });
      }, { threshold: 0.28 });
      observer.observe(root);
    }
  };
  document.querySelectorAll('[data-before-after]').forEach(initBeforeAfter);

  const setupMarquees = () => {
    document.querySelectorAll('.marquee').forEach((marquee) => {
      if (marquee.dataset.marqueeReady === 'true') return;
      const track = marquee.querySelector('.marquee-track');
      if (!track) return;
      let source = track.querySelector('.marquee-group:not([data-marquee-clone])');
      if (!source) {
        source = document.createElement('div');
        source.className = 'marquee-group';
        while (track.firstChild) source.appendChild(track.firstChild);
        track.appendChild(source);
      }
      marquee.dataset.marqueeReady = 'true';
      source.dataset.marqueeSource = 'true';

      let resizeFrame = 0;
      const sync = () => {
        resizeFrame = 0;
        track.querySelectorAll('[data-marquee-clone="true"]').forEach((clone) => clone.remove());
        const sourceWidth = source.getBoundingClientRect().width;
        const marqueeWidth = marquee.getBoundingClientRect().width;
        if (!sourceWidth || !marqueeWidth) return;
        const coverageWidth = Math.max(marqueeWidth, window.innerWidth || 0, document.documentElement.clientWidth || 0, 4096);
        let trackWidth = sourceWidth;
        while (trackWidth < coverageWidth + sourceWidth + 2) {
          const clone = source.cloneNode(true);
          clone.dataset.marqueeClone = 'true';
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
          trackWidth += sourceWidth;
        }
        track.style.setProperty('--marquee-distance', `${sourceWidth}px`);
      };
      const requestSync = () => {
        if (resizeFrame) return;
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = window.requestAnimationFrame(sync);
        });
      };

      sync();
      if (document.fonts?.ready) document.fonts.ready.then(requestSync);
      if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(requestSync);
        observer.observe(marquee);
        observer.observe(source);
      }
      window.addEventListener('resize', requestSync, { passive: true });
    });
  };
  setupMarquees();

  const header = document.querySelector('.site-header');
  let scrollTicking = false;
  const syncHeader = () => {
    header?.classList.toggle('compact', window.scrollY > 30);
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(syncHeader);
  }, { passive: true });
  syncHeader();

  const lazyBackgrounds = [...document.querySelectorAll('[data-bg]')];
  const loadBackground = (element) => {
    const source = clean(element.dataset.bg);
    if (!source || element.dataset.bgLoaded === 'true') return;
    element.style.setProperty('--lazy-bg', `url("${new URL(source, document.baseURI).href}")`);
    element.dataset.bgLoaded = 'true';
  };
  if (lazyBackgrounds.length && 'IntersectionObserver' in window) {
    const backgroundObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadBackground(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '250px 0px' });
    lazyBackgrounds.forEach((element) => backgroundObserver.observe(element));
  } else {
    lazyBackgrounds.forEach(loadBackground);
  }

  const nav = document.querySelector('.nav');
  const toggles = [...document.querySelectorAll('.mobile-toggle')];
  const desktopMenuQuery = window.matchMedia('(min-width: 1025px)');
  let mobileMenu;
  let mobilePanel;
  let mobileServices;
  let mobileServicesPanel;
  let lastMenuFocus = null;
  let menuScrollY = 0;
  let menuCloseTimer = 0;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const lockMenuScroll = () => {
    menuScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('nav-open');
    document.body.classList.add('nav-open');
    document.body.style.top = `-${menuScrollY}px`;
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
  };
  const unlockMenuScroll = () => {
    if (!document.body.classList.contains('nav-open')) return;
    document.documentElement.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    document.body.style.paddingRight = '';
    window.scrollTo(0, menuScrollY);
  };
  const setMenuExpanded = (open) => {
    toggles.forEach((button) => {
      button.classList.toggle('is-active', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  };
  const syncMobileServices = (open) => {
    if (!mobileServices || !mobileServicesPanel) return;
    mobileServices.classList.toggle('is-open', open);
    mobileServices.querySelector('.mobile-services-trigger')?.setAttribute('aria-expanded', String(open));
    mobileServicesPanel.setAttribute('aria-hidden', String(!open));
    mobileServicesPanel.style.maxHeight = open ? `${mobileServicesPanel.scrollHeight}px` : '0px';
    mobileServicesPanel.querySelectorAll('a').forEach((link) => {
      link.tabIndex = open ? 0 : -1;
    });
  };
  const closeMenu = ({ restoreFocus = false, immediate = false } = {}) => {
    if (!mobileMenu || !mobileMenu.classList.contains('is-open')) return;
    window.clearTimeout(menuCloseTimer);
    mobileMenu.classList.remove('is-open');
    mobileMenu.classList.add('is-closing');
    mobileMenu.setAttribute('aria-hidden', 'true');
    setMenuExpanded(false);
    syncMobileServices(false);
    unlockMenuScroll();
    const finishClose = () => {
      mobileMenu?.classList.remove('is-closing');
      if (restoreFocus && lastMenuFocus instanceof HTMLElement) lastMenuFocus.focus({ preventScroll: true });
      lastMenuFocus = null;
    };
    if (immediate) finishClose();
    else menuCloseTimer = window.setTimeout(finishClose, 560);
  };
  const closeDropdowns = () => {
    document.querySelectorAll('.dropdown.open').forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.drop-trigger')?.setAttribute('aria-expanded', 'false');
      dropdown.querySelector('.drop-menu')?.setAttribute('aria-hidden', 'true');
    });
  };

  const createMobileMenu = () => {
    if (mobileMenu) return;
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.id = 'mobile-menu';
    mobileMenu.setAttribute('role', 'dialog');
    mobileMenu.setAttribute('aria-modal', 'true');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('aria-labelledby', 'mobile-menu-title');
    const brandMarkup = document.querySelector('.header-wrap > .brand')?.innerHTML || '<span data-company></span>';
    mobileMenu.innerHTML = `
      <div class="mobile-menu-panel">
        <h2 class="mobile-menu-title" id="mobile-menu-title">Menu</h2>
        <div class="mobile-menu-top">
          <a class="mobile-menu-brand brand" href="index.html">${brandMarkup}</a>
          <button class="mobile-menu-close" type="button" aria-label="Close menu">
            <span></span><span></span>
          </button>
        </div>
        <nav class="mobile-menu-nav" aria-label="Mobile navigation">
          <a class="mobile-menu-link" style="--item-index:0" href="index.html#main"><span>Main</span></a>
          <a class="mobile-menu-link" style="--item-index:1" href="index.html#about"><span>About Us</span></a>
          <div class="mobile-services" style="--item-index:2">
            <button class="mobile-services-trigger" type="button" aria-expanded="false" aria-controls="mobile-services-panel">
              <span>Services</span><i></i>
            </button>
            <div class="mobile-services-panel" id="mobile-services-panel" aria-hidden="true">
              <a href="installation.html">Siding Installation</a>
              <a href="repair.html">Siding Repair</a>
            </div>
          </div>
          <a class="mobile-menu-link" style="--item-index:3" href="index.html#faq"><span>FAQ</span></a>
          <a class="mobile-menu-link" style="--item-index:4" href="index.html#contact"><span>Contact</span></a>
        </nav>
        <div class="mobile-menu-footer">
          <a class="mobile-menu-cta" href="index.html#contact">Start a project</a>
          <a class="mobile-menu-email" data-mobile-email></a>
          <div class="mobile-menu-legal" aria-label="Legal links">
            <a href="privacy-policy.html">Privacy</a>
            <a href="terms.html">Terms</a>
            <a href="cookies.html">Cookies</a>
          </div>
        </div>
      </div>
    `;
    document.body.append(mobileMenu);
    applySiteConfig(mobileMenu);
    mobilePanel = mobileMenu.querySelector('.mobile-menu-panel');
    mobileServices = mobileMenu.querySelector('.mobile-services');
    mobileServicesPanel = mobileMenu.querySelector('.mobile-services-panel');
    syncMobileServices(false);
    mobileMenu.querySelector('.mobile-menu-close')?.addEventListener('click', () => closeMenu({ restoreFocus: true }));
    mobileMenu.querySelector('.mobile-services-trigger')?.addEventListener('click', () => {
      syncMobileServices(!mobileServices?.classList.contains('is-open'));
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu({ immediate: true }));
    });
    mobileMenu.addEventListener('click', (event) => {
      if (event.target === mobileMenu) closeMenu({ restoreFocus: true });
    });
    mobileMenu.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...mobileMenu.querySelectorAll(focusableSelector)].filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };
  const openMenu = (source) => {
    if (desktopMenuQuery.matches) return;
    createMobileMenu();
    closeDropdowns();
    if (typeof closeSearch === 'function') closeSearch({ restoreFocus: false });
    window.clearTimeout(menuCloseTimer);
    lastMenuFocus = source instanceof HTMLElement ? source : document.activeElement;
    mobileMenu.classList.remove('is-closing');
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    setMenuExpanded(true);
    lockMenuScroll();
    window.requestAnimationFrame(() => {
      const firstLink = mobileMenu.querySelector('.mobile-menu-link, .mobile-services-trigger');
      firstLink?.focus({ preventScroll: true });
    });
  };

  if (toggles.length) {
    toggles.forEach((toggle) => {
      toggle.type = 'button';
      toggle.innerHTML = '<span></span><span></span><span></span>';
      toggle.setAttribute('aria-controls', 'mobile-menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.addEventListener('click', () => {
        if (mobileMenu?.classList.contains('is-open')) closeMenu({ restoreFocus: true });
        else openMenu(toggle);
      });
    });
  }

  document.querySelectorAll('.dropdown').forEach((dropdown, index) => {
    const trigger = dropdown.querySelector('.drop-trigger');
    const menu = dropdown.querySelector('.drop-menu');
    if (!trigger || !menu) return;
    const menuId = menu.id || `services-menu-${index + 1}`;
    menu.id = menuId;
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-controls', menuId);
    trigger.setAttribute('aria-expanded', 'false');
    const setOpen = (open) => {
      dropdown.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
    };
    menu.setAttribute('aria-hidden', 'true');
    const supportsHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    dropdown.addEventListener('pointerenter', () => { if (supportsHover()) setOpen(true); });
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(!dropdown.classList.contains('open'));
    });
    dropdown.addEventListener('pointerleave', () => { if (supportsHover()) setOpen(false); });
    dropdown.addEventListener('focusout', () => window.setTimeout(() => {
      if (!dropdown.contains(document.activeElement)) setOpen(false);
    }, 0));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  });

  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const glyph = button?.querySelector('span');
    if (!button || !answer) return;
    const answerId = answer.id || `faq-answer-${index + 1}`;
    answer.id = answerId;
    button.type = 'button';
    button.setAttribute('aria-controls', answerId);
    glyph?.setAttribute('aria-hidden', 'true');
    const syncOpenState = (isOpen) => {
      button.setAttribute('aria-expanded', String(isOpen));
      answer.setAttribute('aria-hidden', String(!isOpen));
      if (glyph) glyph.textContent = isOpen ? '−' : '+';
    };
    syncOpenState(item.classList.contains('open'));
    button.addEventListener('click', () => {
      syncOpenState(item.classList.toggle('open'));
    });
  });

  const syncNavigationMode = () => {
    if (desktopMenuQuery.matches) closeMenu({ immediate: true });
    closeDropdowns();
  };
  if (typeof desktopMenuQuery.addEventListener === 'function') {
    desktopMenuQuery.addEventListener('change', syncNavigationMode);
  } else if (typeof desktopMenuQuery.addListener === 'function') {
    desktopMenuQuery.addListener(syncNavigationMode);
  }

  const searchIndex = [
    { title: 'Home', type: 'Page', url: 'index.html', description: 'Main guide to siding installation, repair, materials and contact.', keywords: 'main home siding exterior weather about services faq contact install installation repair material process testimonials' },
    { title: 'Siding Installation', type: 'Service', url: 'installation.html', description: 'Installation service page with facade zoning, profile scale and trim composer.', keywords: 'service siding install installation facade zoning profile scale trim composer material vinyl fiber cement engineered wood process' },
    { title: 'Siding Repair', type: 'Service', url: 'repair.html', description: 'Repair service page for siding damage and exterior restoration.', keywords: 'service siding repair damage facade exterior restore restoration' },
    { title: 'Privacy Policy', type: 'Page', url: 'privacy-policy.html', description: 'How submitted information is handled.', keywords: 'privacy policy legal personal information contact form data' },
    { title: 'Terms of Use', type: 'Page', url: 'terms.html', description: 'Website terms and informational content notes.', keywords: 'terms use legal informational content decisions contact' },
    { title: 'Cookie Notice', type: 'Page', url: 'cookies.html', description: 'Cookie and browser storage notice.', keywords: 'cookies cookie notice browser storage tracking legal' },
    { title: 'Main', type: 'Section', url: 'index.html#main', description: 'Home hero section.', keywords: 'main home hero built weather siding' },
    { title: 'About Us', type: 'Section', url: 'index.html#about', description: 'Home overview of siding services and materials.', keywords: 'about us services siding installation repair fiber cement vinyl board batten material' },
    { title: 'Services', type: 'Section', url: 'index.html#services', description: 'Installation and repair service cards.', keywords: 'services service siding installation repair explore menu' },
    { title: 'Materials', type: 'Section', url: 'index.html#materials', description: 'Material selector for siding rhythm.', keywords: 'materials material selector vinyl fiber cement board batten rhythm mat' },
    { title: 'Benefits', type: 'Section', url: 'index.html#benefits', description: 'Protection, appearance, efficiency and durability.', keywords: 'benefits why siding protection appearance efficiency durability' },
    { title: 'Exterior Rhythm', type: 'Section', url: 'index.html#rhythm', description: 'Horizontal, vertical and mixed siding direction.', keywords: 'exterior rhythm direction horizontal vertical mixed siding' },
    { title: 'Process', type: 'Section', url: 'index.html#process', description: 'Discover, compare, prepare and complete workflow.', keywords: 'process path rhythm discover compare prepare complete workflow' },
    { title: 'Three Ways In', type: 'Section', url: 'index.html#testimonials', description: 'Siding services, repair and installation highlight cards.', keywords: 'services repair installation highlights cards hover three ways in' },
    { title: 'FAQ', type: 'Section', url: 'index.html#faq', description: 'Common siding questions.', keywords: 'faq questions begin material repair proportions accordion' },
    { title: 'Contact', type: 'Section', url: 'index.html#contact', description: 'Project enquiry form.', keywords: 'contact form enquiry send project email' },
    { title: 'Installation Hero', type: 'Section', url: 'installation.html#installation-main', description: 'Siding installation page opening.', keywords: 'installation hero siding install service' },
    { title: 'Facade Zoning', type: 'Section', url: 'installation.html#facade-zoning', description: 'Interactive elevation zones.', keywords: 'facade zoning main wall gable corners openings trim installation' },
    { title: 'Profile Scale Lab', type: 'Section', url: 'installation.html#profile-scale', description: 'Panel width and reveal controls.', keywords: 'profile scale lab panel width reveal balanced narrow wide installation' },
    { title: 'Material Decision Bands', type: 'Section', url: 'installation.html#material-bands', description: 'Vinyl, fiber cement and engineered wood comparison.', keywords: 'material materials decision bands vinyl fiber cement engineered wood maintenance weight' },
    { title: 'Installation Rail', type: 'Section', url: 'installation.html#installation-rail', description: 'Continuous siding surface assembly.', keywords: 'installation rail continuous surface build siding' },
    { title: 'Repair Hero', type: 'Section', url: 'repair.html#repair-main', description: 'Siding repair page opening.', keywords: 'repair hero siding damage service exterior restore' },
    { title: 'Services Menu', type: 'Section', url: 'index.html#services', description: 'Navigation menu entry for service pages.', keywords: 'menu services dropdown siding installation repair nav navigation' }
  ];

  const searchButtons = [...document.querySelectorAll('.search')];
  const uniqueSearchIndex = [...new Map(searchIndex.map((item) => [item.url, item])).values()];
  const searchIcon = '<svg class="search-lucide" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>';
  const closeIcon = '<svg class="search-lucide" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  const arrowIcon = '<svg class="search-lucide result-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>';
  let searchOverlay;
  let searchInput;
  let searchResults;
  let searchClose;
  let activeSearchIndex = 0;
  let lastSearchFocus = null;
  let searchScrollY = 0;

  const normalizeSearchValue = (value) => clean(value).toLowerCase().replace(/\s+/g, ' ');
  const getCurrentPage = () => {
    const page = window.location.pathname.split('/').pop();
    return page || 'index.html';
  };
  const setSearchExpanded = (open) => {
    searchButtons.forEach((button) => button.setAttribute('aria-expanded', String(open)));
  };
  const lockSearchScroll = () => {
    searchScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('search-open');
    document.body.classList.add('search-open');
    document.body.style.top = `-${searchScrollY}px`;
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
  };
  const unlockSearchScroll = () => {
    if (!document.body.classList.contains('search-open')) return;
    document.documentElement.classList.remove('search-open');
    document.body.classList.remove('search-open');
    document.body.style.top = '';
    document.body.style.paddingRight = '';
    window.scrollTo(0, searchScrollY);
  };
  const getSearchMatches = (query) => {
    const words = normalizeSearchValue(query).split(' ').filter(Boolean);
    if (!words.length) {
      return uniqueSearchIndex.filter((item) => item.type === 'Page' || item.type === 'Service');
    }
    return uniqueSearchIndex.map((item, order) => {
      const title = normalizeSearchValue(item.title);
      const keywords = normalizeSearchValue(item.keywords || '');
      const description = normalizeSearchValue(item.description || '');
      const haystack = normalizeSearchValue(`${title} ${item.type} ${description} ${keywords}`);
      if (!words.every((word) => haystack.includes(word))) return null;
      const score = words.reduce((total, word) => {
        if (title.startsWith(word)) return total + 90;
        if (title.includes(word)) return total + 70;
        if (keywords.includes(word)) return total + 28;
        if (description.includes(word)) return total + 16;
        return total + 6;
      }, title === normalizeSearchValue(query) ? 120 : 0) + (item.type === 'Service' ? 40 : item.type === 'Page' ? 12 : 0);
      return { item, score, order };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order).map((match) => match.item);
  };
  const syncActiveResult = () => {
    const options = [...searchResults.querySelectorAll('[role="option"]')];
    options.forEach((option, index) => {
      const isActive = index === activeSearchIndex;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', String(isActive));
      if (isActive) {
        searchInput.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });
    if (!options.length) searchInput.removeAttribute('aria-activedescendant');
  };
  const openSearchResult = (item) => {
    if (!item) return;
    const [page, hash = ''] = item.url.split('#');
    const currentPage = getCurrentPage();
    closeSearch();
    if (hash && page === currentPage) {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.location.href = item.url;
  };
  const renderSearchResults = () => {
    const matches = getSearchMatches(searchInput.value);
    const isQuickList = !normalizeSearchValue(searchInput.value);
    activeSearchIndex = matches.length ? Math.min(activeSearchIndex, matches.length - 1) : 0;
    searchResults.innerHTML = '';
    searchResults.classList.toggle('quick', isQuickList);
    if (isQuickList) {
      const quickTitle = document.createElement('p');
      quickTitle.className = 'search-results-label';
      quickTitle.textContent = 'Popular searches';
      searchResults.append(quickTitle);
    }
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = 'No results found';
      searchResults.append(empty);
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }
    matches.forEach((item, index) => {
      const result = document.createElement('button');
      result.type = 'button';
      result.className = 'search-result';
      result.id = `search-result-${index}`;
      result.dataset.url = item.url;
      result.setAttribute('role', 'option');
      result.setAttribute('aria-selected', 'false');
      result.innerHTML = `<span><strong>${item.title}</strong>${item.description && !isQuickList ? `<small>${item.description}</small>` : ''}</span><span class="search-result-meta"><em>${item.type}</em>${arrowIcon}</span>`;
      result.addEventListener('click', () => openSearchResult(item));
      result.addEventListener('pointerenter', () => {
        activeSearchIndex = index;
        syncActiveResult();
      });
      searchResults.append(result);
    });
    syncActiveResult();
  };
  function closeSearch(options = {}) {
    const restoreFocus = options.restoreFocus !== false;
    if (!searchOverlay || !searchOverlay.classList.contains('open')) return;
    searchOverlay.classList.remove('open');
    searchOverlay.setAttribute('aria-hidden', 'true');
    setSearchExpanded(false);
    unlockSearchScroll();
    searchInput.value = '';
    activeSearchIndex = 0;
    searchResults.innerHTML = '';
    searchInput.removeAttribute('aria-activedescendant');
    if (restoreFocus && lastSearchFocus instanceof HTMLElement) lastSearchFocus.focus({ preventScroll: true });
    lastSearchFocus = null;
  }
  const createSearchOverlay = () => {
    if (searchOverlay) return;
    searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.id = 'site-search-dialog';
    searchOverlay.setAttribute('role', 'dialog');
    searchOverlay.setAttribute('aria-modal', 'true');
    searchOverlay.setAttribute('aria-hidden', 'true');
    searchOverlay.setAttribute('aria-labelledby', 'site-search-title');
    searchOverlay.innerHTML = `<div class="search-panel"><button class="search-close" type="button" aria-label="Close search">${closeIcon}</button><div class="search-head"><p class="search-kicker" data-config-template="{companyName} index"></p><h2 id="site-search-title" data-config-template="Search {companyName}"></h2></div><div class="search-field">${searchIcon}<input class="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search pages, services, materials..." data-config-aria-template="Search {companyName}" aria-controls="site-search-results" aria-autocomplete="list"><kbd>ESC</kbd></div><div class="search-results" id="site-search-results" role="listbox" aria-label="Search results"></div></div>`;
    document.body.append(searchOverlay);
    applySiteConfig(searchOverlay);
    searchInput = searchOverlay.querySelector('.search-input');
    searchResults = searchOverlay.querySelector('.search-results');
    searchClose = searchOverlay.querySelector('.search-close');
    searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', (event) => {
      if (event.target === searchOverlay) closeSearch();
    });
    searchInput.addEventListener('input', () => {
      activeSearchIndex = 0;
      renderSearchResults();
    });
    searchInput.addEventListener('keydown', (event) => {
      const results = getSearchMatches(searchInput.value);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeSearchIndex = results.length ? (activeSearchIndex + 1) % results.length : 0;
        syncActiveResult();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeSearchIndex = results.length ? (activeSearchIndex - 1 + results.length) % results.length : 0;
        syncActiveResult();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        openSearchResult(results[activeSearchIndex]);
      }
    });
  };
  const openSearch = (event) => {
    event.preventDefault();
    createSearchOverlay();
    closeMenu();
    closeDropdowns();
    lastSearchFocus = event.currentTarget;
    lockSearchScroll();
    searchOverlay.classList.add('open');
    searchOverlay.setAttribute('aria-hidden', 'false');
    setSearchExpanded(true);
    renderSearchResults();
    searchInput.focus({ preventScroll: true });
  };

  searchButtons.forEach((button) => {
    button.type = 'button';
    button.setAttribute('aria-label', button.getAttribute('aria-label') || 'Search site');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'site-search-dialog');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', openSearch);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (mobileMenu?.classList.contains('is-open')) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }
    if (searchOverlay?.classList.contains('open')) {
      event.preventDefault();
      closeSearch();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown')) {
      closeDropdowns();
    }
  });

  document.querySelectorAll('form').forEach((form) => {
    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    const result = form.querySelector('.form-result');
    let sending = false;

    form.querySelectorAll('input, textarea, select').forEach((field) => {
      if (!field.getAttribute('aria-label') && field.getAttribute('placeholder')) {
        field.setAttribute('aria-label', field.getAttribute('placeholder'));
      }
      if (field.name === 'email' && field instanceof HTMLInputElement) {
        field.type = 'email';
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      sending = true;
      if (submit) submit.disabled = true;
      if (result) result.textContent = '';

      try {
        const response = await fetch(form.action || 'send.php', {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.success) {
          if (result) result.textContent = 'Successfully sent';
          form.reset();
        } else if (result) {
          result.textContent = data.message || 'Unable to send your message. Please try again.';
        }
      } catch {
        if (result) result.textContent = 'Unable to send your message. Please try again.';
      } finally {
        sending = false;
        if (submit) submit.disabled = false;
      }
    });
  });

  document.querySelectorAll('.expand-card, .process-stage, .band, .rail').forEach((element) => {
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
  });

  const legalPage = document.querySelector('[data-legal-page]');
  if (legalPage) {
    const sectionList = [...legalPage.querySelectorAll('.legal-section[id]')];
    const navLinks = [...legalPage.querySelectorAll('.legal-nav a[href^="#"]')];

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const mobileNav = link.closest('.legal-mobile-nav');
        if (mobileNav instanceof HTMLDetailsElement) {
          window.setTimeout(() => { mobileNav.open = false; }, 180);
        }
      });
    });

    const setActiveLegalSection = (id) => {
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    };

    if (sectionList.length) setActiveLegalSection(sectionList[0].id);
    if ('IntersectionObserver' in window && sectionList.length) {
      const visibleSections = new Map();
      const legalObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
          else visibleSections.delete(entry.target.id);
        });
        if (!visibleSections.size) return;
        const active = [...visibleSections].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0][0];
        setActiveLegalSection(active);
      }, { rootMargin: '-120px 0px -62% 0px', threshold: [0, .15, .4] });
      sectionList.forEach((section) => legalObserver.observe(section));
    } else {
      window.addEventListener('scroll', () => {
        const offset = window.matchMedia('(max-width: 1024px)').matches ? 104 : 138;
        const active = [...sectionList].reverse().find((section) => section.getBoundingClientRect().top <= offset);
        if (active) setActiveLegalSection(active.id);
      }, { passive: true });
    }
  }

  document.querySelectorAll('button:not([type])').forEach((button) => {
    button.type = 'button';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeSearch();
    closeMenu();
    closeDropdowns();
  });
}());
