const mathCaptchaService = require('../services/mathCaptchaService');

function createCaptchaController(service = mathCaptchaService) {
  function handler(action, message) {
    return async (req, res, next) => {
      res.set('Cache-Control', 'no-store');
      try {
        const data = await action(req.body === undefined ? {} : req.body);
        return res.status(200).json({ success: true, message, data });
      } catch (error) {
        if (error?.name !== 'MathCaptchaError') return next(error);
        return res.status(error.statusCode).json({
          success: false, message: error.message, code: error.code, data: error.data,
        });
      }
    };
  }

  return {
    createCaptchaChallenge: handler((body) => service.createChallenge(body), 'CAPTCHA challenge created'),
    verifyCaptchaChallenge: handler((body) => service.verifyChallenge(body), 'CAPTCHA verified'),
  };
}

module.exports = { ...createCaptchaController(), createCaptchaController };
