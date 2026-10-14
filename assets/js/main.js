/* Nano Ceramic Window Films – tương tác trang chủ */
(function () {
  'use strict';

  var body = document.body;
  var headerWrapper = document.querySelector('.header-wrapper');
  var header = document.getElementById('header');
  var topLink = document.getElementById('top-link');

  /* ---------- Sticky header (kiểu "sticky-jump" của Flatsome) ---------- */
  var stuck = false;
  function onScroll() {
    var y = window.pageYOffset;
    var trigger = header.offsetTop + headerWrapper.offsetHeight + 100;
    if (y > trigger && !stuck) {
      header.style.height = headerWrapper.offsetHeight + 'px'; // giữ chỗ để trang không nhảy
      headerWrapper.classList.add('stuck');
      stuck = true;
    } else if (y <= header.offsetTop + 10 && stuck) {
      headerWrapper.classList.remove('stuck');
      header.style.height = '';
      stuck = false;
    }
    topLink.classList.toggle('active', y > window.innerHeight);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Nút lên đầu trang ---------- */
  topLink.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Menu mobile (off-canvas bên phải) ---------- */
  var menuToggle = document.querySelector('.menu-toggle');
  var overlay = document.getElementById('menu-overlay');
  var sidebar = document.getElementById('main-menu');
  var closeBtn = sidebar.querySelector('.mfp-close');

  function openMenu() {
    body.classList.add('menu-open');
    sidebar.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    body.classList.remove('menu-open');
    sidebar.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  menuToggle.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);
  closeBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeSearch(); } });
  sidebar.querySelectorAll('.toggle').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.parentElement.classList.toggle('open'); });
  });
  sidebar.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { if (a.getAttribute('href').length > 1) closeMenu(); });
  });

  /* ---------- Tìm kiếm mobile (dropdown) ---------- */
  var searchWrap = document.querySelector('.mobile-search');
  var searchToggle = searchWrap.querySelector('.search-toggle');
  function closeSearch() { searchWrap.classList.remove('open'); searchToggle.setAttribute('aria-expanded', 'false'); }
  searchToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = searchWrap.classList.toggle('open');
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchWrap.querySelector('input').focus();
  });
  document.addEventListener('click', function (e) { if (!searchWrap.contains(e.target)) closeSearch(); });

  /* ---------- Sliders (Flickity, cùng tuỳ chọn với trang gốc) ---------- */
  function slider(selector, options) {
    var el = document.querySelector(selector);
    if (el && window.Flickity) new Flickity(el, options);
  }
  if (window.Flickity) {
    slider('.hero-slider', {
      cellAlign: 'center', imagesLoaded: true, wrapAround: true, autoPlay: 6000,
      pauseAutoPlayOnHover: true, prevNextButtons: true, contain: true, adaptiveHeight: true,
      dragThreshold: 10, percentPosition: true, pageDots: true, draggable: true,
      selectedAttraction: 0.1, friction: 0.6
    });

    slider('.news-slider', {
      cellAlign: 'left', imagesLoaded: true, groupCells: '100%', dragThreshold: 5,
      wrapAround: true, prevNextButtons: true, percentPosition: true, pageDots: false, autoPlay: false
    });

    slider('.press-slider', {
      cellAlign: 'center', imagesLoaded: true, freeScroll: true, wrapAround: true, autoPlay: 4000,
      pauseAutoPlayOnHover: false, prevNextButtons: true, contain: true, adaptiveHeight: true,
      dragThreshold: 10, percentPosition: true, pageDots: false, draggable: true,
      selectedAttraction: 0.1, friction: 0.6
    });
  }

  /* ---------- Ảnh lazy hiện dần ---------- */
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) img.classList.add('loaded');
    else {
      img.addEventListener('load', function () { img.classList.add('loaded'); });
      img.addEventListener('error', function () { img.classList.add('loaded'); });
    }
  });

  /* ---------- Hiệu ứng xuất hiện khi cuộn ---------- */
  var reveals = document.querySelectorAll('.reveal, .animate-up, .counter');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in-view');
        if (en.target.classList.contains('counter')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Đếm số (trang Về chúng tôi) ---------- */
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null, dur = 1600;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString('vi-VN') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Parallax nền (section .has-parallax) ---------- */
  var parallax = document.querySelectorAll('.has-parallax .section-bg img');
  if (parallax.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ticking = false;
    var updateParallax = function () {
      parallax.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var offset = (r.top + r.height / 2 - window.innerHeight / 2) * -0.15;
        img.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.15)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ---------- Nút "cuộn để xem thêm" (trang PPF) ---------- */
  document.querySelectorAll('.scroll-for-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.closest('section').nextElementSibling;
      if (next) window.scrollTo({ top: next.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
    });
  });

  /* ---------- Phân trang phía trình duyệt (danh sách bài viết) ---------- */
  window.NanoPaginate = function (items, perPage, nav, onChange) {
    var pages = Math.ceil(items.length / perPage);
    function show(page, scroll) {
      items.forEach(function (it, i) { it.hidden = i < (page - 1) * perPage || i >= page * perPage; });
      nav.innerHTML = '';
      if (pages > 1) {
        for (var p = 1; p <= pages; p++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = p;
          if (p === page) { b.className = 'current'; b.setAttribute('aria-current', 'page'); }
          b.addEventListener('click', show.bind(null, p, true));
          nav.appendChild(b);
        }
        if (page < pages) {
          var next = document.createElement('button');
          next.type = 'button';
          next.setAttribute('aria-label', 'Tiếp theo');
          next.innerHTML = '<i class="icon-angle-right"></i>';
          next.addEventListener('click', show.bind(null, page + 1, true));
          nav.appendChild(next);
        }
      }
      if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
      if (onChange) onChange(page);
    }
    show(1, false);
    return show;
  };
  document.querySelectorAll('.post-list[data-paginate]').forEach(function (list) {
    var items = Array.prototype.slice.call(list.querySelectorAll('.post-item'));
    window.NanoPaginate(items, parseInt(list.getAttribute('data-paginate'), 10), list.nextElementSibling);
  });

  /* ---------- Cuộn mượt tới anchor, trừ chiều cao header dính ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (id.length < 2) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
      return;
    }
    a.addEventListener('click', function (e) {
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();
