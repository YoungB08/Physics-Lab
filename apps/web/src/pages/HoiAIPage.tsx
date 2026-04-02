import { useEffect, useMemo, useState } from 'react';
import { MarkdownMath } from '../components/MarkdownMath';
import { LoadingButton } from '../components/LoadingButton';
import { api } from '../services/api';

function responseText(response: any) {
  const detail = String(response?.du_lieu?.giai_thich || '').trim();
  if (detail) return detail;
  const blocks = response?.du_lieu?.noi_dung_chinh;
  if (Array.isArray(blocks) && blocks.length) return blocks.join('\n\n');
  return String(response?.du_lieu?.tom_tat || '').trim();
}

export function HoiAIPage() {
  const [providerStatus, setProviderStatus] = useState<any>({ gpt: false, gemini: false, local: true });
  const [provider, setProvider] = useState<'auto' | 'gpt' | 'gemini'>('auto');
  const [question, setQuestion] = useState('Giai thich vi sao khi tang cam ung tu thi ban kinh quy dao giam.');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.aiStatus().then(setProviderStatus).catch(() => undefined);
  }, []);

  const availableProviders = useMemo(() => {
    const arr: ('auto' | 'gpt' | 'gemini')[] = ['auto'];
    if (providerStatus.gpt) arr.push('gpt');
    if (providerStatus.gemini) arr.push('gemini');
    return arr;
  }, [providerStatus]);

  useEffect(() => {
    if (!availableProviders.includes(provider)) setProvider('auto');
  }, [availableProviders, provider]);

  async function ask() {
    try {
      setLoading(true);
      setError('');
      setResponse(null);
      const trimmed = question.trim();
      const result = await api.hoiAI({
        loaiTacVu: 'giai_bai',
        provider,
        noiDung: trimmed,
        boCanh: {
          chatMode: 'lesson_1_1',
          latestMessage: trimmed,
          lesson: 'hoi-ai-console',
          topic: 'vat-ly-thpt'
        }
      });
      setResponse(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const providerRows = [
    { name: 'KNTech Auto Router', status: true, note: 'Tu chon provider tot nhat hoac fallback noi bo' },
    {
      name: 'OpenAI GPT',
      status: providerStatus.gpt,
      note: providerStatus.gpt
        ? providerStatus.models?.gpt || 'San sang'
        : providerStatus.envLoaded?.hasOpenAIKey
          ? 'Co key nhung dang bi chan boi cau hinh cho phep'
          : 'Chua doc duoc OPENAI_API_KEY tu file .env hoac bien moi truong'
    },
    {
      name: 'Google Gemini',
      status: providerStatus.gemini,
      note: providerStatus.gemini
        ? providerStatus.models?.gemini || 'San sang'
        : providerStatus.envLoaded?.hasGeminiKey
          ? 'Co key nhung dang bi chan boi cau hinh cho phep'
          : 'Chua doc duoc GEMINI_API_KEY/GOOGLE_API_KEY tu file .env hoac bien moi truong'
    },
    { name: 'AI noi bo KNTech', status: true, note: 'Luon co de fallback' }
  ];

  const answer = responseText(response);

  return (
    <div className="stack">
      <div className="card hero-panel dashboard-gradient-cms">
        <div className="brand-kicker">KNTech AI Console</div>
        <h1 className="page-title">Hoi bai bang AI</h1>
        <p>Man hinh nay uu tien kieu chat 1-1 tu nhien. Neu ban chi gui mot cau chao nhu "Hi", AI se chao lai nhu mot nguoi that thay vi lap prompt he thong.</p>
      </div>
      <div className="grid-2">
        <div className="card stack">
          <h3>Provider kha dung</h3>
          <div className="table-wrap">
            <table className="table compact-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Trang thai</th>
                  <th>Ghi chu</th>
                </tr>
              </thead>
              <tbody>
                {providerRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td><span className={row.status ? 'status-pill success' : 'status-pill'}>{row.status ? 'On' : 'Off'}</span></td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="label">Chon nha cung cap</label>
          <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as any)}>
            {availableProviders.map((item) => (
              <option key={item} value={item}>
                {item === 'auto' ? 'Tu dong chon' : item.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="label">Cau hoi</label>
          <textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <LoadingButton onClick={ask} loading={loading} loadingText="KNTech dang goi AI..." disabled={!question.trim()}>
            Gui den KNTech AI
          </LoadingButton>
          {error && <div className="error-box">{error}</div>}
        </div>

        <div className="card stack">
          <div className="row-between">
            <h3>Ket qua tra loi</h3>
            {response?.trace?.usedExternal ? (
              <span className="badge badge-variant-2">AI ngoai</span>
            ) : response ? (
              <span className="badge badge-variant-3">Fallback noi bo</span>
            ) : null}
          </div>
          {response ? (
            <>
              {response.trace?.fallbackReason ? (
                <div className="error-box">External AI loi, KNTech da tu fallback: {response.trace.fallbackReason}</div>
              ) : null}
              {response.du_lieu?.tieu_de ? (
                <div className="response-box">
                  <strong>{response.du_lieu.tieu_de}</strong>
                  <div className="muted">{response.du_lieu.tom_tat}</div>
                </div>
              ) : null}
              <div className="chat-row assistant">
                <div className="chat-bubble assistant ai-console-bubble">
                  <div className="chat-meta">
                    <strong>Nova KNTech</strong>
                    <span>{response.trace?.model || response.trace?.resolvedProvider || 'AI'}</span>
                  </div>
                  <MarkdownMath content={answer || 'Khong co noi dung tra loi.'} />
                </div>
              </div>
            </>
          ) : (
            <div className="note-box">Cau tra loi that se hien o day sau khi gui.</div>
          )}
        </div>
      </div>
    </div>
  );
}
