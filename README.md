# Nano Ceramic Window Films – website tĩnh

Bản dựng lại giao diện nanoceramicfilms.com.vn bằng HTML/CSS/JS thuần.

## Cấu trúc

```
src/partials/header.html   phần <head>, top bar, header, menu (dùng chung)
src/partials/footer.html   footer, menu mobile, nút Zalo, script (dùng chung)
src/pages/*.html           nội dung riêng của từng trang
src/data/posts.json        danh sách bài viết (Tin tức, Dự án, chuyên mục)
src/data/products.json     danh sách sản phẩm + giá theo diện tích
src/data/car-film-pricing.json bảng giá phim cách nhiệt ô tô theo dòng xe
assets/css, assets/js      giao diện và tương tác
assets/js/booking.js       form đặt lịch dùng chung; gửi POST JSON khi đã cấu hình API
build.js                   ghép partials + pages -> các file .html ở thư mục gốc
```

## Sửa nội dung

**Không sửa trực tiếp các file `.html` ở thư mục gốc**: chúng được sinh lại mỗi lần build.
Sửa trong `src/`, sau đó chạy:

```
node build.js
```

(Chỉ cần Node.js, không cần cài thư viện.)

Form đặt lịch được mở từ các nút đặt lịch ở trang chủ, PPF và trang phim ô tô. Để nhận yêu cầu, cấu hình URL API POST trong thuộc tính `data-endpoint` của form `#booking-form` ở `src/partials/footer.html`. API nhận JSON gồm `name`, `phone`, `service`, `package`, `vehicle`, `vehicleType`, `branch`, `date`, `time` và `note`. Khi chưa cấu hình API, form sẽ thông báo chưa gửi dữ liệu và cung cấp số điện thoại hỗ trợ.

## Các trang

| Trang | File |
|---|---|
| Trang chủ | index.html |
| Về chúng tôi | ve-chung-toi.html |
| Phim cách nhiệt (shop) | shop.html |
| Phim cách nhiệt ô tô | phim-cach-nhiet-o-to.html |
| PPF | ppf.html |
| Dự án | du-an-cong-trinh.html |
| Tin tức | tin-tuc.html, tin-tuc-cho-o-to.html |
| Liên hệ | lien-he.html |
