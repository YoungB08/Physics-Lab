const sections = [
  {
    title: '1. Quyền đối với phần mềm và giao diện',
    items: [
      'Mã nguồn, giao diện, bố cục, engine mô phỏng, cơ chế anti-cheat và các thành phần vận hành thuộc phạm vi khai thác của KNTech hoặc đơn vị sở hữu hợp pháp.',
      'Không được sao chép, bán lại hoặc tái phân phối nguyên trạng nền tảng nếu không có thỏa thuận riêng.'
    ]
  },
  {
    title: '2. Quyền đối với nội dung bài học',
    items: [
      'Bài học, câu hỏi, lời giải, asset hình ảnh và mô hình có thể do nhiều nguồn hợp pháp đóng góp; quyền sử dụng phụ thuộc vào giấy phép của từng nguồn.',
      'Mọi lesson mới đưa vào hệ thống nên ghi rõ nguồn biên soạn, tình trạng kiểm duyệt và phạm vi được phép chia sẻ.'
    ]
  },
  {
    title: '3. Tài nguyên ngoài (external resources)',
    items: [
      'KNTech hỗ trợ gắn URL ngoài như video, bài báo, mô hình, PDF, hình ảnh, mô phỏng web hoặc kho học liệu mở.',
      'Đơn vị sử dụng phải tự xác minh bản quyền, điều khoản nhúng, điều khoản deep-link và mức độ phù hợp của nguồn ngoài trước khi gắn vào lesson.',
      'Nếu nguồn ngoài bị thay đổi, gỡ bỏ hoặc chuyển hướng độc hại, quản trị viên phải cập nhật ngay trong CMS.'
    ]
  },
  {
    title: '4. Báo cáo vi phạm và gỡ bỏ',
    items: [
      'Khi có yêu cầu gỡ nội dung hoặc tranh chấp bản quyền, CMS Root/Quản trị viên phải khóa lesson hoặc bỏ link ngoài trong thời gian rà soát.',
      'Log thay đổi, người sửa và thời điểm sửa nên được lưu lại để phục vụ đối soát pháp lý.'
    ]
  }
];

export function BanQuyenPage() {
  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-admin legal-hero">
        <h1 className="page-title">Bản quyền & tài nguyên ngoài</h1>
        <p>Trang này nhấn mạnh rõ hơn phần quyền sử dụng bài học, mô phỏng, asset và mọi tài nguyên external được gắn trong từng lesson.</p>
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
    </div>
  );
}
