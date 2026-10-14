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
  if (window.Flickity) {
    new Flickity('.hero-slider', {
      cellAlign: 'center', imagesLoaded: true, wrapAround: true, autoPlay: 6000,
      pauseAutoPlayOnHover: true, prevNextButtons: true, contain: true, adaptiveHeight: true,
      dragThreshold: 10, percentPosition: true, pageDots: true, draggable: true,
      selectedAttraction: 0.1, friction: 0.6
    });

    new Flickity('.news-slider', {
      cellAlign: 'left', imagesLoaded: true, groupCells: '100%', dragThreshold: 5,
      wrapAround: true, prevNextButtons: true, percentPosition: true, pageDots: false, autoPlay: false
    });

    new Flickity('.press-slider', {
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
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

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
