# CHƯƠNG 4: TRIỂN KHAI WEBSITE

> Bản thảo đối chiếu mã nguồn và tài liệu SQL ngày 18/10/2026. Nội dung phản ánh kết quả triển khai hiện có: giao diện nguyên mẫu, cơ sở dữ liệu và các thủ tục nghiệp vụ; phần API và tích hợp toàn hệ thống còn cần hoàn thiện. Các vị trí ghi “Chèn hình” là chỗ dành cho ảnh chụp thực tế, chưa phải minh chứng đã được bổ sung.

## 4.1. Triển khai các chức năng theo vai trò người dùng

Chương này trình bày quá trình hiện thực hệ thống **Quản lý bãi đỗ xe trực tuyến** từ các nội dung phân tích và thiết kế ở những chương trước. Nội dung tập trung vào giao diện theo từng vai trò, tổ chức xử lý nghiệp vụ, triển khai cơ sở dữ liệu và phương pháp kiểm thử. Hệ thống phục vụ một đơn vị vận hành nhiều bãi đỗ xe, với ba nhóm người dùng gồm khách hàng, nhân viên và quản trị viên.

Hệ thống được định hướng tổ chức thành ba thành phần: giao diện trình duyệt, máy chủ cung cấp API và cơ sở dữ liệu SQL Server. Giao diện đảm nhiệm việc nhập và trình bày thông tin; máy chủ xác thực người dùng, kiểm tra quyền và điều phối nghiệp vụ; cơ sở dữ liệu lưu trữ trạng thái vận hành, lịch đặt chỗ, lượt gửi xe và thanh toán. Khi hoàn thiện tích hợp, dữ liệu nghiệp vụ được trao đổi thông qua API, trình duyệt không kết nối trực tiếp với SQL Server.

Tại thời điểm lập báo cáo, giao diện đã được xây dựng dưới dạng nguyên mẫu và cơ sở dữ liệu đã được khởi tạo. Các nghiệp vụ cốt lõi có phần xử lý bằng thủ tục SQL. Backend mới ở mức khởi tạo dự án, chưa cung cấp các API nghiệp vụ tương ứng. Vì vậy, kết quả trình bày trong chương phân biệt giữa giao diện mô phỏng, xử lý đã có tại cơ sở dữ liệu và những nội dung còn cần tích hợp để vận hành toàn bộ website.

### 4.1.1. Phía giao diện

Giao diện được xây dựng bằng React và JavaScript, sử dụng cú pháp JSX để tổ chức các thành phần hiển thị. Vite hỗ trợ môi trường phát triển và đóng gói ứng dụng. Các biểu mẫu, bảng dữ liệu, hộp thoại, thẻ thống kê và thông báo sử dụng thư viện Material UI. React Router được dùng để khai báo các trang và điều hướng giữa các nhóm chức năng.

Các màn hình nghiệp vụ sử dụng bố cục chung gồm thanh tiêu đề, thông tin tài khoản và danh mục chức năng. Danh mục được thay đổi theo vai trò người dùng nhằm giúp từng nhóm truy cập thuận tiện vào các tác vụ thường sử dụng. Bố cục có khai báo cách hiển thị theo kích thước màn hình, trong đó thanh điều hướng có thể thu gọn trên thiết bị nhỏ. Khả năng hiển thị trên các thiết bị cụ thể cần được xác nhận bằng kiểm thử giao diện.

Khu vực công khai gồm trang chủ, trang đăng nhập và trang đăng ký. Trang chủ giới thiệu các nhóm chức năng như đặt chỗ trước, quản lý xe máy và ô tô, ghi nhận xe vào/ra và theo dõi báo cáo. Trang đăng ký có các trường họ tên, email, số điện thoại và mật khẩu. Trang đăng nhập cho phép nhập thông tin tài khoản và chuyển đến màn hình của vai trò tương ứng.

