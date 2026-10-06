# PHÂN TÍCH ĐỀ TÀI: HỆ THỐNG ĐẶT CHỖ VÀ QUẢN LÝ BÃI ĐỖ XE

---

## 1. XÁC ĐỊNH BẢN CHẤT ĐỀ TÀI

**Vấn đề thực sự cần giải quyết:** Ở mô hình gửi xe truyền thống, khách đến bãi mới biết còn chỗ hay không, không biết trước vị trí, không thể chắc chắn có chỗ khi đến giờ cao điểm. Nhân viên xử lý thủ công (ghi vé giấy, nhớ vị trí trống), dễ sai sót, khó thống kê. Điểm nghẽn nghiệp vụ nằm ở **sự không chắc chắn về chỗ trống** và **thiếu dữ liệu để quản lý theo thời gian thực**.

**Đối tượng sử dụng:**
- Khách gửi xe (đi xe máy hoặc ô tô), có nhu cầu chắc chắn có chỗ trước khi đến, đặc biệt vào giờ cao điểm hoặc bãi hay hết chỗ (trung tâm thương mại, sân bay, khu văn phòng).
- Nhân viên vận hành bãi: xử lý xe vào/ra thực tế.
- Quản trị viên: cấu hình bãi, giá, xem báo cáo.

**Vấn đề của cách gửi xe truyền thống:**
1. Không biết trước còn chỗ hay không → phải đến tận nơi mới biết, rủi ro quay xe.
2. Không kiểm soát được vị trí xe theo thời gian thực → khó tìm xe, khó thống kê.
3. Tính phí thủ công dễ sai, dễ gian lận (ghi giờ vào sai).
4. Không có dữ liệu để tối ưu vận hành (giờ nào đông, khu nào trống).

**Tại sao cần chức năng đặt chỗ (Reservation):**
- Đây chính là chức năng biến "quản lý" (quản lý cái đã xảy ra) thành "nghiệp vụ có giá trị dự đoán và cam kết" (đảm bảo trước một quyền lợi cho khách). Đặt chỗ tạo ra bài toán thực sự khó và thú vị: quản lý tình trạng khả dụng theo thời gian, xử lý tranh chấp vị trí, xử lý hết hạn/no-show — đây là những bài toán nghiệp vụ thực sự chứ không phải CRUD đơn thuần.

**So sánh 3 hướng đề tài:**

| Hướng | Bản chất | Độ khó nghiệp vụ | Vấn đề |
|---|---|---|---|
| (1) Quản lý bãi đỗ xe | Ghi nhận xe vào/ra, tính tiền | Thấp | Thường chỉ là CRUD + tính giờ, giảng viên dễ chê "đơn giản" |
| (2) Đặt chỗ đỗ xe | Đặt trước vị trí, không có vận hành xe vào/ra thực tế | Trung bình nhưng thiếu tính khép kín | Thiếu phần "thực tế vận hành", giống một app đặt lịch thuần túy |
| (3) Đặt chỗ + Quản lý bãi đỗ xe | Kết hợp: đặt trước VÀ vận hành thực tế xe vào/ra | Cao vừa phải, có tính khép kín | Đây là lựa chọn tốt nhất |

**Kết luận:** Hướng (3) là hợp lý nhất cho đồ án sinh viên, vì nó:
- Có nghiệp vụ đủ phức tạp để không bị đánh giá là "CRUD".
- Có tính khép kín: đặt chỗ → vào bãi → ra bãi → thanh toán, demo được toàn bộ vòng đời.
- Không quá lớn vì có thể giới hạn phạm vi rõ ràng (không cần phần cứng, IoT, AI).

**Định nghĩa chính thức đề xuất (dùng để trình bày với giảng viên):**

> *"Xây dựng hệ thống đặt chỗ và quản lý bãi đỗ xe cho phép khách hàng tìm kiếm, xem tình trạng khả dụng theo thời gian thực và đặt trước vị trí đỗ (cho xe máy hoặc ô tô) tại các bãi đỗ; đồng thời hỗ trợ nhân viên vận hành xử lý xe vào/ra, đối chiếu với lượt đặt chỗ, tính phí tự động và cho phép quản trị viên cấu hình bãi đỗ, khu vực, giá dịch vụ và theo dõi báo cáo vận hành."*

---

## 2. ACTOR / VAI TRÒ

### 2.1. Khách hàng (Customer)
- Là ai: người có nhu cầu gửi xe, có thể có nhiều phương tiện.
- Cần làm gì: tìm bãi, xem chỗ trống, đặt chỗ, quản lý phương tiện, xem lịch sử, thanh toán.
- Được phép: tự quản lý tài khoản, phương tiện, đặt/hủy chỗ của chính mình, thanh toán.
- Không được phép: xem/sửa dữ liệu của khách khác, can thiệp vào cấu hình bãi, xác nhận xe vào/ra (đó là việc của nhân viên).

### 2.2. Nhân viên (Staff)
- Là ai: người trực tại bãi, xử lý xe vào/ra thực tế.
- Cần làm gì: check-in xe (đối chiếu đặt chỗ hoặc gán chỗ mới), check-out, xác nhận thanh toán tại chỗ nếu có.
- Được phép: xem trạng thái vị trí, gán/giải phóng vị trí, tra cứu lượt gửi theo biển số.
- Không được phép: cấu hình giá, tạo/xóa bãi, xem báo cáo toàn hệ thống, quản lý tài khoản người dùng.

### 2.3. Quản trị viên (Admin)
- Là ai: người quản lý toàn bộ hệ thống.
- Cần làm gì: cấu hình bãi, khu vực, vị trí, giá; quản lý người dùng/nhân viên; xem báo cáo, thống kê.
- Được phép: toàn quyền cấu hình và xem dữ liệu tổng hợp.
- Không được phép: (về nguyên tắc) trực tiếp thao tác nghiệp vụ vào/ra xe — đó là việc vận hành của nhân viên, admin chỉ giám sát.

