# Quản lý bãi đỗ xe trực tuyến

## Tiến độ ngày 22/10/2026

Đã nối database SQL Server với backend ASP.NET Core và hoàn thành luồng đăng ký, đăng nhập, kiểm tra tài khoản hiện tại, phân quyền và quản lý phương tiện trên giao diện.

| Phần | Trạng thái |
|---|---|
| Database, ràng buộc, chỉ mục và thủ tục nghiệp vụ | Có trong `sql.md`; đã khởi tạo lại sau khi cài Windows |
| Đăng ký | Tạo Customer thật trong SQL, hash mật khẩu bằng ASP.NET Core Identity |
| Đăng nhập và `/auth/me` | JWT thật; kiểm tra lại trạng thái/vai trò trong database mỗi yêu cầu |
| Bảo vệ route | Chưa đăng nhập về trang đăng nhập; sai vai trò về dashboard của mình |
| Phương tiện | Đọc xe của mình, thêm, sửa, ngừng sử dụng/kích hoạt lại; lưu thật, giữ lịch sử |
| Gửi lại thao tác lưu xe | Có `Idempotency-Key`, không tạo thêm xe với cùng yêu cầu |
| Đặt chỗ, check-in/out, quản trị và báo cáo | Có giao diện nguyên mẫu và xử lý SQL; **chưa nối API nghiệp vụ** |

Những trang chưa tích hợp hiển thị thông báo dữ liệu/thao tác minh họa. Dashboard chưa phản ánh số liệu vận hành thật. Không sửa báo cáo trong giai đoạn tiếp tục phát triển này.

## Chạy trên máy hiện tại

Database đã được tạo tại server **`localhost`**, database **`ParkingLotOnline`**. Sau khi cài lại Windows, instance đang chạy là instance mặc định, không phải `localhost\SQLEXPRESS` như trước. Không cần chạy lại script khởi tạo nếu database hiện đã có.

Mở hai cửa sổ PowerShell tại `C:\Code\doan4`:

**Cửa sổ 1 — backend:**

```powershell
.\scripts\chay-backend.ps1
```

**Cửa sổ 2 — frontend:**

```powershell
.\scripts\chay-frontend.ps1
```

Mở **http://127.0.0.1:3000**. API chạy tại **http://localhost:5143**; kiểm tra kết nối SQL bằng **http://localhost:5143/api/health**.

Script frontend ưu tiên Node.js trong PATH, nếu chưa có sẽ dùng Node đi kèm Codex khi thư mục runtime hiện hữu. Vì máy vừa cài Windows chưa có `npm` trong PATH, cách này cho phép chạy ngay với các gói frontend đã có. Khi cài môi trường mới hoàn toàn, cần cài Node.js phù hợp với Vite và chạy `npm install` trong thư mục `frontend` trước.

Nếu máy đã có đầy đủ Node.js/npm và .NET SDK, có thể dùng lệnh thông thường:

```powershell
dotnet run --project backend/ParkingLotAPI.csproj --launch-profile http
```

```powershell
cd frontend
npm install
npm run dev
```

### Đăng nhập demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách hàng | `customer1@parking.test` | `123456` |
| Khách hàng thứ hai | `customer2@parking.test` | `123456` |
| Nhân viên Bãi Trung Tâm | `staff1@parking.test` | `123456` |
| Nhân viên Bãi Đại Học | `staff2@parking.test` | `123456` |
| Quản trị viên | `admin@parking.test` | `123456` |

Đây là tài khoản seed từ SQL. Các email `customer@test.com`, `staff@test.com`, `admin@test.com` của bản mô phỏng trước đây không còn được dùng để đăng nhập. Đăng ký tài khoản mới yêu cầu mật khẩu từ 8 đến 128 ký tự; vai trò luôn là Customer.

Để thử phần đã tích hợp, đăng nhập khách hàng → **Phương tiện** → thêm/sửa/ngừng sử dụng xe → tải lại trang để đối chiếu. Ngừng sử dụng không xóa phương tiện hoặc lịch sử. Xe có lịch đặt/phiên đang gửi không được sửa theo quy tắc trong SQL.

## Cấu hình

