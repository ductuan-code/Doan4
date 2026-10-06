# CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI

## 1.1. Lý do chọn đề tài

Với mô hình gửi xe truyền thống, khách hàng chỉ biết còn chỗ hay không sau khi đã đến tận nơi, nhân viên xử lý thủ công bằng vé giấy dễ sai sót, và đơn vị quản lý không có dữ liệu thời gian thực để tối ưu vận hành.

Từ thực tế đó, nhóm lựa chọn xây dựng **Hệ thống Quản lý bãi đỗ xe trực tuyến** — cho phép khách hàng xem tình trạng khả dụng và đặt trước vị trí đỗ xe; hỗ trợ nhân viên xử lý xe vào/ra, đối chiếu đặt chỗ và tính phí tự động; giúp quản trị viên cấu hình bãi và theo dõi báo cáo vận hành.

Điểm nổi bật của đề tài là nghiệp vụ đặt chỗ trước với cơ chế khóa tạm chống trùng, xử lý no-show và vòng đời khép kín: **đặt chỗ → vào bãi → ra bãi → thanh toán** — vượt ra ngoài phạm vi CRUD thông thường, mang tính thực tiễn cao và phù hợp với quy mô đồ án tốt nghiệp.

## 1.2. Mục tiêu của đề tài

### 1.2.1. Mục tiêu tổng quát

Xây dựng hệ thống phần mềm hỗ trợ đặt chỗ và quản lý bãi đỗ xe, giải quyết bài toán thiếu thông tin thời gian thực trong mô hình gửi xe truyền thống; đảm bảo vòng đời khép kín từ đặt chỗ đến thanh toán cho cả ba nhóm người dùng: khách hàng, nhân viên vận hành và quản trị viên.

### 1.2.2. Mục tiêu cụ thể

- Xây dựng chức năng đặt trước vị trí đỗ xe theo thời gian thực, có cơ chế khóa tạm chống trùng và tự động hủy khi hết hạn (no-show).
- Hỗ trợ nhân viên thực hiện check-in/check-out xe, đối chiếu với lượt đặt chỗ hoặc xử lý walk-in khi khách không đặt trước.
- Tự động tính phí dựa trên thời gian gửi thực tế và loại phương tiện (xe máy/ô tô), xử lý các trường hợp lệch giờ so với đặt chỗ.
- Cho phép quản trị viên cấu hình bãi đỗ, khu vực, vị trí, bảng giá và xem báo cáo thống kê vận hành.

## 1.3. Giới hạn và phạm vi của đề tài

### 1.3.1. Đối tượng nghiên cứu

Hệ thống phần mềm quản lý bãi đỗ xe có tích hợp chức năng đặt chỗ trước, phục vụ ba nhóm người dùng: khách hàng gửi xe (xe máy/ô tô), nhân viên vận hành bãi và quản trị viên hệ thống.

### 1.3.2. Phạm vi nghiên cứu

**Phạm vi thực hiện (trong đề tài):**

- Chức năng đăng ký/đăng nhập, quản lý tài khoản và phương tiện.
- Tìm kiếm bãi đỗ, xem tình trạng chỗ trống, đặt chỗ và hủy đặt chỗ.
- Check-in/check-out xe, tính phí tự động và thanh toán mô phỏng.
- Cấu hình bãi đỗ, khu vực, vị trí và bảng giá (dành cho Admin).
- Báo cáo thống kê vận hành cơ bản (lượt xe, doanh thu, tỷ lệ lấp đầy).

**Phạm vi không thực hiện (ngoài đề tài):**

- Không tích hợp phần cứng thực tế (camera, barrier, thiết bị quét QR vật lý, IoT).
- Không tích hợp cổng thanh toán ngân hàng thật.
- Không áp dụng AI nhận diện biển số hoặc GPS định vị xe.
- Không xây dựng ứng dụng di động (mobile app).

## 1.4. Nội dung thực hiện

Đề tài được thực hiện theo các nội dung chính sau:

1. **Phân tích nghiệp vụ:** Xác định bài toán, phân tích các vai trò người dùng (Customer, Staff, Admin), xây dựng quy trình nghiệp vụ toàn trình từ đặt chỗ đến thanh toán và xác định các trường hợp ngoại lệ cần xử lý.

2. **Thiết kế hệ thống:** Xây dựng sơ đồ use case, thiết kế cơ sở dữ liệu (ERD) với 9 entity chính, đặc tả API cho các nhóm chức năng và thiết kế giao diện người dùng cho từng vai trò.

3. **Xây dựng backend:** Cài đặt hệ thống xác thực, các API CRUD cấu hình bãi đỗ, logic nghiệp vụ đặt chỗ (khóa tạm, hết hạn tự động), check-in/check-out và tính phí tự động.

4. **Xây dựng frontend:** Giao diện khách hàng (tìm bãi, đặt chỗ, lịch sử, thanh toán), giao diện nhân viên (check-in/check-out, tra cứu) và giao diện quản trị viên (cấu hình, báo cáo).

