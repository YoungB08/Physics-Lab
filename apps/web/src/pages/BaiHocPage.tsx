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
import { repairVietnameseText } from '../utils/repairVietnameseText';

function looksCorruptedText(value: unknown) {
  if (typeof value !== 'string') return false;
  return /Ãƒ|Ã†|Ã¢|ï¿½|\bundefined\b|\bnull\b/i.test(value);
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const repaired = repairVietnameseText(value).trim();
  if (!repaired || looksCorruptedText(repaired)) return fallback;
  return repaired;
}

function inferSimulationType(data: any) {
  const text = `${data?.ten || ''} ${data?.moTa || ''} ${data?.chuong?.ten || ''} ${data?.chuDeThi || ''}`.toLowerCase();
  if (text.includes('Ã„â€˜Ã¡ÂºÂ³ng nhiÃ¡Â»â€¡t') || text.includes('dang nhiet')) return 'thermal-isothermal-3d';
  if (text.includes('Ã„â€˜Ã¡ÂºÂ³ng ÃƒÂ¡p') || text.includes('dang ap')) return 'thermal-isobaric-3d';
  if (text.includes('phÃ†Â°Ã†Â¡ng trÃƒÂ¬nh trÃ¡ÂºÂ¡ng thÃƒÂ¡i') || text.includes('phuong trinh trang thai')) return 'thermal-state-equation-3d';
  if (text.includes('nhiÃ¡Â»â€¡t Ã„â€˜Ã¡Â»â„¢') || text.includes('nhiet do') || text.includes('nÃ¡Â»â„¢i nÃ„Æ’ng') || text.includes('noi nang')) return 'thermal-kinetic-3d';
  if (text.includes('tia x')) return 'xray-tube-3d';
  if (text.includes('phÃƒÂ³ng xÃ¡ÂºÂ¡') || text.includes('phong xa')) return 'radioactive-decay-3d';
  if (text.includes('bohr')) return 'bohr-atom-3d';
  if (text.includes('cÃ¡ÂºÂ¥u tÃ¡ÂºÂ¡o hÃ¡ÂºÂ¡t nhÃƒÂ¢n') || text.includes('cau tao hat nhan')) return 'nuclear-structure-3d';
  if (text.includes('nÃ„Æ’ng lÃ†Â°Ã¡Â»Â£ng liÃƒÂªn kÃ¡ÂºÂ¿t') || text.includes('nang luong lien ket')) return 'binding-energy-3d';
  if (text.includes('phÃ¡ÂºÂ£n Ã¡Â»Â©ng hÃ¡ÂºÂ¡t nhÃƒÂ¢n') || text.includes('phan ung hat nhan')) return 'nuclear-reaction-3d';
  if (text.includes('kÃƒÂ­nh hiÃ¡Â»Æ’n vi') || text.includes('kinh hien vi')) return 'microscope-3d';
  if (text.includes('kÃƒÂ­nh thiÃƒÂªn vÃ„Æ’n') || text.includes('kinh thien van')) return 'telescope-3d';
  if (text.includes('kÃƒÂ­nh lÃƒÂºp') || text.includes('kinh lup')) return 'magnifier-3d';
  if (text.includes('mÃ¡ÂºÂ¯t') || text.includes('mat') || text.includes('tÃ¡ÂºÂ­t khÃƒÂºc xÃ¡ÂºÂ¡') || text.includes('tat khuc xa') || text.includes('cÃ¡ÂºÂ­n') || text.includes('can') || text.includes('viÃ¡Â»â€¦n') || text.includes('vien')) return 'eye-optics-3d';
  if (text.includes('khÃƒÂºc xÃ¡ÂºÂ¡') || text.includes('khuc xa')) return 'refraction-3d';
  if (text.includes('thÃ¡ÂºÂ¥u kÃƒÂ­nh') || text.includes('thau kinh')) return 'lens-3d';
  if (text.includes('trÃƒÂ²n') || text.includes('tron')) return 'circular-motion-3d';
  if (text.includes('newton')) return 'newton-laws-3d';
  if (text.includes('rÃ†Â¡i') || text.includes('roi')) return 'free-fall-3d';
  if (text.includes('ma sÃƒÂ¡t') || text.includes('ma sat')) return 'friction-plane-3d';
  if (text.includes('lÃƒÂ² xo') || text.includes('lo xo')) return 'spring-3d';
  if (text.includes('con lÃ¡ÂºÂ¯c') || text.includes('con lac')) return 'pendulum-3d';
  if (text.includes('Ã„â€˜iÃ¡Â»â€¡n trÃ†Â°Ã¡Â»Âng') || text.includes('dien truong')) return 'electric-field-3d';
  if (text.includes('coulomb')) return 'coulomb-3d';
  if (text.includes('giao thoa')) return 'interference-3d';
  if (text.includes('sÃƒÂ³ng dÃ¡Â»Â«ng') || text.includes('song dung')) return 'standing-wave-3d';
  if (text.includes('sÃƒÂ³ng') || text.includes('song')) return 'wave-3d';
  if (text.includes('lÃ¡Â»Â±c lorentz') || text.includes('luc lorentz') || text.includes('hÃ¡ÂºÂ¡t tÃƒÂ­ch Ã„â€˜iÃ¡Â»â€¡n trong tÃ¡Â»Â« trÃ†Â°Ã¡Â»Âng') || text.includes('hat tich dien trong tu truong')) return 'magnetic-helix-3d';
  if (text.includes('tÃ¡Â»Â« trÃ†Â°Ã¡Â»Âng') || text.includes('tu truong')) return 'magnetic-field-lines-3d';
  if (text.includes('cÃ¡ÂºÂ£m Ã¡Â»Â©ng') || text.includes('cam ung')) return 'induction-3d';
  if (text.includes('rlc')) return 'rlc-3d';
  if (text.includes('biÃ¡ÂºÂ¿n ÃƒÂ¡p') || text.includes('bien ap')) return 'transformer-3d';
  return 'default';
}

