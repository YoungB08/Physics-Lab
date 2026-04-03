import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingButton } from '../components/LoadingButton';

export function InstallerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    systemName: 'KNTech Physics Lab',
    brandName: 'KNTech',
    supportEmail: 'support@kntech.site',
    siteDescription: 'KNTech Physics Lab là nền tảng học Vật lý THPT có mô phỏng 3D, AI, CMS Root và quản trị học vụ.',
    rootEmail: 'root@kntech.site',
    rootPassword: '123456',
    rootName: 'KNTech CMS Root',
    adminEmail: 'admin@kntech.site',
    adminPassword: '123456',
    adminName: 'KNTech Admin',
    uploadLimitMb: 20,
    examQuestionLimit: 50,
    aiRequestsPerDay: 200
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      setError('');
      await api.runInstaller(form);
      setMessage('KNTech installer hoàn tất. Đang chuyển sang đăng nhập...');
      setTimeout(() => {
        window.location.href = '/dang-nhap?installed=1';
      }, 900);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel installer-panel" style={{ width: 'min(1120px, 100%)' }}>
        <div>
          <div className="brand-kicker">KNTech Installer</div>
          <div className="hero-title">First-run setup cho KNTech Physics Lab</div>
          <p>Installer nhiều bước kiểu CMS/forum: khai báo thương hiệu, tài khoản gốc, giới hạn quan trọng và hoàn tất cài đặt trước khi cho phép đăng nhập.</p>
        </div>
        {message && <div className="response-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}
        <div className="installer-grid">
          <div className="card stack">
            <h3>Thương hiệu & thông tin hệ thống</h3>
            <input className="input" value={form.systemName} onChange={(e) => setForm({ ...form, systemName: e.target.value })} placeholder="Tên hệ thống" />
            <input className="input" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} placeholder="Thương hiệu" />
            <input className="input" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} placeholder="Email hỗ trợ" />
            <textarea className="textarea" value={form.siteDescription} onChange={(e) => setForm({ ...form, siteDescription: e.target.value })} />
            <div className="note-box">KNTech sẽ được gắn làm thương hiệu mặc định cho toàn bộ frontend, CMS và installer.</div>
          </div>
          <div className="card stack">
            <h3>Tài khoản KNTech CMS Root</h3>
            <input className="input" value={form.rootName} onChange={(e) => setForm({ ...form, rootName: e.target.value })} placeholder="Tên CMS Root" />
            <input className="input" value={form.rootEmail} onChange={(e) => setForm({ ...form, rootEmail: e.target.value })} placeholder="Email CMS Root" />
            <input className="input" type="password" value={form.rootPassword} onChange={(e) => setForm({ ...form, rootPassword: e.target.value })} placeholder="Mật khẩu CMS Root" />
            <h3>Tài khoản KNTech Admin</h3>
            <input className="input" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Tên admin" />
            <input className="input" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="Email admin" />
            <input className="input" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="Mật khẩu admin" />
          </div>
          <div className="card stack">
            <h3>Giới hạn vận hành</h3>
            <input className="input" type="number" value={form.uploadLimitMb} onChange={(e) => setForm({ ...form, uploadLimitMb: Number(e.target.value) })} placeholder="Upload MB" />
            <input className="input" type="number" value={form.examQuestionLimit} onChange={(e) => setForm({ ...form, examQuestionLimit: Number(e.target.value) })} placeholder="Số câu tối đa / đề" />
            <input className="input" type="number" value={form.aiRequestsPerDay} onChange={(e) => setForm({ ...form, aiRequestsPerDay: Number(e.target.value) })} placeholder="Lượt AI / ngày" />
            <div className="mini-stat-grid">
              <div className="mini-stat"><strong>DB</strong><span>MySQL</span></div>
              <div className="mini-stat"><strong>Brand</strong><span>KNTech</span></div>
              <div className="mini-stat"><strong>CMS</strong><span>Root-first</span></div>
            </div>
          </div>
        </div>
        <div className="row-between">
          <div className="muted">KNTech installer sẽ khóa route cài đặt sau khi hoàn tất.</div>
          <LoadingButton onClick={submit} loading={loading} loadingText="Đang cài đặt...">Hoàn tất cài đặt</LoadingButton>
        </div>
      </div>
    </div>
  );
}
