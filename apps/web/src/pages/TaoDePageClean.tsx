import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingButton } from '../components/LoadingButton';

function defaultOptionKey(index: number) {
  return String.fromCharCode(65 + index);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('vi-VN');
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

export function TaoDePageClean() {
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [form, setForm] = useState({
    ten: 'Kiểm tra Vật lý',
    lop: 12,
    thoiGianPhut: 15,
    soLuongCau: 5,
    mucDo: 'TRUNG_BINH',
    baiHocSlug: '',
    daoCauHoi: true,
    fullScreenRequired: true,
    strictAntiCheat: true,
    hideResultDetails: true
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | 'start' | 'stop' | 'lock' | 'delete'>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'edit' | 'running'>('form');

  const lessons = curriculum.filter((c) => c.lop === form.lop).flatMap((c) => c.baiHoc);

  useEffect(() => {
    api.getChuongTrinh().then(setCurriculum).catch(() => undefined);
    refreshExams().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.baiHocSlug && lessons[0]?.slug) {
      setForm((prev) => ({ ...prev, baiHocSlug: lessons[0].slug }));
    }
  }, [lessons.length]);

  function mapToDraft(raw: any): ExamDraft {
    return {
      id: raw.id,
      ten: raw.ten,
      lop: raw.lop,
      thoiGianPhut: raw.thoiGianPhut,
      qrToken: raw.qrToken,
      status: raw.status,
      examAccessUrl: raw.examAccessUrl,
      canShowQr: raw.canShowQr,
      attempts: raw.attempts || [],
      antiCheat: raw.antiCheat || { maxTabSwitch: 3, daoCauHoi: true, fullScreenRequired: true, strictAntiCheat: true, hideResultDetails: true },
      questions: (raw.questions || []).map((q: any, i: number) => ({
        id: q.id || `q-${i}`,
        noiDung: q.noiDung || '',
        mucDo: q.mucDo || 'TRUNG_BINH',
        loai: q.loai || 'MOT_DAP_AN',
        options: (q.options || []).map((opt: any, oi: number) => ({ key: opt.key || defaultOptionKey(oi), text: opt.text || '' })),
        dapAnDungJson: q.dapAnDungJson || q.correctAnswers || [],
        giaiThich: q.giaiThich || q.explanation || ''
      }))
    };
  }

  async function refreshExams(focusId?: string) {
    const list = await api.examList().catch(() => []);
    setExams(list);
    if (focusId) {
      const detail = await api.examDetail(focusId).catch(() => null);
      if (detail) setDraft(mapToDraft(detail));
    }
  }

  async function handleCreate() {
    setError('');
    setCreating(true);
    try {
      const res = await api.taoDe({ ...form, cheDo: 'AI', providerAI: 'auto' });
      setDraft(mapToDraft(res.de));
      setStep('edit');
      await refreshExams(res.de?.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveAndConfirm() {
    if (!draft) return;
    setConfirming(true);
    setError('');
    try {
      await api.updateExam(draft.id, {
        ten: draft.ten,
        thoiGianPhut: draft.thoiGianPhut,
        maxTabSwitch: draft.antiCheat.maxTabSwitch,
        daoCauHoi: draft.antiCheat.daoCauHoi,
        fullScreenRequired: draft.antiCheat.fullScreenRequired,
        strictAntiCheat: draft.antiCheat.strictAntiCheat,
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
      await api.examAction(draft.id, 'confirm');
      const detail = await api.examDetail(draft.id);
      setDraft(mapToDraft(detail));
      setStep('running');
      await refreshExams(draft.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleAction(action: 'start' | 'stop' | 'lock' | 'delete') {
    if (!draft) return;
    setError('');
    try {
      setActionLoading(action);
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
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  function updateQuestion(id: string, patch: Partial<QuestionDraft>) {
    setDraft((prev) => prev ? { ...prev, questions: prev.questions.map((q) => q.id === id ? { ...q, ...patch } : q) } : prev);
  }

  function updateOption(qId: string, optIdx: number, patch: { key?: string; text?: string }) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => q.id !== qId ? q : {
          ...q,
          options: q.options.map((opt, i) => i === optIdx ? { ...opt, ...patch } : opt)
        })
      };
    });
  }

  async function selectExam(id: string) {
    const detail = await api.examDetail(id).catch(() => null);
    if (detail) {
      setDraft(mapToDraft(detail));
      setStep(detail.status === 'DRAFT' ? 'edit' : 'running');
    }
  }

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-admin">
        <h1 className="page-title">KNTech · Tạo đề thi AI</h1>
        <p>AI sinh câu hỏi, giáo viên chỉnh sửa trước khi mở đề. Màn hình này cũng theo dõi log thi, điểm và dấu hiệu gian lận theo từng học sinh.</p>
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
                    {lessons.map((l: any) => <option key={l.slug} value={l.slug}>{l.ten}</option>)}
                  </select>
                </div>
              </div>
              <div className="exam-create-row exam-create-row--toggles">
                <label className="toggle-chip"><input type="checkbox" checked={form.daoCauHoi} onChange={(e) => setForm({ ...form, daoCauHoi: e.target.checked })} /><span>Đảo câu hỏi</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.fullScreenRequired} onChange={(e) => setForm({ ...form, fullScreenRequired: e.target.checked })} /><span>Bắt fullscreen</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.strictAntiCheat} onChange={(e) => setForm({ ...form, strictAntiCheat: e.target.checked })} /><span>Chống gian lận chặt</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.hideResultDetails} onChange={(e) => setForm({ ...form, hideResultDetails: e.target.checked })} /><span>Ẩn đáp án sau thi</span></label>
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
                  <thead><tr><th>Tên đề</th><th>Lớp</th><th>Câu</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {exams.map((ex) => (
                      <tr key={ex.id} className={draft?.id === ex.id ? 'row-selected' : ''} style={{ cursor: 'pointer' }} onClick={() => selectExam(ex.id)}>
                        <td>{ex.ten}</td>
                        <td>{ex.lop}</td>
                        <td>{ex.questions?.length || 0}</td>
                        <td><span className={`status-pill ${statusColor(ex.status)}`}>{statusLabel(ex.status)}</span></td>
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
                    <span className="badge badge-soft">Tab-out tối đa: {draft.antiCheat.maxTabSwitch}</span>
                  </div>
                </div>
              </div>

              <div className="exam-action-row">
                {draft.status === 'DRAFT' && (
                  <LoadingButton onClick={handleSaveAndConfirm} loading={confirming} loadingText="Đang lưu và xác nhận...">
                    Lưu và Confirm
                  </LoadingButton>
                )}
                {draft.status === 'CONFIRMED' && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Đang mở phòng thi...">
                    Start đề
                  </LoadingButton>
                )}
                {draft.status === 'STARTED' && (
                  <LoadingButton className="button-secondary" onClick={() => handleAction('stop')} loading={actionLoading === 'stop'} loadingText="Đang dừng...">
                    Dừng đề
                  </LoadingButton>
                )}
                {(draft.status === 'STOPPED' || draft.status === 'CONFIRMED') && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Đang start lại...">
                    Start lại
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
                      const b = await api.examPdf(draft.id).catch(() => null);
                      if (b) {
                        const u = URL.createObjectURL(b);
                        const a = document.createElement('a');
                        a.href = u;
                        a.download = `${draft.ten}.pdf`;
                        a.click();
                        URL.revokeObjectURL(u);
                      }
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                >
                  Xuất PDF
                </LoadingButton>
              </div>

              {draft.canShowQr && (
                <div className="note-box" style={{ textAlign: 'center', padding: 20 }}>
                  <strong>Học sinh quét QR để vào thi</strong>
                  <div style={{ margin: '12px auto', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + draft.examAccessUrl)}`}
                      alt="QR phòng thi"
                      width={180}
                      height={180}
                      style={{ borderRadius: 8, display: 'block', margin: '0 auto' }}
                    />
                  </div>
                  <div className="qr-token-box">{draft.qrToken}</div>
                  <Link to={draft.examAccessUrl} style={{ display: 'block', marginTop: 8, color: '#2563eb' }}>
                    {window.location.origin}{draft.examAccessUrl}
                  </Link>
                </div>
              )}

              {draft.status === 'DRAFT' && (
                <div className="stack">
                  <div className="row-between wrap-mobile">
                    <h4>Chỉnh sửa câu hỏi</h4>
                    <span className="badge badge-variant-1">{draft.questions.length} câu do AI sinh</span>
                  </div>
                  <div className="note-box">Sửa nội dung câu hỏi, các đáp án và lời giải trước khi xác nhận đề.</div>

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
                        {q.options.map((opt, oi) => (
                          <div key={`${q.id}-${oi}`} className="exam-option-inline">
                            <span className={`exam-option-key ${q.dapAnDungJson.includes(opt.key) ? 'exam-option-key--correct' : ''}`}>{opt.key}</span>
                            <input className="input exam-option-text" value={opt.text} onChange={(e) => updateOption(q.id, oi, { text: e.target.value })} />
                          </div>
                        ))}
                      </div>

                      <div className="exam-q-footer">
                        <div className="exam-q-footer-field">
                          <label className="label">Đáp án đúng</label>
                          <input className="input" value={(q.dapAnDungJson || []).join(', ')} onChange={(e) => updateQuestion(q.id, { dapAnDungJson: e.target.value.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean) })} />
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

              {draft.status !== 'DRAFT' && (
                <div className="table-wrap">
                  <table className="table compact-table">
                    <thead><tr><th>#</th><th>Câu hỏi</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Đáp án</th></tr></thead>
                    <tbody>
                      {draft.questions.map((q, i) => (
                        <tr key={q.id}>
                          <td>{i + 1}</td>
                          <td style={{ maxWidth: 220 }}>{q.noiDung}</td>
                          {q.options.map((opt) => <td key={opt.key} style={{ maxWidth: 120 }}>{opt.text}</td>)}
                          {q.options.length < 4 && Array.from({ length: 4 - q.options.length }).map((_, index) => <td key={`empty-${index}`}>-</td>)}
                          <td><strong style={{ color: '#16a34a' }}>{q.dapAnDungJson.join(', ')}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="stack">
                <div className="row-between wrap-mobile">
                  <h4>Log thi · điểm · cheat</h4>
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
                        {attempt.forcedStopReason ? <div style={{ color: '#b91c1c', marginTop: 6 }}>Lý do khóa: {attempt.forcedStopReason}</div> : null}
                        {Array.isArray(attempt.integrityEvents) && attempt.integrityEvents.length ? (
                          <div style={{ marginTop: 6 }}>
                            {attempt.integrityEvents.map((event, index) => (
                              <div key={`${attempt.id}-${index}`}>[{formatDateTime(event.at)}] {event.type}{event.detail ? ` · ${event.detail}` : ''}</div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 6 }}>Chưa có sự kiện cheat chi tiết.</div>
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
