# Shopee

Công cụ chuyển đổi các đường dẫn sản phẩm, gian hàng và sự kiện trên Shopee thành liên kết tiếp thị liên kết để ghi nhận hoa hồng cho chủ sở hữu.

## Language

**Nội dung thô (Raw Input)**:
Đoạn văn bản hoặc đường dẫn đơn lẻ do người dùng cung cấp, có thể chứa một hoặc nhiều liên kết Shopee lẫn với nội dung chữ và mã theo dõi cũ.
_Avoid_: Chuỗi đầu vào, query, link bẩn

**Liên kết gốc (Origin Link)**:
Đường dẫn trang đích sạch trên Shopee (sản phẩm, gian hàng hoặc trang chiến dịch) đã loại bỏ mọi tham số theo dõi và tiếp thị trước đó.
_Avoid_: Link sạch, target URL, raw link

**Liên kết rút gọn (Short Link)**:
Đường dẫn chia sẻ dạng ngắn của Shopee ẩn Liên kết gốc đằng sau một bước chuyển hướng.
_Avoid_: Link ngắn, tiny link, mini URL

**Liên kết tiếp thị (Affiliate Link)**:
Đường dẫn chuyển hướng hợp lệ của chương trình Shopee Affiliate dẫn người mua tới Liên kết gốc đồng thời ghi nhận hoa hồng cho Mã tiếp thị.
_Avoid_: Link ref, tracking link, link kiếm tiền

**Mã tiếp thị (Affiliate ID)**:
Định danh tài khoản đối tác Shopee Affiliate được hưởng hoa hồng từ các đơn hàng phát sinh qua Liên kết tiếp thị.
_Avoid_: Publisher ID, user ID, mã giới thiệu
