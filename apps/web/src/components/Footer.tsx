import { Link } from 'react-router-dom';
import { webAppConfig } from '../config/webAppConfig';

export function Footer() {
  return (
    <footer className="kntech-footer kntech-footer-compact">
      <div className="footer-main">
        <div className="footer-brand">{webAppConfig.systemName}</div>
        <div className="footer-meta">
          Hỗ trợ: <a href={`mailto:${webAppConfig.supportEmail}`}>{webAppConfig.supportEmail}</a> · {webAppConfig.supportBlurb}
        </div>
      </div>
      <div className="footer-links">
        <Link to="/dieu-khoan">Điều khoản sử dụng</Link>
        <Link to="/ban-quyen">Bản quyền & tài nguyên</Link>
      </div>
    </footer>
  );
}