function topicLabel(data: any) {
  return repairVietnameseText(data?.chuDeThi || 'Chu de tong hop');
}

function responseText(response: any) {
  const blocks = response?.du_lieu?.noi_dung_chinh;
  if (Array.isArray(blocks) && blocks.length) return blocks.join('\n');
  return String(response?.du_lieu?.giai_thich || response?.du_lieu?.tom_tat || '');
}

function normalizeSectionTitle(title = '') {
  const fixedTitle = repairVietnameseText(title);
  const raw = fixedTitle.toLowerCase();
  if (raw.includes('khai niem')) return 'Khai niem';
  if (raw.includes('cong thuc') && raw.includes('bien')) return 'Bien doi cong thuc';
  if (raw.includes('cong thuc')) return 'Cong thuc';
  if (raw.includes('don vi')) return 'Don vi';
  if (raw.includes('vi du')) return 'Vi du';
  if (raw.includes('bai tap')) return 'Bai tap';
  if (raw.includes('chien luoc')) return 'Chien luoc';
  if (raw.includes('sai lam')) return 'Sai lam thuong gap';
  if (raw.includes('phan tich')) return 'Phan tich chuyen sau';
  return fixedTitle || 'Tong quan';
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
    title: repairVietnameseText(String(item.title || item.label || 'Tai nguyen ngoai')),
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
  const [error, setError] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    api.getBaiHoc(slug).then((payload) => {
      setData(payload);
      setChatHistory([{ role: 'assistant', text: `ChÃƒÆ’Ã‚Â o bÃƒÂ¡Ã‚ÂºÃ‚Â¡n, mÃƒÆ’Ã‚Â¬nh lÃƒÆ’Ã‚Â  **Nova KNTech**. MÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬Ëœang ÃƒÂ¡Ã‚Â»Ã…Â¸ bÃƒÆ’Ã‚Â i **${payload.ten}**. BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ thÃƒÂ¡Ã‚Â»Ã†â€™ hÃƒÂ¡Ã‚Â»Ã‚Âi sÃƒÆ’Ã‚Â¢u vÃƒÂ¡Ã‚Â»Ã‚Â khÃƒÆ’Ã‚Â¡i niÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡m, cÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã‚Â©c, bÃƒÂ¡Ã‚ÂºÃ‚Â«y sai, chiÃƒÂ¡Ã‚ÂºÃ‚Â¿n lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c lÃƒÆ’Ã‚Â m nhanh hoÃƒÂ¡Ã‚ÂºÃ‚Â·c bÃƒÆ’Ã‚Â i tÃƒÂ¡Ã‚ÂºÃ‚Â­p vÃƒÂ¡Ã‚ÂºÃ‚Â­n dÃƒÂ¡Ã‚Â»Ã‚Â¥ng.`, at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
      setChatHistory([{
        role: 'assistant',
        text: `Chào bạn, mình là **Nova KNTech**. Hiện tại mình đang hỗ trợ bài **${payload.ten}**. Bạn có thể hỏi về khái niệm, công thức, cách giải nhanh, bài tập vận dụng hoặc cách đọc mô phỏng.`,
        at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    }).catch((e) => setError(e.message));
  }, [slug]);

  async function explain(partTitle: string) {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({ loaiTacVu: 'giai_thich_ly_thuyet', provider: 'auto', noiDung: `GiÃƒÂ¡Ã‚ÂºÃ‚Â£i thÃƒÆ’Ã‚Â­ch sÃƒÆ’Ã‚Â¢u, Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Âºng bÃƒÂ¡Ã‚ÂºÃ‚Â£n chÃƒÂ¡Ã‚ÂºÃ‚Â¥t vÃƒÂ¡Ã‚ÂºÃ‚Â­t lÃƒÆ’Ã‚Â½, bÃƒÆ’Ã‚Â¡m chuÃƒÂ¡Ã‚ÂºÃ‚Â©n THPT 2025-2026 cho phÃƒÂ¡Ã‚ÂºÃ‚Â§n ${partTitle} cÃƒÂ¡Ã‚Â»Ã‚Â§a bÃƒÆ’Ã‚Â i ${data.ten}. TrÃƒÆ’Ã‚Â¬nh bÃƒÆ’Ã‚Â y bÃƒÂ¡Ã‚ÂºÃ‚Â±ng markdown, cÃƒÆ’Ã‚Â³ cÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã‚Â©c nÃƒÂ¡Ã‚ÂºÃ‚Â¿u cÃƒÂ¡Ã‚ÂºÃ‚Â§n vÃƒÆ’Ã‚Â  nhÃƒÂ¡Ã‚ÂºÃ‚Â¥n mÃƒÂ¡Ã‚ÂºÃ‚Â¡nh sai lÃƒÂ¡Ã‚ÂºÃ‚Â§m hay gÃƒÂ¡Ã‚ÂºÃ‚Â·p.`, boCanh: { lesson: data.ten, topic: topicLabel(data) } });
      setAiResponse(result);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingAI(false); }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { role: 'user', text, at: now }]);
    setChatInput('');
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({ loaiTacVu: 'giai_bai', provider: 'auto', noiDung: `Theo ngÃƒÂ¡Ã‚Â»Ã‚Â¯ cÃƒÂ¡Ã‚ÂºÃ‚Â£nh bÃƒÆ’Ã‚Â i ${data.ten}: ${text}. TrÃƒÂ¡Ã‚ÂºÃ‚Â£ lÃƒÂ¡Ã‚Â»Ã‚Âi bÃƒÂ¡Ã‚ÂºÃ‚Â±ng markdown, cÃƒÆ’Ã‚Â³ cÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã‚Â©c, bÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc biÃƒÂ¡Ã‚ÂºÃ‚Â¿n Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢i vÃƒÆ’Ã‚Â  nhÃƒÂ¡Ã‚ÂºÃ‚Â¯c lÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¦ sai nÃƒÂ¡Ã‚ÂºÃ‚Â¿u phÃƒÆ’Ã‚Â¹ hÃƒÂ¡Ã‚Â»Ã‚Â£p.`, boCanh: { lesson: data.ten, topic: topicLabel(data), lessonSlug: data.slug } });
      const safeAnswer = cleanText(responseText(result), 'KNTech AI chua tra ve noi dung hop le.');
      setAiResponse(result);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: safeAnswer, at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
      return;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  async function explainSimulation() {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({
        loaiTacVu: 'giai_thich_mo_phong',
        provider: 'auto',
        noiDung: `GiÃƒÂ¡Ã‚ÂºÃ‚Â£i thÃƒÆ’Ã‚Â­ch mÃƒÆ’Ã‚Â´ phÃƒÂ¡Ã‚Â»Ã‚Âng cÃƒÂ¡Ã‚Â»Ã‚Â§a bÃƒÆ’Ã‚Â i ${data.ten}: mÃƒÂ¡Ã‚Â»Ã‚Â¥c tiÃƒÆ’Ã‚Âªu quan sÃƒÆ’Ã‚Â¡t, cÃƒÆ’Ã‚Â¡ch thay tham sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ, dÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœoÃƒÆ’Ã‚Â¡n xu hÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng, liÃƒÆ’Ã‚Âªn hÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ cÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã‚Â©c vÃƒÆ’Ã‚Â  cÃƒÆ’Ã‚Â¡c bÃƒÂ¡Ã‚ÂºÃ‚Â«y sai. TrÃƒÆ’Ã‚Â¬nh bÃƒÆ’Ã‚Â y markdown rÃƒÆ’Ã‚Âµ rÃƒÆ’Ã‚Â ng, Ãƒâ€ Ã‚Â°u tiÃƒÆ’Ã‚Âªn checklist vÃƒÆ’Ã‚Â  cÃƒÆ’Ã‚Â¢u hÃƒÂ¡Ã‚Â»Ã‚Âi gÃƒÂ¡Ã‚Â»Ã‚Â£i mÃƒÂ¡Ã‚Â»Ã…Â¸.`,
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

  const enrichedSections = useMemo(() => buildExtendedSections(data, data?.phanKienThuc || []), [data]);
  const sectionGroups = useMemo(() => groupSections(enrichedSections), [enrichedSections]);

  if (error) return <div className="card error-box">{error}</div>;
  if (!data) return <div className="card">KNTech đang tải bài học...</div>;

  const inferredType = inferSimulationType(data);
  const configuredType = data.moPhong?.loaiMoPhong;
  const resolvedFallback = resolveVisualTypeForLesson({ ten: data.ten, moTa: data.moTa, chuongTen: data?.chuong?.ten, chuDeThi: data?.chuDeThi });
  const dbType = data.simulationType;
  const lessonBlueprint = resolveLessonSimulationBlueprint({ title: data.ten, slug: data.slug, topic: data?.chuDeThi, type: configuredType || dbType || inferredType });
  const exactBlueprintType = lessonBlueprint.matched ? lessonBlueprint.simulationType : undefined;
  const configuredSimulationType = configuredType && configuredType !== 'default' ? configuredType : undefined;
  const dbSimulationType = dbType && dbType !== 'default' ? dbType : undefined;
  const inferredSimulationType = inferredType !== 'default' ? inferredType : undefined;
  const simulationType =
    exactBlueprintType
    || configuredSimulationType
    || dbSimulationType
    || inferredSimulationType
    || resolvedFallback;
  const lessonScene = resolveLessonScene({ title: data.ten, slug: data.slug, fallbackSceneKind: getVisualProfile(simulationType).sceneKind });
  const preset = findSimulationPreset(simulationType);
  const baseSimulationConfig = data.moPhong?.cauHinhJson || {};
  const visualProfile = getVisualProfile(simulationType);
  const simulationConfig = {
    ...baseSimulationConfig,
    sceneVariant: baseSimulationConfig.sceneVariant || data.slug,
    variantKey: baseSimulationConfig.variantKey || `${data.slug}:${simulationType}:${data.ten}`,
    strategyTitle: 'Chien luoc quan sat'
  };
  const simulationConfigWithLesson = {
    ...simulationConfig,
    sceneId: lessonScene.sceneId,
    lessonSlug: data.slug,
    lessonTitle: data.ten,
    lessonTopic: topicLabel(data),
    lessonComponents: lessonBlueprint.components,
    lessonFocus: lessonBlueprint.focus
  };
  const simulationParams = data.moPhong?.thamSoJson || preset?.defaultParams || { quality: 'ultra', precision: 'exam-mode', topic: topicLabel(data) };
  const showSimulation = true;
  const theoryGroups = Object.entries(sectionGroups);
  const resources = externalResources(simulationConfigWithLesson);
  const lessonDescription = cleanText(data.moTa, `${data.ten} được trình bày theo lý thuyết, công thức trọng tâm và mô phỏng tương ứng.`);
  const lessonLabel = cleanText(data.chuong?.ten, 'Chủ đề vật lý');
  const simulationLabel = cleanText(preset?.label || simulationType, 'Mô phỏng vật lý');

  return (
    <div className="stack">
      <div className="card hero-panel lesson-hero-gradient">
        <div className="brand-kicker">KNTech Lesson Engine</div>
        <h1 className="page-title">{data.ten}</h1>
        <p>{lessonDescription}</p>
        <div className="lesson-hero-stats">
          <div className="mini-stat"><strong>Coverage</strong><span>{theoryGroups.length} khoi kien thuc sau</span></div>
          <div className="mini-stat"><strong>Simulation</strong><span>{data.coMoPhong ? 'Three.js full 3D' : 'Theory mode'}</span></div>
          <div className="mini-stat"><strong>Resources</strong><span>{resources.length || 0} nguon ngoai</span></div>
        </div>
        <div className="badge-row">
          <span className="badge badge-variant-0">Tag lop {data.chuong.lop}</span>
          <span className="badge badge-variant-1">{lessonLabel}</span>
          <span className="badge badge-variant-2">{topicLabel(data)}</span>
          <span className="badge badge-variant-3">{data.coMoPhong ? simulationLabel : 'Ly thuyet'}</span>
          {simulationConfigWithLesson.sceneVariant ? <span className="badge badge-soft">Variant {String(simulationConfigWithLesson.sceneVariant)}</span> : null}
          <span className="badge badge-soft">{visualProfile.mode === 'image' ? 'Ảnh minh họa AI/sơ đồ' : 'Mô phỏng riêng theo bài'}</span>
        </div>
      </div>
      <div className="grid-2 lesson-layout">
        <div className="card stack">
          <div className="row-between wrap-mobile"><h3>Bai giang phu sau</h3><span className="badge badge-variant-1">KNTech Theory Notes+</span></div>
          {theoryGroups.map(([title, contents]) => (
            <div key={title} className="knowledge-item">
              <div className="row-between wrap-mobile">
                <div className="knowledge-title">{title}</div>
                <span className="badge badge-soft">{contents.length} block</span>
              </div>
              <MarkdownMath content={contents.join('\n\n---\n\n')} />
              <button className="button button-secondary" onClick={() => explain(title)} disabled={loadingAI}>{loadingAI ? 'KNTech đang gọi AI...' : `KNTech AI giải thích phần ${title}`}</button>
            </div>
          ))}
          {aiResponse && <div className="response-box stack">
            <strong>KNTech AI giải thích</strong>
            <MarkdownMath content={responseText(aiResponse)} />
          </div>}
        </div>
        <div className="stack">
          {showSimulation ? (
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
          ) : null}

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
              <button className="button" onClick={sendChat} disabled={loadingAI || !chatInput.trim()}>{loadingAI ? 'Đang gửi...' : 'Gửi câu hỏi'}</button>
            </div>
            <div className="note-box">Bài học này được mở rộng thêm phần mục tiêu, công thức trọng tâm, bài toán mẫu và gợi ý cách quan sát mô phỏng.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
