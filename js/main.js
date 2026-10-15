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

const YEAR_NAMES = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

const MODEL_CAPS = {
  A: { normal: 6, abroad: 6, final: 6 },
  B: { early: 4, late: 8, abroad: 4, final: 8 },
  C: { early: 8, late: 4, abroad: 4, final: 4 },
  D: { normal: 7, abroad: 3, final: 3 },
};

const MAX_PER_SEMESTER = 2;

function defaultState() {
  return {
    requirementStatus: {},
    currentYearIndex: 0,
    currentTerm: 'fall',
    futureSemesterCount: null,
    flags: [],
    selectedModel: 'A',
  };
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return saved ? { ...defaultState(), ...saved } : defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStatus(id) {
  return state.requirementStatus[id] || 'not_started';
}

let state = loadState();

function yearLabel(index) {
  return YEAR_NAMES[index] || `Year ${index + 1}`;
}

function termLabel(term) {
  return term === 'fall' ? 'Fall' : 'Spring';
}

function advanceTerm(yearIndex, term) {
  if (term === 'fall') return { yearIndex, term: 'spring' };
  return { yearIndex: yearIndex + 1, term: 'fall' };
}

function currentSemesterInfo() {
  return { yearIndex: state.currentYearIndex, term: state.currentTerm };
}

function buildFutureSemesters(count, startYearIndex, startTerm, flags) {
  const semesters = [];
  let cursor = { yearIndex: startYearIndex, term: startTerm };
  for (let i = 0; i < count; i++) {
    cursor = advanceTerm(cursor.yearIndex, cursor.term);
    semesters.push({ yearIndex: cursor.yearIndex, term: cursor.term, type: cursor.term, flag: flags[i] || 'normal' });
  }
  return semesters;
}

function semesterLabel(sem) {
  return `${yearLabel(sem.yearIndex)} ${termLabel(sem.term)}`;
}

function getCap(index, flag, totalCount, model) {
  if (flag === 'gap') return 0;
  if (flag === 'abroad') return MODEL_CAPS[model].abroad;

  const isFinal = index === totalCount - 1;
  if (isFinal) return MODEL_CAPS[model].final;

  if (model === 'B' || model === 'C') {
    const half = Math.ceil(totalCount / 2);
    const inFirstHalf = index < half;
    return model === 'B'
      ? (inFirstHalf ? MODEL_CAPS.B.early : MODEL_CAPS.B.late)
      : (inFirstHalf ? MODEL_CAPS.C.early : MODEL_CAPS.C.late);
  }

  return MODEL_CAPS[model].normal;
}

function countValidSlots(req, semesters) {
  return semesters.filter(
    (s) => s.flag !== 'gap' && (req.offered === 'both' || req.offered === s.type)
  ).length;
}

function generatePlan(requirements, semesters, model) {
  const sorted = [...requirements].sort((a, b) => {
    const slotDiff = countValidSlots(a, semesters) - countValidSlots(b, semesters);
    if (slotDiff !== 0) return slotDiff;
    return b.difficulty - a.difficulty;
  });

  let pool = sorted;

  const assignments = semesters.map((sem, index) => {
    const cap = getCap(index, sem.flag, semesters.length, model);
    const maxCount = sem.flag === 'gap' ? 0 : MAX_PER_SEMESTER;
    const items = [];
    let total = 0;

    pool = pool.filter((req) => {
      if (items.length >= maxCount) return true;
      const fitsType = req.offered === 'both' || req.offered === sem.type;
      const fitsCap = total + req.difficulty <= cap;
      if (fitsType && fitsCap) {
        items.push(req);
        total += req.difficulty;
        return false;
      }
      return true;
    });

    return { index, sem, cap, items, total };
  });

  return { assignments, unscheduled: pool };
}

// --- Screens ---
const screens = {
  landing: document.getElementById('screen-landing'),
  wizard: document.getElementById('screen-wizard'),
  plan: document.getElementById('screen-plan'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

// --- Wizard engine ---
const stepContent = document.getElementById('step-content');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');

let currentIndex = 0;

function renderChecklistInto(ul) {
  ul.innerHTML = '';
  CORE_REQUIREMENTS.forEach((req) => {
    const status = getStatus(req.id);

    const item = document.createElement('li');
    item.className = status !== 'not_started' ? status : '';

    const name = document.createElement('span');
    name.className = 'req-name';
    name.textContent = req.name;

    const difficulty = document.createElement('span');
    difficulty.className = 'req-difficulty';
    difficulty.textContent = `diff ${req.difficulty.toFixed(1)}`;

    const select = document.createElement('select');
    [
      ['not_started', 'Not started'],
      ['in_progress', 'In progress'],
      ['completed', 'Completed'],
    ].forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      if (status === value) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      state.requirementStatus = { ...state.requirementStatus, [req.id]: select.value };
      saveState();
      renderChecklistInto(ul);
    });

    item.append(name, difficulty, select);
    ul.appendChild(item);
  });
}

const checklistStep = {
  id: 'checklist',
  render(container) {
    container.innerHTML = '<p class="step-question">What have you completed, and what are you taking right now?</p><ul id="requirement-checklist"></ul>';
    renderChecklistInto(document.getElementById('requirement-checklist'));
  },
  onNext() {
    return true;
  },
};

const yearTermStep = {
  id: 'year-term',
  render(container) {
    container.innerHTML = `
      <p class="step-question">Where are you right now?</p>
      <div class="step-field">
        <label for="current-year">Your current year</label>
        <select id="current-year">
          <option value="0">Freshman</option>
          <option value="1">Sophomore</option>
          <option value="2">Junior</option>
          <option value="3">Senior</option>
        </select>
      </div>
      <div class="step-field">
        <label for="current-term">Your current term</label>
        <select id="current-term">
          <option value="fall">Fall</option>
          <option value="spring">Spring</option>
        </select>
      </div>`;
    document.getElementById('current-year').value = String(state.currentYearIndex);
    document.getElementById('current-term').value = state.currentTerm;
  },
  onNext() {
    state.currentYearIndex = Number(document.getElementById('current-year').value);
    state.currentTerm = document.getElementById('current-term').value;
    saveState();
    return true;
  },
};

const semesterCountStep = {
  id: 'semester-count',
  render(container) {
    container.innerHTML = `
      <p class="step-question">How many semesters do you have left after this one?</p>
      <div class="step-field">
        <input type="number" id="semester-count" min="0" step="1" inputmode="numeric" value="${state.futureSemesterCount ?? ''}">
        <p class="field-error" id="semester-count-error" hidden></p>
      </div>`;
  },
  onNext() {
    const input = document.getElementById('semester-count');
    const error = document.getElementById('semester-count-error');
    const raw = input.value.trim();
    const count = Number(raw);
    const isValid = raw !== '' && Number.isInteger(count) && count >= 0;

    if (!isValid) {
      input.classList.add('invalid');
      error.textContent = 'Enter 0 or more remaining semesters';
      error.hidden = false;
      return false;
    }

    input.classList.remove('invalid');
    error.hidden = true;

    const previousFlags = state.flags;
    state.futureSemesterCount = count;
    state.flags = Array.from({ length: count }, (_, i) => previousFlags[i] || 'normal');
    saveState();
    rebuildFlagSteps(count);
    return true;
  },
};

function makeFlagStep(i) {
  return {
    id: `flag-${i}`,
    render(container) {
      const sem = buildFutureSemesters(state.futureSemesterCount, state.currentYearIndex, state.currentTerm, state.flags)[i];
      container.innerHTML = `
        <p class="step-question">${semesterLabel(sem)} — anything unusual?</p>
        <div class="step-field">
          <select id="flag-select">
            <option value="normal">Normal semester</option>
            <option value="abroad">Study abroad</option>
            <option value="gap">Gap semester</option>
          </select>
        </div>`;
      document.getElementById('flag-select').value = state.flags[i] || 'normal';
    },
    onNext() {
      state.flags[i] = document.getElementById('flag-select').value;
      saveState();
      return true;
    },
  };
}

function rebuildFlagSteps(count) {
  const anchor = steps.findIndex((s) => s.id === 'semester-count');
  while (steps[anchor + 1] && steps[anchor + 1].id.startsWith('flag-')) {
    steps.splice(anchor + 1, 1);
  }
  const flagSteps = [];
  for (let i = 0; i < count; i++) flagSteps.push(makeFlagStep(i));
  steps.splice(anchor + 1, 0, ...flagSteps);
}

const modelStep = {
  id: 'model',
  render(container) {
    const hasAbroad = state.flags.includes('abroad');
    const suggested = hasAbroad ? 'D' : 'A';
    container.innerHTML = `
      <p class="step-question">Which scheduling model?</p>
      <div class="step-field">
        <select id="model-select">
          <option value="A">A — Spread evenly</option>
          <option value="B">B — Ramp up</option>
          <option value="C">C — Ramp down</option>
          <option value="D">D — Protect specific semesters</option>
        </select>
      </div>
      <p class="step-hint">Suggested: Model ${suggested}${hasAbroad ? ' — you flagged a study-abroad semester' : ''}</p>`;
    document.getElementById('model-select').value = state.selectedModel || suggested;
  },
  onNext() {
    state.selectedModel = document.getElementById('model-select').value;
    saveState();
    return true;
  },
};

const confirmStep = {
  id: 'confirm',
  isFinal: true,
  render(container) {
    const futureCount = state.futureSemesterCount || 0;
    container.innerHTML = `
      <p class="step-question">Ready to build your plan?</p>
      <p>Current semester: ${semesterLabel(currentSemesterInfo())}. ${futureCount} semester${futureCount === 1 ? '' : 's'} after that, using Model ${state.selectedModel}.</p>`;
  },
  onNext() {
    generateAndShowPlan();
    return false;
  },
};

const steps = [checklistStep, yearTermStep, semesterCountStep, modelStep, confirmStep];

function renderStep() {
  const step = steps[currentIndex];
  step.render(stepContent);
  backBtn.disabled = currentIndex === 0;
  nextBtn.textContent = step.isFinal ? 'Generate my plan' : 'Next';
}

backBtn.addEventListener('click', () => {
  if (currentIndex === 0) return;
  currentIndex--;
  renderStep();
});

nextBtn.addEventListener('click', () => {
  const step = steps[currentIndex];
  const ok = step.onNext();
  if (!ok) return;
  if (step.isFinal) return;
  currentIndex++;
  renderStep();
});

// --- Plan screen ---
const planOutput = document.getElementById('plan-output');

function renderCurrentSemesterBand() {
  const band = document.createElement('div');
  band.className = 'semester-band current';

  const head = document.createElement('div');
  head.className = 'semester-head';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = semesterLabel(currentSemesterInfo());
  const tag = document.createElement('span');
  tag.className = 'flag-tag';
  tag.textContent = '— current semester, locked';
  label.appendChild(tag);
  head.appendChild(label);
  band.appendChild(head);

  const inProgress = CORE_REQUIREMENTS.filter((r) => getStatus(r.id) === 'in_progress');

  if (inProgress.length === 0) {
    const note = document.createElement('p');
    note.textContent = 'Nothing marked as in progress this semester.';
    band.appendChild(note);
  } else {
    const list = document.createElement('ul');
    list.className = 'band-items';
    inProgress.forEach((req) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = req.name;
      const diff = document.createElement('span');
      diff.textContent = `diff ${req.difficulty.toFixed(1)}`;
      li.append(name, diff);
      list.appendChild(li);
    });
    band.appendChild(list);
  }

  return band;
}

