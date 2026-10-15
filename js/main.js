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
  { id: 'FCI', name: 'FCI requirement', difficulty: 4.0, offered: 'both' },
  { id: 'CSP', name: 'CSP requirement', difficulty: 4.0, offered: 'both' },
  { id: 'HSS', name: 'HSS requirement', difficulty: 3.0, offered: 'both' },
  { id: 'LTA', name: 'LTA requirement', difficulty: 2.0, offered: 'both' },
  { id: 'NST', name: 'NST requirement', difficulty: 4.0, offered: 'both' },
  { id: 'SES', name: 'SES requirement', difficulty: 5.0, offered: 'both' },
];

const MODEL_INFO = {
  A: {
    name: 'A — Spread evenly',
    desc: 'The same workload every semester. No ramp, no special treatment for any semester.',
  },
  B: {
    name: 'B — Ramp up',
    desc: "Lighter semesters now, heavier ones later. Eases you in, then picks up the pace as you go.",
  },
  C: {
    name: 'C — Ramp down',
    desc: 'Heavier semesters now, lighter ones later. Front-loads the harder work while your schedule is most flexible.',
  },
  D: {
    name: 'D — Protect specific semesters',
    desc: 'Keeps your study-abroad semester and your very last semester lighter than the rest.',
  },
};

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
    doneIds: [],
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

function isDone(id) {
  return state.doneIds.includes(id);
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
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');

let currentIndex = 0;

function renderChecklistInto(ul) {
  ul.innerHTML = '';
  CORE_REQUIREMENTS.forEach((req) => {
    const done = isDone(req.id);

    const item = document.createElement('li');
    item.className = done ? 'done' : '';

    const row = document.createElement('label');
    row.className = 'checklist-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    checkbox.addEventListener('change', () => {
      state.doneIds = checkbox.checked
        ? [...new Set([...state.doneIds, req.id])]
        : state.doneIds.filter((id) => id !== req.id);
      saveState();
      renderChecklistInto(ul);
    });

    const name = document.createElement('span');
    name.className = 'req-name';
    name.textContent = req.name;

    const difficulty = document.createElement('span');
    difficulty.className = 'req-difficulty';
    difficulty.textContent = `diff ${req.difficulty.toFixed(1)}`;

    row.append(checkbox, name, difficulty);
    item.appendChild(row);
    ul.appendChild(item);
  });
}

const checklistStep = {
  id: 'checklist',
  render(container) {
    container.innerHTML = '<p class="step-question">Which core requirements have you already taken or are currently taking?</p><p class="step-subtext">Check a box if you\'ve taken it or are taking it now. Leave it unchecked if it\'s still ahead of you.</p><ul id="requirement-checklist"></ul>';
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
    return true;
  },
};

const semesterFlagsStep = {
  id: 'semester-flags',
  render(container) {
    const count = state.futureSemesterCount || 0;

    if (count === 0) {
      container.innerHTML = '<p class="step-question">No semesters to configure</p><p>You said there are no semesters left after this one, so there\'s nothing to flag.</p>';
      return;
    }

    const semesters = buildFutureSemesters(count, state.currentYearIndex, state.currentTerm, state.flags);
    const rows = semesters
      .map((sem, i) => {
        const buttons = ['normal', 'abroad', 'gap']
          .map((value) => {
            const text = value === 'normal' ? 'Normal' : value === 'abroad' ? 'Abroad' : 'Gap';
            const active = sem.flag === value ? ' active' : '';
            return `<button type="button" class="flag-btn${active}" data-index="${i}" data-value="${value}">${text}</button>`;
          })
          .join('');
        return `<div class="semester-row">
          <span class="sem-label">${semesterLabel(sem)}</span>
          <div class="flag-toggle">${buttons}</div>
        </div>`;
      })
      .join('');

    container.innerHTML = `
      <p class="step-question">Anything unusual in any of these semesters?</p>
      <p class="step-subtext">Flag a semester as "Abroad" or "Gap" if it won't carry a normal course load. Leave the rest as Normal.</p>
      <div class="semester-list">${rows}</div>`;

    container.querySelectorAll('.flag-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.index);
        state.flags[i] = btn.dataset.value;
        saveState();
        container.querySelectorAll(`.flag-btn[data-index="${i}"]`).forEach((b) => {
          b.classList.toggle('active', b.dataset.value === btn.dataset.value);
        });
      });
    });
  },
  onNext() {
    return true;
  },
};

const modelStep = {
  id: 'model',
  render(container) {
    const hasAbroad = state.flags.includes('abroad');
    const suggested = hasAbroad ? 'D' : 'A';

    const options = ['A', 'B', 'C', 'D']
      .map((key) => {
        const checked = (state.selectedModel || suggested) === key ? ' checked' : '';
        return `<label class="model-option">
          <input type="radio" name="model" value="${key}"${checked}>
          <div class="model-option-body">
            <span class="model-name">${MODEL_INFO[key].name}</span>
            <span class="model-desc">${MODEL_INFO[key].desc}</span>
          </div>
        </label>`;
      })
      .join('');

    container.innerHTML = `
      <p class="step-question">Which scheduling model fits you?</p>
      <p class="step-hint">Suggested: Model ${suggested}${hasAbroad ? ' — you flagged a study-abroad semester' : ''}</p>
      <div class="model-options">${options}</div>`;

    container.querySelectorAll('input[name="model"]').forEach((input) => {
      input.addEventListener('change', () => {
        container.querySelectorAll('.model-option').forEach((label) => {
          label.classList.toggle('selected', label.querySelector('input').checked);
        });
      });
    });
    container.querySelectorAll('.model-option').forEach((label) => {
      label.classList.toggle('selected', label.querySelector('input').checked);
    });
  },
  onNext() {
    const checked = document.querySelector('input[name="model"]:checked');
    if (checked) state.selectedModel = checked.value;
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

const steps = [checklistStep, yearTermStep, semesterCountStep, semesterFlagsStep, modelStep, confirmStep];

function renderStep() {
  const step = steps[currentIndex];
  step.render(stepContent);
  backBtn.disabled = currentIndex === 0;
  nextBtn.textContent = step.isFinal ? 'Generate my plan' : 'Next';

  const position = currentIndex + 1;
  const total = steps.length;
  progressFill.style.width = `${(position / total) * 100}%`;
  progressLabel.textContent = `Step ${position} of ${total}`;

  stepContent.classList.remove('step-anim');
  void stepContent.offsetWidth;
  stepContent.classList.add('step-anim');

  const firstField = stepContent.querySelector('select, input, button');
  if (firstField) firstField.focus();
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

stepContent.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const step = steps[currentIndex];
  if (step.id === 'checklist') return;
  if (event.target.tagName === 'SELECT' || event.target.tagName === 'INPUT') {
    event.preventDefault();
    nextBtn.click();
  }
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
  tag.textContent = '— current semester';
  label.appendChild(tag);
  head.appendChild(label);
  band.appendChild(head);

  const note = document.createElement('p');
  note.textContent = 'Planning starts the semester after this one.';
  band.appendChild(note);

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
  const remaining = CORE_REQUIREMENTS.filter((r) => !isDone(r.id));
  const semesters = buildFutureSemesters(state.futureSemesterCount, state.currentYearIndex, state.currentTerm, state.flags);

  if (remaining.length === 0) {
    planOutput.innerHTML = '';
    planOutput.appendChild(renderCurrentSemesterBand());
    const note = document.createElement('p');
    note.textContent = 'Every requirement is already marked as taken or in progress — nothing left to schedule.';
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
  currentIndex = 0;
  showScreen('landing');
});

showScreen('landing');