**Về vai trò không cần thiết:** Không nên tách thêm "chủ bãi xe" (Owner) làm vai trò riêng nếu đồ án chỉ giả định một đơn vị vận hành nhiều bãi — vai trò Admin đã bao quát đủ. Cũng không cần vai trò "bảo vệ" tách biệt với "nhân viên" vì trong phạm vi đồ án, hai công việc này có thể gộp làm một (Staff).

| Vai trò | Chức năng chính | Quyền hạn |
|---|---|---|
| Customer | Đặt chỗ, quản lý phương tiện, xem lịch sử, thanh toán | Chỉ trên dữ liệu của bản thân |
| Staff | Check-in/check-out xe, gán vị trí, tra cứu lượt gửi | Thao tác vận hành tại bãi được phân công |
| Admin | Cấu hình bãi/khu vực/vị trí/giá, quản lý người dùng, xem báo cáo | Toàn quyền cấu hình & xem dữ liệu tổng hợp |

---

## 3. PHÂN TÍCH NGHIỆP VỤ TOÀN TRÌNH

### 3.1. Quy trình khách hàng (đã hợp lý, bổ sung một số nhánh)

```
Đăng ký/Đăng nhập
→ Thêm phương tiện (biển số, loại xe)
→ Tìm bãi đỗ (theo khu vực/địa điểm)
→ Xem chỗ trống theo loại xe + khung giờ
→ Chọn khu vực → chọn vị trí cụ thể (hoặc để hệ thống tự gán)
→ Chọn thời gian (giờ bắt đầu – giờ kết thúc dự kiến)
→ Xác nhận đặt chỗ (hệ thống khóa tạm vị trí)
→ Nhận mã đặt chỗ / QR code
→ Đến bãi trong khung giờ cho phép
→ Check-in (nhân viên quét mã hoặc nhập biển số)
→ Gửi xe
→ Lấy xe → Check-out
→ Tính phí (theo thực tế, đối chiếu với đặt chỗ)
→ Thanh toán
→ Hoàn thành, nhận hóa đơn/lịch sử
```

**Bổ sung các nhánh còn thiếu:**
- Khách có thể **không đặt chỗ trước**, đến bãi trực tiếp (walk-in) — vẫn cần được hệ thống hỗ trợ nếu còn chỗ trống.
- Khách có thể **hủy đặt chỗ** trước giờ check-in.
- Khách có thể **đến trễ** quá một khoảng thời gian cho phép (grace period) → hệ thống tự hủy, giải phóng vị trí (no-show).
- Khách có thể **gia hạn** thời gian gửi nếu đang trong bãi (should-have, không bắt buộc).

### 3.2. Quy trình xe vào bãi

- **Có đặt chỗ trước:** Khách/nhân viên nhập mã đặt chỗ hoặc biển số → hệ thống đối chiếu Reservation còn hiệu lực, đúng loại xe → xác nhận check-in → trạng thái vị trí chuyển "Đã đặt" → "Đang sử dụng" → tạo bản ghi ParkingSession gắn với Reservation.
- **Không đặt chỗ trước (walk-in):** Nhân viên kiểm tra còn vị trí trống loại tương ứng (xe máy/ô tô) → gán vị trí trống bất kỳ → tạo ParkingSession mới không gắn Reservation → cập nhật trạng thái vị trí "Đang sử dụng".
- **Nếu không còn chỗ:** Hệ thống báo hết chỗ theo loại xe đó, nhân viên từ chối nhận xe hoặc gợi ý bãi khác (nếu có nhiều bãi).
- **Thông tin ghi nhận khi vào:** biển số, loại xe, vị trí được gán, thời gian vào, nhân viên xử lý, có/không gắn với Reservation.
- **Chọn vị trí:** Ưu tiên vị trí đã đặt trước (nếu có); với walk-in, hệ thống có thể tự gợi ý vị trí trống gần nhất/ngẫu nhiên trong khu vực phù hợp loại xe.

### 3.3. Quy trình xe ra

- **Tra cứu lượt gửi:** bằng mã ParkingSession (vé/QR) hoặc biển số xe (fallback khi mất vé).
- **Tính thời gian:** `thời gian ra – thời gian vào thực tế` (không phải theo giờ đặt chỗ, vì thực tế có thể khác).
- **Tính phí:** áp dụng PricingRule theo loại xe và thời lượng thực tế gửi.
- **Nếu quá thời gian đặt chỗ:** tính phụ phí phần vượt (theo đơn giá giờ) — vẫn cho xe ra bình thường vì tiền chỉ tính theo thời gian gửi thực tế.
- **Nếu mất vé/thông tin đặt chỗ:** cho phép tra cứu bằng biển số + xác minh thủ công (nhân viên đối chiếu), có thể tính thêm phí xử lý (tùy chọn, should-have).
- **Sau khi xe ra:** ParkingSession chuyển trạng thái "Hoàn thành", vị trí đỗ chuyển về "Trống".

### 3.4. Quy trình đặt chỗ (chi tiết)

