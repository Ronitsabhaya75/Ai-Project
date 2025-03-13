import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';

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

export default securityMiddleware;
