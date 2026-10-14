/* Trang Hệ thống đại lý – giao diện kiểu Google Maps, liên kết sang Google Maps */
(function () {
  'use strict';

  var stores = (window.NANO_STORES || []).map(function (s, i) { return Object.assign({ id: i }, s); });
  var cities = window.NANO_CITIES || [];
  var root = document.getElementById('gmap');
  var panel = root.querySelector('.gm-panel');
  var q = document.getElementById('gm-q');
  var clearBtn = root.querySelector('.gm-clear');
  var citySel = document.getElementById('gm-city');
  var distSel = document.getElementById('gm-district');
  var nearChip = root.querySelector('.gm-near');
  var resultsEl = root.querySelector('.gm-results');
  var countEl = root.querySelector('.gm-count');
  var listView = root.querySelector('.gm-list-view');
  var detailView = root.querySelector('.gm-detail-view');
  var toastEl = root.querySelector('.gm-toast');
  var isMobile = function () { return window.matchMedia('(max-width: 849px)').matches; };

  var nearPoint = null;
  var current = [];
  var selectedId = null;

  /* ---------- Tiện ích ---------- */
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- Liên kết Google Maps ---------- */
  var gmaps = {
    // Tìm theo tên + địa chỉ để Google mở đúng trang địa điểm của cửa hàng
    place: function (s) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ', ' + (s.address || '')); },
    // Chỉ đường tới toạ độ chính xác
    dir: function (s) { return 'https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng; }
  };
  function telHref(phone) { return 'tel:' + String(phone).replace(/[^\d+]/g, ''); }

  /* ---------- Bản đồ ---------- */
  var map = null, cluster = null, markerById = {}, userMarker = null, nearCircle = null;
  var baseLayers = {};
  if (window.L) {
    map = L.map('gm-canvas', { zoomControl: false, attributionControl: true, worldCopyJump: true }).setView([16.2, 106.3], 6);
    baseLayers.map = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Bản đồ &copy; Esri, HERE, Garmin, &copy; OpenStreetMap'
    }).addTo(map);
    baseLayers.sat = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Ảnh vệ tinh &copy; Esri' }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 })
    ]);
    map.attributionControl.setPrefix(false);

    cluster = L.markerClusterGroup ? L.markerClusterGroup({
      showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 50,
      iconCreateFunction: function (c) {
        var n = c.getChildCount();
        var size = n < 10 ? 34 : n < 50 ? 40 : 46;
        return L.divIcon({ html: '<div class="gm-cluster"><span>' + n + '</span></div>', className: '', iconSize: [size, size] });
      }
    }) : L.layerGroup();
    map.addLayer(cluster);
    map.on('click', function () { if (isMobile()) setSheet('peek'); });
  } else {
    document.getElementById('gm-canvas').innerHTML = '<p class="gm-map-error">Không tải được bản đồ. Vui lòng kiểm tra kết nối mạng.</p>';
  }

  // Ghim đỏ kiểu Google Maps
  function pinIcon(active) {
    var w = active ? 36 : 27, h = active ? 52 : 39;
    return L.divIcon({
      className: 'gm-pin' + (active ? ' is-active' : ''),
      html: '<svg viewBox="0 0 27 39" width="' + w + '" height="' + h + '"><path d="M13.5 0C6 0 0 6 0 13.4 0 23.5 13.5 39 13.5 39S27 23.5 27 13.4C27 6 21 0 13.5 0z" fill="#EA4335" stroke="#B31412" stroke-width="1"/><circle cx="13.5" cy="13.5" r="4.6" fill="#B31412"/></svg>',
      iconSize: [w, h], iconAnchor: [w / 2, h], popupAnchor: [0, -h + 4]
    });
  }

  stores.forEach(function (s) {
    if (!map) return;
    var m = L.marker([s.lat, s.lng], { icon: pinIcon(false), title: s.name, riseOnHover: true });
    m.bindTooltip(esc(s.name), { direction: 'top', offset: [0, -36], className: 'gm-tip' });
    m.on('click', function () { openDetail(s.id, true); });
    markerById[s.id] = m;
  });

  /* ---------- Bộ lọc ---------- */
  cities.forEach(function (c, i) {
    citySel.insertAdjacentHTML('beforeend', '<option value="' + i + '">' + esc(c.name) + '</option>');
  });
  citySel.addEventListener('change', function () {
    var c = cities[citySel.value];
    distSel.innerHTML = '<option value="">Quận/Huyện</option>' + (c ? c.d.map(function (d) { return '<option>' + esc(d) + '</option>'; }).join('') : '');
    distSel.disabled = !c;
    citySel.parentElement.classList.toggle('is-on', !!c);
    distSel.parentElement.classList.remove('is-on');
    setNear(null);
    apply(true);
  });
  distSel.addEventListener('change', function () {
    distSel.parentElement.classList.toggle('is-on', !!distSel.value);
    apply(true);
  });
  q.addEventListener('input', function () {
    clearBtn.hidden = !q.value;
    apply(false);
  });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { apply(true); if (current[0] && current.length === 1) openDetail(current[0].id, true); }
  });
  clearBtn.addEventListener('click', function () { q.value = ''; clearBtn.hidden = true; apply(true); q.focus(); });

  function matches(s) {
    var kw = norm(q.value), addr = norm(s.address);
    if (kw && norm(s.name + ' ' + s.address + ' ' + (s.phone || '')).indexOf(kw) < 0) return false;
    var c = cities[citySel.value];
    if (c) {
      var keys = [c.name].concat(c.d).map(function (n) { return norm(n).replace(/^(tp\.?|thanh pho|p\.|q\.) ?/, ''); });
      if (!keys.some(function (k) { return k && addr.indexOf(k) >= 0; })) return false;
    }
    if (distSel.value && addr.indexOf(norm(distSel.value).replace(/^(tp\.?|p\.|q\.) ?/, '')) < 0) return false;
    if (nearPoint && s.dist > 20) return false;
    return true;
  }

  function apply(fit) {
    stores.forEach(function (s) { s.dist = nearPoint ? km(nearPoint, s) : null; });
    current = stores.filter(matches);
    if (nearPoint) current.sort(function (a, b) { return a.dist - b.dist; });
    renderList();
    if (!map) return;
    cluster.clearLayers();
    current.forEach(function (s) { cluster.addLayer(markerById[s.id]); });
    if (fit && current.length) {
      var b = L.latLngBounds(current.map(function (s) { return [s.lat, s.lng]; }));
      if (nearPoint) b.extend([nearPoint.lat, nearPoint.lng]);
      fitBounds(b, 14);
    }
  }

  // Chừa chỗ cho panel trái khi căn khung bản đồ
  function fitBounds(bounds, maxZoom) {
    var leftPad = !isMobile() && !root.classList.contains('panel-collapsed') ? panel.offsetWidth + 24 : 20;
    var bottomPad = isMobile() ? Math.min(panel.offsetHeight, window.innerHeight * 0.45) : 20;
    map.fitBounds(bounds, { paddingTopLeft: [leftPad, 70], paddingBottomRight: [60, bottomPad + 20], maxZoom: maxZoom || 15 });
  }

  /* ---------- Danh sách ---------- */
  function renderList() {
    countEl.textContent = current.length
      ? 'Kết quả · ' + current.length + ' đại lý' + (nearPoint ? ' trong 20km' : '')
      : '';
    if (!current.length) {
      resultsEl.innerHTML = '<div class="gm-empty"><strong>Không tìm thấy đại lý</strong><p>Hãy thử từ khoá khác, chọn "Toàn quốc", hoặc gọi hotline <a href="tel:0774565888">077 4565 888</a> để được hỗ trợ.</p></div>';
      return;
    }
    resultsEl.innerHTML = current.map(function (s) {
      return '<div class="gm-item' + (s.id === selectedId ? ' is-active' : '') + '" role="listitem" tabindex="0" data-id="' + s.id + '">' +
        '<div class="gm-item-main">' +
          '<div class="gm-item-name">' + esc(s.name) + '</div>' +
          '<div class="gm-item-meta">Đại lý phim cách nhiệt' + (s.dist != null ? ' · ' + s.dist.toFixed(1) + ' km' : '') + '</div>' +
          '<div class="gm-item-addr">' + esc(s.address || '') + '</div>' +
          (s.phone ? '<div class="gm-item-phone">' + esc(s.phone) + '</div>' : '') +
        '</div>' +
        '<a class="gm-item-dir" href="' + gmaps.dir(s) + '" target="_blank" rel="noopener" title="Chỉ đường trên Google Maps" aria-label="Chỉ đường tới ' + esc(s.name) + '">' +
          '<svg viewBox="0 0 24 24"><path d="M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>' +
          '<span>Đường đi</span></a>' +
      '</div>';
    }).join('');
  }
  resultsEl.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var item = e.target.closest('.gm-item');
    if (item) openDetail(+item.getAttribute('data-id'), true);
  });
  resultsEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('gm-item')) openDetail(+e.target.getAttribute('data-id'), true);
  });
  // Rê chuột vào danh sách -> làm nổi ghim tương ứng
  resultsEl.addEventListener('mouseover', function (e) {
    var item = e.target.closest('.gm-item');
    var id = item ? +item.getAttribute('data-id') : null;
    Object.keys(markerById).forEach(function (k) {
      var el = markerById[k].getElement();
      if (el) el.classList.toggle('is-hover', +k === id);
    });
  });

  /* ---------- Chi tiết ---------- */
  function setPin(id, active) {
    var m = markerById[id];
    if (m) { m.setIcon(pinIcon(active)); m.setZIndexOffset(active ? 1000 : 0); }
  }
  function openDetail(id, fly) {
    var s = stores[id];
    if (!s) return;
    if (selectedId != null) setPin(selectedId, false);
    selectedId = id;

    detailView.querySelector('.gm-name').textContent = s.name;
    detailView.querySelector('.gm-act-dir').href = gmaps.dir(s);
    detailView.querySelector('.gm-act-open').href = gmaps.place(s);
    detailView.querySelector('.gm-open-big').href = gmaps.place(s);
    detailView.querySelector('.gm-info-addr .gm-info-text').textContent = s.address || '';
    var call = detailView.querySelector('.gm-act-call');
    var phoneRow = detailView.querySelector('.gm-info-phone');
    var phone = s.phone || '077 4565 888';
    call.href = telHref(phone);
    phoneRow.querySelector('a').href = telHref(phone);
    phoneRow.querySelector('a').textContent = s.phone ? s.phone : '077 4565 888 (Hotline Nano Ceramic)';
    detailView.querySelector('.gm-info-coord .gm-info-text').textContent = s.lat.toFixed(6) + ', ' + s.lng.toFixed(6);

    listView.hidden = true;
    detailView.hidden = false;
    detailView.scrollTop = 0;
    panel.classList.add('is-detail');
    if (history.replaceState) history.replaceState(null, '', '#dai-ly-' + id);

    if (map) {
      var m = markerById[id];
      var show = function () {
        setPin(id, true);
        if (fly) {
          var target = L.latLng(s.lat, s.lng);
          var z = Math.max(map.getZoom(), 15);
          // dịch tâm để ghim không bị panel che
          var pt = map.project(target, z);
          if (isMobile()) pt = pt.add([0, window.innerHeight * 0.18]);
          else if (!root.classList.contains('panel-collapsed')) pt = pt.subtract([panel.offsetWidth / 2, 0]);
          map.flyTo(map.unproject(pt, z), z, { duration: .8 });
        }
      };
      if (cluster.zoomToShowLayer && cluster.hasLayer(m)) cluster.zoomToShowLayer(m, show); else show();
    }
    if (isMobile()) setSheet('half');
  }
  function closeDetail() {
    if (selectedId != null) setPin(selectedId, false);
    selectedId = null;
    detailView.hidden = true;
    listView.hidden = false;
    panel.classList.remove('is-detail');
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    renderList();
  }
  detailView.querySelector('.gm-back').addEventListener('click', closeDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !detailView.hidden) closeDetail(); });

  detailView.querySelector('.gm-copy').addEventListener('click', function () {
    var s = stores[selectedId];
    copy(s.name + ' – ' + s.address, 'Đã sao chép địa chỉ');
  });
  detailView.querySelector('.gm-act-share').addEventListener('click', function () {
    var s = stores[selectedId];
    var url = location.href.split('#')[0] + '#dai-ly-' + s.id;
    if (navigator.share) {
      navigator.share({ title: s.name + ' – Đại lý Nano Ceramic', text: s.address, url: url }).catch(function () {});
    } else {
      copy(url, 'Đã sao chép liên kết đại lý');
    }
  });
  function copy(text, msg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(msg); }, function () { toast(text); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg); } catch (e) { toast(text); }
      ta.remove();
    }
  }

  /* ---------- Vị trí của tôi / Gần tôi ---------- */
  function locate(cb) {
    if (!navigator.geolocation) { toast('Trình duyệt không hỗ trợ định vị'); return; }
    toast('Đang xác định vị trí của bạn…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      var p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (map) {
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: '', html: '<div class="gm-me"></div>', iconSize: [22, 22] }), zIndexOffset: 2000, interactive: false
        }).addTo(map);
      }
      toastEl.classList.remove('show');
      cb(p);
    }, function () {
      toast('Không lấy được vị trí. Hãy cho phép truy cập vị trí và thử lại.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  }
  function setNear(p) {
    nearPoint = p;
    nearChip.classList.toggle('is-on', !!p);
    nearChip.setAttribute('aria-pressed', String(!!p));
    if (map && nearCircle) { map.removeLayer(nearCircle); nearCircle = null; }
    if (map && p) nearCircle = L.circle([p.lat, p.lng], { radius: 20000, color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: .06, interactive: false }).addTo(map);
  }
  nearChip.addEventListener('click', function () {
    if (nearPoint) { setNear(null); apply(true); return; }
    locate(function (p) {
      citySel.value = ''; citySel.dispatchEvent(new Event('change'));
      setNear(p);
      apply(true);
      if (!current.length) {
        toast('Chưa có đại lý trong bán kính 20km quanh bạn');
        if (map) map.setView([p.lat, p.lng], 10);
      }
    });
  });

  /* ---------- Điều khiển bản đồ ---------- */
  root.querySelector('.gm-zoom-in').addEventListener('click', function () { map && map.zoomIn(); });
  root.querySelector('.gm-zoom-out').addEventListener('click', function () { map && map.zoomOut(); });
  root.querySelector('.gm-locate').addEventListener('click', function () {
    locate(function (p) { map && map.flyTo([p.lat, p.lng], 13, { duration: .8 }); });
  });
  var layerBtn = root.querySelector('.gm-layer');
  layerBtn.addEventListener('click', function () {
    if (!map) return;
    var toSat = !layerBtn.classList.contains('is-sat');
    map.removeLayer(toSat ? baseLayers.map : baseLayers.sat);
    map.addLayer(toSat ? baseLayers.sat : baseLayers.map);
    layerBtn.classList.toggle('is-sat', toSat);
    layerBtn.querySelector('.gm-layer-label').textContent = toSat ? 'Bản đồ' : 'Vệ tinh';
  });

  // Thu gọn panel (desktop)
  var collapseBtn = root.querySelector('.gm-collapse');
  collapseBtn.addEventListener('click', function () {
    var collapsed = root.classList.toggle('panel-collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Mở rộng bảng bên' : 'Thu gọn bảng bên');
    setTimeout(function () { map && map.invalidateSize(); }, 320);
  });

  /* ---------- Bottom sheet (mobile) ---------- */
  function setSheet(state) {
    panel.setAttribute('data-sheet', state);
  }
  var handle = root.querySelector('.gm-sheet-handle');
  handle.addEventListener('click', function () {
    var s = panel.getAttribute('data-sheet');
    setSheet(s === 'full' ? 'peek' : s === 'half' ? 'full' : 'half');
  });
  // Kéo tay nắm để đổi độ cao
  var startY = null;
  handle.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
  handle.addEventListener('touchend', function (e) {
    if (startY == null) return;
    var dy = e.changedTouches[0].clientY - startY, s = panel.getAttribute('data-sheet');
    if (dy < -30) setSheet(s === 'peek' ? 'half' : 'full');
    else if (dy > 30) setSheet(s === 'full' ? 'half' : 'peek');
    startY = null;
  });
  q.addEventListener('focus', function () { if (isMobile()) setSheet('full'); });
  setSheet('half');

  /* ---------- Khởi động ---------- */
  apply(true);
  var m = location.hash.match(/^#dai-ly-(\d+)$/);
  if (m && stores[+m[1]]) setTimeout(function () { openDetail(+m[1], true); }, 300);
})();
