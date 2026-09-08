<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ConfigProvider } from 'ant-design-vue'
import { ActionButton, StatCard, EmptyState, type UiLibrary } from '@yancraft/vue'
import { ArrowUpRight, ArrowRight, Box, BookOpen, Check, ChevronRight, Code2, Copy, Layers, LayoutGrid, Package, Search, SlidersHorizontal, Terminal, X, RotateCcw, ExternalLink, MousePointer2, PanelTop, CircleDashed, Github, Menu } from 'lucide-vue-next'
import ReactPreview from './ReactPreview.vue'
import { catalog, type ComponentId } from './catalog'
import ChangelogPage from './ChangelogPage.vue'
import { History } from 'lucide-vue-next'

type Page = 'components' | 'guide' | 'release' | 'changelog'
const pageTitles: Record<Page, string> = { components: '组件总览', guide: '开发指南', release: '构建与发布', changelog: '发版日志' }
const page = ref<Page>('components')
const selected = ref<ComponentId>('button')
const query = ref('')
const filter = ref('全部组件')
const tab = ref('交互预览')
const ui = ref<UiLibrary>('ant')
const framework = ref<'Vue' | 'React'>('Vue')
const label = ref('创建项目')
const variant = ref<'primary' | 'default' | 'danger'>('primary')
const size = ref<'small' | 'default' | 'large'>('default')
const loading = ref(false)
const disabled = ref(false)
const statValue = ref('128,640')
const change = ref(12.8)
const title = ref('这里还没有内容')
const description = ref('从第一个项目开始，让想法发生。')
const actionLabel = ref('创建项目')
const search = ref<HTMLInputElement>()
const mobileNav = ref(false)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout>
const current = computed(() => catalog.find(c => c.id === selected.value)!)
const filtered = computed(() => catalog.filter(c => (filter.value === '全部组件' || c.category === filter.value) && `${c.name} ${c.title} ${c.desc}`.toLowerCase().includes(query.value.toLowerCase())))
const componentProps = computed<Record<string, unknown>>(() => selected.value === 'button' ? { label: label.value, ui: ui.value, variant: variant.value, size: size.value, loading: loading.value, disabled: disabled.value } : selected.value === 'stat' ? { value: statValue.value, change: change.value } : { ui: ui.value, title: title.value, description: description.value, actionLabel: actionLabel.value })
const vueComponents = { button: ActionButton, stat: StatCard, empty: EmptyState }
const vueAttrs = computed(() => Object.entries(componentProps.value).map(([k,v]) => typeof v === 'string' ? `${k}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"` : `:${k}="${String(v)}"`).join('\n    '))
const code = computed(() => framework.value === 'Vue'
  ? `<script setup lang="ts">\nimport { ${current.value.name} } from '@yancraft/vue'\nimport '@yancraft/vue/style.css'\n${ui.value === 'element' && selected.value !== 'stat' ? "import 'element-plus/dist/index.css'\n" : ''}const onAction = () => console.log('操作已触发')\n<` + `/script>\n\n<template>\n  <${current.value.name}\n    ${vueAttrs.value}${selected.value !== 'stat' ? `\n    @${selected.value === 'button' ? 'click' : 'action'}="onAction"` : ''}\n  />\n</template>`
  : `'use client'\nimport { ${current.value.name} } from '@yancraft/react'\nimport '@yancraft/vue/style.css'\n${ui.value === 'element' && selected.value !== 'stat' ? "import 'element-plus/dist/index.css'\n" : ''}\nexport default function Example() {\n  return (\n    <${current.value.name}\n      ${Object.entries(componentProps.value).map(([k,v]) => `${k}={${JSON.stringify(v)}}`).join('\n      ')}${selected.value !== 'stat' ? `\n      ${selected.value === 'button' ? 'onClick' : 'onAction'}={() => console.log('操作已触发')}` : ''}\n    />\n  )\n}`)
