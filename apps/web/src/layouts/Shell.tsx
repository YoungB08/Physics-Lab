import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { BookOpen, Brain, Home, PlusCircle, Shield, Database, LogOut, Sparkles, ChevronDown, FileText, Copyright, MessagesSquare } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Footer } from '../components/Footer';
import { appTitle, webAppConfig } from '../config/webAppConfig';

export function Shell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLegal, setShowLegal] = useState(false);
  const isCms = user?.vaiTro === 'CMS_ROOT';
  const links = [
    { to: '/', label: `Dashboard`, icon: Home, show: true },
    { to: '/chuong-trinh', label: 'Chủ đề mô phỏng', icon: BookOpen, show: true },
    { to: '/hoi-ai', label: `${webAppConfig.brandName} AI`, icon: Brain, show: webAppConfig.features.aiConsole },
    { to: '/chat', label: 'Chat 1-1', icon: MessagesSquare, show: webAppConfig.features.chat },
    { to: '/tao-de', label: 'Tạo đề', icon: PlusCircle, show: webAppConfig.features.examBuilder && user?.vaiTro !== 'HOC_SINH' },
    { to: '/quan-tri', label: 'Admin vận hành', icon: Shield, show: user?.vaiTro === 'QUAN_TRI_VIEN' || user?.vaiTro === 'CMS_ROOT' },
    { to: '/cms', label: 'CMS Root', icon: Database, show: isCms }
  ];

  return (
    <div className="shell">
      <aside className={isCms ? 'sidebar cms-sidebar' : 'sidebar admin-sidebar'}>
        <div className="sidebar-brand-card">
          <div className="brand-kicker"><Sparkles size={16} /> {webAppConfig.brandName}</div>
          <div className="brand">{webAppConfig.productName}</div>
          <div className="muted">{isCms ? `Điều phối nội dung, mô phỏng và AI cho ${webAppConfig.productName}.` : `Admin vận hành học vụ, người dùng và theo dõi dữ liệu học tập của ${webAppConfig.productName}.`}</div>
        </div>
        <nav className="nav-list">
          {links.filter((l) => l.show).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
          <div className={showLegal ? 'legal-dropdown open' : 'legal-dropdown'}>
            <button className="nav-item legal-toggle" type="button" onClick={() => setShowLegal((v) => !v)}>
              <FileText size={18} /> Pháp lý <ChevronDown size={16} />
            </button>
            {showLegal && (
              <div className="legal-menu">
                <Link to="/dieu-khoan" className="legal-item" onClick={() => setShowLegal(false)}><FileText size={16} /> Điều khoản sử dụng</Link>
                <Link to="/ban-quyen" className="legal-item" onClick={() => setShowLegal(false)}><Copyright size={16} /> Bản quyền</Link>
              </div>
            )}
          </div>
        </nav>
        <div className={isCms ? 'profile-card profile-card-cms' : 'profile-card profile-card-admin'}>
          <div className="profile-head">
            <Avatar name={user?.tenHienThi || user?.email || webAppConfig.brandName} size={56} />
            <div>
              <div className="profile-name">{user?.tenHienThi || appTitle('Người dùng', webAppConfig.brandName)}</div>
              <div className="muted">{user?.email}</div>
            </div>
          </div>
          <div className="badge-row">
            <span className="badge">{isCms ? appTitle(webAppConfig.brandName, 'CMS Root') : appTitle(webAppConfig.brandName, 'Admin')}</span>
            <span className="badge badge-soft">{user?.vaiTro}</span>
          </div>
          <button className="button button-secondary full" onClick={() => { logout(); navigate('/dang-nhap'); }}><LogOut size={16} /> Đăng xuất</button>
        </div>
      </aside>
      <main className="content content-with-footer"><div className="content-body"><Outlet /></div><Footer /></main>
    </div>
  );
}
