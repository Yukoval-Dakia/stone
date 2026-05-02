const { optimizeContent } = require('../../utils/optimizeContent');
const cheerio = require('cheerio');

const parse = (html) => cheerio.load(html);

describe('optimizeContent', () => {
  describe('images', () => {
    test('adds loading=lazy, default alt, and responsive-image class', () => {
      const $ = parse(optimizeContent('<img src="a.jpg">'));
      const img = $('img');
      expect(img.attr('loading')).toBe('lazy');
      expect(img.attr('alt')).toBe('图片');
      expect(img.hasClass('responsive-image')).toBe(true);
    });

    test('preserves existing alt attribute', () => {
      const $ = parse(optimizeContent('<img src="a.jpg" alt="原图说明">'));
      expect($('img').attr('alt')).toBe('原图说明');
    });
  });

  describe('links', () => {
    test('external link gets target=_blank, rel, and external-link class', () => {
      const $ = parse(optimizeContent('<a href="https://example.com">x</a>'));
      const link = $('a');
      expect(link.attr('target')).toBe('_blank');
      expect(link.attr('rel')).toBe('noopener noreferrer');
      expect(link.hasClass('external-link')).toBe(true);
    });

    test('internal absolute path is not modified', () => {
      const $ = parse(optimizeContent('<a href="/about">x</a>'));
      const link = $('a');
      expect(link.attr('target')).toBeUndefined();
      expect(link.attr('rel')).toBeUndefined();
      expect(link.hasClass('external-link')).toBe(false);
    });

    test('hash anchor is not modified', () => {
      const $ = parse(optimizeContent('<a href="#section">x</a>'));
      expect($('a').attr('target')).toBeUndefined();
    });
  });

  describe('headings', () => {
    test('generates id from heading text with spaces hyphenated and lowercased', () => {
      const $ = parse(optimizeContent('<h2>Hello World</h2>'));
      expect($('h2').attr('id')).toBe('hello-world');
    });
  });

  describe('tables', () => {
    test('wraps table in div.table-responsive and adds table class', () => {
      const $ = parse(optimizeContent('<table><tr><td>x</td></tr></table>'));
      expect($('div.table-responsive > table').length).toBe(1);
      expect($('table').hasClass('table')).toBe(true);
    });
  });

  describe('code blocks', () => {
    test('adds code-block class to pre', () => {
      const $ = parse(optimizeContent('<pre>code</pre>'));
      expect($('pre').hasClass('code-block')).toBe(true);
    });
  });
});
