import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { MarkdownMath } from '../components/MarkdownMath';
import { Avatar } from '../components/Avatar';

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function flattenLessons(curriculum: any[]) {
  return (curriculum || []).flatMap((chapter: any) => (chapter.baiHoc || []).map((lesson: any) => ({
    id: lesson.id,
    ten: lesson.ten,
    slug: lesson.slug,
    chuDeThi: lesson.chuDeThi,
    lop: chapter.lop
  })));
}

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState(searchParams.get('lesson') || '');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const lessons = useMemo(() => flattenLessons(curriculum), [curriculum]);
  const activeConversationId = searchParams.get('id') || '';

  useEffect(() => {
    api.getChuongTrinh().then(setCurriculum).catch(() => undefined);
  }, []);

  useEffect(() => {
    const lessonSlug = searchParams.get('lesson') || '';
    const conversationId = searchParams.get('id') || '';
    setSelectedLessonSlug(lessonSlug);
    setError('');

    let cancelled = false;
    api.chatConversations(lessonSlug || undefined)
      .then((list) => {
        if (cancelled) return;
        setConversations(Array.isArray(list) ? list : []);

        if (!lessonSlug && !conversationId) {
          setActiveConversation(null);
          return;
        }

        if (lessonSlug && !conversationId) {
          const lesson = lessons.find((item) => item.slug === lessonSlug) || null;
          setActiveConversation((prev: any) => prev?.id ? prev : { id: '', baiHoc: lesson, messages: [] });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, lessons]);

  useEffect(() => {
    if (!activeConversationId) {
      if (!selectedLessonSlug) {
        setActiveConversation(null);
        return;
      }
      const lesson = lessons.find((item) => item.slug === selectedLessonSlug) || null;
      setActiveConversation((prev: any) => prev?.id ? prev : { id: '', baiHoc: lesson, messages: [] });
      return;
    }

    setLoading(true);
    api.chatConversationDetail(activeConversationId)
      .then(setActiveConversation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeConversationId, selectedLessonSlug, lessons]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length]);

  async function refreshList(nextLessonSlug = selectedLessonSlug) {
    const list = await api.chatConversations(nextLessonSlug || undefined);
    setConversations(Array.isArray(list) ? list : []);
    return list;
  }

  async function createConversation(lessonSlug: string, firstMessage?: string) {
    const created = await api.createChatConversation({ lessonSlug, firstMessage });
    await refreshList(lessonSlug);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('lesson', lessonSlug);
      params.set('id', created.id);
      return params;
    });
    setActiveConversation(created);
    return created;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    if (!selectedLessonSlug) {
      setError('Hãy chọn một bài học trước khi chat.');
      return;
    }

    setError('');
    setInput('');
    setSending(true);

    const optimisticUserMessage = {
      id: `temp-user-${Date.now()}`,
      vaiTro: 'user',
      noiDung: text,
      createdAt: new Date().toISOString()
    };
    const optimisticAssistantMessage = {
      id: `temp-assistant-${Date.now()}`,
      vaiTro: 'assistant',
      noiDung: 'Nova đang trả lời...',
      createdAt: new Date().toISOString(),
      pending: true
    };

    setActiveConversation((prev: any) => ({
      ...(prev || { id: '', baiHoc: lessons.find((item) => item.slug === selectedLessonSlug) || null, messages: [] }),
      messages: [...(prev?.messages || []), optimisticUserMessage, optimisticAssistantMessage]
    }));

    try {
      const conversation = activeConversation?.id ? activeConversation : await createConversation(selectedLessonSlug, text);
      await api.sendChatMessage(conversation.id, { noiDung: text, provider: 'auto' });
      const detail = await api.chatConversationDetail(conversation.id);
      setActiveConversation(detail);
      await refreshList(selectedLessonSlug);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('lesson', selectedLessonSlug);
        params.set('id', conversation.id);
        return params;
      });
      if (!activeConversationId) navigate(`/chat?lesson=${encodeURIComponent(selectedLessonSlug)}&id=${encodeURIComponent(conversation.id)}`, { replace: true });
    } catch (e: any) {
      setError(e.message);
      setActiveConversation((prev: any) => ({
        ...prev,
        messages: (prev?.messages || []).filter((item: any) => !String(item.id).startsWith('temp-'))
      }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid-2 lesson-layout">
      <div className="card stack chat-sidebar-card">
        <div className="row-between wrap-mobile">
          <h3>Cuộc trò chuyện theo bài</h3>
          <button
            className="button button-secondary"
            onClick={() => selectedLessonSlug && createConversation(selectedLessonSlug)}
            disabled={!selectedLessonSlug}
          >
            Tạo chat mới
          </button>
        </div>

        <label className="label">Chọn bài học</label>
        <select
          className="select"
          value={selectedLessonSlug}
          onChange={(e) => {
            const lessonSlug = e.target.value;
            setSelectedLessonSlug(lessonSlug);
            setActiveConversation(null);
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              if (lessonSlug) params.set('lesson', lessonSlug);
              else params.delete('lesson');
              params.delete('id');
              return params;
            });
          }}
        >
          <option value="">Chọn bài học để mở chat</option>
          {lessons.map((lesson) => (
            <option key={lesson.slug} value={lesson.slug}>
              Lớp {lesson.lop} · {lesson.ten}
            </option>
          ))}
        </select>

        <div className="stack chat-thread-list">
          {conversations.length ? conversations.map((item) => (
            <button
              key={item.id}
              className={item.id === activeConversationId ? 'button lesson-chat-thread active-thread' : 'button lesson-chat-thread'}
              onClick={() => setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set('lesson', item.baiHoc?.slug || selectedLessonSlug);
                params.set('id', item.id);
                return params;
              })}
            >
              <strong>{item.tieuDe || 'Chat với AI'}</strong>
              <span>{item.baiHoc?.ten || 'Bài học chưa xác định'}</span>
              <small>{item.tomTat || 'Chưa có tin nhắn'}</small>
            </button>
          )) : <div className="note-box">Chưa có cuộc trò chuyện nào cho bài học này.</div>}
        </div>
      </div>

      <div className="card stack chat-main-card">
        <div className="row-between wrap-mobile">
          <div>
            <h3>{activeConversation?.baiHoc?.ten || 'Chat 1-1 với Nova KNTech'}</h3>
            <div className="muted">{activeConversation?.baiHoc?.chuDeThi || 'Chọn bài học để bắt đầu'}</div>
          </div>
          {loading ? <span className="badge badge-soft">Đang tải...</span> : null}
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="lesson-chat-box">
          {(activeConversation?.messages || []).map((item: any) => (
            <div key={item.id} className={`chat-row ${item.vaiTro === 'user' ? 'user' : 'assistant'}`}>
              {item.vaiTro !== 'user' && <Avatar name="Nova KNTech" variant="brand" />}
              <div className={`chat-bubble ${item.vaiTro === 'user' ? 'user' : 'assistant'}`}>
                <div className="chat-meta">
                  <strong>{item.vaiTro === 'user' ? 'Bạn' : 'Nova KNTech'}</strong>
                  <span>{item.pending ? '...' : formatTime(item.createdAt)}</span>
                </div>
                <MarkdownMath content={item.noiDung} />
              </div>
              {item.vaiTro === 'user' && <Avatar name="Bạn" variant="gradient" />}
            </div>
          ))}
          {!activeConversation?.messages?.length && selectedLessonSlug ? <div className="note-box">Chọn cuộc trò chuyện bên trái hoặc bấm tạo chat mới để bắt đầu.</div> : null}
          <div ref={messageEndRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            className="textarea"
            placeholder="Nhắn với Nova về bài học này..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="button" onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
}
