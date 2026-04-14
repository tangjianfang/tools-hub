// ── THEME ──────────────────────────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = document.getElementById('theme-btn');

(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  html.dataset.theme = saved;
  themeBtn.textContent = saved === 'light' ? '🌙' : '☀️';
})();

themeBtn.addEventListener('click', () => {
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  themeBtn.textContent = next === 'light' ? '🌙' : '☀️';
  localStorage.setItem('theme', next);
});

// ── TOOLS DATA ─────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'clock',      name: '实时时钟',      emoji: '🕐', cat: 'time', desc: '显示当前时间、日期与星期' },
  { id: 'stopwatch',  name: '秒表',          emoji: '⏱️', cat: 'time', desc: '精确计时，支持多次计次记录' },
  { id: 'countdown',  name: '倒计时',        emoji: '⏳', cat: 'time', desc: '自定义秒数倒计时器' },
  { id: 'age',        name: '年龄计算',      emoji: '📅', cat: 'time', desc: '根据生日精确计算年龄' },
  { id: 'wordcount',  name: '字数统计',      emoji: '📝', cat: 'text', desc: '统计字符数、词数、行数' },
  { id: 'caseconv',   name: '大小写转换',    emoji: '🔤', cat: 'text', desc: '多种文字格式快速转换' },
  { id: 'base64',     name: 'Base64 编解码', emoji: '🔐', cat: 'text', desc: '文本的 Base64 编码与解码' },
  { id: 'urlencode',  name: 'URL 编解码',    emoji: '🔗', cat: 'text', desc: 'URL 的编码与解码' },
  { id: 'calculator', name: '计算器',        emoji: '🧮', cat: 'calc', desc: '支持加减乘除的全功能计算器' },
  { id: 'unitconv',   name: '单位换算',      emoji: '📐', cat: 'calc', desc: '长度、重量、温度、面积换算' },
  { id: 'bmi',        name: 'BMI 计算',      emoji: '⚖️', cat: 'calc', desc: '计算身体质量指数 (BMI)' },
  { id: 'random',     name: '随机数生成',    emoji: '🎲', cat: 'calc', desc: '指定范围内批量生成随机数' },
  { id: 'colorpicker',name: '颜色选择器',    emoji: '🎨', cat: 'dev',  desc: '选取颜色，获取 HEX/RGB/HSL' },
  { id: 'password',   name: '密码生成器',    emoji: '🔑', cat: 'dev',  desc: '生成高强度随机密码' },
  { id: 'jsonformat', name: 'JSON 格式化',   emoji: '📋', cat: 'dev',  desc: '格式化、压缩与校验 JSON' },
  { id: 'qrcode',     name: '二维码生成',    emoji: '📱', cat: 'life', desc: '将文字或链接生成二维码' },
];

const CAT_LABELS = {
  all: '全部', time: '⏰ 时间', text: '📝 文本',
  calc: '🧮 计算', dev: '💻 开发', life: '🌟 生活'
};

// ── STATE ──────────────────────────────────────────────────────────────────
let activeCat = 'all';
let searchQuery = '';
let toolTimers = {};
let calcState = { expr: '', val: '0', newNum: true };

