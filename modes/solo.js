// Solo mode — registers as window.MODES.solo
(function() {
  var STORAGE_KEY = 'gidtpm_solo_state';
  var RESULT_KEY  = 'gidtpm_solo_result';

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pick(obj, lang) { return obj[lang] || obj.ru; }

  function buildTitle(interest, method, format, problem, lang) {
    var tmpl = rand(TEMPLATES.projectNames);
    var problemShort = pick(problem, lang).split(' ').slice(0, 4).join(' ');
    var allInterests = [].concat(INTERESTS.natural, INTERESTS.technical, INTERESTS.social, INTERESTS.creative);
    return pick(tmpl, lang)
      .replace('{interest}', pick(interest, lang))
      .replace('{interest2}', pick(rand(allInterests), lang))
      .replace('{method}', pick(method, lang))
      .replace('{format}', pick(format, lang))
      .replace('{problem_short}', problemShort);
  }

  function buildAiComment(selectedSkills, interest, skill1, skill2, method, application, lang) {
    var tmpl = rand(TEMPLATES.aiComments);
    var skillsList = selectedSkills.slice(0, 3).map(function(s) { return pick(s, lang); }).join(', ');
    return pick(tmpl, lang)
      .replace(/{skills}/g, skillsList || pick(skill1, lang))
      .replace(/{skill1}/g, pick(skill1, lang))
      .replace(/{skill2}/g, skill2 ? pick(skill2, lang) : pick(skill1, lang))
      .replace(/{interest}/g, pick(interest, lang))
      .replace(/{method}/g, pick(method, lang))
      .replace(/{application}/g, pick(application, lang));
  }

  function generate(selections, lang) {
    var track = selections.track || 'natural';
    var trackInterests = INTERESTS[track] || INTERESTS.natural;
    var allInterests = [].concat(INTERESTS.natural, INTERESTS.technical, INTERESTS.social, INTERESTS.creative);

    var selectedInterests = [];
    if (selections.interests && selections.interests.length) {
      for (var i = 0; i < trackInterests.length; i++) {
        if (selections.interests.indexOf(trackInterests[i].id) !== -1) selectedInterests.push(trackInterests[i]);
      }
    }
    var interest = rand(selectedInterests.length ? selectedInterests : trackInterests);

    var selectedSkills = [];
    if (selections.skills && selections.skills.length) {
      for (var j = 0; j < SKILLS.length; j++) {
        if (selections.skills.indexOf(SKILLS[j].id) !== -1) selectedSkills.push(SKILLS[j]);
      }
    }
    if (!selectedSkills.length) {
      selectedSkills = [rand(SKILLS), rand(SKILLS), rand(SKILLS)];
    }
    var skill1 = selectedSkills[0] || rand(SKILLS);
    var skill2 = selectedSkills[1] || rand(SKILLS);

    var format = null;
    if (selections.format) {
      for (var k = 0; k < FORMATS.length; k++) {
        if (FORMATS[k].id === selections.format) { format = FORMATS[k]; break; }
      }
    }
    if (!format) format = rand(FORMATS);

    var problem     = rand(PROBLEMS);
    var method      = rand(METHODS);
    var application = rand(APPLICATIONS);

    var title = buildTitle(interest, method, format, problem, lang);
    var aiComment = buildAiComment(selectedSkills, interest, skill1, skill2, method, application, lang);

    var levelLabel = null;
    if (selections.level && TEMPLATES.levelLabels[selections.level]) {
      levelLabel = pick(TEMPLATES.levelLabels[selections.level], lang);
    }

    return {
      title: title,
      problem: pick(problem, lang),
      method:  pick(method, lang),
      application: pick(application, lang),
      format: pick(format, lang),
      level: levelLabel,
      aiComment: aiComment,
      interest: pick(interest, lang),
      mode: 'solo',
    };
  }

  function renderResultCard(container, result, lang) {
    var L = lang === 'en';
    var existing = container.querySelector('.result-area');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.className = 'result-area';
    div.innerHTML =
      '<div class="card card--result">' +
        '<div class="card__title">' + escH(result.title) + '</div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Problem' : 'Проблема') + '</span><span class="card__value">' + escH(result.problem) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Method' : 'Метод') + '</span><span class="card__value">' + escH(result.method) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Application' : 'Применение') + '</span><span class="card__value">' + escH(result.application) + '</span></div>' +
        '<div class="card__field"><span class="card__label">' + (L ? 'Format' : 'Формат') + '</span><span class="card__value">' + escH(result.format) + (result.level ? ' · ' + escH(result.level) : '') + '</span></div>' +
        '<div class="card__ai"><strong>' + (L ? 'AI comment:' : 'Комментарий ИИ:') + '</strong> ' + escH(result.aiComment) + '</div>' +
      '</div>';
    container.appendChild(div);
  }

  function escH(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function saveState(sel) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sel)); } catch(e) {} }
  function loadState()    { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; } }
  function saveResult(r)  { try { localStorage.setItem(RESULT_KEY, JSON.stringify(r)); } catch(e) {} }
  function loadResult()   { try { return JSON.parse(localStorage.getItem(RESULT_KEY)); } catch(e) { return null; } }

  function render(container, lang) {
    var saved = loadState();
    var L = lang === 'en';
    var allTracks = Object.keys(TRACK_LABELS);

    var trackRadios = '';
    for (var t = 0; t < allTracks.length; t++) {
      var tid = allTracks[t];
      trackRadios +=
        '<input type="radio" class="radio-opt" name="track" id="track-' + tid + '" value="' + tid + '"' + ((saved.track || 'natural') === tid ? ' checked' : '') + '>' +
        '<label for="track-' + tid + '">' + (TRACK_LABELS[tid][lang] || TRACK_LABELS[tid].ru) + '</label>';
    }

    var formatRadios =
      '<input type="radio" class="radio-opt" name="format" id="format-any" value=""><label for="format-any">' + (L ? 'Any' : 'Любой') + '</label>';
    for (var fi = 0; fi < FORMATS.length; fi++) {
      var f = FORMATS[fi];
      formatRadios +=
        '<input type="radio" class="radio-opt" name="format" id="fmt-' + f.id + '" value="' + f.id + '"' + (saved.format === f.id ? ' checked' : '') + '>' +
        '<label for="fmt-' + f.id + '">' + (f.icon || '') + ' ' + (f[lang] || f.ru) + '</label>';
    }

    var levelRadios = '';
    var levels = Object.keys(TEMPLATES.levelLabels);
    for (var li = 0; li < levels.length; li++) {
      var lid = levels[li];
      levelRadios +=
        '<input type="radio" class="radio-opt" name="level" id="level-' + lid + '" value="' + lid + '"' + ((saved.level || 'bachelor') === lid ? ' checked' : '') + '>' +
        '<label for="level-' + lid + '">' + (TEMPLATES.levelLabels[lid][lang] || TEMPLATES.levelLabels[lid].ru) + '</label>';
    }

    container.innerHTML =
      '<form id="solo-form" class="card" novalidate>' +
        '<h2 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem;color:var(--accent)">' +
          (L ? 'Solo Mode — Fill in the form' : 'Режим Соло — Заполните форму') +
        '</h2>' +
        '<div class="form-section"><div class="form-section__title">' + (L ? '1. Research track' : '1. Трек исследования') + '</div>' +
        '<div class="radio-group" id="track-group">' + trackRadios + '</div></div>' +
        '<div class="form-section"><div class="form-section__title">' + (L ? '2. Interests (up to 3)' : '2. Интересы (до 3)') + '</div>' +
        '<div class="checkbox-grid" id="interests-grid"></div></div>' +
        '<div class="form-section"><div class="form-section__title">' + (L ? '3. Your skills (up to 6)' : '3. Ваши навыки (до 6)') + '</div>' +
        '<div class="checkbox-grid" id="skills-grid"></div></div>' +
        '<div class="form-section"><div class="form-section__title">' + (L ? '4. Project format' : '4. Формат проекта') + '</div>' +
        '<div class="radio-group">' + formatRadios + '</div></div>' +
        '<div class="form-section"><div class="form-section__title">' + (L ? '5. Project level' : '5. Уровень проекта') + '</div>' +
        '<div class="radio-group">' + levelRadios + '</div></div>' +
        '<button type="submit" class="btn btn--generate">' + (L ? '✦ Generate idea' : '✦ Сгенерировать идею') + '</button>' +
      '</form>';

    function renderInterests(trackId) {
      var grid = document.getElementById('interests-grid');
      if (!grid) return;
      var items = INTERESTS[trackId] || [];
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        html +=
          '<input type="checkbox" class="checkbox-tag" id="int-' + item.id + '" value="' + item.id + '"' +
          ((saved.interests && saved.interests.indexOf(item.id) !== -1) ? ' checked' : '') + '>' +
          '<label for="int-' + item.id + '">' + (item[lang] || item.ru) + '</label>';
      }
      grid.innerHTML = html;
    }

    function renderSkills() {
      var grid = document.getElementById('skills-grid');
      if (!grid) return;
      var html = '';
      for (var i = 0; i < SKILLS.length; i++) {
        var s = SKILLS[i];
        html +=
          '<input type="checkbox" class="checkbox-tag" id="skill-' + s.id + '" value="' + s.id + '"' +
          ((saved.skills && saved.skills.indexOf(s.id) !== -1) ? ' checked' : '') + '>' +
          '<label for="skill-' + s.id + '">' + (s[lang] || s.ru) + '</label>';
      }
      grid.innerHTML = html;
    }

    var initialTrack = (container.querySelector('input[name="track"]:checked') || {}).value || 'natural';
    renderInterests(initialTrack);
    renderSkills();

    var trackGroup = document.getElementById('track-group');
    if (trackGroup) {
      trackGroup.addEventListener('change', function(e) {
        if (e.target && e.target.name === 'track') renderInterests(e.target.value);
      });
    }

    function limitChecks(gridId, max) {
      var grid = document.getElementById(gridId);
      if (!grid) return;
      grid.addEventListener('change', function(e) {
        if (!e.target || e.target.type !== 'checkbox') return;
        var checked = grid.querySelectorAll('input:checked');
        if (checked.length > max) e.target.checked = false;
      });
    }
    limitChecks('interests-grid', 3);
    limitChecks('skills-grid', 6);

    var lastResult = loadResult();
    if (lastResult) {
      renderResultCard(container, lastResult, lastResult._lang || lang);
      setResult(lastResult);
    }

    document.getElementById('solo-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var form = e.target;
      var selections = {
        track: (form.querySelector('input[name="track"]:checked') || {}).value || 'natural',
        interests: [].slice.call(form.querySelectorAll('#interests-grid input:checked')).map(function(el) { return el.value; }),
        skills:    [].slice.call(form.querySelectorAll('#skills-grid input:checked')).map(function(el) { return el.value; }),
        format:    (form.querySelector('input[name="format"]:checked') || {}).value || '',
        level:     (form.querySelector('input[name="level"]:checked') || {}).value || 'bachelor',
      };
      saveState(selections);

      var delay = Math.round(Math.random() * 1000 + 1500);
      var stopLoading = showLoading(delay);
      setTimeout(function() {
        stopLoading();
        var result = generate(selections, lang);
        result._lang = lang;
        saveResult(result);
        renderResultCard(container, result, lang);
        setResult(result);
        var ra = container.querySelector('.result-area');
        if (ra) ra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, delay);
    });
  }

  function restoreResult(result) {
    var container = document.getElementById('mode-container');
    renderResultCard(container, result, result._lang || 'ru');
    setResult(result);
  }

  window.MODES = window.MODES || {};
  window.MODES.solo = { render: render, restoreResult: restoreResult, generate: generate };
})();
