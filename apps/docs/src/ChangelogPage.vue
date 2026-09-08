<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpRight, ChevronDown, GitCommitHorizontal, History, Package } from 'lucide-vue-next'
import { releaseNotes, type ReleaseNote } from './changelog'

const emit = defineEmits<{ releaseGuide: [] }>()
const selectedVersion = ref('all')
const collapsed = ref<string[]>([])
const visibleNotes = computed(() => releaseNotes.filter(note => selectedVersion.value === 'all' || note.version === selectedVersion.value))
const statusLabels: Record<ReleaseNote['status'], string> = { unreleased: '版本待定', pending: '待发布', published: '已发布' }
function toggle(version: string) {
  collapsed.value = collapsed.value.includes(version) ? collapsed.value.filter(v => v !== version) : [...collapsed.value, version]
}
</script>

<template>
  <section class="hero guide-hero">
    <div>
      <div class="eyebrow"><span></span> EVERY UPDATE, A STEP FORWARD</div>
      <h1>发版日志<span>。</span></h1>
      <p>记录每一次打磨，让变化清晰可见。从新能力到小修复，都在这里。</p>
      <div class="hero-meta"><span><History :size="14" />{{ releaseNotes.length }} 份版本记录</span><i></i><span>按更新顺序排列</span></div>
    </div>
    <button class="light-button" @click="emit('releaseGuide')">查看发布指南 <ArrowUpRight :size="15" /></button>
  </section>

  <div class="changelog-layout">
    <section class="version-timeline" aria-label="版本日志">
      <article v-for="note in visibleNotes" :key="note.version" class="release-note" :aria-label="`${note.version} 版本记录`">
        <div class="timeline-marker"><GitCommitHorizontal :size="18" /></div>
        <div class="note-meta"><span class="note-version">{{ note.version === 'Unreleased' ? '下一次更新' : `v${note.version}` }}</span><span :class="['note-status', note.status]">{{ statusLabels[note.status] }}</span><time :datetime="note.date">{{ note.status === 'published' ? '发布于' : '更新于' }} {{ note.date }}</time></div>
        <div class="note-card">
          <button class="note-toggle" :aria-expanded="!collapsed.includes(note.version)" :aria-controls="`note-${note.version}`" @click="toggle(note.version)">
            <span><h2>{{ note.title }}</h2><span class="note-summary">{{ note.summary }}</span></span>
            <ChevronDown :size="18" :class="{ collapsed: collapsed.includes(note.version) }" />
          </button>
          <div class="note-packages"><span v-for="name in note.packages" :key="name"><Package :size="12" />{{ name }}</span></div>
          <div v-show="!collapsed.includes(note.version)" :id="`note-${note.version}`" class="note-details">
            <section v-for="group in note.changes" :key="group.category" class="change-group">
              <h3 :class="{ breaking: group.category === '不兼容变更' }">{{ group.category }}</h3>
              <ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul>
            </section>
            <div v-if="note.upgrade" class="upgrade-note"><strong>使用与升级说明</strong><p>{{ note.upgrade }}</p></div>
          </div>
        </div>
      </article>
    </section>
    <aside class="version-sidebar">
      <div class="version-index"><h2>版本索引</h2><nav aria-label="按版本查看"><button :class="{ active: selectedVersion === 'all' }" :aria-pressed="selectedVersion === 'all'" @click="selectedVersion = 'all'">全部版本 <span>{{ releaseNotes.length }}</span></button><button v-for="note in releaseNotes" :key="note.version" :class="{ active: selectedVersion === note.version }" :aria-pressed="selectedVersion === note.version" @click="selectedVersion = note.version"><span>{{ note.version === 'Unreleased' ? '下一次更新' : `v${note.version}` }}</span><small>{{ statusLabels[note.status] }}</small></button></nav></div>
      <div class="version-explainer"><History :size="20" /><h3>了解版本中的变化</h3><p>新增能力、体验优化、问题修复和不兼容变更会分别列出。升级前，建议先查看对应版本的使用说明。</p><p>“待发布”与“版本待定”是开发记录，不表示已发布到 npm。</p></div>
    </aside>
  </div>
</template>

