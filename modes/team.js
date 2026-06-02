// Team mode — registers as window.MODES.team
(function() {
  var STORAGE_KEY = 'gidtpm_team_state';
  var RESULT_KEY  = 'gidtpm_team_result';

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pick(obj, lang) { return obj[lang] || obj.ru; }
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var ROLE_TASKS = {
    researcher:   { ru: 'обзор литературы и синтез данных',                    en: 'literature review and evidence synthesis' },
    developer:    { ru: 'разработка и техническая реализация',                  en: 'development and technical implementation' },
    designer:     { ru: 'UX/UI дизайн и визуализация',                         en: 'UX/UI design and visualization' },
    analyst:      { ru: 'сбор, обработка и статистический анализ данных',       en: 'data collection, processing and statistical analysis' },
    interviewer:  { ru: 'полевая работа: интервью и фокус-группы',              en: 'fieldwork: interviews and focus groups' },
    pm:           { ru: 'координация проекта и коммуникация со стейкхолдерами', en: 'project coordination and stakeholder communication' },
    ml_engineer:  { ru: 'разработка и оценка ML-моделей',                       en: 'machine learning model development and evaluation' },
    biologist:    { ru: 'лабораторные эксперименты и биологический анализ',     en: 'laboratory experiments and biological data analysis' },
    educator:     { ru: 'разработка учебного контента',                         en: 'curriculum development and content creation' },
    writer:       { ru: 'написание, редактирование и распространение результатов', en: 'writing, editing and dissemination of results' },
    marketer:     { ru: 'исследование аудитории и стратегия продвижения',       en: 'audience research and promotion strategy' },
    legal:        { ru: 'правовой анализ и соответствие требованиям',           en: 'legal analysis and regulatory compliance' },
    economist:    { ru: 'экономическое моделирование и оценка осуществимости',  en: 'economic modeling and feasibility assessment' },
    engineer:     { ru: 'техническое проектирование, прототипирование и тестирование', en: 'technical design, prototyping and testing' },
    artist:       { ru: 'создание визуального контента и арт-дирекция',         en: 'visual content creation and creative direction' },
    psychologist: { ru: 'психологическая оценка и благополучие участников',     en: 'psychological assessment and participant well-being' },
    geographer:   { ru: 'пространственный анализ и полевые съёмки',             en: 'spatial analysis and field surveys' },
    communicator: { ru: 'коммуникации, PR и внешние связи',                     en: 'communications, PR and external relations' },
  };

  function checkBalance(participants, lang) {
    var L = lang === 'en';
    var present = {};
    for (var i = 0; i < participants.length; i++) present[participants[i].role] = true;
    var important = ['researcher', 'developer', 'analyst', 'designer', 'pm'];
    var missing = [];
    for (var j = 0; j < important.length; j++) {
      if (!present[important[j]]) {
        var role = null;
        for (var k = 0; k < ROLES.length; k++) { if (ROLES[k].id === important[j]) { role = ROLES[k]; break; } }
        missing.push(role ? pick(role, lang) : important[j]);
      }
    }
    if (!missing.length) return null;
    return { title: L ? 'Consider adding:' : 'Рекомендуется добавить:', items: missing };
  }

  function generateTeamProject(participants, lang) {
    var L = lang === 'en';
    var allInterests = [].concat(INTERESTS.natural, INTERESTS.technical, INTERESTS.social, INTERESTS.creative);
    var problem     = rand(PROBLEMS);
    var method      = rand(METHODS);
    var application = rand(APPLICATIONS);
    var interest    = rand(allInterests);
    var tmpl        = rand(TEMPLATES.projectNames);

    var title = pick(tmpl, lang)
      .replace('{interest}', pick(interest, lang))
      .replace('{interest2}', pick(rand(allInterests), lang))
      .replace('{method}', pick(method, lang))
      .replace('{format}', L ? 'team project' : 'командный проект')
      .replace('{problem_short}', pick(problem, lang).split(' ').slice(0, 3).join(' '));

    var goal = L
      ? 'Create a solution to the challenge "' + pick(problem, lang).slice(0, 60) + '..." using ' + pick(method, lang) + ', applicable ' + pick(application, lang) + '.'
      : 'Создать решение для проблемы «' + pick(problem, lang).slice(0, 60) + '...» с использованием метода «' + pick(method, lang) + '», применимое ' + pick(application, lang) + '.';

    var tasks = [];
    for (var i = 0; i < participants.length; i++) {
      var p = participants[i];
      var roleObj = null;
      for (var r = 0; r < ROLES.length; r++) { if (ROLES[r].id === p.role) { roleObj = ROLES[r]; break; } }
      var roleLabel = roleObj ? pick(roleObj, lang) : p.role;
      var taskObj = ROLE_TASKS[p.role];
      var task = taskObj ? pick(taskObj, lang) : (L ? 'contribution to project goals' : 'вклад в достижение целей проекта');
      tasks.push({ name: p.name || ((L ? 'Participant ' : 'Участник ') + (i + 1)), role: roleLabel, task: task });
    }

    return {
      title: title,
      goal: goal,
      problem: pick(problem, lang),
      method:  pick(method, lang),
      application: pick(application, lang),
      tasks: tasks,
      teamSize: participants.length,
      mode: 'team',
    };
  }

  function renderResultCard(container, result, lang) {
    var L = lang === 'en';
    var existing = container.querySelector('.result-area');
    if (existing) existing.remove();

    var tasksHtml = '';
    if (result.tasks) {
      for (var i = 0; i < result.tasks.length; i++) {
        var t = result.tasks[i];
        tasksHtml += '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem;font-size:0.875rem;flex-wrap:wrap">' +
          '<strong style="min-width:110px;color:var(--accent)">' + escH(t.name) + '</strong>' +
          '<span style="color:var(--text-muted);min-width:90px">' + escH(t.role) + '</span>' +
          '<span>' + escH(t.task) + '</span></div>';
      }
    }

    var div = document.createElement('div');
    div.className = 'result-area';
    div.innerHTML =
      '<div class="card card--result">' +
        '<div class="card__title">' + escH(result.title) + '</div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Goal' : 'Общая цель') + '</span><span class="card__value">' + escH(result.goal) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Method' : 'Метод') + '</span><span class="card__value">' + escH(result.method) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Application' : 'Применение') + '</span><span class="card__value">' + escH(result.application) + '</span></div>' +
        '<div class="card__field" style="margin-top:0.75rem"><span class="card__label">' + (L ? 'Task distribution' : 'Распределение задач') + '</span>' +
        '<div style="margin-top:0.4rem">' + tasksHtml + '</div></div>' +
      '</div>';
    container.appendChild(div);
  }

  function saveState(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch(e) {} }
  function loadState() { try { var s = JSON.parse(localStorage.getItem(STORAGE_KEY)); return (Array.isArray(s) && s.length) ? s : null; } catch(e) { return null; } }
  function saveResult(r) { try { localStorage.setItem(RESULT_KEY, JSON.stringify(r)); } catch(e) {} }
  function loadResult() { try { return JSON.parse(localStorage.getItem(RESULT_KEY)); } catch(e) { return null; } }

  var DEFAULT = [{ name: '', role: 'researcher', skills: [] }, { name: '', role: 'developer', skills: [] }];

  function render(container, lang) {
    var L = lang === 'en';
    var participants = loadState() || DEFAULT.map(function(p) { return { name: p.name, role: p.role, skills: [] }; });

    function buildParticipantHTML(p, idx) {
      var roleOpts = '';
      for (var i = 0; i < ROLES.length; i++) {
        roleOpts += '<option value="' + ROLES[i].id + '"' + (ROLES[i].id === p.role ? ' selected' : '') + '>' + escH(pick(ROLES[i], lang)) + '</option>';
      }
      return '<div class="participant-card" data-index="' + idx + '">' +
        '<div class="participant-card__header">' +
          '<div class="participant-number">' + (idx + 1) + '</div>' +
          '<input type="text" class="input-text p-name" placeholder="' + (L ? 'Name' : 'Имя') + '" value="' + escH(p.name || '') + '" style="flex:1">' +
          '<button type="button" class="btn btn--danger btn--icon remove-p" title="' + (L ? 'Remove' : 'Удалить') + '" style="flex-shrink:0">&#8722;</button>' +
        '</div>' +
        '<div class="participant-card__fields">' +
          '<div><label style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;display:block">' + (L ? 'Role' : 'Роль') + '</label>' +
          '<select class="input-text p-role">' + roleOpts + '</select></div>' +
        '</div>' +
      '</div>';
    }

    function rebuildList() {
      var list = document.getElementById('participant-list');
      if (!list) return;
      var html = '';
      for (var i = 0; i < participants.length; i++) html += buildParticipantHTML(participants[i], i);
      list.innerHTML = html;
      bindCards();
      updateBalance();
      var addBtn = document.getElementById('btn-add-p');
      if (addBtn) addBtn.disabled = participants.length >= 10;
    }

    function collectParticipants() {
      var cards = container.querySelectorAll('.participant-card');
      var result = [];
      for (var i = 0; i < cards.length; i++) {
        result.push({
          name: (cards[i].querySelector('.p-name') || {}).value || '',
          role: (cards[i].querySelector('.p-role') || {}).value || 'researcher',
          skills: [],
        });
      }
      return result;
    }

    function updateBalance() {
      var current = collectParticipants();
      var balance = checkBalance(current, lang);
      var el = document.getElementById('balance-info');
      if (!el) return;
      if (balance) {
        var tags = '';
        for (var i = 0; i < balance.items.length; i++) tags += '<span class="badge" style="margin:0.15rem">' + escH(balance.items[i]) + '</span>';
        el.innerHTML = '<div class="missing-roles"><div class="missing-roles__title">' + escH(balance.title) + '</div>' + tags + '</div>';
      } else {
        el.innerHTML = '<div class="missing-roles" style="border-color:var(--accent);background:transparent">✓ ' + (L ? 'Team is well balanced!' : 'Команда сбалансирована!') + '</div>';
      }
    }

    function bindCards() {
      var removeBtns = container.querySelectorAll('.remove-p');
      for (var i = 0; i < removeBtns.length; i++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            if (participants.length <= 1) return;
            participants = collectParticipants();
            var idx = Number(btn.closest('.participant-card').getAttribute('data-index'));
            participants.splice(idx, 1);
            saveState(participants);
            rebuildList();
          });
        })(removeBtns[i]);
      }
      var inputs = container.querySelectorAll('.participant-card input, .participant-card select');
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].addEventListener('change', function() { updateBalance(); });
      }
    }

    container.innerHTML =
      '<div class="card" style="margin-bottom:1rem">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">' +
          '<h2 style="font-size:1rem;font-weight:700;color:var(--accent)">' + (L ? 'Team Mode' : 'Режим Команда') + '</h2>' +
          '<div style="display:flex;gap:0.5rem">' +
            '<button id="btn-add-p" class="btn btn--secondary">+ ' + (L ? 'Add' : 'Добавить') + '</button>' +
            '<button id="btn-balance" class="btn btn--secondary">' + (L ? 'Balance' : 'Баланс') + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="participant-list" class="participant-list"></div>' +
        '<div id="balance-info" style="margin-top:0.75rem"></div>' +
        '<button id="btn-generate-team" class="btn btn--generate" style="margin-top:1rem">' +
          (L ? '✦ Generate team project' : '✦ Сгенерировать командный проект') +
        '</button>' +
      '</div>';

    rebuildList();

    document.getElementById('btn-add-p').addEventListener('click', function() {
      if (participants.length >= 10) return;
      participants = collectParticipants();
      participants.push({ name: '', role: 'researcher', skills: [] });
      saveState(participants);
      rebuildList();
    });

    document.getElementById('btn-balance').addEventListener('click', function() {
      participants = collectParticipants();
      updateBalance();
      var el = document.getElementById('balance-info');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    document.getElementById('btn-generate-team').addEventListener('click', function() {
      participants = collectParticipants();
      saveState(participants);
      var delay = Math.round(Math.random() * 1000 + 1800);
      var stopLoading = showLoading(delay);
      setTimeout(function() {
        stopLoading();
        var result = generateTeamProject(participants, lang);
        saveResult(result);
        renderResultCard(container, result, lang);
        setResult(result);
        var ra = container.querySelector('.result-area');
        if (ra) ra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, delay);
    });

    var lastResult = loadResult();
    if (lastResult) {
      renderResultCard(container, lastResult, lang);
      setResult(lastResult);
    }
  }

  function restoreResult(result) {
    var container = document.getElementById('mode-container');
    renderResultCard(container, result, 'ru');
    setResult(result);
  }

  window.MODES = window.MODES || {};
  window.MODES.team = { render: render, restoreResult: restoreResult };
})();
