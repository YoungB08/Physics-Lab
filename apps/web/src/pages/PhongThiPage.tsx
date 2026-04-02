import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingButton } from '../components/LoadingButton';

function formatSeconds(total: number) {
  const safe = Math.max(0, total);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function PhongThiPage() {
  const { qrToken = '' } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [warning, setWarning] = useState('');
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [fullscreenOk, setFullscreenOk] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const currentRef = useRef<string>('');
  const integrityLockRef = useRef(false);

  async function pushIntegrity(type: string, detail?: string) {
    if (!room?.attempt?.id || submitted || integrityLockRef.current) return;
    try {
      const result = await api.integrityEvent(room.attempt.id, { type, detail });
      if (result?.forced) {
        integrityLockRef.current = true;
        setError(result.reason || 'Phiên thi đã bị khóa do vi phạm chống gian lận.');
        window.setTimeout(() => navigate('/tao-de'), 1600);
      }
    } catch {}
  }

  async function loadRoom() {
    try {
      const data = await api.joinExam(qrToken);
      setRoom(data);
      const answers = data.attempt?.chiTietJson?.answers ?? {};
      const times = data.attempt?.chiTietJson?.questionTimes ?? {};
      setSelected(answers);
      setQuestionTimes(times);
      currentRef.current = data.exam?.questions?.[0]?.id ?? '';
      const startedAt = new Date(data.attempt?.chiTietJson?.startedAt || Date.now()).getTime();
      const duration = Number(data.exam?.thoiGianPhut ?? 0) * 60;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setCountdown(Math.max(duration - elapsed, 0));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { loadRoom(); }, [qrToken]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const status = await api.examRoomStatus(qrToken);
        if (status.status !== 'STARTED') {
          setError(status.stopReason || 'Đề đã dừng. Hệ thống sẽ đưa bạn ra khỏi phòng thi.');
          window.setTimeout(() => navigate('/tao-de'), 1500);
        }
      } catch {}
    }, 4000);
    return () => window.clearInterval(interval);
  }, [qrToken, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const qid = currentRef.current;
      if (!qid || submitted) return;
      setQuestionTimes((prev) => ({ ...prev, [qid]: Number(prev[qid] ?? 0) + 1 }));
      setCountdown((prev) => {
        if (prev <= 1) {
          window.setTimeout(() => { submitExam(true).catch(() => undefined); }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    const handler = async () => {
      if (!document.hidden || !room?.attempt?.id || submitted) return;
      try {
        const result = await api.tabOut(room.attempt.id);
        const count = Number(result.tabSwitchCount ?? 0);
        const max = Number(result.maxTabSwitch ?? room?.exam?.antiCheat?.maxTabSwitch ?? 3);
        if (result.forced) {
          setError(result.reason || 'Bạn đã vượt quá số lần rời màn hình cho phép.');
          window.setTimeout(() => navigate('/tao-de'), 1600);
        } else {
          setWarning(`Cảnh báo chống gian lận: bạn đã rời màn hình ${count}/${max} lần.`);
          setRoom((prev: any) => prev ? ({ ...prev, attempt: { ...prev.attempt, chiTietJson: { ...(prev.attempt?.chiTietJson || {}), tabSwitchCount: count } } }) : prev);
        }
      } catch {}
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [room, submitted, navigate]);

  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      pushIntegrity('copy-blocked');
    };
    const onSelect = (e: Event) => {
      e.preventDefault();
      pushIntegrity('selection-blocked');
    };
    const onDrag = (e: Event) => {
      e.preventDefault();
      pushIntegrity('drag-blocked');
    };
    const onBlur = () => pushIntegrity('blur-window');
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'printscreen') {
        e.preventDefault();
        pushIntegrity('printscreen');
      }
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'u', 's', 'p', 'a'].includes(key)) {
        e.preventDefault();
        pushIntegrity('shortcut-blocked', key);
      }
      if (key === 'f12') {
        e.preventDefault();
        pushIntegrity('devtools-open', 'f12');
      }
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn đang trong phòng thi KNTech.';
    };
    const onFullscreen = () => {
      const ok = Boolean(document.fullscreenElement);
      setFullscreenOk(ok);
      if (!ok && room?.exam?.antiCheat?.fullScreenRequired) pushIntegrity('fullscreen-exit');
    };
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', onSelect);
    document.addEventListener('dragstart', onDrag);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('blur', onBlur);
    const root = document.documentElement as any;
    root?.requestFullscreen?.().then?.(() => setFullscreenOk(true)).catch?.(() => setFullscreenOk(false));

    const devtoolsCheck = window.setInterval(() => {
      const suspicious = Math.abs(window.outerWidth - window.innerWidth) > 180 || Math.abs(window.outerHeight - window.innerHeight) > 180;
      if (suspicious) pushIntegrity('devtools-open', 'window-gap');
    }, 3000);

    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('selectstart', onSelect);
      document.removeEventListener('dragstart', onDrag);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('blur', onBlur);
      window.clearInterval(devtoolsCheck);
    };
  }, [room, submitted]);

  const questions = room?.exam?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  useEffect(() => { currentRef.current = currentQuestion?.id ?? ''; }, [currentQuestion?.id]);

  const progress = useMemo(() => ({
    answered: questions.filter((q: any) => Array.isArray(selected[q.id]) ? selected[q.id].length > 0 : Boolean(selected[q.id])).length,
    total: questions.length
  }), [questions, selected]);

  async function choose(questionId: string, answer: any) {
    if (!room?.attempt?.id) return;
    const next = { ...selected, [questionId]: answer };
    setSelected(next);
    try {
      setSavingAnswer(true);
      await api.saveAnswer(room.attempt.id, { questionId, answer, elapsedSec: Number(questionTimes[questionId] ?? 0) });
    } catch (e: any) { setError(e.message); }
    finally { setSavingAnswer(false); }
  }

  async function submitExam(auto = false) {
    if (!room?.attempt?.id) return;
    try {
      setSubmitting(true);
      const result = await api.submitAttempt(room.attempt.id);
      setSubmitted(result);
      setWarning(auto ? 'Hết thời gian, hệ thống đã tự nộp bài.' : 'Bài làm đã được nộp.');
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  if (error) return <div className="card error-box">{error}</div>;
  if (!room) return <div className="card">KNTech đang tải phòng thi...</div>;
  if (!currentQuestion && !submitted) return <div className="card">Không có câu hỏi trong đề thi.</div>;

  return (
    <div className="stack exam-shell no-select-zone">
      <div className="exam-watermark">KNTech Secure Exam · {room.attempt?.chiTietJson?.studentName || 'Student'} · {new Date().toLocaleTimeString('vi-VN')}</div>
      <div className="card hero-panel dashboard-gradient-admin">
        <div className="brand-kicker">KNTech Exam Shield</div>
        <h1 className="page-title">{room.exam.ten}</h1>
        <p>Phiên thi hiển thị đầy đủ nội dung câu hỏi, phương án rõ nhãn A/B/C/D, theo dõi trạng thái làm bài theo thời gian thực và chỉ giữ các cảnh báo vận hành thật sự cần thiết.</p>
        <div className="badge-row">
          <span className="badge badge-variant-2">Còn lại {formatSeconds(countdown)}</span>
          <span className="badge">Đã làm {progress.answered}/{progress.total}</span>
          <span className={`badge ${fullscreenOk ? 'badge-soft' : ''}`}>Fullscreen: {fullscreenOk ? 'ON' : 'OFF'}</span>
          <span className="badge badge-soft">Chi tiết kết quả: {room.exam.antiCheat?.hideResultDetails ? 'Ẩn' : 'Hiện'}</span>
        </div>
      </div>

      {warning && <div className="note-box">{warning}</div>}

      {!submitted && currentQuestion && (
        <div className="grid-2 lesson-layout">
          <div className="card stack">
            <div className="row-between wrap-mobile"><h3>Câu {currentIndex + 1}</h3><span className="badge badge-soft">{currentQuestion.mucDo}</span></div>
            <div className="markdown-box">{currentQuestion.noiDung}</div>
            <div className="stack">
              {(currentQuestion.options || []).map((choice: { key: string; text: string }, index: number) => {
                const active = Array.isArray(selected[currentQuestion.id]) ? selected[currentQuestion.id].includes(choice.key) : selected[currentQuestion.id] === choice.key;
                return (
                  <LoadingButton
                    key={choice.key}
                    className={`exam-option ${active ? '' : 'button-secondary'}`}
                    onClick={() => choose(currentQuestion.id, [choice.key])}
                    loading={savingAnswer}
                    loadingText="Đang lưu..."
                  >
                    <span className="exam-option-index">{choice.key || optionLabels[index] || index + 1}</span>
                    <span className="exam-option-text">{choice.text}</span>
                  </LoadingButton>
                );
              })}
            </div>
            <div className="badge-row">
              <LoadingButton className="button-secondary" onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))} disabled={currentIndex === 0}>Câu trước</LoadingButton>
              <LoadingButton className="button-secondary" onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))} disabled={currentIndex === questions.length - 1}>Câu sau</LoadingButton>
              <LoadingButton onClick={() => submitExam(false)} loading={submitting} loadingText="Đang nộp...">Nộp bài</LoadingButton>
            </div>
          </div>
          <div className="card stack">
            <h3>Bảng điều hướng</h3>
            <div className="badge-row">
              {questions.map((q: any, index: number) => {
                const done = Array.isArray(selected[q.id]) ? selected[q.id].length > 0 : Boolean(selected[q.id]);
                return <LoadingButton key={q.id} className={index === currentIndex ? '' : 'button-secondary'} onClick={() => setCurrentIndex(index)}>{index + 1}{done ? ' ✓' : ''}</LoadingButton>;
              })}
            </div>
            <div className="table-wrap">
              <table className="table compact-table">
                <thead><tr><th>Câu</th><th>Đã chọn</th><th>Thời gian</th></tr></thead>
                <tbody>
                  {questions.map((q: any, index: number) => (
                    <tr key={q.id}>
                      <td>{index + 1}</td>
                      <td>{Array.isArray(selected[q.id]) ? selected[q.id].join(', ') : selected[q.id] || '-'}</td>
                      <td>{formatSeconds(Number(questionTimes[q.id] ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note-box">Mỗi lựa chọn đều có nhãn A/B/C/D rõ ràng để học sinh dễ chọn. Sau khi nộp bài, hệ thống có thể hiện điểm tổng và chi tiết đáp án nếu giáo viên bật chế độ đó.</div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="card stack">
          <h3>Kết quả bài làm</h3>
          <div className="badge-row">
            <span className="badge badge-variant-2">Điểm: {submitted.chiTietJson?.studentResult?.score ?? submitted.diem}</span>
            <span className="badge">Đã trả lời: {submitted.chiTietJson?.studentResult?.answered ?? 0}/{submitted.chiTietJson?.studentResult?.total ?? questions.length}</span>
            <span className="badge badge-soft">Tab out: {submitted.chiTietJson?.tabSwitchCount ?? 0}</span>
          </div>
          <div className="note-box">Kết quả chi tiết đã được mở cho luồng học sinh nếu đề thi cho phép. Bạn có thể xem số câu đúng, đáp án đúng và phần giải thích ngắn ngay sau khi nộp.</div>
          {Array.isArray(submitted.chiTietJson?.studentResult?.details) && submitted.chiTietJson.studentResult.details.length ? (
            <div className="table-wrap">
              <table className="table compact-table">
                <thead><tr><th>Câu</th><th>Bạn chọn</th><th>Đáp án đúng</th><th>Kết quả</th><th>Giải thích</th></tr></thead>
                <tbody>
                  {submitted.chiTietJson.studentResult.details.map((item: any, index: number) => (
                    <tr key={item.questionId || index}>
                      <td>{index + 1}</td>
                      <td>{Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || '-'}</td>
                      <td>{Array.isArray(item.expected) ? item.expected.join(', ') : item.expected || '-'}</td>
                      <td>{item.correct ? 'Đúng' : 'Sai'}</td>
                      <td>{item.explain || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