| Bước | Mô tả | Xử lý ngoại lệ |
|---|---|---|
| Chọn bãi | Khách chọn bãi theo khu vực | — |
| Chọn loại phương tiện | Xe máy / Ô tô | Ảnh hưởng khu vực & giá hiển thị |
| Chọn khu vực & vị trí | Xem sơ đồ trống theo khung giờ | Vị trí phải đúng loại phương tiện |
| Chọn thời gian | Giờ bắt đầu – giờ kết thúc dự kiến | Không được chọn khung giờ đã có người giữ chỗ |
| Kiểm tra khả dụng | Hệ thống khóa tạm (soft-lock) vị trí trong X phút để khách hoàn tất | Nếu 2 khách chọn cùng lúc → người xác nhận trước thắng |
| Xác nhận đặt | Tạo Reservation trạng thái "Đã xác nhận" | — |
| Hủy đặt | Khách hủy trước giờ vào | Giải phóng vị trí ngay |
| Hết hạn đặt | Quá giờ + grace period mà không check-in | Tự động chuyển "Hết hạn/No-show", giải phóng vị trí |
| Check-in | Chuyển "Đã xác nhận" → "Đang sử dụng" | — |
| No-show | Không đến trong thời gian cho phép | Có thể áp dụng chính sách phạt (should-have) |
| Hoàn thành | Sau khi check-out | Reservation & Session đóng |

---

## 4. XE MÁY VÀ Ô TÔ

**Khác biệt cốt lõi:** diện tích chiếm dụng khác nhau → cần loại vị trí (SlotType) khác nhau; mức giá khác nhau theo giờ; đôi khi khu vực đỗ khác nhau (tầng/khu riêng).

**Đề xuất mô hình (đơn giản, đủ thực tế):**
- Mỗi **Khu vực (Zone)** có thuộc tính `loại xe phục vụ` (Xe máy / Ô tô / Hỗn hợp — nếu muốn đơn giản hơn thì chỉ cần Xe máy hoặc Ô tô, không cần "hỗn hợp").
- Mỗi **Vị trí đỗ (ParkingSlot)** có thuộc tính `loại xe` kế thừa từ khu vực nó thuộc về.
- **Giá (PricingRule)** được định nghĩa riêng theo loại xe (ví dụ: xe máy 5.000đ/giờ, ô tô 20.000đ/giờ) — không cần bảng giá phức tạp theo từng vị trí.
- **Thông tin đặc thù:** xe máy chỉ cần biển số; ô tô có thể thêm thuộc tính "loại xe con/xe bán tải" nhưng **không bắt buộc** — nên giữ đơn giản: chỉ cần biển số + loại phương tiện (2 loại: MOTORBIKE, CAR) là đủ cho đồ án.
- **Không nên** làm riêng luồng đặt chỗ khác nhau cho 2 loại xe — chỉ khác ở bước lọc theo loại xe khi chọn khu vực/vị trí, logic nghiệp vụ dùng chung.

**Kết luận:** Chia theo Zone là đủ, không cần thiết kế loại "SlotType" phức tạp riêng biệt gây rối cho database.

---

## 5. CẤU TRÚC BÃI ĐỖ XE

```
ParkingLot (Bãi đỗ)
   └── Zone (Khu vực) — có thể bỏ qua Floor nếu bãi nhỏ/một tầng
        └── ParkingSlot (Vị trí đỗ)
```

**Có cần Floor không?** Không bắt buộc. Với đồ án, nên **gộp Floor vào Zone** (ví dụ Zone = "Tầng 1 - Khu xe máy") để giảm độ phức tạp database, trừ khi giảng viên yêu cầu mô hình đa tầng chi tiết. Nếu muốn thêm để trông "đầy đủ" hơn, có thể giữ Floor như một thuộc tính đơn giản (số tầng) trong Zone thay vì một entity riêng.

**Khu vực dùng để làm gì:** nhóm các vị trí theo loại xe, theo khu vực vật lý, và có thể áp dụng để hiển thị sơ đồ trực quan cho khách chọn.

**Thuộc tính của vị trí đỗ (ParkingSlot):**
- Mã vị trí (ví dụ A-01)
- Loại xe (kế thừa từ Zone)
- Trạng thái hiện tại
- Zone thuộc về

**Trạng thái vị trí đề xuất:**

| Trạng thái | Khi nào chuyển sang |
|---|---|
| Trống (Available) | Mặc định, hoặc sau khi checkout / hủy đặt / hết hạn đặt |
| Đã đặt (Reserved) | Khi khách xác nhận đặt chỗ thành công |
| Đang sử dụng (Occupied) | Khi xe check-in thực tế vào vị trí |
| Bảo trì (Maintenance) | Admin/nhân viên đánh dấu thủ công, tạm khóa không cho đặt/sử dụng |

---

## 6. CHỨC NĂNG HỆ THỐNG

### A. Chức năng khách hàng

| Chức năng | Mục đích | Input | Xử lý | Output | Ưu tiên |
|---|---|---|---|---|---|
| Đăng ký/Đăng nhập | Xác thực người dùng | Email/SĐT, mật khẩu | Kiểm tra, tạo/kiểm tra tài khoản | Token/phiên đăng nhập | MUST |
| Quản lý phương tiện | Lưu biển số xe của khách | Biển số, loại xe | CRUD Vehicle | Danh sách xe | MUST |
| Tìm bãi & xem chỗ trống | Chọn nơi gửi xe | Khu vực, loại xe, thời gian | Truy vấn slot trống | Danh sách bãi/khu vực/vị trí trống | MUST |
| Đặt chỗ | Giữ trước vị trí | Bãi, loại xe, vị trí, thời gian | Kiểm tra khả dụng, tạo Reservation | Mã đặt chỗ | MUST |
| Hủy đặt chỗ | Hủy khi không cần nữa | Mã đặt chỗ | Cập nhật trạng thái, giải phóng vị trí | Xác nhận hủy | MUST |
| Xem lịch sử đặt chỗ/gửi xe | Theo dõi hoạt động | — | Truy vấn dữ liệu cá nhân | Danh sách lịch sử | SHOULD |
| Thanh toán | Trả phí gửi xe | Mã phiên gửi | Tính phí, ghi nhận Payment | Hóa đơn | MUST |
| Nhận thông báo | Nhắc lịch, cảnh báo hết hạn | — | Gửi thông báo hệ thống | Thông báo trong app | NICE |

