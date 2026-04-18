// Bootstraps: hydrate text from profile.json, mount canvas bg, init scroll, init publications.
import { mountNeuralCanvas } from './neural-canvas.js';
import { initScrollEffects } from './scroll.js';
import { initPublications } from './publications.js';
import { renderInterestsGraph } from './interests-graph.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function loadProfile() {
  const res = await fetch('assets/data/profile.json', { cache: 'no-cache' });
  return res.json();
}

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el != null) el.textContent = text;
}

function hydrate(profile) {
  // Hero contacts
  const contactsEl = document.querySelector('[data-bind="hero.contacts"]');
  if (contactsEl) {
    contactsEl.innerHTML = profile.hero.contacts.map(c => {
      const icon = iconSvg(c.icon);
      const tip = `${c.label}: ${c.value}`;
      if (c.href) {
        return `<a class="hero__contact" href="${c.href}" target="_blank" rel="noopener" aria-label="${escapeHtml(tip)}" data-tip="${escapeHtml(tip)}">${icon}</a>`;
      }
      return `<span class="hero__contact" aria-label="${escapeHtml(tip)}" data-tip="${escapeHtml(tip)}">${icon}</span>`;
    }).join('');
  }

  // About
  setText('[data-bind="about.heading"]', profile.about.heading);
  const bioEl = document.querySelector('[data-bind="about.bio"]');
  if (bioEl) bioEl.innerHTML = profile.about.bio.map(p => `<p>${escapeHtml(p)}</p>`).join('');

  // Interests
  setText('[data-bind="interests.heading"]', profile.interests.heading);
  setText('[data-bind="interests.intro"]', profile.interests.intro);
  const listEl = document.querySelector('[data-bind="interests.primary"]');
  if (listEl) {
    listEl.innerHTML = profile.interests.primary.map((item, i) => `
      <div class="interest-item">
        <div class="interest-item__num">${String(i + 1).padStart(2, '0')}</div>
        <div>
          <div class="interest-item__label">${escapeHtml(item.label)}</div>
          <div class="interest-item__brief">${escapeHtml(item.brief)}</div>
        </div>
      </div>
    `).join('');
  }
  const graphEl = document.querySelector('[data-bind="interests.graph"]');
  if (graphEl) {
    renderInterestsGraph(graphEl, profile.interests.primary);
  }

  // Journey
  setText('[data-bind="journey.heading"]', profile.journey.heading);
  const eduEl = document.querySelector('[data-bind="journey.education"]');
  if (eduEl) eduEl.innerHTML = profile.journey.education.map(it => `
    <div class="timeline__item">
      <div class="timeline__year">${escapeHtml(it.year)}</div>
      <div class="timeline__title">${escapeHtml(it.label)}</div>
      <div class="timeline__sub">${escapeHtml(it.institution)}</div>
    </div>
  `).join('');
  const expEl = document.querySelector('[data-bind="journey.experience"]');
  if (expEl) expEl.innerHTML = profile.journey.experience.map(it => `
    <div class="timeline__item">
      <div class="timeline__year">${escapeHtml(it.year)}</div>
      <div class="timeline__title">${escapeHtml(it.role)}</div>
      <div class="timeline__sub">${escapeHtml(it.institution)} · ${escapeHtml(it.location)}</div>
    </div>
  `).join('');

  // Publications section headings
  setText('[data-bind="publications.heading"]', profile.publications.heading);
  setText('[data-bind="publications.intro"]', profile.publications.intro);

  // Recognition (Courses + Awards)
  setText('[data-bind="recognition.heading"]', profile.recognition.heading);
  setText('[data-bind="recognition.courses.label"]', profile.recognition.courses.label);
  setText('[data-bind="recognition.awards.label"]', profile.recognition.awards.label);

  const courseEl = document.querySelector('[data-bind="recognition.courses.items"]');
  if (courseEl) courseEl.innerHTML = profile.recognition.courses.items.map(c => `
    <div class="course">
      <div class="course__code">${escapeHtml(c.code)}</div>
      <div class="course__title">${escapeHtml(c.title)}</div>
      <div class="course__sem">${escapeHtml(c.semesters)}</div>
    </div>
  `).join('');

  const awardEl = document.querySelector('[data-bind="recognition.awards.items"]');
  if (awardEl) awardEl.innerHTML = profile.recognition.awards.items.map(a => `
    <div class="award">
      <div class="award__year">${escapeHtml(a.year || '')}</div>
      <div class="award__title">${escapeHtml(a.title)}</div>
    </div>
  `).join('');

  // Project
  setText('[data-bind="project.heading"]', profile.project.heading);
  setText('[data-bind="project.badge"]', profile.project.badge);
  setText('[data-bind="project.title"]', profile.project.title);
  setText('[data-bind="project.body"]', profile.project.body);
  const projectCta = document.querySelector('[data-bind="project.cta"]');
  if (projectCta) {
    projectCta.textContent = profile.project.cta + '  →';
    projectCta.setAttribute('href', profile.project.url);
    projectCta.setAttribute('target', '_blank');
    projectCta.setAttribute('rel', 'noopener');
  }

  // Service
  setText('[data-bind="service.heading"]', profile.service.heading);
  const svcEl = document.querySelector('[data-bind="service.groups"]');
  if (svcEl) svcEl.innerHTML = profile.service.groups.map(g => `
    <div class="svc-group">
      <div class="svc-group__label">${escapeHtml(g.label)}</div>
      <ul>${g.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>
    </div>
  `).join('');

  // Memberships
  setText('[data-bind="memberships.heading"]', profile.memberships.heading);
  const memEl = document.querySelector('[data-bind="memberships.groups"]');
  if (memEl) memEl.innerHTML = profile.memberships.groups.map(g => `
    <div class="svc-group">
      <div class="svc-group__label">${escapeHtml(g.label)}</div>
      <ul>${g.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>
    </div>
  `).join('');

  // Students
  setText('[data-bind="students.heading"]', profile.students.heading);
  setText('[data-bind="students.intro"]', profile.students.intro);
  const studentsEl = document.querySelector('[data-bind="students.items"]');
  if (studentsEl) studentsEl.innerHTML = profile.students.items.map(s => `
    <div class="student">
      <div class="student__avatar">${escapeHtml(initials(s.name))}</div>
      <div class="student__name">${escapeHtml(s.name)}</div>
      <div class="student__year">Joined ${escapeHtml(s.year)}</div>
    </div>
  `).join('');
}

