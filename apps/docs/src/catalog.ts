import buttonSource from '../../../packages/vue/src/components/ActionButton.vue?raw'
import statSource from '../../../packages/vue/src/components/StatCard.vue?raw'
import emptySource from '../../../packages/vue/src/components/EmptyState.vue?raw'
export const catalog = [
  { id: 'button', name: 'ActionButton', title: '操作按钮', category: '通用', desc: '让每一次操作，都有清晰的回应。', details: '统一两套 UI 库的按钮接口，支持主次操作、危险操作、加载与禁用状态。', source: buttonSource, props: [['label', 'string', '创建项目', '按钮文案'], ['ui', "ant | element", 'ant', '底层 UI 组件库'], ['variant', 'primary | default | danger', 'primary', '操作类型'], ['size', 'small | default | large', 'default', '按钮尺寸'], ['loading', 'boolean', 'false', '加载状态'], ['disabled', 'boolean', 'false', '禁用状态']], event: 'click(event: MouseEvent)', eventDesc: '点击按钮时触发；加载和禁用时不会触发。' },
  { id: 'stat', name: 'StatCard', title: '统计卡片', category: '数据展示', desc: '将关键数字，变成一眼可见的洞察。', details: '展示核心指标与变化率。底部折线为装饰示意，不表示真实时间序列；业务趋势图请接入图表组件。', source: statSource, props: [['title', 'string', '总访问量', '指标标题'], ['value', 'string | number', '128,640', '指标值'], ['change', 'number', '12.8', '变化百分比，负数表示下降'], ['description', 'string', '较上一个周期', '辅助说明']], event: '无', eventDesc: '纯展示组件，支持通过 CSS 变量定制主题。' },
  { id: 'empty', name: 'EmptyState', title: '空状态', category: '反馈', desc: '即使空无一物，也有下一步的方向。', details: '用于列表、搜索和项目空间的空状态，支持自定义文案与行动按钮。actionLabel 设为空字符串可隐藏按钮。', source: emptySource, props: [['title', 'string', '这里还没有内容', '标题'], ['description', 'string', '从第一个项目开始，让想法发生。', '说明文案'], ['actionLabel', 'string', '创建项目', '操作文案，空字符串隐藏按钮'], ['ui', 'ant | element', 'ant', '按钮使用的 UI 库']], event: 'action()', eventDesc: '点击行动按钮时触发。' }
] as const
export type ComponentId = typeof catalog[number]['id']
