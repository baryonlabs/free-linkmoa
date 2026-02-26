import { api } from '../utils/api.js';

export const linkTools = [
  {
    name: 'list_links',
    description: '현재 사용자의 링크 목록 조회 (position 순)',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_link',
    description: '새 링크 추가',
    inputSchema: {
      type: 'object',
      properties: {
        title:          { type: 'string', description: '링크 제목' },
        url:            { type: 'string', description: '링크 URL' },
        description:    { type: 'string', description: '설명' },
        type:           { type: 'string', description: 'link | youtube | spotify | social' },
        animation_type: { type: 'string', description: 'bounce | pulse | none' },
        highlight:      { type: 'boolean', description: '강조 표시' },
      },
      required: ['title', 'url'],
    },
  },
  {
    name: 'update_link',
    description: '링크 수정',
    inputSchema: {
      type: 'object',
      properties: {
        id:             { type: 'string', description: '링크 ID' },
        title:          { type: 'string' },
        url:            { type: 'string' },
        description:    { type: 'string' },
        type:           { type: 'string' },
        animation_type: { type: 'string' },
        highlight:      { type: 'boolean' },
        enabled:        { type: 'boolean', description: '활성화 여부' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_link',
    description: '링크 삭제',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '링크 ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'reorder_links',
    description: '링크 순서 변경',
    inputSchema: {
      type: 'object',
      properties: {
        links: {
          type: 'array',
          description: '[{id, position}] 배열',
          items: {
            type: 'object',
            properties: {
              id:       { type: 'string' },
              position: { type: 'number' },
            },
            required: ['id', 'position'],
          },
        },
      },
      required: ['links'],
    },
  },
];

export async function handleListLinks() {
  return api.get('/api/links');
}

export async function handleCreateLink(args: Record<string, unknown>) {
  if (!args.title || !args.url) throw new Error('title과 url은 필수입니다');
  return api.post('/api/links', args);
}

export async function handleUpdateLink(args: Record<string, unknown>) {
  if (!args.id) throw new Error('id는 필수입니다');
  const { id, ...body } = args;
  return api.patch(`/api/links/${id}`, body);
}

export async function handleDeleteLink(args: Record<string, unknown>) {
  if (!args.id) throw new Error('id는 필수입니다');
  return api.delete(`/api/links/${args.id}`);
}

export async function handleReorderLinks(args: Record<string, unknown>) {
  if (!Array.isArray(args.links)) throw new Error('links는 배열이어야 합니다');
  return api.post('/api/links/reorder', { links: args.links });
}
