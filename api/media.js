'use strict';
const { randomUUID } = require('node:crypto');
const cms = require('../lib/cms');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const id = new URL(req.url, 'http://localhost').searchParams.get('id');
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id || '')) throw cms.fail(404, 'Picture not found.');
      const raw = await cms.redis(['GET', `mamas:cms:media:${id}`]);
      if (!raw) throw cms.fail(404, 'Picture not found.');
      const image = JSON.parse(raw);
      res.statusCode = 200;
      res.setHeader('Content-Type', image.type);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Content-Disposition', `inline; filename="${id}.${image.type.split('/')[1]}"`);
      return res.end(Buffer.from(image.data, 'base64'));
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return cms.reply(res, 405, { error: 'Method not allowed.' }); }
    await cms.session(req);
    const input = await cms.body(req, 850 * 1024);
    const match = typeof input.data === 'string' && /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.data);
    if (!match) throw cms.fail(400, 'Upload a JPG, PNG or WebP picture.');
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length < 24 || bytes.length > 600 * 1024) throw cms.fail(413, 'Pictures must be smaller than 600 KB after resizing.');
    const valid = match[1] === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : match[1] === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) throw cms.fail(400, 'The picture file is invalid.');
    const id = randomUUID();
    await cms.redis(['SET', `mamas:cms:media:${id}`, JSON.stringify({ type: match[1], data: bytes.toString('base64') })]);
    cms.reply(res, 201, { url: `/api/media?id=${id}` });
  } catch (error) { cms.errorReply(res, error); }
};
