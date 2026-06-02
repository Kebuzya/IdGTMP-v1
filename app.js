// ===== STATE =====
var APP = {
  theme: 'light',
  lang: 'ru',
  mode: 'solo',
  result: null,
  modeModule: null,
};

// ===== LOCALE =====
var LOCALE = {
  ru: {
    'header.subtitle': 'Генератор идей для творческих проектов',
    'tab.solo': 'Соло',
    'tab.team': 'Команда',
    'tab.random': 'Случайный',
    'export.copy': 'Копировать',
    'export.download': 'Скачать .md',
    'export.share': 'Поделиться',
    'export.favorite': 'В избранное',
    'favorites.title': 'Избранное',
    'favorites.empty': 'Пока ничего не сохранено',
    'share.title': 'Поделиться идеей',
    'share.copyText': 'Скопировать текст',
    'toast.copied': 'Скопировано!',
    'toast.saved': 'Сохранено в избранное',
    'toast.downloaded': 'Файл загружен',
  },
  en: {
    'header.subtitle': 'Creative Project Idea Generator',
    'tab.solo': 'Solo',
    'tab.team': 'Team',
    'tab.random': 'Random',
    'export.copy': 'Copy',
    'export.download': 'Download .md',
    'export.share': 'Share',
    'export.favorite': 'Favorite',
    'favorites.title': 'Favorites',
    'favorites.empty': 'Nothing saved yet',
    'share.title': 'Share idea',
    'share.copyText': 'Copy text',
    'toast.copied': 'Copied!',
    'toast.saved': 'Saved to favorites',
    'toast.downloaded': 'File downloaded',
  },
};

function t(key) { return (LOCALE[APP.lang] && LOCALE[APP.lang][key]) || key; }

// ===== THEME =====
function toggleTheme() {
  APP.theme = APP.theme === 'light' ? 'dark' : 'light';
  applyTheme(APP.theme);
  localStorage.setItem('gidtpm_theme', APP.theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☽' : '☀';
}

// ===== LANGUAGE =====
function toggleLang() {
  APP.lang = APP.lang === 'ru' ? 'en' : 'ru';
  localStorage.setItem('gidtpm_lang', APP.lang);
  document.documentElement.setAttribute('lang', APP.lang);
  var btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = APP.lang.toUpperCase();
  applyI18n();
  switchMode(APP.mode, true);
}

function applyI18n() {
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-i18n');
    var val = t(key);
    if (val) els[i].textContent = val;
  }
}

// ===== MODE ROUTING =====
function switchMode(mode, forceReload) {
  if (mode === APP.mode && !forceReload && APP.modeModule) {
    var container = document.getElementById('mode-container');
    APP.modeModule.render(container, APP.lang);
    return;
  }
  APP.mode = mode;
  localStorage.setItem('gidtpm_mode', mode);

  var tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    var active = tabs[i].getAttribute('data-mode') === mode;
    tabs[i].classList.toggle('tab--active', active);
    tabs[i].setAttribute('aria-selected', active ? 'true' : 'false');
  }

  var container = document.getElementById('mode-container');
  container.innerHTML = '';

  if (!window.MODES || !window.MODES[mode]) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted)">Загрузка...</div>';
    return;
  }

  APP.modeModule = window.MODES[mode];
  APP.modeModule.render(container, APP.lang);
  setResult(null);
}

// ===== RESULT =====
function setResult(result) {
  APP.result = result;
  var btns = document.querySelectorAll('#export-bar .btn--export');
  for (var i = 0; i < btns.length; i++) {
    btns[i].disabled = !result;
  }
}

function getResult() { return APP.result; }

// ===== LOADING ANIMATION =====
var _loadingTimer = null;
var _loadingInterval = null;

function showLoading(durationMs) {
  durationMs = durationMs || 2000;
  var overlay = document.getElementById('loading-overlay');
  var msgEl = document.getElementById('loading-message');
  var messages = TEMPLATES.loadingMessages[APP.lang];
  overlay.classList.remove('hidden');

  var idx = 0;
  msgEl.textContent = messages[0];

  _loadingInterval = setInterval(function() {
    idx = (idx + 1) % messages.length;
    msgEl.style.opacity = '0';
    setTimeout(function() {
      msgEl.textContent = messages[idx];
      msgEl.style.opacity = '1';
    }, 150);
  }, 700);

  _loadingTimer = setTimeout(function() {
    hideLoading();
  }, durationMs);

  return function() { hideLoading(); };
}

function hideLoading() {
  var overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
  if (_loadingTimer)    { clearTimeout(_loadingTimer);    _loadingTimer = null; }
}

// ===== TOAST =====
function showToast(message, type) {
  type = type || 'success';
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
    'background:' + (type === 'success' ? 'var(--accent)' : '#e74c3c') + ';',
    'color:' + (type === 'success' ? 'var(--accent-text)' : '#fff') + ';',
    'padding:0.6rem 1.2rem;border-radius:8px;font-size:0.875rem;',
    'z-index:400;box-shadow:0 4px 12px rgba(0,0,0,0.25);',
    'font-family:inherit;font-weight:500;white-space:nowrap;',
    'animation:toastIn 0.25s ease;',
  ].join('');
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentNode) toast.remove(); }, 2500);
}

