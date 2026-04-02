import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="kntech-footer kntech-footer-compact">
      <div className="footer-main">
        <div className="footer-brand">KNTech Physics Lab</div>
        <div className="footer-meta">Hỗ trợ: <a href="mailto:support@kntech.vn">support@kntech.vn</a> · Dành cho trường, trung tâm và đội ngũ học thuật cần vận hành nội dung sâu.</div>
      </div>
      <div className="footer-links">
        <Link to="/dieu-khoan">Điều khoản sử dụng</Link>
        <Link to="/ban-quyen">Bản quyền & tài nguyên</Link>
      </div>
    </footer>
  );
}
