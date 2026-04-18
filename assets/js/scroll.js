// IntersectionObserver-based reveals, nav auto-hide, scroll progress bar,
// and active-section tracking for top + side navigation.

export function initScrollEffects() {
  // Reveal-on-scroll
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

  // Collect all nav links (top + side) that point to sections
  const navLinks = Array.from(document.querySelectorAll(
    '.nav__links a[href^="#"], .side-nav a[href^="#"]'
  ));
  const sections = Array.from(new Set(
    navLinks
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean)
  ));

  const activeObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = e.target.id;
      navLinks.forEach(a =>
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id)
      );
    }
  }, { threshold: 0.35, rootMargin: '-20% 0px -35% 0px' });
  sections.forEach(s => activeObserver.observe(s));

  // Nav auto-hide on scroll down; side-nav fade on hero
  const nav = document.querySelector('.nav');
  const sideNav = document.querySelector('.side-nav');
  const hero = document.querySelector('.hero');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    if (nav) {
      if (y > 120 && y > lastY) nav.classList.add('nav--hidden');
      else nav.classList.remove('nav--hidden');
    }
    if (sideNav && hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      sideNav.classList.toggle('is-atop', y < heroBottom - window.innerHeight * 0.5);
    }
    lastY = y;
    updateProgress();
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Scroll progress
  const progress = document.querySelector('.progress');
  function updateProgress() {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = pct + '%';
  }
  update();
}
