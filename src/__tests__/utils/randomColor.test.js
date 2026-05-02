const { generateRandomColor } = require('../../utils/randomColor');

const COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f1c40f',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
];

describe('generateRandomColor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(COLORS.map((c, i) => [i, c]))(
    'Math.random index %i -> %s',
    (index, expectedColor) => {
      jest.spyOn(Math, 'random').mockReturnValue(index / COLORS.length);
      expect(generateRandomColor()).toBe(expectedColor);
    }
  );

  test('returns a 7-char hex string starting with #', () => {
    const result = generateRandomColor();
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
