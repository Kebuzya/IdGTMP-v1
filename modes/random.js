// Random mode — registers as window.MODES.random
(function() {
  var HISTORY_KEY = 'gidtpm_random_history';
  var MAX_HISTORY = 5;

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pick(obj, lang) { return obj[lang] || obj.ru; }
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var allInterests = null;
  function getAllInterests() {
    if (!allInterests) allInterests = [].concat(INTERESTS.natural, INTERESTS.technical, INTERESTS.social, INTERESTS.creative);
    return allInterests;
  }

  function generateRandom(lang) {
    var L = lang === 'en';
    var role     = rand(ROLES);
    var problem  = rand(PROBLEMS);
    var method   = rand(METHODS);
    var interest = rand(getAllInterests());
    var application = rand(APPLICATIONS);

    var title = L
      ? 'How ' + pick(role, lang) + ' solves "' + pick(problem, lang).slice(0, 55) + '..." in ' + pick(interest, lang)
      : 'Как ' + pick(role, lang) + ' решает «' + pick(problem, lang).slice(0, 55) + '...» в области ' + pick(interest, lang);

    return {
      title: title,
      role: pick(role, lang),
      problem: pick(problem, lang),
      method:  pick(method, lang),
      interest: pick(interest, lang),
      application: pick(application, lang),
      mode: 'random',
      _parts: { role: role, problem: problem, method: method, interest: interest, application: application },
    };
  }

  function flipOne(current, lang) {
    var keys = ['role', 'problem', 'method', 'interest', 'application'];
    var key = rand(keys);
    var parts = {};
    for (var k in current._parts) parts[k] = current._parts[k];

    if      (key === 'role')        parts.role        = rand(ROLES);
    else if (key === 'problem')     parts.problem     = rand(PROBLEMS);
    else if (key === 'method')      parts.method      = rand(METHODS);
    else if (key === 'interest')    parts.interest    = rand(getAllInterests());
    else if (key === 'application') parts.application = rand(APPLICATIONS);

    var L = lang === 'en';
    var title = L
      ? 'How ' + pick(parts.role, lang) + ' solves "' + pick(parts.problem, lang).slice(0, 55) + '..." in ' + pick(parts.interest, lang)
      : 'Как ' + pick(parts.role, lang) + ' решает «' + pick(parts.problem, lang).slice(0, 55) + '...» в области ' + pick(parts.interest, lang);

    return {
      title: title,
      role: pick(parts.role, lang),
      problem: pick(parts.problem, lang),
      method:  pick(parts.method, lang),
      interest: pick(parts.interest, lang),
      application: pick(parts.application, lang),
      mode: 'random',
      flippedKey: key,
      _parts: parts,
    };
  }

  function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; } }
  function saveHistory(h) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {} }

  function addToHistory(result) {
    var history = loadHistory();
    history.unshift({ title: result.title, timestamp: Date.now(), data: result });
    if (history.length > MAX_HISTORY) history.pop();
    saveHistory(history);
    return history;
  }

  var currentResult = null;

  function renderResultCard(container, result, lang) {
    var L = lang === 'en';
    var existing = container.querySelector('.result-area');
    if (existing) existing.remove();

    var badge = result.flippedKey
      ? '<span class="badge badge--accent" style="margin-bottom:0.75rem;display:inline-flex">&#8635; ' + (L ? 'Changed: ' : 'Изменено: ') + escH(result.flippedKey) + '</span><br>'
      : '';

    var div = document.createElement('div');
    div.className = 'result-area';
    div.innerHTML =
      '<div class="card card--result">' +
        badge +
        '<div class="card__title">' + escH(result.title) + '</div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Role' : 'Роль') + '</span><span class="card__value">' + escH(result.role) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Problem' : 'Проблема') + '</span><span class="card__value">' + escH(result.problem) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Method' : 'Метод') + '</span><span class="card__value">' + escH(result.method) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Area' : 'Область') + '</span><span class="card__value">' + escH(result.interest) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Application' : 'Применение') + '</span><span class="card__value">' + escH(result.application) + '</span></div>' +
        '<div style="margin-top:0.75rem">' +
          '<button id="btn-flip" class="btn btn--secondary" style="width:100%">&#8635; ' + (L ? 'Flip one element' : 'Перевернуть один элемент') + '</button>' +
        '</div>' +
      '</div>';
    container.appendChild(div);

    document.getElementById('btn-flip').addEventListener('click', function() {
      if (!currentResult) return;
      var delay = Math.round(Math.random() * 300 + 600);
      var stopLoading = showLoading(delay);
      setTimeout(function() {
        stopLoading();
        currentResult = flipOne(currentResult, lang);
        var history = addToHistory(currentResult);
        renderResultCard(container, currentResult, lang);
        setResult(currentResult);
        renderHistory(container, history, lang);
      }, delay);
    });
  }

  function renderHistory(container, history, lang) {
    var L = lang === 'en';
    var existing = container.querySelector('.random-history');
    if (existing) existing.remove();
    if (!history || !history.length) return;

    var items = '';
    for (var i = 0; i < history.length; i++) {
      var title = history[i].title || '';
      items += '<div class="history-item" data-index="' + i + '">' +
        '<strong>' + (i + 1) + '.</strong> ' + escH(title.slice(0, 85)) + (title.length > 85 ? '&hellip;' : '') +
        '</div>';
    }

    var div = document.createElement('div');
    div.className = 'random-history';
    div.innerHTML = '<div class="random-history__title">' + (L ? 'Recent ideas' : 'Последние идеи') + '</div>' + items;
    container.appendChild(div);

    var histItems = div.querySelectorAll('.history-item');
    for (var j = 0; j < histItems.length; j++) {
      (function(el, idx) {
        el.addEventListener('click', function() {
          var item = history[idx];
          if (!item) return;
          currentResult = item.data;
          renderResultCard(container, currentResult, lang);
          setResult(currentResult);
          renderHistory(container, history, lang);
          var ra = container.querySelector('.result-area');
          if (ra) ra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      })(histItems[j], j);
    }
  }

  function render(container, lang) {
    var L = lang === 'en';
    currentResult = null;

    container.innerHTML =
      '<div style="text-align:center;margin-bottom:1.5rem">' +
        '<h2 style="font-size:1.1rem;font-weight:700;color:var(--accent);margin-bottom:0.5rem">' +
          (L ? 'Random Challenge Mode' : 'Режим Случайный вызов') +
        '</h2>' +
        '<p style="color:var(--text-muted);font-size:0.9rem">' +
          (L ? 'Get an unexpected research idea in one click' : 'Получите неожиданную идею исследования в один клик') +
        '</p>' +
      '</div>' +
      '<button id="btn-surprise" class="surprise-btn">' + (L ? '&#10022; Surprise me!' : '&#10022; Удиви меня!') + '</button>';

    var history = loadHistory();
    if (history.length) renderHistory(container, history, lang);

    document.getElementById('btn-surprise').addEventListener('click', function() {
      var delay = Math.round(Math.random() * 500 + 1200);
      var stopLoading = showLoading(delay);
      setTimeout(function() {
        stopLoading();
        currentResult = generateRandom(lang);
        var updatedHistory = addToHistory(currentResult);
        renderResultCard(container, currentResult, lang);
        setResult(currentResult);
        renderHistory(container, updatedHistory, lang);
        var ra = container.querySelector('.result-area');
        if (ra) ra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, delay);
    });
  }

  function restoreResult(result) {
    var container = document.getElementById('mode-container');
    currentResult = result;
    renderResultCard(container, result, 'ru');
    setResult(result);
  }

  window.MODES = window.MODES || {};
  window.MODES.random = { render: render, restoreResult: restoreResult };
})();
