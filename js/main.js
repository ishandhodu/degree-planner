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

function defaultState() {
  return {
    takenIds: [],
    inProgressIds: [],
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

function isTaken(id) {
  return state.takenIds.includes(id);
}

function isInProgress(id) {
  return state.inProgressIds.includes(id);
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

  const assignments = semesters.map((sem, index) => ({
    index,
    sem,
    cap: getCap(index, sem.flag, semesters.length, model),
    items: [],
    total: 0,
  }));

  sorted.forEach((req) => {
    const eligible = assignments.filter(
      (a) => a.sem.flag !== 'gap' && (req.offered === 'both' || req.offered === a.sem.type)
    );
    if (eligible.length === 0) return;

    let best = eligible[0];
    let bestOverage = best.total + req.difficulty - best.cap;
    eligible.forEach((a) => {
      const overage = a.total + req.difficulty - a.cap;
      if (overage < bestOverage) {
        best = a;
        bestOverage = overage;
      }
    });

    const overBudget = best.total + req.difficulty > best.cap;
    best.items.push({ ...req, overBudget });
    best.total += req.difficulty;
  });

  return { assignments };
}

// --- Info tips: small "i" icons that explain a confusing element on hover/tap ---
function createInfoTip(text) {
  const wrap = document.createElement('span');
  wrap.className = 'info-tip';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'info-tip-btn';
  btn.textContent = 'i';
  btn.setAttribute('aria-label', 'What does this mean?');

  const bubble = document.createElement('span');
  bubble.className = 'info-tip-bubble';
  bubble.setAttribute('role', 'tooltip');
  bubble.textContent = text;

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const alreadyOpen = wrap.classList.contains('open');
    document.querySelectorAll('.info-tip.open').forEach((el) => {
      el.classList.remove('open');
      el.querySelector('.info-tip-bubble').style.transform = 'translateX(-50%)';
    });
    if (!alreadyOpen) {
      wrap.classList.add('open');
      positionInfoTip(bubble);
    }
  });

  wrap.append(btn, bubble);
  return wrap;
}

function positionInfoTip(bubble) {
  bubble.style.transform = 'translateX(-50%)';
  const rect = bubble.getBoundingClientRect();
  const overflowRight = rect.right - (window.innerWidth - 8);
  const overflowLeft = 8 - rect.left;
  if (overflowRight > 0) {
    bubble.style.transform = `translateX(calc(-50% - ${overflowRight}px))`;
  } else if (overflowLeft > 0) {
    bubble.style.transform = `translateX(calc(-50% + ${overflowLeft}px))`;
  }
}

document.addEventListener('click', () => {
  document.querySelectorAll('.info-tip.open').forEach((el) => el.classList.remove('open'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.info-tip.open').forEach((el) => el.classList.remove('open'));
  }
});

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
  document.body.classList.toggle('plan-active', name === 'plan');
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
    const taken = isTaken(req.id);
    const inProgress = isInProgress(req.id);

    const item = document.createElement('li');
    item.className = taken ? 'done' : '';

    const row = document.createElement('div');
    row.className = 'checklist-row';

    const statusGroup = document.createElement('div');
    statusGroup.className = 'status-group';

    const takenLabel = document.createElement('label');
    takenLabel.className = 'status-check';
    const takenBox = document.createElement('input');
    takenBox.type = 'checkbox';
    takenBox.checked = taken;
    takenLabel.append(takenBox, document.createTextNode('Taken'));

    const progressLabel = document.createElement('label');
    progressLabel.className = 'status-check';
    const progressBox = document.createElement('input');
    progressBox.type = 'checkbox';
    progressBox.checked = inProgress;
    progressLabel.append(progressBox, document.createTextNode('Taking now'));

    takenBox.addEventListener('change', () => {
      if (takenBox.checked) {
        state.takenIds = [...new Set([...state.takenIds, req.id])];
        state.inProgressIds = state.inProgressIds.filter((id) => id !== req.id);
      } else {
        state.takenIds = state.takenIds.filter((id) => id !== req.id);
      }
      saveState();
      renderChecklistInto(ul);
    });

    progressBox.addEventListener('change', () => {
      if (progressBox.checked) {
        state.inProgressIds = [...new Set([...state.inProgressIds, req.id])];
        state.takenIds = state.takenIds.filter((id) => id !== req.id);
      } else {
        state.inProgressIds = state.inProgressIds.filter((id) => id !== req.id);
      }
      saveState();
      renderChecklistInto(ul);
    });

    statusGroup.append(takenLabel, progressLabel);

    const name = document.createElement('span');
    name.className = 'req-name';
    name.textContent = req.name;

    const difficulty = document.createElement('span');
    difficulty.className = 'req-difficulty';
    difficulty.textContent = `diff ${req.difficulty.toFixed(1)}`;

    row.append(statusGroup, name, difficulty);
    item.appendChild(row);
    ul.appendChild(item);
  });
}

