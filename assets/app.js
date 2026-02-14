(() => {
  const body = document.body;
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lockDepth = 0;
  const lockScroll = () => {
    lockDepth += 1;
    body.classList.add('scroll-lock');
  };
  const unlockScroll = () => {
    lockDepth = Math.max(0, lockDepth - 1);
    if (lockDepth === 0) body.classList.remove('scroll-lock');
  };

  const trapFocus = (container, event) => {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(container.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // Header behavior
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  // Language dropdown
  const langToggle = document.querySelector('[data-lang-toggle]');
  const langMenu = document.querySelector('[data-lang-menu]');
  if (langToggle && langMenu) {
    const closeLangMenu = () => {
      langMenu.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    };

    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = langMenu.classList.toggle('open');
      langToggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (e) => {
      if (!langMenu.contains(e.target) && e.target !== langToggle) closeLangMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLangMenu();
    });

    const currentHash = window.location.hash;
    document.querySelectorAll('a[data-lang-link]').forEach(link => {
      if (currentHash) link.setAttribute('href', link.getAttribute('href').split('#')[0] + currentHash);
    });
  }

  // Mobile drawer
  const drawer = document.querySelector('[data-drawer]');
  const drawerOpenBtn = document.querySelector('[data-drawer-open]');
  const drawerCloseBtn = document.querySelector('[data-drawer-close]');
  const drawerBackdrop = document.querySelector('[data-drawer-backdrop]');
  let drawerPreviouslyFocused = null;

  const closeDrawer = () => {
    if (!drawer || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawerBackdrop?.classList.remove('open');
    unlockScroll();
    if (drawerPreviouslyFocused) drawerPreviouslyFocused.focus();
  };

  const openDrawer = () => {
    if (!drawer) return;
    drawerPreviouslyFocused = document.activeElement;
    drawer.classList.add('open');
    drawerBackdrop?.classList.add('open');
    lockScroll();
    const firstFocusable = drawer.querySelector(focusableSelectors);
    firstFocusable?.focus();
  };

  drawerOpenBtn?.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  // Privacy modal
  const modal = document.querySelector('[data-modal]');
  const modalOpen = document.querySelectorAll('[data-modal-open]');
  const modalClose = document.querySelectorAll('[data-modal-close]');
  let modalPreviouslyFocused = null;

  const closeModal = () => {
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    unlockScroll();
    if (modalPreviouslyFocused) modalPreviouslyFocused.focus();
  };

  const openModal = (trigger) => {
    if (!modal) return;
    modalPreviouslyFocused = trigger || document.activeElement;
    modal.classList.add('open');
    lockScroll();
    const firstFocusable = modal.querySelector(focusableSelectors);
    firstFocusable?.focus();
  };

  modalOpen.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(btn);
  }));
  modalClose.forEach(btn => btn.addEventListener('click', closeModal));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDrawer();
    }
    if (drawer?.classList.contains('open')) trapFocus(drawer, e);
    if (modal?.classList.contains('open')) trapFocus(modal, e);
  });

  // Reveal animations
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (prefersReduced) {
    revealItems.forEach(item => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  // Counters
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = Number(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    const initial = 0;

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(initial + (target - initial) * eased);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(counter => counterObserver.observe(counter));
  }

  // Bars
  const bars = document.querySelectorAll('[data-bar]');
  if (bars.length) {
    const barObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const value = entry.target.dataset.bar;
          entry.target.style.setProperty('--bar-width', `${value}%`);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    bars.forEach(bar => barObserver.observe(bar));
  }

  // FAQ accordion
  const faqButtons = document.querySelectorAll('.faq-question');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = true;
      });
      if (!expanded) {
        button.setAttribute('aria-expanded', 'true');
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        if (panel) panel.hidden = false;
      }
    });
  });

  // Forms + toast
  const toast = document.querySelector('[data-toast]');
  const forms = document.querySelectorAll('form[data-lead-form]');
  const showToast = () => {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('input[name="name"]');
      const email = form.querySelector('input[name="email"]');
      const phone = form.querySelector('input[name="phone"]');

      const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      const validName = name && name.value.trim().length >= 2;
      const validPhone = phone && phone.value.trim().length >= 6;

      [name, email, phone].forEach(field => field?.classList.remove('invalid'));
      if (!validName) name?.classList.add('invalid');
      if (!validEmail) email?.classList.add('invalid');
      if (!validPhone) phone?.classList.add('invalid');

      if (validName && validEmail && validPhone) {
        form.reset();
        showToast();
      }
    });
  });
})();
