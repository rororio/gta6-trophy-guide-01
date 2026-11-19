// Leonida Legend — boot and render for the GTA 6 trophy guide & tracker.
// Loads app/data/trophies.json, renders one card per trophy with its official
// name, description, grade and cited guide, and wires up the checklist,
// filters, spoiler setting, search and export/import (see storage.js).
import { STORAGE_KEY, loadEarned, saveEarned, exportProgress, importProgressFile } from './storage.js';
import { KIND_LABELS, filterTrophies, spoilerHides } from './filters.js';

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('emptyState');
const onlineEl = document.getElementById('onlineNote');
const shownEl = document.getElementById('shownCount');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const earnedEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoiler');

const params = new URLSearchParams(location.search);
const state = {
  kind: params.get('kind') ?? 'all',
  grade: params.get('grade') ?? 'all',
  earnedFilter: 'all',
  search: '',
  spoiler: params.get('spoiler') === '1',
  openId: Number(params.get('open') ?? 0) || null,
  earned: loadEarned(),
};

let doc = null;

function stageLabel(stage) {
  return stage === 1 ? 'Roadmap step 1' : stage === 2 ? 'Roadmap step 2' : 'Roadmap step 3';
}

function sourceLinks(trophy) {
  const defs = doc.sources ?? {};
  return (trophy.sources ?? []).map((key) => {
    const def = defs[key];
    if (!def) return key;
    return `<a href="${def.url}" target="_blank" rel="noopener">${def.name}</a>`;
  }).join(' &middot; ');
}

function renderCard(trophy) {
  const earned = state.earned.has(trophy.id);
  const hidden = spoilerHides(trophy, state.spoiler, state.earned);
  const card = document.createElement('article');
  card.className = 'card' + (earned ? ' earned' : '');
  card.dataset.id = String(trophy.id);

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${hidden ? 'this story trophy' : trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    saveEarned(state.earned);
    render();
  });
  head.append(box);

  const title = document.createElement('div');
  title.className = 'card-title';
  const name = document.createElement('h3');
  name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  if (hidden) {
    const note = document.createElement('span');
    note.className = 'hidden-note';
    note.textContent = ' — spoiler-safe mode hides this name until you earn it';
    name.append(note);
  }
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'Its official name and description stay hidden until earned.' : trophy.description;
  title.append(name, desc);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const grade = document.createElement('span');
  grade.className = `badge ${trophy.grade}`;
  grade.textContent = trophy.grade;
  badges.append(grade);
  const kind = document.createElement('span');
  kind.className = 'badge kind';
  kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  badges.append(kind);
  const stage = document.createElement('span');
  stage.className = 'badge stage';
  stage.textContent = stageLabel(trophy.stage);
  badges.append(stage);
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'badge missable';
    flag.textContent = '⚠ Missable';
    badges.append(flag);
  }
  if (trophy.status === 'unverified') {
    const flag = document.createElement('span');
    flag.className = 'badge unverified';
    flag.textContent = 'Unverified';
    badges.append(flag);
  } else if (trophy.status === 'partial') {
    const flag = document.createElement('span');
    flag.className = 'badge partial';
    flag.textContent = 'Partly unconfirmed';
    badges.append(flag);
  }
  title.append(badges);
  head.append(title);
  card.append(head);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const open = state.openId === trophy.id;
  toggle.textContent = open ? '▾ Hide guide' : '▸ Show guide & sources';
  toggle.setAttribute('aria-expanded', String(open));
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.hidden = !open;
  guide.textContent = trophy.guide;
  toggle.addEventListener('click', () => {
    const nowOpen = guide.hidden;
    guide.hidden = !nowOpen;
    toggle.textContent = nowOpen ? '▾ Hide guide' : '▸ Show guide & sources';
    toggle.setAttribute('aria-expanded', String(nowOpen));
    state.openId = nowOpen ? trophy.id : null;
  });
  card.append(toggle, guide);

  const sources = document.createElement('p');
  sources.className = 'sources';
  sources.innerHTML = `Source${(trophy.sources ?? []).length > 1 ? 's' : ''}: ${sourceLinks(trophy)}`;
  card.append(sources);
  return card;
}

function renderProgress() {
  const total = doc.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  const fill = document.getElementById('progressFill');
  fill.style.width = `${pct}%`;
  const bar = document.getElementById('progressBar');
  bar.setAttribute('aria-valuenow', String(done));
  bar.setAttribute('aria-valuemax', String(total));
}

function render() {
  renderProgress();
  const shown = filterTrophies(doc.trophies, state);
  listEl.replaceChildren(...shown.map(renderCard));
  shownEl.textContent = `${shown.length} of ${doc.trophies.length} trophies shown`;
  emptyEl.hidden = shown.length !== 0 || state.kind === 'online';
  onlineEl.hidden = state.kind !== 'online';
  document.querySelectorAll('.kind').forEach((button) => {
    const active = button.dataset.kind === state.kind;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  spoilerEl.checked = state.spoiler;
  gradeEl.value = state.grade;
}

function bindControls() {
  document.querySelectorAll('.kind').forEach((button) => {
    button.addEventListener('click', () => {
      state.kind = button.dataset.kind;
      render();
    });
  });
  searchEl.addEventListener('input', () => { state.search = searchEl.value; render(); });
  gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; render(); });
  earnedEl.addEventListener('change', () => { state.earnedFilter = earnedEl.value; render(); });
  spoilerEl.addEventListener('change', () => { state.spoiler = spoilerEl.checked; render(); });
  document.getElementById('export').addEventListener('click', () => exportProgress(state.earned));
  document.getElementById('import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.earned = await importProgressFile(file);
      saveEarned(state.earned);
      render();
    } catch (error) {
      alert(`Could not import that file: ${error.message}`);
    }
    event.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Clear every ticked trophy? You can export first to keep a backup.')) return;
    state.earned = new Set();
    saveEarned(state.earned);
    render();
  });
  document.getElementById('showMissable').addEventListener('click', () => {
    state.kind = 'missable';
    state.openId = 28;
    document.getElementById('list').scrollIntoView({ behavior: 'smooth' });
    render();
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  doc = await response.json();
  if (!['all', 'story', 'missable', 'collectibles', 'activities', 'online'].includes(state.kind)) state.kind = 'all';
  if (!['all', 'platinum', 'gold', 'silver', 'bronze'].includes(state.grade)) state.grade = 'all';
  bindControls();
  render();
}

boot();
