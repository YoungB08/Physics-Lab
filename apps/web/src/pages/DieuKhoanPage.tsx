const sections = [
  {
    title: '1. Phạm vi dịch vụ',
    items: [
      'KNTech Physics Lab được dùng cho dạy học, luyện tập, kiểm tra và tổ chức thi trực tuyến trong phạm vi giáo dục hợp pháp.',
      'Mỗi tài khoản phải được sử dụng đúng vai trò đã cấp: học sinh, giáo viên, quản trị viên hoặc CMS Root.',
      'Đơn vị triển khai chịu trách nhiệm cấu hình đúng chính sách nội bộ trước khi mở truy cập diện rộng.'
    ]
  },
  {
    title: '2. Quy tắc phòng thi và chống gian lận',
    items: [
      'Hệ thống có thể ghi nhận tab-out, thoát fullscreen, thao tác sao chép, phím tắt nghi vấn và các sự kiện integrity khác.',
      'Bài làm có thể bị khóa hoặc buộc nộp nếu vi phạm ngưỡng anti-cheat do giáo viên/CMS cấu hình.',
      'Học sinh không được cố ý khai thác API, DevTools, extension, script hoặc thiết bị phụ để thu thập đáp án.'
    ]
  },
  {
    title: '3. Dữ liệu, quyền riêng tư và nhật ký',
    items: [
      'KNTech lưu nhật ký hệ thống, nhật ký AI và log chống gian lận nhằm phục vụ vận hành, đối soát và truy vết sự cố.',
      'Chỉ người có thẩm quyền trong CMS mới được xem báo cáo chi tiết liên quan đến chấm bài, integrity và cấu hình hệ thống.',
      'Đơn vị triển khai cần công khai cho người dùng cuối biết việc ghi log, thời gian lưu và mục đích sử dụng dữ liệu.'
    ]
  },
  {
    title: '4. Nội dung AI và nội dung học tập',
    items: [
      'Phản hồi từ AI là công cụ hỗ trợ học tập; giáo viên hoặc quản trị học vụ phải kiểm tra lại trước khi dùng làm tài liệu chính thức.',
      'Nội dung lesson builder phải bám chuẩn chương trình THPT 2025-2026, không đăng nội dung vi phạm pháp luật hoặc bản quyền.',
      'Khi gắn tài nguyên ngoài, đơn vị triển khai phải tự bảo đảm quyền sử dụng và nguồn dẫn hợp lệ.'
    ]
  },
  {
    title: '5. Giới hạn trách nhiệm và xử lý vi phạm',
    items: [
      'KNTech có quyền tạm khóa tính năng, khóa tài khoản hoặc cô lập phiên thi khi phát hiện hành vi bất thường hoặc nguy cơ rò rỉ đáp án.',
      'Mọi khiếu nại điểm số, log anti-cheat hoặc dữ liệu bài làm phải được đối chiếu bằng log hệ thống và cấu hình đề gốc.',
      'Đơn vị triển khai tự chịu trách nhiệm đối với nội dung tùy biến, dữ liệu nhập tay và tài nguyên ngoài do mình cung cấp.'
    ]
  }
];

export function DieuKhoanPage() {
  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-admin legal-hero">
        <h1 className="page-title">Điều khoản sử dụng KNTech</h1>
        <p>Bộ điều khoản vận hành được viết lại theo hướng thực dụng hơn cho môi trường trường học, trung tâm và các luồng thi có anti-cheat.</p>
      </div>
      <div className="legal-grid">
        {sections.map((section) => (
          <div key={section.title} className="card legal-card kntech-markdown">
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="card kntech-markdown legal-note">
        <h2>Cam kết vận hành</h2>
        <p>KNTech khuyến nghị mỗi đơn vị triển khai ban hành thêm phụ lục nội bộ về: quy trình coi thi, quyền truy cập CMS, lưu trữ dữ liệu và xử lý kháng nghị sau thi.</p>
      </div>
    </div>
  );
}
