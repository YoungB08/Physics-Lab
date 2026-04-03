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
  return cleanText(data?.chuDeThi, 'Chu de tong hop');
}

function responseText(response: any) {
  const blocks = response?.du_lieu?.noi_dung_chinh;
  if (Array.isArray(blocks) && blocks.length) return blocks.join('\n');
  return String(response?.du_lieu?.giai_thich || response?.du_lieu?.tom_tat || '');
}

function normalizeSectionTitle(title = '') {
  const fixedTitle = cleanText(title, 'Tong quan');
  const raw = normalizeVietnamese(fixedTitle);
  if (raw.includes('khai niem')) return 'Khai niem';
  if (raw.includes('cong thuc') && raw.includes('bien')) return 'Bien doi cong thuc';
  if (raw.includes('cong thuc')) return 'Cong thuc';
  if (raw.includes('don vi')) return 'Don vi';
  if (raw.includes('vi du')) return 'Vi du';
  if (raw.includes('bai tap')) return 'Bai tap';
  if (raw.includes('chien luoc')) return 'Chien luoc';
  if (raw.includes('sai lam')) return 'Sai lam thuong gap';
  if (raw.includes('phan tich')) return 'Phan tich chuyen sau';
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
    title: String(item.title || item.label || 'Tai nguyen ngoai'),
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
      setChatHistory([{
        role: 'assistant',
        text: `Chao ban, minh la **Nova KNTech**. Hien tai minh dang ho tro bai **${payload.ten}**. Ban co the hoi ve khai niem, cong thuc, cach giai nhanh, bai tap van dung hoac cach doc mo phong.`,
        at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    }).catch((e) => setError(e.message));
  }, [slug]);

  async function explain(partTitle: string) {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({
        loaiTacVu: 'giai_thich_ly_thuyet',
        provider: 'auto',
        noiDung: `Giai thich sau, dung ban chat vat ly, bam chuan THPT cho phan ${partTitle} cua bai ${data.ten}. Trinh bay bang markdown, co cong thuc neu can va nhan manh cac sai lam thuong gap.`,
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
      const result = await api.hoiAI({
        loaiTacVu: 'giai_bai',
        provider: 'auto',
        noiDung: `Theo ngu canh bai ${data.ten}: ${text}. Tra loi bang markdown, co cong thuc, buoc bien doi va nhac loi sai neu phu hop.`,
        boCanh: { lesson: data.ten, topic: topicLabel(data), lessonSlug: data.slug }
      });
      const safeAnswer = cleanText(responseText(result), 'KNTech AI chua tra ve noi dung hop le.');
      setAiResponse(result);
      setChatHistory((prev) => [...prev, { role: 'assistant', text: safeAnswer, at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  const enrichedSections = useMemo(() => buildExtendedSections(data, data?.phanKienThuc || []), [data]);
  const sectionGroups = useMemo(() => groupSections(enrichedSections), [enrichedSections]);

  if (error) return <div className="card error-box">{error}</div>;
  if (!data) return <div className="card">KNTech dang tai bai hoc...</div>;

  const inferredType = inferSimulationType(data);
  const configuredType = data.moPhong?.loaiMoPhong;
  const resolvedFallback = resolveVisualTypeForLesson({ ten: data.ten, moTa: data.moTa, chuongTen: data?.chuong?.ten, chuDeThi: data?.chuDeThi });
  const dbType = data.simulationType;
  const lessonBlueprint = resolveLessonSimulationBlueprint({ title: data.ten, slug: data.slug, topic: data?.chuDeThi, type: configuredType || dbType || inferredType });
  const exactBlueprintType = lessonBlueprint.matched ? lessonBlueprint.simulationType : undefined;
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
  const theoryGroups = Object.entries(sectionGroups);
  const resources = externalResources(simulationConfigWithLesson);
  const lessonDescription = cleanText(data.moTa, `${data.ten} duoc trinh bay theo ly thuyet, cong thuc trong tam va mo phong tuong ung.`);
  const lessonLabel = cleanText(data.chuong?.ten, 'Chu de vat ly');
  const simulationLabel = cleanText(preset?.label || simulationType, 'Mo phong vat ly');

  async function explainSimulation() {
    try {
      setLoadingAI(true);
      const result = await api.hoiAI({
        loaiTacVu: 'giai_thich_mo_phong',
        provider: 'auto',
        noiDung: `Giai thich mo phong cua bai ${data.ten}: muc tieu quan sat, cach thay tham so, du doan xu huong, lien he cong thuc va cac bay sai. Trinh bay markdown ro rang, uu tien checklist va cau hoi goi mo.`,
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
          <span className="badge badge-soft">{visualProfile.mode === 'image' ? 'Anh minh hoa AI/so do' : 'Mo phong rieng theo bai'}</span>
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
              <button className="button button-secondary" onClick={() => explain(title)} disabled={loadingAI}>
                {loadingAI ? 'KNTech dang goi AI...' : `KNTech AI giai thich phan ${title}`}
              </button>
            </div>
          ))}
          {aiResponse ? (
            <div className="response-box stack">
              <strong>KNTech AI giai thich</strong>
              <MarkdownMath content={responseText(aiResponse)} />
            </div>
          ) : null}
        </div>
        <div className="stack">
          <div className="card stack lesson-sim-card">
            <div className="row-between wrap-mobile"><h3>{visualProfile.mode === 'image' ? 'Khong gian minh hoa truc quan' : 'Khong gian mo phong 3D'}</h3><span className="badge badge-variant-2">{simulationLabel}</span></div>
            <PhysicsSimulation type={simulationType} params={simulationParams} config={simulationConfigWithLesson} title={data.ten} />
            <button className="button button-secondary" onClick={explainSimulation} disabled={loadingAI}>
              {loadingAI ? 'KNTech dang goi AI...' : 'KNTech AI giai thich mo phong'}
            </button>
            {aiSimResponse ? (
              <div className="response-box stack">
                <strong>KNTech AI huong dan mo phong</strong>
                <MarkdownMath content={responseText(aiSimResponse)} />
              </div>
            ) : null}
          </div>

          <div className="card stack">
            <div className="row-between wrap-mobile"><h4>KNTech AI Chat 1-1</h4><span className="badge badge-variant-0">Theo tung bai hoc</span></div>
            <div className="lesson-chat-box">
              {chatHistory.map((item, idx) => (
                <div key={idx} className={`chat-row ${item.role}`}>
                  {item.role === 'assistant' && <Avatar name="Nova KNTech" variant="brand" />}
                  <div className={`chat-bubble ${item.role === 'user' ? 'user' : 'assistant'}`}>
                    <div className="chat-meta"><strong>{item.role === 'user' ? 'Ban' : 'Nova KNTech'}</strong><span>{item.at}</span></div>
                    <MarkdownMath content={item.text} />
                  </div>
                  {item.role === 'user' && <Avatar name="Ban" variant="gradient" />}
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <textarea className="textarea" placeholder="Hoi tiep ve bai nay..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button className="button" onClick={sendChat} disabled={loadingAI || !chatInput.trim()}>{loadingAI ? 'Dang goi...' : 'Gui cau hoi'}</button>
            </div>
            <div className="note-box">Bai hoc nay duoc mo rong them phan muc tieu, cong thuc trong tam, bai toan mau va goi y cach quan sat mo phong.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