function notify(message: string) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.value = '' }, 2800) }
async function copy(text: string) { try { await navigator.clipboard.writeText(text); notify('已复制到剪贴板') } catch { notify('复制失败，请手动选择代码复制') } }
function choose(id: ComponentId) { selected.value = id; page.value = 'components'; tab.value = '交互预览'; mobileNav.value = false }
function reset() { label.value = '创建项目'; variant.value = 'primary'; size.value = 'default'; loading.value = false; disabled.value = false; statValue.value = '128,640'; change.value = 12.8; title.value = '这里还没有内容'; description.value = '从第一个项目开始，让想法发生。'; actionLabel.value = '创建项目' }
function navigate(next: Page) { page.value = next; mobileNav.value = false }
function keyboard(e: KeyboardEvent) { if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) { e.preventDefault(); page.value = 'components'; search.value?.focus() } if (e.key === 'Escape') { mobileNav.value = false; search.value?.blur() } }
function readHash() { const [p, id] = location.hash.slice(1).split('/'); if (['components','guide','release','changelog'].includes(p)) page.value = p as Page; if (catalog.some(c => c.id === id)) selected.value = id as ComponentId }
watch([page, selected], () => { history.replaceState(null, '', `#${page.value}/${selected.value}`) })
onMounted(() => { readHash(); window.addEventListener('keydown', keyboard); window.addEventListener('hashchange', readHash) })
onBeforeUnmount(() => { clearTimeout(toastTimer); window.removeEventListener('keydown', keyboard); window.removeEventListener('hashchange', readHash) })
</script>

