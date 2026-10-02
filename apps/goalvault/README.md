# Goalvault

Ứng dụng theo dõi mục tiêu tài chính cá nhân: danh mục → mục tiêu (tag, target, giá trị hiện có, lịch sử nạp/rút), đăng nhập Google, dữ liệu lưu trên Firestore. Giao diện tiếng Việt và tiếng Anh.

- Dùng thử không cần đăng nhập: `…/apps/goalvault/?demo=1` (dữ liệu mẫu, chỉ nằm trong bộ nhớ).

## Cấu hình Firebase (một lần)

1. Vào <https://console.firebase.google.com> → **Add project** (tắt Google Analytics nếu không cần).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** → chọn email hỗ trợ → Save.
3. **Authentication → Settings → Authorized domains → Add domain** → `thanhpham99.github.io` (`localhost` có sẵn).
4. **Build → Firestore Database → Create database** → chọn vùng (ví dụ `asia-southeast1`) → **production mode**.
5. **Firestore → Rules** → dán toàn bộ nội dung `firestore.rules` → **Publish**.
6. **Project settings (⚙️) → Your apps → Web (`</>`)** → đăng ký app → sao chép object `firebaseConfig` vào `js/firebase-config.js`.

`firebaseConfig` phía web là thông tin công khai; dữ liệu được bảo vệ bởi rules (mỗi người chỉ đọc/ghi được `users/{uid}` của mình).

## Chạy local

```bash
python3 -m http.server 8000
# mở http://localhost:8000/apps/goalvault/
```

## Kiểm thử

```bash
node --test apps/goalvault/tests/*.test.js   # logic thuần (Node ≥ 20)
node apps/goalvault/tests/e2e.mjs            # kiểm thử giao diện end-to-end trên bản demo (Chrome headless)
```