### B. Chức năng nhân viên

| Chức năng | Mục đích | Input | Xử lý | Output | Ưu tiên |
|---|---|---|---|---|---|
| Check-in xe | Ghi nhận xe vào bãi | Mã đặt chỗ hoặc biển số | Đối chiếu Reservation hoặc gán slot mới | Tạo ParkingSession | MUST |
| Check-out xe | Ghi nhận xe ra & tính phí | Mã phiên/biển số | Tính thời gian, tính phí | Hóa đơn, đóng session | MUST |
| Xem trạng thái bãi | Biết còn trống bao nhiêu | — | Truy vấn slot theo trạng thái | Sơ đồ/bảng trạng thái | MUST |
| Tra cứu lượt gửi theo biển số | Hỗ trợ khi mất vé | Biển số | Tìm session đang mở | Thông tin phiên gửi | SHOULD |

### C. Chức năng quản trị viên

| Chức năng | Mục đích | Input | Xử lý | Output | Ưu tiên |
|---|---|---|---|---|---|
| Quản lý bãi/khu vực/vị trí | Cấu hình hệ thống | Thông tin bãi, zone, slot | CRUD | Danh sách cấu hình | MUST |
| Quản lý giá | Thiết lập PricingRule | Loại xe, đơn giá | CRUD | Bảng giá | MUST |
| Quản lý người dùng/nhân viên | Quản trị tài khoản | Thông tin user | CRUD, phân quyền | Danh sách người dùng | SHOULD |
| Xem báo cáo/thống kê | Theo dõi vận hành | Khoảng thời gian | Tổng hợp dữ liệu | Biểu đồ, số liệu | SHOULD |
| Đánh dấu bảo trì vị trí | Khóa tạm vị trí hỏng | Slot ID | Cập nhật trạng thái | Slot chuyển "Bảo trì" | NICE |

---

## 7. CÁC CHỨC NĂNG NỔI BẬT (3–5 điểm nhấn khi thuyết trình)

1. **Đặt chỗ trước theo thời gian thực** — đây là điểm khác biệt cốt lõi so với đề tài "quản lý bãi xe" thông thường; giải quyết bài toán tranh chấp vị trí, khóa tạm, hết hạn.
2. **Phân khu & xử lý riêng cho xe máy/ô tô** — cho thấy nghiệp vụ có tính thực tế hơn so với hệ thống chỉ có một loại phương tiện.
3. **Đối chiếu đặt chỗ với vận hành thực tế (check-in/check-out)** — thể hiện tính "khép kín" trọn vòng đời của một lượt gửi xe, không chỉ là app đặt lịch.
4. **Tự động tính phí theo thời gian thực tế, xử lý các trường hợp lệch giờ (quá giờ, no-show)** — đây là logic nghiệp vụ có giá trị, không phải CRUD.
5. Dashboard thống kê tỷ lệ lấp đầy/doanh thu là điểm cộng nhưng **chỉ là chức năng hỗ trợ**, không nên coi là điểm nổi bật chính vì bản thân nó chỉ là truy vấn tổng hợp.

**Nhận định:** "Hiển thị trạng thái chỗ trống" và "Quản lý lượt gửi" tự thân chỉ là CRUD/truy vấn; giá trị thực nằm ở logic xử lý đặt chỗ + đối chiếu vận hành + tính phí theo ngữ cảnh (đây mới là phần cần đầu tư chất xám khi làm báo cáo).

---

## 8. CÁC TRƯỜNG HỢP NGOẠI LỆ

| Tình huống | Cách xử lý đề xuất |
|---|---|
| Hết chỗ theo loại xe | Từ chối đặt/nhận xe, gợi ý khung giờ khác hoặc bãi khác |
| Vị trí vừa bị người khác đặt (race condition) | Cơ chế khóa tạm (soft-lock) khi khách đang chọn; xác nhận theo nguyên tắc ai xác nhận trước được giữ |
| Khách đặt nhưng không đến (no-show) | Sau grace period (VD 15-30 phút) tự hủy, giải phóng vị trí |
| Khách đến sớm | Cho check-in sớm nếu vị trí đang trống, không phạt |
| Khách đến muộn (trong grace period) | Vẫn cho check-in bình thường |
| Khách hủy đặt | Cho hủy trước giờ bắt đầu; nếu đã thanh toán trước (nếu có), xử lý hoàn tiền theo chính sách |
| Xe vào không đặt trước | Xử lý như walk-in, gán slot trống theo loại xe |
| Xe ra trước thời gian dự kiến | Tính phí theo thời gian thực tế đã gửi, không theo thời gian đặt |
| Xe ở lâu hơn thời gian đặt | Tính thêm phụ phí phần vượt theo đơn giá giờ |
| Hủy khi đã thanh toán | Áp dụng chính sách hoàn tiền một phần/toàn phần tùy thời điểm hủy (should-have, có thể đơn giản hóa: không hoàn tiền sau khi thanh toán) |
| Nhân viên nhập sai biển số | Cho phép sửa thông tin Session trong thời gian ngắn sau khi tạo, có ghi log |
| Hai xe trùng biển số do lỗi nhập liệu | Validate không cho hai Session cùng biển số cùng đang "Đang sử dụng" tại cùng một bãi |
| Vị trí bị bảo trì | Không hiển thị trong danh sách khả dụng, không thể đặt/gán |
| Khách có nhiều phương tiện | Vehicle liên kết với User theo quan hệ 1-n, chọn xe khi đặt chỗ |
| Một khách có nhiều lượt gửi cùng lúc | Cho phép, vì có nhiều xe — mỗi Session độc lập |
| Mất vé | Tra cứu bằng biển số, xác minh thủ công bởi nhân viên |
| Hệ thống phát hiện vị trí đã có xe nhưng dữ liệu ghi "Trống" (do lỗi) | Cho nhân viên báo cáo/đánh dấu bảo trì thủ công để đối soát (không cần xử lý tự động phức tạp) |

