const ACG_IMAGES = require('../acg-images.json');
const { convertToCDN } = require('./cdn');

// 获取随机ACG图片
const getRandomImage = async (country) => {
  try {
    // 直接从预加载的列表中随机选择
    const randomImage = ACG_IMAGES[Math.floor(Math.random() * ACG_IMAGES.length)];
    // 使用 jsDelivr CDN
    return convertToCDN(randomImage, country);
  } catch (error) {
    console.error('获取随机图片失败:', error);
    // 如果出错则使用 Picsum 作为后备
    return 'https://picsum.photos/800/400';
  }
};

module.exports = { getRandomImage };
