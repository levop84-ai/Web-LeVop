/**
 * LENKA VOPAŘILOVÁ – JavaScript
 * Interaktivita, animace, formulář, typografické úpravy
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollReveal();
  initNonBreakingSpaces();
  initContactForm();
  initCookieBanner();
  initActiveNav();
  initHeroAnimation();
  initScrollAnimations();
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

/* ============================================================
   NAVIGACE – hamburger + sticky header
   ============================================================ */
function initNavigation() {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile-menu');
  const header     = document.querySelector('.site-header');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Zavřít menu po kliknutí na odkaz
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Zavřít menu kliknutím mimo
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Sticky header shadow
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }
}

/* ============================================================
   AKTIVNÍ POLOŽKA MENU při scrollování
   ============================================================ */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   SCROLL REVEAL – fade-in při scrollu
   ============================================================ */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  } else {
    // Fallback pro staré prohlížeče
    elements.forEach(el => el.classList.add('visible'));
  }
}

/* ============================================================
   ČESKÁ TYPOGRAFIE – nedělitelné mezery za jednopísmennými spojkami
   ============================================================ */
function initNonBreakingSpaces() {
  // Zpracuj text uzly jen v těchto elementech
  const targets = document.querySelectorAll(
    'main p, main li, main h1, main h2, main h3, main h4, footer p, footer li, .hero-supertitle'
  );

  // Jednopísmenné předložky a spojky v češtině
  const pattern = /(\s|^)([aikosvuzAIKOSVUZ])\s+(?=\S)/g;

  targets.forEach(el => {
    processTextNodes(el, node => {
      node.textContent = node.textContent.replace(pattern, (_, before, letter) => {
        return `${before}${letter}\u00A0`;
      });
    });
  });
}

function processTextNodes(element, callback) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Přeskočit text v inputech, scriptech atd.
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'input', 'textarea', 'code', 'pre'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }
  nodes.forEach(callback);
}

/* ============================================================
   KONTAKTNÍ FORMULÁŘ – validace + odeslání přes Formspree
   ============================================================ */
function initContactForm() {
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot kontrola
    const hp = form.querySelector('input[name="website"]');
    if (hp && hp.value.trim() !== '') {
      showStatus(status, '✓ Zpráva odeslána! Ozvu se co nejdříve.', 'success');
      form.reset();
      return;
    }

    // Základní validace
    const required = form.querySelectorAll('[required]');
    let valid = true;

    required.forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        field.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        field.addEventListener('input', () => {
          field.classList.remove('has-error');
          field.removeAttribute('aria-invalid');
        }, { once: true });
      }
    });

    if (!valid) {
      showStatus(status, 'Prosím vyplňte všechna povinná pole.', 'error');
      return;
    }

    // E-mail validace
    const email = form.querySelector('input[type="email"]');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.classList.add('has-error');
      email.setAttribute('aria-invalid', 'true');
      email.addEventListener('input', () => {
        email.classList.remove('has-error');
        email.removeAttribute('aria-invalid');
      }, { once: true });
      showStatus(status, 'Zadejte prosím platnou e-mailovou adresu.', 'error');
      return;
    }

    // Odeslání
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Odesílám…';

    try {
      const formData = new FormData(form);
      // Odstraň honeypot z odesílaných dat
      formData.delete('website');

      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        showStatus(status, '✓ Zpráva odeslána! Ozvu se co nejdříve.', 'success');
        submitBtn.textContent = 'Odeslat zprávu';
      } else {
        throw new Error('Server response not ok');
      }
    } catch {
      showStatus(status,
        'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu nebo mi napište přímo na lenka@voparilova.cz',
        'error'
      );
      submitBtn.textContent = 'Odeslat zprávu';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function showStatus(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.className = `form-status ${type}`;
  el.setAttribute('role', 'alert');
  // Scroll k hlášce
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ============================================================
   COOKIE LIŠTA
   ============================================================ */
function initCookieBanner() {
  const banner    = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');

  if (!banner) return;

  // Pokud uživatel už souhlasil, skryjeme lištu
  if (localStorage.getItem('cookieConsent') === 'accepted') {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      banner.classList.add('hidden');
    });
  }
}