const checklistStep = {
  id: 'checklist',
  render(container) {
    container.innerHTML = '<p class="step-question">Which core requirements have you already taken, or are you currently taking?<span id="checklist-info-slot"></span></p><p class="step-subtext">Check "Taken" if you\'ve completed it, or "Taking now" if you\'re enrolled in it this semester. Leave both unchecked if it\'s still ahead of you.</p><ul id="requirement-checklist"></ul>';
    document
      .getElementById('checklist-info-slot')
      .appendChild(
        createInfoTip(
          'Both remove a requirement from scheduling. "Taking now" also makes it show up on your current semester\'s card in the generated plan.'
        )
      );
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
      <p class="step-question">Anything unusual in any of these semesters?<span id="flags-info-slot"></span></p>
      <p class="step-subtext">Flag a semester as "Abroad" or "Gap" if it won't carry a normal course load. Leave the rest as Normal.</p>
      <div class="semester-list">${rows}</div>`;

    document
      .getElementById('flags-info-slot')
      .appendChild(
        createInfoTip(
          'Normal uses your model\'s usual difficulty budget. Abroad lowers that budget, since you\'ll likely take fewer core requirements that term. Gap skips the semester entirely — nothing gets scheduled there.'
        )
      );

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

// --- Plan screen: horizontal card timeline ---
const planTrack = document.getElementById('plan-track');
const planSummaryEl = document.getElementById('plan-summary');
const planScroller = document.getElementById('plan-scroller');

const SLOT_COUNT = 4;

function loadColorFor(ratio) {
  if (ratio > 1) return 'var(--brick)';
  if (ratio >= 0.8) return 'var(--mustard)';
  return 'var(--forest)';
}

function courseShortName(req) {
  return req.name.replace(/^[A-Z]{2,4}\s?\d{3,4}\s?—\s?/, '');
}

function buildSemesterColumn(entry) {
  const { sem, cap, items, total } = entry;
  const isCurrent = sem.flag === 'current';
  const isGap = sem.flag === 'gap';
  const isAbroad = sem.flag === 'abroad';
  const hasBudget = !isCurrent && !isGap;
  const overBudgetCount = items.filter((item) => item.overBudget).length;

  const column = document.createElement('div');
  column.className = 'plan-column';

  const marker = document.createElement('div');
  marker.className = 'plan-marker';
  const dot = document.createElement('span');
  dot.className = 'plan-dot' + (isCurrent ? ' current' : '') + (isGap ? ' gap' : '');
  const yearLbl = document.createElement('span');
  yearLbl.className = 'plan-year-label';
  yearLbl.textContent = yearLabel(sem.yearIndex).toUpperCase();
  marker.append(dot, yearLbl);
  column.appendChild(marker);

  const card = document.createElement('div');
  card.className = 'plan-card' + (isCurrent ? ' current' : '') + (isGap ? ' gap' : '');

  const head = document.createElement('div');
  head.className = 'plan-card-head';

  const headRow = document.createElement('div');
  headRow.className = 'plan-card-head-row';
  const term = document.createElement('span');
  term.className = 'plan-term';
  term.textContent = termLabel(sem.term);
  const ratio = document.createElement('span');
  ratio.className = 'plan-ratio';
  ratio.textContent = isCurrent || isGap ? '—' : `${total.toFixed(1)} / ${cap}`;
  if (hasBudget && total > cap) ratio.style.color = 'var(--brick)';

  let infoText;
  if (isCurrent) {
    infoText =
      'Courses here are whatever you checked "Taking now" earlier. This semester isn\'t scheduled by the planner, so there\'s no difficulty budget to show.';
  } else if (isGap) {
    infoText = "You flagged this semester as a gap, so the planner skips it entirely — nothing gets scheduled here.";
  } else {
    infoText =
      'This is the total difficulty of what\'s assigned here, out of this semester\'s difficulty budget. Difficulty is a 1–5 rating per course; the budget comes from your scheduling model' +
      (isAbroad ? ', and study-abroad semesters get a lighter one' : '') +
      '. A course that doesn\'t fit still gets placed — it\'s marked "over budget" instead of being left off your plan.';
  }
  const ratioWrap = document.createElement('span');
  ratioWrap.className = 'plan-ratio-wrap';
  ratioWrap.append(ratio, createInfoTip(infoText));

  headRow.append(term, ratioWrap);
  head.appendChild(headRow);

  const barTrack = document.createElement('div');
  barTrack.className = 'plan-bar-track';
  const segmentEls = [];
  if (hasBudget) {
    const baseColor = loadColorFor(cap > 0 ? total / cap : 0);
    items.forEach((item) => {
      const seg = document.createElement('div');
      seg.className = 'plan-bar-segment';
      seg.dataset.targetWidth = String(cap > 0 ? (item.difficulty / cap) * 100 : 0);
      seg.style.width = '0%';
      seg.style.background = baseColor;
      barTrack.appendChild(seg);
      segmentEls.push(seg);
    });
  }
  head.appendChild(barTrack);

  const tag = document.createElement('p');
  tag.className = 'plan-tag';
  let defaultTagText = '';
  let defaultTagColor = '';
  if (isCurrent) {
    defaultTagText = 'you are here';
    defaultTagColor = 'var(--forest)';
  } else if (isGap) {
    defaultTagText = 'gap semester · no courses';
  } else if (overBudgetCount > 0) {
    defaultTagText = `${overBudgetCount} course${overBudgetCount === 1 ? '' : 's'} over budget`;
    defaultTagColor = 'var(--brick)';
  } else if (isAbroad) {
    defaultTagText = '— study abroad';
    defaultTagColor = 'var(--forest)';
  }
  tag.textContent = defaultTagText;
  tag.style.color = defaultTagColor;
  head.appendChild(tag);

  card.appendChild(head);

  const slots = document.createElement('div');
  slots.className = 'plan-slots';
  const rowEls = [];
  const rowCount = Math.max(SLOT_COUNT, items.length);
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('div');
    row.className = 'plan-slot';

    const item = items[i];
    if (item && item.overBudget) {
      const warning = document.createElement('p');
      warning.className = 'plan-slot-warning';
      warning.textContent = 'over budget';
      row.appendChild(warning);
    }

    const slotRow = document.createElement('div');
    slotRow.className = 'plan-slot-row';
    const left = document.createElement('div');
    left.className = 'plan-slot-left';
    const code = document.createElement('span');
    code.className = 'plan-slot-code';
    const name = document.createElement('span');
    name.className = 'plan-slot-name';
    left.append(code, name);
    const right = document.createElement('span');
    right.className = 'plan-slot-credits';

    if (item) {
      code.textContent = item.id;
      name.textContent = courseShortName(item);
      right.textContent = `diff ${item.difficulty.toFixed(1)}`;

      const segEl = segmentEls[i];
      row.addEventListener('mouseenter', () => {
        rowEls.forEach((r) => {
          if (r !== row) r.style.opacity = '0.45';
        });
        row.style.background = 'var(--band-light)';
        if (segEl) {
          segmentEls.forEach((s) => {
            s.style.opacity = s === segEl ? '1' : '0.25';
          });
        }
      });
      row.addEventListener('mouseleave', () => {
        rowEls.forEach((r) => {
          r.style.opacity = '';
        });
        row.style.background = '';
        segmentEls.forEach((s) => {
          s.style.opacity = '';
        });
      });
    } else {
      name.textContent = isCurrent ? '—' : '(elective)';
      name.classList.add('empty');
    }

    slotRow.append(left, right);
    row.appendChild(slotRow);
    slots.appendChild(row);
    rowEls.push(row);
  }
  card.appendChild(slots);

  const foot = document.createElement('div');
  foot.className = 'plan-card-foot';
  const placed = document.createElement('span');
  placed.textContent = `${items.length} course${items.length === 1 ? '' : 's'}`;
  const totalEl = document.createElement('span');
  totalEl.textContent = isCurrent || isGap ? '' : `${total.toFixed(1)} difficulty`;
  foot.append(placed, totalEl);
  card.appendChild(foot);

  column.appendChild(card);

  if (hasBudget && overBudgetCount === 0) {
    card.addEventListener('mouseenter', () => {
      tag.textContent = `${(cap - total).toFixed(1)} difficulty open`;
      tag.style.color = 'var(--muted)';
    });
    card.addEventListener('mouseleave', () => {
      tag.textContent = defaultTagText;
      tag.style.color = defaultTagColor;
    });
  }

  return {
    columnEl: column,
    dotEl: dot,
    segmentEls,
    ratioEl: ratio,
    cap,
    baseUsed: total,
    rowEls,
  };
}

function easeOutCubic(x) {
  const c = Math.min(1, Math.max(0, x));
  return 1 - Math.pow(1 - c, 3);
}

function applyColumnFrame(col, pCard, pDot) {
  col.columnEl.style.opacity = String(pCard);
  col.columnEl.style.transform = `translateY(${(1 - pCard) * 18}px)`;
  col.dotEl.style.transform = `scale(${(0.4 + 0.6 * pDot).toFixed(3)})`;
  col.segmentEls.forEach((seg) => {
    seg.style.width = `${Number(seg.dataset.targetWidth) * pCard}%`;
  });
  if (col.ratioEl && col.baseUsed != null && col.cap > 0) {
    col.ratioEl.textContent = `${(col.baseUsed * pCard).toFixed(1)} / ${col.cap}`;
  }
  col.rowEls.forEach((row) => {
    row.style.opacity = String(pCard);
  });
}

let planAnimFrame = null;
let lastPlanColumns = [];
let lastSpineFill = null;

function animatePlanLoad(columns, spineFillEl) {
  if (planAnimFrame) cancelAnimationFrame(planAnimFrame);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    columns.forEach((col) => applyColumnFrame(col, 1, 1));
    spineFillEl.style.width = '100%';
    return;
  }

  const n = columns.length;
  const start = performance.now();
  const duration = n * 130 + 1600;

  function frame(now) {
    const t = now - start;
    columns.forEach((col, i) => {
      const pCard = easeOutCubic((t - 150 - i * 130) / 650);
      const pDot = easeOutCubic((t - 150 - i * 130) / 350);
      applyColumnFrame(col, pCard, pDot);
    });
    const spineP = easeOutCubic((t - 100) / (n * 130 + 800));
    spineFillEl.style.width = `${spineP * 100}%`;

    if (t < duration) {
      planAnimFrame = requestAnimationFrame(frame);
    } else {
      columns.forEach((col) => applyColumnFrame(col, 1, 1));
      spineFillEl.style.width = '100%';
      planAnimFrame = null;
    }
  }
  planAnimFrame = requestAnimationFrame(frame);
}

function replayCurrentPlan() {
  if (!lastSpineFill) return;
  lastPlanColumns.forEach((col) => applyColumnFrame(col, 0, 0));
  lastSpineFill.style.width = '0%';
  requestAnimationFrame(() => animatePlanLoad(lastPlanColumns, lastSpineFill));
}

function renderPlanTimeline(plan) {
  planTrack.innerHTML = '';

  const spineBg = document.createElement('div');
  spineBg.className = 'plan-spine-bg';
  const spineFill = document.createElement('div');
  spineFill.className = 'plan-spine-fill';
  planTrack.append(spineBg, spineFill);

  const inProgressReqs = CORE_REQUIREMENTS.filter((r) => isInProgress(r.id));
  const currentEntry = {
    sem: { yearIndex: state.currentYearIndex, term: state.currentTerm, flag: 'current' },
    cap: 0,
    items: inProgressReqs,
    total: inProgressReqs.reduce((sum, r) => sum + r.difficulty, 0),
  };

  const entries = [
    currentEntry,
    ...plan.assignments.map((a) => ({ sem: a.sem, cap: a.cap, items: a.items, total: a.total })),
  ];

  const columnRefs = entries.map((entry) => buildSemesterColumn(entry));
  columnRefs.forEach((col) => planTrack.appendChild(col.columnEl));

  const semesterCount = plan.assignments.length;
  const placedCount = plan.assignments.reduce((sum, a) => sum + a.items.length, 0);
  const overBudgetCount = plan.assignments.reduce(
    (sum, a) => sum + a.items.filter((item) => item.overBudget).length,
    0
  );
  planSummaryEl.innerHTML =
    `<span>${semesterCount} semester${semesterCount === 1 ? '' : 's'} planned</span>` +
    `<span>${placedCount} course${placedCount === 1 ? '' : 's'} placed</span>` +
    (overBudgetCount > 0 ? `<span class="brick">${overBudgetCount} over budget</span>` : '');

  lastPlanColumns = columnRefs;
  lastSpineFill = spineFill;
  animatePlanLoad(columnRefs, spineFill);
}

function generateAndShowPlan() {
  const remaining = CORE_REQUIREMENTS.filter((r) => !isTaken(r.id) && !isInProgress(r.id));
  const semesters = buildFutureSemesters(state.futureSemesterCount, state.currentYearIndex, state.currentTerm, state.flags);

  const plan =
    remaining.length === 0
      ? {
          assignments: semesters.map((sem, index) => ({
            index,
            sem,
            cap: getCap(index, sem.flag, semesters.length, state.selectedModel),
            items: [],
            total: 0,
          })),
        }
      : generatePlan(remaining, semesters, state.selectedModel);

  renderPlanTimeline(plan);
  showScreen('plan');
}

document.getElementById('plan-scroll-left').addEventListener('click', () => {
  planScroller.scrollBy({ left: -292, behavior: 'smooth' });
});
document.getElementById('plan-scroll-right').addEventListener('click', () => {
  planScroller.scrollBy({ left: 292, behavior: 'smooth' });
});
planScroller.addEventListener(
  'wheel',
  (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      planScroller.scrollLeft += event.deltaY;
    }
  },
  { passive: true }
);
document.getElementById('replay-btn').addEventListener('click', () => {
  planScroller.scrollTo({ left: 0, behavior: 'auto' });
  replayCurrentPlan();
});

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