<template>
  <div class="workspace">
    <aside :class="['sidebar', { open: mobileNav }]">
      <a class="brand" href="#components/button" @click="navigate('components')"><span class="brand-mark"><Layers :size="23" /></span><span>YanCraft UI<span class="brand-dot">.</span></span></a>
      <div class="workspace-label">YANCRAFT / COMPONENTS <span>01</span></div>
      <div class="side-section">工作空间</div>
      <button :class="['nav-item', { active: page === 'components' }]" @click="navigate('components')"><LayoutGrid :size="17" />组件总览<span class="nav-count">03</span></button>
      <button :class="['nav-item', { active: page === 'guide' }]" @click="navigate('guide')"><BookOpen :size="17" />开发指南<ArrowUpRight :size="13" class="nav-tail" /></button>
      <button :class="['nav-item', { active: page === 'release' }]" @click="navigate('release')"><Package :size="17" />构建与发布</button>
      <button :class="['nav-item', { active: page === 'changelog' }]" @click="navigate('changelog')"><History :size="17" />发版日志</button>
      <div class="side-section component-label">组件目录 <span>3</span></div>
      <div v-for="group in ['通用', '数据展示', '反馈']" :key="group" class="side-group">
        <div class="group-label">{{ group }}</div>
        <button v-for="c in catalog.filter(c => c.category === group)" :key="c.id" :class="['component-link', { chosen: selected === c.id && page === 'components' }]" @click="choose(c.id)"><span class="small-square"></span>{{ c.name }}<span>{{ c.title }}</span></button>
      </div>
      <div class="sidebar-bottom"><div class="framework-dots"><span>V</span><span>R</span></div><strong>Thoughtfully written. Carefully built.</strong><p>Vue 驱动 · React 可用</p><button @click="navigate('guide')">了解开发模式 <ArrowRight :size="14" /></button></div>
      <div class="side-footer"><span class="status-dot"></span>本地开发工作台<span>v0.1.0</span></div>
    </aside>
    <button v-if="mobileNav" class="nav-backdrop" aria-label="关闭导航" @click="mobileNav = false"></button>
    <div class="main-shell">
      <header class="topbar"><div class="breadcrumb"><button class="mobile-menu icon-button" aria-label="打开导航" @click="mobileNav = true"><Menu :size="20" /></button><span>工作空间</span><ChevronRight :size="13" /><strong>{{ pageTitles[page] }}</strong></div><div class="top-actions"><span class="local-badge"><span class="status-dot"></span> 开发模式</span><a href="https://vuejs.org/guide/introduction.html" target="_blank" rel="noreferrer">Vue 文档 <ExternalLink :size="13" /></a><span class="avatar">Y</span></div></header>
      <main>
        <template v-if="page === 'components'">
          <section class="hero"><div><div class="eyebrow"><span></span> THE BUILDING BLOCKS OF YOUR NEXT IDEA</div><h1>好组件，让想法更快发生<span>。</span></h1><p>在这里开发、探索与分享。把重复的工作，变成可复用的积木。</p><div class="hero-meta"><span><Box :size="14" />3 个精选组件</span><i></i><span>Vue 3 + TypeScript</span><i></i><span>支持双 UI 引擎</span></div></div><button class="dark-button" @click="navigate('guide')">开始构建 <ArrowUpRight :size="16" /></button></section>
          <section class="catalog-section" aria-label="组件目录">
            <div class="catalog-toolbar"><div class="filters"><button v-for="f in ['全部组件', '通用', '数据展示', '反馈']" :key="f" :class="{ selected: filter === f }" @click="filter = f">{{ f }}<span v-if="f === '全部组件'">3</span></button></div><label class="search-box"><Search :size="15" /><input ref="search" v-model="query" placeholder="搜索组件…" aria-label="搜索组件" /><button v-if="query" class="icon-button" aria-label="清空搜索" @click="query = ''"><X :size="14" /></button><kbd v-else>/</kbd></label></div>
            <div class="component-grid"><button v-for="c in filtered" :key="c.id" :class="['catalog-card', { selected: selected === c.id }]" @click="choose(c.id)"><div :class="['card-visual', c.id]"><template v-if="c.id === 'button'"><span class="mini-button">＋ 创建项目</span><span class="mini-button secondary">了解更多 <ArrowUpRight :size="12" /></span><MousePointer2 class="visual-cursor" :size="24" fill="#283b30" /></template><template v-else-if="c.id === 'stat'"><div class="mini-stat"><span>总访问量 <span>↗</span></span><strong>128,640 <em>+12.8%</em></strong><svg viewBox="0 0 240 30" fill="none"><path d="M0 28L28 21L48 25L80 12L110 17L139 5L170 12L204 2L240 8" stroke="#78a188" stroke-width="2"/></svg></div></template><template v-else><div class="mini-empty"><PanelTop :size="31" stroke-width="1" /><span>新的可能，从这里开始</span><i></i><i></i></div></template><span class="card-visual-index">0{{ catalog.indexOf(c) + 1 }}</span></div><div class="card-content"><div><h3>{{ c.name }}</h3><span>{{ c.title }}</span><ArrowUpRight :size="16" /></div><p>{{ c.desc }}</p><div class="card-tags"><span>Vue</span><span>React</span><span>{{ c.id === 'stat' ? '独立样式' : 'Antd / Element' }}</span></div></div></button></div>
            <div v-if="!filtered.length" class="search-empty"><Search :size="24" /><h3>没有找到匹配的组件</h3><p>试试组件名称或中文关键词。</p><button class="light-button" @click="query = ''; filter = '全部组件'">重置筛选</button></div>
          </section>
          <section class="playground" aria-label="组件详情">
            <div class="section-heading"><div class="heading-icon"><Code2 :size="19" /></div><h2>组件实验室</h2><span>让代码，触手可及。</span><div class="live-label"><span class="status-dot"></span>实时预览</div></div>
            <div class="lab"><div class="lab-header"><div><h3>{{ current.name }} <span>{{ current.title }}</span></h3><p>{{ current.details }}</p></div><span class="version-tag">v0.1.0</span></div>
              <div class="lab-tabs"><div role="tablist" aria-label="组件信息"><button v-for="t in ['交互预览', '使用代码', 'API 文档', '组件源码']" :key="t" role="tab" :aria-selected="tab === t" :class="{ active: tab === t }" @click="tab = t">{{ t }}</button></div><div class="framework-switch"><button v-for="f in (['Vue', 'React'] as const)" :key="f" :class="{ active: framework === f }" @click="framework = f">{{ f }}</button></div></div>
              <div v-if="tab === '交互预览'" class="lab-body"><div class="preview-column"><div class="preview-canvas"><span class="canvas-label">{{ framework.toUpperCase() }} PREVIEW</span><ConfigProvider :theme="{ token: { colorPrimary: '#347553', borderRadius: 6, fontFamily: 'inherit' } }"><component :is="vueComponents[selected]" v-if="framework === 'Vue'" v-bind="componentProps" @click="selected === 'button' && notify('click 事件已触发')" @action="notify('action 事件已触发')" /><ReactPreview v-else :component-id="selected" :component-props="componentProps" @action="notify(selected === 'button' ? 'click 事件已触发' : 'action 事件已触发')" /></ConfigProvider><span class="canvas-caption">{{ selected === 'stat' ? '独立样式 · 装饰趋势线' : ui === 'ant' ? 'Ant Design Vue' : 'Element Plus' }}<span> / </span>{{ framework === 'Vue' ? '原生 Vue 组件' : 'React → Vue 运行时适配' }}</span></div><div class="preview-footer"><span><MousePointer2 :size="13" />{{ selected === 'stat' ? '调整右侧参数，观察指标变化' : '点击组件，查看真实交互反馈' }}</span><button @click="tab = '使用代码'">查看使用代码 <ArrowRight :size="13" /></button></div></div>
                <aside class="controls"><div class="controls-heading"><SlidersHorizontal :size="14" /><strong>组件配置</strong><button class="icon-button" aria-label="重置组件参数" title="重置参数" @click="reset"><RotateCcw :size="13" /></button></div><template v-if="selected !== 'stat'"><label class="control-label">UI 引擎<span>ui</span></label><div class="ui-switch"><button :class="{ active: ui === 'ant' }" @click="ui = 'ant'"><span class="engine-symbol ant-symbol">◇</span>Ant Design</button><button :class="{ active: ui === 'element' }" @click="ui = 'element'"><span class="engine-symbol">▱</span>Element</button></div></template><template v-if="selected === 'button'"><label class="control-label" for="label">按钮文案<span>label</span></label><input id="label" v-model="label" class="control-input" /><div class="control-pair"><label>按钮类型<select v-model="variant" aria-label="按钮类型"><option value="primary">主要按钮</option><option value="default">默认按钮</option><option value="danger">危险按钮</option></select></label><label>尺寸<select v-model="size" aria-label="尺寸"><option value="default">默认</option><option value="small">小</option><option value="large">大</option></select></label></div><label class="toggle-row">加载状态 <input v-model="loading" type="checkbox" role="switch" aria-label="加载状态" /></label><label class="toggle-row">禁用状态 <input v-model="disabled" type="checkbox" role="switch" aria-label="禁用状态" /></label></template><template v-else-if="selected === 'stat'"><label class="control-label" for="value">指标值<span>value</span></label><input id="value" v-model="statValue" class="control-input" /><label class="control-label" for="change">变化百分比<span>change</span></label><input id="change" v-model.number="change" type="number" step="0.1" class="control-input" /></template><template v-else><label class="control-label" for="title">标题<span>title</span></label><input id="title" v-model="title" class="control-input" /><label class="control-label" for="description">说明<span>description</span></label><textarea id="description" v-model="description" class="control-input"></textarea><label class="control-label" for="action-label">操作文案<span>actionLabel</span></label><input id="action-label" v-model="actionLabel" class="control-input" /></template></aside>
              </div>
              <div v-else-if="tab === 'API 文档'" class="api-panel"><h4>Props 属性</h4><div class="table-scroll"><table><thead><tr><th>参数</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in current.props" :key="row[0]"><td v-for="(cell, i) in row" :key="i"><code v-if="i < 2">{{ cell }}</code><span v-else>{{ cell }}</span></td></tr></tbody></table></div><h4>Events 事件</h4><p><code>{{ current.event }}</code> · {{ current.eventDesc }}</p><p v-if="selected === 'button'">Vue 支持默认插槽；React 适配包使用 label 属性，不接受 React children。</p></div>
              <div v-else class="code-panel"><div class="code-toolbar"><span>{{ tab === '组件源码' ? `${current.name}.vue` : framework === 'Vue' ? 'Example.vue' : 'Example.tsx' }}</span><button @click="copy(tab === '组件源码' ? current.source : code)"><Copy :size="14" />复制代码</button></div><pre><code>{{ tab === '组件源码' ? current.source : code }}</code></pre></div>
            </div>
          </section>
          <div class="bottom-note"><span><Layers :size="16" />用 Vue 编写，用你熟悉的方式使用。</span><button @click="navigate('release')">从本地开发到 npm 发布 <ArrowUpRight :size="14" /></button></div>
        </template>
        <ChangelogPage v-else-if="page === 'changelog'" @release-guide="navigate('release')" />
        <template v-else>
          <section class="hero guide-hero"><div><div class="eyebrow"><span></span>{{ page === 'guide' ? 'BUILD WITH INTENTION' : 'FROM LOCAL TO EVERYWHERE' }}</div><h1>{{ page === 'guide' ? '写一次组件，沉淀一份能力。' : '把好用的组件，交到更多人手中。' }}</h1><p>{{ page === 'guide' ? '清晰的目录约定，真实的预览，渐进式的跨框架复用。' : '类型、样式、版本与产物，为每一次发布做好准备。' }}</p></div></section>
          <div class="guide-layout"><article class="guide-content" v-if="page === 'guide'"><div class="document-label">GETTING STARTED <span>01 — 04</span></div><h2>从你的第一个组件开始</h2><p>这是一个 npm workspaces 单仓库。组件源码、React 适配器与文档站分别管理，开发时直接引用源码，构建时输出独立 npm 包。</p><h3>01 / 启动工作台</h3><div class="inline-code"><pre>npm install
