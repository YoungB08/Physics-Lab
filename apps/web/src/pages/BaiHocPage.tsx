import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { PhysicsSimulation } from '../components/PhysicsSimulation';
import { findSimulationPreset, resolveVisualTypeForLesson } from '../data/simulationLibrary';
import { getVisualProfile } from '../utils/visualProfiles';
import { MarkdownMath } from '../components/MarkdownMath';
import { Avatar } from '../components/Avatar';
import { buildExtendedSections } from '../utils/lessonContent';
import { resolveLessonSimulationBlueprint } from '../utils/lessonSimulationBlueprints';
import { resolveLessonScene } from '../utils/lessonSceneRegistry';

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeVietnamese(input: unknown) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/[Đ]/g, 'D')
    .toLowerCase();
}

function inferSimulationType(data: any) {
  const text = normalizeVietnamese(`${data?.ten || ''} ${data?.moTa || ''} ${data?.chuong?.ten || ''} ${data?.chuDeThi || ''}`);
  if (text.includes('dang nhiet')) return 'thermal-isothermal-3d';
  if (text.includes('dang ap')) return 'thermal-isobaric-3d';
  if (text.includes('phuong trinh trang thai')) return 'thermal-state-equation-3d';
  if (text.includes('nhiet do') || text.includes('noi nang')) return 'thermal-kinetic-3d';
  if (text.includes('tia x')) return 'xray-tube-3d';
  if (text.includes('chu ki ban ra') || text.includes('ban ra')) return 'half-life-3d';
  if (text.includes('alpha')) return 'alpha-decay-3d';
  if (text.includes('beta')) return 'beta-decay-3d';
  if (text.includes('gamma')) return 'gamma-decay-3d';
  if (text.includes('phong xa')) return 'radioactive-decay-3d';
  if (text.includes('bohr')) return 'bohr-atom-3d';
  if (text.includes('cau tao hat nhan')) return 'nuclear-structure-3d';
  if (text.includes('nang luong lien ket')) return 'binding-energy-3d';
  if (text.includes('phan hach')) return 'nuclear-fission-3d';
  if (text.includes('nhiet hach')) return 'nuclear-fusion-3d';
  if (text.includes('phan ung hat nhan')) return 'nuclear-reaction-3d';
  if (text.includes('kinh hien vi')) return 'microscope-3d';
  if (text.includes('kinh thien van')) return 'telescope-3d';
  if (text.includes('kinh lup')) return 'magnifier-3d';
  if (text.includes('tat khuc xa') || text.includes('mat') || text.includes('can') || text.includes('vien')) return 'eye-optics-3d';
  if (text.includes('khuc xa')) return 'refraction-3d';
  if (text.includes('thau kinh')) return 'lens-3d';
  if (text.includes('tron')) return 'circular-motion-3d';
  if (text.includes('newton')) return 'newton-laws-3d';
  if (text.includes('roi')) return 'free-fall-3d';
  if (text.includes('ma sat')) return 'friction-plane-3d';
  if (text.includes('lo xo')) return 'spring-3d';
  if (text.includes('con lac')) return 'pendulum-3d';
  if (text.includes('dien truong')) return 'electric-field-3d';
  if (text.includes('coulomb')) return 'coulomb-3d';
  if (text.includes('giao thoa')) return 'interference-3d';
  if (text.includes('song dung')) return 'standing-wave-3d';
  if (text.includes('song')) return 'wave-3d';
  if (text.includes('luc lorentz') || text.includes('hat tich dien trong tu truong')) return 'magnetic-helix-3d';
  if (text.includes('tu truong')) return 'magnetic-field-lines-3d';
  if (text.includes('cam ung')) return 'induction-3d';
  if (text.includes('rlc')) return 'rlc-3d';
  if (text.includes('bien ap')) return 'transformer-3d';
  return 'default';
}

function topicLabel(data: any) {
  return cleanText(data?.chuDeThi, 'Chủ đề tổng hợp');
}

function responseText(response: any) {
  const blocks = response?.du_lieu?.noi_dung_chinh;
  if (Array.isArray(blocks) && blocks.length) return blocks.join('\n');
  return String(response?.du_lieu?.giai_thich || response?.du_lieu?.tom_tat || '');
}

