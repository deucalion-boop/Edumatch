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
      in(field, values) { filters.push((row) => values.includes(row[field])); return query; },
      limit(value) { maximum = value; return query; },
      range(first, last) { start = first; end = last; return query; },
      order(field, options = {}) { sorting = { field, ascending: options.ascending !== false }; return query; },
      insert(value) { operation = 'insert'; payload = value; return query; },
      update(value) { operation = 'update'; payload = value; return query; },
      upsert(value) { operation = 'upsert'; payload = value; return query; },
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
            let row = operation === 'upsert' && tables[table].find((candidate) => candidate.id === payload.id);
            if (row) {
              Object.assign(row, structuredClone(payload));
            } else {
              const now = new Date().toISOString();
              row = { id: randomUUID(), created_at: now, revoked_at: null, ...structuredClone(payload) };
              tables[table].push(row);
            }
            rows = [row];
          } else if (operation === 'update') {
            rows.forEach((row) => Object.assign(row, structuredClone(payload)));
          }
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