npm run dev</pre><button aria-label="复制启动命令" @click="copy('npm install\nnpm run dev')"><Copy :size="15" /></button></div><p>打开 http://localhost:5173。保存 .vue 文件后，组件和用例会自动热更新。</p><h3>02 / 认识项目结构</h3><pre class="file-tree">apps/docs/            组件预览与使用文档
packages/vue/src/     Vue 组件、公共类型与导出
packages/react/src/   React props / events 适配
tests/                组件与浏览器验证
.changeset/           版本与变更记录</pre><h3>03 / 新增一个组件</h3><ol><li>在 <code>packages/vue/src/components/</code> 新建 Vue SFC，定义 props、emits 和样式。</li><li>在 <code>types.ts</code> 定义公共类型，在 <code>index.ts</code> 导出组件与类型。</li><li>在 <code>apps/docs/src/catalog.ts</code> 添加说明、API 和源码，在工作台接入用例及参数控件。</li><li>需要 React 使用时，在 React 包中通过 <code>bridge()</code> 显式导出包装组件。使用 props 和事件设计跨框架 API。</li><li>运行 <code>npm run check</code>，补充变更记录后再发布。</li></ol><h3>04 / Vue 与 React 的边界</h3><div class="callout"><strong>复用实现，保留 Vue 运行时</strong><p>React 包通过独立 Vue 应用挂载组件，映射 props、事件和卸载生命周期。这不是源码转换；需要安装 Vue 与相应 UI 库。</p></div><p>当前适配器支持数据属性与回调，不支持 React children、Vue 作用域插槽或自动继承 React / Vue 外部 Provider。React 预览因此使用 Ant Design 默认主题。SSR 输出空宿主容器，内容在客户端挂载；Next.js 请在客户端组件中使用。</p><p>若要完全原生的 React 体验，应共享业务逻辑与设计变量，分别实现 Vue / React 视图。跨框架简单组件也可选 Vue Custom Elements，但第三方 UI 库的弹层、样式与上下文需要额外处理。</p><h3>UI 库与样式</h3><p>Vue 侧使用 Ant Design Vue 和 Element Plus。当前示例入口同时引用两套库，消费项目需安装两者。业务规模增大后可拆分独立渲染包，按需依赖。React 的 antd 包不会自动替换 Ant Design Vue。</p><div class="inline-code"><pre>import '@yancraft/vue/style.css'
// 使用 Element 引擎时额外引入：
import 'element-plus/dist/index.css'</pre><button aria-label="复制样式代码" @click="copy(&quot;import '@yancraft/vue/style.css'\nimport 'element-plus/dist/index.css'&quot;)"><Copy :size="15" /></button></div></article>
          <article v-else class="guide-content"><div class="document-label">SHIP YOUR COMPONENTS <span>RELEASE GUIDE</span></div><h2>发布前，先验证产物</h2><p>当前包名 <code>@yancraft/*</code> 是脚手架占位名，尚未发布到 npm。首次发布前，将项目内的 scope 统一替换为你有权限的 npm 组织或个人 scope。</p><h3>01 / 检查与打包</h3><div class="inline-code"><pre>npm run check
npm run pack:check
npm pack -w @yancraft/vue
npm pack -w @yancraft/react</pre><button aria-label="复制打包命令" @click="copy('npm run check\nnpm run pack:check\nnpm pack -w @yancraft/vue\nnpm pack -w @yancraft/react')"><Copy :size="15" /></button></div><p>Vue 包生成 ESM、.d.ts 与 style.css；React 包生成 ESM 与 .d.ts。Vue、React 和 UI 库为外部依赖，不被打进组件包。先发布 Vue 包，再发布依赖它的 React 包。</p><h3>02 / 记录与升级版本</h3><div class="inline-code"><pre>npm run changeset
npm run version-packages
npm install</pre><button aria-label="复制版本命令" @click="copy('npm run changeset\nnpm run version-packages\nnpm install')"><Copy :size="15" /></button></div><p>选择 patch / minor / major 并填写变更说明。两个组件包采用固定版本组。提交版本、CHANGELOG 与锁文件；首次发布也可直接使用 0.1.0。</p><h3>03 / 发布到 npm</h3><div class="inline-code"><pre>npm login
npm whoami
npm run release</pre><button aria-label="复制发布命令" @click="copy('npm login\nnpm whoami\nnpm run release')"><Copy :size="15" /></button></div><div class="callout"><strong>此工作台不持有 npm 凭证</strong><p>发布在本地终端执行，使用你的 npm 账号与组织权限。这里展示发布流程，不会从网页发起发布。按账号设置完成二次验证；不要将 token 写入仓库。</p></div><h3>04 / 在其他项目中安装</h3><p>以下命令仅在你完成发布并替换包名后可用。</p><div class="inline-code"><pre># Vue 项目
npm install @yancraft/vue vue ant-design-vue element-plus

# React 项目
npm install @yancraft/react react react-dom vue ant-design-vue element-plus</pre><button aria-label="复制安装命令" @click="copy('npm install @yancraft/vue vue ant-design-vue element-plus')"><Copy :size="15" /></button></div><p>文档站构建到 <code>apps/docs/dist</code>，可单独部署到任意静态站点服务。组件包通过 npm 分发，两者互不绑定。</p></article>
          <aside class="guide-aside"><div class="heading-icon"><Terminal :size="22" /></div><h3>{{ page === 'guide' ? '开发循环' : '发布清单' }}</h3><div v-for="item in (page === 'guide' ? ['定义组件接口', '编写 Vue 实现', '添加预览与文档', '检查并发布'] : ['替换 npm scope', '验证类型与交互', '检查打包内容', '登录并发布'])" :key="item"><Check :size="15" />{{ item }}</div><hr/><p>详细步骤与限制见项目根目录 README.md。</p><a :href="page === 'guide' ? 'https://vuejs.org/guide/extras/web-components.html' : 'https://github.com/changesets/changesets'" target="_blank" rel="noreferrer">{{ page === 'guide' ? 'Vue 跨框架官方指南' : 'Changesets 官方文档' }}<ArrowUpRight :size="14" /></a></aside></div>
        </template>
        <footer class="page-footer"><span>YanCraft UI<span class="brand-dot">.</span> <span>Thoughtfully written. Carefully built.</span></span><span>Vue 驱动 <i> / </i> 为开发者而造</span></footer>
      </main>
    </div>
    <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><Check :size="16" />{{ toast }}</div></Transition>
  </div>
</template>
