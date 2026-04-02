import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { KPI } from '../components/KPI';
import { StatBars } from '../components/StatBars';
import { useAuthStore } from '../store/authStore';

export function DashboardPage() {
  const [data, setData] = useState<any>();
  const user = useAuthStore((s) => s.user);
  useEffect(() => { api.thongKe().then(setData).catch(() => undefined); }, []);

  const chartItems = useMemo(() => [
    { label: 'Đề thi', value: Number(data?.tongDeThi ?? data?.soDe ?? 0) },
    { label: 'Bài làm', value: Number(data?.tongBaiLam ?? 0) },
    { label: 'Lượt AI', value: Number(data?.soLanHoiAI ?? 0) },
    { label: 'Người dùng', value: Number(data?.tongNguoiDung ?? 0) }
  ].filter((item) => item.value > 0), [data]);

  return (
    <div className="stack">
      <div className="card hero-panel">
        <div className="brand-kicker">KNTech Dashboard</div>
        <h1 className="page-title">Tổng quan hệ thống học tập</h1>
        <p>Dashboard lấy dữ liệu theo đúng quyền hiện tại để KNTech CMS Root, Admin, Giáo viên và Học sinh nhìn đúng phần việc của mình.</p>
      </div>
      <div className="grid-4">
        <KPI label="Thương hiệu" value="KNTech" />
        <KPI label="Vai trò" value={user?.vaiTro ?? '-'} />
        <KPI label="Điểm TB / số đề" value={data?.diemTrungBinh ?? data?.soDe ?? '-'} />
        <KPI label="Lượt AI / bài làm" value={data?.soLanHoiAI ?? data?.tongBaiLam ?? '-'} />
      </div>
      <div className="grid-2">
        <div className="card stack">
          <h3>Biểu đồ nhanh KNTech</h3>
          {chartItems.length ? <StatBars items={chartItems} /> : <div className="note-box">KNTech chưa có đủ dữ liệu để dựng biểu đồ cho vai trò hiện tại.</div>}
        </div>
        <div className="card stack">
          <h3>Bảng chỉ số</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Chỉ số</th><th>Giá trị</th></tr></thead>
              <tbody>
                <tr><td>Vai trò hiện tại</td><td>{user?.vaiTro ?? '-'}</td></tr>
                <tr><td>Điểm trung bình</td><td>{data?.diemTrungBinh ?? '-'}</td></tr>
                <tr><td>Số đề / tổng đề</td><td>{data?.soDe ?? data?.tongDeThi ?? '-'}</td></tr>
                <tr><td>Bài làm</td><td>{data?.tongBaiLam ?? '-'}</td></tr>
                <tr><td>Lượt hỏi AI</td><td>{data?.soLanHoiAI ?? '-'}</td></tr>
                <tr><td>Tổng người dùng</td><td>{data?.tongNguoiDung ?? '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