Trong nguyên mẫu hiện tại, đăng nhập sử dụng các tài khoản mô phỏng được khai báo tại frontend. Thông tin người dùng và chuỗi token mô phỏng được lưu vào bộ nhớ trình duyệt để phục vụ điều hướng. Đây là cơ chế phục vụ trình diễn giao diện; chưa phải kết quả xác thực bằng máy chủ. Các tài khoản mô phỏng của giao diện cũng chưa đồng bộ với tài khoản demo trong SQL Server. Việc hiển thị menu theo vai trò chưa thay thế cho kiểm tra quyền tại route và API.

Phân hệ khách hàng gồm trang tổng quan, quản lý phương tiện, tìm bãi đỗ và lịch sử đặt chỗ. Màn hình quản lý phương tiện trình bày danh sách xe, biển số và loại phương tiện; đồng thời có biểu mẫu thêm, sửa và thao tác xóa trên giao diện. Theo thiết kế dữ liệu, thao tác ngừng sử dụng phương tiện cần được thực hiện bằng trạng thái hoạt động để giữ lịch sử. Các nút thao tác hiện có cần được nối với API và đồng bộ lại quy tắc này.

Chức năng tìm bãi được trình bày theo ba bước: chọn bãi và thời gian, chọn vị trí, sau đó xác nhận. Khách hàng nhập loại xe, thời gian bắt đầu và thời gian kết thúc để xem thông tin phù hợp. Sơ đồ vị trí sử dụng màu và nhãn để phân biệt vị trí trống, đã được đặt trong khung giờ, đang sử dụng và bảo trì. Trong phiên bản giao diện hiện tại, danh sách bãi, vị trí và thông báo xác nhận đang được mô phỏng; thao tác xác nhận chưa tạo bản ghi đặt chỗ trong SQL Server.

Màn hình lịch sử đặt chỗ trình bày mã đặt chỗ, bãi đỗ, vị trí, biển số, khoảng thời gian và trạng thái. Giao diện có nút yêu cầu hủy lượt đặt. Điều kiện chỉ được hủy trước giờ bắt đầu và khi lượt đặt còn được xác nhận phải do máy chủ kiểm tra khi API được triển khai. Những trạng thái kết thúc như hoàn thành, hủy hoặc hết hạn cần được hiển thị theo dữ liệu được trả về từ hệ thống.

Phân hệ nhân viên gồm trang tổng quan, màn hình xe vào và màn hình xe ra. Màn hình xe vào cho phép lựa chọn giữa khách đã đặt chỗ và khách đến trực tiếp. Với khách đã đặt, nhân viên nhập thông tin tra cứu lượt đặt. Với khách đến trực tiếp, nhân viên nhập biển số và loại xe. Màn hình xe ra hỗ trợ tra cứu lượt gửi, hiển thị thời gian vào, thời lượng gửi và số tiền dự kiến trước khi xác nhận.

Ở nguyên mẫu hiện tại, một số lỗi gọi API được thay bằng dữ liệu hoặc thông báo thành công mô phỏng. Chẳng hạn, xe vào có thể được gán một mã vị trí ngẫu nhiên khi chưa có backend; xe ra đang tính phí minh họa tại trình duyệt. Những kết quả này chỉ minh họa thao tác của nhân viên, chưa chứng minh xe đã được ghi nhận hoặc thanh toán đã được lưu. Khi tích hợp, giao diện phải hiển thị kết quả thực tế của API và để máy chủ chốt số tiền chính thức.

Phân hệ quản trị viên gồm các màn hình quản lý bãi đỗ, khu vực, vị trí, bảng giá, tài khoản và báo cáo. Các danh sách có biểu mẫu hoặc hộp thoại phục vụ việc nhập và điều chỉnh thông tin. Trang báo cáo trình bày các chỉ số và bảng tổng hợp lượt xe, doanh thu, tỷ lệ lấp đầy. Dữ liệu ở các màn hình này chủ yếu được khai báo mẫu hoặc thay đổi trong trạng thái của React, chưa phản ánh các giao dịch lưu trữ tập trung.

**Vị trí minh họa giao diện cần bổ sung:**