<style scoped>
.changelog-layout{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:32px;margin-bottom:45px}.version-timeline{padding-left:27px;border-left:1px solid #dce4d6;margin-left:9px}.release-note{position:relative;margin-bottom:34px}.release-note:last-child{margin-bottom:0}.timeline-marker{position:absolute;left:-38px;top:3px;background:#f8f9f6;color:#5d7f57;width:21px;height:24px;display:grid;place-items:center}.note-meta{display:flex;align-items:center;gap:10px;margin-bottom:15px;flex-wrap:wrap}.note-version{font:650 18px 'Manrope','Microsoft YaHei',sans-serif;letter-spacing:-.4px}.note-status{font-size:10px;border:1px solid #dce5d5;background:#ecf2e7;color:#59734a;border-radius:4px;padding:3px 7px}.note-status.unreleased{color:#86672e;background:#faf4e7;border-color:#ebdfc5}.note-status.published{color:#276743;background:#e8f4ec}.note-meta time{margin-left:auto;font-size:11px;color:#727e6c}.note-card{background:#fff;border:1px solid #e1e7dc;border-radius:10px;overflow:hidden}.note-toggle{width:100%;display:flex;justify-content:space-between;align-items:center;gap:18px;text-align:left;padding:24px 25px 13px}.note-toggle h2{font-size:18px;font-weight:600;margin:0 0 10px;line-height:1.6}.note-summary{font-size:12px;color:#697662;line-height:1.9;display:block}.note-toggle>svg{color:#7b8f70;transition:transform .2s}.note-toggle>svg.collapsed{transform:rotate(-90deg)}.note-packages{display:flex;flex-wrap:wrap;gap:7px;padding:0 25px 22px}.note-packages>span{display:flex;align-items:center;gap:5px;border:1px solid #e5eade;background:#f7f9f3;color:#66785a;padding:4px 7px;border-radius:4px;font-size:10px}.note-details{border-top:1px solid #edf0e7;padding:20px 25px 25px}.change-group h3{font-size:11px;color:#34704a;display:inline-block;background:#edf5ec;padding:4px 9px;border-radius:4px;margin:0 0 7px}.change-group h3.breaking{color:#a53e32;background:#fff0ed}.change-group ul{padding-left:18px;margin:7px 0 22px}.change-group li{font-size:12px;line-height:1.95;color:#596851;margin:8px 0;padding-left:3px}.change-group li::marker{color:#9fb194}.upgrade-note{background:#f6f8f2;border-left:3px solid #aec49d;padding:14px 17px;border-radius:4px}.upgrade-note strong{font-size:11px;color:#587348}.upgrade-note p{font-size:12px;color:#69785f;margin:6px 0 0;line-height:1.9}.version-sidebar{align-self:start;position:sticky;top:25px}.version-index{background:#fff;border:1px solid #e1e7dc;border-radius:9px;padding:18px 13px}.version-index h2{font-size:12px;font-weight:600;margin:0 10px 14px}.version-index nav{display:flex;flex-direction:column;gap:5px}.version-index button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:11px 10px;border-radius:5px;text-align:left;font-size:12px;color:#66785a}.version-index button.active{background:#eaf1e3;color:#365f3d;font-weight:600}.version-index small{font-size:10px;font-weight:400;color:#6a7b60}.version-explainer{padding:25px 12px;color:#799369}.version-explainer h3{font-size:12px;font-weight:600;color:#5f7551;margin:13px 0 10px}.version-explainer p{font-size:11px;color:#6c7b62;line-height:1.95}.hero-meta{margin-top:18px}
@media(max-width:1100px){.changelog-layout{grid-template-columns:minmax(0,1fr) 180px;gap:22px}.note-meta time{margin-left:0;width:100%}.note-toggle{padding:20px 20px 12px}.note-packages{padding-left:20px;padding-right:20px}.note-details{padding:18px 20px 20px}}
@media(max-width:760px){.changelog-layout{display:flex;flex-direction:column;gap:25px}.version-sidebar{order:-1;position:static}.version-index nav{flex-direction:row;flex-wrap:wrap}.version-index button{width:auto;gap:10px}.version-index h2{margin-bottom:9px}.version-explainer{display:none}.version-timeline{padding-left:19px;margin-left:6px}.timeline-marker{left:-30px}.note-meta{gap:8px}.note-version{font-size:17px}.note-toggle h2{font-size:16px}.note-toggle{padding:18px 16px 12px}.note-packages{padding:0 16px 18px}.note-details{padding:18px 16px}.hero .light-button{margin-top:20px}.upgrade-note{padding:12px}}
</style>
