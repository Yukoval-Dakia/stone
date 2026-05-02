// 使用 CDN 加速 GitHub raw 内容
function convertToCDN(githubUrl, country) {
  if (country === 'CN') {
    console.log('使用中国CDN:', githubUrl);
    console.log('国家:', country);
    return githubUrl
      .replace('https://raw.githubusercontent.com', 'https://cdn.jsdmirror.com/gh')
      .replace('/master/', '/');
  } else {
    console.log('使用国际CDN:', githubUrl);
    console.log('国家:', country);
    return githubUrl
      .replace('https://raw.githubusercontent.com', 'https://cdn.jsdelivr.net/gh')
      .replace('/master/', '/');
  }
}

module.exports = { convertToCDN };