- **Hình 4.1.** Giao diện trang chủ của hệ thống.
- **Hình 4.2.** Giao diện đăng nhập và lựa chọn tài khoản demo.
- **Hình 4.3.** Giao diện quản lý phương tiện của khách hàng.
- **Hình 4.4.** Giao diện tìm bãi và lựa chọn vị trí đỗ xe.
- **Hình 4.5.** Giao diện lịch sử đặt chỗ.
- **Hình 4.6.** Giao diện ghi nhận xe vào bãi.
- **Hình 4.7.** Giao diện tra cứu xe ra và phí dự kiến.
- **Hình 4.8.** Giao diện quản lý bãi, khu vực và vị trí.
- **Hình 4.9.** Giao diện bảng giá, tài khoản và báo cáo.

Khi sử dụng ảnh của phiên bản hiện tại, chú thích hình cần ghi rõ dữ liệu mô phỏng nếu ảnh chưa lấy dữ liệu từ API. Các số liệu mẫu trên dashboard không được dùng làm số liệu hoạt động thực tế của bãi.

### 4.1.2. Phía máy chủ

Phần máy chủ được khởi tạo bằng ASP.NET Core, sử dụng nền tảng .NET 10. Dự án có cấu hình chạy trong môi trường phát triển và hỗ trợ cung cấp tài liệu OpenAPI. Mã nguồn hiện tại mới có endpoint ví dụ `/weatherforecast`; các nhóm API đăng nhập, phương tiện, đặt chỗ, lượt gửi xe, thanh toán và quản trị chưa được cài đặt.

Frontend đã có một mô-đun dùng Axios để khai báo các lời gọi HTTP. Mô-đun này tập trung cấu hình địa chỉ API và thêm thông tin token vào header của yêu cầu. Tuy nhiên, việc đã khai báo lời gọi tại frontend chưa đồng nghĩa backend đã cung cấp endpoint. Một số đường dẫn và phương thức HTTP trong mô-đun hiện có cũng cần điều chỉnh để thống nhất với đặc tả trong blueprint.

Theo thiết kế, backend cần lấy danh tính người thao tác từ kết quả xác thực, sau đó kiểm tra trạng thái tài khoản, vai trò và phạm vi dữ liệu. Khách hàng chỉ được thao tác trên phương tiện, lượt đặt và lịch sử của mình. Nhân viên chỉ vận hành tại bãi được phân công. Quản trị viên thực hiện cấu hình và giám sát, không sử dụng vai trò Admin để thay thế thao tác nhận hoặc trả xe của nhân viên.

Khi tiếp nhận lệnh ghi, backend cần kiểm tra dữ liệu đầu vào, gọi thủ tục SQL bằng tham số và chuyển kết quả thành phản hồi API. Thông tin như giờ vào/ra, đơn giá áp dụng và phí chính thức phải lấy từ phía máy chủ. Các thao tác có thể được gửi lại do lỗi kết nối cần gắn khóa chống lặp để trả lại kết quả đã lưu, tránh tạo thêm lượt gửi hoặc thu tiền nhiều lần.

**Bảng 4.1. Các nhóm API theo thiết kế cần triển khai**

| Nhóm chức năng | Nhiệm vụ chính | Trạng thái trong mã nguồn hiện tại |
|---|---|---|
| Xác thực | Đăng ký Customer, đăng nhập, lấy tài khoản hiện tại | Chưa có API nghiệp vụ |
| Phương tiện | Tra cứu, thêm, sửa và ngừng sử dụng xe của khách | Chưa có API nghiệp vụ |
| Bãi và khả dụng | Tra cứu bãi, khu vực, vị trí theo xe và khung giờ | Chưa có API nghiệp vụ |
| Đặt chỗ | Tạo, tra cứu, hủy và xử lý sự cố của lượt đặt | Chưa có API nghiệp vụ |
| Lượt gửi xe | Xe vào, tra cứu phiên, xem phí, thu tiền và xe ra | Chưa có API nghiệp vụ |
| Quản trị | Cấu hình bãi, khu vực, vị trí, giá và tài khoản | Chưa có API nghiệp vụ |
| Báo cáo | Tổng hợp lượt xe, doanh thu và lấp đầy hiện tại | Chưa có API nghiệp vụ |