---

## 9. QUẢN LÝ GIÁ / TÍNH PHÍ

**Đề xuất cách tính đơn giản nhưng thực tế:**
- Tính phí theo **giờ**, làm tròn lên (ví dụ: 1 giờ 10 phút → tính 2 giờ), riêng theo từng loại xe.
- Mỗi loại xe có một `PricingRule` cơ bản: đơn giá/giờ (có thể thêm mức giá theo giờ đầu khác giờ sau, nhưng đây là "should-have" chứ không bắt buộc).
- **Gửi qua ngày:** áp dụng đơn giá theo ngày nếu vượt quá X giờ (ví dụ trên 12 giờ tính theo ngày) — tùy chọn nâng cao, phiên bản tối thiểu chỉ cần tính lũy kế theo giờ không giới hạn.
- **Quá thời gian đặt:** phần thời gian vượt tính thêm theo đơn giá giờ bình thường (không cần đơn giá phạt riêng để giữ đơn giản).
- **Đặt trước nhưng không đến:** không phát sinh phí gửi xe (vì xe chưa vào bãi); có thể có phí giữ chỗ nhỏ nếu muốn mô phỏng thực tế hơn (nice-to-have, không bắt buộc).
- **Không đặt trước (walk-in):** tính phí hoàn toàn theo thời gian thực tế vào-ra, không liên quan Reservation.

**Không cần:** hệ thống giá theo giờ cao điểm/thấp điểm phức tạp, không cần tích hợp cổng thanh toán ngân hàng thật — có thể mô phỏng thanh toán (giả lập "đã thanh toán") để tập trung vào nghiệp vụ chính.

---

## 10. DATABASE (Mức khái niệm)

**Danh sách entity và đánh giá:**

| Entity | Đánh giá |
|---|---|
| User | Bắt buộc |
| Role | Có thể đơn giản hóa thành 1 trường `role` (enum) trong User thay vì bảng riêng, trừ khi cần phân quyền động phức tạp |
| Vehicle | Bắt buộc |
| ParkingLot | Bắt buộc |
| Floor | Không cần thiết là entity riêng — gộp vào Zone như đã phân tích ở mục 5 |
| Zone | Bắt buộc |
| ParkingSlot | Bắt buộc |
| Reservation | Bắt buộc — trung tâm của nghiệp vụ |
| ParkingSession | Bắt buộc — trung tâm của nghiệp vụ vận hành |
| PricingRule | Bắt buộc nhưng đơn giản (theo loại xe) |
| Payment | Bắt buộc (có thể gộp vào ParkingSession nếu muốn tối giản, nhưng nên tách riêng để rõ ràng nghiệp vụ) |
| Notification | Không bắt buộc — chỉ nên làm nếu còn thời gian (nice-to-have) |

**Mô hình entity cuối cùng đề xuất:**

- **User** (id, name, email, password_hash, phone, role)
- **Vehicle** (id, user_id [FK], plate_number, vehicle_type [MOTORBIKE/CAR])
- **ParkingLot** (id, name, address)
- **Zone** (id, parking_lot_id [FK], name, vehicle_type)
- **ParkingSlot** (id, zone_id [FK], code, status)
- **Reservation** (id, user_id [FK], vehicle_id [FK], slot_id [FK], start_time, end_time, status)
- **ParkingSession** (id, reservation_id [FK, nullable], vehicle_id [FK], slot_id [FK], staff_id [FK], check_in_time, check_out_time, status)
- **PricingRule** (id, vehicle_type, price_per_hour)
- **Payment** (id, session_id [FK], amount, method, paid_at)

**Cardinality chính:**
- User 1—n Vehicle
- User 1—n Reservation
- ParkingLot 1—n Zone
- Zone 1—n ParkingSlot
- ParkingSlot 1—n Reservation (theo thời gian, không đồng thời)
- ParkingSlot 1—n ParkingSession (theo thời gian)
- Reservation 1—0..1 ParkingSession (một đặt chỗ dẫn tới tối đa một phiên gửi thực tế)
- ParkingSession 1—1 Payment

Đây là mô hình **vừa đủ**: không thiếu thực thể quan trọng, không thừa thực thể không cần thiết (bỏ Floor, gộp Role, cân nhắc bỏ Notification).

---

## 11. API / BACKEND (Nhóm endpoint chính)

| Nhóm | Mục đích | Endpoint chính | Method | Actor |
|---|---|---|---|---|
| /auth | Đăng ký/đăng nhập | /auth/register, /auth/login | POST | Customer, Staff, Admin |
| /vehicles | Quản lý phương tiện | /vehicles, /vehicles/:id | GET/POST/PUT/DELETE | Customer |
| /parking-lots | Xem danh sách bãi | /parking-lots, /parking-lots/:id | GET (Admin thêm POST/PUT) | Customer, Admin |
| /zones | Quản lý khu vực | /zones | GET/POST/PUT | Admin |
| /parking-slots | Xem/khởi tạo vị trí, xem trạng thái | /parking-slots?zone_id=&status= | GET (Admin thêm POST/PUT) | Customer (xem), Staff, Admin |
| /reservations | Đặt/hủy/xem đặt chỗ | /reservations, /reservations/:id/cancel | POST/GET/PUT | Customer |
| /parking-sessions | Check-in/check-out | /parking-sessions/check-in, /parking-sessions/:id/check-out | POST/PUT | Staff |
| /pricing | Cấu hình giá | /pricing-rules | GET/POST/PUT | Admin |
| /payments | Thanh toán | /payments | POST, GET | Customer, Staff |
| /reports | Báo cáo thống kê | /reports/occupancy, /reports/revenue | GET | Admin |

