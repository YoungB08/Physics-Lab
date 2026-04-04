import React from 'react';
import katex from 'katex';

type Props = { content?: string; className?: string };

type Node =
  | { type: 'h'; level: 1 | 2 | 3; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'math'; text: string; block: boolean }
  | { type: 'hr' };

const UNICODE_SUBSCRIPT_TO_DIGIT: Record<string, string> = {
  '\u2080': '0',
  '\u2081': '1',
  '\u2082': '2',
  '\u2083': '3',
  '\u2084': '4',
  '\u2085': '5',
  '\u2086': '6',
  '\u2087': '7',
  '\u2088': '8',
  '\u2089': '9'
};

const UNICODE_SUPERSCRIPT_TO_DIGIT: Record<string, string> = {
  '\u2070': '0',
  '\u00B9': '1',
  '\u00B2': '2',
  '\u00B3': '3',
  '\u2074': '4',
  '\u2075': '5',
  '\u2076': '6',
  '\u2077': '7',
  '\u2078': '8',
  '\u2079': '9'
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeMathSource(input: string) {
  return input
    .replace(/[\u2080-\u2089]/g, (char) => `_{${UNICODE_SUBSCRIPT_TO_DIGIT[char]}}`)
    .replace(/[\u2070\u00B9\u00B2\u00B3\u2074-\u2079]/g, (char) => `^{${UNICODE_SUPERSCRIPT_TO_DIGIT[char]}}`)
    .replace(/([A-Za-z])([0-9]+)(?=\b|[A-Za-z])/g, '$1_{$2}')
    .replace(/([A-Za-z])\^([0-9]+)/g, '$1^{$2}')
    .replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}')
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\bpi\b/g, '\\pi')
    .replace(/\bsqrt\(([^()]+)\)/g, '\\sqrt{$1}')
    .replace(/\u2264/g, '\\leq ')
    .replace(/\u2265/g, '\\geq ')
    .replace(/\u2260/g, '\\neq ')
    .replace(/\u2248/g, '\\approx ')
    .replace(/\u00D7/g, '\\times ')
    .replace(/\u00B7/g, '\\cdot ')
    .trim();
}

function isStandaloneMathExpression(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const hasLatexCommand = /\\[a-zA-Z]+/.test(trimmed);
  if (trimmed.includes('$') || trimmed.includes('\\(') || trimmed.includes('\\[')) return false;
  if (/[:;]/.test(trimmed) && !hasLatexCommand) return false;
  if (!/[=^_]/.test(trimmed) && !/\([^)]+\)\s*\/\s*\([^)]+\)/.test(trimmed) && !hasLatexCommand) return false;
  if (!hasLatexCommand && /[^A-Za-z0-9\s()+\-*/.=,\\{}[\]^_|]/.test(trimmed)) return false;
  return hasLatexCommand || /[A-Za-z]/.test(trimmed);
}

function isGarbageItem(text: string) {
  const trimmed = text.trim().toLowerCase();
  return !trimmed || trimmed === 'undefined' || trimmed === 'null';
}

function renderKatex(math: string, block: boolean) {
  const expression = normalizeMathSource(math);
  try {
    return katex.renderToString(expression, {
      displayMode: block,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html'
    });
  } catch {
    return escapeHtml(math);
  }
}

function katexNode(math: string, block: boolean, key: React.Key) {
  return (
    <span
      key={key}
      className={block ? 'math-block math-katex' : 'math-inline math-katex'}
      dangerouslySetInnerHTML={{ __html: renderKatex(math, block) }}
    />
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\\\([\s\S]*?\\\))|(\\\[[\s\S]*?\\\])|(\$\$[\s\S]*?\$\$)|(\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('\\(')) {
      parts.push(katexNode(token.slice(2, -2), false, key++));
    } else if (token.startsWith('\\[')) {
      parts.push(katexNode(token.slice(2, -2), false, key++));
    } else if (token.startsWith('$$')) {
      parts.push(katexNode(token.slice(2, -2), false, key++));
    } else if (token.startsWith('$')) {
      parts.push(katexNode(token.slice(1, -1), false, key++));
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function parse(content = ''): Node[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const lines = normalized.split('\n');
  const nodes: Node[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: 'hr' });
      i += 1;
      continue;
    }
    if (line.startsWith('```')) {
      i += 1;
      const buff: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) buff.push(lines[i++]);
      i += 1;
      nodes.push({ type: 'code', text: buff.join('\n') });
      continue;
    }
    if (line.startsWith('\\[') || line.startsWith('$$')) {
      const buff = [line.replace(/^\\\[/, '').replace(/^\$\$/, '')];
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith('\\]') && !lines[i].trim().endsWith('$$')) buff.push(lines[i++]);
      if (i < lines.length) buff.push(lines[i].replace(/\\\]$/, '').replace(/\$\$$/, ''));
      i += 1;
      nodes.push({ type: 'math', text: buff.join(' '), block: true });
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      nodes.push({ type: 'h', level: h[1].length as 1 | 2 | 3, text: h[2] });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[-*]\s+/, '');
        if (!isGarbageItem(item)) items.push(item);
        i += 1;
      }
      if (items.length) nodes.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+[.)]\s+/, '');
        if (!isGarbageItem(item)) items.push(item);
        i += 1;
      }
      if (items.length) nodes.push({ type: 'ol', items });
      continue;
    }

    const buff = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('\\[') &&
      !lines[i].startsWith('$$')
    ) {
      buff.push(lines[i].trim());
      i += 1;
    }

    const paragraph = buff.join(' ');
    if (isStandaloneMathExpression(paragraph)) {
      nodes.push({ type: 'math', text: paragraph, block: true });
    } else {
      nodes.push({ type: 'p', text: paragraph });
    }
  }

  return nodes;
}

export function MarkdownMath({ content, className = '' }: Props) {
  const nodes = parse(content);
  return (
    <div className={`kntech-markdown ${className}`.trim()}>
      {nodes.map((node, idx) => {
        switch (node.type) {
          case 'h':
            if (node.level === 1) return <h1 key={idx}>{renderInline(node.text)}</h1>;
            if (node.level === 2) return <h2 key={idx}>{renderInline(node.text)}</h2>;
            return <h3 key={idx}>{renderInline(node.text)}</h3>;
          case 'p':
            return <p key={idx}>{renderInline(node.text)}</p>;
          case 'ul':
            return <ul key={idx}>{node.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ul>;
          case 'ol':
            return <ol key={idx}>{node.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ol>;
          case 'code':
            return <pre key={idx}><code>{node.text}</code></pre>;
          case 'math':
            return <div key={idx}>{katexNode(node.text, node.block, `${idx}-block`)}</div>;
          case 'hr':
            return <hr key={idx} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
