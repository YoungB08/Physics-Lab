const SUSPICIOUS_MOJIBAKE = /\u00c3|\u00c6|\u00e2|\ufffd|\u00c4|\u00d0|\u00cf|\u00ce/;

function decodeLatin1AsUtf8(value: string) {
  const bytes = Uint8Array.from([...value].map((char) => char.charCodeAt(0) & 0xff));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function repairVietnameseText(input: unknown) {
  let value = typeof input === 'string' ? input : String(input ?? '');
  if (!value.trim()) return '';
  for (let i = 0; i < 3; i += 1) {
    if (!SUSPICIOUS_MOJIBAKE.test(value)) break;
    const repaired = decodeLatin1AsUtf8(value);
    if (!repaired || repaired === value) break;
    value = repaired;
  }
  return value.replace(/\ufffd/g, '').trim();
}
