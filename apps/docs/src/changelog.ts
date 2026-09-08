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

/** 按时间倒序维护；只有 npm 发布成功后才将状态改为 published。 */
export const releaseNotes: ReleaseNote[] = [
  {
    version: 'Unreleased',
    date: '2026-09-08',
    status: 'unreleased',
    title: '让每一次更新，都有迹可循',
    summary: '新增发版日志，并统一 YanCraft UI 品牌与组件包命名。',
    packages: ['文档工作台'],
    changes: [{ category: '新增', items: [
      '组件库正式命名为 YanCraft UI，统一页面品牌、文档及 @yancraft/vue、@yancraft/react 示例包名。',
      '新增发版日志入口和版本时间线，展示版本概述、更新日期、影响范围与分类变更。',
      '支持按版本查看、展开与收起详情，并提供升级说明的位置。',
      '区分待定版本、待发布和已发布状态，避免把开发记录误认为 npm 已发布版本。'
    ] }],
    upgrade: '组件 API 保持不变；本地示例包统一使用 @yancraft scope，使用早期包名的试用项目需同步更新依赖、导入和样式路径。包尚未发布 npm，发布前需确认 scope 权限。'
  },
  {
    version: '0.1.0',
    date: '2026-09-08',
    status: 'pending',
    title: '从组件到交付，搭好第一块积木',
    summary: '建立 Vue 组件开发、交互预览、React 适配和 npm 打包发布的基础框架。',
    packages: ['@yancraft/vue', '@yancraft/react', '文档工作台'],
    changes: [{ category: '新增', items: [
      '提供 ActionButton、StatCard、EmptyState 三个 Vue 3 + TypeScript 示例组件。',
      'ActionButton 与 EmptyState 支持 Ant Design Vue / Element Plus 双 UI 引擎。',
      '组件工作台支持搜索、分类、实时参数调节、使用代码复制、API 文档和源码查看。',
      '提供 React 包装层，支持属性更新、事件回调及卸载清理，并可在工作台中真实预览。',
      '接入 ESM、类型声明、样式构建、Changesets 版本管理及 npm 包消费验证。',
      '补充开发与发布指南，适配桌面和手机布局。'
    ] }],
    upgrade: '初始版本尚未发布 npm。首次使用前替换占位 scope 并完成发布，或安装本地打包的 tgz。React 适配仍依赖 Vue 运行时，不支持 React children 与组件内容的 SSR。'
  }
]