// ===== FAVORITES =====
function renderFavoritesPanel() {
  var list = loadFavorites();
  var el = document.getElementById('favorites-list');
  var countEl = document.getElementById('favorites-count');
  if (!el) return;

  if (countEl) {
    countEl.textContent = list.length;
    countEl.style.display = list.length ? 'flex' : 'none';
  }

  if (!list.length) {
    el.innerHTML = '<p class="favorites-empty">' + t('favorites.empty') + '</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var dateStr = new Date(item.date).toLocaleDateString(APP.lang === 'en' ? 'en-US' : 'ru-RU');
    html += '<div class="favorite-item" data-id="' + item.id + '">' +
      '<button class="favorite-item__delete" data-id="' + item.id + '" title="Удалить">&#x2715;</button>' +
      '<div class="favorite-item__title">' + escHtml(item.title) + '</div>' +
      '<div class="favorite-item__meta"><span>' + item.mode + '</span><span>' + dateStr + '</span></div>' +
      '</div>';
  }
  el.innerHTML = html;

  var items = el.querySelectorAll('.favorite-item');
  for (var j = 0; j < items.length; j++) {
    (function(elem) {
      elem.addEventListener('click', function(e) {
        if (e.target.classList.contains('favorite-item__delete')) return;
        var id = Number(elem.getAttribute('data-id'));
        var found = null;
        for (var k = 0; k < list.length; k++) { if (list[k].id === id) { found = list[k]; break; } }
        if (found && APP.modeModule && APP.modeModule.restoreResult) {
          APP.modeModule.restoreResult(found.data);
          document.getElementById('favorites-panel').classList.add('hidden');
        }
      });
    })(items[j]);
  }

  var delBtns = el.querySelectorAll('.favorite-item__delete');
  for (var d = 0; d < delBtns.length; d++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = Number(btn.getAttribute('data-id'));
        removeFromFavorites(id);
        renderFavoritesPanel();
      });
    })(delBtns[d]);
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== EXPORT BAR =====
function setupExportBar() {
  document.getElementById('btn-copy').addEventListener('click', function() {
    var md = resultToMarkdown(APP.result, APP.lang);
    copyToClipboard(md).then(function(ok) {
      showToast(ok ? t('toast.copied') : 'Ошибка', ok ? 'success' : 'error');
    });
  });

  document.getElementById('btn-download').addEventListener('click', function() {
    var md = resultToMarkdown(APP.result, APP.lang);
    var slug = ((APP.result && APP.result.title) || 'idea').slice(0, 30).replace(/[^\w\sЀ-ӿ]/g, '').trim().replace(/\s+/g, '_');
    downloadAsMarkdown(md, (slug || 'idea') + '.md');
    showToast(t('toast.downloaded'));
  });

  document.getElementById('btn-share').addEventListener('click', function() {
    var md = resultToMarkdown(APP.result, APP.lang);
    shareIdea(md, APP.result && APP.result.title).then(function(shared) {
      if (!shared) {
        document.getElementById('share-text').value = md;
        document.getElementById('modal-overlay').classList.remove('hidden');
      }
    });
  });

  document.getElementById('btn-favorite').addEventListener('click', function() {
    if (!APP.result) return;
    APP.result.mode = APP.mode;
    addToFavorites(APP.result);
    renderFavoritesPanel();
    showToast(t('toast.saved'));
  });
}

// ===== MODAL =====
function setupModal() {
  document.getElementById('modal-close').addEventListener('click', function() {
    document.getElementById('modal-overlay').classList.add('hidden');
  });
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === document.getElementById('modal-overlay'))
      document.getElementById('modal-overlay').classList.add('hidden');
  });
  document.getElementById('share-copy-btn').addEventListener('click', function() {
    copyToClipboard(document.getElementById('share-text').value).then(function() {
      showToast(t('toast.copied'));
    });
  });
}

// ===== INIT =====
function initApp() {
  var savedTheme = localStorage.getItem('gidtpm_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  var savedLang  = localStorage.getItem('gidtpm_lang')  || 'ru';
  var savedMode  = localStorage.getItem('gidtpm_mode')  || 'solo';

  APP.theme = savedTheme;
  APP.lang  = savedLang;

  applyTheme(savedTheme);
  document.documentElement.setAttribute('lang', savedLang);
  var langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = savedLang.toUpperCase();

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('lang-toggle').addEventListener('click', toggleLang);

  var tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    (function(tab) {
      tab.addEventListener('click', function() { switchMode(tab.getAttribute('data-mode')); });
    })(tabs[i]);
  }

  document.getElementById('favorites-toggle-btn').addEventListener('click', function() {
    document.getElementById('favorites-panel').classList.remove('hidden');
    renderFavoritesPanel();
  });
  document.getElementById('favorites-close').addEventListener('click', function() {
    document.getElementById('favorites-panel').classList.add('hidden');
  });

  setupExportBar();
  setupModal();
  applyI18n();
  renderFavoritesPanel();

  // toast animation
  var style = document.createElement('style');
  style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);

  switchMode(savedMode);
}

document.addEventListener('DOMContentLoaded', initApp);
