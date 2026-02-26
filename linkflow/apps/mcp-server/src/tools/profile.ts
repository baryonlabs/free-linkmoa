import { api } from '../utils/api.js';

export const profileTools = [
  {
    name: 'get_profile',
    description: '현재 사용자 프로필 조회',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_profile',
    description: '프로필 수정 (이름, 소개글, 아바타 등)',
    inputSchema: {
      type: 'object',
      properties: {
        title:           { type: 'string', description: '프로필 이름/타이틀' },
        bio:             { type: 'string', description: '소개글' },
        avatar_url:      { type: 'string', description: '아바타 이미지 URL' },
        seo_title:       { type: 'string', description: 'SEO 제목' },
        seo_description: { type: 'string', description: 'SEO 설명' },
      },
      required: [],
    },
  },
];

export async function handleGetProfile() {
  return api.get('/api/profile');
}

export async function handleUpdateProfile(args: Record<string, unknown>) {
  return api.patch('/api/profile', args);
}
