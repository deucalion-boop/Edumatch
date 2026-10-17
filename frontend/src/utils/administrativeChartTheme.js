import Chart from 'chart.js/auto'

const originals = new WeakMap()
function activeRole() {
  return ['admin', 'secretary', 'headteacher'].find(role => document.body.classList.contains(`${role}-dashboard`))
}
function setColor(target, key, value, saved) {
  if (!target) return
  if (!saved.some(item => item.target === target && item.key === key)) {
    saved.push({ target, key, value: target[key], own: Object.hasOwn(target, key) })
  }
  target[key] = value
}
Chart.register({
  id: 'administrative-theme',
  beforeUpdate(chart) {
    const saved = originals.get(chart) || []
    // Restore the authored palette before applying the currently resolved theme.
    for (const item of saved) {
      if (item.own) item.target[item.key] = item.value
      else delete item.target[item.key]
    }
    originals.delete(chart)
    const role = activeRole()
    if (!role || document.documentElement.dataset[`${role}Theme`] !== 'dark') return
    const options = chart.config.options
    setColor(options, 'color', '#b7c6d7', saved)
    for (const scale of Object.values(options.scales || {})) {
      scale.ticks ||= {}; scale.grid ||= {}; scale.border ||= {}; scale.title ||= {}
      setColor(scale.ticks, 'color', '#b7c6d7', saved)
      setColor(scale.grid, 'color', 'rgba(148,163,184,0.16)', saved)
      setColor(scale.border, 'color', '#334150', saved)
      setColor(scale.title, 'color', '#b7c6d7', saved)
    }
    if (options.plugins?.legend?.labels) setColor(options.plugins.legend.labels, 'color', '#b7c6d7', saved)
    if (options.plugins?.title) setColor(options.plugins.title, 'color', '#edf2f7', saved)
    originals.set(chart, saved)
  },
  afterDestroy(chart) { originals.delete(chart) },
})

// Canvas charts need an explicit redraw; CSS alone cannot recolor their labels.
let queued = false
new MutationObserver(() => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    for (const chart of Object.values(Chart.instances)) {
      if (chart.canvas?.isConnected) chart.update('none')
    }
  })
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-admin-theme', 'data-secretary-theme', 'data-headteacher-theme'],
})
