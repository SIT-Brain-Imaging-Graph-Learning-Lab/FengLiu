// Renders publication list from publications.json with year & keyword filters.
// Titles are NOT linked (per user request) — metadata only.

const TOPIC_LABELS = {
  'neuroscience': 'Neuroscience',
  'ai-health':    'AI × Health',
  'dynamics':     'Dynamics & Chaos',
  'optimization': 'Optimization',
  'energy':       'Energy Systems',
  'systems':      'Control Systems',
  'other':        'Other'
};

export async function initPublications(opts) {
  const {
    listEl,
    searchEl,
    yearSelectEl,
    topicSelectEl,
    countEl,
    dataUrl = 'assets/data/publications.json',
    metaUrl = 'assets/data/scholar-meta.json',
    metaTotalEl,
    metaHEl,
    metaI10El,
    metaUpdatedEl,
    metaCountEl
  } = opts;

  let papers = [];
  try {
    const res = await fetch(dataUrl, { cache: 'no-cache' });
    papers = await res.json();
  } catch (err) {
    if (listEl) listEl.innerHTML = '<div class="pub-empty">Could not load publications.</div>';
    console.error('publications.json load failed', err);
    return;
  }

  try {
    const res = await fetch(metaUrl, { cache: 'no-cache' });
    const meta = await res.json();
    if (metaTotalEl)   metaTotalEl.textContent   = meta.citations_all?.toLocaleString() ?? '—';
    if (metaHEl)       metaHEl.textContent       = meta.h_index_all ?? '—';
    if (metaI10El)     metaI10El.textContent     = meta.i10_all ?? '—';
    if (metaCountEl)   metaCountEl.textContent   = meta.publication_count ?? papers.length;
    if (metaUpdatedEl) metaUpdatedEl.textContent = meta.last_updated ?? '';
  } catch { /* non-fatal */ }

  const years = Array.from(new Set(papers.map(p => p.year).filter(Boolean))).sort((a, b) => b - a);
  if (yearSelectEl) {
    yearSelectEl.innerHTML = '<option value="">All years</option>' +
      years.map(y => `<option value="${y}">${y}</option>`).join('');
  }
  const topics = Array.from(new Set(papers.map(p => p.topic).filter(Boolean))).sort();
  if (topicSelectEl) {
    topicSelectEl.innerHTML = '<option value="">All topics</option>' +
      topics.map(t => `<option value="${t}">${TOPIC_LABELS[t] || t}</option>`).join('');
  }

  function render() {
    const q = (searchEl?.value || '').trim().toLowerCase();
    const y = yearSelectEl?.value || '';
    const t = topicSelectEl?.value || '';

    const filtered = papers.filter(p => {
      if (y && String(p.year) !== y) return false;
      if (t && p.topic !== t) return false;
      if (!q) return true;
      const hay = (p.title + ' ' + (p.authors || '') + ' ' + (p.venue || '')).toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => (b.year || 0) - (a.year || 0) || (b.citations || 0) - (a.citations || 0));

    if (countEl) countEl.textContent = `${filtered.length} / ${papers.length} papers`;

    if (!listEl) return;
    if (!filtered.length) {
      listEl.innerHTML = '<div class="pub-empty">No publications match your filters.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const title = escapeHtml(p.title);
      const authors = highlightSelf(escapeHtml(p.authors || ''));
      const venue = escapeHtml(p.venue || '');
      const year = p.year || '';
      const cites = p.citations || 0;
      const citesHtml = cites > 0
        ? `<div class="pub-item__cites"><strong>${cites}</strong> cites</div>`
        : `<div class="pub-item__cites"></div>`;
      return `
        <article class="pub-item">
          <div class="pub-item__year">${year}</div>
          <div class="pub-item__main">
            <h4 class="pub-item__title">${title}</h4>
            <div class="pub-item__meta">${authors}${venue ? ' · <span class="pub-item__venue">' + venue + '</span>' : ''}</div>
          </div>
          ${citesHtml}
        </article>
      `;
    }).join('');
  }

  searchEl?.addEventListener('input', debounce(render, 140));
  yearSelectEl?.addEventListener('change', render);
  topicSelectEl?.addEventListener('change', render);
  render();
}

// Bold-highlights the author's own name (Feng Liu / F. Liu / F Liu) inside
// an already-HTML-escaped author string.
function highlightSelf(str) {
  return str.replace(
    /\b(Feng\s+Liu|F\.?\s+Liu)\b/g,
    '<strong class="pub-author-self">$1</strong>'
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
