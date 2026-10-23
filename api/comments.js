'use strict';

// Connect an Upstash Redis database in Vercel Storage. These private values are
// read only on the server: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN,
// or the Vercel integration's KV_REST_API_URL / KV_REST_API_TOKEN.
const { randomUUID, createHmac } = require('node:crypto');
// Keep in sync when publishing new articles in assets/content.js.
const POSTS = new Set(['cycle', 'period-warning-signs', 'pregnancy', 'first-trimester', 'postpartum', 'postpartum-mood', 'newborn', 'safe-sleep', 'baby-milestones', 'body']);
const UNAVAILABLE = { error: 'Comments are temporarily unavailable. Please try again later.', code: 'COMMENTS_UNAVAILABLE' };
const LIMIT = 10 * 1024;
const SAVE_COMMENT = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= 5 then return {0, redis.call('TTL', KEYS[1])} end
count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], 600) end
redis.call('LPUSH', KEYS[2], ARGV[1])
return {1, 0}
`;

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}
function header(req, key) { return String(req.headers?.[key] || '').split(',')[0].trim(); }
function trustedOrigin(req) {
  const origin = header(req, 'origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = header(req, 'host') || header(req, 'x-forwarded-host');
    const protocol = header(req, 'x-forwarded-proto') || (req.socket?.encrypted ? 'https' : 'http');
    return parsed.origin === `${protocol}://${host}`;
  } catch { return false; }
}
async function body(req) {
  if (Number(header(req, 'content-length')) > LIMIT) throw Object.assign(new Error('Comment request is too large.'), { status: 413 });
  let raw = req.body;
  if (raw === undefined) {
    const chunks = []; let length = 0;
    for await (const chunk of req) {
      length += Buffer.byteLength(chunk);
      if (length > LIMIT) throw Object.assign(new Error('Comment request is too large.'), { status: 413 });
      chunks.push(Buffer.from(chunk));
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw ?? null)) > LIMIT) throw Object.assign(new Error('Comment request is too large.'), { status: 413 });
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw Object.assign(new Error('Please send a valid comment.'), { status: 400 }); }
}

module.exports = async function comments(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  if (!['GET', 'POST'].includes(method)) {
    res.setHeader('Allow', 'GET, POST');
    return reply(res, 405, { error: 'Method not allowed.' });
  }
  if (!trustedOrigin(req)) return reply(res, 403, { error: 'This request is not allowed.' });
  let input;
  if (method === 'POST') {
    if (!/^application\/json(?:\s*;|$)/i.test(header(req, 'content-type'))) return reply(res, 415, { error: 'Please send a JSON comment.' });
    try { input = await body(req); }
    catch (error) { return reply(res, error.status || 400, { error: error.message }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(res, 400, { error: 'Please send a valid comment.' });
  }
  let post;
  try { post = method === 'GET' ? new URL(req.url || '/', 'http://localhost').searchParams.get('post') : input.post; }
  catch { return reply(res, 400, { error: 'Please choose a valid post.' }); }
  if (typeof post !== 'string' || !POSTS.has(post)) return reply(res, 400, { error: 'Please choose a valid post.' });
  let name, comment;
  if (method === 'POST') {
    name = typeof input.name === 'string' ? input.name.trim() : '';
    comment = typeof input.comment === 'string' ? input.comment.trim() : '';
    if (name.length < 2 || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) return reply(res, 400, { error: 'Use a name between 2 and 60 characters.' });
    if (comment.length < 2 || comment.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(comment)) return reply(res, 400, { error: 'Write a comment between 2 and 2,000 characters.' });
    if (input.website !== undefined && (typeof input.website !== 'string' || input.website.trim())) return reply(res, 400, { error: 'Unable to post this comment.' });
  }
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return reply(res, 503, UNAVAILABLE);
  async function redis(command) {
    const response = await fetch(url, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command), signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new Error('Storage unavailable.');
    const result = await response.json();
    if (result.error || !Object.prototype.hasOwnProperty.call(result, 'result')) throw new Error('Storage unavailable.');
    return result.result;
  }
  const key = `mamas:comments:v1:post:${post}`;
  try {
    if (method === 'GET') {
      const items = await redis(['LRANGE', key, 0, 49]);
      if (!Array.isArray(items)) throw new Error('Invalid storage result.');
      const comments = items.map(item => JSON.parse(item));
      if (comments.some(item => !item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.comment !== 'string' || typeof item.createdAt !== 'string')) throw new Error('Invalid stored comment.');
      return reply(res, 200, { comments });
    }
    const entry = { id: randomUUID(), name, comment, createdAt: new Date().toISOString() };
    const ip = header(req, 'x-forwarded-for') || header(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown';
    const identifier = createHmac('sha256', token).update(ip).digest('hex').slice(0, 40);
    const outcome = await redis(['EVAL', SAVE_COMMENT, 2, `mamas:comments:v1:rate:${identifier}`, key, JSON.stringify(entry)]);
    if (!Array.isArray(outcome) || ![0, 1].includes(outcome[0])) throw new Error('Invalid storage result.');
    if (outcome[0] === 0) {
      res.setHeader('Retry-After', String(Math.max(1, Number(outcome[1]) || 600)));
      return reply(res, 429, { error: 'You’ve posted several comments. Please wait a few minutes before posting again.', code: 'RATE_LIMITED' });
    }
    return reply(res, 201, { comment: entry });
  } catch {
    return reply(res, 503, UNAVAILABLE);
  }
};
