/**
 * Faux client Supabase pour les tests : une table « characters » en mémoire, clé unique
 * (name, user_id), et le même enchaînement de méthodes que la bibliothèque
 * (from().select().eq().order().limit(), insert().select(), update().eq().select(),
 * delete().eq().select()).
 *
 * Comme la vraie base :
 *  - les dates updated_at sont renvoyées au format « +00:00 » (et non « Z ») ;
 *  - les clés des objets JSON sont renvoyées triées (jsonb) ;
 *  - option serverClock : la base fixe elle-même updated_at (déclencheur / défaut) ;
 *  - option onWrite(op) / onSelect() : appelées au début de chaque écriture / lecture
 *    (simulent une action de l'utilisateur pendant la requête).
 */
const pgTime = (iso) => new Date(iso).toISOString().replace('Z', '+00:00');
const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v);

export function fakeSupabase(rows = [], { fail = null, serverClock = null, onWrite = null, onSelect = null } = {}) {
    const table = rows.map(r => ({ ...r, data: sortKeys(r.data), updated_at: pgTime(r.updated_at) }));
    const calls = [];
    let failNext = fail;
    let tick = 0;
    const stamp = (requested) => pgTime(serverClock ? Date.parse(serverClock) + (++tick) * 7 : requested);

    function builder() {
        const state = { op: 'select', filters: [], order: null, limit: null, payload: null, returning: null };
        const run = () => {
            calls.push({ op: state.op, filters: state.filters.slice(), payload: state.payload });
            if (onWrite && state.op !== 'select') onWrite(state.op);
            if (onSelect && state.op === 'select') onSelect();
            if (failNext && (failNext === state.op || failNext === 'all')) {
                if (failNext !== 'all') failNext = null;
                return { data: null, error: { message: 'Failed to fetch' } };
            }
            const match = (r) => state.filters.every(([k, v]) => (k === 'updated_at'
                ? Date.parse(r[k]) === Date.parse(v) : r[k] === v));
            const project = (list) => (state.returning ? list.map(r => {
                const out = {};
                for (const col of state.returning.split(',').map(s => s.trim())) out[col] = r[col];
                return out;
            }) : null);
            if (state.op === 'insert') {
                if (table.some(r => r.name === state.payload.name && r.user_id === state.payload.user_id)) {
                    return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
                }
                const r = { ...state.payload, data: sortKeys(state.payload.data), updated_at: stamp(state.payload.updated_at) };
                table.push(r);
                return { data: project([r]), error: null };
            }
            if (state.op === 'update') {
                const hit = table.filter(match);
                for (const r of hit) {
                    Object.assign(r, state.payload, { data: sortKeys(state.payload.data), updated_at: stamp(state.payload.updated_at) });
                }
                return { data: project(hit), error: null };
            }
            if (state.op === 'delete') {
                const removed = [];
                for (let i = table.length - 1; i >= 0; i--) if (match(table[i])) removed.push(...table.splice(i, 1));
                return { data: project(removed), error: null };
            }
            let data = table.filter(match);
            if (state.order) {
                data = [...data].sort((a, b) => (state.order.ascending ? 1 : -1) * (Date.parse(a[state.order.col]) - Date.parse(b[state.order.col])));
            }
            if (state.limit !== null) data = data.slice(0, state.limit);
            return { data: data.map(r => JSON.parse(JSON.stringify(r))), error: null };
        };
        const api = {
            select(cols = '*') {
                if (state.op === 'select') state.returning = null;
                else state.returning = cols;
                return api;
            },
            eq(k, v) { state.filters.push([k, v]); return api; },
            order(col, { ascending }) { state.order = { col, ascending }; return api; },
            limit(n) { state.limit = n; return api; },
            insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
            update(payload) { state.op = 'update'; state.payload = payload; return api; },
            delete() { state.op = 'delete'; return api; },
            then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); }
        };
        return api;
    }

    return {
        from: () => builder(),
        table,
        calls,
        /** Simule une modification faite ailleurs (autre appareil, v3) */
        touch(name, user_id, data, updated_at) {
            const r = table.find(x => x.name === name && x.user_id === user_id);
            Object.assign(r, { data: sortKeys(data), updated_at: pgTime(updated_at) });
        },
        failNext(op) { failNext = op; }
    };
}
