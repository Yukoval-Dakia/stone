jest.mock('axios');
const axios = require('axios');
const { verifyRecaptcha } = require('../../utils/captcha');

const shortToken = 'a'.repeat(50);
const longToken = 'a'.repeat(200);

describe('verifyRecaptcha', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.RECAPTCHA_SECRET_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Turnstile branch (token.length < 100)', () => {
    test('POSTs to Cloudflare with secret + response in JSON body', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      process.env.TURNSTILE_SECRET_KEY = 'real-turnstile-key';

      await verifyRecaptcha(shortToken);

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
      expect(body).toEqual({ secret: 'real-turnstile-key', response: shortToken });
      expect(config.headers['Content-Type']).toBe('application/json');
    });

    test('falls back to test secret when TURNSTILE_SECRET_KEY is unset', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      await verifyRecaptcha(shortToken);
      expect(axios.post.mock.calls[0][1].secret).toBe('1x0000000000000000000000000000000AA');
    });
  });

  describe('reCAPTCHA branch (token.length >= 100)', () => {
    test('POSTs to Google with secret + response as query params', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      process.env.RECAPTCHA_SECRET_KEY = 'real-recaptcha-key';

      await verifyRecaptcha(longToken);

      const [url, body, config] = axios.post.mock.calls[0];
      expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
      expect(body).toBeNull();
      expect(config.params).toEqual({ secret: 'real-recaptcha-key', response: longToken });
    });

    test('falls back to test secret when RECAPTCHA_SECRET_KEY is unset', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      await verifyRecaptcha(longToken);
      expect(axios.post.mock.calls[0][2].params.secret).toBe(
        '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
      );
    });
  });

  test('returns true when provider responds success:true', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    expect(await verifyRecaptcha(shortToken)).toBe(true);
  });

  test('returns false when provider responds success:false', async () => {
    axios.post.mockResolvedValue({ data: { success: false } });
    expect(await verifyRecaptcha(shortToken)).toBe(false);
  });

  test('returns false (not throws) when axios rejects', async () => {
    axios.post.mockRejectedValue(new Error('network down'));
    expect(await verifyRecaptcha(shortToken)).toBe(false);
  });
});
