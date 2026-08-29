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
    { title: 'Testimonials', type: 'Section', url: 'index.html#testimonials', description: 'Home testimonial slider.', keywords: 'testimonials reviews words swiper slider homeowner renovator restorer' },
    { title: 'FAQ', type: 'Section', url: 'index.html#faq', description: 'Common siding questions.', keywords: 'faq questions begin material repair proportions accordion' },
    { title: 'Contact', type: 'Section', url: 'index.html#contact', description: 'Project enquiry form.', keywords: 'contact form enquiry send project email' },
    { title: 'Installation Hero', type: 'Section', url: 'installation.html#installation-main', description: 'Siding installation page opening.', keywords: 'installation hero siding install service' },
    { title: 'Facade Zoning', type: 'Section', url: 'installation.html#facade-zoning', description: 'Interactive elevation zones.', keywords: 'facade zoning main wall gable corners openings trim installation' },
    { title: 'Profile Scale Lab', type: 'Section', url: 'installation.html#profile-scale', description: 'Panel width and reveal controls.', keywords: 'profile scale lab panel width reveal balanced narrow wide installation' },
    { title: 'Trim Composer', type: 'Section', url: 'installation.html#trim-composer', description: 'Window trim and opening details.', keywords: 'trim composer frame opening reveal casing sill slim standard bold installation' },
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
  function closeSearch() {
    if (!searchOverlay || !searchOverlay.classList.contains('open')) return;
    searchOverlay.classList.remove('open');
    searchOverlay.setAttribute('aria-hidden', 'true');
    setSearchExpanded(false);
    unlockSearchScroll();
    searchInput.value = '';
    activeSearchIndex = 0;
    searchResults.innerHTML = '';
    searchInput.removeAttribute('aria-activedescendant');
    if (lastSearchFocus instanceof HTMLElement) lastSearchFocus.focus({ preventScroll: true });
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
    searchOverlay.innerHTML = `<div class="search-panel"><button class="search-close" type="button" aria-label="Close search">${closeIcon}</button><div class="search-head"><p class="search-kicker">SIDINGS index</p><h2 id="site-search-title">Search SIDINGS</h2></div><div class="search-field">${searchIcon}<input class="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search pages, services, materials..." aria-label="Search SIDINGS" aria-controls="site-search-results" aria-autocomplete="list"><kbd>ESC</kbd></div><div class="search-results" id="site-search-results" role="listbox" aria-label="Search results"></div></div>`;
    document.body.append(searchOverlay);
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
    closeSearch();
    closeMenu();
    closeDropdowns();
  });
}());