5. **Kiểm thử:** Kiểm thử các luồng nghiệp vụ chính và các trường hợp ngoại lệ (no-show, race condition, quá giờ đặt, walk-in...).

6. **Viết báo cáo và chuẩn bị demo:** Hoàn thiện tài liệu và xây dựng kịch bản demo trọn vòng đời một lượt gửi xe.

## 1.5. Phương pháp tiếp cận

Đề tài sử dụng kết hợp các phương pháp sau:

- **Phân tích nghiệp vụ thực tế:** Khảo sát quy trình gửi xe truyền thống, xác định điểm nghẽn và nhu cầu của từng nhóm người dùng để định hình yêu cầu hệ thống.

- **Phát triển theo hướng nghiệp vụ:** Ưu tiên xây dựng các logic nghiệp vụ cốt lõi (đặt chỗ, tính phí, check-in/check-out) trước, sau đó mới phát triển giao diện và tích hợp.

- **Phát triển lặp tăng dần (Iterative):** Chia hệ thống thành các nhóm chức năng (MUST HAVE → SHOULD HAVE → NICE TO HAVE), ưu tiên hoàn thiện các chức năng bắt buộc trước khi mở rộng.

- **Kiểm thử thủ công theo kịch bản:** Xây dựng các kịch bản kiểm thử bao phủ luồng nghiệp vụ chính và các trường hợp ngoại lệ để đảm bảo tính đúng đắn của hệ thống.

---

# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

## 2.1. Quy trình phát triển phần mềm

Đề tài áp dụng quy trình phát triển theo mô hình **Agile kết hợp phát triển lặp tăng dần (Iterative)**. Hệ thống được chia thành các nhóm chức năng theo mức độ ưu tiên (MUST HAVE → SHOULD HAVE → NICE TO HAVE), mỗi vòng lặp hoàn thiện một nhóm chức năng trước khi chuyển sang nhóm tiếp theo.

Quy trình thực hiện gồm các bước: phân tích yêu cầu → thiết kế hệ thống → lập trình → kiểm thử → hoàn thiện. Cách tiếp cận này giúp kiểm soát phạm vi đề tài, ưu tiên các nghiệp vụ cốt lõi và dễ dàng điều chỉnh khi có thay đổi yêu cầu.

## 2.2. Công nghệ Backend - ASP.NET Core

**ASP.NET Core** là framework phát triển ứng dụng web mã nguồn mở, đa nền tảng do Microsoft phát triển. Đây là lựa chọn phù hợp cho backend của hệ thống vì:

- Hỗ trợ xây dựng **RESTful API** mạnh mẽ, dễ tích hợp với frontend.
- Tích hợp sẵn **Dependency Injection**, giúp code có cấu trúc rõ ràng, dễ bảo trì.
- Hỗ trợ **Entity Framework Core** để thao tác cơ sở dữ liệu thông qua ORM, giảm thiểu SQL thủ công.
- Có cơ chế xác thực và phân quyền tích hợp (**JWT Authentication**), phù hợp với ba vai trò Customer, Staff, Admin trong hệ thống.
- Hiệu năng cao, phù hợp với các nghiệp vụ cần xử lý đồng thời như đặt chỗ và kiểm tra khả dụng theo thời gian thực.

## 2.3. Công nghệ Frontend - React

**React** là thư viện JavaScript mã nguồn mở do Meta phát triển, được sử dụng để xây dựng giao diện người dùng theo kiến trúc component. React được lựa chọn cho frontend vì:

- Kiến trúc **component-based** giúp tái sử dụng giao diện hiệu quả, phù hợp với hệ thống có nhiều màn hình và vai trò khác nhau.
- **Virtual DOM** giúp cập nhật giao diện nhanh, phù hợp với các màn hình cần hiển thị trạng thái thời gian thực (sơ đồ vị trí đỗ xe, trạng thái chỗ trống).
- Hệ sinh thái phong phú với các thư viện hỗ trợ như React Router (điều hướng), Axios (gọi API) và các thư viện UI component.
- Dễ phân tách giao diện theo từng vai trò (Customer, Staff, Admin) thông qua routing và bảo vệ route.

## 2.4. Cơ sở dữ liệu - SQL Server

**Microsoft SQL Server** là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) được lựa chọn để lưu trữ dữ liệu của hệ thống vì:

- Hỗ trợ tốt các ràng buộc quan hệ (khóa ngoại, khóa chính), phù hợp với mô hình dữ liệu có nhiều quan hệ liên kết giữa các entity như Reservation, ParkingSession, ParkingSlot.
- Tích hợp chặt chẽ với **Entity Framework Core** trong hệ sinh thái .NET, thuận tiện cho quá trình phát triển.
- Hỗ trợ **transaction** và cơ chế khóa (locking) giúp xử lý an toàn các tình huống đặt chỗ đồng thời (race condition).
- Công cụ quản lý trực quan với **SQL Server Management Studio (SSMS)**, dễ kiểm tra và theo dõi dữ liệu trong quá trình phát triển.
