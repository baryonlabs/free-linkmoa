// 링크로 저장·렌더링해도 되는 URL만 통과시킨다.
// javascript:, data:, vbscript: 등은 공개 프로필에서 클릭 시 스크립트로 실행되므로 거부한다.
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
