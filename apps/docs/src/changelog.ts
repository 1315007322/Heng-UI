export type ChangeCategory = '新增' | '优化' | '修复' | '不兼容变更'
export interface ReleaseNote {
  version: string
  date: string
  status: 'unreleased' | 'pending' | 'published'
  title: string
  summary: string
  packages: string[]
  changes: { category: ChangeCategory; items: string[] }[]
  upgrade?: string
}

/** 按时间倒序维护；完成对应版本发布后将状态改为 published。 */
export const releaseNotes: ReleaseNote[] = [
  {
    version: '0.2.0',
    date: '2026-09-21',
    status: 'pending',
    title: '让代码与内容，在同一处被认真书写',
    summary: '新增面向主流编程语言与 Markdown 内容的 CodeEditor，并完善 Vue、React 双端接入和组件文档。',
    packages: ['@yancraft/vue', '@yancraft/react', '文档工作台'],
    changes: [{ category: '新增', items: [
      '新增 CodeEditor 多语言编辑器，内置 JavaScript、TypeScript、Vue、JSX、TSX、HTML、CSS、SCSS、JSON、Java、Python、SQL 与 Markdown 支持。',
      '提供 Markdown 编辑、分栏和预览三种模式，预览内容经过安全过滤。',
      '支持明暗主题、只读模式、行号、自动换行、缩进尺寸、占位提示以及受控内容更新。',
      'Vue 组件通过 v-model 接入，React 适配层提供 value 与 onChange 接口。',
      '补充编辑器实验室、API 文档、源码示例和自动化测试。'
    ] }],
    upgrade: '这是向后兼容的功能版本。现有组件 API 无需调整；升级依赖后即可按需导入 CodeEditor。'
  },
  {
    version: '0.1.0',
    date: '2026-09-08',
    status: 'published',
    title: '从组件到交付，搭好第一块积木',
    summary: '建立 Vue 组件开发、交互预览、React 适配和 npm 打包发布的基础框架。',
    packages: ['@yancraft/vue', '@yancraft/react', '文档工作台'],
    changes: [{ category: '新增', items: [
      '提供 ActionButton、StatCard、EmptyState 三个 Vue 3 + TypeScript 示例组件。',
      'ActionButton 与 EmptyState 支持 Ant Design Vue / Element Plus 双 UI 引擎。',
      '组件工作台支持搜索、分类、实时参数调节、使用代码复制、API 文档和源码查看。',
      '提供 React 包装层，支持属性更新、事件回调及卸载清理，并可在工作台中真实预览。',
      '接入 ESM、类型声明、样式构建、Changesets 版本管理及 npm 包消费验证。',
      '补充开发与发布指南，适配桌面和手机布局。',
      '新增 GanttChart 通用资源甘特图，支持虚拟时间轴、拖动、缩放、不可用时段与重叠校验。',
      '统一 YanCraft UI 品牌，并加入按版本维护的发版日志。'
    ] }],
    upgrade: '这是 YanCraft UI 的首个 GitHub 版本；npm 包从 v0.2.0 开始公开发布。React 适配依赖 Vue 运行时，不支持 React children 与组件内容的 SSR。'
  }
]
