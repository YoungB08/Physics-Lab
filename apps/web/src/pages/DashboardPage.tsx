import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { StatBars } from '../components/StatBars';
import { useAuthStore } from '../store/authStore';

function formatValue(value: unknown) {
  if (value === null || typeof value === 'undefined' || value === '') return '-';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '-';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

function roleLabel(role?: string | null) {
  const map: Record<string, string> = {
    CMS_ROOT: 'CMS Root',
    QUAN_TRI_VIEN: 'Quản trị viên',
    GIAO_VIEN: 'Giáo viên',
    HOC_SINH: 'Học sinh'
  };
  return map[String(role || '')] || String(role || '-');
}

export function DashboardPage() {
  const [data, setData] = useState<any>();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.thongKe().then(setData).catch(() => undefined);
  }, []);

  const chartItems = useMemo(() => [
    { label: 'Đề thi', value: Number(data?.tongDeThi ?? data?.soDe ?? 0) },
    { label: 'Bài làm', value: Number(data?.tongBaiLam ?? 0) },
    { label: 'Lượt AI', value: Number(data?.soLanHoiAI ?? 0) },
    { label: 'Người dùng', value: Number(data?.tongNguoiDung ?? 0) },
    { label: 'Câu hỏi', value: Number(data?.tongCauHoi ?? 0) },
    { label: 'Số lần thi', value: Number(data?.soLanThi ?? 0) }
  ].filter((item) => item.value > 0), [data]);

  const quickCards = useMemo(() => [
    {
      label: 'Thương hiệu',
      value: 'KNTech',
      note: 'Không gian học tập, CMS và AI cùng một hệ.'
    },
    {
      label: 'Vai trò',
      value: roleLabel(user?.vaiTro),
      note: 'Dữ liệu đang hiển thị đúng phạm vi quyền hiện tại.'
    },
    {
      label: 'Điểm trung bình',
      value: formatValue(data?.diemTrungBinh ?? 0),
      note: data?.diemTrungBinh ? 'Theo lịch sử bài làm đã ghi nhận.' : 'Chưa phát sinh đủ dữ liệu để tính sâu hơn.'
    },
    {
      label: 'Lượt AI',
      value: formatValue(data?.soLanHoiAI ?? data?.tongLuotAI ?? 0),
      note: 'Theo dõi mức độ tương tác AI và hoạt động hệ thống.'
    }
  ], [data, user?.vaiTro]);

  return (
    <div className="stack dashboard-page">
      <div className="card hero-panel dashboard-hero-bright">
        <div className="brand-kicker">KNTECH DASHBOARD</div>
        <h1 className="page-title">Tổng quan hệ thống học tập</h1>
        <p>Dashboard lấy dữ liệu theo đúng quyền hiện tại để KNTech CMS Root, Admin, Giáo viên và Học sinh nhìn đúng phần việc của mình.</p>
        <div className="badge-row dashboard-hero-badges">
          <span className="badge">Vai trò: {roleLabel(user?.vaiTro)}</span>
          <span className="badge badge-soft">Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
          <span className="badge badge-variant-2">Trạng thái: Hoạt động</span>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        {quickCards.map((item) => (
          <div key={item.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-label">{item.label}</div>
            <div className="dashboard-kpi-value">{item.value}</div>
            <div className="dashboard-kpi-note">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid dashboard-main-grid--single">
        <div className="card stack dashboard-panel dashboard-panel-chart">
          <div className="row-between wrap-mobile">
            <div>
              <h3>Biểu đồ nhanh KNTech</h3>
              <div className="muted">So sánh nhanh các nhóm dữ liệu nổi bật theo vai trò hiện tại.</div>
            </div>
            <span className="badge badge-soft">{chartItems.length || 0} chỉ số</span>
          </div>
          {chartItems.length ? <StatBars items={chartItems} /> : <div className="note-box">KNTech chưa có đủ dữ liệu để dựng biểu đồ cho vai trò hiện tại.</div>}
        </div>
      </div>
    </div>
  );
}