function renderPlan(plan) {
  planOutput.innerHTML = '';
  planOutput.appendChild(renderCurrentSemesterBand());

  plan.assignments.forEach((a) => {
    const band = document.createElement('div');
    band.className = 'semester-band' + (a.sem.flag === 'gap' ? ' gap' : '');

    const head = document.createElement('div');
    head.className = 'semester-head';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = semesterLabel(a.sem);
    if (a.sem.flag !== 'normal') {
      const tag = document.createElement('span');
      tag.className = 'flag-tag';
      tag.textContent = a.sem.flag === 'abroad' ? '— study abroad' : '— gap semester';
      label.appendChild(tag);
    }
    head.appendChild(label);

    if (a.sem.flag !== 'gap') {
      const ratioText = document.createElement('span');
      ratioText.textContent = `${a.total.toFixed(1)} / ${a.cap}`;
      head.appendChild(ratioText);
    }

    band.appendChild(head);

    if (a.sem.flag !== 'gap') {
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      const ratio = a.cap > 0 ? a.total / a.cap : 0;
      if (ratio > 1) fill.classList.add('over');
      else if (ratio >= 0.8) fill.classList.add('warn');
      track.appendChild(fill);
      band.appendChild(track);

      const list = document.createElement('ul');
      list.className = 'band-items';
      a.items.forEach((req) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = req.name;
        const diff = document.createElement('span');
        diff.textContent = `diff ${req.difficulty.toFixed(1)}`;
        li.append(name, diff);
        list.appendChild(li);
      });
      band.appendChild(list);

      animateBar(fill, Math.min(100, ratio * 100), a.index);
    } else {
      const note = document.createElement('p');
      note.textContent = 'No courses this semester.';
      band.appendChild(note);
    }

    planOutput.appendChild(band);
  });

  if (plan.unscheduled.length > 0) {
    const unscheduled = document.createElement('div');
    unscheduled.id = 'unscheduled';

    const heading = document.createElement('h3');
    heading.textContent = "Couldn't be scheduled";
    unscheduled.appendChild(heading);

    const list = document.createElement('ul');
    plan.unscheduled.forEach((req) => {
      const li = document.createElement('li');
      li.textContent = `${req.name} (diff ${req.difficulty.toFixed(1)})`;
      list.appendChild(li);
    });
    unscheduled.appendChild(list);
    planOutput.appendChild(unscheduled);
  }
}