Tác vụ tự động hết hạn lượt đặt cũng cần được nối với tiến trình nền của backend. Phần SQL đã có thủ tục xử lý hết hạn; chương trình máy chủ chưa có thành phần thực hiện việc gọi thủ tục theo chu kỳ.

### 4.1.3. Phía cơ sở dữ liệu

Cơ sở dữ liệu được triển khai trên SQL Server với tên `ParkingLotOnline`. Script trong `sql.md` tạo các bảng, khóa chính, khóa ngoại, ràng buộc kiểm tra, chỉ mục, hàm, view, thủ tục nghiệp vụ và dữ liệu demo. Việc lưu trữ dùng thời gian UTC; giao diện và báo cáo chuyển sang thời gian Việt Nam khi trình bày.

Hệ thống có chín bảng nghiệp vụ chính gồm `Users`, `Vehicle`, `ParkingLot`, `Zone`, `ParkingSlot`, `Reservation`, `ParkingSession`, `PricingRule` và `Payment`. Hai bảng hỗ trợ là `AuditLog` để lưu dấu vết thao tác và `RequestRecord` để lưu kết quả yêu cầu chống lặp. Các bảng có dữ liệu lịch sử không được cấu hình xóa dây chuyền; những thực thể có trạng thái hoạt động được ngừng sử dụng thay cho việc xóa lịch sử liên quan.

Các ràng buộc duy nhất hỗ trợ ngăn email hoặc biển số đăng ký trùng, hai phiên đang mở dùng chung vị trí hoặc biển số, một lượt đặt phát sinh nhiều phiên và một phiên được thu tiền nhiều lần. Xung đột giữa các khoảng thời gian đặt không được xử lý chỉ bằng khóa duy nhất, mà được kiểm tra trong thủ tục có giao dịch và cơ chế đồng bộ lệnh ghi.

Dữ liệu khởi tạo gồm hai bãi, bốn khu vực và 24 vị trí, trong đó 16 vị trí nhận đặt trước và tám vị trí phục vụ khách đến trực tiếp. Có năm tài khoản demo, bốn phương tiện và hai mức giá: xe máy 5.000 đồng/giờ, ô tô 20.000 đồng/giờ. Giá trị này phục vụ minh họa nghiệp vụ của đồ án.

Kết quả truy vấn sau khi khởi tạo trên SSMS cho thấy Bãi Trung Tâm và Bãi Đại Học đều có 12 vị trí đang hoạt động, chưa có xe sử dụng và có tỷ lệ lấp đầy hiện tại bằng 0%. Bảng giá trả về đúng hai mức giá đã cấu hình. Kết quả này xác nhận dữ liệu khởi tạo, chưa phải kết quả chạy trọn quy trình gửi xe trên website.

*[Chèn hình kết quả truy vấn SQL Server đã thực hiện.]*

**Hình 4.10. Kết quả kiểm tra hai bãi đỗ và bảng giá sau khi khởi tạo cơ sở dữ liệu.**

## 4.2. Triển khai xử lý nghiệp vụ tại cơ sở dữ liệu

### 4.2.1. Đặt chỗ và kiểm tra khả dụng

Nghiệp vụ đặt chỗ được xử lý bằng các thủ tục tra cứu khả dụng và tạo lượt đặt. Hệ thống kiểm tra chủ sở hữu phương tiện, loại xe, trạng thái hoạt động của bãi, khu vực và vị trí, đồng thời đối chiếu lịch đặt đã xác nhận. Khung giờ đặt phải bắt đầu trong vòng bảy ngày, có thời lượng từ 30 phút đến 24 giờ và không bắt đầu trước giờ hiện tại của máy chủ.

Vị trí có phiên gửi xe đang mở không nhận lượt đặt mới trong phiên bản đầu. Với lịch đã xác nhận, hệ thống xét thêm khoảng đệm 15 phút sau thời điểm kết thúc dự kiến. Cùng một phương tiện cũng không được có hai lượt đặt chồng thời gian, kể cả khi hai lượt thuộc các bãi khác nhau.

