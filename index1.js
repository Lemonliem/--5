/* ============================================================
   ЛОГИКА СТРАНИЦЫ (vanilla JS, без библиотек)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Мобильное меню («бургер») ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('primary-nav');

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      burger.classList.toggle('is-active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });

    /* Закрываем меню после клика по ссылке */
    Array.prototype.forEach.call(nav.querySelectorAll('.nav__link'), function (link) {
      link.addEventListener('click', closeNav);
    });

    /* Закрытие по Escape */
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    /* Закрытие по клику вне панели */
    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(event.target) && !burger.contains(event.target)) closeNav();
    });
  }

  /* ---------- 2. Фильтрация карточек ---------- */
  var pillGroups = document.querySelectorAll('[data-filter-group]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.mountain-card'));
  var counter = document.getElementById('filter-count');
  var emptyState = document.getElementById('catalog-empty');
  var resetBtn = document.getElementById('reset-filters');

  /* Текущее состояние фильтров */
  var state = {
    height: 'all',
    difficulty: 'all',
    region: 'all'
  };

  /* Проверка попадания высоты в выбранный диапазон */
  function matchesHeight(height, range) {
    if (range === 'low') return height < 5000;
    if (range === 'mid') return height >= 5000 && height <= 7000;
    if (range === 'high') return height > 7000;
    return true;
  }

  /* Применение всех фильтров к карточкам */
  function applyFilters() {
    var visibleCount = 0;

    cards.forEach(function (card) {
      var height = parseInt(card.getAttribute('data-height'), 10);
      var difficulty = card.getAttribute('data-difficulty');
      var region = card.getAttribute('data-region');

      var isMatch =
        matchesHeight(height, state.height) &&
        (state.difficulty === 'all' || difficulty === state.difficulty) &&
        (state.region === 'all' || region === state.region);

      card.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });

    if (counter) {
      counter.textContent = 'Показано ' + visibleCount + ' из ' + cards.length;
    }
    if (emptyState) {
      emptyState.classList.toggle('is-visible', visibleCount === 0);
    }
  }

  /* Обработка кликов по «пилюлям» */
  Array.prototype.forEach.call(pillGroups, function (group) {
    var key = group.getAttribute('data-filter-group');
    var pills = group.querySelectorAll('.pill');

    Array.prototype.forEach.call(pills, function (pill) {
      pill.addEventListener('click', function () {
        Array.prototype.forEach.call(pills, function (item) {
          item.classList.remove('is-active');
          item.setAttribute('aria-pressed', 'false');
        });

        pill.classList.add('is-active');
        pill.setAttribute('aria-pressed', 'true');

        state[key] = pill.getAttribute('data-value');
        applyFilters();
      });
    });
  });

  /* Сброс всех фильтров */
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      Array.prototype.forEach.call(pillGroups, function (group) {
        var key = group.getAttribute('data-filter-group');
        var pills = group.querySelectorAll('.pill');

        Array.prototype.forEach.call(pills, function (pill) {
          var isDefault = pill.getAttribute('data-value') === 'all';
          pill.classList.toggle('is-active', isDefault);
          pill.setAttribute('aria-pressed', String(isDefault));
        });

        state[key] = 'all';
      });

      applyFilters();
    });
  }

  /* Первичная отрисовка счётчика */
  applyFilters();

  /* ---------- 3. Лёгкий параллакс в hero ---------- */
  var mountains = document.getElementById('hero-mountains');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ticking = false;

  function updateParallax() {
    ticking = false;
    if (!mountains || prefersReducedMotion.matches) return;

    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var limit = window.innerHeight * 1.2;

    if (scrollY <= limit) {
      mountains.style.transform = 'translate3d(0,' + (scrollY * 0.12).toFixed(2) + 'px,0)';
    }
  }

  if (mountains && !prefersReducedMotion.matches) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
  }

  /* ---------- 4. Автосворачивание «Подробнее» при скролле ---------- */
  if ('IntersectionObserver' in window) {
    var detailsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          var details = entry.target.querySelector('.mountain-card__details');
          if (details && details.hasAttribute('open')) {
            details.removeAttribute('open');
          }
        }
      });
    }, { threshold: 0 });

    cards.forEach(function (card) {
      detailsObserver.observe(card);
    });
  }

})();