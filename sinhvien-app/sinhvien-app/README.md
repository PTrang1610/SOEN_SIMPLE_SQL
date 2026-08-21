# Quản lý Sinh Viên — Kết nối SQL Server

Ứng dụng web full-stack: **HTML/CSS/JS** (frontend) + **Node.js/Express** (backend) kết nối trực tiếp tới cơ sở dữ liệu **SQL Server** có sẵn trong SQL Server Management Studio (SSMS).

Giao diện dạng bảng CRUD: bảng dữ liệu phía trên (có icon Sửa/Xóa từng dòng), form nhập/sửa phía dưới với 4 nút chức năng.

4 chức năng:
- ** Hiển thị Dữ liệu (SELECT)** — tải danh sách sinh viên từ database vào bảng
- ** Thêm mới (INSERT)** — nhập dữ liệu vào form rồi bấm nút, lưu trực tiếp vào database
- ** Cập nhật (UPDATE)** — click icon ✎ trên dòng cần sửa (tự điền vào form), sửa rồi bấm nút Cập nhật — có **hộp thoại xác nhận** trước khi ghi vào database
- ** Xóa dữ liệu (DELETE)** — click icon 🗑 trên dòng cần xóa, hoặc nhập MaSo vào form rồi bấm nút Xóa — có **hộp thoại xác nhận** trước khi xóa

---

## 1. Yêu cầu

- Đã cài [Node.js](https://nodejs.org) (bản 18 trở lên)
- SQL Server đang chạy, có thể kết nối được qua SSMS
- Bảng `SinhVien` đã có sẵn trong database, ví dụ:

```sql
CREATE TABLE SinhVien (
    MaSo   NVARCHAR(20) PRIMARY KEY,
    HoTen  NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(200) NOT NULL
);
```

Nếu bảng của bạn có tên cột khác, sửa lại các câu SQL trong `server.js` cho khớp.

---

## 2. Cài đặt

Mở terminal tại thư mục dự án:

```bash
npm install
```

Nếu bạn dùng **Windows Authentication** để đăng nhập SQL Server (không dùng user/password), cài thêm:

```bash
npm install msnodesqlv8
```

---

## 3. Cấu hình kết nối

1. Đổi tên file `.env.example` thành `.env`
2. Mở SSMS, xem tên server bạn đang kết nối (góc trên bên trái khi login) — điền vào `DB_SERVER`
3. Điền tên database vào `DB_DATABASE`
4. Chọn 1 trong 2 cách đăng nhập:
   - **SQL Server Authentication**: điền `DB_USER` và `DB_PASSWORD`
   - **Windows Authentication**: để trống `DB_USER`/`DB_PASSWORD`, đặt `DB_USE_WINDOWS_AUTH=true`

Ví dụ `.env` cho SQL Server cài local với SQL Authentication:

```
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=QuanLySinhVien
DB_USER=sa
DB_PASSWORD=Matkhau123
DB_USE_WINDOWS_AUTH=false
DB_PORT=1433
DB_TRUST_SERVER_CERTIFICATE=true
PORT=3000
```

---

## 4. Chạy ứng dụng

```bash
npm start
```

Console sẽ hiện:
```
✅ Đã kết nối SQL Server: localhost\SQLEXPRESS / QuanLySinhVien
🚀 Server đang chạy tại http://localhost:3000
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 5. Cấu trúc dự án

```
sinhvien-app/
├── server.js          # Backend Express — API kết nối SQL Server
├── package.json
├── .env.example        # Mẫu cấu hình kết nối (đổi tên thành .env)
└── public/
    ├── index.html       # Giao diện
    ├── style.css
    └── script.js        # Gọi API, xử lý 4 chức năng SELECT/INSERT/UPDATE/DELETE
```

## 6. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân / cách khắc phục |
|---|---|
| `Login failed for user` | Sai `DB_USER`/`DB_PASSWORD`, hoặc SQL Server chưa bật SQL Authentication (Server Properties → Security → SQL Server and Windows Authentication mode) |
| `Could not connect (timeout)` | Sai `DB_SERVER`, hoặc SQL Server Browser/TCP-IP chưa bật (SQL Server Configuration Manager → Protocols → bật TCP/IP) |
| `self signed certificate` | Đặt `DB_TRUST_SERVER_CERTIFICATE=true` trong `.env` |
| Chấm tròn ở header chuyển màu đỏ | Frontend không gọi được API — kiểm tra backend có đang chạy (`npm start`) và console log lỗi |
