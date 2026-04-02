import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { KPI } from '../components/KPI';
import { AreaTrend } from '../components/AreaTrend';
import { RingMetric } from '../components/RingMetric';
import { findSimulationPreset, getSimulationLibrary } from '../data/simulationLibrary';
import { repairVietnameseText } from '../utils/repairVietnameseText';

type Setting = { id: string; ma: string; nhom: string; ten: string; moTa?: string; giaTri: any };
const tabs = ['tong-quan', 'cau-hinh', 'bai-hoc', 'media', 'monitor', 'ai', 'nguoi-dung', 'trang'] as const;

function levelClass(level?: string) { return level === 'ERROR' ? 'status-pill danger' : level === 'WARN' ? 'status-pill warning' : 'status-pill success'; }
type Tab = (typeof tabs)[number];

function normalizeSettingValue(value: any) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function createDefaultSections() {
  return [
    { tieuDe: 'Khái niệm trọng tâm', mucDo: 'DE', noiDungMarkdown: `## Khái niệm
- Nêu định nghĩa cốt lõi.`, thuTu: 1 },
    { tieuDe: 'Công thức cốt lõi', mucDo: 'TRUNG_BINH', noiDungMarkdown: `## Công thức
\[A = B\]`, thuTu: 2 },
    { tieuDe: 'Biến đổi công thức', mucDo: 'TRUNG_BINH', noiDungMarkdown: `## Biến đổi
1. Thay số
2. Rút gọn`, thuTu: 3 },
    { tieuDe: 'Đơn vị và đại lượng', mucDo: 'DE', noiDungMarkdown: `## Đơn vị
- Đại lượng:
- Đơn vị SI:`, thuTu: 4 },
    { tieuDe: 'Ví dụ minh họa', mucDo: 'KHO', noiDungMarkdown: `## Ví dụ
- Dữ kiện
- Giải`, thuTu: 5 }
  ];
}

function stringifyExternalResources(resources: any[] = []) {
  return (resources || []).map((item: any) => `${item?.title || ''}|${item?.url || ''}|${item?.type || 'link'}|${item?.provider || 'external'}`).join('\n');
}

function parseExternalResources(raw: string) {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title, url, type, provider] = line.split('|').map((part) => (part || '').trim());
    return { title: title || 'Tài nguyên ngoài', url, type: type || 'link', provider: provider || 'external' };
  }).filter((item) => item.url);
}