Lệnh tạo lượt đặt thực hiện kiểm tra và ghi dữ liệu trong cùng giao dịch. Script hiện tại sử dụng khóa ứng dụng chung để tuần tự hóa các lệnh ghi nghiệp vụ. Cách này phù hợp với quy mô minh họa, giúp tránh việc hai yêu cầu cùng kiểm tra được một vị trí rồi cùng ghi lịch trùng. Khi tăng quy mô, cần đánh giá lại thông lượng và phương án khóa theo từng tài nguyên.

### 4.2.2. Ghi nhận xe vào bãi

Thủ tục xe vào phân biệt khách đã đặt chỗ và khách đến trực tiếp. Với lượt đặt, thông tin phương tiện được lấy từ dữ liệu đã lưu; hệ thống kiểm tra bãi của nhân viên, thời gian cho phép nhận xe, trạng thái lượt đặt và vị trí sử dụng thực tế. Việc nhận xe thông thường được cho phép sớm tối đa 15 phút và phải thực hiện trước hạn nhận xe đã lưu.

Nếu vị trí ban đầu không phục vụ được, nhân viên có thể chọn vị trí thay thế cùng bãi, cùng loại xe và thuộc nhóm nhận đặt trước. Thao tác này yêu cầu lý do và sự đồng ý của khách. Lượt đặt giữ vị trí ban đầu để bảo toàn lịch sử; lượt gửi lưu vị trí thực tế. Các thông tin đổi vị trí được ghi vào nhật ký.

Với khách đến trực tiếp, hệ thống chỉ nhận xe vào nhóm vị trí dành riêng cho walk-in. Khách vãng lai không bắt buộc có tài khoản; biển số và loại xe được lưu trực tiếp trong lượt gửi. Hệ thống kiểm tra biển số đang gửi trên toàn hệ thống và các lịch đặt còn hiệu lực trước khi tạo phiên mới.

Khi nhận xe thành công, thủ tục tạo phiên `OPEN`, lưu giờ vào và đơn giá tại thời điểm nhận xe, đồng thời cập nhật vị trí thành `OCCUPIED`. Nếu có đặt chỗ, lượt đặt được chuyển sang `CHECKED_IN`. Các thay đổi này được ghi trong cùng giao dịch.

### 4.2.3. Tính phí, thanh toán và ghi nhận xe ra

Phí gửi xe được tính theo thời lượng thực tế, làm tròn lên từng giờ và áp dụng tối thiểu một giờ. Đơn giá đã lưu khi nhận xe được dùng để tính phí, nhờ đó việc thay đổi bảng giá không làm đổi mức phí của xe đang gửi. Việc xem phí của phiên chưa kết thúc chỉ trả giá trị dự kiến, không ghi nhận doanh thu.

Khi nhân viên xác nhận xe ra, thủ tục tính lại phí theo thời điểm xử lý của máy chủ và đối chiếu với số tiền được xác nhận. Nếu số tiền đã thay đổi, hệ thống trả xung đột để nhân viên kiểm tra lại. Nếu hợp lệ, hệ thống đóng phiên, tạo thanh toán `PAID`, cập nhật lượt đặt liên quan và ghi nhật ký trong cùng giao dịch. Khi một bước ghi thất bại, toàn bộ giao dịch được hoàn tác.

Vị trí thực tế được chuyển về `AVAILABLE` và lưu mốc đệm bằng giờ xe ra cộng 15 phút. Trong thời gian đệm, vị trí chưa được nhận xe mới dù trạng thái vận hành đã là trống. Khoảng đệm không được cộng vào phí gửi xe. Khóa chống lặp và ràng buộc thanh toán theo phiên giúp một yêu cầu gửi lại không tạo thêm khoản thu.

### 4.2.4. Hủy đặt chỗ, hết hạn và xử lý sự cố

Khách hàng được hủy lượt đặt của mình khi trạng thái còn `CONFIRMED` và chưa tới giờ bắt đầu. Thao tác hủy chỉ kết thúc lịch của lượt đặt đó, không tự đóng phiên đang sử dụng một vị trí. Những lượt đã nhận xe hoặc đã kết thúc không được chuyển lại thành lượt đặt mới.

