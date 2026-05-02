const axios = require('axios');

// 验证reCAPTCHA或Turnstile
async function verifyRecaptcha(token) {
  try {
    // 检查token长度来判断是reCAPTCHA还是Turnstile
    // Turnstile token通常比reCAPTCHA token短
    if (token.length < 100) {
      // 验证Cloudflare Turnstile
      const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // 测试密钥
      const response = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          secret: turnstileSecretKey,
          response: token
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.success;
    } else {
      // 验证Google reCAPTCHA
      const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // 测试密钥
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: recaptchaSecretKey,
            response: token
          }
        }
      );

      return response.data.success;
    }
  } catch (error) {
    console.error('验证码验证失败:', error);
    return false;
  }
}

module.exports = { verifyRecaptcha };
