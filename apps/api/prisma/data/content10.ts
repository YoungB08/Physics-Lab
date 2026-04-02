export type LessonContent = { tongQuan: string; phanTich: string };

export const content10: Record<string, LessonContent> = {
  'Chuyển động thẳng đều': {
    tongQuan: `
## Khái niệm trọng tâm
- **Chuyển động cơ học**: Sự thay đổi vị trí của vật này so với vật khác theo thời gian.
- **Chuyển động thẳng đều**: Là chuyển động có quỹ đạo là đường thẳng và vận tốc không đổi theo thời gian $(v = \\text{const})$.

## Công thức cốt lõi
- Vận tốc: $v = \\frac{\\Delta s}{\\Delta t}$ (đơn vị: m/s)
- Phương trình chuyển động: $x = x_0 + v(t - t_0)$
- Trong đó: $x_0$ là tọa độ ban đầu, $v$ là vận tốc đại số (có thể âm hoặc dương tuỳ chiều chuyển động), $t_0$ là thời điểm ban đầu.

## Kỹ năng giải bài
- Chọn hệ quy chiếu: Trục tọa độ $Ox$ trùng với quỹ đạo, chiều dương và mốc thời gian phù hợp (thường chọn $t_0 = 0$).
- Sử dụng phương trình tọa độ để giải bài toán hai vật gặp nhau ($x_1 = x_2$).
    `,
    phanTich: `
## Phân tích chuyên sâu
- **Đồ thị tọa độ - thời gian (x-t)**: Là một đường thẳng xiên góc, hệ số góc của đường thẳng chính là vận tốc $v$. $v > 0$ thì đồ thị đi lên, $v < 0$ thì đồ thị đi xuống.
- **Đồ thị vận tốc - thời gian (v-t)**: Là một đường thẳng song song với trục thời gian $Ot$. Diện tích hình chữ nhật giới hạn bởi đồ thị và trục hoành bằng quãng đường đi được.
- **Lưu ý thực tế**: Trong thực tế không có chuyển động thẳng đều tuyệt đối do luôn có các lực cản tác dụng, mô hình này chỉ áp dụng gần đúng khi các lực cản triệt tiêu nhau hoặc không đáng kể.
    `
  },
  'Chuyển động thẳng biến đổi đều': {
    tongQuan: `
## Khái niệm trọng tâm
- **Chuyển động thẳng biến đổi đều**: Là chuyển động trên quỹ đạo thẳng mà vận tốc thay đổi một lượng như nhau trong những khoảng thời gian bằng nhau. Gia tốc $(a)$ là hằng số.
- Phân loại:
  - Nhanh dần đều: $\\vec{a}$ và $\\vec{v}$ cùng chiều ($a \\cdot v > 0$).
  - Chậm dần đều: $\\vec{a}$ và $\\vec{v}$ ngược chiều ($a \\cdot v < 0$).

## Công thức cốt lõi
- Gia tốc: $a = \\frac{v - v_0}{t - t_0}$ (đơn vị: m/s²)
- Phương trình vận tốc: $v = v_0 + a \\cdot t$
- Công thức tính độ dịch chuyển / quãng đường: $s = v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2$
- Hệ thức độc lập thời gian: $v^2 - v_0^2 = 2as$
- Phương trình tọa độ: $x = x_0 + v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2$

## Kỹ năng giải bài
- Phân rõ dấu của $v$ và $a$ tùy chọn hệ quy chiếu.
- Sử dụng công thức không có thời gian $v^2 - v_0^2 = 2as$ khi bài toán không cho dữ kiện thời gian.
    `,
    phanTich: `
## Phân tích chuyên sâu
- **Đồ thị vận tốc - thời gian (v-t)**: Là đường thẳng xiên góc, với hệ số góc đặc trưng cho gia tốc $a$.
- **Đồ thị tọa độ vuông góc (x-t)**: Là một nhánh của parabol.
- Mô hình chuyển động này rất phổ biến trong quá trình phanh xe, khởi hành, và các chuyển động rơi tự do.
    `
  },
  'Sự rơi tự do': {
    tongQuan: `
## Khái niệm trọng tâm
- Sự rơi tự do là sự rơi chỉ dưới tác dụng của trọng lực.
- Đặc điểm: Quỹ đạo thẳng đứng, chiều từ trên xuống dưới, là chuyển động thẳng nhanh dần đều với gia tốc rơi tự do $g$ (thường lấy $g \\approx 9.8 \\text{ m/s}^2$ hoặc $10 \\text{ m/s}^2$).

## Công thức cốt lõi
*(coi như $v_0 = 0$ và chạm đất thẳng đứng)*
- Vận tốc tại thời điểm $t$: $v = gt$
- Quãng đường rơi được sau thời gian $t$: $s = \\frac{1}{2} gt^2$
- Vận tốc liên hệ với độ cao $h$: $v = \\sqrt{2gh}$
- Thời gian rơi từ độ cao $h$: $t = \\sqrt{\\frac{2h}{g}}$

## Kỹ năng giải bài
- Nên chọn chiều dương hướng xuống để gia tốc $a = g > 0$, bài toán sẽ đơn giản và tránh âm số không cần thiết.
    `,
    phanTich: `
## Phân tích chuyên sâu
- **Giới hạn mô hình**: Rơi tự do bỏ qua lực cản không khí. Nếu một vật có diện tích tiếp xúc lớn (như lông chim, tờ giấy), lực cản không khí sẽ lớn, lúc này không thể coi là rơi tự do thực sự nữa. Định lý Galileo cho rằng: "Trong chân không, mọi vật rơi nhanh như nhau".
- Thông qua việc đo thời gian tự do, có thể xác định gia tốc trọng trường $g$ tại địa điểm cụ thể.
    `
  },
  'Chuyển động tròn đều': {
    tongQuan: `
## Khái niệm trọng tâm
- Chuyển động có quỹ đạo là đường tròn và tốc độ trung bình trên mọi cung tròn là như nhau.
- Các đại lượng đặc trưng: Chu kỳ ($T$), Tần số ($f$), Tốc độ góc ($\\omega$).

## Công thức cốt lõi
- Tốc độ dài: $v = \\frac{\\Delta s}{\\Delta t} = \\omega \\cdot r$
- Tốc độ góc: $\\omega = \\frac{\\Delta \\alpha}{\\Delta t} \\quad (\\text{rad/s})$
- Chu kỳ (thời gian quay 1 vòng): $T = \\frac{2\\pi}{\\omega} \\quad (T)$
- Tần số (số vòng trong 1 giây): $f = \\frac{1}{T} \\quad (\\text{Hz})$
- Gia tốc hướng tâm: $a_{ht} = \\frac{v^2}{r} = \\omega^2 \\cdot r$

## Kỹ năng giải bài
- Chuyển đổi linh hoạt giữa $v$, $\\omega$, $T$, $f$.
- Liên hệ gia tốc hướng tâm với lực hướng tâm trong bài toán động lực học.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Vận tốc trong chuyển động tròn đều là một **vector** chỉ không đổi về độ lớn nhưng luôn luôn tha đối chiều (luôn tiếp tuyến với quỹ đạo). Chính sự thay đổi hướng này sinh ra gia tốc hướng tâm.
- Mọi vật thể quay trên Trái Đất hoặc trong vành trăng đều được áp dụng mô hình cơ học tròn đều gần đúng.
    `
  },
  'Tổng hợp và phân tích lực': {
    tongQuan: `
## Khái niệm trọng tâm
- **Lực** là đại lượng vectơ đặc trưng cho tác dụng của vật này lên vật khác, kết quả có thể làm vật biến dạng hoặc gây ra gia tốc.
- **Tổng hợp lực** là thay thế các lực tác dụng đồng thời vào vật bằng một lực duy nhất có tác dụng giống hệt (hợp lực).

## Công thức cốt lõi
- Quy tắc hình bình hành: $\\vec{F} = \\vec{F_1} + \\vec{F_2}$
- Độ lớn hợp lực: $F = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2 \\cos(\\alpha)}$
- Trường hợp đặc biệt:
  - Khi $\\alpha = 0^\\circ$ (cùng chiều): $F = F_1 + F_2$
  - Khi $\\alpha = 180^\\circ$ (ngược chiều): $F = |F_1 - F_2|$
  - Khi $\\alpha = 90^\\circ$ (vuông góc): $F = \\sqrt{F_1^2 + F_2^2}$

## Kỹ năng giải bài
- Với hệ nhiều lực, ưu tiên tổng hợp từng cặp lực hoặc chiếu lực lên hệ trục tọa độ vuông góc $Oxy$ để tính tổng lực theo phương $x$ và phương $y$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Phân tích lực dựa trên cơ sở vật lý quy tắc tổng hợp là **sự cộng vector**. Khi chia rẽ ($\\text{phân tích}$) lực $\\vec{F}$, thường chọn hệ trục song song và vuông góc với chiều chuyển động hoặc mặt phẳng nghiêng, qua đó tính toán chính xác lực thành phần gây ra sự thay đổi chuyển động.
    `
  },
  'Ba định luật Newton': {
    tongQuan: `
## Khái niệm trọng tâm
- Định luật I: Nếu vật không chịu tác dụng lực, hoặc hợp lực bằng không, thì vật đang đứng yên sẽ tiếp tục đứng yên, đang chuyển động sẽ trạng thái chuyển động thẳng đều (Quán tính).
- Định luật II: Gia tốc tỷ lệ thuận với lực tác dụng, tỷ lệ nghịch với khối lượng ($a = \\frac{F}{m}$).
- Định luật III: Áp lực và phản lực: Mọi lực tác dụng đều sinh ra phản lực tương ứng bằng độ lớn nhưng ngược chiều.

## Công thức cốt lõi
- Phương trình cơ bản động lực học (ĐL 2 Newton): $\\vec{F}_{net} = m\\vec{a}$
- Định luật III: $\\vec{F}_{AB} = -\\vec{F}_{BA}$

## Kỹ năng giải bài
- Liệt kê toàn bộ lực tác dụng lên một vật.
- Chiếu phương trình vector $\\vec{F} = m\\vec{a}$ lên phương chuyển động và phương vuông góc với chuyển động để đưa về đại số.
    `,
    phanTich: `
## Phân tích chuyên sâu
- **Quán tính** không phải là lực. Vật có khối lượng càng lớn, quán tính càng lớn. 
- Định luật 3 cho cái nhìn trực quan: Ta có thể bước đi được là do chân ta tác dụng lực ma sát nghỉ đẩy lùi mặt đất, và mặt đất tác dụng phản lực đẩy chân ta và cơ thể ta tiến về phía trước. 
    `
  },
  'Lực hấp dẫn': {
    tongQuan: `
## Khái niệm trọng tâm
- Mọi vật trong vũ trụ đều hút nhau với một lực gọi là **Lực Hấp Dẫn**.
- Định luật vạn vật hấp dẫn (Newton): Lực tỷ lệ thuận với tích hai khối lượng và tỷ lệ nghịch với bình phương khoảng cách.

## Công thức cốt lõi
- Định luật: $F_{hd} = G \\frac{m_1 m_2}{r^2}$ 
  với $G \\approx 6.67 \\times 10^{-11} \\text{ Nm}^2/\\text{kg}^2$ (Hằng số hấp dẫn).
- Gia tốc trọng trường tại độ cao $h$: $g_h = G \\frac{M}{(R+h)^2}$ (với $R, M$ là bán kính và khối lượng Trái Đất).

## Kỹ năng giải bài
- Lưu ý đơn vị khi áp dụng: Khoảng cách phải đổi ra mét, khối lượng tính bằng kg.
- Gia tốc $g$ ở mặt đất lấy xấp xỉ $h=0$: $g_0 = \\frac{GM}{R^2}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Trong không gian rộng lớn, lực hấp dẫn là lực đóng vai trò định hình quỹ đạo hành tinh. Đối với vật thể nhỏ trên bề mặt trái đất, do $G$ rất bé mà lực hấp dẫn giữa cái bàn và cái ghế trở nên xấp xỉ bằng không so với lực khác (như ma sát), nhưng lại là đáng kể khi một vật thể là Trái Đất siêu lớn.
    `
  },
  'Lực ma sát': {
    tongQuan: `
## Khái niệm trọng tâm
- Là lực cản trở sự trượt, trôi, hay lăn của một vật lý trên một bề mặt khác.
- Gồm 3 loại chính: Ma sát trượt, Ma sát lăn, Ma sát nghỉ.

## Công thức cốt lõi
- Ma sát trượt: $F_{mst} = \mu_t \\cdot N$
  (với $\\mu_t$ là hệ số ma sát trượt, $N$ là áp lực pháp tuyến).
- Ma sát nghỉ cực đại: $F_{msn-\\text{max}} = \mu_n \\cdot N$

## Kỹ năng giải bài
- Khi vật nằm nêm mặt nêm ngang thì $N = P = mg$.
- Khi vật trên mặt phẳng nghiêng góc $\\alpha$ so với mặt ngang thì $N = P\\cos\\alpha$, dẫn đến $F_{ms} = \\mu mg \\cos\\alpha$. 
    `,
    phanTich: `
## Phân tích chuyên sâu
- Lực ma sát nghỉ đóng vai trò cực quan trọng, chính nó khiến cho xe cộ có thể tăng giảm tốc hay tiến qua đường mà không bị trượt bánh vô lăng. Lực ma sát không phụ thuộc vào diện tích bề mặt tiếp xúc và chỉ phụ thuộc bản chất chất liệu 2 mặt tiếp xúc.
    `
  },
  'Lực đàn hồi': {
    tongQuan: `
## Khái niệm trọng tâm
- Xuất hiện khi một vật biến dạng (ví dụ lò xo co hoặc rút). Lực đàn hồi chống lại sự biến dạng và có xu hướng khôi phục lại hình dạng ban đầu.
- Định luật Hooke.

## Công thức cốt lõi
- Định luật Hooke: $F_{dh} = k \\cdot |\\Delta l|$
- Trong đó $k$ là độ cứng của lò xo (N/m), $|\\Delta l|$ là độ biến dạng.

## Kỹ năng giải bài
- Xác định mốc treo và điểm lò xo chưa bị biến dạng $(l_0)$.
- Đối với trường hợp con lắc lò xo treo thẳng đứng đứng yên, $F_{dh} = P \\rightarrow k|\\Delta l| = mg$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Chú ý rằng lực đàn hồi chỉ tuân theo định luật Hooke (luật tuyến tính) khi nằm trong vùng giới hạn đặc hữu gọi là "giới hạn đàn hồi". Vượt quá, lò xo sẽ bị biến dạng dẻo vĩnh viễn. Lực đàn hồi là một loại lực điện từ cấp vi mô nằm ở kết cấu phân tử vật.
    `
  },
  'Công và công suất': {
    tongQuan: `
## Khái niệm trọng tâm
- **Công cơ học**: Bằng tích của độ lớn lực, quãng đường và cosin góc giữa chiều của lực và chiều dịch chuyển.
- **Công suất**: Tốc độ sinh công (hoặc mức độ năng lượng chuyển đổi qua mỗi đơn vị thời gian).

## Công thức cốt lõi
- Công: $A = F \\cdot s \\cdot \\cos(\\alpha)$ (đơn vị: Joule, J).
- Công suất: $P = \\frac{A}{t}$ (đơn vị: Watt, W).
- Công suất trung bình/tức thời: $P = F \\cdot v \\cdot \\cos(\\alpha)$.

## Kỹ năng giải bài
- Xác định đúng góc $\\alpha$ giữa vectơ vận tốc $\\vec{v}$ và vectơ lực $\\vec{F}$.
- Công bằng 0 nếu lực vuông góc với chiều dịch chuyển (ví dụ: lực Hướng tâm, trọng lực khi vật di chuyển phương ngang).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Công là đại lượng đại số: Có thể $A > 0$ (Công phát động), $A < 0$ (Công cản - như lực ma sát). Công mô phỏng cho quá trình trao đổi/truyền tải năng lượng trong hệ cơ. Ký hiệu công suất cần phân biệt với trọng lực (thường đều ký hiệu $P$).
    `
  },
  'Động năng': {
    tongQuan: `
## Khái niệm trọng tâm
- Năng lượng của vật có được do nó đang chuyển động.
- Đặc trưng bởi khối lượng là vận tốc.

## Công thức cốt lõi
- Phương trình: $W_d = \\frac{1}{2} m v^2$ (Joule)
- Định lý biến thiên động năng: Độ biến thiên động năng bằng chênh lệch tổng công của các ngoại lực tác dụng lên vật: $\\Delta W_d = W_{d2} - W_{d1} = \\Sigma A_{ngoailuc}$

## Kỹ năng giải bài
- Giải quyết bài toán tốc độ ở các thời điểm mà bỏ qua gia tốc rất lợi thế. Hãy dùng định lý động năng thay cho định luật 2 Newton nếu không cần tính thời gian.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Động năng luôn luôn mang giá trị không âm và tỉ lệ hệ số 2 với vận tốc. Khi một chiếc xe chạy nhanh gấp đôi, năng lượng động của mang theo lớn gấp 4 lần, đồng nghĩa là quãng đường phanh cần dể dừng gấp 4 lần so với mức chạy cơ bản!
    `
  },
  'Thế năng': {
    tongQuan: `
## Khái niệm trọng tâm
- Là dạng năng lượng tồn tại dựa trên hình thái **vị trí (trọng trường)** hay **chế độ cấu tạo/biến dạng (đàn hồi)**.

## Công thức cốt lõi
- Thế năng trọng trường: $W_t = mgh$ (so với mốc tính 0, thường ở mặt đất).
- Thế năng đàn hồi lò xo: $W_{t(dh)} = \\frac{1}{2} k (\\Delta l)^2$.

## Kỹ năng giải bài
- Cốt lõi của thế năng trọng trường là **bước chọn mốc**. $h$ có thể âm nếu vật ở vị trí nằm dưới mốc thế năng đã chọn.
- Công lực bảo toàn $\\Sigma A_{bt} = W_{t1} - W_{t2} = -\\Delta W_t$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Thế năng trọng trường thực chất luôn là âm ở cấp vĩ mô học (vũ trụ) do mốc ở vô cực. Nhưng trong hệ tham chiếu mặt đất, mô hình $mgh$ cho các giá trị độ thay đổi nhỏ so với bán kính trái đất nên rất chính xác và dễ áp dụng.
    `
  },
  'Cơ năng': {
    tongQuan: `
## Khái niệm trọng tâm
- Cơ năng là bằng tổng của động năng và thế năng của vật tại một vị trí xác định.
- Cơ năng là biểu thức đại diện cho tổng mức năng lượng cơ trong hệ khép kín.

## Công thức cốt lõi
- $W = W_d + W_t$
- Đối với rơi tự do/nén lò xo: $W = \\frac{1}{2}mv^2 + mgh$
- Định luật bảo toàn: Nếu vật chỉ chịu tác dụng của lực bảo toàn (Trọng lực, Lực đàn hồi), không có ma sát lực cản thì cơ năng được bảo toàn: $W_1 = W_2$.

## Kỹ năng giải bài
- Nhận diện hệ không có ma sát: Khẳng định $W_1 = W_2$ là rút ra được mối quan hệ vận tốc ở đỉnh đầu đồi và vận tốc cuối chân dốc.
- Nếu có lực cản: $\\Delta W = W_2 - W_1 = A_{ms}$ (Công ma sát là độ giảm cơ năng).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Bảo toàn cơ năng là một nguyên lý sâu sắc trong tự nhiên và là hệ quả của đối xứng bảo toàn không thời gian (nguyên lý Noether). Nhờ vậy, từ cơ năng ta bỏ qua vô số các hình thù đường đi phức tạp, mà chỉ quan tâm đến vị trí ban đầu và vị trí cuối cùng!
    `
  },
  'Cấu trúc chất': {
    tongQuan: `
## Khái niệm trọng tâm
- Lý thuyết động học phân tử: Các chất được cấu tạo từ các hạt nhỏ bé riêng biệt (phân tử, nguyên tử). Chúng luôn chuyển động hỗn loạn không ngừng.
- Nhiệt độ của vật càng cao thì các phân tử cấu tạo nên vật chuyển động càng nhanh.

## Công thức cốt lõi
- Lực tương tác phân tử: Lực hút và lực đẩy tồn tại đồng thời. Khi khoảng cách lớn, lực hút chiếm ưu thế, khi khoảng cách quá nhỏ thì nó bị đổi lấy ưu thế khổng lồ của lực đẩy.
- Kích thước nguyên tử vào cỡ $\\approx 10^{-10}$ m và lượng hạt trong 1 mol chất bằng hằng số Avogadro $N_A \\approx 6.022 \\times 10^{23} \\text{ mol}^{-1}$.

## Kỹ năng giải bài
- Giải thích các tính chất đàn hồi mặt cứng hay hình thái khí, lỏng, rắn dựa vào khoảng cách của khối khí so với lực tương tác.
    `,
    phanTich: `
## Phân tích chuyên sâu
- 3 trạng thái căn bản (Rắn, Lỏng, Khí) chỉ là sự phân hóa về cự li khoảng cách và quy mô động năng dao động cấu trúc vi mô. Thể khí thì động năng phân tử lấn át hoàn toàn tương tác. Ở thể rắn, các hạt liên kết chặt và dao động mạnh quanh nút mạng tinh thể.
    `
  },
  'Nhiệt độ và nội năng': {
    tongQuan: `
## Khái niệm trọng tâm
- **Nội năng ($U$)**: Là tổng động năng chuyển động hỗn loạn của các phân tử và thế năng tương tác giữa chúng.
- **Nhiệt độ ($T$)**: Là số đo mức độ hoạt động (động năng trung bình) của các phân tử.
- Thay đổi nội năng: Bằng cách thực hiện công hoặc truyền nhiệt.

## Công thức cốt lõi
- Công thức nội năng khí lý tưởng: $U = \\frac{i}{2} nRT$ (i là bậc tự do).
- Nguyên lí 1 NĐH: $\\Delta U = Q + A$ (Độ biến thiên nội năng bằng tổng nhiệt lượng và công hệ nhận được).
- Nhiệt lượng: $Q = mc \\Delta T$.

## Kỹ năng giải bài
- Chú ý quy ước dấu trong Nguyên lí 1 NĐH: Hệ nhận nhiệt lượng: $Q > 0$; Hệ sinh công ra môi trường $\\rightarrow$ Hệ thực hiện công âm $\\rightarrow$ $A < 0$ đối với hệ (cần đọc kĩ chuẩn dấu SGK).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Nguyên lí 1 thực chất là định luật bảo toàn năng lượng cho cơ hệ vĩ mô, nối kết thành phần công cơ học và nhiệt học thông qua đương lượng nhiệt. Nội năng cho thấy cho dù vật đứng yên tại chỗ ở ngoài thì bên trong lớp lớp nguyên tử vẫn cuộn trào hoạt động.
    `
  },
  'Quá trình đẳng nhiệt': {
    tongQuan: `
## Khái niệm trọng tâm
- Quá trình mà trong đó nhiệt độ của hệ không thay đổi ($T = \\text{const}$).
- Định luật Boyle-Mariotte: Ở nhiệt độ không đổi, thể tích của một lượng khí xác định tỉ lệ nghịch với áp suất.

## Công thức cốt lõi
- $P \\cdot V = \\text{const}$  $\\Rightarrow P_1 V_1 = P_2 V_2$

## Kỹ năng giải bài
- Nhận biết các bài nén/dãn chậm, không sinh nhiệt độ dôi dư.
- Đồ thị đường cong Hyperbol (Đẳng nhiệt trên trục tọa độ p-v).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Vì nhiệt độ không đổi $\\rightarrow$ Nội năng khí lý tưởng cũng không đổi $\\Delta U = 0$ $\\rightarrow$ Toàn bộ nhiệt năng truyền vào hoặc rút ra đều biến thành Công $Q = -A$.
    `
  },
  'Quá trình đẳng áp': {
    tongQuan: `
## Khái niệm trọng tâm
- Quá trình chuyển trạng thái với áp suất bất biến ($p = \\text{const}$).
- Định luật Charles (hay Gay-Lussac): Thể tích hỗn hợp khí tỉ lệ thuận tỷ lệ thuận tuyệt đối.

## Công thức cốt lõi
- $\\frac{V}{T} = \\text{const} \\Rightarrow \\frac{V_1}{T_1} = \\frac{V_2}{T_2}$
- Nhiệt độ $T$ được đo bằng thang Kelvin: $T = t^\\circ \\text{C} + 273$.

## Kỹ năng giải bài
- Đồ thị đẳng áp trên hệ $V-T$ là một đường thẳng nối hướng thẳng về gốc tọa độ gốc O.
- Tránh thay thế trực tiếp nhiệt độ Celsius (độ C) khi chia trong công thức khí đặc hữu, luôn chuyển sang Kelvin.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Công do khí sinh ra trong dãn đẳng áp $A = p \\cdot \\Delta V$. Các mô hình piston có đối trọng nén đè giữ cho áp suất bên trong cân bằng là các bài kiểm tra chuyên sâu thường đưa ra trên bộ mô phỏng 3D.
    `
  },
  'Phương trình trạng thái': {
    tongQuan: `
## Khái niệm trọng tâm
- Tích hợp của 3 quá trình đẳng cấu tạo nên quy tắc Clapeyron. Cung cấp phương trình nối liền áp suất, thể tích và nhiệt độ tuyệt đối của một khối lượng khí xác định.

## Công thức cốt lõi
- Phương trình Clapeyron: $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$
- Phương trình Clapeyron-Mendeleev: $p \\cdot V = n R T$ (với $n$ là số mol, $R \\approx 8.31 \\text{ J/(mol}\\cdot\\text{K)}$).

## Kỹ năng giải bài
- Với các bài toán thất thoát khí, số mol thay đổi, không nên dùng tỉ lệ $\\text{const}$ mà nên chạy qua mốc $pV = nRT$ với $n$ biến số.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Phương trình khí lý tưởng là một công xưởng mạnh mẽ định dạng các tính chất vĩ mô. Ở mật độ và nhiệt độ tiêu chuẩn (STP), một mol khí luôn sở hữu $V = 22.4$ L. Sự chênh lệch mô hình ở áp suất quá lớn và nhiệt độ quá bé cần những mô hình bù của Van der Waals.
    `
  },
  'Biến dạng cơ': {
    tongQuan: `
## Khái niệm trọng tâm
- Biến dạng cơ tính đến là đàn hồi, dẻo và hình trạng vỡ đứt của dầm cột/ lò xo. Nồng độ chủ đạo nghiên cứu biến dạng kéo và nén của vật liệu thẳng.

## Công thức cốt lõi
- Định luật Hooke với thanh chịu kéo dãn: $\\frac{F}{S} = E \\cdot \\frac{|\\Delta l|}{l_0}$
- Thay đổi hình: $\\sigma = E \\cdot \\epsilon$ ($\\sigma$ là ứng suất kéo, $E$ suất Young).

## Kỹ năng giải bài
- Nhận diện suất Young ($E$) và ứng suất ($\\sigma$) để đánh giá sự phá vỡ giới hạn đàn hồi.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Ở thực nghiệm xây dựng và cầu đường, $E$ thép và bê tông được tính toán rất cẩn trọng. Lực đàn hồi từ bài mô phỏng lò xo mở rộng qua thực địa của các biến dạng dầm bê tông phức tạp.
    `
  },
  'Sức căng bề mặt': {
    tongQuan: `
## Khái niệm trọng tâm
- Bề mặt của chất lỏng đang có khuynh hướng co lại bằng độ nhỏ nhất có thể gây ra sức căng bề mặt màng.

## Công thức cốt lõi
- $F_c = \\sigma \\cdot l$ (với $\\sigma$ là hệ số căng bề mặt N/m, $l$ là chu vi giới hạn đường mặt thoáng).

## Kỹ năng giải bài
- Nhận thức hiện tượng mao dẫn ($h = \\frac{4 \\sigma}{\\rho g d}$).
- Đo chu vi bao quanh bề mặt vòng nhôm (thường phải lấy hai lần vòng nếu chu vi cả trong và ngoài).
    `,
    phanTich: `
## Phân tích chuyên sâu
- Giọt nước tròn xoe nổi trên lá sen nhờ sức căng bề mặt tối giản hóa diện tích ranh giới pha. Tại đây, lớp phân tử nước tiếp giáp không khí bị hụt tương tác nên dồn chặt thành màng căng.
    `
  },
  'Lực đẩy Archimedes': {
    tongQuan: `
## Khái niệm trọng tâm
- Mọi vật bị nhúng chìm một phần hay toàn bộ vào một chất lưu tĩnh luôn luôn chịu một lực đẩy ngược chiều với trọng lực bằng trọng lượng chất lỏng nó chiếm chỗ.

## Công thức cốt lõi
- $F_A = d \\cdot V_{chim}$ = $\\rho \\cdot g \\cdot V_{chim}$
- (với $d$ trọng lượng riêng chất lưu, $V$ phần thể tích chịu đè ngập chìm).

## Kỹ năng giải bài
- Đừng lầm tưởng $V$ là toàn bộ thể tích quả bóng. Hãy lấy duy nhất phần quả bóng bị đè nằm LỚP DƯỚI nước.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Trọng lượng không thay đổi nhưng con người luôn có cảm giác các vật dưới mặt nước bớt chìm nhẹ hơn bình thường. Điều này là nhờ sức đẩy lên của áp suất nước, một hệ quả vi mô từ phương trình cân bằng áp suất phân lớp tại độ sâu.
    `
  },
  'Sự nổi': {
    tongQuan: `
## Khái niệm trọng tâm
- Hệ quả tĩnh lực của Lực đẩy Archimedes quyết định nổi/chìm.
- Mối tương quan Trọng lượng riêng của vật và Trọng lượng riêng của lưu dẫn.

## Công thức cốt lõi
- $P > F_A \\rightarrow$ Vật chìm.
- $P = F_A \\rightarrow$ Vật lơ lửng nằm giữa.
- $P < F_A$ (trạng thái ngập 100%) $\\rightarrow$ Lực đẩy thắng nên Vật bị đẩy trồi nổi lên bề mặt và cân bằng với một phần nổi một phần chìm. 

## Kỹ năng giải bài
- Giải cân bằng tĩnh của khối gỗ lênh đênh mặt nước bằng phương trình: $m_{\\text{vật}} g = F_{A((\\text{nước}))}$.
    `,
    phanTich: `
## Phân tích chuyên sâu
- Khi phân tích chuyên sâu về sự nổi trên tàu chở hàng (Tàu chìm thép nặng khổng lồ), bản chất là người ta tạo ra khoang thân rỗng hốc lớn. Thể tích vĩ đại sẽ gánh trọn một khối thể tích nước đẩy lớn bù đi tổng khối lượng khổng lồ.
    `
  }
};

// Fallback logic for any minor typos or missing topics can be managed at entry point
