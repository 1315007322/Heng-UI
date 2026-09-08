# YanCraft UI · 前端组件平台

YanCraft 旗下的组件库，由颜恒富（Hengfu Yan）构建。**Thoughtfully written. Carefully built.**

Vue 3 + TypeScript 组件开发工作台，包含真实用例、可编辑参数、API 文档、源码预览和 npm 构建发布流程。支持 Ant Design Vue / Element Plus；提供 React 运行时适配包。

> `@yancraft/*` 为占位包名，当前未发布。首次发布前须替换为自己有权限的 npm scope。平台不包含账号系统、远程组件上传或网页直接发布 npm；当前是面向开发者的本地组件研发与文档框架。

## 启动

使用 Node.js 22.12+（建议 Node 22 LTS）和 npm 10+。

```bash
npm install
npm run dev
# http://127.0.0.1:5173
```

工作台支持组件搜索、分类筛选、Vue / React 实际预览、UI 引擎切换、参数调整、代码复制、API 表格、源码和开发 / 发布指南。Hash 链接保存当前页面与组件；演示参数仅在当前会话保留。

## 目录与开发模式

```text
apps/docs/                 Vite + Vue 文档工作台
  src/catalog.ts           组件目录、说明、API、源码引用
  src/App.vue              用例与参数面板
  src/ReactPreview.vue     挂载真实 React 消费场景
packages/vue/
  src/components/          Vue SFC，业务组件唯一实现
  src/types.ts             公开 props 类型
  src/index.ts             npm 导出入口
packages/react/
  src/index.tsx            类型化 React 包装组件
tests/                     Vue 行为、React 生命周期、端到端验证
.changeset/                版本管理配置
```

日常开发：修改组件 → 文档站热更新 → 调整用例 / API 文档 → 测试 → Changeset → 构建发布。文档站开发直接引用源码；发布包只包含 dist 和说明文件。

新增组件（参考 ActionButton）：

1. 在 `packages/vue/src/types.ts` 定义公共接口。
2. 在 `packages/vue/src/components/` 编写 `.vue`；组件 props / emits 类型明确，CSS 使用 `ak-` 前缀。
3. 在 Vue 包 `src/index.ts` 导出。直接导入使用，不需要全局 `app.use()`。
4. 在 `apps/docs/src/catalog.ts` 注册名称、说明、API、源码；在 App.vue 的组件映射、参数与预览中添加用例。
5. 需要 React 时，在 `packages/react/src/index.tsx` 用 `bridge<Props & Events>(VueComponent, 'Name')` 导出；在 ReactPreview.vue 注册预览。**这是显式注册，不是任意 Vue 文件的自动转换。**
6. 添加有意义的交互测试，运行 `npm run check`。

当前框架优先把完整开发链路跑通。组件数量增加时，建议把各组件的示例和参数编辑器拆成独立文件，并由目录注册表关联；复杂文档可后续迁移 VitePress / Storybook。

## 内置组件

| 组件 | 用途 | UI 支持 | 事件 |
| --- | --- | --- | --- |
| ActionButton | 主 / 次 / 危险按钮、尺寸、加载、禁用 | `ui="ant"` 或 `ui="element"` | Vue `click` / React `onClick` |
| StatCard | 指标与百分比变化展示 | 独立样式 | 无 |
| EmptyState | 空状态、引导操作，可隐藏按钮 | 双引擎按钮 | Vue `action` / React `onAction` |

StatCard 折线为装饰示意，不代表真实趋势数据。

## 消费 Vue 包

发布后（或通过本地 tgz 安装）：

```bash
npm install @yancraft/vue vue ant-design-vue element-plus
```

```vue
<script setup lang="ts">
import { ActionButton, StatCard } from '@yancraft/vue'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'
const save = () => console.log('save')
</script>

<template>
  <ActionButton ui="element" label="保存" @click="save" />
  <StatCard title="订单总量" :value="2048" :change="-2.4" />
</template>
```

Ant Design Vue 4 使用 CSS-in-JS；Element Plus 需引入其 CSS。示例入口同时静态引用两套 UI 库，因此两者当前都是 peerDependencies。**切换 ui 是运行时选择，不会自动从安装依赖中移除另一套 UI 库。** 需要减小消费依赖时，可进一步拆分 `vue-ant` / `vue-element` 渲染包。React 的 `antd` 与 `ant-design-vue` 是不同实现，本项目 Vue 组件使用后者。

独立组件主题变量：`--ak-surface`、`--ak-border`、`--ak-text`、`--ak-muted`。Element 使用自身 CSS 变量；Vue 消费端可用 Ant Design Vue ConfigProvider 设置主题。文档站的品牌主题配置不包含在组件 API 内。

## 消费 React 包与兼容边界

```bash
npm install @yancraft/react react react-dom vue ant-design-vue element-plus
```

```tsx
'use client'
import { ActionButton, EmptyState } from '@yancraft/react'
import '@yancraft/vue/style.css'
import 'element-plus/dist/index.css'

export default function Page() {
  return <>
    <ActionButton ui="element" label="保存" onClick={() => console.log('save')} />
    <EmptyState onAction={() => console.log('create')} />
  </>
}
```

包装层创建独立 Vue app，传递 props 和回调，在 React 卸载时销毁 Vue app。它支持 React StrictMode 重挂载、属性更新、属性删除和回调替换。

