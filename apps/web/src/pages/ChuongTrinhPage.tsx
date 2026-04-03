import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const TOPIC_RULES = [
  { key: 'co-hoc', label: 'Cơ học & động lực học', match: /(động|newton|rơi|ném|chuyển động|con lắc|dao động|lò xo|ma sát)/i },
  { key: 'song', label: 'Sóng & dao động', match: /(sóng|giao thoa|dừng|âm)/i },
  { key: 'dien-tu', label: 'Điện trường & từ trường', match: /(điện|từ|lorentz|cảm ứng|mạch|biến áp)/i },
  { key: 'quang', label: 'Quang học', match: /(thấu kính|gương|ánh sáng|quang|khúc xạ)/i },
  { key: 'hat-nhan', label: 'Hạt nhân & hiện đại', match: /(phóng xạ|hạt nhân|lượng tử|bohr)/i }
];

function resolveTopic(lesson: any) {
  const haystack = `${lesson.ten} ${lesson.moTa || ''} ${lesson.chuong?.ten || ''} ${lesson.chuDeThi || ''}`;
  return TOPIC_RULES.find((rule) => rule.match.test(haystack)) ?? { key: 'tong-hop', label: 'Chủ đề tổng hợp' };
}

export function ChuongTrinhPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [simOnly, setSimOnly] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { api.getChuongTrinh().then(setRows); }, []);

  const allLessons = useMemo(
    () => rows.flatMap((chapter) => (chapter.baiHoc || []).map((lesson: any) => ({ ...lesson, chuong: { ten: chapter.ten, lop: chapter.lop } }))),
    [rows]
  );

  const topics = useMemo(() => {
    const filtered = allLessons.filter((lesson: any) => {
      const matchesSearch = !search.trim() || `${lesson.ten} ${lesson.moTa || ''} ${lesson.chuong.ten}`.toLowerCase().includes(search.toLowerCase());
      const matchesSim = !simOnly || lesson.coMoPhong;
      const matchesGrade = gradeFilter === 'all' || String(lesson.chuong.lop) === gradeFilter;
      return matchesSearch && matchesSim && matchesGrade;
    });
    return filtered.reduce((acc: Record<string, any>, lesson: any) => {
      const topic = resolveTopic(lesson);
      acc[topic.key] = acc[topic.key] || { ...topic, lessons: [] };
      acc[topic.key].lessons.push(lesson);
      return acc;
    }, {});
  }, [allLessons, search, simOnly, gradeFilter]);

  const stats = useMemo(() => ({
    totalLessons: allLessons.length,
    totalSim: allLessons.filter((item: any) => item.coMoPhong).length,
    grade10: allLessons.filter((item: any) => item.chuong.lop === 10).length,
    grade11: allLessons.filter((item: any) => item.chuong.lop === 11).length,
    grade12: allLessons.filter((item: any) => item.chuong.lop === 12).length
  }), [allLessons]);

  const spotlight = useMemo(() => [...allLessons].sort((a, b) => Number(Boolean(b.coMoPhong)) - Number(Boolean(a.coMoPhong))).slice(0, 4), [allLessons]);

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-cms">
        <div className="brand-kicker">KNTech Physics Catalog</div>
        <h1 className="page-title">Catalog THPT 2025-2026</h1>
        <p>Catalog đã được đẩy nổi bật hơn: có spotlight, thống kê độ phủ, lọc theo lớp/chủ đề và ưu tiên hiển thị bài có mô phỏng 3D thật.</p>
        <div className="lesson-hero-stats">
          <div className="mini-stat"><strong>Tổng bài</strong><span>{stats.totalLessons}</span></div>
          <div className="mini-stat"><strong>Bài có 3D</strong><span>{stats.totalSim}</span></div>
          <div className="mini-stat"><strong>Độ phủ</strong><span>L10 {stats.grade10} · L11 {stats.grade11} · L12 {stats.grade12}</span></div>
        </div>
      </div>

      <div className="grid-4">
        {spotlight.map((lesson: any) => (
          <Link key={lesson.id} className="lesson-item lesson-item-rich spotlight-card" to={`/bai-hoc/${lesson.slug}`}>
            <div className="row-between">
              <div className="lesson-title">{lesson.ten}</div>
              <span className="badge badge-soft">Lớp {lesson.chuong.lop}</span>
            </div>
            <div className="muted">{lesson.chuong.ten}</div>
            <div className="lesson-desc">{lesson.moTa || 'Bài học nổi bật trong full catalog KNTech.'}</div>
            <div className="badge-row">
              <span className="badge">{lesson.coMoPhong ? 'Three.js 3D' : 'Theory'}</span>
              <span className="badge badge-soft">{lesson.chuDeThi || resolveTopic(lesson).label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="card stack compact-filters">
        <div className="grid-3 compact-filter-grid">
          <input className="input" placeholder="Tìm bài, chương, chủ đề..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="all">Tất cả lớp</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
          <label className="toggle-chip"><input type="checkbox" checked={simOnly} onChange={(e) => setSimOnly(e.target.checked)} /> Chỉ hiện bài có mô phỏng 3D</label>
        </div>
      </div>

      {Object.values(topics).map((topic: any) => {
        const isExpanded = expanded[topic.key];
        const shown = isExpanded ? topic.lessons : topic.lessons.slice(0, 6);
        return (
          <div key={topic.key} className="card stack">
            <div className="row-between wrap-mobile">
              <div>
                <h2>{topic.label}</h2>
                <div className="muted">{topic.lessons.length} bài trong nhóm chủ đề này</div>
              </div>
              <div className="badge-row">
                <span className="badge">KNTech Topic</span>
                <span className="badge badge-soft">{topic.lessons.filter((item: any) => item.coMoPhong).length} bài có mô phỏng</span>
              </div>
            </div>
            <div className="lesson-grid topic-grid">
              {shown.map((lesson: any) => (
                <Link key={lesson.id} className="lesson-item lesson-item-rich" to={`/bai-hoc/${lesson.slug}`}>
                  <div className="row-between">
                    <div className="lesson-title">{lesson.ten}</div>
                    <span className="badge badge-soft">Lớp {lesson.chuong.lop}</span>
                  </div>
                  <div className="muted">{lesson.chuong.ten}</div>
                  <div className="lesson-desc">{lesson.moTa || 'KNTech lesson mô phỏng 3D nâng cao cho luyện học và luyện thi.'}</div>
                  <div className="badge-row">
                    <span className="badge">{lesson.coMoPhong ? 'Three.js 3D' : 'Lý thuyết'}</span>
                    <span className="badge badge-soft">{lesson.chuDeThi || topic.label}</span>
                  </div>
                </Link>
              ))}
            </div>
            {topic.lessons.length > 6 && (
              <div className="row-between">
                <div className="muted">Đang hiển thị {shown.length}/{topic.lessons.length} bài</div>
                <button className="button button-secondary" onClick={() => setExpanded((prev) => ({ ...prev, [topic.key]: !prev[topic.key] }))}>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