function SimulationEditor({ lesson, onChange, onUploadImage }: { lesson: any; onChange: (next: any) => void; onUploadImage: (file?: File | null) => Promise<string | undefined> }) {
  const simulationLibrary = getSimulationLibrary();
  const params = lesson?.moPhong?.thamSoJson || {};
  const config = lesson?.moPhong?.cauHinhJson || {};
  const selectedType = lesson?.moPhong?.loaiMoPhong || '';
  const displayMode = String(config.displayMode || 'simulation');
  const selectedPreset = findSimulationPreset(selectedType);
  const externalResourcesText = stringifyExternalResources(config.externalResources || []);
  return (
    <div className="stack">
      <div className="grid-2">
        <div>
          <label className="label">Mô tả bài học</label>
          <textarea className="textarea" value={lesson.moTa || ''} onChange={(e) => onChange({ ...lesson, moTa: e.target.value })} />
        </div>
        <div className="stack">
          <div>
            <label className="label">Simulation type library</label>
            <select className="select" value={selectedType} onChange={(e) => {
              const nextType = e.target.value;
              const preset = findSimulationPreset(nextType);
              onChange({ ...lesson, coMoPhong: true, moPhong: { ...(lesson.moPhong || {}), loaiMoPhong: nextType, thamSoJson: preset?.defaultParams || {}, cauHinhJson: { ...config, topic: lesson.chuDeThi || config.topic || 'Tổng hợp', renderer: 'kntech-threejs-full3d', sceneVariant: lesson.slug || lesson.id, allowExternalResources: true } } });
            }}>
              <option value="">Chọn simulation type</option>
              {simulationLibrary.map((item) => <option key={item.type} value={item.type}>{repairVietnameseText(item.group)} · {repairVietnameseText(item.label)}</option>)}
            </select>
            {selectedPreset && <div className="note-box">{repairVietnameseText(selectedPreset.summary)}</div>}
          </div>
          <div className="row-between wrap-mobile">
            <label><input type="checkbox" checked readOnly disabled /> Bắt buộc có mô phỏng riêng cho bài này</label>
            <label><input type="checkbox" checked={lesson.coAI} onChange={(e) => onChange({ ...lesson, coAI: e.target.checked })} /> Bật AI</label>
          </div>
          <div>
            <label className="label">Chủ đề thi / tag renderer</label>
            <input className="input" value={String(config.topic || lesson.chuDeThi || '')} onChange={(e) => onChange({ ...lesson, chuDeThi: e.target.value, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, topic: e.target.value, renderer: 'kntech-threejs-full3d', allowExternalResources: true } } })} />
          </div>
          <div className="grid-2 compact-filter-grid">
            <div>
              <label className="label">Chế độ hiển thị</label>
              <select className="select" value={displayMode} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, displayMode: e.target.value } } })}>
                <option value="simulation">Mô phỏng tương tác</option>
                <option value="image">Ảnh / model tham chiếu</option>
              </select>
            </div>
            <div>
              <label className="label">Renderer</label>
              <input className="input" value={String(config.renderer || 'kntech-threejs-full3d')} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, renderer: e.target.value, allowExternalResources: true } } })} />
            </div>
          </div>
          <div className="stack">
            <label className="label">Image / model URL</label>
            <input className="input" value={String(config.imageUrl || '')} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, imageUrl: e.target.value, allowExternalResources: true } } })} placeholder="https://... hoac /uploads/..." />
            <label className="button button-secondary upload-inline-button">
              Upload ảnh minh họa
              <input type="file" accept="image/*" hidden onChange={async (event) => {
                const file = event.target.files?.[0];
                const url = await onUploadImage(file);
                if (url) onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, displayMode: 'image', imageUrl: url, allowExternalResources: true } } });
                event.currentTarget.value = '';
              }} />
            </label>
            <label className="label">External resources (mỗi dòng: Tiêu đề|URL|type|provider)</label>
            <textarea className="textarea markdown-editor" value={externalResourcesText} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, allowExternalResources: true, externalResources: parseExternalResources(e.target.value) } } })} placeholder="Video giao thoa|https://...|video|youtube" />
            <div className="muted">Cho phép gắn ALL RESOURCES: video, PDF, bài báo, mô hình, web mô phỏng, slide, ảnh hoặc link học liệu mở. Backend sẽ lưu trong lesson config.</div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card section-card">
          <h4>Tham số mô phỏng</h4>
          <div className="table-wrap">
            <table className="table compact-table">
              <thead><tr><th>Tham số</th><th>Giá trị</th></tr></thead>
              <tbody>
                {Object.keys(params).length ? Object.entries(params).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td><input className="input" value={String(value)} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), thamSoJson: { ...params, [key]: normalizeSettingValue(e.target.value) } } })} /></td>
                  </tr>
                )) : <tr><td colSpan={2}>KNTech chưa có preset tham số cho bài này.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card section-card">
          <h4>Config renderer</h4>
          <div className="table-wrap">
            <table className="table compact-table">
              <thead><tr><th>Config</th><th>Giá trị</th></tr></thead>
              <tbody>
                {Object.entries(config).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td><input className="input" value={String(value)} onChange={(e) => onChange({ ...lesson, moPhong: { ...(lesson.moPhong || {}), cauHinhJson: { ...config, [key]: normalizeSettingValue(e.target.value) } } })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


function LessonContentEditor({ lesson, onChange }: { lesson: any; onChange: (next: any) => void }) {
  const sections = lesson?.phanKienThuc?.length ? lesson.phanKienThuc : createDefaultSections();
  return (
    <div className="stack">
      <div className="row-between wrap-mobile">
        <h4>Nội dung bài giảng</h4>
        <button className="button button-secondary" type="button" onClick={() => onChange({ ...lesson, phanKienThuc: [...sections, { tieuDe: 'Mục mới', mucDo: 'DE', noiDungMarkdown: `## Tiêu đề
- Nội dung`, thuTu: sections.length + 1 }] })}>Thêm mục nội dung</button>
      </div>
      {sections.map((section: any, idx: number) => (
        <div key={section.id || idx} className="card section-card stack">
          <div className="grid-3 compact-filter-grid">
                  <input className="input" value={section.tieuDe || ''} onChange={(e) => onChange({ ...lesson, phanKienThuc: sections.map((item: any, i: number) => i === idx ? { ...item, tieuDe: e.target.value } : item) })} placeholder="Tiêu đề mục" />
            <select className="select" value={section.mucDo || 'DE'} onChange={(e) => onChange({ ...lesson, phanKienThuc: sections.map((item: any, i: number) => i === idx ? { ...item, mucDo: e.target.value } : item) })}>
              <option value="DE">DE</option><option value="TRUNG_BINH">TRUNG_BINH</option><option value="KHO">KHO</option>
            </select>
                  <input className="input" type="number" value={section.thuTu || idx + 1} onChange={(e) => onChange({ ...lesson, phanKienThuc: sections.map((item: any, i: number) => i === idx ? { ...item, thuTu: Number(e.target.value) } : item) })} placeholder="Thứ tự" />
          </div>
          <textarea className="textarea markdown-editor" value={section.noiDungMarkdown || ''} onChange={(e) => onChange({ ...lesson, phanKienThuc: sections.map((item: any, i: number) => i === idx ? { ...item, noiDungMarkdown: e.target.value } : item) })} />
          <div className="muted">Hỗ trợ markdown cơ bản và công thức dạng \(...\) hoặc \[...\]</div>
        </div>
      ))}
    </div>
  );
}

export function AdminPage({ cmsMode = false }: { cmsMode?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('tong-quan');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [pageForm, setPageForm] = useState({ id: '', tieuDe: '', slug: '', moTa: '', noiDungMarkdown: '', trangThai: 'NHAP' as 'NHAP' | 'XUAT_BAN' });
  const [uploading, setUploading] = useState(false);
  const [lessonSearch, setLessonSearch] = useState('');
  const [lessonGroup, setLessonGroup] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [newUser, setNewUser] = useState({ email: '', tenHienThi: '', hoTen: '', vaiTro: 'HOC_SINH', trangThai: 'HOAT_DONG', lopHoc: '', matKhauMoi: '' });

  async function load() {
    const cms = await api.cmsData();
    const admin = await api.adminTongQuan().catch(() => null);
    setData({ ...cms, admin });
    if (!selectedLessonId && cms.lessons?.[0]?.id) setSelectedLessonId(cms.lessons[0].id);
    if (!selectedUserId && cms.users?.[0]?.id) setSelectedUserId(cms.users[0].id);
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const groupedSettings = useMemo(() => (data?.settings || []).reduce((acc: Record<string, Setting[]>, item: Setting) => {
    acc[item.nhom] = acc[item.nhom] || [];
    acc[item.nhom].push(item);
    return acc;
  }, {}), [data]);
  const filteredLessons = useMemo(() => (data?.lessons || []).filter((lesson: any) => {
    const matchesSearch = !lessonSearch.trim() || `${lesson.ten} ${lesson.moTa || ''} ${lesson.chuDeThi || ''}`.toLowerCase().includes(lessonSearch.toLowerCase());
    const matchesGroup = lessonGroup === 'all' || lesson.chuDeThi === lessonGroup;
    return matchesSearch && matchesGroup;
  }), [data, lessonSearch, lessonGroup]);
  const selectedLesson = useMemo(() => data?.lessons?.find((item: any) => item.id === selectedLessonId), [data, selectedLessonId]);
  const gradeTrend = useMemo(() => Object.entries(data?.analytics?.lessonByGrade || {}).map(([label, value]) => ({ label, value: Number(value) })), [data]);
  const aiTrend = useMemo(() => Object.entries(data?.analytics?.aiByProvider || {}).map(([label, value]) => ({ label: label.toUpperCase(), value: Number(value) })), [data]);
  const logTrend = useMemo(() => Object.entries(data?.analytics?.logsByGroup || {}).map(([label, value]) => ({ label, value: Number(value) })), [data]);
  const filteredUsers = useMemo(() => (data?.users || []).filter((user: any) => !userSearch.trim() || `${user.email} ${user.tenHienThi || ''} ${user.hoTen || ''} ${user.vaiTro} ${user.lopHoc || ''}`.toLowerCase().includes(userSearch.toLowerCase())), [data, userSearch]);
  const selectedUser = useMemo(() => data?.users?.find((item: any) => item.id === selectedUserId), [data, selectedUserId]);

  async function saveSettings() {
    try {
      await api.updateCmsSettings({ items: data.settings.map((s: Setting) => ({ ma: s.ma, giaTri: normalizeSettingValue(s.giaTri) })) });
      setMessage('KNTech đã lưu cấu hình thành công.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function saveLesson() {
    if (!selectedLesson) return;
    try {
      await api.updateCmsLesson({
        id: selectedLesson.id,
        moTa: selectedLesson.moTa,
        loaiBai: selectedLesson.loaiBai,
        coMoPhong: selectedLesson.coMoPhong,
        coAI: selectedLesson.coAI,
        chuDeThi: selectedLesson.chuDeThi,
        simulationType: selectedLesson.moPhong?.loaiMoPhong,
        simulationParams: selectedLesson.moPhong?.thamSoJson || {},
        simulationConfig: selectedLesson.moPhong?.cauHinhJson || {}
      });
      await api.updateCmsLessonSections({
        lessonId: selectedLesson.id,
        sections: (selectedLesson.phanKienThuc?.length ? selectedLesson.phanKienThuc : createDefaultSections()).map((item: any, idx: number) => ({
          id: item.id,
          tieuDe: item.tieuDe,
          mucDo: item.mucDo || 'DE',
          noiDungMarkdown: item.noiDungMarkdown,
          thuTu: Number(item.thuTu || idx + 1)
        }))
      });
      setMessage(`KNTech đã lưu bài học ${selectedLesson.ten}.`);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function savePage() {
    try {
      await api.saveCmsPage(pageForm);
      setPageForm({ id: '', tieuDe: '', slug: '', moTa: '', noiDungMarkdown: '', trangThai: 'NHAP' });
      setMessage('KNTech đã lưu trang CMS.');
      await load();
    } catch (e: any) { setError(e.message); }
  }


  async function saveUser() {
    if (!selectedUser) return;
    try {
      await api.adminUpdateUser(selectedUser.id, {
        email: selectedUser.email,
        tenHienThi: selectedUser.tenHienThi || '',
        hoTen: selectedUser.hoTen || '',
        vaiTro: selectedUser.vaiTro,
        trangThai: selectedUser.trangThai,
        lopHoc: selectedUser.lopHoc || '',
        matKhauMoi: selectedUser.matKhauMoi || ''
      });
      setMessage(`KNTech đã cập nhật người dùng ${selectedUser.email}.`);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function createUser() {
    try {
      await api.adminCreateUser(newUser);
      setMessage(`KNTech đã tạo người dùng ${newUser.email}.`);
      setNewUser({ email: '', tenHienThi: '', hoTen: '', vaiTro: 'HOC_SINH', trangThai: 'HOAT_DONG', lopHoc: '', matKhauMoi: '' });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function deleteUser() {
    if (!selectedUser) return;
    if (!window.confirm(`Xóa người dùng ${selectedUser.email}?`)) return;
    try {
      await api.adminDeleteUser(selectedUser.id);
      setMessage(`KNTech đã xóa người dùng ${selectedUser.email}.`);
      setSelectedUserId('');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function uploadMedia(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const response = await api.uploadMedia(file);
      setMessage(`Đã upload ${file.name} vào thư viện KNTech.`);
      await load();
      return response?.url as string | undefined;
    } catch (e: any) { setError(e.message); return undefined; }
    finally { setUploading(false); }
  }

  async function uploadMediaForLesson(file?: File | null) {
    return uploadMedia(file);
  }

  if (!data) return <div className="card">KNTech đang tải CMS...</div>;

  return (
    <div className="stack">
      <div className={cmsMode ? 'card hero-panel cms-hero dashboard-gradient-cms' : 'card hero-panel admin-hero dashboard-gradient-admin'}>
        <div className="brand-kicker">KNTech {cmsMode ? 'CMS Root' : 'Admin Console'}</div>
        <h1 className="page-title">{cmsMode ? 'System Command Center' : 'Vận hành nội dung và học vụ'}</h1>
        <p>{cmsMode ? 'CMS Root quản lý cấu hình, media, API monitor, system monitor, AI analytics và lesson builder chuyên sâu.' : 'Admin tập trung vào thống kê, bài học, người dùng và chất lượng vận hành do CMS Root thiết lập.'}</p>
      </div>

      {message && <div className="response-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="grid-4">
        <KPI label="KNTech Users" value={data.stats.users} />
        <KPI label="Lessons" value={data.stats.lessons} />
        <KPI label="AI Calls" value={data.stats.aiLogs} />
        <KPI label="API Hits" value={data.apiMetrics?.totalHits ?? 0} />
      </div>
      <div className="badge-row">
        <span className="badge badge-variant-0">Brand: KNTech</span>
        <span className="badge badge-variant-1">Mode: {cmsMode ? 'CMS Root' : 'Admin'}</span>
        <span className="badge badge-variant-2">Logs: {data.stats.systemLogs}</span>
        <span className="badge badge-variant-3">Errors: {data.apiMetrics?.totalErrors ?? 0}</span>
      </div>

      <div className="tab-row">
        {tabs.map((name) => <button key={name} className={tab === name ? 'tab active' : 'tab'} onClick={() => setTab(name)}>{name.replace('-', ' ')}</button>)}
      </div>

      {tab === 'tong-quan' && (
        <div className="stack">
          <div className="grid-2">
            <div className="card stack">
              <div className="row-between"><h3>Lesson coverage theo lớp</h3><span className="badge">KNTech Analytics</span></div>
              <AreaTrend items={gradeTrend} />
            </div>
            <div className="card stack">
              <div className="row-between"><h3>AI providers</h3><span className="badge badge-soft">Live usage</span></div>
              <AreaTrend items={aiTrend.length ? aiTrend : [{ label: 'LOCAL', value: 0 }]} />
            </div>
          </div>
          <div className="grid-3">
            <RingMetric value={Number(data.stats.aiLogs)} total={Math.max(Number(data.apiMetrics?.totalHits || 0), Number(data.stats.aiLogs || 1))} label="AI / API share" />
            <RingMetric value={Number(data.apiMetrics?.totalErrors || 0)} total={Math.max(Number(data.apiMetrics?.totalHits || 1), 1)} label="API error rate" />
            <RingMetric value={Number(data.media?.length || 0)} total={Math.max(Number(data.stats.lessons || 1), 1)} label="Media coverage" />
          </div>
          <div className="grid-2">
            <div className="card stack">
              <h3>Database runtime</h3>
              <div className="table-wrap">
                <table className="table"><tbody>
                  <tr><td>Driver</td><td>MySQL</td></tr>
                  <tr><td>Host</td><td>{data.dbInfo.host}</td></tr>
                  <tr><td>Port</td><td>{data.dbInfo.port}</td></tr>
                  <tr><td>Database</td><td>{data.dbInfo.database}</td></tr>
                  <tr><td>User</td><td>{data.dbInfo.user}</td></tr>
                </tbody></table>
              </div>
            </div>
            <div className="card stack">
              <h3>System monitor</h3>
              <div className="table-wrap">
                <table className="table"><tbody>
                  <tr><td>Node</td><td>{data.runtime.node}</td></tr>
                  <tr><td>Platform</td><td>{data.runtime.platform}</td></tr>
                  <tr><td>Uptime</td><td>{data.runtime.uptimeHum}</td></tr>
                  <tr><td>RSS Memory</td><td>{data.runtime.memory.rssMb} MB</td></tr>
                  <tr><td>Heap Used</td><td>{data.runtime.memory.heapUsedMb} MB</td></tr>
                  <tr><td>CPU cores</td><td>{data.runtime.cpuCount}</td></tr>
                </tbody></table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'cau-hinh' && (
        <div className="card stack">
          <div className="row-between"><h3>KNTech system settings</h3><button className="button" onClick={saveSettings}>Lưu cấu hình</button></div>
          {Object.entries(groupedSettings).map(([group, items]: any) => (
            <div key={group} className="stack">
              <h4>{group}</h4>
              <div className="settings-grid">
                {items.map((item: Setting) => (
                  <div key={item.ma} className="setting-card">
                    <label className="label">{item.ten}</label>
                    <input className="input" value={String(item.giaTri ?? '')} onChange={(e) => setData((prev: any) => ({ ...prev, settings: prev.settings.map((s: Setting) => s.ma === item.ma ? { ...s, giaTri: e.target.value } : s) }))} />
                    <div className="muted">{item.ma} A· {item.moTa}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bai-hoc' && (
        <div className="grid-2">
          <div className="card stack">
            <div className="row-between wrap-mobile"><h3>Lesson builder</h3><span className="badge">KNTech Simulation Library</span></div>
            <div className="grid-2 compact-filter-grid">
              <div><label className="label">Tìm bài học</label><input className="input" placeholder="Tìm bài học..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} /></div>
              <div><label className="label">Lọc theo chủ đề</label><select className="select" value={lessonGroup} onChange={(e) => setLessonGroup(e.target.value)}><option value="all">Tất cả chủ đề</option>{Array.from(new Set((data.lessons || []).map((item: any) => item.chuDeThi).filter(Boolean))).map((item: any) => <option key={item} value={item}>{item}</option>)}</select></div>
            </div>
            <div className="table-wrap">
              <table className="table compact-table">
                <thead><tr><th>Bài</th><th>Chủ đề</th><th>Tag lớp</th></tr></thead>
                <tbody>
                  {filteredLessons.map((lesson: any) => (
                    <tr key={lesson.id} className={selectedLessonId === lesson.id ? 'row-selected' : ''} onClick={() => setSelectedLessonId(lesson.id)}>
                      <td>{lesson.ten}</td>
                      <td>{lesson.moPhong?.cauHinhJson?.topic || lesson.chuong.ten}</td>
                      <td>Lớp {lesson.chuong.lop}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="stack">
            <div className="card stack">
              <div className="row-between"><h3>{selectedLesson?.ten || 'Chọn một bài học'}</h3><button className="button" onClick={saveLesson}>Lưu lesson</button></div>
              {selectedLesson ? <div className="stack"><SimulationEditor lesson={selectedLesson} onChange={(next) => setData((prev: any) => ({ ...prev, lessons: prev.lessons.map((item: any) => item.id === next.id ? next : item) }))} onUploadImage={uploadMediaForLesson} /><LessonContentEditor lesson={selectedLesson} onChange={(next) => setData((prev: any) => ({ ...prev, lessons: prev.lessons.map((item: any) => item.id === next.id ? next : item) }))} /></div> : <div className="note-box">Chọn một bài trong danh sách trái để biên tập.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="grid-2">
          <div className="card stack">
            <div className="row-between"><h3>Media manager</h3><span className="badge">KNTech Library</span></div>
            <input type="file" className="input" onChange={(e) => uploadMedia(e.target.files?.[0])} disabled={uploading} />
            <div className="muted">Upload ảnh, video ngắn, mô hình hoặc tài nguyên hỗ trợ cho lesson builder.</div>
          </div>
          <div className="card stack">
            <h3>Tệp gần đây</h3>
            <div className="table-wrap">
              <table className="table compact-table">
                <thead><tr><th>Tên tệp</th><th>Size</th><th>Cập nhật</th></tr></thead>
                <tbody>
                  {data.media?.map((file: any) => <tr key={file.name}><td><a href={file.url} target="_blank" rel="noreferrer">{file.name}</a></td><td>{file.sizeMb} MB</td><td>{new Date(file.updatedAt).toLocaleString()}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'monitor' && (
        <div className="stack">
          <div className="card stack">
            <div className="row-between"><h3>API monitor</h3><span className="badge">{data.apiMetrics.totalHits} hits</span></div>
            <AreaTrend items={logTrend.length ? logTrend : [{ label: 'api', value: 0 }]} />
            <div className="table-wrap">
              <table className="table compact-table">
                <thead><tr><th>Route</th><th>Hits</th><th>Avg ms</th><th>Errors</th><th>Status</th></tr></thead>
                <tbody>
                  {data.apiMetrics.routes.map((route: any) => <tr key={`${route.method}-${route.path}`}><td>{route.method} {route.path}</td><td>{route.hits}</td><td>{route.avgMs}</td><td>{route.errors}</td><td>{route.lastStatus}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card stack">
            <h3>System logs</h3>
            <div className="table-wrap"><table className="table compact-table"><thead><tr><th>Thời gian</th><th>Mức</th><th>Nhóm</th><th>Hành động</th><th>Đối tượng</th><th>Người dùng</th></tr></thead><tbody>
              {data.logs.map((log: any) => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString()}</td><td><span className={levelClass(log.muc)}>{log.muc}</span></td><td>{log.nhom}</td><td>{log.hanhDong}</td><td>{log.doiTuong || '-'}</td><td>{log.nguoiDung?.email || '-'}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="card stack">
          <h3>AI call logs</h3>
          <div className="table-wrap"><table className="table"><thead><tr><th>Provider</th><th>Tác vụ</th><th>Prompt</th><th>Kết quả</th><th>Thời gian</th></tr></thead><tbody>
            {data.aiLogs.map((log: any) => <tr key={log.id}><td><span className={String(log.nhaCungCap).toLowerCase() === 'local' ? 'status-pill warning' : 'status-pill success'}>{String(log.nhaCungCap).toUpperCase()}</span></td><td>{log.loaiTacVu}</td><td>{log.promptRutGon}</td><td>{log.ketQuaRutGon}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}
          </tbody></table></div>
        </div>
      )}

      {tab === 'nguoi-dung' && (
        <div className="grid-2">
          <div className="stack">
            <div className="card stack">
              <div className="row-between wrap-mobile"><h3>Người dùng KNTech</h3><span className="badge">Full edit</span></div>
              <div><label className="label">Tìm người dùng</label><input className="input" placeholder="Tìm email, tên, vai trò, lớp..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} /></div>
              <div className="table-wrap"><table className="table compact-table"><thead><tr><th>Email</th><th>Tên</th><th>Vai trò</th><th>Trạng thái</th><th>Lớp</th></tr></thead><tbody>
                {filteredUsers.map((user: any) => <tr key={user.id} className={selectedUserId === user.id ? 'row-selected' : ''} onClick={() => setSelectedUserId(user.id)}><td>{user.email}</td><td>{user.tenHienThi || user.hoTen}</td><td>{user.vaiTro}</td><td>{user.trangThai}</td><td>{user.lopHoc || '-'}</td></tr>)}
              </tbody></table></div>
            </div>
            <div className="card stack">
              <div className="row-between wrap-mobile"><h3>Tạo người dùng mới</h3><button className="button" onClick={createUser}>Tạo user</button></div>
              <div className="grid-2 compact-filter-grid">
                <div><label className="label">Email</label><input className="input" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} /></div>
                <div><label className="label">Tên hiển thị</label><input className="input" placeholder="Tên hiển thị" value={newUser.tenHienThi} onChange={(e) => setNewUser((prev) => ({ ...prev, tenHienThi: e.target.value }))} /></div>
                <div><label className="label">Họ tên</label><input className="input" placeholder="Họ tên" value={newUser.hoTen} onChange={(e) => setNewUser((prev) => ({ ...prev, hoTen: e.target.value }))} /></div>
                <div><label className="label">Lớp học</label><input className="input" placeholder="Lớp học" value={newUser.lopHoc} onChange={(e) => setNewUser((prev) => ({ ...prev, lopHoc: e.target.value }))} /></div>
                <div><label className="label">Vai trò</label><select className="select" value={newUser.vaiTro} onChange={(e) => setNewUser((prev) => ({ ...prev, vaiTro: e.target.value }))}><option value="HOC_SINH">HOC_SINH</option><option value="GIAO_VIEN">GIAO_VIEN</option><option value="QUAN_TRI_VIEN">QUAN_TRI_VIEN</option><option value="CMS_ROOT">CMS_ROOT</option></select></div>
                <div><label className="label">Trạng thái</label><select className="select" value={newUser.trangThai} onChange={(e) => setNewUser((prev) => ({ ...prev, trangThai: e.target.value }))}><option value="HOAT_DONG">HOAT_DONG</option><option value="KHOA">KHOA</option></select></div>
              </div>
              <div><label className="label">Mật khẩu khởi tạo</label><input className="input" type="password" placeholder="Mật khẩu khởi tạo" value={newUser.matKhauMoi} onChange={(e) => setNewUser((prev) => ({ ...prev, matKhauMoi: e.target.value }))} /></div>
            </div>
          </div>
          <div className="card stack">
            <div className="row-between wrap-mobile"><h3>{selectedUser?.email || 'Chọn người dùng'}</h3><div className="badge-row"><button className="button button-secondary" onClick={saveUser} disabled={!selectedUser}>Lưu user</button><button className="button" onClick={deleteUser} disabled={!selectedUser}>Xóa user</button></div></div>
            {selectedUser ? (
              <div className="stack">
                <div className="grid-2 compact-filter-grid">
                  <div><label className="label">Email</label><input className="input" value={selectedUser.email || ''} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, email: e.target.value } : u) }))} /></div>
                  <div><label className="label">Tên hiển thị</label><input className="input" value={selectedUser.tenHienThi || ''} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, tenHienThi: e.target.value } : u) }))} /></div>
                  <div><label className="label">Họ tên</label><input className="input" value={selectedUser.hoTen || ''} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, hoTen: e.target.value } : u) }))} /></div>
                  <div><label className="label">Lớp học</label><input className="input" value={selectedUser.lopHoc || ''} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, lopHoc: e.target.value } : u) }))} /></div>
                  <div><label className="label">Vai trò</label><select className="select" value={selectedUser.vaiTro} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, vaiTro: e.target.value } : u) }))}><option value="HOC_SINH">HOC_SINH</option><option value="GIAO_VIEN">GIAO_VIEN</option><option value="QUAN_TRI_VIEN">QUAN_TRI_VIEN</option><option value="CMS_ROOT">CMS_ROOT</option></select></div>
                  <div><label className="label">Trạng thái</label><select className="select" value={selectedUser.trangThai} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, trangThai: e.target.value } : u) }))}><option value="HOAT_DONG">HOAT_DONG</option><option value="KHOA">KHOA</option></select></div>
                </div>
                <div className="grid-2 compact-filter-grid">
                  <div><label className="label">Ngày tạo</label><input className="input" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : ''} disabled /></div>
                  <div><label className="label">Đặt mật khẩu mới</label><input className="input" type="password" placeholder="Để trống nếu không đổi" value={selectedUser.matKhauMoi || ''} onChange={(e) => setData((prev: any) => ({ ...prev, users: prev.users.map((u: any) => u.id === selectedUser.id ? { ...u, matKhauMoi: e.target.value } : u) }))} /></div>
                </div>
                <div className="note-box">CMS Root / Admin có thể tạo mới, cập nhật email, tên, vai trò, trạng thái, lớp học và reset mật khẩu ngay tại đây.</div>
              </div>
            ) : <div className="note-box">Chọn người dùng từ bảng bên trái để biên tập đầy đủ.</div>}
          </div>
        </div>
      )}

      {tab === 'trang' && (
        <div className="grid-2">
          <div className="card stack">
            <h3>Trang nội dung</h3>
            <div className="table-wrap"><table className="table compact-table"><thead><tr><th>Tiêu đề</th><th>Slug</th><th>Trạng thái</th></tr></thead><tbody>
              {data.pages.map((page: any) => <tr key={page.id} onClick={() => setPageForm(page)}><td>{page.tieuDe}</td><td>{page.slug}</td><td>{page.trangThai}</td></tr>)}
            </tbody></table></div>
          </div>
          <div className="card stack">
            <h3>Trình biên tập trang</h3>
            <input className="input" placeholder="Tiêu đề" value={pageForm.tieuDe} onChange={(e) => setPageForm((prev) => ({ ...prev, tieuDe: e.target.value }))} />
            <input className="input" placeholder="Slug" value={pageForm.slug} onChange={(e) => setPageForm((prev) => ({ ...prev, slug: e.target.value }))} />
            <input className="input" placeholder="Mô tả" value={pageForm.moTa} onChange={(e) => setPageForm((prev) => ({ ...prev, moTa: e.target.value }))} />
            <textarea className="textarea" placeholder="Nội dung markdown" value={pageForm.noiDungMarkdown} onChange={(e) => setPageForm((prev) => ({ ...prev, noiDungMarkdown: e.target.value }))} />
            <select className="select" value={pageForm.trangThai} onChange={(e) => setPageForm((prev) => ({ ...prev, trangThai: e.target.value as any }))}><option value="NHAP">Nháp</option><option value="XUAT_BAN">Xuất bản</option></select>
            <button className="button" onClick={savePage}>Lưu trang</button>
          </div>
        </div>
      )}
    </div>
  );
}