Thủ tục hết hạn chuyển lượt đặt không đến đúng hạn sang `EXPIRED`. Nếu khách đã đến và được ghi nhận sự cố trước hạn, hệ thống dành một khoảng thời gian xử lý riêng. Nhân viên có thể nhận xe ở vị trí phù hợp hoặc kết thúc lượt đặt bằng trạng thái `UNFULFILLED` kèm lý do. Khi hết thời gian xử lý sự cố, thủ tục nền có thể kết thúc lượt này và lưu nhật ký hệ thống.

Việc bảo trì chỉ được bật khi vị trí không có xe đang gửi. Các lịch đặt tương lai vẫn được giữ để điều phối thay vì bị xóa. Thao tác kết thúc bảo trì không xóa hoặc kéo dài khoảng đệm đã phát sinh sau khi xe ra.

### 4.2.5. Báo cáo vận hành

Phần SQL có view và thủ tục phục vụ thống kê lấp đầy hiện tại, lượt xe vào/ra và doanh thu. Tỷ lệ lấp đầy hiện tại được tính bằng số vị trí đang sử dụng chia cho số vị trí đang hoạt động và không bảo trì. Nếu không có vị trí phục vụ, tỷ lệ trả về rỗng để tránh diễn giải thành một tỷ lệ không có cơ sở.

Doanh thu được tổng hợp từ thanh toán đã thu theo thời điểm thu tiền. Phí dự kiến của phiên đang mở không được cộng vào doanh thu. Lượt xe vào và ra được thống kê theo giờ vào/ra thực tế. Khoảng ngày báo cáo theo thời gian Việt Nam được quy đổi sang UTC trước khi truy vấn để thống nhất với cách lưu trữ.

Các xử lý trong mục 4.2 đã có trong script SQL. Việc gọi chúng từ máy chủ và cập nhật kết quả lên giao diện còn thuộc phần tích hợp cần hoàn thiện.

## 4.3. Kiểm thử hệ thống

### 4.3.1. Phạm vi và phương pháp kiểm thử

Kiểm thử được chia thành ba phạm vi: kiểm tra cơ sở dữ liệu, kiểm thử API và kiểm thử giao diện kết hợp toàn bộ luồng. Mỗi phạm vi cần có dữ liệu đầu vào, kết quả mong đợi, kết quả thực tế và minh chứng tương ứng. Kết quả thành công ở SQL không tự chứng minh chức năng tương ứng đã hoạt động trên website.

Đối với cơ sở dữ liệu, phương pháp kiểm tra gồm chạy script khởi tạo, thực hiện lệnh nghiệp vụ có tham số hợp lệ và không hợp lệ, đối chiếu trạng thái sau giao dịch và tạo yêu cầu đồng thời. Các trường hợp được lựa chọn nhằm kiểm tra quyền thao tác, xung đột lịch, tính phí, chống ghi trùng và bảo toàn dữ liệu khi có lỗi.

Đối với API, sau khi cài đặt cần kiểm tra xác thực, quyền truy cập, cấu trúc yêu cầu và phản hồi, chuyển đổi thời gian và cách xử lý lỗi. Kiểm thử giao diện cần xác minh cả nội dung hiển thị lẫn dữ liệu thực sự được lưu, đặc biệt với các thao tác hiện đang dùng thông báo mô phỏng.

### 4.3.2. Kết quả kiểm tra cơ sở dữ liệu đã ghi nhận

Theo kết quả kiểm tra lưu trong `sql.md`, script đã được chạy trên một cơ sở dữ liệu kiểm thử riêng. Các lượt kiểm tra bao gồm assertion và gọi thủ tục; không diễn giải số lượt này thành số chức năng website đã hoàn thành. Việc khởi tạo database đồ án cũng đã được kiểm tra qua kết quả truy vấn trên SSMS.

**Bảng 4.2. Tổng hợp kết quả kiểm tra ở phạm vi SQL**

