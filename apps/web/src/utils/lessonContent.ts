export type LessonSection = {
  id?: string;
  tieuDe?: string;
  mucDo?: 'DE' | 'TRUNG_BINH' | 'KHO';
  noiDungMarkdown?: string;
  thuTu?: number;
};

function slugish(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function inferDomain(data: any) {
  const text = slugish(`${data?.ten || ''} ${data?.moTa || ''} ${data?.chuDeThi || ''} ${data?.chuong?.ten || ''}`);
  if (/(dao dong|song|con lac|lo xo|giao thoa|song dung)/.test(text)) return 'dao-dong';
  if (/(dien|tu truong|cam ung|mach|rlc|bien ap|coulomb|lorentz)/.test(text)) return 'dien-tu';
  if (/(thau kinh|khuc xa|guong|mat|kinh|quang|tia x)/.test(text)) return 'quang';
  if (/(phong xa|hat nhan|luong tu|bohr|hien dai)/.test(text)) return 'hien-dai';
  return 'co-hoc';
}

function formulas(domain: string) {
  if (domain === 'dao-dong') return ['T = 2π√(m/k)', 'T = 2π√(l/g)', 'v = λf', 'Δφ = 2πΔt/T', 'W = 1/2kA²'];
  if (domain === 'dien-tu') return ['F = qE', 'F = k|q1q2|/r²', 'Φ = BS cosα', 'e = -dΦ/dt', 'Z² = R² + (ωL - 1/ωC)²'];
  if (domain === 'quang') return ['n₁ sin i = n₂ sin r', '1/f = 1/d + 1/dʼ', 'G∞ = Đ/f', 'Gk = Đ/f + 1', 'tanα ≈ α'];
  if (domain === 'hien-dai') return ['E = hf', 'ΔE = hc/λ', 'N = N₀e^{-λt}', 'E = Δmc²', '1u = 931.5 MeV/c²'];
  return ['v = s/t', 'v = v₀ + at', 's = v₀t + 1/2 at²', 'F = ma', 'A = F.s.cosα'];
}

function traps(domain: string) {
  if (domain === 'dao-dong') return ['Nhầm giữa li độ, biên độ và quãng đường trong một chu kì.', 'Quên đổi pha sang radian hoặc quên dấu khi so sánh pha.', 'Đồng nhất mọi bài sóng với chuyển động của phần tử môi trường.'];
  if (domain === 'dien-tu') return ['Đảo dấu điện tích khiến sai chiều lực/trường.', 'Nhầm suất điện động cảm ứng với cường độ dòng điện.', 'Không phân biệt trị hiệu dụng và giá trị tức thời của mạch xoay chiều.'];
  if (domain === 'quang') return ['Dùng sai quy ước chiều dương của khoảng cách ảnh và vật.', 'Nhầm kính lúp, kính hiển vi, kính thiên văn ở công thức số bội giác.', 'Bỏ qua điều kiện góc nhỏ hoặc mắt ngắm chừng ở vô cực.'];
  if (domain === 'hien-dai') return ['Lẫn lộn giữa hằng số phóng xạ λ, chu kì bán rã T và thời gian t.', 'Nhầm trạng thái dừng của Bohr với quỹ đạo cổ điển.', 'Quên đổi đơn vị MeV, u, Joule khi tính năng lượng liên kết.'];
  return ['Nhầm vận tốc trung bình với tốc độ tức thời.', 'Sai dấu khi chiếu lực trên trục chọn.', 'Quên điều kiện xuất phát của bài toán dẫn đến sai phương trình chuyển động.'];
}

function strategy(domain: string) {
  if (domain === 'dao-dong') return 'Ưu tiên vẽ nhanh trục pha hoặc chu kì, nhận diện đại lượng nào biến thiên điều hòa trước rồi mới thay số.';
  if (domain === 'dien-tu') return 'Tách bài thành 3 lớp: mô hình vật lý, chiều đại lượng véc tơ, cuối cùng mới đến biến đổi đại số.';
  if (domain === 'quang') return 'Vẽ tia đặc biệt hoặc sơ đồ đường truyền trước, sau đó khóa dấu của từng khoảng cách và tiêu cự.';
  if (domain === 'hien-dai') return 'Luôn đổi đơn vị ngay từ đầu và ghi rõ đại lượng vi mô nào đang được bảo toàn hoặc suy giảm theo hàm mũ.';
  return 'Bắt đầu bằng sơ đồ lực/chuyển động, chọn trục hợp lý, viết 1 công thức lõi rồi mới suy ra đáp án trắc nghiệm.';
}

function mindsets(domain: string) {
  if (domain === 'dao-dong') return ['Hỏi bản thân “đại lượng này sớm pha hay trễ pha với li độ?”.', 'Tách phần mô tả hình học và phần mô tả thời gian.'];
  if (domain === 'dien-tu') return ['Luôn quyết định chiều trường, chiều lực, chiều dòng trước khi thay số.', 'Kiểm tra thứ nguyên sau mỗi phép biến đổi.'];
  if (domain === 'quang') return ['Vẽ tia chuẩn trước khi dùng công thức.', 'Khóa quy ước dấu bằng một dòng ghi chú ngay trên hình.'];
  if (domain === 'hien-dai') return ['Đổi đơn vị năng lượng ngay từ đầu.', 'Phân biệt rõ biến vi mô, biến vĩ mô và hằng số vật lý.'];
  return ['Vẽ hình hoặc sơ đồ trước.', 'Kiểm tra giới hạn vật lý: nếu đại lượng quá lớn/quá nhỏ thì có hợp lý không?'];
}

function oralChecks(domain: string) {
  if (domain === 'dao-dong') return ['Phát biểu điều kiện để dao động điều hòa gần đúng.', 'Giải thích vì sao nút sóng không dao động còn bụng sóng dao động mạnh nhất.'];
  if (domain === 'dien-tu') return ['Nêu sự khác nhau giữa điện trường, điện thế và hiệu điện thế.', 'Giải thích bản chất vật lý của hiện tượng cảm ứng điện từ.'];
  if (domain === 'quang') return ['Vì sao có thể dùng góc nhỏ trong nhiều bài thấu kính?', 'Khi nào ảnh là thật, khi nào ảnh là ảo?'];
  if (domain === 'hien-dai') return ['Ý nghĩa của mẫu nguyên tử Bohr trong chương trình phổ thông là gì?', 'Tại sao năng lượng liên kết riêng đặc trưng cho độ bền hạt nhân?'];
  return ['Khi nào có thể bỏ qua ma sát hoặc cản?', 'Ý nghĩa vật lý của hệ số góc trên đồ thị là gì?'];
}

export function buildExtendedSections(data: any, rawSections: LessonSection[] = []) {
  const sections = [...(rawSections || [])].sort((a, b) => Number(a.thuTu || 0) - Number(b.thuTu || 0));
  const domain = inferDomain(data);
  const title = data?.ten || 'Bài học';
  const grade = data?.chuong?.lop || 'THPT';
  const chapter = data?.chuong?.ten || 'Chương';
  const baseIntro = data?.moTa || `Chuyên đề ${title} thuộc ${chapter}, định hướng bám sát chương trình THPT 2025-2026.`;
  const existingText = sections.map((item) => `${item.tieuDe || ''} ${item.noiDungMarkdown || ''}`).join('\n').toLowerCase();

  const generated: LessonSection[] = [
    {
      tieuDe: 'Mục tiêu chuẩn THPT 2025-2026',
      mucDo: 'DE',
      thuTu: 9001,
      noiDungMarkdown: `## Mục tiêu học tập
- Nắm bản chất vật lý của **${title}** trong mạch kiến thức lớp **${grade}**.
- Biết nối lý thuyết với mô phỏng 3D để quan sát biến thiên đại lượng.
- Tự nhận diện dạng bài cơ bản, trung bình và vận dụng.

## Phạm vi
${baseIntro}`
    },
    {
      tieuDe: 'Tiền đề cần nhớ trước khi học',
      mucDo: 'DE',
      thuTu: 9002,
      noiDungMarkdown: `## Prerequisite
- Ôn lại chương hoặc khái niệm nền từ **${chapter}**.
- Chốt nghĩa vật lý của từng đại lượng trước khi dùng công thức.
- Đặt câu hỏi: hiện tượng này mô tả sự **biến thiên theo thời gian**, **theo vị trí** hay **theo tương tác lực**?`
    },
    {
      tieuDe: 'Công thức lõi và cách dùng',
      mucDo: 'TRUNG_BINH',
      thuTu: 9003,
      noiDungMarkdown: `## Công thức cần nhớ
${formulas(domain).map((item) => `- \(${item}\)`).join('\n')}

## Cách dùng nhanh
- Xác định đúng ý nghĩa vật lý của từng biến trước khi thay số.
- Ưu tiên suy luận chiều, dấu và điều kiện áp dụng rồi mới bấm máy.`
    },
    {
      tieuDe: 'Tư duy bản chất và dấu hiệu nhận dạng',
      mucDo: 'TRUNG_BINH',
      thuTu: 9004,
      noiDungMarkdown: `## Góc nhìn bản chất
${mindsets(domain).map((item) => `- ${item}`).join('\n')}

## Dấu hiệu nhận dạng dạng bài
- Bài định tính: yêu cầu giải thích chiều, xu hướng, điều kiện xuất hiện.
- Bài định lượng: yêu cầu khóa mô hình, dữ kiện và đại lượng cần tìm trước khi thay số.`
    },
    {
      tieuDe: 'Sai lầm thường gặp',
      mucDo: 'TRUNG_BINH',
      thuTu: 9005,
      noiDungMarkdown: `## Bẫy hay gặp
${traps(domain).map((item) => `- ${item}`).join('\n')}

## Mẹo tự kiểm
- Sau mỗi bước, hỏi lại: “đại lượng này đang tăng hay giảm, cùng chiều hay ngược chiều?”.`
    },
    {
      tieuDe: 'Liên hệ mô phỏng và thí nghiệm',
      mucDo: 'TRUNG_BINH',
      thuTu: 9006,
      noiDungMarkdown: `## Quan sát mô phỏng
- Thay đổi 1 tham số tại một thời điểm để thấy quy luật rõ nhất.
- Ghi nhận đại lượng nào đổi tuyến tính, đại lượng nào đổi phi tuyến.
- So sánh dự đoán trước khi chạy mô phỏng với kết quả sau khi chạy.`
    },
    {
      tieuDe: 'Chiến lược giải nhanh và tự luận',
      mucDo: 'KHO',
      thuTu: 9007,
      noiDungMarkdown: `## Khung xử lý
1. Đọc đề và nhận diện mô hình vật lý.
2. Chọn công thức lõi hoặc định luật gốc.
3. Chuẩn hóa đơn vị, dấu, điều kiện biên.
4. So sánh đáp án bằng ước lượng nếu cần.

## Chiến lược
${strategy(domain)}`
    },
    {
      tieuDe: 'Checklist tự vấn miệng',
      mucDo: 'KHO',
      thuTu: 9008,
      noiDungMarkdown: `## Tự hỏi nhanh trước kiểm tra
${oralChecks(domain).map((item) => `- ${item}`).join('\n')}`
    },
    {
      tieuDe: 'Bài tập tự luyện mở rộng',
      mucDo: 'KHO',
      thuTu: 9009,
      noiDungMarkdown: `## Tự luyện 3 tầng
- **Tầng 1:** Viết lại lời giải ngắn gọn cho một bài định tính của **${title}**.
- **Tầng 2:** Tạo một biến thể tăng/giảm tham số trong mô phỏng rồi dự đoán kết quả trước khi chạy.
- **Tầng 3:** So sánh 2 tình huống khác nhau để rút ra quy luật tổng quát.`
    },
    {
      tieuDe: 'Checklist ôn thi nước rút',
      mucDo: 'KHO',
      thuTu: 9010,
      noiDungMarkdown: `## 30 giây cuối trước khi chốt đáp án
- Đơn vị đã đồng nhất chưa?
- Dấu và chiều đã khóa đúng chưa?
- Kết quả có hợp lý về bậc lớn không?
- Nếu đổi dữ kiện theo trực giác, đáp án có biến thiên đúng xu hướng vật lý không?`
    }
  ];

  const filteredGenerated = generated.filter((item) => !existingText.includes((item.tieuDe || '').toLowerCase()));
  return [...sections, ...filteredGenerated].sort((a, b) => Number(a.thuTu || 0) - Number(b.thuTu || 0));
}