- `backend/appsettings.json`: kết nối Windows Authentication tới `localhost`, database `ParkingLotOnline`; không có mật khẩu SQL hay khóa JWT mặc định trong mã nguồn.
- Nếu dùng server khác, ghi đè bằng cấu hình `ConnectionStrings:ParkingDatabase`/biến môi trường `ConnectionStrings__ParkingDatabase`.
- Frontend dùng `/api`, proxy Vite chuyển tới `http://127.0.0.1:5143`. Có thể cấu hình theo `frontend/.env.example`.
- JWT có thời hạn 1 giờ. Trong Development, nếu chưa cấu hình khóa, backend tạo khóa ngẫu nhiên trong bộ nhớ; khởi động lại backend sẽ yêu cầu đăng nhập lại.
- Môi trường ngoài Development yêu cầu cấu hình `Jwt:SigningKey` bằng giá trị bí mật ít nhất 32 byte qua môi trường/secret store. Giữ HTTPS và cấu hình chứng chỉ/SQL phù hợp môi trường; `TrustServerCertificate=True` trong cấu hình hiện tại phục vụ máy cục bộ.
- Khi phát hành, tài khoản database của API nên chỉ thuộc role `parking_backend`, không dùng quyền quản trị. Các lệnh ghi hiện gọi procedure bằng tham số, không đi vòng qua transaction SQL.

## API đã có

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/health` | Công khai, kiểm tra kết nối và schema cần thiết |
| POST | `/api/auth/register` | Công khai; giới hạn tần suất |
| POST | `/api/auth/login` | Công khai; giới hạn tần suất |
| GET | `/api/auth/me` | Đã đăng nhập và còn hoạt động |
| GET | `/api/vehicles` | Customer, chỉ xe của mình, gồm xe đã ngừng sử dụng |
| POST | `/api/vehicles` | Customer; bắt buộc `Idempotency-Key` |
| PATCH | `/api/vehicles/{id}` | Customer chủ xe; bắt buộc `Idempotency-Key` |

POST/PATCH phương tiện nhận đầy đủ trạng thái biểu mẫu để nội dung yêu cầu lặp ổn định:

```json
{
  "plateNumber": "59-C1 112.23",
  "vehicleType": "MOTORBIKE",
  "isActive": true
}
```

Để ngừng sử dụng, gửi cùng biển số/loại xe với `isActive=false`. Không có API xóa vật lý. Giữ cùng key/cùng dữ liệu khi thử lại một yêu cầu chưa rõ kết quả; thao tác mới dùng key mới. Cùng key nhưng đổi dữ liệu trả 409. Các DTO không nhận thuộc tính bổ sung như `role` khi đăng ký hoặc `userId` khi lưu phương tiện.

Phản hồi lỗi có `code`, `message`, `traceId`; lỗi biểu mẫu có thêm `errors`. Các trường hợp chính: 400 dữ liệu sai, 401 chưa đăng nhập/token không hợp lệ, 403 sai quyền, 404 không tìm thấy dữ liệu thuộc tài khoản, 409 xung đột, 429 quá nhiều yêu cầu đăng nhập/đăng ký, 503 database chưa sẵn sàng. Mật khẩu và password hash không trả ra API.

## Kiểm tra đã chạy

- `dotnet build backend/ParkingLotAPI.csproj --no-restore`: thành công, 0 lỗi/cảnh báo.
- Đóng gói frontend bằng Vite: thành công. Có cảnh báo kích thước bundle hiện tại; chưa thực hiện chia nhỏ theo route.
- `tests/auth_vehicles_integration.py`: 50 kiểm tra HTTP/dữ liệu, gồm đăng ký, mật khẩu sai, phạm vi xe, request lặp, dữ liệu lưu thật, đổi vai trò và khóa tài khoản khi token vẫn còn hạn.
- `tests/ui-auth-vehicles.cjs`: trình duyệt kiểm tra lỗi đăng nhập, đăng nhập thật, thêm/sửa/ngừng xe, lưu sau reload, chặn route sai quyền, bỏ quyền giả trong localStorage và bỏ token mock cũ; không có lỗi JavaScript ở trang.
- Các kiểm tra tạo tài khoản riêng có tên ngẫu nhiên và dọn đúng dữ liệu của các tài khoản đó. Không xóa dữ liệu demo hoặc tài khoản người dùng khác.

Chạy lại kiểm tra sau khi mở cả backend và frontend:

```powershell
python tests/auth_vehicles_integration.py
node tests/ui-auth-vehicles.cjs DUONG_DAN_NODE_MODULES_CO_PLAYWRIGHT
```

## Phần tiếp theo

Nối API bãi/khu vực/vị trí và tra khả dụng; thay luồng tìm/đặt chỗ mô phỏng bằng dữ liệu thật. Sau đó nối hủy đặt, lịch sử, nhân viên nhận/trả xe và thanh toán, quản trị và báo cáo theo thứ tự của `blueprint.md`. Chưa đánh dấu các chức năng này đã hoàn thành ở mức website.
