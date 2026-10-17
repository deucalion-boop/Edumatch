const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
function fixture(role = 'admin') {
  let plugin
  const Chart = { register(value) { plugin = value }, instances: {} }
  const root = { dataset: { [`${role}Theme`]: 'dark' } }
  const context = { Chart, WeakMap, Object, document: { body: { classList: { contains: value => value === `${role}-dashboard` } }, documentElement: root }, MutationObserver: class { observe() {} }, requestAnimationFrame() {} }
  vm.runInNewContext(fs.readFileSync(`${__dirname}/administrativeChartTheme.js`, 'utf8').replace("import Chart from 'chart.js/auto'", ''), context)
  const options = { color: '#333', scales: { y: { ticks: { color: '#444' }, grid: { color: '#ddd' } } }, plugins: { legend: { labels: { color: '#555' } } } }
  return { plugin, root, chart: { config: { options } }, options }
}
for (const role of ['admin', 'secretary', 'headteacher']) {
  test(`${role}: dark chart colors and repeated updates restore to light`, () => {
    const f = fixture(role)
    f.plugin.beforeUpdate(f.chart)
    assert.equal(f.options.scales.y.ticks.color, '#b7c6d7')
    f.plugin.beforeUpdate(f.chart)
    f.root.dataset[`${role}Theme`] = 'light'
    f.plugin.beforeUpdate(f.chart)
    assert.equal(f.options.color, '#333')
    assert.equal(f.options.scales.y.ticks.color, '#444')
    assert.equal(f.options.scales.y.grid.color, '#ddd')
    assert.equal(f.options.plugins.legend.labels.color, '#555')
  })
}
test('teacher charts are not recolored by administrative themes', () => {
  const f = fixture('teacher')
  f.plugin.beforeUpdate(f.chart)
  assert.equal(f.options.color, '#333')
  assert.equal(f.options.scales.y.ticks.color, '#444')
})