**Ưu tiên:** `/auth`, `/reservations`, `/parking-sessions`, `/parking-slots` là nhóm API lõi thể hiện toàn bộ nghiệp vụ; `/reports` và `/notifications` (nếu có) là phụ trợ.

---

## 12. FRONTEND / GIAO DIỆN

### Khách hàng
- Trang chủ, Đăng nhập, Đăng ký — **bắt buộc**
- Danh sách bãi, Chi tiết bãi (sơ đồ vị trí trống) — **bắt buộc**
- Đặt chỗ (chọn loại xe, khu vực, vị trí, thời gian) — **bắt buộc**
- Quản lý phương tiện — **bắt buộc**
- Lịch sử đặt chỗ / lịch sử gửi xe — **nên có**
- Thanh toán — **bắt buộc** (có thể là màn hình giả lập)
- Thông báo — **có thể bỏ** nếu thiếu thời gian

### Nhân viên
- Dashboard (trạng thái bãi tổng quan) — **bắt buộc**
- Xe vào (check-in) — **bắt buộc**
- Xe ra (check-out) — **bắt buộc**
- Danh sách lượt gửi đang mở — **nên có**
- Tra cứu biển số — **nên có**
- Đặt chỗ hộ khách (walk-in không cần) — **có thể bỏ**

### Admin
- Dashboard thống kê — **nên có**
- Quản lý bãi/khu vực/vị trí — **bắt buộc**
- Quản lý giá — **bắt buộc**
- Quản lý người dùng — **nên có**
- Quản lý phương tiện (xem toàn hệ thống) — **có thể bỏ**, không cần thiết vì trùng với chức năng khách hàng
- Báo cáo/thống kê chi tiết — **nên có**, nhưng chỉ cần vài biểu đồ, không cần đầy đủ như BI thực thụ

---

## 13. DASHBOARD / THỐNG KÊ

**Số liệu có ý nghĩa để chọn (tránh làm màu mè vô nghĩa):**
- Tổng số vị trí / đang trống / đang sử dụng / đã đặt — theo loại xe (biểu đồ cột hoặc thẻ số liệu)
- Số lượt xe vào/ra theo ngày — biểu đồ đường
- Doanh thu theo ngày/tuần — biểu đồ đường hoặc cột
- Tỷ lệ lấp đầy bãi (occupancy rate) — chỉ số phần trăm, có giá trị minh họa hiệu quả vận hành
- Khung giờ đông xe nhất — biểu đồ cột theo giờ trong ngày, đây là điểm cộng vì thể hiện khả năng phân tích dữ liệu chứ không chỉ hiển thị số liệu thô

**Không cần:** biểu đồ dự báo AI, bản đồ nhiệt phức tạp, số liệu real-time bằng WebSocket (có thể nói là hướng mở rộng nhưng không bắt buộc triển khai).

---

## 14. USE CASE (danh sách hoàn chỉnh)

**Customer:** Đăng ký, Đăng nhập, Quản lý phương tiện, Tìm bãi & xem chỗ trống, Đặt chỗ, Hủy đặt chỗ, Xem lịch sử đặt chỗ/gửi xe, Thanh toán.

**Staff:** Đăng nhập, Check-in xe (có/không có đặt chỗ), Check-out xe & tính phí, Xem trạng thái bãi, Tra cứu lượt gửi theo biển số.

**Admin:** Đăng nhập, Quản lý bãi đỗ, Quản lý khu vực, Quản lý vị trí đỗ (bao gồm đánh dấu bảo trì), Quản lý giá, Quản lý người dùng/nhân viên, Xem báo cáo thống kê.

**Use case còn thiếu cần bổ sung:** "Hủy đặt chỗ tự động do hết hạn" (là use case hệ thống tự kích hoạt, nên thể hiện trong tài liệu như một tiến trình nền/scheduled job), và "Xác thực tính khả dụng vị trí trước khi xác nhận đặt" (thể hiện logic race-condition).

---

## 15. LUỒNG DỮ LIỆU

**Đặt chỗ:**
```
Customer → chọn bãi → chọn loại xe → chọn khu vực/vị trí → chọn thời gian
→ Backend kiểm tra khả dụng (đối chiếu Reservation hiện có trong khung giờ)
→ Database (khóa tạm slot)
→ Tạo Reservation (status: Confirmed)
→ Cập nhật trạng thái ParkingSlot → "Đã đặt"
→ Trả mã đặt chỗ cho Customer
```

**Xe vào:**
```
Staff nhập mã đặt chỗ/biển số → Backend tìm Reservation hoặc tạo mới (walk-in)
→ Kiểm tra slot còn hợp lệ → Tạo ParkingSession (check_in_time = now)
→ Cập nhật ParkingSlot → "Đang sử dụng"
→ Trả xác nhận cho Staff
```

**Xe ra:**
```
Staff tra cứu Session bằng mã/biển số → Backend tính (now - check_in_time)
→ Áp dụng PricingRule theo vehicle_type → tính phí
→ Cập nhật ParkingSession (check_out_time, status = Completed)
→ Cập nhật ParkingSlot → "Trống"
→ Trả số tiền cần thanh toán
```

**Thanh toán:**
```
Customer/Staff xác nhận thanh toán → Backend tạo Payment gắn với Session
→ Cập nhật trạng thái Session/Payment → "Đã thanh toán"
```

**Hủy đặt chỗ:**
```
Customer chọn hủy → Backend kiểm tra thời điểm hủy hợp lệ (trước giờ bắt đầu)
→ Cập nhật Reservation → "Đã hủy"
→ Cập nhật ParkingSlot → "Trống"
```

