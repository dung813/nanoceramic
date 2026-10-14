# Nano Ceramic Window Films – website tĩnh

Bản dựng lại giao diện nanoceramicfilms.com.vn bằng HTML/CSS/JS thuần.

## Cấu trúc

```
src/partials/header.html   phần <head>, top bar, header, menu (dùng chung)
src/partials/footer.html   footer, menu mobile, nút Zalo, script (dùng chung)
src/pages/*.html           nội dung riêng của từng trang
src/data/posts.json        danh sách bài viết (Tin tức, Dự án, chuyên mục)
src/data/products.json     danh sách sản phẩm + giá theo diện tích
assets/data/stores.js      140 đại lý cho bản đồ
assets/css, assets/js      giao diện và tương tác
build.js                   ghép partials + pages -> các file .html ở thư mục gốc
```

## Sửa nội dung

**Không sửa trực tiếp các file `.html` ở thư mục gốc**: chúng được sinh lại mỗi lần build.
Sửa trong `src/`, sau đó chạy:

```
node build.js
```

(Chỉ cần Node.js, không cần cài thư viện.)

## Các trang

| Trang | File |
|---|---|
| Trang chủ | index.html |
| Về chúng tôi | ve-chung-toi.html |
| Phim cách nhiệt (shop) | shop.html |
| PPF | ppf.html |
| Hệ thống đại lý | he-thong-dai-ly.html |
| Dự án | du-an-cong-trinh.html |
| Tin tức | tin-tuc.html, tin-tuc-cho-nha-kinh.html, tin-tuc-cho-o-to.html |
| Liên hệ | lien-he.html |
