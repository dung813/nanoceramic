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

Form đặt lịch được mở từ các nút đặt lịch ở trang chủ, PPF và trang phim ô tô. Mã Google Apps Script nằm trong `apps-script/Code.gs`; script tạo sheet `Lịch đặt hẹn`, kiểm tra dữ liệu, ghi thời gian nhận và mã yêu cầu, đồng thời chống ghi trùng khi khách gửi lại cùng một yêu cầu.

Để kết nối Google Sheet:
1. Mở sheet, đăng nhập tài khoản Google có quyền chỉnh sửa, chọn **Tiện ích mở rộng > Apps Script**.
2. Thay nội dung `Code.gs` bằng mã trong `apps-script/Code.gs`, lưu rồi chạy `setupBookingSheet` một lần và cấp quyền truy cập sheet.
3. Chọn **Triển khai > Bản triển khai mới > Ứng dụng web**; đặt **Thực thi với tư cách** là tài khoản của bạn và quyền truy cập là **Bất kỳ ai** để khách có thể gửi yêu cầu mà không cần đăng nhập. Sao chép URL ứng dụng web kết thúc bằng `/exec`.
4. Điền URL triển khai vào `data-endpoint` của form `#booking-form` trong `src/partials/footer.html` (endpoint hiện tại đã được cấu hình), chạy `node build.js`, rồi gửi một yêu cầu thử để xác nhận hàng mới xuất hiện trong sheet.

Sheet được cung cấp hiện yêu cầu đăng nhập Google để chỉnh sửa, nên cần chủ sở hữu đăng nhập và cấp quyền khi cài đặt/triển khai. Không đưa thông tin đăng nhập hoặc khóa bí mật Google vào mã website. Khi chưa có URL triển khai `/exec`, form vẫn báo chưa kết nối và không thông báo gửi thành công.

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
