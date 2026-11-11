# Shop Mòe (`apps/shopee`)

Tiệm ghé ngang mua sắm Shopee ủng hộ **Mòe vui vẻ** 0 đồng — dán liên kết hoặc nội dung chia sẻ sản phẩm từ Shopee để mở sang Shopee chốt đơn giữ nguyên giá gốc, áp trọn voucher sẵn có và gửi hoa hồng từ nền tảng cho Mòe mua pate.

- Tài liệu thuật ngữ miền: [GLOSSARY.md](./GLOSSARY.md)
- Quyết định kiến trúc (ADR): [0001-client-side-an-redir-conversion.md](./docs/adr/0001-client-side-an-redir-conversion.md)

## Tính năng chính

- **Luồng mua hàng trực quan (Vé Chốt Đơn)**: Dán 1 đường dẫn trần hoặc cả tin nhắn chia sẻ từ App Shopee (`"Hãy mua ngay sản phẩm ... trên Shopee! https://vn.shp.ee/..."`) để nhận ngay nút **Mở Shopee & Chốt đơn ngay** kèm tên món hàng dễ đọc, không phô bày chuỗi URL kỹ thuật rối mắt.
- **Hỗ trợ giỏ nhiều món**: Khi dán bài tổng hợp từ 2 liên kết Shopee trở lên, hiển thị **Giỏ đồ bạn vừa chọn** với nút mở mua riêng cho từng món và tùy chọn sao chép toàn bộ danh sách.
- **Làm sạch & chuẩn hóa trang đích**: Tự động gỡ bỏ tham số theo dõi cũ (`utm_*`, `sp_atk`, `xptdk`, `uls_trackid`, `universal-link`, `an_redir` khác) và chuẩn hóa đường dẫn sản phẩm về `https://shopee.vn/product/{shopid}/{itemid}`.
- **Giải mã liên kết rút gọn**: Tự động giải mã `vn.shp.ee`, `s.shopee.vn`, `shp.ee`, `shope.ee` về trang đích mua sắm trước khi tạo liên kết ủng hộ.
- **Món bạn vừa ghé xem**: Lưu tối đa 20 món gần nhất trong `localStorage` của trình duyệt để mở mua lại nhanh bất cứ lúc nào.

## Chạy local

```bash
python3 -m http.server 8000
# mở http://localhost:8000/apps/shopee/
```

## Kiểm thử

```bash
node --test apps/shopee/tests/*.test.js   # kiểm thử đơn vị (Node ≥ 20)
node apps/shopee/tests/e2e.mjs            # kiểm thử giao diện end-to-end (Chrome headless)
```
