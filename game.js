// =============================================================
//  СПОР С ИИ — game.js
// =============================================================

// ── Состояние игры ──────────────────────────────────────────
const S = {
  mode:      'classic',
  topic:     '',
  playerPos: 'ЗА',
  aiPos:     'ПРОТИВ',
  round:     0,
  maxRounds: 3,
  history:   [],
  rating:    +localStorage.getItem('deb_r') || 1000,
  wins:      +localStorage.getItem('deb_w') || 0,
  apiKey:    localStorage.getItem('deb_k')  || '',
};

// ── Темы по режимам ─────────────────────────────────────────
const TOPICS = {
  classic: [
    "Нужно ли жить на Марсе?",
    "Стоит ли отменить деньги?",
    "Нужна ли работа 4 дня в неделю?",
    "Школьная форма — хорошая идея?",
    "Стоит ли ввести базовый доход?",
    "Нужно ли ограничить соцсети?",
    "Лучше работать из дома?",
    "Нужно ли запретить фастфуд?",
    "Стоит ли отменить экзамены?",
    "Нужно ли обязательное голосование?",
    "Запретить авто в городах?",
    "Город лучше деревни?",
  ],
  absurd: [
    "Коты должны управлять миром",
    "Пицца с ананасами — норма",
    "Нужно ли отменить понедельники?",
    "Стоит ли запретить будильники?",
    "Пауки — лучшие питомцы",
    "Сон — трата времени",
    "Носки под сандалии — стиль",
    "Зима лучше лета",
    "Математика — это заговор",
    "Овощи вкуснее конфет",
    "Лифты должны играть метал",
    "Все должны есть руками",
  ],
  provocateur: [
    "ИИ умнее людей",
    "Соцсети разрушают общество",
    "Люди ленивы по природе",
    "Школа бесполезна",
    "Деньги не приносят счастья",
    "Видеоигры — трата времени",
    "Спорт важнее науки",
    "Животные умнее людей",
  ],
  devil: [
    "Сон вреден для здоровья",
    "Книги устарели",
    "Законы ограничивают прогресс",
    "Вежливость — слабость",
    "Дружба — иллюзия",
    "Музыка мешает думать",
    "Природа переоценена",
    "Образование делает несчастными",
  ],
};

// ── API-ключ ─────────────────────────────────────────────────
function saveApiKey() {
  const v = document.getElementById('apiKeyInput').value.trim();
  if (!v.startsWith('sk-')) {
    alert('Ключ должен начинаться с sk-ant-...');
    return;
  }
  S.apiKey = v;
  localStorage.setItem('deb_k', v);
  document.getElementById('apiSaved').style.display = 'block';
  setTimeout(() => {
    document.getElementById('apiSetup').style.display = 'none';
  }, 1500);
}

function checkKey() {
  if (!S.apiKey) document.getElementById('apiSetup').style.display = 'block';
}

// ── Темы ─────────────────────────────────────────────────────
function randomTopics() {
  const arr = [...TOPICS[S.mode]].sort(() => Math.random() - 0.5).slice(0, 6);
  document.getElementById('topicGrid').innerHTML = arr
    .map(t => `<button class="topic-btn" onclick="startGame(this.dataset.t)" data-t="${t.replace(/"/g, '&quot;')}">${t}</button>`)
    .join('');
}

// ── Навигация по экранам ─────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectMode(mode) {
  S.mode = mode;
  const labels = {
    classic:     'Классика',
    absurd:      'Абсурд',
    provocateur: 'Провокатор',
    devil:       'Адвокат дьявола',
  };
  document.getElementById('modeLabel').textContent = labels[mode];
  randomTopics();
  showScreen('topicScreen');
}

function startWithCustom() {
  const v = document.getElementById('customTopic').value.trim();
  if (v) startGame(v);
}

