import { LessonContent } from './content10';

export const content12: Record<string, LessonContent> = {
  'Dao động điều hòa': {
    tongQuan: `
## Khái niệm trọng tâm
- **Dao động cơ**: Chuyển động qua lại quanh một vị trí cân bằng.
- **Dao động điều hòa**: Là dao động mà li độ của vật là một hàm cosin (hay sin) của thời gian.

## Công thức cốt lõi
- Phương trình li độ: $x = A \\cos(\\omega t + \\varphi)$
- Vận tốc: $v = x' = -\\omega A \\sin(\\omega t + \\varphi)$
- Gia tốc: $a = v' = -\\omega^2 A \\cos(\\omega t + \\varphi) = -\\omega^2 x$
- Trong đó: $A$ là biên độ, $\\omega$ là tần số góc, $\\varphi$ là pha ban đầu.

## Kỹ năng giải bài
- Xác định trạng thái ban đầu ($t = 0$) để tìm pha ban đầu $\\varphi$.
  - Nếu đi qua Vị trí cân bằng theo chiều dương: $\\varphi = -\\pi/2$.
  - Nếu ở biên dương: $\\varphi = 0$.
- Các hệ thức độc lập với thời gian: 
  - $A^2 = x^2 + \\frac{v^2}{\\omega^2}$
  - $v_{max} = \\omega A$, 
  - $a_{max} = \\omega^2 A$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Dao động điều hòa là hình chiếu của một chuyển động tròn đều lên một trục tọa độ nằm trong mặt phẳng quỹ đạo. Sự kết nối này là sợi chỉ đỏ để áp dụng **Vòng tròn lượng giác** vào việc giải các bài toán đếm thời gian và thời điểm đi qua vị trí bất kỳ cực nhanh.
    `
  },
  'Con lắc lò xo': {
    tongQuan: `
## Khái niệm trọng tâm
- Một hệ gồm lò xo có độ cứng $k$ khối lượng không đáng kể và vật nặng $m$.
- Lực kéo về gây ra dao động: $\\vec{F} = -k\\vec{x}$.

## Công thức cốt lõi
- Tần số góc: $\\omega = \\sqrt{\\frac{k}{m}}$
- Chu kỳ: $T = 2\\pi \\sqrt{\\frac{m}{k}}$

## Kỹ năng giải bài
- Rất hay gặp bài cắt ghép lò xo hoặc gắn thêm khối lượng ($T' = \\sqrt{T_1^2 \\pm T_2^2}$).
- Xác định lực phục hồi đàn hồi cực đại / cực tiểu khi con lắc treo thẳng đứng ($F = k (\\Delta l_0 \\pm A)$). Cần phân biệt kỹ Lực kéo về ($kx$) và Lực đàn hồi ($k(\\Delta l_0 + x)$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Ở môi trường phi trọng lực, con lắc lò xo vận hành y hệt nằm ngang trên mặt đất. Trọng lực chỉ đóng vai trò dịch chuyển điểm Cân Bằng chứ không thu nhỏ sức bật gia tốc riêng từ hệ số $k/m$.
    `
  },
  'Con lắc đơn': {
    tongQuan: `
## Khái niệm trọng tâm
- Một sợi dây không dãn chiều dài $l$, một đầu cố định, một đầu treo hòn bi $m$.
- Dao động với góc nhỏ ($\\alpha_0 < 10^\\circ$) được coi như dao động điều hòa.

## Công thức cốt lõi
- Tần số góc: $\\omega = \\sqrt{\\frac{g}{l}}$
- Chu kỳ: $T = 2\\pi \\sqrt{\\frac{l}{g}}$
- Vận tốc tại vị trí bất kì: $v = \\sqrt{2gl(\\cos\\alpha - \\cos\\alpha_0)}$
- Lực căng dây: $T_c = mg(3\\cos\\alpha - 2\\cos\\alpha_0)$

## Kỹ năng giải bài
- Sự dao động của con lắc đơn phụ thuộc biểu kiến vào gia tốc $g$. Nếu mang con lắc lên đỉnh núi, hoặc đặt vào thang máy đứt cáp, gia tốc $g'$ biểu kiến sẽ khiến $T$ chậm đi hoặc đứng im (phi trọng lượng).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Đây là cơ sở tiền đề sáng chế **Đồng hồ quả lắc** dựa tính kinh qua dao động điều hòa góc nhỏ. Khối lượng con lắc không nằm trong công thức chu kỳ $T$, minh chứng rằng biên độ hay sức nặng không làm nhịp độ đi nhanh hay dãn chậm lại.
    `
  },
  'Năng lượng dao động': {
    tongQuan: `
## Khái niệm trọng tâm
- Trong dao động điều hoà, cơ năng được bảo toàn và biến đổi qua lại giữa động năng ($W_d$) và thế năng ($W_t$).

## Công thức cốt lõi
- Động năng: $W_d = \\frac{1}{2} m v^2$
- Thế năng: $W_t = \\frac{1}{2} k x^2 = \\frac{1}{2} m \\omega^2 x^2$
- Cơ năng (hằng số): $W = W_d + W_t = \\frac{1}{2} k A^2 = \\frac{1}{2} m \\omega^2 A^2$

## Kỹ năng giải bài
- Thế năng và động năng biến thiên tuần hoàn với tần số góc $\\omega' = 2\\omega$ và chu kỳ $T' = \\frac{T}{2}$.
- Vị trí để Động năng = $n$ lần Thế năng ($W_d = nW_t$): $x = \\pm \\frac{A}{\\sqrt{n+1}}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Dao động tắt dần chính là sự tước đoạt liên tục Cơ năng bởi môi trường cản dòng. Lúc này xe ô tô chở shock nhún xuống sẽ rụi tắt luôn rung động sau 2 chu kỳ để khách không bị xóc nôn nao.
    `
  },
  'Tổng hợp dao động': {
    tongQuan: `
## Khái niệm trọng tâm
- Một vật có thể tham gia đồng thời nhiểu dao động điều hoà cùng phương cùng tần số. Phương trình tổng hợp cũng là dao động điều hoà đó.

## Công thức cốt lõi
- Xét 2 dao động $x_1 = A_1 \\cos(\\omega t + \\varphi_1)$ và $x_2 = A_2 \\cos(\\omega t + \\varphi_2)$.
- Biên độ tổng: $A^2 = A_1^2 + A_2^2 + 2A_1 A_2 \\cos(\\varphi_2 - \\varphi_1)$
- Pha tổng: $\\tan\\varphi = \\frac{A_1 \\sin\\varphi_1 + A_2 \\sin\\varphi_2}{A_1 \\cos\\varphi_1 + A_2 \\cos\\varphi_2}$

## Kỹ năng giải bài
- Biên độ nằm trong biên kẹp: $|A_1 - A_2| \\le A \\le A_1 + A_2$.
- Dùng tính năng CMPLX số phức trên máy tính Casio để bấm $A_1\\angle\\varphi_1 + A_2\\angle\\varphi_2$ cực kỳ mau lẹ.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Giao thoa tín hiệu ở mọi ngành (vô tuyến, thu âm lọc nhiễu, radar) đều dựa trên kỹ thuật **cộng/đảo pha vector** này. Hủy tiếng ồn (Noise Cancellation) là sinh ra một tín hiệu rập ngược pha 180° so với tạp âm xen vào nhằm làm $A_1 - A_2 = 0$.
    `
  },
  'Đại cương về sóng': {
    tongQuan: `
## Khái niệm trọng tâm
- Sóng cơ là những dao động cơ học lan truyền trong môi trường (rắn, lỏng, khí). KHÔNG truyền được trong chân không.
- Phân loại: 
  - Sóng ngang: Phương dao động vuông góc phương truyền. 
  - Sóng dọc: Phương dao động trùng phương truyền (như sóng lò xo).

## Công thức cốt lõi
- Bước sóng ($\\lambda$): Quãng đường sóng bò được trong 1 chu kỳ.
- Vận tốc sóng: $v = \\frac{\\lambda}{T} = \\lambda \\cdot f$
- Phương trình truyền sóng dời từ O đến M chậm trễ: $u_M = A \\cos(\\omega t - \\frac{2\\pi x}{\\lambda})$.

## Kỹ năng giải bài
- Hai điểm cách nhau $d$:
  - Cùng pha nếu $d = k\\lambda$.
  - Ngược pha nếu $d = (k + 0.5)\\lambda$.
- "Sóng truyền đi mang theo NĂNG LƯỢNG và PHA dao động chứ không mang theo vật chất (cái bèo chỉ nhấp nhô rớt lên xuống)".
    `,
    phanTich: `
## Phân tích chuyên sâu
- Dựa trên cơ chế nén giãn thể tích cấu thành, Sóng dọc mới đi được trong chất nén không khí, còn sóng ngang bắt buộc phải có bề mặt hoặc mạng tinh thể liên kết dằng (Mặt nước lỏng bề mặt). Động đất có sóng P (chấn dọc) đến sớm trước sóng ngang S gây tàn phá.
    `
  },
  'Giao thoa sóng': {
    tongQuan: `
## Khái niệm trọng tâm
- Hai sóng kết hợp (cùng phương, cùng $\\omega$, độ lệch pha không đổi) chồng chập sẽ đẻ ra các vân (quỹ tích) cường độ dao động cực đại luân phiên xen kẽ vân đứng yên (cực tiểu).

## Công thức cốt lõi
- Xét 2 điểm nguồn A,B đồng pha.
- Cực đại ( bụng sóng sủi lồi ): $d_2 - d_1 = k\\lambda$
- Cực tiểu ( triệt tiêu lõm im ): $d_2 - d_1 = (k + 0.5)\\lambda$
- Vị trí đường trung trực luôn là một vân Cực đại $k = 0$.

## Kỹ năng giải bài
- Đếm số điểm cực đại trên đoạn thẳng AB là đếm mấu biến $k$ nguyên thoả mãn $-AB < k\\lambda < AB$. Cực tiểu tính $-AB < (k+0.5)\\lambda < AB$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Hình ảnh giao thoa của hai giọt nước rớt định kì rập nhịp tạo ra một màng lưới những tia đứng y như mảng mạng nhện hyperpebol thần kì tĩnh chôn bất động. Điều này rất thiêng liêng vì hai động năng giao đập lại đẻ ra những vân chết tĩnh im ru.
    `
  },
  'Sóng dừng': {
    tongQuan: `
## Khái niệm trọng tâm
- Giao thoa của sóng tới và sóng phản xạ trên cùng 1 phương x, tạc nên các bó Nút (đứng yên) và Bụng (dao động rực cực đại) cố định vị trí.

## Công thức cốt lõi
- Hai đầu dây CỐ ĐỊNH (cùng kẹp chặt tạo nút): chiều dài sợi dây đàn $l = k \\frac{\\lambda}{2}$ (k bó sóng).
- Một đầu cố định một đầu TỰ DO (đầu lỏng lủng lẳng làm Bụng): $l = (k + 0.5)\\frac{\\lambda}{2}$.

## Kỹ năng giải bài
- Khoảng cách giữa 2 Nút (hoặc 2 Bụng) cạnh nhau là $\\frac{\\lambda}{2}$.
- Nút kề Bụng là $\\frac{\\lambda}{4}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Sóng dừng là hiện tượng cộng hưởng khép kín biên cõi, nguyên lý vận hành chung cho mọi âm nhạc (phím đàn violon, lỗ xáo nhị hồ sáo lốc xoáy) nơi nhịp điệu họa âm chỉ vang nếu l vừa đúng khoang chặn làm cộng hưởng lên tiếng to.
    `
  },
  'Âm học': {
    tongQuan: `
## Khái niệm trọng tâm
- Âm là sóng cơ dọc truyền trong các môi trường.
- Tần số dải tai người nghe từ $16 \\text{ Hz}$ đến $20,\\!000 \\text{ Hz}$. (Lớn hơn là Siêu âm, bé hơn là Hạ âm).

## Công thức cốt lõi
- Cường độ âm $I$: năng lượng truyền qua 1 đơn vị diện tích $I = \\frac{P}{4\\pi R^2}$
- Mức cường độ âm ($L$): $L = 10 \\log_{10}(\\frac{I}{I_0})$ (đơn vị: decibel, dB). (Với $I_0 = 10^{-12} \\text{ W}/\\text{m}^2$).

## Kỹ năng giải bài
- Tính dội âm quãng đường Echo tiếng vang vách núi $r_v = \\frac{v\\cdot t}{2}$.
- Khi nguồn dôi ra xa gấp 10 lần, $I$ giảm thảm 100 lần, mức Decibel L sẽ bị trừ hao 20dB.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Đặc trưng sinh lý: Độ cao (đứt nối tần số), Độ to (Cấp biên độ cường độ L), Âm sắc (Quy hình họa âm tạp - lý do giọng hai người khác nhau dù đọc chung nốt). Sóng âm tốc trong Kính Kim thép rất vút ($>5000$ m/s) nhanh gấp 15 lần không khí.
    `
  },
  'Dòng điện xoay chiều': {
    tongQuan: `
## Khái niệm trọng tâm
- Dòng điện có cường độ biến thiên điều hoà theo quy luật hàm $\\sin/\\cos$: $i = I_0 \\cos(\\omega t + \\varphi_i)$.
- Trích xuất từ cuộn dây động cơ xoay quanh nam châm (Từ thông xoáy $\\Phi(t)$).

## Công thức cốt lõi
- Suất điện động phát ra ở rìa máy: $e = E_0 \\cos(\\omega t + \\varphi_e)$.
- Đại lượng hiệu dụng nhằm tính Công suất nung nhôm nóng hệt dòng DC: $I = \\frac{I_0}{\\sqrt{2}}$, $U = \\frac{U_0}{\\sqrt{2}}$.

## Kỹ năng giải bài
- Bấm máy điện áp đều dùng Trị số "Hiệu dụng" đo bằng Volt kế, Ampe kế. Số biểu kiến như 220V ngoài phích điện nhà chính là hiệu dụng, chứ chóp cực đại giật xung của nó lên tận $220\\sqrt{2} \\approx 311\\text{V}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Xoay chiều (AC) thống trị nhân giới nhờ khả năng vô địch: Dãy biên độ áp U được đẩy lên rất cao (nhờ máy biến thế) để truyền đi nghìn km ko hao, rồi lại "giảm áp" trả về mức vô hại cắm tủ lạnh. Điện áp dòng một chiều nhà Tesla chịu chết khoản này.
    `
  },
  'Mạch RLC': {
    tongQuan: `
## Khái niệm trọng tâm
- Đoạn mạch nối tiếp 3 cản trở: Điện trở thuần ($R$), Cuộn cảm ($L$), Tụ điện ($C$).

## Công thức cốt lõi
- Cảm kháng: $Z_L = \\omega L$. Dung kháng: $Z_C = \\frac{1}{\\omega C}$.
- Tổng trở chung mạch: $Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$
- Quan hệ pha ($u$ và $i$): $\\tan\\varphi = \\frac{Z_L - Z_C}{R}$ ($\\varphi = \\varphi_u - \\varphi_i$).

## Kỹ năng giải bài
- Biểu đồ Fresnel cực mạnh để củng giải nhanh trắc nghiệm:
   - $U_R$ ngang trùng pha $I$.
   - $U_L$ chĩa ngóc đứng thẳng sớm pha $90^\\circ$.
   - $U_C$ trễ pha rụng trút đứng đày góc $-90^\\circ$.
- Dùng bấm Casio: $u = i \\times \\bar{Z} = i\\angle\\varphi_i \\times (R + (Z_L - Z_C)i)$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Cuộn L luôn kiềm chế bóp nghẹt dòng nếu tần số biến mạnh ($Z_L \\propto f$). Ngược lại Tụ điện $C$ lại "Thích" chơi tần số cao vụt ($Z_C$ nhỏ tẹo). $L$ và $C$ không hề ăn mất năng lượng (thuần) mà chỉ lặp đẩy lặp nhả kho tích tụ.
- Hiện tượng Cộng Hưởng ($Z_L = Z_C \\implies I_{max}$): Sự vỡ tan cản kháng, áp hai đầu điện vọt tung phá mạch nếu thiết kế lầm.
    `
  },
  'Công suất điện xoay chiều': {
    tongQuan: `
## Khái niệm trọng tâm
- Khác với mạch dòng 1 chiều, phần L C mượn điện nhưng sau đó hoàn trả về trạm! Do vậy Công Suất chi phí thực thụ ($P$ nung nhiệt, động năng sinh lời) chỉ diễn ra ở mảng $R$.

## Công thức cốt lõi
- $P = UI \\cos\\varphi = I^2 R$
- Hệ số công suất $\\cos\\varphi = \\frac{R}{Z}$. Đây là tỷ lệ điện hiệu năng "có ích".

## Kỹ năng giải bài
- EVN (Điện lực Việt Nam) phạt rất nặng các hãng xưởng kẹp Máy có $\\cos\\varphi < 0.85$ (Vì tuy mượn trả nhưng $I_{vô ích}$ cuộn rần trên lưới gây nắn sập quá tải). Biện pháp là ghép Tụ kích song song giảm $\\varphi$ ép $\\cos$ bù gần 1.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Chuyên sâu về Công suất phản kháng $Q = U\\cdot I\\cdot \\sin\\varphi$. Tức cái chênh nhồi tụ trả vòng vòng (kV.Ar). Tổng cung trạm phát cần nạp gọi là Apparent Power $S = U\\cdot I$ (V.A). $S = \\sqrt{P^2 + Q^2}$. Ta muốn Mạch như một R thuần ( $\\cos\\varphi = 1$ ).
    `
  },
  'Máy biến áp': {
    tongQuan: `
## Khái niệm trọng tâm
- Thiết bị ứng dụng cảm ứng từ, dựa trên hai cuộn dây khác vòng quấn lên 1 lõi thép chung, để "Kích tăng" hoặc "Bóp hãm" mức Hiệu điện thế xoay chiều $U$.

## Công thức cốt lõi
- Mạch lý tưởng (bỏ hao phí sắt nhiệt): $\\frac{U_1}{U_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1}$
- Nếu $N_2 > N_1 \\rightarrow U_2 > U_1$: Máy Tăng áp (nhưng $I_2$ nhỏ lại y tỷ lệ hao đi - bóp dòng!).

## Kỹ năng giải bài
- Đọc vị cuộn $1$ luôn là Sơ cấp (Cắm vào nguồn lưới vào), $2$ là Thứ cấp (chắn đưa ra xải).
- Nếu mạch thứ hở (ko thiết bị) thì $I_2 = 0$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Máy biến thế là cỗ máy vĩ đại và đơn giản nhất ngành điện lực, cực kỳ tĩnh tại ko ma sát ko quay. Trong sạc Adapter điện thoại nhỏ gọn ngày nay tuy ko dùng sắt gồ ghề (mà mượn mạch băm IC biến thế cao tần), nhưng lõi nguyên lý biến thế viền dòng quy mô điện áp vẫn là chìa khóa.
    `
  },
  'Truyền tải điện năng': {
    tongQuan: `
## Khái niệm trọng tâm
- Để đẩy điện từ nhà máy thủy điện Hòa Bình đi hàng trăm dặm mà kẽm dây đồng lại tỏa nhiệt $I^2R$ thiêu cháy sạch cả nguồn, người ta buộc phải nhồi nén máy kích "Tăng Áp" ở cuộn đầu ngõ phát.

## Công thức cốt lõi
- Công suất hao phí trên ròng rọc đường dây: $\\Delta P = \\frac{P^2 R}{U_{phat}^2 \\cos^2\\varphi}$
- Hiệu suất tải điện: $H = \\frac{P_{dichvu} - \\Delta P}{P} \\times 100\\%$

## Kỹ năng giải bài
- Hãy nhìn vào chữ $U_{phat}^2$ kẹp bẹp ở mẫu. Cứ tăng Điện thế trạm phát $U$ lên 10 lần, thì Nhiệt rò rỉ trên dây đồng $\\Delta P$ rớt thảm đi 100 lần! Bài toán muôn thuở siêu tiết kiệm. Nên mạng viễn tải Bắc Nam xài trạm chót vót 500 kV (kilovolt).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Vì $U$ siêu lớn rợn tóc gáy, nên cột trụ 500kV Bắc Nam được cách ly cách đất vài chục mét và đính mâm sứ chuỗi dài để nó không khè tia hồ điện tử nẹt lửa băm phăng xuống gốc sậy đồi cỏ. Doanh nghiệp sẽ cắm máy hạ áp liên tục ở các trạm ven lộ để rẽ về 220V vào vùng xóm làng.
    `
  },
  'Mạch dao động LC': {
    tongQuan: `
## Khái niệm trọng tâm
- Nạp đầy pin vào tụ ròi kéo tụ C dập nối nối ngàm vô vòng cuộn L, lúc đó điện tích đập nhảy qua lại nhịp nhàng tụt sập và tái nạp nhả, sinh ra một Dao Động Điện Từ. Tương tự 100% y đúc Con lắc lò xo cơ khí.

## Công thức cốt lõi
- Tần số riêng khung mạch LC: $\\omega = \\frac{1}{\\sqrt{LC}}$, $T = 2\\pi \\sqrt{LC}$
- Phương trình điện tích dội: $q = Q_0 \\cos(\\omega t + \\varphi)$
- Dòng đẩy dao động: $i = q' = I_0 \\cos(\\omega t + \\varphi + \\pi/2)$

## Kỹ năng giải bài
- Nhớ luật đổi đại lượng tương đồng: 
  Điện $q \\equiv$ Li độ $x$, $I \\equiv$ Vận tốc $v$, $C \\equiv$ Khối lượng nghịch $1/k$, $L \\equiv m$.
- Bảo toàn hạt năng lượng: Tụ điện giữ năng lượng mộc (Điện Trường $W_C = \\frac{1}{2} C u^2$), Cuộn cảm L cầm năng lượng gió (Từ trường $W_L = \\frac{1}{2} L i^2$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Chu kỳ T sinh ra bởi những hạt vi mạch cực gọng bé (nanoFara) nên nhịp đập khung LC cực cấp nhanh, có thể vọt rào chục triệu vòng Megahertz mỗi giây! Sự chao động hạt này khuấy động không - thời tạo nên những dải băng nhịp Sóng Vô Tuyến.
    `
  },
  'Sóng điện từ': {
    tongQuan: `
## Khái niệm trọng tâm
- Biến động chớp nhoáng của $\\vec{E}$ sinh nắn dẻo $\\vec{B}$ vòng rẽ, $\\vec{B}$ lại tái tái sinh $\\vec{E}$ lồng bao... Bọn chúng quyện móc xích tự tiến bay trào lan tỏa mịt mù không gian thành Sóng Điện Từ.

## Công thức cốt lõi
- Vận tốc tại mọi không gian mở (chân không) là một hằng kim chuẩn không thể xô đổ $c \\approx 3 \\cdot 10^8$ m/s. Bước đi $\\lambda = \\frac{c}{f}$.
- Thang phân loại Dải quang điện từ (Từ bé tới khổng lồ năng lượng):
Sóng Vô Tuyến $\\rightarrow$ Vi Ba (lò hâm) $\\rightarrow$ Hồng Ngoại (săn mồi nhiệt) $\\rightarrow$ Ánh sáng nhìn mù $\\rightarrow$ Tử Ngoại (UV) $\\rightarrow$ Tia X $\\rightarrow$ Tia Gamma(hạt nhân chẻ).

## Kỹ năng giải bài
- Tại cùng 1 điểm truyền, Vector $\\vec{E}$ ngóc dọc và Vector $\\vec{B}$ đánh chéo là LUÔN ĐỒNG PHA dù chúng đâm góc vuông góc giao cắt theo hướng tay phải $E$-cổ, $B$-ngón giữa, $v$-ngón cái.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Ngôn ngữ Wi-fi bọc ở 2.4 GHz, Tín Ngôi Sao Viễn thám hay sóng 5G ăng-ten, Mắt bạn thấy chiếc lá rực lục màu... **tất cả vạn nguyên chung một thứ thể**: Sóng điện từ. Chúng chỉ lệch nhau cái chiều cao tần số sóng. Bước dài mồm to thì chỏng xuyên vật cản (vô tuyến), bước cực nhọn thì băm xé cơ thể (Tia X y tế, UV thủng da).
    `
  },
  'Hiện tượng quang điện': {
    tongQuan: `
## Khái niệm trọng tâm
- Bắn chói gắt cực tím (UV) hoặc xanh lục vào mâm Kim Loại kiềm, thì bùm! Các hạt Electron bị phăng tung thoát bật bắn ra ngoài lớp da kim loại đó. Đây là hiệu ứng Einstein lượng tử quang.

## Công thức cốt lõi
- Năng lượng 1 hạt viễn thạch sáng Photon: $\\varepsilon = hf = \\frac{hc}{\\lambda}$
- ($h$: Hằng số rào Planck $6.625 \\cdot 10^{-34} \\text{ J}\\cdot\\text{s}$)
- Phương trình bật nhả Einstein ($A$ là giới hạn rào thế Công thoát):
   $hf = A + \\frac{1}{2} m v^2_{max}$

## Kỹ năng giải bài
- Điều kiện đập vỡ đê thoát $e$: Bức nhúng phải có ánh chói với Bước sóng nhỏ hơn mốc tới giới hạn ( $\\lambda \\le \\lambda_0$ ). (Bấm tia cực mạnh mới đủ giật phá).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Thường mắt người ngắm ánh sáng là cái "Làn sóng lụa nhấp nhô". Tuy nhiên ở vi mô lóng lánh, hiện tượng Quang điện đập nát nhận thức cũ, lôi ra chân nguyên rằng: SÁNG là cơn mưa những "Hạt" bắn hạt trân châu, hạt nào ngậm đúng năng lượng đủ sắc bén thì bắn $e$ văng (Lưỡng tính Sóng - Hạt). Đó cũng là bộ óc nòng cốt cửa cổng Quang Cửa cảm biến camera, Pin mặt trời PV.
    `
  },
  'Mẫu nguyên tử Bohr': {
    tongQuan: `
## Khái niệm trọng tâm
- Nhằm vá kín lỗi lõm lọt Electron đâm sầm hố đen hạt nhân của cơ học lớp cũ, Niels Bohr phán quyết: Electron chỉ trượt vòng quay lởn vởn trên các Quỹ đạo Gắn Sẵn chuẩn chỉ (K, L, M, N...) Mức năng lượng rập nổi Đứt Quãng, ko bị mất dần trào sức.

## Công thức cốt lõi
- Bán kính các vòng trượt Hidro: $r_n = n^2 \\cdot r_0$ ($n = 1, 2, 3..$, với $r_0 = 5.3 \\cdot 10^{-11} \\text{ m}$).
- Nhảy lớp giáng lầu giải phóng ra 1 hạt Quang Sáng bằng đúng kẽ khoảng lệch điện năng 2 vạch đó:
  $E_{cao} - E_{thap} = hf = \\frac{hc}{\\lambda}$

## Kỹ năng giải bài
- Phân biệt tên các khung bọc Quỹ K($n=1$), L($n=2$), M($n=3$), N($n=4$). Số vạch sọc sáng phát ra tối đa từ mức $n$ là Tổ hợp C(2) của $n$: $\\frac{n(n-1)}{2}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Mẫu Bohr lý giải siêu cấp hoàn mỹ "Vạch Quang phổ 7 sắc Hydro" bị rạch thành ngấn vạch trên thẻ đen là vì các nấc lầu $n=2$ tụt xuống 1 đẻ vạch sáng rực rõ ràng, ko phải vệt loang mờ nhòa. Tiếc mờ, mẫu Bohr bế tắc đứt nhịp khi giải bài cấu trúc phân lớp từ Heli nhiều E lên, lúc đó mây Xác Suất Schrödinger mới nắm vương trượng vật lý lượng tử thực thụ lên ngôi.
    `
  },
  'Tia X': {
    tongQuan: `
## Khái niệm trọng tâm
- Dòng chùm Electron táng điên cuồng ở tốc độ ánh sáng nện thẳng vào mâm kim loại kẽm wolfram lõi cứng. Sự va chạm nghiến răng chót vót làm văng tọt ra mầm tia siêu năng xuyên qua da thịt: Tia Rơn-ghen (X-Ray).

## Công thức cốt lõi
- Đặc vi chuẩn: Sóng X có chóp bước $\\lambda$ dao cọc dừ $10^{-8} \\text{ m}$ đến $10^{-11} \\text{ m}$.
- Mức cao ngách Động năng cực phóng trọn gói thành năng lượng Photontia X max: $e \\cdot U_{AK} = hf_{max} = \\frac{1}{2} m v^2_{max}$. ($\\% \text{hao phí bằng 0}$).

## Kỹ năng giải bài
- Đã là máy gia tốc phát X thì không dính $c = 3\\cdot 10^8$ với điện tử electron vì electron ko thể bay ngang ánh sáng! Phanh bảo toàn Cơ Động hãm đâm mâm tạo X.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Tia X sở hữu độ đâm chọc lủng ác liệt không gì cản thấu trừ lá chì nặng $Pb$ bọc khối. Ở nhiếp ảnh nha khoa và viện đa khoa, tấm xương chặn cứng phần quang X làm nó tụt lại lọt vệt trắng sáng mờ mịt trên thước phim thu đen giúp nhìn thấu cả các chỗ rỉ viêm cốt yếu.
    `
  },
  'Cấu tạo hạt nhân': {
    tongQuan: `
## Khái niệm trọng tâm
- Tâm khối nhân cục nguyên tử hạt gộp bởi (Nucleon) gồm: **Proton ($+$)** và **Neutron (không mang điện, số gộp)**, mút bám cực chặt chẽ ở ranh ranh cỡ vi $10^{-15} \\text{ m}$.

## Công thức cốt lõi
- Xưng danh nguyên tử \${}^A_Z X$:
   - $Z$: Số hạt Proton đính ghim trong nhân mâm hạt.
   - $A$: Số Khối tổng hạt (Nucleon) dồn ép gộp.
   - Số Neutron dư lõi: $N = A - Z$.
   - Đồng vị là chung chữ cái $Z$ phân biệt nhưng số dư $N$ tạc bóp bành trướng phình khác ($^1H$, $^2H$ đơ-tê-ri..).

## Kỹ năng giải bài
- Lõi không hề tĩnh tự nhiên nhưng không gian đặc sệt đến mức độ khối lượng 1 hạt móng tay dồn đầy $10^{17} \\text{ kg/m}^3$ kinh chưởng ác liệt.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Bằng luật tĩnh điện Coulomb tụ 2 hạt dương Proton phải tự xé xô tông đẩy nhau đi nổ tan cả, thế vì cớ sao nhân vẫn dính rịt chằng? Do Lực Hạt Nhân siêu mạnh kết cùm hút cạy ngàm tống chúng quy lại dính cứng nhưng nó chớp ngậm tắt lực ở phạm vi quá mốc R = $10^{-15}$m.
    `
  },
  'Phóng xạ': {
    tongQuan: `
## Khái niệm trọng tâm
- Khi cục hạt nhân trương phềnh vượt chốt mất tự lực bám gìm (Thường sau $Z > 82$ kiềm Pb), nó run lên bần bật tự phát nổ nứt phân rã giải phóng vụn tia sáng Alpha, Beta hoặc X-Gamma, hóa thành mảnh con nguyên tố rớt mới.

## Công thức cốt lõi
- Định luật phóng rã theo hàm bốc hơi Hàm Mũ Số Lượng: $N_t = N_0 \\cdot e^{-\\lambda t}  = N_0 \\cdot 2^{-t/T}$.
- $T$ (Chu kì bán rã gãy vụn đôi): Mốc dăm thời gian khi mà $\\frac{1}{2}$ dân hạt nhân bay màu xí mất tăm. $T = \\frac{\\ln 2}{\\lambda}$.

## Kỹ năng giải bài
- Tính Khối lượng gãy dư chưa phân bào rã bằng công thức chữ m thay vào N: $m_t = m_0 \\cdot 2^{-t/T}$.
- Nhớ lùi độ lùi tia rã rớt hạt Alpha (He $^4_2$) ăn thâm tháo thụt $Z$ lùi 2, $A$ lùi 4 của Cục mẹ. Tia Bêta Âm trượt tòi tọt văng $(-1 e)$ khiến hạt bù tòi mẹ $Z$ vọt nhô lên $+1$ dư cân proton nảy nòi.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Phóng xạ là vạch chuẩn mốc thời gian vĩ đại ko thể giả vờ tác động nhân quả từ ngoại nhiệt và độ áp cơ áp bức, Cacbon 14 với nửa gãy 5730 năm giúp khảo các kim quy khảo cổ, xương khủng long tính nhẩm đếm số tàn dư phân rã suy ra thời niên cổ xác nạp rất bọc uy quyền.
    `
  },
  'Phản ứng hạt nhân': {
    tongQuan: `
## Khái niệm trọng tâm
- Do tự phôi thai không đục nát, Phản nhân vỗ bom được kích tạo khi nện hai cục nhân lầm rầm phang tốc ngầm đập thâm sầm mặt đối tạo Mảnh vỡ năng lượng khổng lồ và con mới rớt. Bồm phân hạch đứt Uranium bằng phang hạt neutron cậm gằm. Định hình Nhiệt Hạch dính ráp 2 cục hydro non nỉ thành mầm to.

## Công thức cốt lõi
- Xích trọn bảo toàn Cục Nắm: Tổng $Z_{truoc} = Z_{sau}$ và $A_{truoc} = A_{sau}$. (Duy nhất 1 cấm vỡ tàn canh: KHÔNG BẢO TOÀN KHỐI LƯỢNG).

## Kỹ năng giải bài
- Khối lượng lúc sau tự dưng bỉ tụt hụt teo đi 1 chút (thụt bốc $\\Delta m$). Khoản hụt biến mất đó bùng khè thành Phóng Lửa Giga Năng Lượng $W_{toa} = \\Delta m \\cdot c^2$ (Hàng chục MeV thiêu cháy rọi hàng triệu vòng than).
- Nhớ lặp hạt Alpha là $^4_2 \\text{He}$. Proton là $^1_1 \\text{H}$. Neutron $^1_0 \\text{n}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Sự bốc hơi lượng nhỏ xíu chóp kẹo vài MeV của 1 phản ứng tạo nên bom Fat Man trẩy đập tan rập nát kinh đô, cũng chính là buồng vò Lò siêu lò mặt trời rực phát đang nạp nuôi nhân gian khi dập nhồi hai hạt vi hy dro trượt vào mút ráp He nhiệt ngầm hạt nhân. Chén Thánh mơ cọng nhân loại là dập tạo năng nhiệt hạch mát hãm giam vào trạm thu phát bình sinh năng không cặn chất nhơ cho 10.000 năm nền văn minh.
    `
  },
  'Năng lượng liên kết': {
    tongQuan: `
## Khái niệm trọng tâm
- Hãy thử gom lùa ráp 11 hạt proton và bồi neutron rời rạc đóng ráp mâm nặn thành Cục Sodium (Na). Có một điều diệu vợi sững người: Tính khối lượng viên xóm Na đó luôn NHỎ HƠN Dăm Nhẹ Hơn tổng xác hột gộp hạt tẻ ban nhúm! Sức hao khối dư $m$ hụt lọt đó bị móc thành Keo Giữa lực chắp gộp thành Năng Liên Kết chặt hạt. 

## Công thức cốt lõi
- Độ hụt ngót khối rớt: $\\Delta m = Z\\cdot m_p + N\\cdot m_n - m_{hn}$
- Năng lượng bọc siêu keo Liên kết: $W_{lk} = \\Delta m \\cdot c^2$ (MeV).
- Năng lượng neo thắt chuẩn phần trên Mốc Đầu Nucleon rớt: $\\epsilon = \\frac{W_{lk}}{A}$.
 
## Kỹ năng giải bài
- Chọn So bì chốt mộc: Hạt nào có chóp Nhọn Cột Năng kề Liên Kết Riêng $\\epsilon$ càng vọt chóp gác (Cỡ 8.8 MeV cho mâm Sắt $A=56$) là hạt bền chày ngót vô địch, đánh ko rơi hạt!
    `,
    phanTich: `
## Phân tích chuyên sâu
- Chấm đỉnh parabol chóp bám Liên kết $\\epsilon$ vây cọc tụ thành cục đỉnh trũng lún nhất rơi thuộc về các chất trung Sắt Fe($56$). Khi Phân bẻ nát (Urani tụt rã mảnh tiến về Fe) hay nặn ép ráp dính gộp 2 sao lùn nhẹ lại lên phía dích tiến sắt, chúng đều xả thải nguồn phế dội trớ ra ngoài dư là nhiệt đun điện luân lò. 
    `
  }
};
