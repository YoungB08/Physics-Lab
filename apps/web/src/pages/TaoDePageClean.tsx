import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingButton } from '../components/LoadingButton';
import { resolveWebAppUrl } from '../config/webAppConfig';

function defaultOptionKey(index: number) {
  return String.fromCharCode(65 + index);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN');
}

function cleanText(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

type QuestionDraft = {
  id: string;
  noiDung: string;
  mucDo: string;
  loai: string;
  options: { key: string; text: string }[];
  dapAnDungJson: string[];
  giaiThich: string;
};

type AttemptLog = {
  id: string;
  hocSinhTen?: string | null;
  hocSinhEmail?: string | null;
  diem: number;
  status: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  tabSwitchCount: number;
  warningCount: number;
  forcedStopReason?: string | null;
  teacherFlags?: { type: string; message: string; at: string }[];
  integrityEventCount: number;
  integrityEvents?: { type: string; detail?: string | null; at?: string | null }[];
  answersCount: number;
  totalQuestions: number;
};

type ExamDraft = {
  id: string;
  ten: string;
  lop: number;
  thoiGianPhut: number;
  qrToken: string;
  status: string;
  examAccessUrl: string;
  canShowQr: boolean;
  questions: QuestionDraft[];
  attempts: AttemptLog[];
  antiCheat: {
    enabled: boolean;
    maxTabSwitch: number;
    daoCauHoi: boolean;
    fullScreenRequired: boolean;
    strictAntiCheat: boolean;
    hideResultDetails: boolean;
  };
};

function statusColor(status: string) {
  if (status === 'STARTED' || status === 'SUBMITTED') return 'success';
  if (status === 'STOPPED' || status === 'LOCKED' || status === 'FORCE_STOPPED') return 'danger';
  if (status === 'CONFIRMED') return 'warning';
  return '';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Nháp',
    CONFIRMED: 'Đã duyệt',
    STARTED: 'Đang thi',
    STOPPED: 'Đã dừng',
    LOCKED: 'Đã khóa',
    SUBMITTED: 'Đã nộp',
    FORCE_STOPPED: 'Khóa do vi phạm'
  };
  return map[status] || status;
}

function mapToDraft(raw: any): ExamDraft {
  return {
    id: raw.id,
    ten: cleanText(raw.ten, 'Đề thi'),
    lop: Number(raw.lop || 12),
    thoiGianPhut: Number(raw.thoiGianPhut || 15),
    qrToken: cleanText(raw.qrToken),
    status: cleanText(raw.status, 'DRAFT'),
    examAccessUrl: cleanText(raw.examAccessUrl),
    canShowQr: Boolean(raw.canShowQr),
    attempts: Array.isArray(raw.attempts)
      ? raw.attempts.map((attempt: any) => ({
          ...attempt,
          hocSinhTen: cleanText(attempt?.hocSinhTen),
          hocSinhEmail: cleanText(attempt?.hocSinhEmail),
          forcedStopReason: cleanText(attempt?.forcedStopReason),
          teacherFlags: Array.isArray(attempt?.teacherFlags)
            ? attempt.teacherFlags.map((flag: any) => ({
                type: cleanText(flag?.type),
                message: cleanText(flag?.message),
                at: cleanText(flag?.at)
              })).filter((flag: any) => flag.message)
            : [],
          integrityEvents: Array.isArray(attempt?.integrityEvents)
            ? attempt.integrityEvents.map((event: any) => ({
                ...event,
                type: cleanText(event?.type),
                detail: cleanText(event?.detail),
                at: cleanText(event?.at)
              }))
            : []
        }))
      : [],
    antiCheat: {
      enabled: Boolean(raw?.antiCheat?.enabled ?? true),
      maxTabSwitch: Number(raw?.antiCheat?.maxTabSwitch ?? 3),
      daoCauHoi: Boolean(raw?.antiCheat?.daoCauHoi ?? true),
      fullScreenRequired: Boolean(raw?.antiCheat?.fullScreenRequired ?? true),
      strictAntiCheat: Boolean(raw?.antiCheat?.strictAntiCheat ?? true),
      hideResultDetails: Boolean(raw?.antiCheat?.hideResultDetails ?? true)
    },
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((q: any, index: number) => ({
          id: cleanText(q?.id, `q-${index}`),
          noiDung: cleanText(q?.noiDung),
          mucDo: cleanText(q?.mucDo, 'TRUNG_BINH'),
          loai: cleanText(q?.loai, 'MOT_DAP_AN'),
          options: Array.isArray(q?.options)
            ? q.options.map((opt: any, optIndex: number) => ({
                key: cleanText(opt?.key, defaultOptionKey(optIndex)),
                text: cleanText(opt?.text)
              }))
            : [],
          dapAnDungJson: Array.isArray(q?.dapAnDungJson || q?.correctAnswers)
            ? (q.dapAnDungJson || q.correctAnswers).map((item: any) => cleanText(item)).filter(Boolean)
            : [],
          giaiThich: cleanText(q?.giaiThich || q?.explanation)
        }))
      : []
  };
}

