/* ============================================================
   데스크핏 · 자리운동일지
   - 로컬 저장(localStorage) 기반 오프라인 PWA
   - 운동 스케줄 생성 → 알림 → 타이머 실행 → 완료 체크 → 리포트
   ============================================================ */

const STORAGE_KEY = 'deskfit_v1';
const DIAL_R = 108;
const DIAL_CIRC = 2 * Math.PI * DIAL_R;

/* ---------- 운동 라이브러리 ---------- */
const EXERCISES = [
  { id: 'ex1', name: '복부 드로인', category: '코어', duration: 180, visibility: 'invisible',
    desc: '배꼽을 등쪽으로 당기듯 힘을 주고, 편안히 숨 쉬며 버텨요.' },
  { id: 'ex2', name: '골반 기울이기', category: '코어', duration: 120, visibility: 'invisible',
    desc: '의자에 앉은 채 골반을 앞뒤로 살짝 기울이며 코어에 힘을 줘요.' },
  { id: 'ex3', name: '괄약근 조이기', category: '코어', duration: 120, visibility: 'invisible',
    desc: '엉덩이와 골반 바닥 근육을 5초 조였다 5초 풀기를 반복해요.' },
  { id: 'ex4', name: '4-7-8 호흡', category: '대사', duration: 150, visibility: 'invisible',
    desc: '4초 들이쉬고 7초 멈춘 뒤 8초에 걸쳐 내쉬며 긴장을 풀어요.' },
  { id: 'ex5', name: '손목·전완 스트레칭', category: '상체', duration: 60, visibility: 'invisible',
    desc: '손등을 아래로 당겨 전완을 늘리고, 반대쪽도 이어서 해요.' },
  { id: 'ex6', name: '목 아이소메트릭', category: '상체', duration: 90, visibility: 'invisible',
    desc: '손으로 이마를 밀고 목은 버티며 가볍게 힘겨루기를 해요.' },
  { id: 'ex7', name: '의자 다리 들기', category: '하체', duration: 180, visibility: 'slight',
    desc: '무릎을 펴서 다리를 들어올린 채 버텨요. 발끝을 몸쪽으로 당기면 효과가 커요.' },
  { id: 'ex8', name: '발뒤꿈치 들기', category: '하체', duration: 120, visibility: 'slight',
    desc: '발뒤꿈치를 들어 종아리에 힘을 주고 천천히 내려요.' },
  { id: 'ex9', name: '무릎 사이 조이기', category: '하체', duration: 180, visibility: 'invisible',
    desc: '무릎 사이를 힘주어 조이듯 버텨요. 쿠션 없이도 가능해요.' },
  { id: 'ex10', name: '어깨날개 모으기', category: '상체', duration: 90, visibility: 'slight',
    desc: '양쪽 어깨날개를 등 뒤로 모으며 자세를 펴줘요.' },
];

const INTENSITY_LEVELS = [
  { value: 'invisible', title: '완전히 안 보임', desc: '복부·코어·호흡 위주 — 옆자리에서 전혀 티가 안 나요' },
  { value: 'slight', title: '약간의 움직임 허용', desc: '다리 들기, 어깨 스트레칭 등 살짝 움직임이 있어요' },
];

const SKIP_LABELS = { '회의중': '회의 중', '외근': '외근/자리비움', '깜빡함': '깜빡함', '컨디션': '컨디션 난조', '기타': '기타' };

