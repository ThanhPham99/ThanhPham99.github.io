# Chuyển đổi Link Shopee (`apps/shopee`)

Công cụ tĩnh chuyển đổi đường dẫn sản phẩm, gian hàng hoặc bài đăng chứa nhiều liên kết Shopee sang liên kết tiếp thị liên kết chuẩn `s.shopee.vn/an_redir`.

- Tài liệu thuật ngữ miền: [GLOSSARY.md](./GLOSSARY.md)
- Quyết định kiến trúc (ADR): [0001-client-side-an-redir-conversion.md](./docs/adr/0001-client-side-an-redir-conversion.md)

## Tính năng chính

- **Tự động chuyển đổi khi dán**: Hỗ trợ dán 1 đường dẫn trần hoặc cả đoạn văn bản nhiều dòng chứa nhiều liên kết Shopee (giữ nguyên nội dung chữ và các liên kết ngoài Shopee).
- **Làm sạch & chuẩn hóa trang đích**: Tự động gỡ bỏ toàn bộ tham số theo dõi cũ (`utm_*`, `sp_atk`, `xptdk`, `uls_trackid`, `universal-link`, `an_redir` của bên khác) và rút gọn đường dẫn sản phẩm về dạng chuẩn `https://shopee.vn/product/{shopid}/{itemid}`.
- **Giải mã liên kết rút gọn**: Tự động giải mã `vn.shp.ee`, `s.shopee.vn`, `shp.ee`, `shope.ee` về trang đích trước khi bọc liên kết tiếp thị; cảnh báo rõ nếu liên kết không thể giải mã.
- **Lịch sử cục bộ**: Lưu tối đa 20 lượt chuyển đổi gần nhất trong `localStorage` của trình duyệt.

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