---

## 16. PHÂN TÍCH PHẠM VI ĐỒ ÁN

### PHIÊN BẢN TỐI THIỂU (MVP có thể hoàn thành chắc chắn)
- Đăng ký/đăng nhập, quản lý phương tiện
- Xem bãi/khu vực/vị trí trống theo loại xe
- Đặt chỗ, hủy đặt chỗ, tự động hết hạn (no-show)
- Check-in/check-out (Staff), có/không có đặt chỗ
- Tính phí theo giờ, thanh toán giả lập
- Quản lý bãi/khu vực/vị trí/giá (Admin CRUD cơ bản)

### PHIÊN BẢN CHUẨN (đủ tốt để demo Đồ án 4)
- Tất cả MVP
- Cơ chế khóa tạm chống trùng đặt chỗ (race condition)
- Dashboard thống kê cơ bản (occupancy, doanh thu, lượt vào/ra)
- Lịch sử đặt chỗ/gửi xe cho khách
- Quản lý người dùng cho Admin
- Xử lý đầy đủ các trường hợp ngoại lệ ở mục 8

### PHIÊN BẢN NÂNG CAO (nếu còn thời gian)
- Thông báo trong app (nhắc hết hạn đặt chỗ, xác nhận thanh toán)
- QR code cho vé đặt chỗ (dạng ảnh QR đơn giản, không cần thiết bị quét thật)
- Biểu đồ khung giờ đông xe, gợi ý khung giờ nên đặt
- Chính sách hoàn tiền khi hủy đặt chỗ đã thanh toán

### NHỮNG THỨ KHÔNG NÊN LÀM (trừ khi giảng viên yêu cầu)
- AI nhận diện biển số (Computer Vision)
- Camera thật / tích hợp phần cứng
- IoT cảm biến vị trí đỗ thực tế
- Barrier tự động (cổng chắn vật lý)
- Định vị GPS
- Cổng thanh toán ngân hàng thật (VNPay, Momo thật) — có thể **mô phỏng giao diện** nhưng không cần tích hợp thật
- Thiết bị quét QR vật lý — chỉ cần hiển thị mã QR dạng ảnh, xác nhận bằng nhập tay mã số
- Machine Learning / dự đoán nhu cầu

**Ranh giới rõ ràng:** Đồ án này là phần mềm quản lý nghiệp vụ (web/app), không phải hệ thống nhúng/IoT. Bất kỳ chức năng nào đòi hỏi phần cứng thật hoặc mô hình AI đều nằm ngoài phạm vi và chỉ nên đề cập như "hướng phát triển trong tương lai" trong báo cáo.

---

## 17. ĐÁNH GIÁ ĐỀ TÀI

| Tiêu chí | Điểm (10) | Ghi chú |
|---|---|---|
| Độ khó | 7 | Đủ thách thức nhờ nghiệp vụ đặt chỗ, không quá khó nếu giới hạn đúng phạm vi |
| Độ thực tế | 8 | Sát với nhu cầu thực tế (bãi xe trung tâm thương mại, khu văn phòng) |
| Độ nổi bật | 8 | Chức năng đặt chỗ + đối chiếu vận hành là điểm khác biệt rõ so với đề tài quản lý đơn thuần |
| Khối lượng code | 6-7 | Vừa phải nếu giữ đúng phạm vi MVP/chuẩn |
| Độ phức tạp database | 6 | Vừa phải, khoảng 8-9 bảng |
| Độ phức tạp backend | 7 | Logic đặt chỗ, race condition, tính phí là phần cần đầu tư nhất |
| Độ phức tạp frontend | 6 | Nhiều màn hình nhưng không đòi hỏi UI phức tạp |
| Khả năng demo | 8 | Có thể demo trọn vòng đời: đặt chỗ → vào → ra → thanh toán |
| Khả năng thuyết trình | 8 | Có câu chuyện nghiệp vụ rõ ràng, dễ trình bày với giảng viên |
| Khả năng hoàn thành trong thời gian sinh viên | 7 | Khả thi nếu tuân thủ đúng ranh giới ở mục 16 |

**Kết luận: NÊN CHỌN đề tài này**, với điều kiện tuân thủ nghiêm ngặt phạm vi MVP → Chuẩn, tránh sa đà vào các phần "không nên làm" đã liệt kê. Ý tưởng ban đầu đã hợp lý; điều chỉnh chính là loại bỏ Floor như một entity riêng, đơn giản hóa Role và Notification, và tập trung đầu tư vào logic đặt chỗ (khóa tạm, hết hạn, đối chiếu vận hành) — đây mới là phần tạo ra điểm số khi bảo vệ đồ án.

---

## 18. MASTER BLUEPRINT — HỆ THỐNG ĐẶT CHỖ VÀ QUẢN LÝ BÃI ĐỖ XE

**1. Tên đề tài:** Xây dựng hệ thống đặt chỗ và quản lý bãi đỗ xe (hỗ trợ xe máy và ô tô)

**2. Mục tiêu:** Cho phép khách hàng đặt trước vị trí đỗ theo thời gian thực, đồng thời hỗ trợ nhân viên vận hành xử lý xe vào/ra và đối chiếu với lượt đặt chỗ, tự động tính phí; quản trị viên cấu hình và theo dõi vận hành.

**3. Vấn đề giải quyết:** Sự không chắc chắn về chỗ trống khi gửi xe truyền thống; thiếu dữ liệu thời gian thực để quản lý và tối ưu vận hành bãi đỗ.

**4. Đối tượng sử dụng:** Khách gửi xe (xe máy/ô tô), nhân viên vận hành bãi, quản trị viên hệ thống.

**5. Vai trò:** Customer, Staff, Admin (không cần Role riêng biệt cho "chủ bãi" hay "bảo vệ").

