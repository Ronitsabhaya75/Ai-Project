const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');

const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
  }),
  (req, res, next) => {
    if (req.body.code) {
      req.body.code = sanitizeHtml(req.body.code, {
        allowedTags: [],
        allowedAttributes: {}
      });
    }
    next();
  }
];

module.exports = securityMiddleware;