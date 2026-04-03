import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LoadingButton } from '../components/LoadingButton';
import { appTitle, webAppConfig } from '../config/webAppConfig';

export function DangNhapPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: 'root@kntech.vn', tenHienThi: '', matKhau: '123456', vaiTro: 'HOC_SINH' as 'HOC_SINH' | 'GIAO_VIEN', lopHoc: '12A1' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      setError('');
      const data = isRegister ? await api.dangKy(form) : await api.dangNhap({ email: form.email, matKhau: form.matKhau });
      setSession(data.accessToken, data.user);
      navigate('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel login-panel">
        <div className="brand-kicker">{webAppConfig.brandName}</div>
        <div className="hero-title">{webAppConfig.productName}</div>
        <p className="muted">Đăng nhập để truy cập học liệu, mô phỏng 3D, AI, thi cử và khu quản trị của {webAppConfig.systemName}. Tài khoản mẫu sau installer: root@kntech.site / 123456 và admin@kntech.site / 123456.</p>
        <div className="tab-row">
          <button className={isRegister ? 'tab' : 'tab active'} onClick={() => setIsRegister(false)}>Đăng nhập</button>
          <button className={isRegister ? 'tab active' : 'tab'} onClick={() => setIsRegister(true)}>Đăng ký</button>
        </div>
        {isRegister && <input className="input" placeholder="Tên hiển thị" value={form.tenHienThi} onChange={(e) => setForm({ ...form, tenHienThi: e.target.value })} />}
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Mật khẩu" type="password" value={form.matKhau} onChange={(e) => setForm({ ...form, matKhau: e.target.value })} />
        {isRegister && (
          <>
            <select className="select" value={form.vaiTro} onChange={(e) => setForm({ ...form, vaiTro: e.target.value as any })}>
              <option value="HOC_SINH">Học sinh</option>
              <option value="GIAO_VIEN">Giáo viên</option>
            </select>
            <input className="input" placeholder="Lớp học (nếu là học sinh)" value={form.lopHoc} onChange={(e) => setForm({ ...form, lopHoc: e.target.value })} />
          </>
        )}
        {error && <div className="error-box">{error}</div>}
        <LoadingButton className="full" onClick={submit} loading={loading} loadingText={isRegister ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...'}>
          {isRegister ? appTitle('Tạo tài khoản', webAppConfig.brandName) : 'Vào hệ thống'}
        </LoadingButton>
      </div>
    </div>
  );
}
