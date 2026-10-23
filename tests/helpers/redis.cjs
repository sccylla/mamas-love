'use strict';
const http = require('node:http');
// A test-only Redis REST double. Production always calls connected Upstash.
module.exports = async function fixture() {
  const values = new Map(), hashes = new Map(), lists = new Map(), expires = new Map();
  let broken = false;
  function get(key) {
    if (expires.has(key) && expires.get(key) <= Date.now()) { values.delete(key); expires.delete(key); }
    return values.get(key) ?? null;
  }
  function run(command) {
    const [name, ...args] = command;
    if (name === 'GET') return get(args[0]);
    if (name === 'SET') { values.set(args[0], args[1]); const index = args.indexOf('EX'); if (index !== -1) expires.set(args[0], Date.now() + Number(args[index + 1]) * 1000); return 'OK'; }
    if (name === 'DEL') { values.delete(args[0]); expires.delete(args[0]); return 1; }
    if (name === 'HGET') return hashes.get(args[0])?.get(args[1]) ?? null;
    if (name === 'HGETALL') return [...(hashes.get(args[0]) || new Map()).entries()].flat();
    if (name === 'LRANGE') return (lists.get(args[0]) || []).slice(Number(args[1]), Number(args[2]) + 1);
    if (name === 'EVAL' && args[0].includes('-- login-rate')) {
      const key = args[2], count = Number(get(key) || 0) + 1; values.set(key, count); if (count === 1) expires.set(key, Date.now() + 900000); return count;
    }
    if (name === 'EVAL' && args[0].includes('-- save-post')) {
      const [, , key, id, revision, encoded] = args;
      const table = hashes.get(key) || new Map();
      const previous = table.has(id) ? JSON.parse(table.get(id)) : null;
      if ((previous?.revision || 0) !== Number(revision)) return [0];
      table.set(id, encoded); hashes.set(key, table); return [1, encoded];
    }
    if (name === 'EVAL' && args[0].includes('LPUSH')) {
      const [, , key, list, entry] = args;
      const count = Number(get(key) || 0); if (count >= 5) return [0, 600];
      values.set(key, count + 1); lists.set(list, [entry, ...(lists.get(list) || [])]); return [1, 0];
    }
    throw new Error('Unexpected Redis command: ' + name);
  }
  const server = http.createServer(async (req, res) => {
    if (broken) { res.writeHead(503); return res.end('{}'); }
    if (req.headers.authorization !== 'Bearer cms-test-token') { res.writeHead(401); return res.end('{}'); }
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const result = run(JSON.parse(Buffer.concat(chunks)));
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ result }));
    } catch (error) { res.end(JSON.stringify({ error: error.message })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, values, hashes, lists, expires, break(value) { broken = value; }, url: `http://127.0.0.1:${server.address().port}` };
};