| Nội dung | Kết quả đã ghi nhận |
|---|---|
| Khởi tạo cơ sở dữ liệu | Tạo các bảng, ràng buộc, chỉ mục, hàm, view, thủ tục và dữ liệu demo |
| Chạy lại script | Giữ dữ liệu giao dịch và mức giá đã thay đổi trong database kiểm thử |
| Chuẩn hóa biển số | Đối chiếu biển số sau khi xử lý chữ hoa và ký tự phân cách |
| Xung đột lịch đặt | Từ chối lịch trùng vị trí hoặc trùng phương tiện |
| Hai yêu cầu đặt đồng thời | Một yêu cầu thành công; yêu cầu còn lại chờ khóa rồi nhận xung đột |
| Kiểm tra quyền | Kiểm tra chủ xe, vai trò và bãi được phân công của nhân viên |
| Đơn giá và làm tròn phí | Giữ giá lúc xe vào; kiểm tra đúng một giờ và trường hợp vừa vượt một giờ |
| Thu tiền và hoàn tác | Từ chối số tiền sai, không đóng phiên hoặc tạo thanh toán một phần |
| Chống lặp yêu cầu | Gửi lại cùng khóa và dữ liệu trả kết quả cũ, không tạo thêm khoản thu |
| Khoảng đệm và bảo trì | Giữ đệm sau xe ra; thao tác bảo trì không xóa mốc đệm |
| Sự cố và hết hạn | Kiểm tra đổi vị trí, no-show và kết thúc sự cố quá hạn |
| Cấu hình, báo cáo và quyền database | Gọi các thủ tục liên quan và kiểm tra giới hạn quyền tài khoản backend |

Kết quả này chưa thay thế kiểm thử đầy đủ các trường hợp trong blueprint, kiểm thử tải hoặc kiểm tra lại trên môi trường triển khai cuối cùng. Khi lập hồ sơ nộp, cần đính kèm kết quả chạy và ảnh minh chứng phù hợp cho từng nhóm kiểm tra.

### 4.3.3. Kiểm thử API và giao diện cần bổ sung

Kiểm thử tích hợp cần được thực hiện sau khi backend có API nghiệp vụ và frontend được nối với nguồn dữ liệu tập trung. Một kịch bản cơ bản gồm: khách đăng nhập, đăng ký phương tiện, tìm vị trí, tạo lượt đặt; nhân viên nhận xe, tra cứu phí, xác nhận thu tiền và xe ra; khách kiểm tra lịch sử, quản trị viên đối chiếu doanh thu.

Các trường hợp không hợp lệ cần bao gồm khách truy cập dữ liệu của người khác, nhân viên xử lý sai bãi, lượt đặt hết hạn, vị trí đang bảo trì, hai khách cùng đặt một chỗ, thao tác thu tiền gửi lặp và mất kết nối trong lúc xử lý. Giao diện phải phân biệt rõ yêu cầu thất bại với thao tác đã được hệ thống ghi nhận thành công.

Ở thời điểm hiện tại, chưa có cơ sở ghi nhận kiểm thử toàn bộ luồng API và giao diện đã đạt. Thông báo thành công mô phỏng và các chỉ số khai báo sẵn không được dùng để kết luận hệ thống đã xử lý nghiệp vụ thực tế.

## 4.4. Đóng gói và cấu hình triển khai

### 4.4.1. Cấu hình chạy trong môi trường phát triển

Môi trường phát triển gồm Node.js để chạy frontend, .NET SDK phù hợp với dự án backend và SQL Server để lưu trữ dữ liệu. SSMS được dùng để thực thi script khởi tạo và đối chiếu kết quả truy vấn. Thông tin kết nối database cần cấu hình ở phía máy chủ, không đặt trong mã frontend.

Frontend có các lệnh phát triển và đóng gói được khai báo trong `package.json`. Sau khi cài đặt các gói phụ thuộc, ứng dụng có thể được khởi động bằng các lệnh sau:

```powershell
cd C:\Code\doan4\frontend
npm install
npm run dev
```

Cấu hình Vite hiện đặt cổng phát triển là `3000`; địa chỉ thực tế sử dụng cần đối chiếu với thông báo khi khởi động. Dự án backend có thể khởi động riêng bằng cấu hình HTTP:

```powershell
cd C:\Code\doan4
dotnet run --project backend/ParkingLotAPI.csproj --launch-profile http
```

