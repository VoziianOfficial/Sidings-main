/* Shared configuration, navigation and small non-conflicting reveal effects. */
(function () {
  if (window.__SITE_GLOBAL_READY__) return;
  window.__SITE_GLOBAL_READY__ = true;

  const config = window.SiteConfig || {};

  const clean = (value) => (typeof value === 'string' ? value.trim() : '');
  const companyName = clean(config.companyName);
  const logo = clean(config.logo);
  const favicon = clean(config.favicon);
  const email = clean(config.email);
  const disclaimer = clean(config.disclaimer);
  const browserTitle = clean(config.browserTitle);
  const pageTitle = clean(document.body?.dataset.pageTitle);

  if (browserTitle) {
    document.title = pageTitle ? `${browserTitle} | ${pageTitle}` : browserTitle;
  }
  if (favicon) {
    document.querySelectorAll('link[rel*="icon"]').forEach((icon) => { icon.href = favicon; });
  }
  if (companyName) {
    document.querySelectorAll('[data-company]').forEach((el) => { el.textContent = companyName; });
  }
  if (logo) {
    document.querySelectorAll('[data-logo]').forEach((el) => {
      el.src = logo;
      if (!el.alt && companyName) el.alt = companyName;
    });
  }
  document.querySelectorAll('[data-email]').forEach((el) => {
    if (!email) {
      el.removeAttribute('href');
      return;
    }
    el.textContent = email;
    el.href = `mailto:${email.replace(/[\r\n]/g, '')}`;
  });
  if (disclaimer) {
    document.querySelectorAll('[data-disclaimer]').forEach((el) => { el.textContent = disclaimer; });
  }

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
  const toggle = document.querySelector('.mobile-toggle');
  let lockedScrollY = 0;
  const lockPageScroll = () => {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('nav-open');
    document.body.classList.add('nav-open');
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
  };
  const unlockPageScroll = () => {
    if (!document.body.classList.contains('nav-open')) return;
    document.documentElement.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    document.body.style.paddingRight = '';
    window.scrollTo(0, lockedScrollY);
  };
  const closeMenu = () => {
    nav?.classList.remove('open');
    unlockPageScroll();
    toggle?.setAttribute('aria-expanded', 'false');
  };
  const closeDropdowns = () => {
    document.querySelectorAll('.dropdown.open').forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.drop-trigger')?.setAttribute('aria-expanded', 'false');
      dropdown.querySelector('.drop-menu')?.setAttribute('aria-hidden', 'true');
    });
  };

  if (toggle && nav) {
    if (!nav.id) nav.id = 'site-navigation';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', toggle.getAttribute('aria-label') || 'Menu');
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      if (isOpen) lockPageScroll();
      else unlockPageScroll();
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
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
    dropdown.addEventListener('pointerenter', () => { if (supportsHover() && !nav?.classList.contains('open')) setOpen(true); });
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(!dropdown.classList.contains('open'));
    });
    dropdown.addEventListener('pointerleave', () => { if (supportsHover() && !nav?.classList.contains('open')) setOpen(false); });
    dropdown.addEventListener('focusout', () => window.setTimeout(() => {
      if (!dropdown.contains(document.activeElement)) setOpen(false);
    }, 0));
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  });

  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!button || !answer) return;
    const answerId = answer.id || `faq-answer-${index + 1}`;
    answer.id = answerId;
    button.type = 'button';
    button.setAttribute('aria-controls', answerId);
    button.setAttribute('aria-expanded', String(item.classList.contains('open')));
    answer.setAttribute('aria-hidden', String(!item.classList.contains('open')));
    button.querySelector('span')?.setAttribute('aria-hidden', 'true');
    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
      answer.setAttribute('aria-hidden', String(!isOpen));
    });
  });

  const desktopMenuQuery = window.matchMedia('(min-width: 1025px)');
  const syncNavigationMode = () => {
    if (desktopMenuQuery.matches) closeMenu();
    closeDropdowns();
  };
  if (typeof desktopMenuQuery.addEventListener === 'function') {
    desktopMenuQuery.addEventListener('change', syncNavigationMode);
  } else if (typeof desktopMenuQuery.addListener === 'function') {
    desktopMenuQuery.addListener(syncNavigationMode);
  }

  document.querySelectorAll('.search').forEach((button) => {
    button.type = 'button';
    button.setAttribute('aria-label', button.getAttribute('aria-label') || 'Search site');
    button.addEventListener('click', () => {
      const query = window.prompt('Search this site');
      if (!query) return;
      const value = query.trim().toLowerCase();
      if (!value) return;
      const pages = [
        { href: 'index.html', text: 'main about services faq contact siding installation repair vinyl fiber cement board batten exterior weather' },
        { href: 'installation.html', text: 'siding installation facade zoning profile scale trim composer material vinyl fiber cement engineered wood' },
        { href: 'repair.html', text: 'siding repair damage exterior facade' },
        { href: 'privacy-policy.html', text: 'privacy policy personal information contact form' },
        { href: 'terms.html', text: 'terms of use legal informational content' },
        { href: 'cookies.html', text: 'cookies notice browser storage tracking' }
      ];
      const result = pages.find((page) => page.text.includes(value));
      if (result) {
        window.location.href = result.href;
      } else {
        window.alert('No matching page found.');
      }
    });
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

  document.querySelectorAll('button:not([type])').forEach((button) => {
    button.type = 'button';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
    closeDropdowns();
  });
}());