export function TaoDePageClean() {
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [form, setForm] = useState({
    ten: 'Kiểm tra Vật lý',
    lop: 12,
    thoiGianPhut: 15,
    soLuongCau: 5,
    mucDo: 'TRUNG_BINH',
    baiHocSlug: '',
    antiCheatEnabled: true,
    daoCauHoi: true,
    fullScreenRequired: true,
    strictAntiCheat: true,
    hideResultDetails: true,
    yeuCauThem: '',
    uuTienLyThuyet: true,
    uuTienVanDung: true,
    uuTienVanDungCao: true
  });
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | 'start' | 'stop' | 'lock' | 'delete'>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [step, setStep] = useState<'form' | 'edit' | 'running'>('form');

  const lessons = curriculum.filter((item) => Number(item?.lop) === form.lop).flatMap((item) => item?.baiHoc || []);

  useEffect(() => {
    api.getChuongTrinh().then(setCurriculum).catch(() => undefined);
    refreshExams().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.baiHocSlug && lessons[0]?.slug) {
      setForm((prev) => ({ ...prev, baiHocSlug: lessons[0].slug }));
    }
  }, [lessons.length]);

  async function refreshExams(focusId?: string) {
    const list = await api.examList().catch(() => []);
    const normalized = Array.isArray(list)
      ? list.map((item: any) => ({
          ...item,
          ten: cleanText(item?.ten, 'Đề thi'),
          questions: Array.isArray(item?.questions)
            ? item.questions.map((q: any) => ({
                ...q,
                noiDung: cleanText(q?.noiDung),
                giaiThich: cleanText(q?.giaiThich),
                explanation: cleanText(q?.explanation),
                options: Array.isArray(q?.options)
                  ? q.options.map((opt: any, index: number) => ({
                      key: cleanText(opt?.key, defaultOptionKey(index)),
                      text: cleanText(opt?.text)
                    }))
                  : []
              }))
            : []
        }))
      : [];
    setExams(normalized);

    if (focusId) {
      const detail = await api.examDetail(focusId).catch(() => null);
      if (detail) setDraft(mapToDraft(detail));
    }
  }

  async function handleCreate() {
    setError('');
    setCreating(true);
    try {
      const res = await api.taoDe({
        ...form,
        ten: cleanText(form.ten, 'Kiểm tra Vật lý'),
        antiCheatEnabled: form.antiCheatEnabled,
        maxTabSwitch: form.antiCheatEnabled ? 3 : undefined,
        fullScreenRequired: form.antiCheatEnabled ? form.fullScreenRequired : false,
        strictAntiCheat: form.antiCheatEnabled ? form.strictAntiCheat : false,
        cheDo: 'AI',
        providerAI: 'gpt'
      });
      const nextDraft = mapToDraft(res?.de || res);
      setDraft(nextDraft);
      setStep('edit');
      await refreshExams(nextDraft.id);
    } catch (e: any) {
      setError(cleanText(e?.message, 'Không tạo được đề thi.'));
    } finally {
      setCreating(false);
    }
  }

  async function saveExamChanges(confirmAfterSave = false) {
    if (!draft) return;
    setError('');
    if (confirmAfterSave) setConfirming(true);
    else setSavingDraft(true);
    try {
      await api.updateExam(draft.id, {
        ten: draft.ten,
        thoiGianPhut: draft.thoiGianPhut,
        antiCheatEnabled: draft.antiCheat.enabled,
        maxTabSwitch: draft.antiCheat.enabled ? draft.antiCheat.maxTabSwitch : undefined,
        daoCauHoi: draft.antiCheat.daoCauHoi,
        fullScreenRequired: draft.antiCheat.enabled ? draft.antiCheat.fullScreenRequired : false,
        strictAntiCheat: draft.antiCheat.enabled ? draft.antiCheat.strictAntiCheat : false,
        hideResultDetails: draft.antiCheat.hideResultDetails,
        questions: draft.questions.map((q) => ({
          id: q.id,
          noiDung: q.noiDung,
          loai: q.loai,
          mucDo: q.mucDo,
          options: q.options,
          correctAnswers: q.dapAnDungJson,
          explanation: q.giaiThich
        }))
      });
      if (confirmAfterSave && draft.status === 'DRAFT') {
        await api.examAction(draft.id, 'confirm');
      }
      const detail = await api.examDetail(draft.id);
      setDraft(mapToDraft(detail));
      setStep(confirmAfterSave && draft.status === 'DRAFT' ? 'running' : (detail.status === 'DRAFT' ? 'edit' : 'running'));
      await refreshExams(draft.id);
    } catch (e: any) {
      setError(cleanText(e?.message, 'Không lưu được đề thi.'));
    } finally {
      setConfirming(false);
      setSavingDraft(false);
    }
  }

  async function handleSaveAndConfirm() {
    await saveExamChanges(true);
  }

  async function handleAction(action: 'start' | 'stop' | 'lock' | 'delete') {
    if (!draft) return;
    setError('');
    setActionLoading(action);
    try {
      await api.examAction(draft.id, action);
      if (action === 'delete') {
        setDraft(null);
        setStep('form');
        await refreshExams();
        return;
      }
      const detail = await api.examDetail(draft.id);
      setDraft(mapToDraft(detail));
      await refreshExams(draft.id);
    } catch (e: any) {
      setError(cleanText(e?.message, 'Không thực hiện được thao tác.'));
    } finally {
      setActionLoading(null);
    }
  }

  function updateQuestion(id: string, patch: Partial<QuestionDraft>) {
    setDraft((prev) => prev ? {
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...patch } : q))
    } : prev);
  }

  function updateOption(questionId: string, optionIndex: number, text: string) {
    setDraft((prev) => prev ? {
      ...prev,
      questions: prev.questions.map((q) => q.id !== questionId ? q : {
        ...q,
        options: q.options.map((opt, index) => index === optionIndex ? { ...opt, text } : opt)
      })
    } : prev);
  }

  async function selectExam(id: string) {
    const detail = await api.examDetail(id).catch(() => null);
    if (!detail) return;
    setDraft(mapToDraft(detail));
    setStep(detail.status === 'DRAFT' ? 'edit' : 'running');
  }

  const canEditExamConfig = Boolean(draft && draft.status !== 'STARTED' && draft.status !== 'LOCKED');

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-admin">
        <h1 className="page-title">KNTech - Tạo đề thi bằng AI</h1>
        <p>AI sinh câu hỏi theo yêu cầu chi tiết của giáo viên, có thể cân bằng lý thuyết, vận dụng và vận dụng cao trước khi mở đề.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="grid-2 lesson-layout">
        <div className="stack">
          {step === 'form' && (
            <div className="card stack">
              <div className="row-between wrap-mobile">
                <h3>Tạo đề mới bằng AI</h3>
                <span className="badge badge-variant-2">AI Mode</span>
              </div>

              <div className="exam-create-row">
                <div className="exam-create-field">
                  <label className="label">Tên đề</label>
                  <input className="input" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Lớp</label>
                  <select className="select" value={form.lop} onChange={(e) => setForm({ ...form, lop: Number(e.target.value) })}>
                    <option value={10}>Lớp 10</option>
                    <option value={11}>Lớp 11</option>
                    <option value={12}>Lớp 12</option>
                  </select>
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Thời gian</label>
                  <input className="input" type="number" min={5} max={180} value={form.thoiGianPhut} onChange={(e) => setForm({ ...form, thoiGianPhut: Number(e.target.value) })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Số câu</label>
                  <input className="input" type="number" min={1} max={50} value={form.soLuongCau} onChange={(e) => setForm({ ...form, soLuongCau: Number(e.target.value) })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Mức độ</label>
                  <select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}>
                    <option value="DE">Dễ</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="KHO">Khó</option>
                  </select>
                </div>
                <div className="exam-create-field">
                  <label className="label">Bài học</label>
                  <select className="select" value={form.baiHocSlug} onChange={(e) => setForm({ ...form, baiHocSlug: e.target.value })}>
                    {lessons.map((lesson: any) => <option key={lesson.slug} value={lesson.slug}>{lesson.ten}</option>)}
                  </select>
                </div>
              </div>

              <div className="exam-create-field">
                <label className="label">Yêu cầu thêm cho AI</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Ví dụ: có 2 câu lý thuyết rõ bản chất, 2 câu bài tập vận dụng có số liệu, 1 câu vận dụng cao nhiều bước; tránh hỏi quá mẹo."
                  value={form.yeuCauThem}
                  onChange={(e) => setForm({ ...form, yeuCauThem: e.target.value })}
                />
              </div>

              <div className="exam-create-row exam-create-row--toggles">
                <label className="toggle-chip"><input type="checkbox" checked={form.uuTienLyThuyet} onChange={(e) => setForm({ ...form, uuTienLyThuyet: e.target.checked })} /><span>Ưu tiên lý thuyết rõ bản chất</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.uuTienVanDung} onChange={(e) => setForm({ ...form, uuTienVanDung: e.target.checked })} /><span>Có câu bài tập vận dụng</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.uuTienVanDungCao} onChange={(e) => setForm({ ...form, uuTienVanDungCao: e.target.checked })} /><span>Có câu vận dụng cao</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.antiCheatEnabled} onChange={(e) => setForm({ ...form, antiCheatEnabled: e.target.checked })} /><span>Bật anti-cheat</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.daoCauHoi} onChange={(e) => setForm({ ...form, daoCauHoi: e.target.checked })} /><span>Đảo câu hỏi</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.fullScreenRequired} disabled={!form.antiCheatEnabled} onChange={(e) => setForm({ ...form, fullScreenRequired: e.target.checked })} /><span>Bắt fullscreen</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.strictAntiCheat} disabled={!form.antiCheatEnabled} onChange={(e) => setForm({ ...form, strictAntiCheat: e.target.checked })} /><span>Chống gian lận chặt</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.hideResultDetails} onChange={(e) => setForm({ ...form, hideResultDetails: e.target.checked })} /><span>Ẩn đáp án sau thi</span></label>
              </div>

              <div className="note-box">
                AI sẽ ưu tiên tạo cả câu lý thuyết, câu tính toán và ít nhất một phần câu khó theo cấu hình hiện tại.
                {form.antiCheatEnabled ? ' Chế độ anti-cheat đang bật: tab out lần 1-2 cảnh báo, lần 3 hệ thống tự nộp bài và ghi chú nghi vấn cho giáo viên.' : ' Anti-cheat đang tắt, học sinh sẽ không bị tự nộp bài khi rời tab.'}
              </div>

              <LoadingButton className="full" onClick={handleCreate} loading={creating} loadingText="AI đang sinh câu hỏi...">
                Tạo đề bằng AI
              </LoadingButton>
            </div>
          )}

          <div className="card stack">
            <div className="row-between wrap-mobile">
              <h3>Danh sách đề đã tạo</h3>
              {step !== 'form' && (
                <LoadingButton className="button-secondary" onClick={() => { setDraft(null); setStep('form'); }}>
                  + Tạo đề mới
                </LoadingButton>
              )}
            </div>

            {exams.length === 0 ? (
              <div className="note-box">Chưa có đề nào. Hãy tạo đề đầu tiên ở bên trên.</div>
            ) : (
              <div className="table-wrap">
                <table className="table compact-table">
                  <thead>
                    <tr><th>Tên đề</th><th>Lớp</th><th>Câu</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id} className={draft?.id === exam.id ? 'row-selected' : ''} style={{ cursor: 'pointer' }} onClick={() => selectExam(exam.id)}>
                        <td>{exam.ten}</td>
                        <td>{exam.lop}</td>
                        <td>{exam.questions?.length || 0}</td>
                        <td><span className={`status-pill ${statusColor(exam.status)}`}>{statusLabel(exam.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          {!draft && (
            <div className="card note-box" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p>Đề sau khi AI tạo sẽ hiện ở đây để bạn sửa từng câu, xác nhận và theo dõi phòng thi.</p>
            </div>
          )}

          {draft && (
            <div className="card stack">
              <div className="row-between wrap-mobile">
                <div>
                  <h3>{draft.ten}</h3>
                  <div className="badge-row" style={{ marginTop: 6 }}>
                    <span className={`status-pill ${statusColor(draft.status)}`}>{statusLabel(draft.status)}</span>
                    <span className="badge">{draft.questions.length} câu</span>
                    <span className="badge badge-soft">Lớp {draft.lop} · {draft.thoiGianPhut} phút</span>
                    <span className="badge badge-soft">{draft.antiCheat.enabled ? `Anti-cheat: bật · tự nộp ở lần ${draft.antiCheat.maxTabSwitch}` : 'Anti-cheat: tắt'}</span>
                  </div>
                </div>
              </div>

              <div className="exam-action-row">
                {draft.status !== 'STARTED' && draft.status !== 'LOCKED' && (
                  <LoadingButton
                    className="button-secondary"
                    onClick={() => saveExamChanges(false)}
                    loading={savingDraft}
                    loadingText="Đang lưu chỉnh sửa..."
                  >
                    Lưu chỉnh sửa
                  </LoadingButton>
                )}
                {draft.status === 'DRAFT' && (
                  <LoadingButton onClick={handleSaveAndConfirm} loading={confirming} loadingText="Đang lưu và xác nhận...">
                    Lưu và xác nhận
                  </LoadingButton>
                )}
                {draft.status === 'CONFIRMED' && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Đang mở phòng thi...">
                    Mở đề
                  </LoadingButton>
                )}
                {draft.status === 'STARTED' && (
                  <LoadingButton className="button-secondary" onClick={() => handleAction('stop')} loading={actionLoading === 'stop'} loadingText="Đang dừng...">
                    Dừng đề
                  </LoadingButton>
                )}
                {(draft.status === 'STOPPED' || draft.status === 'CONFIRMED') && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Đang mở lại...">
                    Mở lại
                  </LoadingButton>
                )}
                {draft.status !== 'STARTED' && (
                  <>
                    <LoadingButton className="button-secondary" onClick={() => handleAction('lock')} loading={actionLoading === 'lock'} loadingText="Đang khóa...">
                      Khóa
                    </LoadingButton>
                    <LoadingButton className="button-secondary" style={{ color: '#ef4444' }} onClick={() => handleAction('delete')} loading={actionLoading === 'delete'} loadingText="Đang xóa...">
                      Xóa
                    </LoadingButton>
                  </>
                )}
                <LoadingButton
                  className="button-secondary"
                  loading={pdfLoading}
                  loadingText="Đang xuất PDF..."
                  onClick={async () => {
                    try {
                      setPdfLoading(true);
                      const blob = await api.examPdf(draft.id).catch(() => null);
                      if (blob) {
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `${draft.ten}.pdf`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                >
                  Xuất PDF
                </LoadingButton>
              </div>

              {draft && (
                <div className="card stack" style={{ padding: 16 }}>
                  <div className="row-between wrap-mobile">
                    <div>
                      <h4>Cấu hình đề</h4>
                      <div className="muted">Có thể chỉnh trước khi đề bắt đầu hoặc bị khóa.</div>
                    </div>
                    <span className="badge badge-soft">{canEditExamConfig ? 'Đang cho phép chỉnh' : 'Đã khóa chỉnh sửa'}</span>
                  </div>

                  <div className="exam-create-row exam-create-row--toggles">
                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={draft.antiCheat.enabled}
                        disabled={!canEditExamConfig}
                        onChange={(e) => setDraft((prev) => prev ? {
                          ...prev,
                          antiCheat: {
                            ...prev.antiCheat,
                            enabled: e.target.checked,
                            fullScreenRequired: e.target.checked ? prev.antiCheat.fullScreenRequired : false,
                            strictAntiCheat: e.target.checked ? prev.antiCheat.strictAntiCheat : false
                          }
                        } : prev)}
                      />
                      <span>Bật anti-cheat</span>
                    </label>

                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={draft.antiCheat.daoCauHoi}
                        disabled={!canEditExamConfig}
                        onChange={(e) => setDraft((prev) => prev ? {
                          ...prev,
                          antiCheat: { ...prev.antiCheat, daoCauHoi: e.target.checked }
                        } : prev)}
                      />
                      <span>Đảo câu hỏi</span>
                    </label>

                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={draft.antiCheat.fullScreenRequired}
                        disabled={!canEditExamConfig || !draft.antiCheat.enabled}
                        onChange={(e) => setDraft((prev) => prev ? {
                          ...prev,
                          antiCheat: { ...prev.antiCheat, fullScreenRequired: e.target.checked }
                        } : prev)}
                      />
                      <span>Bắt fullscreen</span>
                    </label>

                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={draft.antiCheat.strictAntiCheat}
                        disabled={!canEditExamConfig || !draft.antiCheat.enabled}
                        onChange={(e) => setDraft((prev) => prev ? {
                          ...prev,
                          antiCheat: { ...prev.antiCheat, strictAntiCheat: e.target.checked }
                        } : prev)}
                      />
                      <span>Chống gian lận chặt</span>
                    </label>

                    <label className="toggle-chip">
                      <input
                        type="checkbox"
                        checked={draft.antiCheat.hideResultDetails}
                        disabled={!canEditExamConfig}
                        onChange={(e) => setDraft((prev) => prev ? {
                          ...prev,
                          antiCheat: { ...prev.antiCheat, hideResultDetails: e.target.checked }
                        } : prev)}
                      />
                      <span>Ẩn đáp án sau thi</span>
                    </label>
                  </div>
                </div>
              )}

              {draft.canShowQr && (
                <div className="note-box" style={{ textAlign: 'center', padding: 20 }}>
                  <strong>Học sinh quét QR để vào thi</strong>
                  {(() => {
                    const publicExamUrl = resolveWebAppUrl(draft.examAccessUrl);
                    return (
                      <>
                  <div style={{ margin: '12px auto', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicExamUrl)}`}
                      alt="QR phòng thi"
                      width={180}
                      height={180}
                      style={{ borderRadius: 8, display: 'block', margin: '0 auto' }}
                    />
                  </div>
                  <div className="qr-token-box">{draft.qrToken}</div>
                  <Link to={draft.examAccessUrl} style={{ display: 'block', marginTop: 8, color: '#2563eb' }}>
                    {publicExamUrl}
                  </Link>
                      </>
                    );
                  })()}
                </div>
              )}

              {draft.status !== 'STARTED' && draft.status !== 'LOCKED' && (
                <div className="stack">
                  <div className="row-between wrap-mobile">
                    <h4>Chỉnh sửa câu hỏi</h4>
                    <span className="badge badge-variant-1">{draft.questions.length} câu có thể chỉnh sửa</span>
                  </div>
                  <div className="note-box">Sửa nội dung câu hỏi, các đáp án và lời giải trước khi mở đề. Option giờ có thể chỉnh trực tiếp trong mục edit đề.</div>

                  {draft.questions.map((q, qi) => (
                    <div key={q.id} className="exam-question-editor card">
                      <div className="exam-q-header">
                        <span className="exam-q-num">Câu {qi + 1}</span>
                        <select className="select exam-q-level" value={q.mucDo} onChange={(e) => updateQuestion(q.id, { mucDo: e.target.value })}>
                          <option value="DE">Dễ</option>
                          <option value="TRUNG_BINH">Trung bình</option>
                          <option value="KHO">Khó</option>
                        </select>
                        <textarea className="textarea exam-q-content" value={q.noiDung} rows={2} onChange={(e) => updateQuestion(q.id, { noiDung: e.target.value })} />
                      </div>

                      <div className="exam-options-row">
                        {q.options.map((opt, optionIndex) => (
                          <div key={`${q.id}-${optionIndex}`} className="exam-option-inline">
                            <span className={`exam-option-key ${q.dapAnDungJson.includes(opt.key) ? 'exam-option-key--correct' : ''}`}>{opt.key}</span>
                            <input className="input exam-option-text" value={opt.text} onChange={(e) => updateOption(q.id, optionIndex, e.target.value)} />
                          </div>
                        ))}
                      </div>

                      <div className="exam-q-footer">
                        <div className="exam-q-footer-field">
                          <label className="label">Đáp án đúng</label>
                          <input className="input" value={q.dapAnDungJson.join(', ')} onChange={(e) => updateQuestion(q.id, { dapAnDungJson: e.target.value.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean) })} />
                        </div>
                        <div className="exam-q-footer-field exam-q-footer-field--wide">
                          <label className="label">Giải thích</label>
                          <textarea className="textarea" rows={2} value={q.giaiThich} onChange={(e) => updateQuestion(q.id, { giaiThich: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {draft.status === 'STARTED' || draft.status === 'LOCKED' ? (
                <div className="table-wrap">
                  <table className="table compact-table">
                    <thead>
                      <tr><th>#</th><th>Câu hỏi</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Đáp án</th></tr>
                    </thead>
                    <tbody>
                      {draft.questions.map((q, index) => (
                        <tr key={q.id}>
                          <td>{index + 1}</td>
                          <td style={{ maxWidth: 220 }}>{q.noiDung}</td>
                          {q.options.map((opt) => <td key={opt.key} style={{ maxWidth: 120 }}>{opt.text}</td>)}
                          {q.options.length < 4 && Array.from({ length: 4 - q.options.length }).map((_, emptyIndex) => <td key={`empty-${emptyIndex}`}>-</td>)}
                          <td><strong style={{ color: '#16a34a' }}>{q.dapAnDungJson.join(', ')}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="stack">
                <div className="row-between wrap-mobile">
                  <h4>Log thi · điểm · gian lận</h4>
                  <span className="badge badge-soft">{draft.attempts.length} lượt làm bài</span>
                </div>

                {draft.attempts.length === 0 ? (
                  <div className="note-box">Chưa có học sinh nào vào phòng thi.</div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="table compact-table">
                        <thead>
                          <tr><th>Học sinh</th><th>Trạng thái</th><th>Điểm</th><th>Đã làm</th><th>Tab out</th><th>Cảnh báo</th><th>Cheat</th><th>Bắt đầu</th><th>Nộp bài</th></tr>
                        </thead>
                        <tbody>
                          {draft.attempts.map((attempt) => (
                            <tr key={attempt.id}>
                              <td>{attempt.hocSinhTen || attempt.hocSinhEmail || attempt.id}</td>
                              <td><span className={`status-pill ${statusColor(attempt.status)}`}>{statusLabel(attempt.status)}</span></td>
                              <td>{Number(attempt.diem || 0).toFixed(2)}</td>
                              <td>{attempt.answersCount || 0}/{attempt.totalQuestions || draft.questions.length}</td>
                              <td>{attempt.tabSwitchCount || 0}</td>
                              <td>{attempt.warningCount || 0}</td>
                              <td>{attempt.integrityEventCount || 0}</td>
                              <td>{formatDateTime(attempt.startedAt)}</td>
                              <td>{formatDateTime(attempt.submittedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {draft.attempts.map((attempt) => (
                      <div key={`${attempt.id}-detail`} className="note-box">
                        <strong>{attempt.hocSinhTen || attempt.hocSinhEmail || attempt.id}</strong>
                        <div>Điểm: {Number(attempt.diem || 0).toFixed(2)} · Tab out: {attempt.tabSwitchCount || 0} · Cheat events: {attempt.integrityEventCount || 0}</div>
                        {attempt.forcedStopReason ? <div style={{ color: '#b91c1c', marginTop: 6 }}>Ghi chú hệ thống: {attempt.forcedStopReason}</div> : null}
                        {Array.isArray(attempt.teacherFlags) && attempt.teacherFlags.length ? (
                          <div style={{ marginTop: 6 }}>
                            {attempt.teacherFlags.map((flag, index) => (
                              <div key={`${attempt.id}-flag-${index}`} style={{ color: '#b91c1c' }}>
                                [{formatDateTime(flag.at)}] {flag.message}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {Array.isArray(attempt.integrityEvents) && attempt.integrityEvents.length ? (
                          <div style={{ marginTop: 6 }}>
                            {attempt.integrityEvents.map((event, index) => (
                              <div key={`${attempt.id}-${index}`}>[{formatDateTime(event.at)}] {event.type}{event.detail ? ` · ${event.detail}` : ''}</div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 6 }}>Chưa có sự kiện gian lận chi tiết.</div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