function startGame(topic) {
  if (!S.apiKey) {
    checkKey();
    document.getElementById('apiSetup').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  S.topic   = topic;
  S.round   = 0;
  S.history = [];

  [S.playerPos, S.aiPos] = Math.random() > 0.5
    ? ['ЗА', 'ПРОТИВ']
    : ['ПРОТИВ', 'ЗА'];

  document.getElementById('gameTopicDisplay').textContent = topic;
  document.getElementById('playerPosLabel').textContent   = S.playerPos;
  document.getElementById('aiPosLabel').textContent       = S.aiPos;
  document.getElementById('roundNum').textContent         = '0';
  document.getElementById('chatArea').innerHTML           = '';

  addSys(`📋 Тема: «${topic}»\nТы: ${S.playerPos} | ИИ: ${S.aiPos}\nНапиши первый аргумент!`);
  setInput(true);
  document.getElementById('errorBox').style.display  = 'none';
  document.getElementById('inputHint').textContent   = 'Напиши аргумент → Enter (3 раунда)';
  showScreen('gameScreen');
}

// ── Чат ──────────────────────────────────────────────────────
function addMsg(role, text) {
  const c = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = `message ${role}`;
  d.innerHTML = `<div class="msg-label">${role === 'player' ? 'Ты' : '🤖 ИИ'}</div>
                 <div class="msg-bubble">${esc(text)}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function addSys(text) {
  const c = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = 'message system';
  d.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  const c = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.id = 'typing';
  d.className = 'message ai';
  d.innerHTML = `<div class="msg-label">🤖 ИИ</div>
                 <div class="msg-bubble">
                   <div class="typing-dots"><span></span><span></span><span></span></div>
                 </div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function hideTyping() {
  const e = document.getElementById('typing');
  if (e) e.remove();
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setInput(on) {
  document.getElementById('argInput').disabled = !on;
  document.getElementById('sendBtn').disabled  = !on;
  if (on) document.getElementById('argInput').focus();
}

function showErr(msg) {
  const b = document.getElementById('errorBox');
  b.innerHTML    = `⚠️ ${msg}`;
  b.style.display = 'block';
}

// ── Отправка аргумента ───────────────────────────────────────
async function sendArgument() {
  const ta   = document.getElementById('argInput');
  const text = ta.value.trim();
  if (!text || S.round >= S.maxRounds) return;

  S.round++;
  document.getElementById('roundNum').textContent = S.round;
  setInput(false);
  ta.value          = '';
  ta.style.height   = 'auto';
  document.getElementById('errorBox').style.display = 'none';

  addMsg('player', text);
  S.history.push({ role: 'player', text });
  showTyping();

  try {
    const reply = await claude(debateSystem(), text, 350);
    hideTyping();

    // Проверяем досрочную сдачу ИИ
    if (checkSurrender(reply)) {
      const cleanReply = reply.replace(/^СДАЮСЬ:\s*/i, '🏳️ ИИ сдаётся: ');
      addMsg('ai', cleanReply);
      S.history.push({ role: 'ai', text: reply });
      addSys('🏳️ ИИ признал поражение досрочно!');
      setInput(false);
      showResult({
        winner:      'player',
        playerScore: 80,
        aiScore:     20,
        reason:      'ИИ не смог ответить на твои аргументы и сдался досрочно! Отличная работа! 🏆',
      });
      return;
    }

    addMsg('ai', reply);
    S.history.push({ role: 'ai', text: reply });

    if (S.round >= S.maxRounds) {
      document.getElementById('inputHint').textContent = '⏳ Судья оценивает...';
      showTyping();
      const v = await judgeVerdict();
      hideTyping();
      showResult(v);
    } else {
      setInput(true);
      document.getElementById('inputHint').textContent = `Раунд ${S.round}/${S.maxRounds} — твой ход`;
    }

  } catch (e) {
    hideTyping();
    S.round--;
    document.getElementById('roundNum').textContent = S.round;
    setInput(true);
    showErr(e.message);
  }
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendArgument();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Промпты Claude ───────────────────────────────────────────
function modePrompt() {
  return {
    classic:
      'Ты — дебатёр средней силы. Ты защищаешь свою позицию, но ЧЕСТНО признаёшь ' +
      'сильные аргументы оппонента фразами вроде "Это хороший аргумент, но..." или ' +
      '"Согласен отчасти, однако...". Не будь непобедимым роботом, будь живым собеседником.',

    absurd:
      'Ты — дебатёр в абсурдном споре. Используй смешные аргументы. Иногда теряйся ' +
      'и говори что-то вроде "Хм, это меня немного убедило, но всё же...". ' +
      'Будь несовершенным и смешным.',

    provocateur:
      'Ты — провокатор, но не непобедимый. Агрессивно критикуй аргументы, но если ' +
      'оппонент сказал что-то действительно умное — говори "Ладно, это... неплохо. ' +
      'Но я всё равно считаю..."',

    devil:
      'Ты — адвокат дьявола. Защищай абсурдную позицию, но иногда "случайно" ' +
      'проговаривайся, что твоя позиция слабая, потом спохватывайся.',
  }[S.mode];
}

function debateSystem() {
  const hist = S.history
    .slice(-4)
    .map(h => `${h.role === 'player' ? 'Оппонент' : 'Ты'}: ${h.text}`)
    .join('\n');

  const isLastRound = S.round >= S.maxRounds - 1;
  const surrenderNote = isLastRound
    ? '\n\nВАЖНО: Это последний раунд. Если аргументы оппонента были в целом сильнее — ' +
      'начни ответ с "СДАЮСЬ:" и признай поражение. Иначе отвечай как обычно.'
    : '';

  return (
    `${modePrompt()}\n\n` +
    `Тема: «${S.topic}»\n` +
    `Твоя позиция: ${S.aiPos}\n` +
    `Позиция оппонента: ${S.playerPos}\n\n` +
    `История спора:\n${hist}\n\n` +
    `Напиши ТОЛЬКО один ответ (2-4 предложения). Без markdown. ` +
    `Ты НЕ всесильный — ты можешь проигрывать.${surrenderNote}`
  );
}

// ── Запрос к Claude API ──────────────────────────────────────
async function claude(system, userMsg, maxTokens = 400) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       S.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!resp.ok) {
    let msg = `Ошибка ${resp.status}`;
    try { const d = await resp.json(); msg = d?.error?.message || msg; } catch {}
    if (resp.status === 401) msg = 'Неверный API ключ. Обнови его выше.';
    if (resp.status === 429) msg = 'Превышен лимит запросов. Подожди минуту.';
    if (resp.status === 403) msg = 'Доступ запрещён. Проверь ключ.';
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || '...';
}

// ── Сдача ИИ ─────────────────────────────────────────────────
function checkSurrender(text) {
  return text.trim().startsWith('СДАЮСЬ:');
}

// ── Вердикт судьи ────────────────────────────────────────────
async function judgeVerdict() {
  const debate = S.history
    .map((h, i) =>
      `${h.role === 'player' ? 'Игрок' : 'ИИ'} (${i % 2 === 0 ? S.playerPos : S.aiPos}): ${h.text}`)
    .join('\n\n');

  // Проверяем последнее сообщение ИИ на сдачу
  const lastAi = [...S.history].reverse().find(h => h.role === 'ai');
  if (lastAi && checkSurrender(lastAi.text)) {
    return {
      winner:      'player',
      playerScore: 75,
      aiScore:     25,
      reason:      'ИИ признал поражение — твои аргументы были слишком убедительными! 🏳️',
    };
  }

  const raw = await claude(
    `Ты — СТРОГО беспристрастный судья дебатов.\n\n` +
    `ПРАВИЛА:\n` +
    `- Оценивай ТОЛЬКО логику, убедительность и конкретность аргументов.\n` +
    `- При примерно равных аргументах отдавай победу игроку.\n` +
    `- Верни ТОЛЬКО JSON без markdown:\n` +
    `{"winner":"player","playerScore":60,"aiScore":40,"reason":"Причина."}\n` +
    `winner = "player" | "ai" | "draw"`,
    `Тема: «${S.topic}»\nИгрок: ${S.playerPos}\nИИ: ${S.aiPos}\n\n${debate}`,
    300
  );

  try {
    const parsed = JSON.parse(raw.replace(/```json?|```/g, '').trim());
    // При равном счёте — победа игроку
    if (Math.abs((parsed.playerScore || 50) - (parsed.aiScore || 50)) <= 5) {
      parsed.winner      = 'player';
      parsed.playerScore = Math.max(parsed.playerScore || 50, 52);
      parsed.aiScore     = Math.min(parsed.aiScore     || 50, 48);
      parsed.reason      = (parsed.reason || '') + ' При равном счёте победа присуждается игроку.';
    }
    return parsed;
  } catch {
    return {
      winner:      'player',
      playerScore: 55,
      aiScore:     45,
      reason:      'Спор был близким, но твои аргументы чуть убедительнее.',
    };
  }
}

// ── Показ результата ─────────────────────────────────────────
function showResult(v) {
  const { winner, playerScore = 50, aiScore = 50, reason = '' } = v;
  const card = document.getElementById('resultCard');
  card.className = 'result-card';

  if (winner === 'player') {
    card.classList.add('win');
    document.getElementById('resultEmoji').textContent = '🏆';
    document.getElementById('resultTitle').textContent = 'ПОБЕДА!';
    S.rating += 30;
    S.wins++;
  } else if (winner === 'ai') {
    card.classList.add('lose');
    document.getElementById('resultEmoji').textContent = '💀';
    document.getElementById('resultTitle').textContent = 'ПОРАЖЕНИЕ';
    S.rating = Math.max(800, S.rating - 20);
  } else {
    card.classList.add('draw');
    document.getElementById('resultEmoji').textContent = '🤝';
    document.getElementById('resultTitle').textContent = 'НИЧЬЯ';
    S.rating += 5;
  }

  document.getElementById('resultReason').textContent = reason;
  localStorage.setItem('deb_r', S.rating);
  localStorage.setItem('deb_w', S.wins);
  document.getElementById('ratingDisplay').textContent = S.rating;
  document.getElementById('winsDisplay').textContent   = S.wins;

  showScreen('resultScreen');

  setTimeout(() => {
    document.getElementById('playerBar').style.width       = playerScore + '%';
    document.getElementById('aiBar').style.width           = aiScore + '%';
    document.getElementById('playerScore').textContent     = playerScore + '%';
    document.getElementById('aiScore').textContent         = aiScore + '%';
  }, 300);
}

function playAgain() {
  showScreen('menuScreen');
}

function copyResult() {
  const t =
    `🎯 СПОР С ИИ\n\n` +
    `Тема: «${S.topic}»\n` +
    `Результат: ${document.getElementById('resultTitle').textContent}\n` +
    `Ты: ${document.getElementById('playerScore').textContent} | ` +
    `ИИ: ${document.getElementById('aiScore').textContent}\n\n` +
    `${document.getElementById('resultReason').textContent}\n\n` +
    `#СпорСИИ`;

  navigator.clipboard?.writeText(t).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => btn.textContent = '📋 Скопировать результат', 2000);
  });
}

// ── Инициализация ─────────────────────────────────────────────
document.getElementById('ratingDisplay').textContent = S.rating;
document.getElementById('winsDisplay').textContent   = S.wins;
checkKey();
