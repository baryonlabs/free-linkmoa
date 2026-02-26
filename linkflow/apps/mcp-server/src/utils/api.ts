/**
 * Vercel API HTTP 클라이언트
 * LINKFLOW_URL + LINKFLOW_TOKEN 환경변수 사용
 */

const LINKFLOW_URL = (process.env.LINKFLOW_URL || 'https://free-linkmoa.vercel.app').replace(/\/$/, '');

function getToken(): string {
  const token = process.env.LINKFLOW_TOKEN;
  if (!token) throw new Error('LINKFLOW_TOKEN 환경변수가 설정되지 않았습니다. mcp-setup.sh를 실행하세요.');
  return token;
}

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${LINKFLOW_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) {
    throw new Error((data as any).error || `HTTP ${res.status}: ${path}`);
  }
  return data;
}

export const api = {
  get:    (path: string)                  => request('GET',    path),
  post:   (path: string, body: unknown)   => request('POST',   path, body),
  patch:  (path: string, body: unknown)   => request('PATCH',  path, body),
  delete: (path: string)                  => request('DELETE', path),
};
