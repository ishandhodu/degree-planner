const STORAGE_KEY = 'degree-planner-state';

const CORE_REQUIREMENTS = [
  { id: 'AQM1000', name: 'AQM 1000 — Foundations of Business Analytics', difficulty: 4.0, offered: 'both' },
  { id: 'AQM2000', name: 'AQM 2000 — Predictive Business Analytics', difficulty: 2.0, offered: 'both' },
  { id: 'ACC1000', name: 'ACC 1000 — Principles of Accounting', difficulty: 4.7, offered: 'both' },
  { id: 'ACC2002', name: 'ACC 2002 — Managerial Accounting', difficulty: 3.0, offered: 'both' },
  { id: 'ECN2000', name: 'ECN 2000 — Principles of Macroeconomics', difficulty: 3.0, offered: 'both' },
  { id: 'ECN2002', name: 'ECN 2002 — Principles of Microeconomics', difficulty: 5.0, offered: 'both' },
  { id: 'FIN2000', name: 'FIN 2000 — Principles of Finance', difficulty: 4.0, offered: 'both' },
  { id: 'LAW1000', name: 'LAW 1000 — Business Law', difficulty: 2.0, offered: 'both' },
  { id: 'MKT2000', name: 'MKT 2000 — Principles of Marketing', difficulty: 4.0, offered: 'both' },
  { id: 'OIM2000', name: 'OIM 2000 — Digital Technologies for Entrepreneurs', difficulty: 3.0, offered: 'both' },
  { id: 'OIM2001', name: 'OIM 2001 — Technology Operations Management', difficulty: 4.0, offered: 'both' },
  { id: 'FME1000', name: 'FME 1000 — Foundations of Management & Entrepreneurship', difficulty: 3.5, offered: 'both' },
  { id: 'STR3000', name: 'STR 3000 — Strategic Problem Solving', difficulty: 4.0, offered: 'both' },
  { id: 'WRT2000', name: 'WRT 2000 — Research Writing', difficulty: 5.0, offered: 'both' },
  { id: 'CSP', name: 'CSP requirement (16 options)', difficulty: 4.0, offered: 'both' },
  { id: 'HSS', name: 'HSS requirement (16 options)', difficulty: 3.0, offered: 'both' },
  { id: 'LTA', name: 'LTA requirement (16 options)', difficulty: 2.0, offered: 'both' },
  { id: 'NST', name: 'NST requirement (9 options)', difficulty: 4.0, offered: 'both' },
  { id: 'SES', name: 'SES requirement (5 options)', difficulty: 5.0, offered: 'both' },
];

function loadState() {
  const defaults = { completedIds: [], semesters: [], selectedModel: 'A' };
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return saved ? { ...defaults, ...saved } : defaults;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

const checklist = document.getElementById('requirement-checklist');

function renderChecklist() {
  checklist.innerHTML = '';

  CORE_REQUIREMENTS.forEach((req) => {
    const isCompleted = state.completedIds.includes(req.id);

    const item = document.createElement('li');
    item.className = isCompleted ? 'completed' : '';

    const label = document.createElement('label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isCompleted;
    checkbox.addEventListener('change', () => toggleCompleted(req.id));

    const name = document.createElement('span');
    name.className = 'req-name';
    name.textContent = req.name;

    const difficulty = document.createElement('span');
    difficulty.className = 'req-difficulty';
    difficulty.textContent = `diff ${req.difficulty.toFixed(1)}`;

    label.append(checkbox, name, difficulty);
    item.appendChild(label);
    checklist.appendChild(item);
  });
}

function toggleCompleted(id) {
  if (state.completedIds.includes(id)) {
    state.completedIds = state.completedIds.filter((cid) => cid !== id);
  } else {
    state.completedIds = [...state.completedIds, id];
  }
  saveState();
  renderChecklist();
}

renderChecklist();
