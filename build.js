#!/usr/bin/env node
/*
 * Ghép các trang tĩnh: src/partials/header.html + src/pages/<trang>.html + src/partials/footer.html
 * -> <trang>.html ở thư mục gốc.  Chạy:  node build.js
 *
 * Mỗi file trong src/pages bắt đầu bằng khối cấu hình:
 * <!--
 * title: Tiêu đề trang
 * description: Mô tả (tuỳ chọn)
 * nav: home | about | shop | ppf | project | news | contact
 * bodyClass: lớp cho <body> (tuỳ chọn)
 * head: thẻ thêm vào <head> (tuỳ chọn, 1 dòng)
 * scripts: các file js thêm, cách nhau bởi dấu phẩy (tuỳ chọn)
 * -->
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const header = fs.readFileSync(path.join(SRC, 'partials/header.html'), 'utf8');
const footer = fs.readFileSync(path.join(SRC, 'partials/footer.html'), 'utf8');
const DEFAULT_DESC = 'Nano Ceramic Window Films - Phim cách nhiệt thế hệ mới từ Hàn Quốc, phim chất lượng cao với mức giá phù hợp';

function parsePage(src) {
  const m = src.match(/^<!--\r?\n([\s\S]*?)\r?\n-->\r?\n/);
  const meta = {};
  if (m) {
    m[1].split('\n').forEach(line => {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
  }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function markActive(html, nav) {
  if (!nav) return html;
  return html.replace(new RegExp('<li([^>]*?)\\sdata-nav="' + nav + '"([^>]*)>', 'g'), (all, a, b) => {
    const attrs = a + b;
    return /class="/.test(attrs)
      ? '<li' + attrs.replace(/class="([^"]*)"/, 'class="$1 active"') + '>'
      : '<li' + attrs + ' class="active">';
  });
}

/* ---------- Khối nội dung sinh từ dữ liệu ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const posts = JSON.parse(fs.readFileSync(path.join(SRC, 'data/posts.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(SRC, 'data/products.json'), 'utf8'));
const carFilmPricing = JSON.parse(fs.readFileSync(path.join(SRC, 'data/car-film-pricing.json'), 'utf8'));

// Danh sách bài viết dạng thẻ ngang (blog archive của Flatsome); 10 bài/trang do JS phân trang
function renderPosts(key) {
  const list = posts[key] || [];
  const items = list.map(p => {
    const link = `href="${esc(p.url)}" target="_blank" rel="noopener"`;
    const image = p.img ? `
          <a ${link} class="box-image" aria-label="${esc(p.title)}"><img src="${esc(p.img)}" alt="" loading="lazy"></a>` : '';
    const badge = p.img && p.day ? `
          <div class="badge post-date"><div class="badge-inner"><span class="post-date-day">${esc(p.day)}</span><span class="post-date-month">${esc(p.month)}</span></div></div>` : '';
    const meta = !p.img && p.date ? `<div class="post-meta">${esc(p.date)}</div>` : '';
    return `
      <div class="post-item">
        <article class="box-blog-post archive-post has-hover${p.img ? '' : ' no-image'}">${image}
          <div class="box-text">
            <h5 class="post-title"><a ${link}>${esc(p.title)}</a></h5>${meta}
            <div class="is-divider"></div>
            <p class="excerpt">${esc(p.excerpt)}</p>
          </div>${badge}
        </article>
      </div>`;
  }).join('');
  return `<div class="post-list" data-paginate="10">${items}
    </div>
    <nav class="pagination" aria-label="Phân trang"></nav>`;
}

// Lưới sản phẩm (WooCommerce/Flatsome); dữ liệu "Xem nhanh" gắn vào data-product
function renderProducts() {
  return products.map((p, i) => {
    const cat = p.cat.toLowerCase().replace(/\s+/g, '-');
    const price = p.prices.length > 1
      ? `<span class="amount">${p.prices[0]}&nbsp;₫</span> – <span class="amount">${p.prices[1]}&nbsp;₫</span>`
      : `<span class="amount">${p.prices[0]}&nbsp;₫</span>`;
    const data = (JSON.stringify({ name: p.name, cat: p.cat, img: p.img, prices: p.prices, desc: p.desc, variations: p.variations, options: p.options })).replace(/</g, '\\u003c');
    return `
        <div class="product-col" data-cat="${cat}" data-order="${i}" data-price="${parseInt(p.prices[0].replace(/\./g, ''), 10)}">
          <div class="product-small has-hover">
            <div class="box-image">
              <a href="#" class="quick-view-trigger" aria-label="${esc(p.name)}">
                <img src="${esc(p.img)}" alt="${esc(p.name)}" width="300" height="300" loading="lazy">${p.img2 ? `
                <img src="${esc(p.img2)}" class="back-image" alt="" aria-hidden="true" width="300" height="300" loading="lazy">` : ''}
              </a>
              <button type="button" class="quick-view quick-view-trigger">Xem nhanh</button>
            </div>
            <div class="box-text-products">
              <p class="product-cat">${esc(p.cat)}</p>
              <p class="product-title"><a href="#" class="quick-view-trigger">${esc(p.name)}</a></p>
              <div class="price">${price}</div>
            </div>
            <script type="application/json" class="product-data">${data}</script>
          </div>
        </div>`;
  }).join('');
}

function renderCarFilmPricing() {
  const vehicleSections = carFilmPricing.vehicles.map(vehicle => {
    const cards = vehicle.packages.map(pkg => {
      const details = pkg.items.map(([position, film, price]) => `
                <div class="auto-price-detail">
                  <span>${esc(position)}</span><span class="auto-price-film">${esc(film)}</span><strong>${esc(price)}</strong>
                </div>`).join('');
      return `
            <article class="auto-price-card">
              <header class="auto-price-head">
                <h3>${esc(pkg.name)}</h3>
                <p>${esc(pkg.total)}</p>
              </header>
              <div class="auto-price-details">${details}</div>
              <a href="#booking-form" class="button primary" data-booking-trigger data-booking-service="Phim cách nhiệt ô tô" data-booking-package="${esc(pkg.name)}" data-booking-vehicle="${esc(vehicle.name)}">Đặt lịch dán</a>
            </article>`;
    }).join('');
    return `
        <section class="auto-price-section">
          <h2 class="pricing-title">BẢNG GIÁ XE ${esc(vehicle.name)}</h2>
          <div class="auto-pricing-grid">${cards}
          </div>
        </section>`;
  }).join('');
  const rows = carFilmPricing.largeVehicles.map(([film, packages, price, positions]) => `
              <tr><td>${esc(film)}</td><td>${esc(packages)}</td><td>${esc(price)}</td><td>${esc(positions)}</td></tr>`).join('');
  return `${vehicleSections}
        <section class="auto-price-section">
          <h2 class="pricing-title">BẢNG GIÁ XE 29+ CHỖ</h2>
          <p class="auto-price-note">Giá gói dán được tính theo mã phim và diện tích kính thực tế.</p>
          <div class="auto-price-table-wrap">
            <table class="auto-price-table">
              <thead><tr><th>Mã phim</th><th>Gói dán</th><th>Giá</th><th>Vị trí dán phù hợp</th></tr></thead>
              <tbody>${rows}
              </tbody>
            </table>
          </div>
          <div class="text-center"><a href="#booking-form" class="button primary" data-booking-trigger data-booking-service="Phim cách nhiệt ô tô" data-booking-vehicle="Xe 29+ chỗ">Đặt lịch dán</a></div>
        </section>`;
}

function renderBlocks(body) {
  return body
    .replace(/\{\{posts:([\w-]+)\}\}/g, (_, k) => renderPosts(k))
    .replace(/\{\{products\}\}/g, () => renderProducts())
    .replace(/\{\{carFilmPricing\}\}/g, () => renderCarFilmPricing());
}

const pages = fs.readdirSync(path.join(SRC, 'pages')).filter(f => f.endsWith('.html'));
for (const file of pages) {
  const { meta, body } = parsePage(fs.readFileSync(path.join(SRC, 'pages', file), 'utf8'));
  const scripts = (meta.scripts || '').split(',').map(s => s.trim()).filter(Boolean)
    .map(s => '\n<script src="' + s + '"></script>').join('');
  const vars = {
    title: meta.title || 'Nano Ceramic Window Films',
    description: meta.description || DEFAULT_DESC,
    bodyClass: meta.bodyClass || 'page',
    head: meta.head ? '\n' + meta.head : '',
    scripts
  };
  const fill = s => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  const html = markActive(fill(header), meta.nav) + renderBlocks(body) + markActive(fill(footer), meta.nav);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('✓', file);
}