// ── RENDER GRID ─────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const q = searchQuery.toLowerCase();

  const filtered = TOOLS.filter(t => {
    const matchCat = activeCat === 'all' || t.cat === activeCat;
    const matchQ = !q || t.name.includes(q) || t.desc.includes(q) || t.id.includes(q);
    return matchCat && matchQ;
  });

  document.getElementById('count-all').textContent = TOOLS.length;

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = filtered.map(t => `
    <div class="tool-card" data-id="${t.id}" title="${t.desc}">
      <span class="tool-emoji">${t.emoji}</span>
      <div class="tool-name">${t.name}</div>
      <div class="tool-desc">${t.desc}</div>
      <span class="tool-cat">${CAT_LABELS[t.cat]}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.tool-card').forEach(card =>
    card.addEventListener('click', () => openTool(card.dataset.id))
  );
}

// ── TABS ───────────────────────────────────────────────────────────────────
document.getElementById('tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeCat = tab.dataset.cat;
  renderGrid();
});

// ── SEARCH ─────────────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value;
  renderGrid();
});

// ── MODAL ──────────────────────────────────────────────────────────────────
const overlay = document.getElementById('overlay');

function openTool(id) {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) return;
  document.getElementById('modal-title').textContent = `${tool.emoji} ${tool.name}`;
  document.getElementById('modal-body').innerHTML = getToolContent(id);
  overlay.classList.add('open');
  initTool(id);
}

function closeTool() {
  overlay.classList.remove('open');
  Object.values(toolTimers).forEach(clearInterval);
  toolTimers = {};
}

document.getElementById('close-btn').addEventListener('click', closeTool);
overlay.addEventListener('click', e => { if (e.target === overlay) closeTool(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTool(); });

// ── TOAST ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.textContent.trim();
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text)
    .then(() => showToast('✅ 已复制到剪贴板！'))
    .catch(() => {
      const ta = Object.assign(document.createElement('textarea'), {
        value: text, style: 'position:fixed;opacity:0'
      });
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('✅ 已复制！'); } catch {}
      document.body.removeChild(ta);
    });
}

// ── TOOL CONTENT ────────────────────────────────────────────────────────────
function getToolContent(id) {
  switch (id) {
    case 'clock': return `
      <div class="clock-display">
        <div class="clock-time" id="clock-time">--:--:--</div>
        <div class="clock-date" id="clock-date"></div>
      </div>`;

    case 'stopwatch': return `
      <div class="sw-display" id="sw-display">00:00.00</div>
      <div class="btn-row" style="justify-content:center;margin-bottom:16px">
        <button class="btn btn-primary" id="sw-start">▶ 开始</button>
        <button class="btn btn-secondary" id="sw-lap">📌 计次</button>
        <button class="btn btn-secondary" id="sw-reset">↺ 重置</button>
      </div>
      <div class="sw-laps" id="sw-laps"></div>`;

    case 'countdown': return `
      <div class="tool-row">
        <div class="tool-label">设置时长（秒，最大 86400）</div>
        <input class="tool-input" type="number" id="cd-input" value="60" min="1" max="86400">
      </div>
      <div class="btn-row" style="margin-bottom:16px">
        <button class="btn btn-primary" id="cd-start">▶ 开始</button>
        <button class="btn btn-secondary" id="cd-reset">↺ 重置</button>
      </div>
      <div class="clock-display">
        <div class="clock-time" id="cd-display">01:00</div>
        <div class="clock-date" id="cd-status">准备就绪</div>
      </div>`;

    case 'age': return `
      <div class="tool-row">
        <div class="tool-label">出生日期</div>
        <input class="tool-input" type="date" id="age-input">
      </div>
      <div class="result-box" id="age-result" style="white-space:pre-line;min-height:80px">请选择出生日期</div>`;

    case 'wordcount': return `
      <div class="tool-row">
        <textarea class="tool-textarea" id="wc-input" placeholder="在此粘贴或输入文本..." style="min-height:140px"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="result-box result-highlight">
          <div style="font-size:.7rem;color:var(--text-muted);font-weight:400">字符数</div>
          <div id="wc-chars">0</div>
        </div>
        <div class="result-box result-highlight">
          <div style="font-size:.7rem;color:var(--text-muted);font-weight:400">词 / 词组</div>
          <div id="wc-words">0</div>
        </div>
        <div class="result-box result-highlight">
          <div style="font-size:.7rem;color:var(--text-muted);font-weight:400">行数</div>
          <div id="wc-lines">0</div>
        </div>
      </div>`;

    case 'caseconv': return `
      <div class="tool-row">
        <textarea class="tool-textarea" id="cc-input" placeholder="输入文本..."></textarea>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <button class="btn btn-secondary" onclick="ccConvert('upper')">大写</button>
        <button class="btn btn-secondary" onclick="ccConvert('lower')">小写</button>
        <button class="btn btn-secondary" onclick="ccConvert('title')">首字母大写</button>
        <button class="btn btn-secondary" onclick="ccConvert('camel')">camelCase</button>
        <button class="btn btn-secondary" onclick="ccConvert('snake')">snake_case</button>
        <button class="btn btn-secondary" onclick="ccConvert('kebab')">kebab-case</button>
      </div>
      <div class="tool-label">转换结果</div>
      <div class="result-box" id="cc-output">—</div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="copyText('cc-output')">📋 复制</button>`;

    case 'base64': return `
      <div class="tool-row">
        <textarea class="tool-textarea" id="b64-input" placeholder="输入文本或 Base64 字符串..."></textarea>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <button class="btn btn-primary" onclick="b64Convert('encode')">🔒 编码</button>
        <button class="btn btn-secondary" onclick="b64Convert('decode')">🔓 解码</button>
      </div>
      <div class="tool-label">结果</div>
      <div class="result-box" id="b64-output">—</div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="copyText('b64-output')">📋 复制</button>`;

    case 'urlencode': return `
      <div class="tool-row">
        <textarea class="tool-textarea" id="url-input" placeholder="输入 URL 或文本..."></textarea>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <button class="btn btn-primary" onclick="urlConvert('encode')">🔒 编码</button>
        <button class="btn btn-secondary" onclick="urlConvert('decode')">🔓 解码</button>
      </div>
      <div class="tool-label">结果</div>
      <div class="result-box" id="url-output">—</div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="copyText('url-output')">📋 复制</button>`;

    case 'calculator': return `
      <div class="calc-display">
        <div class="calc-expr" id="calc-expr">&nbsp;</div>
        <div class="calc-val" id="calc-val">0</div>
      </div>
      <div class="calc-grid">
        <button class="calc-btn clr" onclick="calcPress('C')">C</button>
        <button class="calc-btn op"  onclick="calcPress('±')">±</button>
        <button class="calc-btn op"  onclick="calcPress('%')">%</button>
        <button class="calc-btn op"  onclick="calcPress('÷')">÷</button>
        <button class="calc-btn"     onclick="calcPress('7')">7</button>
        <button class="calc-btn"     onclick="calcPress('8')">8</button>
        <button class="calc-btn"     onclick="calcPress('9')">9</button>
        <button class="calc-btn op"  onclick="calcPress('×')">×</button>
        <button class="calc-btn"     onclick="calcPress('4')">4</button>
        <button class="calc-btn"     onclick="calcPress('5')">5</button>
        <button class="calc-btn"     onclick="calcPress('6')">6</button>
        <button class="calc-btn op"  onclick="calcPress('−')">−</button>
        <button class="calc-btn"     onclick="calcPress('1')">1</button>
        <button class="calc-btn"     onclick="calcPress('2')">2</button>
        <button class="calc-btn"     onclick="calcPress('3')">3</button>
        <button class="calc-btn op"  onclick="calcPress('+')">+</button>
        <button class="calc-btn"     onclick="calcPress('0')" style="grid-column:span 2">0</button>
        <button class="calc-btn"     onclick="calcPress('.')">.</button>
        <button class="calc-btn eq"  onclick="calcPress('=')">=</button>
      </div>`;

    case 'unitconv': return `
      <div class="tool-row">
        <div class="tool-label">换算类型</div>
        <select class="tool-select" id="uc-type" onchange="ucRender()">
          <option value="length">📏 长度</option>
          <option value="weight">⚖️ 重量</option>
          <option value="temp">🌡️ 温度</option>
          <option value="area">📐 面积</option>
        </select>
      </div>
      <div id="uc-body"></div>`;

    case 'bmi': return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="tool-row">
        <div>
          <div class="tool-label">身高 (cm)</div>
          <input class="tool-input" type="number" id="bmi-h" placeholder="例: 175" min="50" max="250">
        </div>
        <div>
          <div class="tool-label">体重 (kg)</div>
          <input class="tool-input" type="number" id="bmi-w" placeholder="例: 70" min="10" max="500">
        </div>
      </div>
      <button class="btn btn-primary" onclick="calcBMI()">📊 计算 BMI</button>
      <div id="bmi-result" style="margin-top:16px"></div>`;

    case 'random': return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="tool-row">
        <div>
          <div class="tool-label">最小值</div>
          <input class="tool-input" type="number" id="rnd-min" value="1">
        </div>
        <div>
          <div class="tool-label">最大值</div>
          <input class="tool-input" type="number" id="rnd-max" value="100">
        </div>
      </div>
      <div class="tool-row">
        <div class="tool-label">生成数量（最多 50）</div>
        <input class="tool-input" type="number" id="rnd-count" value="1" min="1" max="50">
      </div>
      <button class="btn btn-primary" onclick="genRandom()">🎲 生成</button>
      <div class="result-box result-highlight" id="rnd-result" style="margin-top:14px;font-size:1rem;letter-spacing:1px">—</div>
      <button class="btn btn-secondary" style="margin-top:10px" onclick="copyText('rnd-result')">📋 复制</button>`;

    case 'colorpicker': return `
      <div class="tool-row">
        <input type="color" id="cp-input" value="#6C63FF"
          style="width:100%;height:56px;border:none;border-radius:10px;cursor:pointer;background:none;padding:0">
      </div>
      <div class="color-preview" id="cp-preview"></div>
      <div class="color-values">
        <div class="color-val-item" onclick="copyText('cp-hex')" title="点击复制">
          <div class="color-val-label">HEX</div>
          <div class="color-val-text" id="cp-hex">#6C63FF</div>
        </div>
        <div class="color-val-item" onclick="copyText('cp-rgb')" title="点击复制">
          <div class="color-val-label">RGB</div>
          <div class="color-val-text" id="cp-rgb"></div>
        </div>
        <div class="color-val-item" onclick="copyText('cp-hsl')" title="点击复制">
          <div class="color-val-label">HSL</div>
          <div class="color-val-text" id="cp-hsl"></div>
        </div>
      </div>
      <p style="text-align:center;font-size:.75rem;color:var(--text-muted);margin-top:10px">点击色值可复制</p>`;

    case 'password': return `
      <div class="tool-row">
        <div class="tool-label">密码长度：<strong id="pw-len-val">16</strong> 位</div>
        <input type="range" id="pw-len" min="6" max="64" value="16" style="width:100%"
          oninput="document.getElementById('pw-len-val').textContent=this.value;genPassword()">
      </div>
      <div class="btn-row" style="margin-bottom:14px;gap:16px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="pw-upper" checked onchange="genPassword()"> 大写字母
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="pw-lower" checked onchange="genPassword()"> 小写字母
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="pw-num" checked onchange="genPassword()"> 数字
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="pw-sym" onchange="genPassword()"> 符号
        </label>
      </div>
      <div class="result-box" id="pw-result" style="font-size:0.95rem;letter-spacing:2px;min-height:52px;word-break:break-all">—</div>
      <div class="strength-bar-wrap"><div class="strength-bar" id="pw-strength-bar"></div></div>
      <div style="font-size:.78rem;color:var(--text-muted)" id="pw-strength-label">强度：—</div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn btn-primary" onclick="genPassword()">🔄 重新生成</button>
        <button class="btn btn-secondary" onclick="copyText('pw-result')">📋 复制</button>
      </div>`;

    case 'jsonformat': return `
      <div class="tool-row">
        <textarea class="tool-textarea" id="json-input" placeholder='粘贴 JSON 内容...' style="min-height:140px"></textarea>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <button class="btn btn-primary" onclick="jsonFormat()">✨ 格式化</button>
        <button class="btn btn-secondary" onclick="jsonMinify()">📦 压缩</button>
        <button class="btn btn-secondary" onclick="jsonValidate()">✅ 验证</button>
      </div>
      <div class="tool-label">结果</div>
      <div class="result-box" id="json-output" style="min-height:140px">—</div>
      <button class="btn btn-primary" style="margin-top:10px" onclick="copyText('json-output')">📋 复制</button>`;

    case 'qrcode': return `
      <div class="tool-row">
        <div class="tool-label">输入文字或链接</div>
        <input class="tool-input" type="text" id="qr-input" placeholder="https://example.com">
      </div>
      <button class="btn btn-primary" onclick="genQR()">📱 生成二维码</button>
      <div class="qr-display" id="qr-display" style="margin-top:16px">
        <p style="color:var(--text-muted)">点击生成按钮后显示二维码</p>
      </div>`;

    default: return '<p style="color:var(--text-muted)">工具开发中...</p>';
  }
}

// ── TOOL INIT ───────────────────────────────────────────────────────────────
function initTool(id) {
  switch (id) {
    case 'clock':      startClock(); break;
    case 'stopwatch':  initStopwatch(); break;
    case 'countdown':  initCountdown(); break;
    case 'age':
      document.getElementById('age-input').addEventListener('input', calcAge);
      break;
    case 'wordcount':
      document.getElementById('wc-input').addEventListener('input', updateWordCount);
      break;
    case 'colorpicker':
      document.getElementById('cp-input').addEventListener('input', updateColor);
      updateColor();
      break;
    case 'password':
      genPassword();
      break;
    case 'unitconv':
      ucRender();
      break;
    case 'calculator':
      calcState = { expr: '', val: '0', newNum: true };
      break;
  }
}

// ── CLOCK ────────────────────────────────────────────────────────────────────
function startClock() {
  function tick() {
    const t = document.getElementById('clock-time');
    const d = document.getElementById('clock-date');
    if (!t) return;
    const now = new Date();
    t.textContent = now.toLocaleTimeString('zh-CN');
    d.textContent = now.toLocaleDateString('zh-CN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  tick();
  toolTimers.clock = setInterval(tick, 1000);
}

// ── STOPWATCH ────────────────────────────────────────────────────────────────
function initStopwatch() {
  let running = false, startTime = 0, elapsed = 0, lapCount = 0;
  const disp = document.getElementById('sw-display');
  const laps = document.getElementById('sw-laps');
  const startBtn = document.getElementById('sw-start');

  const fmt = ms => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };

  startBtn.addEventListener('click', () => {
    if (running) {
      clearInterval(toolTimers.sw);
      elapsed = Date.now() - startTime;
      running = false;
      startBtn.textContent = '▶ 继续';
    } else {
      startTime = Date.now() - elapsed;
      toolTimers.sw = setInterval(() => { disp.textContent = fmt(Date.now() - startTime); }, 30);
      running = true;
      startBtn.textContent = '⏸ 暂停';
    }
  });

  document.getElementById('sw-lap').addEventListener('click', () => {
    if (!running) return;
    lapCount++;
    const el = document.createElement('div');
    el.className = 'sw-lap';
    el.innerHTML = `<span>第 ${lapCount} 次</span><span>${fmt(Date.now() - startTime)}</span>`;
    laps.prepend(el);
  });

  document.getElementById('sw-reset').addEventListener('click', () => {
    clearInterval(toolTimers.sw);
    running = false; elapsed = 0; lapCount = 0;
    disp.textContent = '00:00.00';
    laps.innerHTML = '';
    startBtn.textContent = '▶ 开始';
  });
}

// ── COUNTDOWN ────────────────────────────────────────────────────────────────
function initCountdown() {
  let remaining = 0, running = false;
  const disp = document.getElementById('cd-display');
  const status = document.getElementById('cd-status');
  const startBtn = document.getElementById('cd-start');
  const inp = document.getElementById('cd-input');

  const fmt = s => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  remaining = parseInt(inp.value) || 60;
  disp.textContent = fmt(remaining);

  startBtn.addEventListener('click', () => {
    if (running) {
      clearInterval(toolTimers.cd);
      running = false;
      startBtn.textContent = '▶ 继续';
      status.textContent = '已暂停';
    } else {
      if (!remaining) remaining = parseInt(inp.value) || 60;
      toolTimers.cd = setInterval(() => {
        remaining--;
        disp.textContent = fmt(remaining);
        if (remaining <= 0) {
          clearInterval(toolTimers.cd);
          running = false;
          status.textContent = '⏰ 时间到！';
          startBtn.textContent = '▶ 开始';
          disp.style.color = 'var(--accent)';
        }
      }, 1000);
      running = true;
      startBtn.textContent = '⏸ 暂停';
      status.textContent = '计时中...';
      disp.style.color = 'var(--primary)';
    }
  });

  document.getElementById('cd-reset').addEventListener('click', () => {
    clearInterval(toolTimers.cd);
    running = false;
    remaining = parseInt(inp.value) || 60;
    disp.textContent = fmt(remaining);
    disp.style.color = 'var(--primary)';
    status.textContent = '准备就绪';
    startBtn.textContent = '▶ 开始';
  });

  inp.addEventListener('input', () => {
    if (!running) { remaining = parseInt(inp.value) || 0; disp.textContent = fmt(remaining); }
  });
}

// ── AGE ───────────────────────────────────────────────────────────────────────
function calcAge() {
  const val = document.getElementById('age-input').value;
  const box = document.getElementById('age-result');
  if (!val) return;
  const birth = new Date(val), now = new Date();
  if (birth > now) { box.textContent = '❌ 出生日期不能是未来日期'; return; }

  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth() - birth.getMonth();
  let d = now.getDate() - birth.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }

  const totalDays = Math.floor((now - birth) / 86400000);
  box.textContent = `${y} 岁 ${m} 个月 ${d} 天\n\n共 ${totalDays.toLocaleString()} 天\n约 ${(totalDays/365.25).toFixed(1)} 年`;
}

// ── WORD COUNT ────────────────────────────────────────────────────────────────
function updateWordCount() {
  const text = document.getElementById('wc-input').value;
  document.getElementById('wc-chars').textContent = text.length;
  document.getElementById('wc-words').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('wc-lines').textContent = text ? text.split('\n').length : 0;
}

// ── CASE CONVERTER ────────────────────────────────────────────────────────────
function ccConvert(type) {
  const text = document.getElementById('cc-input').value;
  const map = {
    upper: t => t.toUpperCase(),
    lower: t => t.toLowerCase(),
    title: t => t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    camel: t => t.toLowerCase().replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()),
    snake: t => t.replace(/[\s-]+/g, '_').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
    kebab: t => t.replace(/[\s_]+/g, '-').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
  };
  document.getElementById('cc-output').textContent = map[type] ? map[type](text) : text;
}

// ── BASE64 ────────────────────────────────────────────────────────────────────
function b64Convert(type) {
  const inp = document.getElementById('b64-input').value;
  const out = document.getElementById('b64-output');
  try {
    out.style.color = '';
    out.textContent = type === 'encode'
      ? btoa(unescape(encodeURIComponent(inp)))
      : decodeURIComponent(escape(atob(inp)));
  } catch (e) {
    out.style.color = 'var(--accent)';
    out.textContent = '❌ 转换失败：' + e.message;
  }
}

// ── URL ENCODE ────────────────────────────────────────────────────────────────
function urlConvert(type) {
  const inp = document.getElementById('url-input').value;
  const out = document.getElementById('url-output');
  try {
    out.style.color = '';
    out.textContent = type === 'encode' ? encodeURIComponent(inp) : decodeURIComponent(inp);
  } catch (e) {
    out.style.color = 'var(--accent)';
    out.textContent = '❌ 转换失败：' + e.message;
  }
}

// ── CALCULATOR ────────────────────────────────────────────────────────────────
function calcPress(btn) {
  const s = calcState;
  if (btn === 'C') {
    s.expr = ''; s.val = '0'; s.newNum = true;
  } else if (btn === '±') {
    s.val = String(-parseFloat(s.val));
  } else if (btn === '%') {
    s.val = String(parseFloat(s.val) / 100);
  } else if (btn === '=') {
    if (!s.expr) return;
    try {
      const jsExpr = (s.expr + s.val).replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return(' + jsExpr + ')')();
      s.val = String(parseFloat(result.toFixed(10)));
      s.expr = '';
      s.newNum = true;
    } catch { s.val = '错误'; s.expr = ''; s.newNum = true; }
  } else if (['+','−','×','÷'].includes(btn)) {
    s.expr += s.val + btn;
    s.newNum = true;
  } else if (btn === '.') {
    if (s.newNum) { s.val = '0.'; s.newNum = false; }
    else if (!s.val.includes('.')) s.val += '.';
  } else {
    s.val = s.newNum ? btn : (s.val === '0' ? btn : s.val + btn);
    s.newNum = false;
  }
  document.getElementById('calc-expr').textContent = s.expr || '\u00a0';
  document.getElementById('calc-val').textContent = s.val;
}

// ── UNIT CONVERTER ────────────────────────────────────────────────────────────
const UC = {
  length: { units: ['mm','cm','m','km','inch','ft','mile'], toM: { mm:.001, cm:.01, m:1, km:1000, inch:.0254, ft:.3048, mile:1609.34 } },
  weight: { units: ['mg','g','kg','t','oz','lb'],           toM: { mg:1e-6, g:.001, kg:1, t:1000, oz:.0283495, lb:.453592 } },
  area:   { units: ['mm²','cm²','m²','km²','亩','acre'],    toM: { 'mm²':1e-6,'cm²':1e-4,'m²':1,'km²':1e6,'亩':666.667,'acre':4046.86 } },
  temp:   { units: ['°C','°F','K'], toM: null },
};

function ucRender() {
  const type = document.getElementById('uc-type').value;
  const { units } = UC[type];
  document.getElementById('uc-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:end">
      <div>
        <div class="tool-label">数值</div>
        <input class="tool-input" type="number" id="uc-val" placeholder="输入" oninput="ucConvert()">
      </div>
      <div>
        <div class="tool-label">从</div>
        <select class="tool-select" id="uc-from" onchange="ucConvert()">
          ${units.map(u => `<option>${u}</option>`).join('')}
        </select>
      </div>
      <div>
        <div class="tool-label">到</div>
        <select class="tool-select" id="uc-to" onchange="ucConvert()">
          ${units.map((u,i) => `<option${i===1?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="result-box result-highlight" id="uc-result" style="margin-top:16px;font-size:1.05rem">—</div>`;
}

function ucConvert() {
  const type = document.getElementById('uc-type').value;
  const val = parseFloat(document.getElementById('uc-val').value);
  const from = document.getElementById('uc-from').value;
  const to = document.getElementById('uc-to').value;
  const out = document.getElementById('uc-result');
  if (isNaN(val)) { out.textContent = '—'; return; }

  let res;
  if (type === 'temp') {
    const toCelsius = { '°C': v => v, '°F': v => (v-32)*5/9, 'K': v => v-273.15 };
    const fromCelsius = { '°C': v => v, '°F': v => v*9/5+32, 'K': v => v+273.15 };
    res = fromCelsius[to](toCelsius[from](val));
  } else {
    res = val * UC[type].toM[from] / UC[type].toM[to];
  }
  out.textContent = `${val} ${from}  =  ${parseFloat(res.toFixed(8))} ${to}`;
}

// ── BMI ───────────────────────────────────────────────────────────────────────
function calcBMI() {
  const h = parseFloat(document.getElementById('bmi-h').value) / 100;
  const w = parseFloat(document.getElementById('bmi-w').value);
  const box = document.getElementById('bmi-result');
  if (!h || !w) { box.innerHTML = '<p style="color:var(--text-muted)">请输入身高和体重</p>'; return; }

  const bmi = w / (h * h);
  const [cat, color] =
    bmi < 18.5 ? ['偏瘦 😕','#4fc3f7'] :
    bmi < 25.0 ? ['正常 😊','var(--success)'] :
    bmi < 30.0 ? ['偏胖 😐','var(--warning)'] :
                 ['肥胖 😟','var(--accent)'];

  const pos = Math.min(Math.max((bmi - 10) / 40 * 100, 0), 100);
  box.innerHTML = `
    <div class="bmi-result">
      <div class="bmi-value" style="color:${color}">${bmi.toFixed(1)}</div>
      <div class="bmi-cat">${cat}</div>
    </div>
    <div class="bmi-bar"><div class="bmi-marker" style="left:${pos}%"></div></div>
    <div class="bmi-labels">
      <span>&lt;18.5 偏瘦</span><span>18.5–25 正常</span><span>25–30 偏胖</span><span>&gt;30 肥胖</span>
    </div>`;
}

// ── RANDOM ────────────────────────────────────────────────────────────────────
function genRandom() {
  const min = parseInt(document.getElementById('rnd-min').value);
  const max = parseInt(document.getElementById('rnd-max').value);
  const count = Math.min(Math.max(parseInt(document.getElementById('rnd-count').value) || 1, 1), 50);
  if (min > max) { showToast('⚠️ 最小值不能大于最大值'); return; }
  const nums = Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  document.getElementById('rnd-result').textContent = nums.join('   ');
}

// ── COLOR PICKER ──────────────────────────────────────────────────────────────
function updateColor() {
  const hex = document.getElementById('cp-input').value;
  document.getElementById('cp-preview').style.background = hex;
  document.getElementById('cp-hex').textContent = hex.toUpperCase();

  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  document.getElementById('cp-rgb').textContent = `rgb(${r}, ${g}, ${b})`;

  const rn = r/255, gn = g/255, bn = b/255;
  const max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === rn) h = ((gn-bn)/d + (gn<bn?6:0))/6;
    else if (max === gn) h = ((bn-rn)/d + 2)/6;
    else h = ((rn-gn)/d + 4)/6;
  }
  document.getElementById('cp-hsl').textContent =
    `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
}

// ── PASSWORD ──────────────────────────────────────────────────────────────────
function genPassword() {
  const len = parseInt(document.getElementById('pw-len').value);
  const upper = document.getElementById('pw-upper').checked;
  const lower = document.getElementById('pw-lower').checked;
  const num   = document.getElementById('pw-num').checked;
  const sym   = document.getElementById('pw-sym').checked;

  let chars = '';
  if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (num)   chars += '0123456789';
  if (sym)   chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

  if (!chars) { document.getElementById('pw-result').textContent = '⚠️ 请至少选择一种字符类型'; return; }

  const pw = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  document.getElementById('pw-result').textContent = pw;

  const types = [upper,lower,num,sym].filter(Boolean).length;
  const pct = [25,50,75,100][types-1];
  const colors = ['var(--accent)','var(--warning)','#4fc3f7','var(--success)'];
  const labels = ['弱','中','强','非常强'];
  document.getElementById('pw-strength-bar').style.cssText = `width:${pct}%;background:${colors[types-1]}`;
  document.getElementById('pw-strength-label').textContent = '强度：' + labels[types-1];
}

// ── JSON ──────────────────────────────────────────────────────────────────────
function jsonFormat() {
  const out = document.getElementById('json-output');
  try {
    out.style.color = '';
    out.textContent = JSON.stringify(JSON.parse(document.getElementById('json-input').value), null, 2);
  } catch (e) { out.style.color = 'var(--accent)'; out.textContent = '❌ ' + e.message; }
}
function jsonMinify() {
  const out = document.getElementById('json-output');
  try {
    out.style.color = '';
    out.textContent = JSON.stringify(JSON.parse(document.getElementById('json-input').value));
  } catch (e) { out.style.color = 'var(--accent)'; out.textContent = '❌ ' + e.message; }
}
function jsonValidate() {
  const out = document.getElementById('json-output');
  try {
    JSON.parse(document.getElementById('json-input').value);
    out.style.color = 'var(--success)';
    out.textContent = '✅ JSON 格式正确！';
  } catch (e) { out.style.color = 'var(--accent)'; out.textContent = '❌ ' + e.message; }
}

// ── QR CODE ───────────────────────────────────────────────────────────────────
function genQR() {
  const text = document.getElementById('qr-input').value.trim();
  const box = document.getElementById('qr-display');
  if (!text) { showToast('⚠️ 请输入内容'); return; }
  box.innerHTML = '<p style="color:var(--text-muted)">生成中...</p>';
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  box.innerHTML = `
    <img src="${url}" alt="QR Code"
      onerror="this.parentElement.innerHTML='<p style=color:var(--accent)>❌ 生成失败，请检查网络</p>'">
    <p style="margin-top:10px;font-size:.75rem;color:var(--text-muted)">右键图片可保存</p>`;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderGrid();