/* ---------- 저장소 ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { onboarded: false, settings: null, days: {}, installDate: todayKey() };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();

/* ---------- 날짜 유틸 ---------- */
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLine(d = new Date()) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KR[d.getDay()]}요일`;
}

/* ---------- 스케줄 생성 ---------- */
function generateSchedule(settings) {
  const start = hhmmToMinutes(settings.workStart) + 30;   // 출근 30분 여유
  const end = hhmmToMinutes(settings.workEnd) - 20;        // 퇴근 20분 전 마감
  const lunchStart = hhmmToMinutes(settings.lunchStart);
  const lunchEnd = hhmmToMinutes(settings.lunchEnd);
  const pool = EXERCISES.filter(e => settings.intensity === 'slight' ? true : e.visibility === 'invisible');

  const slots = [];
  let cursor = start;
  let lastCategory = null;
  let poolIdx = 0;
  const STEP = 75; // 분 간격

  while (cursor < end) {
    if (cursor >= lunchStart && cursor < lunchEnd) {
      cursor = lunchEnd + 15;
      continue;
    }
    // 직전과 카테고리 겹치지 않게 후보 탐색
    let tries = 0, ex;
    do {
      ex = pool[poolIdx % pool.length];
      poolIdx++;
      tries++;
    } while (ex.category === lastCategory && tries < pool.length);
    lastCategory = ex.category;

    slots.push({
      id: `slot_${cursor}`,
      time: minutesToHHMM(cursor),
      minutes: cursor,
      exerciseId: ex.id,
      status: 'pending',      // pending | done | skip
      skipReason: null,
    });
    cursor += STEP;
  }
  return slots;
}

function getExercise(id) { return EXERCISES.find(e => e.id === id); }

function ensureTodaySchedule() {
  const key = todayKey();
  if (!state.days[key]) {
    state.days[key] = { slots: generateSchedule(state.settings) };
    saveState();
  }
  return state.days[key];
}

/* ---------- 알림 스케줄링 ---------- */
let swRegistration = null;

function armNotificationsForToday() {
  if (!state.settings.notifyEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!swRegistration) return;

  const day = state.days[todayKey()];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  day.slots.forEach(slot => {
    if (slot.status !== 'pending') return;
    const ex = getExercise(slot.exerciseId);

    // 준비 알림 (2분 전)
    const prepMin = slot.minutes - 2;
    if (prepMin > nowMin) {
      const delay = (prepMin - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      swRegistration.active && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
          title: '2분 후 운동 시작',
          body: `${slot.time} · ${ex.name} (${ex.duration}초) 준비해주세요`,
          delay, slotId: slot.id, tag: `prep_${slot.id}`,
        },
      });
    }
    // 시작 알림
    if (slot.minutes > nowMin) {
      const delay = (slot.minutes - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
          title: `지금 시작 · ${ex.name}`,
          body: `${ex.duration}초 동안 진행해요. 탭하면 타이머가 열려요.`,
          delay, slotId: slot.id, tag: `start_${slot.id}`,
        },
      });
    }
  });
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

/* ---------- 렌더링: 오늘 화면 ---------- */
function nowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

function renderToday() {
  document.getElementById('date-line').textContent = formatDateLine();
  const day = ensureTodaySchedule();
  const list = document.getElementById('schedule-list');

  if (day.slots.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="em-title">오늘은 일정이 없어요</div>설정에서 근무시간을 확인해보세요.</div>`;
  } else {
    const nm = nowMinutes();
    list.innerHTML = day.slots.map(slot => {
      const ex = getExercise(slot.exerciseId);
      const isActive = slot.status === 'pending' && nm >= slot.minutes && nm < slot.minutes + Math.ceil(ex.duration / 60) + 10;
      let statusClass = 'pending', icon = '';
      if (slot.status === 'done') { statusClass = 'done'; icon = '✓'; }
      else if (slot.status === 'skip') { statusClass = 'skip'; icon = '–'; }
      else if (isActive) { statusClass = 'active'; icon = '●'; }
      const cardStateClass = slot.status === 'done' ? 'is-done' : slot.status === 'skip' ? 'is-skip' : '';
      return `
        <div class="slot-card ${cardStateClass}" data-slot="${slot.id}">
          <div class="slot-time">${slot.time}${isActive ? '<span class="now-dot"></span>' : ''}</div>
          <div class="slot-main">
            <div class="slot-name">${ex.name}</div>
            <div class="slot-meta">${ex.category} · ${Math.round(ex.duration / 60 * 10) / 10}분${slot.status === 'skip' && slot.skipReason ? ' · ' + SKIP_LABELS[slot.skipReason] : ''}</div>
          </div>
          <div class="slot-status ${statusClass}">${icon}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.slot-card').forEach(card => {
      card.addEventListener('click', () => openTimer(card.dataset.slot));
    });
  }

  const doneCount = day.slots.filter(s => s.status === 'done').length;
  const total = day.slots.length;
  document.getElementById('progress-count').innerHTML = `${doneCount}<span>/${total} 완료</span>`;
  document.getElementById('progress-fill').style.width = total ? `${(doneCount / total) * 100}%` : '0%';
  document.getElementById('streak-count').textContent = `${computeStreak()}일째`;
}

function computeStreak() {
  let streak = 0;
  let d = new Date();
  // 오늘 완료가 하나라도 있으면 오늘부터, 없으면 어제부터 카운트
  for (let i = 0; i < 90; i++) {
    const key = todayKey(d);
    const day = state.days[key];
    const success = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (i === 0 && !success) { d.setDate(d.getDate() - 1); continue; } // 오늘 미완이어도 어제까지 이력 유지
    if (!success) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- 타이머 화면 ---------- */
let timerState = { slotId: null, remaining: 0, total: 0, running: false, intervalId: null };

function openTimer(slotId) {
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === slotId);
  if (!slot) return;
  const ex = getExercise(slot.exerciseId);

  clearInterval(timerState.intervalId);
  timerState = { slotId, remaining: ex.duration, total: ex.duration, running: false, intervalId: null };

  document.getElementById('timer-ex-name').textContent = ex.name;
  document.getElementById('timer-ex-desc').textContent = ex.desc;
  document.getElementById('dial-progress').style.strokeDasharray = `${DIAL_CIRC}`;
  document.getElementById('dial-progress').style.strokeDashoffset = `0`;
  document.getElementById('dial-sub').textContent = 'TAP START';
  updateDialTime();
  document.getElementById('timer-toggle').textContent = '시작';
  document.getElementById('timer-screen').classList.remove('hidden');
}

function updateDialTime() {
  const m = Math.floor(timerState.remaining / 60), s = timerState.remaining % 60;
  document.getElementById('dial-time').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const progress = 1 - timerState.remaining / timerState.total;
  document.getElementById('dial-progress').style.strokeDashoffset = `${DIAL_CIRC * (1 - progress)}`;
}

function toggleTimer() {
  if (timerState.remaining <= 0) return;
  timerState.running = !timerState.running;
  document.getElementById('timer-toggle').textContent = timerState.running ? '일시정지' : '계속하기';
  document.getElementById('dial-sub').textContent = timerState.running ? '진행 중' : '일시정지됨';

  if (timerState.running) {
    timerState.intervalId = setInterval(() => {
      timerState.remaining -= 1;
      updateDialTime();
      if (timerState.remaining <= 0) {
        clearInterval(timerState.intervalId);
        completeCurrentSlot();
      }
    }, 1000);
  } else {
    clearInterval(timerState.intervalId);
  }
}

function completeCurrentSlot() {
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'done'; slot.skipReason = null; }
  saveState();
  document.getElementById('dial-sub').textContent = '완료!';
  document.getElementById('timer-toggle').textContent = '완료됨';
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  showToast(`완료! 오늘 ${day.slots.filter(s => s.status === 'done').length}/${day.slots.length}`);
  setTimeout(() => { closeTimer(); renderToday(); }, 900);
}

function closeTimer() {
  clearInterval(timerState.intervalId);
  document.getElementById('timer-screen').classList.add('hidden');
  renderToday();
}

function openSkipSheet() {
  document.getElementById('skip-sheet').classList.remove('hidden');
}
function closeSkipSheet() {
  document.getElementById('skip-sheet').classList.add('hidden');
}
function applySkip(reason) {
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'skip'; slot.skipReason = reason; }
  saveState();
  closeSkipSheet();
  closeTimer();
  showToast('다음 운동에서 다시 만나요');
}

/* ---------- 리포트 화면 ---------- */
function renderReport() {
  const today = new Date();
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    days7.push({ key: todayKey(d), date: d });
  }
  document.getElementById('report-week-line').textContent =
    `${formatShort(days7[0].date)} – ${formatShort(days7[6].date)}`;

  let totalDone = 0, totalSlots = 0;
  const timeBucket = {}; // slot time -> {done,total}

  days7.forEach(({ key }) => {
    const d = state.days[key];
    if (!d) return;
    d.slots.forEach(s => {
      totalSlots++;
      if (s.status === 'done') totalDone++;
      if (!timeBucket[s.time]) timeBucket[s.time] = { done: 0, total: 0 };
      timeBucket[s.time].total++;
      if (s.status === 'done') timeBucket[s.time].done++;
    });
  });

  const rate = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0;
  document.getElementById('stat-rate').textContent = `${rate}%`;
  document.getElementById('stat-total').textContent = `${totalDone}회`;

  // 최고 연속 기록 (최근 90일 중)
  let best = 0, cur = 0;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day = state.days[todayKey(d)];
    const success = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (success) { cur++; best = Math.max(best, cur); } else { cur = 0; }
  }
  document.getElementById('stat-streak').textContent = `${best}일`;

  let bestTime = '-', bestRate = -1;
  Object.entries(timeBucket).forEach(([time, v]) => {
    const r = v.done / v.total;
    if (r > bestRate) { bestRate = r; bestTime = time; }
  });
  document.getElementById('stat-best-time').textContent = bestTime;

  // 요일별 바 차트
  const chart = document.getElementById('week-chart');
  chart.innerHTML = days7.map(({ key, date }) => {
    const d = state.days[key];
    const r = d && d.slots.length ? (d.slots.filter(s => s.status === 'done').length / d.slots.length) : 0;
    const isToday = key === todayKey();
    return `
      <div class="week-bar-wrap">
        <div class="week-bar ${isToday ? 'today' : ''}" style="height:${Math.max(4, r * 100)}%"></div>
        <div class="week-bar-label">${WEEKDAY_KR[date.getDay()]}</div>
      </div>`;
  }).join('');

  const insight = document.getElementById('insight-card');
  if (totalSlots === 0) {
    insight.innerHTML = '아직 기록이 없어요. 오늘 첫 운동부터 시작해볼까요?';
  } else if (rate >= 80) {
    insight.innerHTML = `이번 주 실행률 <b>${rate}%</b> — 정말 꾸준하시네요. 특히 <b>${bestTime}</b> 시간대에 가장 잘 지키고 계세요.`;
  } else if (rate >= 40) {
    insight.innerHTML = `이번 주 실행률 <b>${rate}%</b>. <b>${bestTime}</b> 시간대는 잘 지키고 계시니, 그 리듬을 다른 시간대에도 적용해보세요.`;
  } else {
    insight.innerHTML = `이번 주는 실행이 뜸했어요. 알림 강도를 높이거나, 설정에서 운동 간격을 조정해보는 건 어떨까요?`;
  }
}
function formatShort(d) { return `${d.getMonth() + 1}.${d.getDate()}`; }

/* ---------- 설정 화면 ---------- */
function renderIntensityOptions(containerId, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = INTENSITY_LEVELS.map(lv => `
    <div class="intensity-opt ${state.settings && state.settings.intensity === lv.value ? 'selected' : ''}" data-value="${lv.value}">
      <div class="opt-title">${lv.title}</div>
      <div class="opt-desc">${lv.desc}</div>
    </div>`).join('');
  el.querySelectorAll('.intensity-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.intensity-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      onSelect(opt.dataset.value);
    });
  });
}

function renderSettings() {
  document.getElementById('setting-work-start').value = state.settings.workStart;
  document.getElementById('setting-work-end').value = state.settings.workEnd;
  document.getElementById('setting-lunch-start').value = state.settings.lunchStart;
  document.getElementById('setting-lunch-end').value = state.settings.lunchEnd;
  document.getElementById('toggle-notify').classList.toggle('on', state.settings.notifyEnabled);
  renderIntensityOptions('intensity-options', (val) => { state.settings.intensity = val; saveState(); });
}

/* ---------- 토스트 ---------- */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- 탭 전환 ---------- */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('view-today').classList.toggle('hidden', tab !== 'today');
  document.getElementById('view-report').classList.toggle('hidden', tab !== 'report');
  document.getElementById('view-settings').classList.toggle('hidden', tab !== 'settings');
  if (tab === 'report') renderReport();
  if (tab === 'settings') renderSettings();
  if (tab === 'today') renderToday();
}

/* ---------- 온보딩 ---------- */
function initOnboarding() {
  let selectedIntensity = 'invisible';
  renderIntensityOptions.call(null); // no-op guard
  const el = document.getElementById('ob-intensity-options');
  el.innerHTML = INTENSITY_LEVELS.map((lv, i) => `
    <div class="intensity-opt ${i === 0 ? 'selected' : ''}" data-value="${lv.value}">
      <div class="opt-title">${lv.title}</div>
      <div class="opt-desc">${lv.desc}</div>
    </div>`).join('');
  el.querySelectorAll('.intensity-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.intensity-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedIntensity = opt.dataset.value;
    });
  });

  document.getElementById('ob-start-btn').addEventListener('click', async () => {
    state.settings = {
      workStart: document.getElementById('ob-work-start').value || '09:00',
      workEnd: document.getElementById('ob-work-end').value || '18:00',
      lunchStart: document.getElementById('ob-lunch-start').value || '12:00',
      lunchEnd: document.getElementById('ob-lunch-end').value || '13:00',
      intensity: selectedIntensity,
      notifyEnabled: true,
    };
    state.onboarded = true;
    state.days = {}; // 새 설정으로 초기화
    saveState();

    await requestNotificationPermission();
    document.getElementById('onboard-screen').classList.add('hidden');
    boot();
  });
}

/* ---------- 이벤트 바인딩 ---------- */
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.getElementById('timer-close').addEventListener('click', closeTimer);
  document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('timer-skip').addEventListener('click', openSkipSheet);
  document.querySelectorAll('.sheet-opt').forEach(o => o.addEventListener('click', () => applySkip(o.dataset.reason)));
  document.getElementById('skip-sheet').addEventListener('click', (e) => { if (e.target.id === 'skip-sheet') closeSkipSheet(); });

  document.getElementById('setting-work-start').addEventListener('change', (e) => { state.settings.workStart = e.target.value; saveState(); });
  document.getElementById('setting-work-end').addEventListener('change', (e) => { state.settings.workEnd = e.target.value; saveState(); });
  document.getElementById('setting-lunch-start').addEventListener('change', (e) => { state.settings.lunchStart = e.target.value; saveState(); });
  document.getElementById('setting-lunch-end').addEventListener('change', (e) => { state.settings.lunchEnd = e.target.value; saveState(); });
  document.getElementById('toggle-notify').addEventListener('click', async (e) => {
    const willEnable = !state.settings.notifyEnabled;
    if (willEnable) {
      const ok = await requestNotificationPermission();
      if (!ok) { showToast('알림 권한이 필요해요'); return; }
    }
    state.settings.notifyEnabled = willEnable;
    saveState();
    e.currentTarget.classList.toggle('on', willEnable);
    if (willEnable) armNotificationsForToday();
  });
  document.getElementById('regenerate-btn').addEventListener('click', () => {
    state.days[todayKey()] = { slots: generateSchedule(state.settings) };
    saveState();
    armNotificationsForToday();
    showToast('오늘 일정을 새로 만들었어요');
    switchTab('today');
  });
}

/* ---------- 부팅 ---------- */
async function boot() {
  if (!state.onboarded || !state.settings) {
    document.getElementById('onboard-screen').classList.remove('hidden');
    initOnboarding();
    return;
  }
  ensureTodaySchedule();
  renderToday();
  switchTab('today');
  armNotificationsForToday();
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('sw.js');
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OPEN_TIMER' && event.data.slotId) {
        openTimer(event.data.slotId);
      }
    });
  } catch (e) { console.warn('SW 등록 실패', e); }
}

window.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  await registerSW();
  boot();
  // 앱이 열려있는 동안 1분마다 화면 갱신 (진행중 표시 등)
  setInterval(() => { if (!document.getElementById('view-today').classList.contains('hidden')) renderToday(); }, 60000);
});
