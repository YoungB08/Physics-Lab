import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Shell } from './layouts/Shell';
import { DangNhapPage } from './pages/DangNhapPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChuongTrinhPage } from './pages/ChuongTrinhPage';
import { BaiHocPage } from './pages/BaiHocPage';
import { HoiAIPage } from './pages/HoiAIPage';
import { ChatPage } from './pages/ChatPage';
import { TaoDePageClean } from './pages/TaoDePageClean';
import { AdminPage } from './pages/AdminPage';
import { useAuthStore } from './store/authStore';
import { api } from './services/api';
import { InstallerPage } from './pages/InstallerPage';
import { PageLoader } from './components/PageLoader';
import { DieuKhoanPage } from './pages/DieuKhoanPage';
import { BanQuyenPage } from './pages/BanQuyenPage';
import { PhongThiPageClean } from './pages/PhongThiPageClean';

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? children : <Navigate to="/dang-nhap" replace />;
}

function RoleProtected({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/dang-nhap" replace />;
  return roles.includes(user.vaiTro) ? children : <Navigate to="/" replace />;
}

function RouteLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);
  return <PageLoader visible={loading} label={`KNTech đang mở ${location.pathname === '/' ? 'dashboard' : location.pathname}`} />;
}

export default function App() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { api.systemInstallStatus().then((r) => setInstalled(r.installed)).catch(() => setInstalled(true)); }, []);

  if (installed === null) return <div className="auth-page"><div className="auth-panel">KNTech đang kiểm tra cài đặt...</div></div>;
  if (!installed) return <InstallerPage />;

  return (
    <>
      <RouteLoader />
      <Routes>
        <Route path="/dang-nhap" element={<DangNhapPage />} />
        <Route path="/" element={<Protected><Shell /></Protected>}>
          <Route index element={<DashboardPage />} />
          <Route path="chuong-trinh" element={<ChuongTrinhPage />} />
          <Route path="bai-hoc/:slug" element={<BaiHocPage />} />
          <Route path="hoi-ai" element={<HoiAIPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tao-de" element={<TaoDePageClean />} />
          <Route path="quan-tri" element={<RoleProtected roles={['QUAN_TRI_VIEN', 'CMS_ROOT']}><AdminPage /></RoleProtected>} />
          <Route path="cms" element={<RoleProtected roles={['CMS_ROOT']}><AdminPage cmsMode /></RoleProtected>} />
          <Route path="phong-thi/:qrToken" element={<Protected><PhongThiPageClean /></Protected>} />
          <Route path="dieu-khoan" element={<Protected><DieuKhoanPage /></Protected>} />
          <Route path="ban-quyen" element={<Protected><BanQuyenPage /></Protected>} />
        </Route>
      </Routes>
    </>
  );
}
