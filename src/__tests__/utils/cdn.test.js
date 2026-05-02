const { convertToCDN } = require('../../utils/cdn');

describe('convertToCDN', () => {
  const masterUrl = 'https://raw.githubusercontent.com/jyeric/acg-pictures/master/1.jpg';

  test('CN country uses jsdmirror and strips /master/', () => {
    expect(convertToCDN(masterUrl, 'CN')).toBe(
      'https://cdn.jsdmirror.com/gh/jyeric/acg-pictures/1.jpg'
    );
  });

  test('non-CN country uses jsDelivr and strips /master/', () => {
    expect(convertToCDN(masterUrl, 'US')).toBe(
      'https://cdn.jsdelivr.net/gh/jyeric/acg-pictures/1.jpg'
    );
  });

  test('empty country (default from middleware) uses international CDN', () => {
    expect(convertToCDN(masterUrl, '')).toBe(
      'https://cdn.jsdelivr.net/gh/jyeric/acg-pictures/1.jpg'
    );
  });

  test('URL without /master/ still gets CDN substituted', () => {
    const url = 'https://raw.githubusercontent.com/owner/repo/main/x.png';
    expect(convertToCDN(url, 'US')).toBe(
      'https://cdn.jsdelivr.net/gh/owner/repo/main/x.png'
    );
  });

  test('URL not pointing at raw.githubusercontent.com is returned unchanged', () => {
    const url = 'https://example.com/foo.jpg';
    expect(convertToCDN(url, 'CN')).toBe(url);
    expect(convertToCDN(url, 'US')).toBe(url);
  });
});
