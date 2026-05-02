const { getRandomImage } = require('../../utils/randomImage');
const ACG_IMAGES = require('../../acg-images.json');

describe('getRandomImage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('CN country returns first ACG image converted to jsdmirror CDN', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const expected = ACG_IMAGES[0]
      .replace('https://raw.githubusercontent.com', 'https://cdn.jsdmirror.com/gh')
      .replace('/master/', '/');
    expect(await getRandomImage('CN')).toBe(expected);
  });

  test('non-CN country returns first ACG image converted to jsDelivr CDN', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const expected = ACG_IMAGES[0]
      .replace('https://raw.githubusercontent.com', 'https://cdn.jsdelivr.net/gh')
      .replace('/master/', '/');
    expect(await getRandomImage('US')).toBe(expected);
  });

  test('falls back to picsum when something throws inside the try block', async () => {
    jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await getRandomImage('US')).toBe('https://picsum.photos/800/400');
  });
});
