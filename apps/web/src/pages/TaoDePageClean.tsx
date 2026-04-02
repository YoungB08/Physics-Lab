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
    DRAFT: 'Nhap',
    CONFIRMED: 'Da duyet',
    STARTED: 'Dang thi',
    STOPPED: 'Da dung',
    LOCKED: 'Da khoa',
    SUBMITTED: 'Da nop',
    FORCE_STOPPED: 'Khoa do vi pham'
  };
  return map[status] || status;
}

function mapToDraft(raw: any): ExamDraft {
  return {
    id: raw.id,
    ten: cleanText(raw.ten, 'De thi'),
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
    antiCheat: raw.antiCheat || {
      maxTabSwitch: 3,
      daoCauHoi: true,
      fullScreenRequired: true,
      strictAntiCheat: true,
      hideResultDetails: true
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
    ten: 'Kiem tra Vat ly',
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
  const [confirming, setConfirming] = useState(false);
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
          ten: cleanText(item?.ten, 'De thi'),
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
        ten: cleanText(form.ten, 'Kiem tra Vat ly'),
        cheDo: 'AI',
        providerAI: 'auto'
      });
      const nextDraft = mapToDraft(res?.de || res);
      setDraft(nextDraft);
      setStep('edit');
      await refreshExams(nextDraft.id);
    } catch (e: any) {
      setError(cleanText(e?.message, 'Khong tao duoc de thi.'));
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveAndConfirm() {
    if (!draft) return;
    setError('');
    setConfirming(true);
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
      setError(cleanText(e?.message, 'Khong luu duoc de thi.'));
    } finally {
      setConfirming(false);
    }
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
      setError(cleanText(e?.message, 'Khong thuc hien duoc thao tac.'));
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

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-admin">
        <h1 className="page-title">KNTech - Tao de thi AI</h1>
        <p>AI sinh cau hoi, giao vien chinh sua truoc khi mo de. Man hinh nay cung theo doi phong thi, diem va log gian lan.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="grid-2 lesson-layout">
        <div className="stack">
          {step === 'form' && (
            <div className="card stack">
              <div className="row-between wrap-mobile">
                <h3>Tao de moi bang AI</h3>
                <span className="badge badge-variant-2">AI Mode</span>
              </div>

              <div className="exam-create-row">
                <div className="exam-create-field">
                  <label className="label">Ten de</label>
                  <input className="input" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Lop</label>
                  <select className="select" value={form.lop} onChange={(e) => setForm({ ...form, lop: Number(e.target.value) })}>
                    <option value={10}>Lop 10</option>
                    <option value={11}>Lop 11</option>
                    <option value={12}>Lop 12</option>
                  </select>
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Thoi gian</label>
                  <input className="input" type="number" min={5} max={180} value={form.thoiGianPhut} onChange={(e) => setForm({ ...form, thoiGianPhut: Number(e.target.value) })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">So cau</label>
                  <input className="input" type="number" min={1} max={50} value={form.soLuongCau} onChange={(e) => setForm({ ...form, soLuongCau: Number(e.target.value) })} />
                </div>
                <div className="exam-create-field exam-create-field--narrow">
                  <label className="label">Muc do</label>
                  <select className="select" value={form.mucDo} onChange={(e) => setForm({ ...form, mucDo: e.target.value })}>
                    <option value="DE">De</option>
                    <option value="TRUNG_BINH">Trung binh</option>
                    <option value="KHO">Kho</option>
                  </select>
                </div>
                <div className="exam-create-field">
                  <label className="label">Bai hoc</label>
                  <select className="select" value={form.baiHocSlug} onChange={(e) => setForm({ ...form, baiHocSlug: e.target.value })}>
                    {lessons.map((lesson: any) => <option key={lesson.slug} value={lesson.slug}>{lesson.ten}</option>)}
                  </select>
                </div>
              </div>

              <div className="exam-create-row exam-create-row--toggles">
                <label className="toggle-chip"><input type="checkbox" checked={form.daoCauHoi} onChange={(e) => setForm({ ...form, daoCauHoi: e.target.checked })} /><span>Dao cau hoi</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.fullScreenRequired} onChange={(e) => setForm({ ...form, fullScreenRequired: e.target.checked })} /><span>Bat fullscreen</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.strictAntiCheat} onChange={(e) => setForm({ ...form, strictAntiCheat: e.target.checked })} /><span>Chong gian lan chat</span></label>
                <label className="toggle-chip"><input type="checkbox" checked={form.hideResultDetails} onChange={(e) => setForm({ ...form, hideResultDetails: e.target.checked })} /><span>An dap an sau thi</span></label>
              </div>

              <LoadingButton className="full" onClick={handleCreate} loading={creating} loadingText="AI dang sinh cau hoi...">
                Tao de bang AI
              </LoadingButton>
            </div>
          )}

          <div className="card stack">
            <div className="row-between wrap-mobile">
              <h3>Danh sach de da tao</h3>
              {step !== 'form' && (
                <LoadingButton className="button-secondary" onClick={() => { setDraft(null); setStep('form'); }}>
                  + Tao de moi
                </LoadingButton>
              )}
            </div>

            {exams.length === 0 ? (
              <div className="note-box">Chua co de nao. Hay tao de dau tien o ben tren.</div>
            ) : (
              <div className="table-wrap">
                <table className="table compact-table">
                  <thead>
                    <tr><th>Ten de</th><th>Lop</th><th>Cau</th><th>Trang thai</th></tr>
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
              <p>De sau khi AI tao se hien o day de ban sua tung cau, xac nhan va theo doi phong thi.</p>
            </div>
          )}

          {draft && (
            <div className="card stack">
              <div className="row-between wrap-mobile">
                <div>
                  <h3>{draft.ten}</h3>
                  <div className="badge-row" style={{ marginTop: 6 }}>
                    <span className={`status-pill ${statusColor(draft.status)}`}>{statusLabel(draft.status)}</span>
                    <span className="badge">{draft.questions.length} cau</span>
                    <span className="badge badge-soft">Lop {draft.lop} � {draft.thoiGianPhut} phut</span>
                    <span className="badge badge-soft">Tab-out toi da: {draft.antiCheat.maxTabSwitch}</span>
                  </div>
                </div>
              </div>

              <div className="exam-action-row">
                {draft.status === 'DRAFT' && (
                  <LoadingButton onClick={handleSaveAndConfirm} loading={confirming} loadingText="Dang luu va xac nhan...">
                    Luu va Confirm
                  </LoadingButton>
                )}
                {draft.status === 'CONFIRMED' && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Dang mo phong thi...">
                    Start de
                  </LoadingButton>
                )}
                {draft.status === 'STARTED' && (
                  <LoadingButton className="button-secondary" onClick={() => handleAction('stop')} loading={actionLoading === 'stop'} loadingText="Dang dung...">
                    Dung de
                  </LoadingButton>
                )}
                {(draft.status === 'STOPPED' || draft.status === 'CONFIRMED') && (
                  <LoadingButton onClick={() => handleAction('start')} loading={actionLoading === 'start'} loadingText="Dang start lai...">
                    Start lai
                  </LoadingButton>
                )}
                {draft.status !== 'STARTED' && (
                  <>
                    <LoadingButton className="button-secondary" onClick={() => handleAction('lock')} loading={actionLoading === 'lock'} loadingText="Dang khoa...">
                      Khoa
                    </LoadingButton>
                    <LoadingButton className="button-secondary" style={{ color: '#ef4444' }} onClick={() => handleAction('delete')} loading={actionLoading === 'delete'} loadingText="Dang xoa...">
                      Xoa
                    </LoadingButton>
                  </>
                )}
                <LoadingButton
                  className="button-secondary"
                  loading={pdfLoading}
                  loadingText="Dang xuat PDF..."
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
                  Xuat PDF
                </LoadingButton>
              </div>

              {draft.canShowQr && (
                <div className="note-box" style={{ textAlign: 'center', padding: 20 }}>
                  <strong>Hoc sinh quet QR de vao thi</strong>
                  <div style={{ margin: '12px auto', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + draft.examAccessUrl)}`}
                      alt="QR phong thi"
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
                    <h4>Chinh sua cau hoi</h4>
                    <span className="badge badge-variant-1">{draft.questions.length} cau do AI sinh</span>
                  </div>
                  <div className="note-box">Sua noi dung cau hoi, cac dap an va loi giai truoc khi xac nhan de.</div>

                  {draft.questions.map((q, qi) => (
                    <div key={q.id} className="exam-question-editor card">
                      <div className="exam-q-header">
                        <span className="exam-q-num">Cau {qi + 1}</span>
                        <select className="select exam-q-level" value={q.mucDo} onChange={(e) => updateQuestion(q.id, { mucDo: e.target.value })}>
                          <option value="DE">De</option>
                          <option value="TRUNG_BINH">Trung binh</option>
                          <option value="KHO">Kho</option>
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
                          <label className="label">Dap an dung</label>
                          <input className="input" value={q.dapAnDungJson.join(', ')} onChange={(e) => updateQuestion(q.id, { dapAnDungJson: e.target.value.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean) })} />
                        </div>
                        <div className="exam-q-footer-field exam-q-footer-field--wide">
                          <label className="label">Giai thich</label>
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
                    <thead>
                      <tr><th>#</th><th>Cau hoi</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Dap an</th></tr>
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
              )}

              <div className="stack">
                <div className="row-between wrap-mobile">
                  <h4>Log thi � diem � cheat</h4>
                  <span className="badge badge-soft">{draft.attempts.length} luot lam bai</span>
                </div>

                {draft.attempts.length === 0 ? (
                  <div className="note-box">Chua co hoc sinh nao vao phong thi.</div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="table compact-table">
                        <thead>
                          <tr><th>Hoc sinh</th><th>Trang thai</th><th>Diem</th><th>Da lam</th><th>Tab out</th><th>Canh bao</th><th>Cheat</th><th>Bat dau</th><th>Nop bai</th></tr>
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
                        <div>Diem: {Number(attempt.diem || 0).toFixed(2)} � Tab out: {attempt.tabSwitchCount || 0} � Cheat events: {attempt.integrityEventCount || 0}</div>
                        {attempt.forcedStopReason ? <div style={{ color: '#b91c1c', marginTop: 6 }}>Ly do khoa: {attempt.forcedStopReason}</div> : null}
                        {Array.isArray(attempt.integrityEvents) && attempt.integrityEvents.length ? (
                          <div style={{ marginTop: 6 }}>
                            {attempt.integrityEvents.map((event, index) => (
                              <div key={`${attempt.id}-${index}`}>[{formatDateTime(event.at)}] {event.type}{event.detail ? ` � ${event.detail}` : ''}</div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 6 }}>Chua co su kien cheat chi tiet.</div>
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
