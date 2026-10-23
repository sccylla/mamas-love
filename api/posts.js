'use strict';
const cms = require('../lib/cms');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const admin = new URL(req.url, 'http://localhost').searchParams.get('admin') === '1';
      if (admin) await cms.session(req);
      if (!cms.configured()) {
        if (admin) throw cms.fail(503, 'Connect Upstash Redis and redeploy to manage posts.', 'STORAGE_NOT_CONFIGURED');
        return cms.reply(res, 200, { posts: cms.defaults });
      }
      const posts = await cms.allPosts();
      return cms.reply(res, 200, { posts: admin ? posts : posts.filter(post => post.status === 'published') });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return cms.reply(res, 405, { error: 'Method not allowed.' }); }
    await cms.session(req);
    const input = await cms.body(req);
    const post = await cms.savePost(input);
    cms.reply(res, 200, { post });
  } catch (error) { cms.errorReply(res, error); }
};
