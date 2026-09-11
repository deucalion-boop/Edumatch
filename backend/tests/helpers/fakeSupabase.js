const { randomUUID } = require('node:crypto');

// Query-compatible local fixture: production services and controllers stay real.
function createFakeSupabase(initialTables = {}) {
  const tables = structuredClone(initialTables);
  const writes = [];
  const failures = [];
  function from(table) {
    if (!tables[table]) tables[table] = [];
    const filters = [];
    let operation = 'select';
    let payload;
    let upsertOptions = {};
    let sorting;
    let start = 0;
    let end = Infinity;
    let maximum = Infinity;
    let single = false;
    const query = {
      select() { return query; },
      eq(field, value) { filters.push((row) => row[field] === value); return query; },
      neq(field, value) { filters.push((row) => row[field] !== value); return query; },
      is(field, value) { filters.push((row) => row[field] === value); return query; },
      gt(field, value) { filters.push((row) => row[field] > value); return query; },
      contains(field, values) { filters.push(row => values.every(value => (row[field] || []).some(item => Object.entries(value).every(([key, expected]) => item[key] === expected)))); return query; },
      in(field, values) { filters.push((row) => values.includes(row[field])); return query; },
      limit(value) { maximum = value; return query; },
      range(first, last) { start = first; end = last; return query; },
      order(field, options = {}) { sorting = { field, ascending: options.ascending !== false }; return query; },
      insert(value) { operation = 'insert'; payload = value; return query; },
      delete() { operation = 'delete'; return query; },
      update(value) { operation = 'update'; payload = value; return query; },
      upsert(value, options = {}) { operation = 'upsert'; payload = value; upsertOptions = options; return query; },
      maybeSingle() { single = true; return query; },
      single() { single = true; return query; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          const failureIndex = failures.findIndex((failure) => failure.table === table && failure.operation === operation);
          if (failureIndex !== -1) {
            return { data: null, error: failures.splice(failureIndex, 1)[0].error };
          }
          let rows = tables[table].filter((row) => filters.every((filter) => filter(row)));
          if (operation === 'insert' || operation === 'upsert') {
            rows = [];
            for (const value of Array.isArray(payload) ? payload : [payload]) {
              const fields = (upsertOptions.onConflict || 'id').split(',');
              let row = operation === 'upsert' && tables[table].find(candidate => fields.every(field => candidate[field] === value[field]));
              if (row && upsertOptions.ignoreDuplicates) continue;
              if (row) Object.assign(row, structuredClone(value));
              else {
                row = { id: randomUUID(), created_at: new Date().toISOString(), revoked_at: null, ...structuredClone(value) };
                tables[table].push(row);
              }
              rows.push(row);
            }
          } else if (operation === 'update') {
            rows.forEach((row) => Object.assign(row, structuredClone(payload)));
          }
          if (operation === 'delete') tables[table] = tables[table].filter((row) => !rows.includes(row));
          if (operation !== 'select') writes.push({ table, operation, payload: structuredClone(payload), ids: rows.map((row) => row.id) });
          const count = rows.length;
          if (sorting) {
            rows.sort((left, right) => {
              const direction = sorting.ascending ? 1 : -1;
              return left[sorting.field] < right[sorting.field] ? -direction : left[sorting.field] > right[sorting.field] ? direction : 0;
            });
          }
          rows = rows.slice(start, Math.min(end + 1, start + maximum));
          return { data: structuredClone(single ? rows[0] || null : rows), error: null, count };
        }).then(resolve, reject);
      },
    };
    return query;
  }
  return { from, tables, writes, failures };
}

module.exports = { createFakeSupabase };
