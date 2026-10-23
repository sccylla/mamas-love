'use strict';
module.exports = (_req, res) => {
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found.');
};