function initials(name) {
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function iconSvg(name) {
  const s = {
    mail:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>',
    phone:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92V21a1 1 0 0 1-1.09 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.21 3.09 1 1 0 0 1 4.2 2h4.09a1 1 0 0 1 1 .75c.12.96.35 1.9.68 2.81a1 1 0 0 1-.23 1L8.05 8.05a16 16 0 0 0 6 6l1.49-1.69a1 1 0 0 1 1-.23c.91.33 1.85.56 2.81.68a1 1 0 0 1 .75 1z"/></svg>',
    pin:     '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    scholar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3 2 9l10 6 8-4.8V17"/><path d="M6 11.4V16a6 6 0 0 0 12 0v-4.6"/></svg>',
    lab:     '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3v7l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3L15 10V3"/><path d="M8 3h8"/><path d="M6.5 16h11"/></svg>',
    stevens: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14l-2 8h-10z"/><path d="M7 11l-2 10h14l-2-10"/></svg>',
    link:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>'
  };
  return s[name] || s.link;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function bootstrap() {
  try {
    const profile = await loadProfile();
    hydrate(profile);
  } catch (err) {
    console.error('profile.json load failed', err);
  }

  // Canvas bg
  const canvas = document.querySelector('.hero__canvas');
  if (canvas && !reducedMotion) {
    mountNeuralCanvas(canvas);
  }

  // Scroll effects
  initScrollEffects();

  // Publications
  initPublications({
    listEl: document.querySelector('#pub-list'),
    searchEl: document.querySelector('#pub-search'),
    yearSelectEl: document.querySelector('#pub-year'),
    topicSelectEl: document.querySelector('#pub-topic'),
    countEl: document.querySelector('#pub-count'),
    metaTotalEl: document.querySelector('[data-bind="scholar.citations"]'),
    metaHEl: document.querySelector('[data-bind="scholar.h"]'),
    metaI10El: document.querySelector('[data-bind="scholar.i10"]'),
    metaUpdatedEl: document.querySelector('[data-bind="scholar.updated"]'),
    metaCountEl: document.querySelector('[data-bind="scholar.count"]')
  });

  const yearEl = document.querySelector('[data-bind="year"]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
