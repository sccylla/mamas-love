'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const defaults = require('../data/posts.json');
const credentials = require('./admin-credentials');
const scrypt = promisify(crypto.scrypt);
const POSTS_KEY = 'mamas:cms:posts:v1';
const SESSION_SECONDS = 12 * 60 * 60;
const validId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(id);
const configured = () => Boolean((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));
const fail = (status, message, code) => Object.assign(new Error(message), { status, code });
function reply(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(value));
}
function errorReply(res, error) {
  reply(res, error.status || 503, { error: error.status ? error.message : 'Storage is temporarily unavailable. Please try again.', ...(error.code ? { code: error.code } : {}) });
}
function header(req, key) { return String(req.headers?.[key] || '').split(',')[0].trim(); }
function secure(req) { return header(req, 'x-forwarded-proto') === 'https' || Boolean(req.socket?.encrypted); }
function requireOrigin(req) {
  const origin = header(req, 'origin');
  const expected = `${secure(req) ? 'https' : 'http'}://${header(req, 'host')}`;
  if (origin !== expected || header(req, 'sec-fetch-site') === 'cross-site') throw fail(403, 'This request is not allowed.');
}
async function body(req, limit = 180 * 1024) {
  requireOrigin(req);
  if (!/^application\/json(?:\s*;|$)/i.test(header(req, 'content-type'))) throw fail(415, 'Please send JSON.');
  if (Number(header(req, 'content-length')) > limit) throw fail(413, 'The upload is too large.');
  let raw = req.body;
  if (raw === undefined) {
    let size = 0; const chunks = [];
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > limit) throw fail(413, 'The upload is too large.');
      chunks.push(Buffer.from(chunk));
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw ?? null)) > limit) throw fail(413, 'The upload is too large.');
  let value;
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw fail(400, 'Please send valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(400, 'Please send a valid form.');
  return value;
}
async function redis(command) {
  if (!configured()) throw fail(503, 'Connect Upstash Redis to this Vercel project, then redeploy to enable the admin area.', 'STORAGE_NOT_CONFIGURED');
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command), signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Storage unavailable.');
  const result = await response.json();
  if (result.error || !Object.hasOwn(result, 'result')) throw new Error('Storage unavailable.');
  return result.result;
}
const passwordHash = () => process.env.ADMIN_PASSWORD_HASH || credentials.passwordHash;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function cookieName(req) { return secure(req) ? '__Host-mamas_admin' : 'mamas_admin'; }
function sessionKey(token) { return `mamas:cms:session:${digest(token)}`; }
function setCookie(req, res, token, seconds) {
  res.setHeader('Set-Cookie', `${cookieName(req)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure(req) ? '; Secure' : ''}`);
}
function tokenFrom(req) {
  const prefix = `${cookieName(req)}=`;
  const token = String(req.headers?.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length);
  return /^[a-f0-9]{64}$/.test(token || '') ? token : null;
}
async function session(req, required = true) {
  const token = tokenFrom(req);
  const value = token ? await redis(['GET', sessionKey(token)]) : null;
  let result;
  try { result = value ? JSON.parse(value) : null; } catch { result = null; }
  if (!result || result.credential !== digest(passwordHash()) || result.expiresAt <= Date.now()) {
    if (required) throw fail(401, 'Please sign in to continue.');
    return null;
  }
  return result;
}
async function login(req, res, input) {
  const ip = header(req, 'x-vercel-forwarded-for') || header(req, 'x-forwarded-for') || req.socket?.remoteAddress || 'unknown';
  const rateKey = `mamas:cms:login:${digest(ip)}`;
  const attempts = await redis(['EVAL', `-- login-rate
local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n`, 1, rateKey]);
  if (Number(attempts) > 10) { res.setHeader('Retry-After', '900'); throw fail(429, 'Too many sign-in attempts. Try again in 15 minutes.'); }
  const [scheme, salt, expected] = passwordHash().split(':');
  if (scheme !== 'scrypt' || !/^[a-f0-9]{48}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) throw fail(503, 'Admin credentials need configuration.');
  const password = typeof input.password === 'string' && input.password.length <= 256 ? input.password : '';
  const actual = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const valid = crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
  if (!valid || input.username !== (process.env.ADMIN_USERNAME || credentials.username)) throw fail(401, 'The username or password is incorrect.');
  const token = crypto.randomBytes(32).toString('hex');
  const record = { username: input.username, credential: digest(passwordHash()), expiresAt: Date.now() + SESSION_SECONDS * 1000 };
  await redis(['SET', sessionKey(token), JSON.stringify(record), 'EX', SESSION_SECONDS]);
  setCookie(req, res, token, SESSION_SECONDS);
  reply(res, 200, { authenticated: true, username: record.username });
}
async function logout(req, res) {
  const token = tokenFrom(req);
  if (token) await redis(['DEL', sessionKey(token)]);
  setCookie(req, res, '', 0);
  reply(res, 200, { authenticated: false });
}
async function allPosts() {
  const raw = await redis(['HGETALL', POSTS_KEY]);
  const fields = Array.isArray(raw) ? Object.fromEntries(Array.from({ length: raw.length / 2 }, (_, index) => [raw[index * 2], raw[index * 2 + 1]])) : raw || {};
  const posts = new Map(defaults.map(post => [post.id, { ...post, status: 'published', revision: 0 }]));
  for (const [id, value] of Object.entries(fields)) {
    const post = typeof value === 'string' ? JSON.parse(value) : value;
    if (!post || post.id !== id || !validId(id) || !Array.isArray(post.sections)) throw new Error('Invalid stored post.');
    posts.set(id, post);
  }
  return [...posts.values()].sort((a, b) => (Date.parse(b.publishedAt || b.createdAt) || 0) - (Date.parse(a.publishedAt || a.createdAt) || 0));
}
async function publishedPost(id) {
  if (!validId(id)) return false;
  const raw = await redis(['HGET', POSTS_KEY, id]);
  return raw ? JSON.parse(raw).status === 'published' : defaults.some(post => post.id === id);
}
function text(value, name, max, min = 0) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw fail(400, `${name} must contain ${min}–${max} characters.`);
  return value.trim();
}
const imagePath = path => typeof path === 'string' && (/^[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g)$/i.test(path) || /^\/api\/media\?id=[a-f0-9-]{36}$/.test(path));
function validatePost(input) {
  const title = text(input.title, 'Title', 180, 3);
  const id = input.id || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'post'}-${crypto.randomUUID().slice(0, 8)}`;
  if (!validId(id)) throw fail(400, 'The post address is invalid.');
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw fail(400, 'Reload this post before saving.');
  if (!['draft', 'published'].includes(input.status)) throw fail(400, 'Choose Draft or Published.');
  if (!imagePath(input.image)) throw fail(400, 'Choose or upload a cover picture.');
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 40) throw fail(400, 'Write at least one section (up to 40).');
  const sections = input.sections.map(section => {
    if (!section || !Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.length > 60) throw fail(400, 'Each section needs at least one paragraph.');
    return { heading: text(section.heading || '', 'Section heading', 200), paragraphs: section.paragraphs.map(paragraph => text(paragraph, 'Paragraph', 6000, 1)) };
  });
  const gallery = input.gallery || [];
  if (!Array.isArray(gallery) || gallery.length > 8) throw fail(400, 'Use up to eight extra pictures.');
  const pictures = gallery.map(picture => {
    if (!picture || !imagePath(picture.url)) throw fail(400, 'One of the pictures is invalid.');
    return { url: picture.url, alt: text(picture.alt || '', 'Picture description', 240) };
  });
  const sources = input.sources || [];
  if (!Array.isArray(sources) || sources.length > 15) throw fail(400, 'Use up to 15 source links.');
  const links = sources.map(source => {
    if (!source || typeof source.url !== 'string' || source.url.length > 2000) throw fail(400, 'One of the source links is invalid.');
    try { const url = new URL(source.url); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(); }
    catch { throw fail(400, 'Source links must start with http:// or https://.'); }
    return { label: text(source.label, 'Source label', 160, 1), url: source.url };
  });
  return { id, title, summary: text(input.summary, 'Summary', 500, 5), category: text(input.category, 'Category', 60, 2), author: text(input.author || 'Mama’s Love', 'Author', 80, 1), image: input.image, imageAlt: text(input.imageAlt || '', 'Cover description', 240), sections, gallery: pictures, sources: links, status: input.status, revision: input.revision + 1 };
}
async function savePost(input) {
  const post = validatePost(input);
  const now = new Date().toISOString();
  const previous = await redis(['HGET', POSTS_KEY, post.id]);
  const old = previous ? JSON.parse(previous) : null;
  post.createdAt = old?.createdAt || now;
  post.updatedAt = now;
  if (post.status === 'published') post.publishedAt = old?.publishedAt || now;
  else if (old?.publishedAt) post.publishedAt = old.publishedAt;
  const encoded = JSON.stringify(post);
  // Store the original JSON so Redis Lua doesn't turn empty arrays into objects.
  // The revision comparison and write are atomic, including for a new post.
  const result = await redis(['EVAL', `-- save-post
local raw=redis.call('HGET',KEYS[1],ARGV[1]); local old=nil; local revision=0
if raw then old=cjson.decode(raw); revision=old.revision end
if revision~=tonumber(ARGV[2]) then return {0} end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[3]); return {1,ARGV[3]}`, 1, POSTS_KEY, post.id, input.revision, encoded]);
  if (!Array.isArray(result) || result[0] !== 1) throw fail(409, 'This post changed in another window. Reload it before saving.');
  return JSON.parse(result[1]);
}
module.exports = { configured, defaults, fail, reply, errorReply, header, body, redis, session, login, logout, allPosts, publishedPost, savePost, validId };
