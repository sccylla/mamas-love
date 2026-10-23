'use strict';
const cms = require('../lib/cms');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const session = await cms.session(req, false);
      return cms.reply(res, 200, { authenticated: Boolean(session), username: session?.username, storageConfigured: cms.configured() });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return cms.reply(res, 405, { error: 'Method not allowed.' }); }
    const input = await cms.body(req, 4096);
    if (input.action === 'login') return await cms.login(req, res, input);
    if (input.action === 'logout') return await cms.logout(req, res);
    throw cms.fail(400, 'Choose a valid sign-in action.');
  } catch (error) { cms.errorReply(res, error); }
};