function animateBar(fillEl, targetPercent, index) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    fillEl.style.width = `${targetPercent}%`;
    return;
  }
  setTimeout(() => {
    fillEl.style.width = `${targetPercent}%`;
  }, index * 80);
}

function generateAndShowPlan() {
  const remaining = CORE_REQUIREMENTS.filter((r) => getStatus(r.id) === 'not_started');
  const semesters = buildFutureSemesters(state.futureSemesterCount, state.currentYearIndex, state.currentTerm, state.flags);

  if (remaining.length === 0) {
    planOutput.innerHTML = '';
    planOutput.appendChild(renderCurrentSemesterBand());
    const note = document.createElement('p');
    note.textContent = 'Every requirement is already marked in progress or completed — nothing left to schedule.';
    planOutput.appendChild(note);
  } else {
    const plan = generatePlan(remaining, semesters, state.selectedModel);
    renderPlan(plan);
  }

  showScreen('plan');
}

// --- Start / reset ---
document.getElementById('start-btn').addEventListener('click', () => {
  currentIndex = 0;
  renderStep();
  showScreen('wizard');
});

document.getElementById('start-over-btn').addEventListener('click', () => {
  state = defaultState();
  saveState();
  rebuildFlagSteps(0);
  currentIndex = 0;
  showScreen('landing');
});

showScreen('landing');
