const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup() {
 let source = fs.readFileSync(path.join(__dirname, '../../frontend/src/composables/useUserNotifications.js'), 'utf8').replace(/^import .*$/gm, '').replace('export function', 'function').replaceAll('import.meta.env.VITE_API_BASE_URL', "'/api'");
 let records = [{ id: 'a', isViewed: false }, { id: 'b', isViewed: false }];
 let failGet = false; let failPatch = false; let patches = 0; let mount; let unmount; let interval; let cleared = false;
 const axios = { get: async () => { if(failGet) throw Error('offline'); return { data: { notifications: structuredClone(records), unreadCount: records.filter(r => !r.isViewed).length } } },
 patch: async url => { patches++; if(failPatch) throw Error('offline'); records.forEach(row => { if(url.endsWith('/view-all') || url.endsWith('/' + row.id + '/view')) row.isViewed = true; }); } };
 const context = vm.createContext({ console: { error() {} }, axios, ref: value => ({ value }), useAuthStore: () => ({ token: 'test' }), onMounted: fn => {mount=fn}, onBeforeUnmount: fn => {unmount=fn}, window: { setInterval: fn => {interval=fn;return 1}, clearInterval: () => {cleared=true}, addEventListener() {}, removeEventListener() {} }, document: { hidden: false, addEventListener() {}, removeEventListener() {} } });
 vm.runInContext(source + '\nthis.api = useUserNotifications({ markViewedOnOpen: false, pollIntervalMs: 5000 })', context);
 return { api: context.api, mount: () => mount(), unmount: () => unmount(), tick: () => interval(), patches: () => patches, cleared: () => cleared, failGet: () => {failGet=true}, failPatch: () => {failPatch=true} };
}
test('opening bell does not read everything; individual and all-read update badge', async () => {
 const h=setup(); await h.api.toggleNotificationsPanel(); assert.equal(h.api.unreadCount.value,2); assert.equal(h.patches(),0);
 assert.equal(await h.api.markNotificationViewed(h.api.notifications.value[0]),true); assert.equal(h.api.unreadCount.value,1);
 await h.api.markAllViewed(); assert.equal(h.api.unreadCount.value,0);
});
test('failed refresh preserves data and successful read still updates local badge', async () => {
 const h=setup(); await h.api.fetchNotifications(); h.failGet();
 await h.api.fetchNotifications(); assert.equal(h.api.notifications.value.length,2); assert.equal(h.api.unreadCount.value,2);
 await h.api.markNotificationViewed(h.api.notifications.value[0]); assert.equal(h.api.unreadCount.value,1); assert.equal(h.api.notifications.value[0].isViewed,true);
});
test('failed read prevents navigation signal and leaves unread count intact', async () => {
 const h=setup(); await h.api.fetchNotifications(); h.failPatch(); assert.equal(await h.api.markNotificationViewed(h.api.notifications.value[0]),false); assert.equal(h.api.unreadCount.value,2);
});
test('polling is installed and cleaned up with the navbar lifecycle', async () => {
 const h=setup(); h.mount(); await h.api.fetchNotifications(); h.tick(); h.unmount(); assert.equal(h.cleared(),true);
});
