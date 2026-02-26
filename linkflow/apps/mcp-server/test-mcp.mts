import { handleCreateLink, handleListLinks } from './src/tools/links.js';

console.log('🚀 MCP: YouTube, LinkedIn, GitHub 링크 3개 동시 추가 중...\n');

const [r1, r2, r3] = await Promise.all([
  handleCreateLink({ title: 'YouTube',  url: 'https://www.youtube.com/@codcatprofessor/shorts', description: 'AI 개발 Shorts',       type: 'youtube' }),
  handleCreateLink({ title: 'LinkedIn', url: 'https://www.linkedin.com/in/martin-hong-sw/',     description: 'Martin Hong 링크드인', type: 'social'  }),
  handleCreateLink({ title: 'GitHub',   url: 'https://github.com/Baryon-ai',                   description: 'Baryon Labs 오픈소스', type: 'link'    }),
]);

for (const [name, r] of [['YouTube', r1], ['LinkedIn', r2], ['GitHub', r3]] as const) {
  console.log(`✅ ${name} 추가됨 (id: ${(r as any).id?.slice(0, 8)}...)`);
}

console.log('\n📋 전체 링크 목록:');
const links = await handleListLinks() as any[];
links.forEach((l, i) => console.log(`  ${i + 1}. ${l.enabled ? '✅' : '⏸️'} ${l.title}`));
