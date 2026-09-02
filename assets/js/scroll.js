// Active-section tracking for the top navigation. No animations.

export function initScrollEffects() {
  const navLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  function update() {
    const marker = window.scrollY + window.innerHeight * 0.3;
    let current = null;
    for (const s of sections) {
      if (s.offsetTop <= marker) current = s;
    }
    // Sections not in the nav (project, memberships) inherit the nearest preceding nav section.
    const id = current ? current.id : null;
    navLinks.forEach(a => a.classList.toggle('is-active', id !== null && a.getAttribute('href') === '#' + id));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}