Cấu hình HTTP của backend hiện dùng cổng `5143`, trong khi mô-đun Axios và proxy phát triển đang khai báo cổng `5000`. Hai phía cần được đồng bộ trước khi tích hợp. Đồng thời, cách định tuyến API, chính sách truy cập giữa các nguồn và cơ chế xác thực phải được cấu hình phù hợp. Chỉ khởi động hai dự án chưa tạo ra các API nghiệp vụ còn thiếu.

Database được tạo bằng khối khởi tạo trong `sql.md`. Không cần chạy toàn bộ các lệnh dùng thử để khởi tạo. Các lệnh dùng thử có thể tạo thêm dữ liệu nghiệp vụ và cần được thực hiện trên dữ liệu demo phù hợp.

### 4.4.2. Chuẩn bị đóng gói

Frontend có lệnh đóng gói `npm run build`, tạo đầu ra theo cấu hình Vite. Backend có thể được chuẩn bị bản phát hành bằng `dotnet publish` với cấu hình Release. Tuy nhiên, sự tồn tại của các lệnh đóng gói không xác nhận hệ thống đã được xây dựng thành công, triển khai lên máy chủ hoặc công bố trên Internet.

Sau khi hoàn thiện tích hợp, quá trình chuẩn bị phát hành cần đồng bộ địa chỉ API, thông tin kết nối database, cấu hình HTTPS và tài khoản chạy dịch vụ. Tài khoản database của ứng dụng cần có quyền phù hợp để gọi các thủ tục đã công bố; không dùng quyền quản trị database cho hoạt động thông thường. Tác vụ hết hạn lượt đặt cần được khởi động cùng ứng dụng và được kiểm tra sau khi dịch vụ khởi động lại.

Trước khi chuyển sang sử dụng dữ liệu chính thức, cần sao lưu database, kiểm tra việc khôi phục và loại bỏ các cơ chế thành công mô phỏng khỏi luồng nghiệp vụ. Việc triển khai lên môi trường phục vụ người dùng thực tế chưa được ghi nhận trong kết quả hiện tại.

## 4.5. Đánh giá kết quả triển khai

### 4.5.1. Kết quả đạt được

Đề tài đã xây dựng cấu trúc giao diện cho ba nhóm người dùng, có các màn hình phục vụ tìm bãi, quản lý phương tiện, đặt chỗ, xe vào/ra và cấu hình vận hành. Bố cục chung giúp thống nhất cách trình bày giữa các phân hệ và tạo cơ sở để tiếp tục kết nối với API.

Phần cơ sở dữ liệu đã có cấu trúc lưu trữ, dữ liệu demo và các thủ tục xử lý nghiệp vụ cốt lõi. Những nội dung như chống đặt trùng, lưu đơn giá lúc xe vào, thanh toán trong cùng giao dịch đóng phiên, khoảng đệm sau xe ra và lưu vết thao tác đã được đưa vào script. Các kiểm tra ở phạm vi SQL đã được ghi nhận, đồng thời dữ liệu khởi tạo đã được đối chiếu trên SSMS.

### 4.5.2. Nội dung chưa hoàn thiện

Hạn chế chính nằm ở việc tích hợp giữa các thành phần. Backend chưa cung cấp API nghiệp vụ, chưa kết nối các thủ tục SQL với luồng xử lý HTTP và chưa có cơ chế xác thực, phân quyền phục vụ hệ thống thực tế. Giao diện vẫn sử dụng dữ liệu và thông báo mô phỏng ở nhiều màn hình; thao tác thay đổi trạng thái trên trình duyệt chưa đồng nghĩa dữ liệu đã được lưu vào database.

Những công việc tiếp theo gồm triển khai xác thực và API, thống nhất hợp đồng dữ liệu, đồng bộ cấu hình kết nối, thay dữ liệu mẫu bằng kết quả từ máy chủ và bổ sung tiến trình hết hạn. Sau đó cần kiểm thử toàn bộ luồng, đối chiếu báo cáo với thanh toán đã lưu và cập nhật ảnh minh chứng trước khi kết luận website đã vận hành hoàn chỉnh.
