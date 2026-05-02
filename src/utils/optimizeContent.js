const cheerio = require('cheerio');

// 内容优化函数
const optimizeContent = (content) => {
  const $ = cheerio.load(content);

  // 优化图片
  $('img').each((i, elem) => {
    const img = $(elem);
    // 添加懒加载
    img.attr('loading', 'lazy');
    // 添加alt属性（如果没有）
    if (!img.attr('alt')) {
      img.attr('alt', '图片');
    }
    // 添加响应式类
    img.addClass('responsive-image');
  });

  // 优化链接
  $('a').each((i, elem) => {
    const link = $(elem);
    const href = link.attr('href');
    if (href && !href.startsWith('/') && !href.startsWith('#')) {
      // 外部链接
      link.attr('target', '_blank');
      link.attr('rel', 'noopener noreferrer');
      // 添加外部链接图标类
      link.addClass('external-link');
    }
  });

  // 优化标题
  $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
    const heading = $(elem);
    // 添加锚点链接
    const id = heading.text().toLowerCase().replace(/\s+/g, '-');
    heading.attr('id', id);
  });

  // 优化表格
  $('table').each((i, elem) => {
    const table = $(elem);
    // 添加响应式表格包装
    table.wrap('<div class="table-responsive"></div>');
    table.addClass('table');
  });

  // 优化代码块
  $('pre').each((i, elem) => {
    const pre = $(elem);
    pre.addClass('code-block');
  });

  return $.html();
};

module.exports = { optimizeContent };