- 不把 Vue 源码编译成原生 React；保留 Vue 运行时成本。React 包的 Vue 依赖由 peerDependencies 声明。
- 当前包装层只支持数据 props 与事件，不接受 React children / render props，不桥接 Vue 作用域插槽。Vue 包内 ActionButton 仍可使用默认插槽。
- 每个包装组件是独立 Vue app，不自动继承 React Context 或外部 Vue ConfigProvider / provide。React 中 Ant Design 使用默认主题；如需统一主题，可扩展 bridge 的根组件包裹 ConfigProvider，或提供显式主题 props。
- SSR 仅渲染空宿主 div，实际内容在客户端 effect 挂载，不提供 Vue 内容的服务端渲染。Next.js 调用文件需标记 `'use client'`。
- 包装层 host 是 div，会影响布局；className / style 作用于 host。不要放进 `<p>` 或其他不允许 div 的结构中。
- 若要求原生 React 插槽、上下文和 SSR，应共享业务逻辑与设计变量，分别实现 Vue / React 视图。
- Vue Custom Elements 是另一条跨框架路径，但与第三方组件库一起使用时需处理 Shadow DOM 样式、弹层 Teleport 和 provide/inject。本框架选用显式挂载以保持 Vue UI 库行为。

## 检查、构建与本地试装

```bash
npm run typecheck
npm test
npm run build
# 或运行上述检查以及真实 tarball 消费验证
npm run check

# 首次浏览器测试需要安装浏览器
npx playwright install chromium
npm run test:e2e

npm run pack:check
npm pack -w @yancraft/vue
npm pack -w @yancraft/react
```

`npm run test:packages` 将真实 npm tarball 解压到独立消费目录，检查公开类型和 Vite 打包，不使用源码 aliases。需先构建；需要系统 `tar` 命令（Windows 10/11、macOS、常见 Linux 均通常自带）。临时消费产物保留在 Git 忽略的 `.package-check-*` 目录，方便检查。

Vue 包输出 `dist/index.js`、类型声明和 `dist/style.css`，React 包输出 ESM 和类型声明。仅支持现代 ESM 构建项目，未提供 CommonJS。外部化 Vue、React 和 UI 库，消费者安装 peerDependencies。npm pack 会通过 prepack 重建包。

本地 React 消费项目需在同一次 `npm install` 中安装两个 tgz，以满足 React 包对 Vue 包的依赖（占位包尚未在 registry 存在）：

```bash
npm install /path/yancraft-vue-0.1.0.tgz /path/yancraft-react-0.1.0.tgz
```

## 发版日志维护

工作台侧栏「发版日志」按时间倒序展示版本概述、日期、影响包、新增 / 优化 / 修复 / 不兼容变更及升级说明，支持按版本查看和展开收起。

日志内容统一维护在 `apps/docs/src/changelog.ts` 的 `releaseNotes` 数组中，新增版本时放在数组开头：

```ts
{
  version: '0.2.0',
  date: 'YYYY-MM-DD',
  status: 'pending',
  title: '本次版本主题',
  summary: '概述使用者能获得的变化。',
  packages: ['@yancraft/vue'],
  changes: [
    { category: '新增', items: ['具体新增能力及使用场景。'] },
    { category: '修复', items: ['问题的触发场景和修复后的行为。'] }
  ],
  upgrade: '说明升级操作、兼容性以及是否需要修改业务代码。'
}
```

以上是格式示例，不代表已有 0.2.0 版本。`unreleased` 表示版本待定，`pending` 表示待发布；只有 npm 发布成功后才改成 `published`，同时将日期更新为实际发布日期。当前提供真实的 0.1.0 初始功能记录与本次工作台更新记录，不编造历史发版。

Changesets 负责包版本和包内 CHANGELOG；此页面的用户向版本说明目前由维护者编辑，不会自动从 npm 或 Changesets 同步。发版时对照生成的 CHANGELOG 更新这里的描述、包范围和状态，并重新构建部署文档站。

## npm 发布

1. 将所有 `@yancraft` 替换为自己有权限的 scope（包含 package.json、Changesets fixed 配置、导入、Vite / TS aliases、测试和文档），运行 npm install 更新锁文件。修改许可证与作者信息以匹配实际项目。
2. 在 npm 创建或确认组织 / scope 权限。仓库不保存 token。
3. 执行检查并检查 `npm run pack:check` 输出，确认只有公开的产物。
4. 日常更新执行以下版本流程，首次可发布 0.1.0。

```bash
npm run changeset
npm run version-packages
npm install
# 提交源码、版本、CHANGELOG、package-lock.json
npm login
npm whoami
npm run release
```

`release` 先运行类型、单元测试和全部构建，再由 Changesets 按包依赖关系发布公开包。Vue 与 React 包固定版本组同步升级。Changesets baseBranch 为 master，若仓库采用其他主分支，修改 `.changeset/config.json`。首次使用 Changesets 前需要有初始 Git 提交和主分支。

npm 发布是外部操作，登录及二次验证通过终端完成；工作台页面不会直接发布。Git push 只推送代码，不等于 npm publish。远程仓库设置好后自行执行 Git 提交 / push；本次脚手架未自动创建远程仓库或发布任何包。

文档站产物为 `apps/docs/dist`，独立部署到静态站点服务即可。子路径部署需要设置 `apps/docs/vite.config.ts` 的 base；导航采用 hash，不需要路由回退规则。Google Fonts 仅用于文档站装饰字体；离线会回退到本地中文字体，不影响组件功能。

## 技术依据

- [Vite Library Mode](https://vite.dev/guide/build.html#library-mode)：组件库构建与 external 依赖。
- [Vue Web Components](https://vuejs.org/guide/extras/web-components.html)：跨框架选项、插槽和上下文限制。
- [Ant Design Vue](https://antdv.com/docs/vue/introduce)：Vue 对应的 Ant Design 实现。
- [Element Plus](https://element-plus.org/en-US/guide/quickstart.html)：Vue 组件与样式接入。
- [Changesets](https://github.com/changesets/changesets)：多包版本管理与发布。