/* ============================================================
   ANIMACE HERO NADPISU: zvýrazňovač + záměna slova
   ============================================================ */
function initHeroAnimation() {
  function runAnim() {
    const swap = document.querySelector('.word-swap');
    if (!swap) return;

    swap.classList.remove('phase-strike', 'phase-new');
    swap.querySelectorAll('.brush-path').forEach(p => {
      p.style.animation = 'none';
      p.style.strokeDashoffset = '600';
      void p.offsetWidth;
      p.style.animation = '';
    });
    const oldText = swap.querySelector('.old-word-text');
    oldText.style.animation = 'none';
    oldText.style.opacity = '';
    oldText.style.filter = '';
    const newWord = swap.parentElement.querySelector('.new-word');
    newWord.style.animation = 'none';
    newWord.style.opacity = '0';

    setTimeout(() => { swap.classList.add('phase-strike'); }, 800);
    setTimeout(() => {
      newWord.style.animation = '';
      newWord.style.opacity = '';
      swap.classList.add('phase-new');
    }, 1700);
  }

  runAnim();

  const hero = document.querySelector('.word-swap');
  if (hero && 'IntersectionObserver' in window) {
    let seen = false;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && seen) { runAnim(); }
        if (e.isIntersecting) seen = true;
      });
    }, { threshold: 0.6 });
    obs.observe(hero);
  }
}

/* ============================================================
   SCROLL ANIMACE: kroužky, bubliny, podtržení
   ============================================================ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  // Kroužky okolo fotky v sekci Toolbox
  document.querySelectorAll('.tools-circle-ring, .tools-mobile-ring').forEach(ring => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ring.querySelectorAll('.circle-ring-path').forEach(p => {
            p.style.animation = 'none';
            p.style.strokeDashoffset = '1300';
            void p.offsetWidth;
            p.style.animation = '';
          });
          ring.classList.add('animated');
        } else {
          ring.classList.remove('animated');
        }
      });
    }, { threshold: 0.4 });
    obs.observe(ring);
  });

  // Bublina + čtyřlístek v sekci O mně
  const wrap = document.querySelector('.speech-bubble-wrap');
  const clover = document.querySelector('.bubble-clover');
  if (wrap) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          wrap.querySelectorAll('.bubble-ring-path').forEach(p => {
            p.style.animation = 'none';
            p.style.strokeDashoffset = '700';
            void p.offsetWidth;
            p.style.animation = '';
          });
          if (clover) {
            clover.style.animation = 'none';
            void clover.offsetWidth;
            clover.style.animation = '';
            clover.classList.add('animated');
          }
          wrap.classList.add('animated');
        } else {
          wrap.classList.remove('animated');
          if (clover) clover.classList.remove('animated');
        }
      });
    }, { threshold: 0.4 });
    obs.observe(wrap);
  }

  // Rámeček patičkové bubliny
  const footerBubble = document.querySelector('.footer-bubble');
  if (footerBubble) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          footerBubble.querySelectorAll('.footer-bubble-ring-path').forEach(p => {
            p.style.animation = 'none';
            p.style.strokeDashoffset = '1300';
            void p.offsetWidth;
            p.style.animation = '';
          });
          footerBubble.classList.add('animated');
        } else {
          footerBubble.classList.remove('animated');
        }
      });
    }, { threshold: 0.3 });
    obs.observe(footerBubble);
  }

  // Podtržení card-sub při scrollu do view
  const cardSubTargets = document.querySelectorAll('.card-sub-underline');
  if (cardSubTargets.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const path = e.target.querySelector('.brush-upath');
          if (path) {
            path.style.animation = 'none';
            path.style.strokeDashoffset = '600';
            void path.offsetWidth;
            path.style.animation = '';
          }
          e.target.classList.add('animated');
        } else {
          e.target.classList.remove('animated');
        }
      });
    }, { threshold: 0.6 });
    cardSubTargets.forEach(t => obs.observe(t));
  }
}