**6. Chức năng chính:** Đặt chỗ, quản lý phương tiện, check-in/check-out, tính phí tự động, thanh toán, cấu hình bãi/khu vực/vị trí/giá, báo cáo thống kê.

**7. Chức năng nổi bật:** Đặt chỗ trước theo thời gian thực với cơ chế khóa tạm chống trùng; phân khu xe máy/ô tô; đối chiếu đặt chỗ với vận hành thực tế; tính phí tự động xử lý các lệch giờ.

**8. Quy trình nghiệp vụ chính:** Đăng ký/đăng nhập → thêm xe → tìm & đặt chỗ → đến bãi → check-in → gửi xe → check-out → tính phí → thanh toán → hoàn thành.

**9. Quy trình đặt chỗ:** Chọn bãi/loại xe/khu vực/vị trí/thời gian → khóa tạm → xác nhận → (hủy/hết hạn/check-in) → hoàn thành.

**10. Quy trình xe vào:** Đối chiếu Reservation (nếu có) hoặc gán slot mới (walk-in) → tạo ParkingSession → cập nhật trạng thái slot.

**11. Quy trình xe ra:** Tra cứu Session → tính thời gian & phí theo PricingRule → đóng Session → giải phóng slot.

**12. Quản lý xe máy:** Zone riêng biệt cho xe máy, đơn giá riêng, chỉ cần biển số làm định danh.

**13. Quản lý ô tô:** Zone riêng biệt cho ô tô, đơn giá riêng cao hơn xe máy, chỉ cần biển số làm định danh.

**14. Cấu trúc bãi đỗ:** ParkingLot → Zone (gộp khái niệm tầng vào Zone) → ParkingSlot.

**15. Trạng thái vị trí:** Trống → Đã đặt → Đang sử dụng → Trống (vòng lặp); Bảo trì là trạng thái ngoài luồng do Admin/Staff đánh dấu thủ công.

**16. Tính phí:** Theo giờ, làm tròn lên, riêng theo loại xe; phần vượt giờ đặt tính thêm theo đơn giá thường; no-show không phát sinh phí gửi xe.

**17. Thanh toán:** Ghi nhận Payment gắn với ParkingSession, có thể mô phỏng (không cần cổng thanh toán thật).

**18. Database:** 9 entity chính — User, Vehicle, ParkingLot, Zone, ParkingSlot, Reservation, ParkingSession, PricingRule, Payment (bỏ Floor riêng, gộp Role vào User, Notification là tùy chọn).

**19. API:** /auth, /vehicles, /parking-lots, /zones, /parking-slots, /reservations, /parking-sessions, /pricing, /payments, /reports.

**20. Màn hình frontend:** Customer (trang chủ, đăng nhập/ký, danh sách & chi tiết bãi, đặt chỗ, phương tiện, lịch sử, thanh toán); Staff (dashboard, check-in, check-out, tra cứu); Admin (dashboard, quản lý bãi/khu vực/vị trí/giá/người dùng, báo cáo).

**21. Dashboard:** Số vị trí theo trạng thái/loại xe, lượt vào/ra theo ngày, doanh thu, tỷ lệ lấp đầy, khung giờ đông xe.

**22. Use Case:** Đầy đủ theo 3 vai trò như mục 14, bổ sung use case hệ thống tự động hủy đặt chỗ hết hạn.

**23. Các trường hợp ngoại lệ:** Toàn bộ danh sách và cách xử lý tại mục 8.

**24. Phạm vi MUST HAVE:** Đăng ký/đăng nhập, quản lý phương tiện, xem chỗ trống, đặt/hủy chỗ, check-in/check-out, tính phí, thanh toán giả lập, CRUD cấu hình cơ bản cho Admin.

**25. Phạm vi SHOULD HAVE:** Cơ chế khóa tạm chống trùng, dashboard thống kê, lịch sử cho khách, quản lý người dùng, xử lý đầy đủ ngoại lệ.

**26. Phạm vi NICE TO HAVE:** Thông báo trong app, QR code đặt chỗ (dạng ảnh), biểu đồ khung giờ đông xe, chính sách hoàn tiền.

**27. Những thứ không nên làm:** AI nhận diện biển số, camera/IoT/barrier thật, GPS, cổng thanh toán ngân hàng thật, thiết bị quét QR vật lý, Machine Learning.

**28. Điểm nổi bật để trình bày với giảng viên:** Đề tài không chỉ "quản lý" mà có nghiệp vụ đặt chỗ với xử lý tranh chấp thời gian thực, đối chiếu đặt chỗ với vận hành thực tế, và tính phí tự động theo ngữ cảnh — đây là phần khác biệt so với đề tài CRUD thông thường.

**29. Đánh giá độ khó:** Khó vừa phải (6.5–7/10), khả thi trong thời gian đồ án nếu tuân thủ đúng phạm vi.

**30. Lộ trình phát triển:**
1. Hoàn thiện phân tích nghiệp vụ (đã xong ở tài liệu này) và use case chi tiết.
2. Thiết kế database chi tiết (ERD) dựa trên 9 entity đã chốt.
3. Thiết kế API (đặc tả request/response) cho các nhóm ở mục 19.
4. Dựng khung backend (auth, CRUD cấu hình cơ bản) trước.
5. Xây dựng logic lõi: đặt chỗ (khóa tạm, hết hạn), check-in/check-out, tính phí.
6. Xây dựng frontend theo thứ tự: luồng khách hàng → luồng nhân viên → luồng admin.
7. Tích hợp thanh toán giả lập.
8. Xây dựng dashboard thống kê.
9. Kiểm thử toàn bộ các trường hợp ngoại lệ ở mục 8.
10. Viết báo cáo, chuẩn bị kịch bản demo trọn vòng đời một lượt gửi xe.