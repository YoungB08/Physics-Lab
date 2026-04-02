import { LessonContent } from './content10';

export const content11: Record<string, LessonContent> = {
  'Điện tích': {
    tongQuan: `
## Khái niệm trọng tâm
- **Điện tích**: Là thuộc tính của vật (hạt) mô tả khả năng tương tác điện từ.
- Có hai loại điện tích: **dương (+)** và **âm (-)**. Các điện tích cùng dấu đẩy nhau, trái dấu hút nhau.
- Vật nhiễm điện (mang điện tích) là vật có khả năng hút các vật nhẹ hoặc có sự chênh lệch lượng electron và proton.

## Công thức cốt lõi
- Điện tích nguyên tố: $e \\approx 1.6 \\times 10^{-19} \\text{ C}$
- Điện lượng của một hạt/vật: $q = n \\cdot e$ (với $n$ là số nguyên hoặc chênh lệch electron/proton).
- Định luật bảo toàn điện tích: Trong một hệ cô lập về điện, tổng đại số của các điện tích là một hằng số.

## Kỹ năng giải bài
- Xác định trạng thái dư thừa electron (mang điện âm) hay thiếu electron (mang điện dương) của vật.
- Sử dụng độ chênh lệch tỉ lệ điện tích sau khi cho hai vật tiếp xúc (trung bình cộng số điện tích $q'_1 = q'_2 = \\frac{q_1 + q_2}{2}$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Ở cấp độ vi mô, mọi nguyên tử gồm hạt nhân mang điện dương và đám mây electron mang điện âm. Sự nhiễm điện thực chất là quá trình mất hoặc nhận thêm electron chứ hạt nhân (proton) không di chuyển trong cấu trúc chất rắn. Chớp nhoáng nhiễm điện do cọ xát là hiện tượng chuyển dời cơ học lớp ngoài cùng của nguyên tử.
    `
  },
  'Định luật Coulomb': {
    tongQuan: `
## Khái niệm trọng tâm
- **Định luật Coulomb** mô tả lực tương tác tĩnh điện giữa hai điện tích điểm đặt đứng yên trong môi trường chân không (hoặc điện môi).
- Lực hút (nếu trái dấu) hoặc đẩy (nếu cùng dấu) có phương trùng với đường thẳng nối hai điện tích.

## Công thức cốt lõi
- $F = k \\cdot \\frac{|q_1 q_2|}{\\varepsilon r^2}$
- Trong đó:
  - $k = 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$ (hằng số điện trở lực).
  - $q_1, q_2$: độ lớn các điện tích điểm (C).
  - $r$: khoảng cách giữa hai điện tích (mét).
  - $\\varepsilon$: hằng số điện môi của môi trường (chân không không khí $\\approx 1$).

## Kỹ năng giải bài
- Tuyệt đối không quên đổi đơn vị khoảng cách $r$ sang mét (m). Nêu rõ chiều của vector lực tĩnh điện theo quy tắc "cùng dấu đẩy, trái hút".
- Sử dụng tổng hợp lực vector (quy tắc hình bình hành) nếu có nhiều hơn 2 điện tích cùng tác dụng lên một nhãn.
    `,
    phanTich: `
## Phân tích chuyên sâu
- **Đóng khung thực tại**: Định luật Coulomb có dạng nhận thức toán học tương đồng kinh ngạc với định luật Vạn vật hấp dẫn của Newton (đều tỷ lệ nghịch bình phương khoảng cách). Tuy nhiên lực Coulomb có thể là **đẩy** (do có 2 loại cực điện dương âm), còn hấp dẫn chỉ có sức chiều **hút**. Lực điện cũng lớn hơn lực hấp dẫn vi mô cỡ $10^{36}$ lần đối với electron và proton, quyết định toàn bộ tính chất hóa học các hợp chất.
    `
  },
  'Điện trường đều': {
    tongQuan: `
## Khái niệm trọng tâm
- **Điện trường**: Là môi trường vật chất đặc biệt (trường vector) bao quanh điện tích, truyền tương tác tĩnh điện.
- **Điện trường đều**: Là điện trường mà cường độ điện trường $\\vec{E}$ tại mọi điểm đều có cùng phương, chiều và độ lớn. Thường được tạo ra giữa hai bản kim loại phẳng, song song, tích điện trái dấu.

## Công thức cốt lõi
- Cường độ điện trường: $E = \\frac{F}{|q|}$ (đơn vị: V/m)
- Đối với điện trường của điện tích điểm: $E = k \\cdot \\frac{|Q|}{\\varepsilon r^2}$
- Quan hệ giữa Hiệu điện thế và Cường độ điện trường đều: $E = \\frac{U}{d}$ (với $d$ là khoảng cách giữa 2 mặt đẳng thế dọc theo đường sức).

## Kỹ năng giải bài
- Vector $\\vec{F} = q\\vec{E}$. Nếu $q>0$ lực cùng chiều điện trường. Nếu $q<0$ lực mang ngược chiều điện trường.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Điện trường đều là một mô hình thiết yếu để kiểm soát chùm hạt ion/electron trong ống cathode tụ điện. Tương tự trọng trường mặt đất là trường hấp dẫn đều, hạt mang điện bay vào điện trường đều sẽ tạo ra quỹ đạo parabol giống một vật ném ngang.
    `
  },
  'Công của lực điện': {
    tongQuan: `
## Khái niệm trọng tâm
- Lực điện trường sinh công và biến thành động năng cho các hạt điện tích dịch chuyển theo các đường cong không gian. Điểm đặc biệt: Công lực tĩnh điện không phụ thuộc hình dạng đường đi, chỉ phụ thuộc vị trí đầu và cuối.

## Công thức cốt lõi
- Công trong điện trường đều: $A = qEd$
  - Trong đó: $d = M'N'$ biểu thị hình chiếu quỹ đạo dài trên phương đường sức điện.
- Tại một điểm trong không gian điện thế: $A_{MN} = q(V_M - V_N) = qU_{MN}$

## Kỹ năng giải bài
- Nhận thức chuẩn dấu $d$: Nếu hình chiếu của độ dời $\\vec{MN}$ trùng hướng cùng đường sức thì $d > 0$. Nếu ngược xu hướng đường sức thì $d < 0$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Điện trường tĩnh là một **trường lực thế bảo toàn**. Vì sự độc lập đường đi, công sinh ra trong một vòng tròn khép kín luôn luôn bằng không. Đây là ranh giới phân định rõ điện trường tĩnh ($A \\text{ kín} = 0$) của định luật Coulomb với Điện trường xoáy (sinh ra từ biến thiên từ thông cảm ứng).
    `
  },
  'Điện thế': {
    tongQuan: `
## Khái niệm trọng tâm
- **Điện thế ($V$)** tại một điểm đặc trưng cho khả năng sinh công tĩnh điện (Vô hướng, quy định "mức áp năng").
- **Hiệu điện thế ($U$)**: Là hiệu số điện thế giữa 2 điểm. Đồng thời đặc trưng lực truyền thực thi chuyển vận electron sinh điện.

## Công thức cốt lõi
- $V = \\frac{W_t}{q} = \\frac{A_{\\infty \\to M}}{q}$ (đơn vị: Volt, V)
- Hiệu điện thế: $U_{MN} = V_M - V_N = \\frac{A_{MN}}{q}$

## Kỹ năng giải bài
- Giải quyết bài toán bảo toàn cơ - điện năng (Hạt electron phóng trong tụ): $W_{d2} - W_{d1} = qU$. Lưu ý cực kì cẩn thận dấu âm của electron $e = -1.6\\cdot 10^{-19}$ kéo theo sự tăng tốc nếu bay ngược chiều $E$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Nếu so sánh với nước, Điện thế như độ cao dốc ngọn núi còn điện tích là khối nước. Nước tự động chảy từ cao xuống thấp (dương chảy xuôi dòng E xuống âm), nhưng để chảy ngược từ thấp lên cao ta cần dùng cái "Bơm" - tương tự là Nguồn điện sinh suất điện động ép electron ngược chiều điện thế chạy thành luồng.
    `
  },
  'Cường độ dòng điện': {
    tongQuan: `
## Khái niệm trọng tâm
- **Dòng điện**: Là dòng chuyển dời có hướng của các hạt mang điện.
- **Cường độ dòng điện ($I$)**: Đại lượng đặc trưng cho độ mạnh yếu của dòng điện, đo bằng điện lượng chuyển qua tiết diện thẳng trong 1 đơn vị thời gian.

## Công thức cốt lõi
- $I = \\frac{\\Delta q}{\\Delta t}$ (đơn vị: Ampere, A).
- Đối với dây dẫn mạch vi mô: $I = v \\cdot e \\cdot n \\cdot S$ 
  ($v$: vận tốc trôi, $n$: mật độ e, $S$: tiết diện ngang).

## Kỹ năng giải bài
- Đọc ampe kế trên mạch. Đổi microAmpe ($\\mu A = 10^{-6}$ A), miliAmpe (mA).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Các hạt chuyển dời tạo nên dòng điện trong kim loại là **electron tự do**. Vận tốc trào dòng thực tế của phân tử rất rùa bò chậm chạp (vài $\\mu m$/giây), nhưng tín hiệu truyền dòng điện là lan tỏa qua **tương tác điện từ** thì diễn ra gần bằng tốc độ ánh sáng! Đó là lý do bật công tắc bóng đèn sáng ngay.
    `
  },
  'Nguồn điện': {
    tongQuan: `
## Khái niệm trọng tâm
- Để duy trì dòng điện, mạch cần một máy bơm điện là Nguồn điện (Pin, Ắc quy).
- Nguồn điện sử dụng "lực lạ" tác dụng lên các hạt tải điện, thực hiện công để dịch chuyển dọc theo cục tụ tách điện tích âm dương ra hai cực, luôn duy trì một hiệu điện thế.

## Công thức cốt lõi
- Suất điện động: $\\mathcal{E} = \\frac{A_{la}}{q}$ (đơn vị: Volt, V).
- Công suất và năng lượng tự thân của nguồn: $A_{ngh} = \\mathcal{E}It$, $P_{ngh} = \\mathcal{E}I$.

## Kỹ năng giải bài
- Khi ráp nguồn điện nối tiếp $E_b = E_1 + E_2 + ...$, hoặc song song $E_b = E$ cho các pin đồ chơi mini. Phân biệt suất điện động $E$ và hiệu điện thế hai cực mạch ngoài $U$ ($U = E - Ir$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Pin thực chất là một chuỗi các phản ứng oxy hóa khử (lực hóa học chính là "lực lạ" đẩy ion). Pin Lithium của điện thoại thông minh cũng là hệ như vậy, suy hao dần khả năng hóa học theo chu kỳ sạc-xả do sự ăn mòn kim loại cực (điện trở trong $r$ bị tăng mạnh theo năm tháng, dẫn tới nóng pin và sập nguồn).
    `
  },
  'Định luật Ohm': {
    tongQuan: `
## Khái niệm trọng tâm
- Cho mạch kín từ nguồn đến tải. Dòng điện có cường độ lớn khi nguồn mạnh, nhưng cũng tỉ lệ nghịch với sức cản trở dòng chảy gọi là điện trở.

## Công thức cốt lõi
- Định luật Ôm cho đoạn mạch gốc: $I = \\frac{U}{R}$
- Định luật Ôm toàn mạch kín chứa nguồn: $I = \\frac{\\mathcal{E}}{R_N + r}$
- Độ giảm thế rò nội mạch là $Ir$.
  
## Kỹ năng giải bài
- Nếu xét hiện tượng đoản mạch cắm lộn 2 phích vào nhau tức là không có điện trở tải ($R_N \\to 0$). Dòng điện lúc này sẽ vọt lên cực đại $I = \\frac{\\mathcal{E}}{r}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Đoản mạch làm lửa đánh lóe rất sáng, đứt dây cầu trì hoặc hệ thống aptomat tự đóng ngắt. Nguồn điện lưới nhà không phải là siêu dẫn $r=0$ mà r cũng rất thấp, nếu không đoản tự ngắt có thể gây cháy nổ nạm dây do sinh nhiệt.
    `
  },
  'Công suất điện': {
    tongQuan: `
## Khái niệm trọng tâm
- Là tốc độ dòng điện làm sinh năng (Nhiệt trên vòng xích tải, quay roto cơ hay phát quang sinh sáng bóng đèn).
- Điện năng lượng qua mạch sẽ biến thành các dạng công khác.

## Công thức cốt lõi
- Điện trở tỏa nhiệt Joule-Lenz: $Q = I^2 R t$
- Công suất tiêu thụ của đoạn mạch ngoài: $P = U \\cdot I = I^2 R = \\frac{U^2}{R}$
- Điện năng tiêu thụ: $W = A = P \\cdot t$ (Đơn vị Joule (J), hoặc kW·h = $3.6 \\times 10^6$ J).

## Kỹ năng giải bài
- Để giải bài tính tiền điện: 1 "chữ" điện (số điện) bằng 1 kWh = Công sinh ra từ máy mạnh 1000W cày suốt 1h đồng hồ. Dùng $kW \\cdot h$ đỡ phải viết $3,6 \\cdot 10^6$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Ở bóng đèn dây tóc thường ghi thông số (220V - 60W). Điều này ngụ ý: nếu định danh cấp đúng $U = 220V$, thì dây tóc sáng sẽ tiêu hao công suất $P = 60W$. Đồng thời điện trở của bóng $R = \\frac{U_{dm}^2}{P_{dm}}$ thường coi như là biến tĩnh không đổi trừ khi dây bị cắt ngắn.
    `
  },
  'Mạch điện hỗn hợp': {
    tongQuan: `
## Khái niệm trọng tâm
- Mạch phức hợp giữa nhiều phần tử Nối tiếp (NT) và Song song (SS).
- Căn bản để giảm sức mạch phức tạp về 1 điện trở tương đương ($R_{td}$).

## Công thức cốt lõi
- Nối tiếp: $R_{td} = R_1 + R_2 + ...$ (cùng dòng $I$).
- Song song: $\\frac{1}{R_{td}} = \\frac{1}{R_1} + \\frac{1}{R_2} + ...$ (cùng áp $U$).

## Kỹ năng giải bài
- Quan sát và chỉ ra cấu trúc mạch gốc (vd: (R1 // R2) nt R3). Áp dụng tính ngược từ nhánh lá nhỏ nhất gộp lại sang nhánh gốc to nhất. Ở những nút chẽ dây có thể xài vạn năng kế để rọi Kirchhoff (tổng dòng vào bằng tổng dòng ra nút).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Hệ thống nhà ở dân dụng toàn bộ được nối liên kết **song song**, để cho nếu chập ngắt bóng đèn trong buồng vệ sinh thì tivi ngoài phòng khách vẫn còn điện chạy do 2 dây rẽ nhánh độc lập. Hơn nữa, song song cũng tạo ra áp 220V dùng chung cho mọi thiết bị.
    `
  },
  'Cảm ứng từ': {
    tongQuan: `
## Khái niệm trọng tâm
- Từ trường sinh từ chuyển động hạt điện. Một đường sức từ xuyên đâm qua vùng không gian bộc lộ độ kích cảm sức mạnh ($B$).

## Công thức cốt lõi
- Định luật tính Cảm ứng từ ($B$) đơn vị Tesla (T):
  - Dây dẫn thẳng dài vô hạn: $B = 2 \\times 10^{-7} \\frac{I}{r}$
  - Khung xuyến vòng dây tròn bán kính $R$: $B = 2\\pi \\times 10^{-7} \\frac{NI}{R}$
  - Ống dây lõi solenoid dài $L$: $B = 4\\pi \\times 10^{-7} \\frac{N}{L} I$

## Kỹ năng giải bài
- Nắm chắc **Quy tắc nắm tay phải**:
   - (Dây thẳng): Ngón cái vạch theo dòng điện $I$, 4 ngón cuộn khum vẽ đường cong từ trường xoắn vòng.
   - (Ống tròn): Cuộn 4 ngón tay theo chiều dòng điện khung dây $I$, ngón cái duỗi chọc ra ngầm định cực bắc nam và chiều $B$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Không có "Đơn cực từ" giống như đơn điện tích điểm vì đường sức từ luôn là **đường khép kín** (hướng từ Bắc về Nam bên ngoài thanh và Nam sang Bắc bên trong lòng). Từ trường do dòng xoáy lõi trong trung tâm trái đất tạo được lớp sinh quyển bảo vệ mặt cầu khỏi bức xạ mặt trời thiêu rụi.
    `
  },
  'Lực Lorentz': {
    tongQuan: `
## Khái niệm trọng tâm
- Lực từ tác dụng lên 1 hạt điện tích độc lập đang bay trong môi trường có từ trường.

## Công thức cốt lõi
- Độ lớn: $f = |q| v B \\sin\\alpha$
- Trong đó $\\alpha$ là góc tạo bởi vectơ vận tốc $\\vec{v}$ và vectơ $\\vec{B}$ (góc đâm vào).

## Kỹ năng giải bài
- **Quy tắc bàn tay trái**: Đặt bàn tay sao cho vector cảm ứng từ $\\vec{B}$ xuyên cắm vào lòng bàn tay trần. Chiều từ cổ tới ngón tay trỏ hướng theo vecto $\\vec{v}$. Khi đó ngón cái sẽ phình bung chĩa góc 90 độ chỉ chiều xuất bộc của lực tác dụng $\\vec{f}$ (nhớ cực kì thận trọng LẬT NGƯỢC nếu như ta đang cầm electron $e < 0$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Lực hạt Lorentz có một phép ảo thuật kinh điển ở vũ trụ: **Nó không bao giờ sinh công** (quỹ đạo bị lực $f$ bẻ cong thành vòng tròn vuông góc với $v$ nên góc = $90^\\circ$ sinh Công $A=0$). Lực này chỉ gò vòng cong quỹ đạo hạt trong máy gia tốc và hiện tượng cực quang tự nhiên ở cực Trái Đất nơi hạt mang điện rơi trượt theo đường sức xoắn ốc xuống bầu khí quyển.
    `
  },
  'Lực từ tác dụng lên dây dẫn': {
    tongQuan: `
## Khái niệm trọng tâm
- Một dòng dây chập dày hàng tỉ electron nên lực từ lên dây (Lực Ampe) là kết quả cộng dồn của hàng tỉ tia lực Lorentz.

## Công thức cốt lõi
- Lực Ampe sinh mô men đo bằng đoạn $I$ dòng dây đặt trong $B$:
  $F = B I \\ell \\sin(\\alpha)$

## Kỹ năng giải bài
- Cùng xài chung **quy tắc bàn tay trái** định đoạt hướng giống Lorentz, ngón bốn trỏ là chiều dòng điện chuẩn $I$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Lực Ampe là đòn bẩy thần thánh vạn năng khai sinh cỗ xe động cơ điện một chiều (Motor DC). Chuyển động xoay cơ bản gặt mướt trên vòng khung đồng chính là sức đẩy tịnh tiến lên phía của khung dây từ, mô tơ quạt, Tesla cars đang quay bánh nhờ sức Ampe cuộn.
    `
  },
  'Từ thông': {
    tongQuan: `
## Khái niệm trọng tâm
- Từ thông ($\\Phi$) là đại lượng mô phỏng "lượng đổ đường sức từ" quét xuyên qua một khung diện tích mặt sàn giới hạn hẹp.

## Công thức cốt lõi
- $\\Phi = N \\cdot B \\cdot S \\cdot \\cos(\\alpha)$
- Trong đó: 
  - Đơn vị là Vê-be (Weber - Wb).
  - $N$: số vòng cuộn quấn quanh.
  - $\\alpha$: Vận mệnh cực độ cốt lõi, góc lấy là kẹp giữa vector **pháp tuyến $\\vec{n}$** (vuông góc bề mặt bẹt ngang) và vectơ cảm ứng từ $\\vec{B}$.

## Kỹ năng giải bài
- Cảnh giác mỏ vướng: Đề ra kiểu "Vector từ nghiêng 30 độ so với khung". Á, nếu $\\vec{B}$ nghiêng mặt phẳng 30 độ thì TỨC LÀ góc pháp tuyến vuông góc sẽ là $90^\\circ - 30^\\circ = 60^\\circ$. Vậy $\\alpha = 60^\\circ$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Đứng cố định, lượng từ tính thông suốt không sinh năng lượng gì. Nhưng theo dòng dịch thời gian, lượng bị biến động mới châm ngòi nổ tạo phép màu sinh ra công kích lực Faraday (Cảm ứng điện từ), vốn là phương châm tối cao tạo ra điện nhà và trạm phong điện tua bin xoay cơ.
    `
  },
  'Hiện tượng cảm ứng điện từ': {
    tongQuan: `
## Khái niệm trọng tâm
- Cảm ứng điện từ hiện diện khi máy phát nam châm đẩy trượt thụt vô lõi cuộn tạo biến thiên từ thông, sản sinh dòng điện trên các khung kín chưa có pin (dòng điện cảm ứng).
- Định luật Lenz: Dòng cảm ứng đẻ ra có chiều chống lại tác nhân biến từ thông gây nên nó.

## Công thức cốt lõi
- Suất điện động luồng trào cảm ứng Faraday: 
  $e_c = - \\frac{\\Delta \\Phi}{\\Delta t}$

## Kỹ năng giải bài
- Các bài tính suất xoay động cảm ứng đều gạt dấu trừ lấy trị tuyệt đối trước. Dấu âm quy luật Lenz được định hình cho chiều mũi tên mũi kim điện. Dùng Nắm tay phải ngược dựa theo xu hướng bị chống tăng ($B_{\\text{camung}}$ ngược $B_{\\text{origin}}$) hay bù đắp giảm ($B_{\\text{camung}}$ thuận $B_{\\text{origin}}$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Một bước nhảy thiên tài xoay thế kỉ vật lý Faraday mở ra kỷ nguyên điện sáng. Lực cơ có thể tái hóa vào từ thành sức điện! Bếp từ (Induction Cooker - Dòng Fuco nhiệt bức) và guitar điện xài nam châm nhặt tín rung đàn màng kim loại cũng xuất sắc tận hưởng quả ngọt cảm ứng điện từ.
    `
  },
  'Khúc xạ ánh sáng': {
    tongQuan: `
## Khái niệm trọng tâm
- Tia sáng gãy góc khúc cua rẽ đổi phương khi băng xiên vượt qua ranh địa phân giới 2 trạng thái trong suốt khác nhau (Vd: truyền từ vùng khí xỏ xuống nước ao).

## Công thức cốt lõi
- Chiết suất tuyệt đối ($n$): Bằng $c / v$. Chiết chân không bằng 1.
- Định luật khúc xạ Snell: $n_1 \\sin(i) = n_2 \\sin(r)$
- Khúc triệt chiết quang sẽ uốn tia sáng nằm sát về khối lượng đậm đặc (Lớp nước hoặc Thủy tinh sẽ kéo uốn tia lại bẻ gãy đằm xuống gần góc pháp tuyến).

## Kỹ năng giải bài
- Nếu chuyển sáng xiên từ khoảng không ($n_1=1$) hạ xuống Thủy Tinh ($n_2=1.5$), góc bù tia cắm nước là khúc xạ $r < i$. Nếu đi ngược ra lại thì ánh sáng sẽ loe $r > i$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Cây bút chì cắm nằm dưới cốc nước trong veo thấy bị gãy đứt lìa khúc ở viền nước vì ánh rọi tia thị giác phản xạ vấp bẻ ngoặt ở lưỡi ranh khúc xạ. Sự phụ thuộc chiết suất của bước sóng tạo ra tán sắc bẻ cầu vồng 7 lụa khi xuyên lăng kính.
    `
  },
  'Phản xạ toàn phần': {
    tongQuan: `
## Khái niệm trọng tâm
- Một hiện tượng ảo mị dập phắt hoàn toàn hiện tính lóa khúc xạ của tia sáng khi lội ngược vào một môi trường đặc trong bám gợn mép rìa góc rộng để bị cản ngược dội phản toàn phần trôi nổi mà không thể đào tẩu. 

## Công thức cốt lõi
- Góc uẩn giới hạn ($i_{gh}$): Tính góc $\\sin(i_{gh}) = \\frac{n_2}{n_1}$ (bắt buộc $n_1 > n_2$).
- Điều kiện phản bật:
  1. Tia đi từ chiết nén (Thủy) sang chiết ít nén (Khí).
  2. Tia phóng rộng ở góc rộng hơn chốt giới hạn ($i > i_{gh}$).

## Kỹ năng giải bài
- Kiểm tra tính chất môi trường trước. Đề bài từ Khí vào Nước không bao giờ đẻ ra phản toàn phần. Chỉ có Nước, Gương vào Khí.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Đây là nốt xương sống trong kiến thiết **Sợi cáp cáp quang học internet tốc độ ánh sáng viễn thông**. Sợi lõi silica nhỏ bắn vào góc xiên giữ bó tia phản bật toàn phần zig-zag tiến đi mà không rò rỉ thất thoát xung nhịp ra vỏ không gian ngầm.
    `
  },
  'Thấu kính mỏng': {
    tongQuan: `
## Khái niệm trọng tâm
- Hai khối nhựa kính cầu đúc ghép, thấu khối mỏng rọi tia song song chụm vào đầu tâm (Thấu hội tụ lồi) hay tẻ rẽ phân tán loe rộng tia sáng (Phân kì lõm mặt).

## Công thức cốt lõi
- Độ tụ quang (Diop, dp): $D = \\frac{1}{f}$
- Phương trình tạo ảnh thị kính: $\\frac{1}{d} + \\frac{1}{d'} = \\frac{1}{f}$
- Hệ số phóng lớn: $k = -\\frac{d'}{d}$

## Kỹ năng giải bài
- Nguyên tắc chuẩn quy luật gán dấu tuyệt đối cần thuộc nanh cắn:
  - Khối Hội tụ thì Diop và Tiêu lồi $f > 0$. Khối Phân kì $f < 0$.
  - Vật chiếu chân thực ($d > 0$), Ảnh hiển thật lú in tường màng ($d' > 0$), Ảnh phản ảo hão ($d' < 0$).
  - Đại lượng Phóng tỷ $k > 0$: Ảnh cùng chiều (Và phải là Ảnh ảo). 
    `,
    phanTich: `
## Phân tích chuyên sâu
- Chụp ảnh trên ống tele (Camera lăng Lens) gạt tịnh tiến $d'$ trên chíp màng lưới thu hình sensor ảnh. Kính áp tròng và đôi mắt sinh học cơ địa cũng tuân thủ tuyệt mật thấu hội tụ sống đàn hồi cong này.
    `
  },
  'Mắt và các tật của mắt': {
    tongQuan: `
## Khái niệm trọng tâm
- Mắt chứa một thấu kính sống tự phồng xẹp gọi là **Thủy tinh thể**. 
- Thể sinh học gặp lỗi do chiều dài trục cầu mắt thon cụt hay thủy cơ phồng giãn vĩnh viễn gây ra Tật Viễn hẹp không thấy ngót gần hay Tật Cận mờ không thấy dăm xa.

## Công thức cốt lõi
- Ngắm xa cực Viễn chóp (Mắt vô cực lơi lỏng $f$ bự max), Ngắm cực Cận dồn bóp ($f$ rút ngắn cực độ căng điểu tiết nhỏ).
- Khắc Tật Cận: Đeo tạc kính khối lõm (Phân kì) ôm tiêu cự $f_{kinh} = -OC_v$.
- Khắc tật Viễn: Đeo hội tụ lồi (hội tụ) dồn ảnh gần vào tầm đọc cỡ 25cm.

## Kỹ năng giải bài
- Đề tính kính phải bọc nhớ khoảng cách mặt kính-mắt nếu cách nhau đoạn $\\ell$ cm, hoặc là bằng áp sát $0$ thì đeo thẳng $f=-OC_v$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Tật mỏi mắt vì xem điện thoại thực chất là cơ thể gồng căng ép thấu thủy tinh thể phồng phịch béo lên liên hoàn ở cực Cận dồn 1 khung không chịu thả duỗi vô cực (khi nhìn phong cảnh chân trời xa $D_{max}$, các cơ mi giãn hồi nghỉ ngơi trọn vẹn).
    `
  },
  'Kính lúp kính hiển vi kính thiên văn': {
    tongQuan: `
## Khái niệm trọng tâm
- Dàn tổ hợp kính ghép để nâng chuẩn kích nới rộng "góc ngắm" (Góc trông $\\alpha$) cho quang vật cực ròi tí hon không nằm tầm hay vật diêm vĩ nháy rất ngoài ngân hà.

## Công thức cốt lõi
- Số Bội số (Giọt khuếch to $G$) : 
  - Kính Lúp (Ngắm ở cực viễn vô cực): $G_{\\infty} = \\frac{Đ}{f}$ (với $Đ = 25$cm ngắm chuẩn).
  - Kính hiển vi: Ghép vật kính ngắn $f_1$ mini và thị hội $f_2$. $G_{\\infty} = \\frac{\\delta \\cdot Đ}{f_1 f_2}$ ($\\delta$: độ dài hình ống kéo quang hẹp lồng kính).

## Kỹ năng giải bài
- Chữa bài kính lúp quy lại giống thấu mỏng bình thường mà mắt áp sát mặt kính sát nhau trọn điểm và thấu vật nằm mép tiêu ngắm trong viền $f$. 
    `,
    phanTich: `
## Phân tích chuyên sâu
- G kính không được nhầm phóng ảnh $k$. Một vách màn vật rất bé nhưng ngắm gần mổ mọng phóng góc nhìn thì Bội số vẫn lớn vô hạn bù đắp dù khối kính cực lồi ngắn ($f = vài cm$). Hubble cũng chỉ là tổ hợp hệ cầu lõm và lăng gương siêu cỡ phản vật thu gom.
    `
  }
};
