/* Trang Hệ thống đại lý: bản đồ + tìm kiếm cửa hàng (thay cho plugin DevVN Local Store) */
(function () {
  'use strict';

  var stores = window.NANO_STORES || [];
  var cities = window.NANO_CITIES || [];
  var keyword = document.getElementById('ls-keyword');
  var citySel = document.getElementById('ls-city');
  var distSel = document.getElementById('ls-district');
  var results = document.querySelector('.localstore-results');
  var count = document.querySelector('.ls-count');
  var nearBtn = document.querySelector('.find-near');
  var nearPoint = null;

  // So khớp không dấu: "da nang" khớp "Đà Nẵng"
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------- Danh sách tỉnh / quận ---------- */
  cities.forEach(function (c, i) {
    var o = document.createElement('option');
    o.value = i; o.textContent = c.name;
    citySel.appendChild(o);
  });
  citySel.addEventListener('change', function () {
    distSel.innerHTML = '<option value="">Quận/Huyện</option>';
    var c = cities[citySel.value];
    if (c) c.d.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d; o.textContent = d;
      distSel.appendChild(o);
    });
    nearPoint = null;
    update(true);
  });
  distSel.addEventListener('change', function () { update(true); });
  keyword.addEventListener('input', function () { update(false); });
  document.querySelector('.localstore-form').addEventListener('submit', function () { update(true); });

  /* ---------- Bản đồ ---------- */
  var map = null, markers = [];
  if (window.L) {
    map = L.map('ls-map', { scrollWheelZoom: false }).setView([16.0, 106.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    map.on('click', function () { map.scrollWheelZoom.enable(); });
  } else {
    document.getElementById('ls-map').innerHTML = '<p style="padding:20px">Không tải được bản đồ. Vui lòng kiểm tra kết nối mạng.</p>';
  }
  function pin(active) {
    return L.divIcon({ className: '', html: '<div class="store-pin' + (active ? ' active' : '') + '"></div>', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -26] });
  }
  function popupHtml(s) {
    return '<strong>' + esc(s.name) + '</strong><br>' + esc(s.address || '') +
      (s.phone ? '<br>☎ <a href="tel:' + s.phone.replace(/\D/g, '') + '">' + esc(s.phone) + '</a>' : '') +
      '<br><a href="https://www.google.com/maps/dir/Current+Location/' + s.lat + ',' + s.lng + '" target="_blank" rel="noopener">Chỉ đường</a>';
  }

  /* ---------- Lọc & hiển thị ---------- */
  var current = [];
  function update(fit) {
    var kw = norm(keyword.value);
    var city = cities[citySel.value];
    var dist = distSel.value;
    current = stores.map(function (s, i) { return Object.assign({ idx: i }, s); }).filter(function (s) {
      var addr = norm(s.address);
      if (kw && norm(s.name).indexOf(kw) < 0 && addr.indexOf(kw) < 0) return false;
      if (city) {
        var keys = [city.name].concat(city.d).map(function (n) { return norm(n).replace(/^(tp\.?|thanh pho|p\.|q\.) ?/, ''); });
        if (!keys.some(function (k) { return k && addr.indexOf(k) >= 0; })) return false;
      }
      if (dist && addr.indexOf(norm(dist).replace(/^(tp\.?|p\.|q\.) ?/, '')) < 0) return false;
      if (nearPoint) {
        s.km = distanceKm(nearPoint, s);
        if (s.km > 20) return false;
      }
      return true;
    });
    if (nearPoint) current.sort(function (a, b) { return a.km - b.km; });

    count.textContent = 'Tìm thấy ' + current.length + ' đại lý' + (nearPoint ? ' trong bán kính 20km' : '');
    results.innerHTML = current.length ? current.map(function (s) {
      return '<div class="store-item" data-idx="' + s.idx + '" tabindex="0">' +
        (s.km != null && nearPoint ? '<span class="dist">' + s.km.toFixed(1) + ' km</span>' : '') +
        '<strong>' + esc(s.name) + '</strong>' +
        '<p>' + esc(s.address || '') + '</p>' +
        (s.phone ? '<p>☎ ' + esc(s.phone) + '</p>' : '') +
        '<a class="dir" href="https://www.google.com/maps/dir/Current+Location/' + s.lat + ',' + s.lng + '" target="_blank" rel="noopener">➤ Chỉ đường</a>' +
        '</div>';
    }).join('') : '<p style="padding:15px">Không tìm thấy đại lý phù hợp.</p>';

    if (!map) return;
    markers.forEach(function (m) { map.removeLayer(m); });
    markers = current.map(function (s) {
      var m = L.marker([s.lat, s.lng], { icon: pin(false), title: s.name }).addTo(map).bindPopup(popupHtml(s));
      m.on('click', function () { highlight(s.idx, false); });
      m.storeIdx = s.idx;
      return m;
    });
    if (fit && markers.length) {
      var group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 14 });
    }
  }

  function highlight(idx, fly) {
    results.querySelectorAll('.store-item').forEach(function (el) {
      var on = +el.getAttribute('data-idx') === idx;
      el.classList.toggle('active', on);
      if (on && !fly) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    markers.forEach(function (m) {
      m.setIcon(pin(m.storeIdx === idx));
      if (m.storeIdx === idx && fly) {
        map.flyTo(m.getLatLng(), 15, { duration: .8 });
        m.openPopup();
      }
    });
  }
  results.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var item = e.target.closest('.store-item');
    if (item && map) highlight(+item.getAttribute('data-idx'), true);
  });
  results.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('store-item') && map) highlight(+e.target.getAttribute('data-idx'), true);
  });

  /* ---------- Tìm cửa hàng gần bạn ---------- */
  nearBtn.addEventListener('click', function () {
    if (!navigator.geolocation) { alert('Trình duyệt không hỗ trợ định vị.'); return; }
    nearBtn.disabled = true;
    nearBtn.textContent = 'Đang xác định vị trí…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      nearPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      citySel.value = ''; distSel.innerHTML = '<option value="">Quận/Huyện</option>'; keyword.value = '';
      nearBtn.disabled = false;
      nearBtn.textContent = 'Tìm kiếm cửa hàng gần bạn (<=20km)';
      if (map) L.circle([nearPoint.lat, nearPoint.lng], { radius: 20000, color: '#844e9f', weight: 1, fillOpacity: .06 }).addTo(map);
      update(true);
      if (map && !current.length) map.setView([nearPoint.lat, nearPoint.lng], 10);
    }, function () {
      nearBtn.disabled = false;
      nearBtn.textContent = 'Tìm kiếm cửa hàng gần bạn (<=20km)';
      alert('Không lấy được vị trí của bạn. Vui lòng cho phép truy cập vị trí và thử lại.');
    }, { timeout: 10000 });
  });

  update(true);
})();
