/* Trang Shop: lọc theo dòng phim, sắp xếp, phân trang, xem nhanh */
(function () {
  'use strict';

  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  var cols = Array.prototype.slice.call(grid.querySelectorAll('.product-col'));
  var perPage = parseInt(grid.getAttribute('data-per-page'), 10) || 12;
  var nav = document.querySelector('.shop-main .pagination');
  var empty = document.querySelector('.no-products');
  var orderby = document.querySelector('.orderby');
  var crumb = document.querySelector('.current-crumb');
  var catLinks = document.querySelectorAll('.product-categories a');

  /* ---------- Lọc + sắp xếp + phân trang ---------- */
  function render() {
    var filter = location.hash.replace('#', '');
    var sort = orderby.value;
    var visible = cols.filter(function (c) { return !filter || c.getAttribute('data-cat') === filter; });
    cols.forEach(function (c) { c.hidden = true; });

    visible.sort(function (a, b) {
      var k = sort === 'menu_order' ? 'data-order' : 'data-price';
      var d = parseInt(a.getAttribute(k), 10) - parseInt(b.getAttribute(k), 10);
      return sort === 'price-desc' ? -d : d;
    });
    visible.forEach(function (c) { grid.appendChild(c); });

    empty.hidden = visible.length > 0;
    window.NanoPaginate(visible, perPage, nav);

    var active = null;
    catLinks.forEach(function (a) {
      var on = a.getAttribute('data-filter') === filter;
      a.classList.toggle('active', on);
      if (on && filter) active = a.textContent;
    });
    crumb.textContent = active || 'Shop';
  }
  orderby.addEventListener('change', render);
  window.addEventListener('hashchange', function () { render(); closeSidebar(); });
  render();

  /* ---------- Sidebar lọc ---------- */
  var body = document.body;
  var filterBtn = document.querySelector('.filter-button');
  function closeSidebar() {
    body.classList.remove('shop-filter-open');
    filterBtn.setAttribute('aria-expanded', 'false');
  }
  filterBtn.addEventListener('click', function () {
    body.classList.add('shop-filter-open');
    filterBtn.setAttribute('aria-expanded', 'true');
  });
  document.querySelector('.shop-overlay').addEventListener('click', closeSidebar);
  document.querySelector('.sidebar-close').addEventListener('click', closeSidebar);
  catLinks.forEach(function (a) {
    if (!a.getAttribute('data-filter')) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        history.pushState('', document.title, location.pathname + location.search);
        render();
        closeSidebar();
      });
    }
  });

  /* ---------- Xem nhanh ---------- */
  var modal = document.querySelector('.quick-view-modal');
  var q = function (s) { return modal.querySelector(s); };
  var areaSelect = q('#qv-area');
  var fmt = function (n) { return Number(n).toLocaleString('vi-VN') + ' ₫'; };
  var lastFocus = null;

  function openQuickView(data) {
    q('.qv-image img').src = data.img;
    q('.qv-image img').alt = data.name;
    q('.qv-cat').textContent = data.cat;
    q('.qv-title').textContent = data.name;
    q('.qv-price').textContent = data.prices.map(function (p) { return p + ' ₫'; }).join(' – ');
    q('.qv-desc').textContent = data.desc || 'Vui lòng liên hệ trực tiếp chúng tôi để được tư vấn và báo giá tốt nhất!';

    var vars = data.variations || [];
    var opts = data.options && data.options.length ? data.options : vars.map(function (v) { return v.label; });
    q('.qv-variation').hidden = !opts.length;
    areaSelect.innerHTML = '<option value="">Chọn một tùy chọn</option>' + opts.map(function (o) {
      return '<option>' + o.replace(/</g, '&lt;') + '</option>';
    }).join('');
    areaSelect.onchange = function () {
      var v = vars.filter(function (x) { return x.label === areaSelect.value; })[0];
      q('.qv-var-price').textContent = !areaSelect.value ? '' : v ? fmt(v.price) + ' / m²' : 'Liên hệ để có giá tốt nhất';
    };
    if (opts.length) { areaSelect.selectedIndex = 1; areaSelect.onchange(); }

    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    q('.qv-close').focus();
  }
  function closeQuickView() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  grid.addEventListener('click', function (e) {
    var trigger = e.target.closest('.quick-view-trigger');
    if (!trigger) return;
    e.preventDefault();
    var json = trigger.closest('.product-small').querySelector('.product-data').textContent;
    openQuickView(JSON.parse(json));
  });
  q('.qv-close').addEventListener('click', closeQuickView);
  q('.qv-backdrop').addEventListener('click', closeQuickView);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeQuickView();
    closeSidebar();
  });
})();
