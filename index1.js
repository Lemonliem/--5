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

  /* Сброс всех фильтров (используется кнопкой «Сбросить» и каруселью) */
  function resetFilters() {
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
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
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

  /* ---------- 5. Карусель «Галерея вершин» ---------- */
  var carouselEl = document.getElementById('carousel');
  var carouselViewport = document.getElementById('carousel-viewport');
  var carouselTrack = document.getElementById('carousel-track');
  var carouselDots = document.getElementById('carousel-dots');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');

  if (carouselEl && carouselViewport && carouselTrack && carouselDots && prevBtn && nextBtn) {
    var slides = [];
    var index = 0;
    var autoplayTimer = null;
    var AUTOPLAY_MS = 4200;
    var suppressClick = false;

    /* Слайды строятся из карточек каталога: фото, название и ссылка на карточку */
    cards.forEach(function (card) {
      var img = card.querySelector('.mountain-card__media img');
      var titleEl = card.querySelector('.mountain-card__title');
      if (!img || !titleEl) return;

      var title = titleEl.textContent.trim();

      var slide = document.createElement('li');
      slide.className = 'carousel__slide';
      slide.setAttribute('role', 'button');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('aria-label', 'Прокрутить к карточке: ' + title);

      var media = document.createElement('div');
      media.className = 'carousel__media';

      var slideImg = new Image();
      slideImg.src = img.src;            /* те же локальные фото, что и в карточках */
      slideImg.alt = img.alt || title;
      slideImg.loading = 'lazy';
      slideImg.decoding = 'async';

      var caption = document.createElement('span');
      caption.className = 'carousel__caption';
      caption.textContent = title;

      media.appendChild(slideImg);
      slide.appendChild(media);
      slide.appendChild(caption);

      /* Клик (или Enter/Space) — плавный скролл к карточке в каталоге */
      slide._card = card; /* ссылка на карточку для делегированного клика */
      slide.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          scrollToCard(card);
        }
      });

      carouselTrack.appendChild(slide);
      slides.push(slide);
    });

    /* Делегированный клик по слайду: срабатывает даже после перетаскивания,
       когда событие click приходит на viewport, а не на сам слайд */
    function scrollToCard(cardRef) {
      if (!cardRef) return;
      if (suppressClick) { suppressClick = false; return; }
      var wasHidden = cardRef.hidden;
      if (wasHidden) resetFilters(); /* показываем скрытую фильтром карточку */
      window.setTimeout(function () {
        cardRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, wasHidden ? 120 : 0);
    }

    carouselViewport.addEventListener('click', function (event) {
      var target = event.target;
      var slide = target && target.closest ? target.closest('.carousel__slide') : null;
      if (slide && slide._card) scrollToCard(slide._card);
    });

    /* ---------- Геометрия и позиция ---------- */
    function getSlideWidth() {
      return slides.length ? slides[0].getBoundingClientRect().width : 1;
    }

    function getMaxIndex() {
      var visible = carouselViewport.clientWidth / getSlideWidth();
      return Math.max(0, slides.length - Math.round(visible));
    }

    function render() {
      if (!slides.length) return;
      index = Math.max(0, Math.min(index, getMaxIndex()));
      carouselTrack.style.transform =
        'translate3d(' + (-index * getSlideWidth()).toFixed(2) + 'px,0,0)';

      Array.prototype.forEach.call(carouselDots.children, function (dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function next() {
      index = index >= getMaxIndex() ? 0 : index + 1;
      render();
    }

    function prev() {
      index = index <= 0 ? getMaxIndex() : index - 1;
      render();
    }

    /* ---------- Автопрокрутка ---------- */
    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (slides.length < 2 || prefersReducedMotion.matches) return;
      autoplayTimer = window.setInterval(next, AUTOPLAY_MS);
    }

    /* ---------- Точки-индикаторы ---------- */
    slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Перейти к фото ' + (i + 1));
      dot.addEventListener('click', function () {
        index = i;
        render();
        startAutoplay();
      });
      carouselDots.appendChild(dot);
    });

    /* ---------- Стрелки ---------- */
    prevBtn.addEventListener('click', function () { prev(); startAutoplay(); });
    nextBtn.addEventListener('click', function () { next(); startAutoplay(); });

    /* ---------- Пауза при наведении, фокусе или касании ---------- */
    carouselEl.addEventListener('mouseenter', stopAutoplay);
    carouselEl.addEventListener('mouseleave', startAutoplay);
    carouselEl.addEventListener('touchstart', stopAutoplay, { passive: true });
    carouselEl.addEventListener('focusin', stopAutoplay);
    carouselEl.addEventListener('focusout', function () {
      if (!carouselEl.contains(document.activeElement)) startAutoplay();
    });

    /* ---------- Перетаскивание (мышь / палец) ----------
       Внимание: НЕ используем setPointerCapture — он перенаправляет
       событие click на контейнер, из-за чего клик по слайду не срабатывает.
       Движение отслеживаем на уровне документа. */
    var drag = { active: false, moved: false, pointerId: null, startX: 0, startIndex: 0 };

    function onDragMove(event) {
      if (!drag.active || event.pointerId !== drag.pointerId) return;
      var dx = event.clientX - drag.startX;
      if (Math.abs(dx) > 6) drag.moved = true;
      carouselTrack.style.transform =
        'translate3d(' + (-(drag.startIndex * getSlideWidth()) + dx).toFixed(2) + 'px,0,0)';
    }

    function endDrag(event) {
      if (!drag.active || event.pointerId !== drag.pointerId) return;
      drag.active = false;
      carouselTrack.style.transition = '';

      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', endDrag);
      document.removeEventListener('pointercancel', endDrag);

      if (event.type === 'pointercancel') {
        drag.moved = false;
        render();
        startAutoplay();
        return;
      }

      var dx = event.clientX - drag.startX;
      var sw = getSlideWidth();

      if (drag.moved) {
        if (Math.abs(dx) > sw * 0.18) {
          index = dx < 0 ? Math.min(index + 1, getMaxIndex()) : Math.max(index - 1, 0);
        } else {
          index = Math.max(0, Math.min(getMaxIndex(),
            Math.round((drag.startIndex * sw + dx) / sw)));
        }
        suppressClick = true; /* клик после перетаскивания не открывает карточку */
        window.setTimeout(function () { suppressClick = false; }, 0);
      }
      render();
      startAutoplay();
    }

    carouselViewport.addEventListener('pointerdown', function (event) {
      drag.active = true;
      drag.moved = false;
      drag.pointerId = event.pointerId;
      suppressClick = false;
      drag.startX = event.clientX;
      drag.startIndex = index;
      carouselTrack.style.transition = 'none';
      stopAutoplay();
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', endDrag);
      document.addEventListener('pointercancel', endDrag);
    });

    /* ---------- Пересчёт при изменении ширины окна ---------- */
    var resizeTicking = false;
    window.addEventListener('resize', function () {
      if (resizeTicking) return;
      resizeTicking = true;
      window.requestAnimationFrame(function () {
        resizeTicking = false;
        render();
      });
    });

    render();
    startAutoplay();
  }

  /* ---------- 6. Кнопка «К галерее» (быстрый возврат к карусели) ---------- */
  var toGalleryBtn = document.getElementById('to-gallery');
  var gallerySection = document.getElementById('gallery');

  if (toGalleryBtn && gallerySection) {
    var galleryTicking = false;
    var galleryShown = false;

    function updateGalleryButton() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var galleryBottom = gallerySection.offsetTop + gallerySection.offsetHeight;
      /* Показываем кнопку, когда галерея практически ушла из виду */
      var shouldShow = scrollY > galleryBottom - window.innerHeight * 0.35;
      if (shouldShow !== galleryShown) {
        galleryShown = shouldShow;
        toGalleryBtn.classList.toggle('is-visible', shouldShow);
      }
    }

    window.addEventListener('scroll', function () {
      if (!galleryTicking) {
        galleryTicking = true;
        window.requestAnimationFrame(function () {
          galleryTicking = false;
          updateGalleryButton();
        });
      }
    }, { passive: true });

    window.addEventListener('resize', updateGalleryButton);

    toGalleryBtn.addEventListener('click', function () {
      var behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
      gallerySection.scrollIntoView({ behavior: behavior, block: 'start' });
    });

    updateGalleryButton();
  }

})();