function formatChatTime(value?: string) {
  if (!value) return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function toLessonChatMessages(detail: any) {
  const messages = Array.isArray(detail?.messages) ? detail.messages : [];
  return messages.map((item: any) => ({
    role: item?.vaiTro === 'user' ? 'user' as const : 'assistant' as const,
    text: cleanText(item?.noiDung, ''),
    at: formatChatTime(item?.createdAt)
  })).filter((item: { text: string }) => item.text);
}

function normalizeSectionTitle(title = '') {
  const fixedTitle = cleanText(title, 'Tổng quan');
  const raw = normalizeVietnamese(fixedTitle);
  if (raw.includes('khai niem')) return 'Khái niệm';
  if (raw.includes('cong thuc') && raw.includes('bien')) return 'Biến đổi công thức';
  if (raw.includes('cong thuc')) return 'Công thức';
  if (raw.includes('don vi')) return 'Đơn vị';
  if (raw.includes('vi du')) return 'Ví dụ';
  if (raw.includes('bai tap')) return 'Bài tập';
  if (raw.includes('chien luoc')) return 'Chiến lược';
  if (raw.includes('sai lam')) return 'Sai lầm thường gặp';
  if (raw.includes('phan tich')) return 'Phân tích chuyên sâu';
  return fixedTitle;
}

function groupSections(sections: any[]) {
  const groups: Record<string, string[]> = {};
  for (const item of sections || []) {
    const key = normalizeSectionTitle(item.tieuDe);
    groups[key] ||= [];
    groups[key].push(item.noiDungMarkdown || '');
  }
  return groups;
}

function externalResources(config: any = {}) {
  const items = Array.isArray(config?.externalResources) ? config.externalResources : [];
  return items.filter((item: any) => item?.url).map((item: any) => ({
    title: String(item.title || item.label || 'Tài nguyên ngoài'),
    url: String(item.url),
    type: String(item.type || 'link'),
    provider: String(item.provider || 'external')
  }));
}

export function BaiHocPage() {
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  const [data, setData] = useState<any>();
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiSimResponse, setAiSimResponse] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; at: string }>>([]);
  const [chatConversationId, setChatConversationId] = useState('');
  const [error, setError] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    api.getBaiHoc(slug).then(async (payload) => {
      setData(payload);
      const fallbackGreeting = [{
        role: 'assistant' as const,
        text: `Chào bạn, mình là **Nova KNTech**. Hiện tại mình đang hỗ trợ bài **${payload.ten}**. Bạn có thể hỏi về khái niệm, công thức, cách giải nhanh, bài tập vận dụng hoặc cách đọc mô phỏng.`,
        at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }];
      try {
        const conversations = await api.chatConversations(payload.slug);
        const latest = Array.isArray(conversations) && conversations.length ? conversations[0] : null;
        if (latest?.id) {
          const detail = await api.chatConversationDetail(latest.id);
          const history = toLessonChatMessages(detail);
          setChatConversationId(latest.id);
          setChatHistory(history.length ? history : fallbackGreeting);
          return;
        }
      } catch { }
      setChatConversationId('');
      setChatHistory(fallbackGreeting);
    }).catch((e) => setError(e.message));
  }, [slug]);

  async function explain(partTitle: string) {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({
        loaiTacVu: 'giai_thich_ly_thuyet',
        provider: 'auto',
        noiDung: `Giải thích sau, dùng bản chất vật lý, bám chuẩn THPT cho phần ${partTitle} của bài ${data.ten}. Trình bày bằng markdown, có công thức nếu cần và nhấn mạnh các sai lầm thường gặp.`,
        boCanh: { lesson: data.ten, topic: topicLabel(data) }
      });
      setAiResponse(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { role: 'user', text, at: now }]);
    setChatInput('');
    try {
      setLoadingAI(true);
      let conversationId = chatConversationId;
      if (!conversationId) {
        const created = await api.createChatConversation({ lessonSlug: data.slug, firstMessage: text });
        conversationId = String(created?.id || '');
        setChatConversationId(conversationId);
      }
      await api.sendChatMessage(conversationId, { noiDung: text, provider: 'auto' });
      const detail = await api.chatConversationDetail(conversationId);
      const history = toLessonChatMessages(detail);
      setChatHistory(history);
    } catch (e: any) {
      setError(e.message);
      setChatHistory((prev) => prev.filter((item, index) => !(index === prev.length - 1 && item.role === 'user' && item.text === text && item.at === now)));
    } finally {
      setLoadingAI(false);
    }
  }

  const enrichedSections = useMemo(() => buildExtendedSections(data, data?.phanKienThuc || []), [data]);
  const sectionGroups = useMemo(() => groupSections(enrichedSections), [enrichedSections]);

  if (error) return <div className="card error-box">{error}</div>;
  if (!data) return <div className="card">KNTech đang tải bài học...</div>;

  const inferredType = inferSimulationType(data);
  const configuredType = data.moPhong?.loaiMoPhong;
  const resolvedFallback = resolveVisualTypeForLesson({ ten: data.ten, moTa: data.moTa, chuongTen: data?.chuong?.ten, chuDeThi: data?.chuDeThi });
  const dbType = data.simulationType;
  const lessonBlueprint = resolveLessonSimulationBlueprint({ title: data.ten, slug: data.slug, topic: data?.chuDeThi, type: configuredType || dbType || inferredType });
  const exactBlueprintType = lessonBlueprint?.matched ? lessonBlueprint.simulationType : undefined;
  const configuredSimulationType = configuredType && configuredType !== 'default' ? configuredType : undefined;
  const dbSimulationType = dbType && dbType !== 'default' ? dbType : undefined;
  const inferredSimulationType = inferredType !== 'default' ? inferredType : undefined;
  const simulationType = exactBlueprintType || configuredSimulationType || dbSimulationType || inferredSimulationType || resolvedFallback;
  const lessonScene = resolveLessonScene({ title: data.ten, slug: data.slug, fallbackSceneKind: getVisualProfile(simulationType).sceneKind });
  const preset = findSimulationPreset(simulationType);
  const baseSimulationConfig = data.moPhong?.cauHinhJson || {};
  const visualProfile = getVisualProfile(simulationType);
  const simulationConfig = {
    ...baseSimulationConfig,
    sceneVariant: baseSimulationConfig.sceneVariant || data.slug,
    variantKey: baseSimulationConfig.variantKey || `${data.slug}:${simulationType}:${data.ten}`,
    strategyTitle: 'Chiến lược quan sát'
  };
  const simulationConfigWithLesson = {
    ...simulationConfig,
    sceneId: lessonScene.sceneId,
    lessonSlug: data.slug,
    lessonTitle: data.ten,
    lessonTopic: topicLabel(data),
    lessonComponents: lessonBlueprint?.components,
    lessonFocus: lessonBlueprint?.focus
  };
  const simulationParams = data.moPhong?.thamSoJson || preset?.defaultParams || { quality: 'ultra', precision: 'exam-mode', topic: topicLabel(data) };
  const theoryGroups = Object.entries(sectionGroups);
  const resources = externalResources(simulationConfigWithLesson);
  const lessonDescription = cleanText(data.moTa, `${data.ten} được trình bày theo lý thuyết, công thức trọng tâm và mô phỏng tương ứng.`);
  const lessonLabel = cleanText(data.chuong?.ten, 'Chủ đề vật lý');
  const simulationLabel = cleanText(preset?.label || simulationType, 'Mô phỏng vật lý');

  async function explainSimulation() {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({
        loaiTacVu: 'giai_thich_mo_phong',
        provider: 'auto',
        noiDung: `Giải thích mô phỏng của bài ${data.ten}: mục tiêu quan sát, cách thay tham số, dự đoán xu hướng, liên hệ công thức và các bẫy sai. Trình bày markdown rõ ràng, ưu tiên checklist và câu hỏi gợi mở.`,
        boCanh: {
          lesson: data.ten,
          topic: topicLabel(data),
          lessonSlug: data.slug,
          simulationType,
          simulationParams,
          simulationConfig: simulationConfigWithLesson
        }
      });
      setAiSimResponse(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="stack">
      <div className="card hero-panel lesson-hero-gradient">
        <div className="brand-kicker">KNTech Lesson Engine</div>
        <h1 className="page-title">{data.ten}</h1>
        <p>{lessonDescription}</p>
        <div className="lesson-hero-stats">
          <div className="mini-stat"><strong>Coverage</strong><span>{theoryGroups.length} khối kiến thức sâu</span></div>
          <div className="mini-stat"><strong>Simulation</strong><span>{data.coMoPhong ? 'Three.js full 3D' : 'Theory mode'}</span></div>
          <div className="mini-stat"><strong>Resources</strong><span>{resources.length || 0} nguồn ngoài</span></div>
        </div>
        <div className="badge-row">
          <span className="badge badge-variant-0">Lớp {data.chuong.lop}</span>
          <span className="badge badge-variant-1">{lessonLabel}</span>
          <span className="badge badge-variant-2">{topicLabel(data)}</span>
          <span className="badge badge-variant-3">{data.coMoPhong ? simulationLabel : 'Lý thuyết'}</span>
          {simulationConfigWithLesson.sceneVariant ? <span className="badge badge-soft">Variant {String(simulationConfigWithLesson.sceneVariant)}</span> : null}
          <span className="badge badge-soft">{visualProfile.mode === 'image' ? 'Ảnh minh họa AI/sơ đồ' : 'Mô phỏng riêng theo bài'}</span>
        </div>
      </div>
      <div className="grid-2 lesson-layout">
        <div className="card stack">
          <div className="row-between wrap-mobile"><h3>Bài giảng phụ sâu</h3><span className="badge badge-variant-1">KNTech Theory Notes+</span></div>
          {theoryGroups.map(([title, contents]) => (
            <div key={title} className="knowledge-item">
              <div className="row-between wrap-mobile">
                <div className="knowledge-title">{title}</div>
                <span className="badge badge-soft">{contents.length} khối</span>
              </div>
              <MarkdownMath content={contents.join('\n\n---\n\n')} />
              <button className="button button-secondary" onClick={() => explain(title)} disabled={loadingAI}>
                {loadingAI ? 'KNTech đang gọi AI...' : `KNTech AI giải thích phần ${title}`}
              </button>
            </div>
          ))}
          {aiResponse ? (
            <div className="response-box stack">
              <strong>KNTech AI giải thích</strong>
              <MarkdownMath content={responseText(aiResponse)} />
            </div>
          ) : null}
        </div>
        <div className="stack">
          <div className="card stack lesson-sim-card">
            <div className="row-between wrap-mobile"><h3>{visualProfile.mode === 'image' ? 'Không gian minh họa trực quan' : 'Không gian mô phỏng 3D'}</h3><span className="badge badge-variant-2">{simulationLabel}</span></div>
            <PhysicsSimulation type={simulationType} params={simulationParams} config={simulationConfigWithLesson} title={data.ten} />
            <button className="button button-secondary" onClick={explainSimulation} disabled={loadingAI}>
              {loadingAI ? 'KNTech đang gọi AI...' : 'KNTech AI giải thích mô phỏng'}
            </button>
            {aiSimResponse ? (
              <div className="response-box stack">
                <strong>KNTech AI hướng dẫn mô phỏng</strong>
                <MarkdownMath content={responseText(aiSimResponse)} />
              </div>
            ) : null}
          </div>

          <div className="card stack">
            <div className="row-between wrap-mobile"><h4>KNTech AI Chat 1-1</h4><span className="badge badge-variant-0">Theo từng bài học</span></div>
            <div className="lesson-chat-box">
              {chatHistory.map((item, idx) => (
                <div key={idx} className={`chat-row ${item.role}`}>
                  {item.role === 'assistant' && <Avatar name="Nova KNTech" variant="brand" />}
                  <div className={`chat-bubble ${item.role === 'user' ? 'user' : 'assistant'}`}>
                    <div className="chat-meta"><strong>{item.role === 'user' ? 'Bạn' : 'Nova KNTech'}</strong><span>{item.at}</span></div>
                    <MarkdownMath content={item.text} />
                  </div>
                  {item.role === 'user' && <Avatar name="Bạn" variant="gradient" />}
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <textarea className="textarea" placeholder="Hỏi tiếp về bài này..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button className="button" onClick={sendChat} disabled={loadingAI || !chatInput.trim()}>{loadingAI ? 'Đang gọi...' : 'Gửi câu hỏi'}</button>
            </div>
            <div className="note-box">Bài học này được mở rộng thêm phần mục tiêu, công thức trọng tâm, bài toán mẫu và gợi ý cách quan sát mô phỏng.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
