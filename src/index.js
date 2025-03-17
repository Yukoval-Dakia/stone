const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const cheerio = require('cheerio');
const path = require('path');
const scientistsRouter = require('./routes/scientists');
const messagesRouter = require('./routes/messages');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const WP_URL = process.env.WP_URL || 'http://wordpress:80';

// 请求日志中间件
app.use((req, res, next) => {
  console.log('收到请求:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  next();
});

// 处理OPTIONS预检请求
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('收到OPTIONS预检请求');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.status(200).end();
    return;
  }
  next();
});

// CORS配置
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
  'https://yukoval-dakia.github.io',
  'http://localhost:3000',
  'https://worship.yukovalstudios.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('不允许的来源:', origin);
      callback(new Error('不允许的来源'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 预检请求结果缓存24小时
}));

// 基本中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static('public'));

// API路由
app.use('/api/scientists', scientistsRouter);
app.use('/api/messages', messagesRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  if (err.message === '不允许的来源') {
    return res.status(403).json({
      message: '不允许的来源',
      error: err.message
    });
  }
  res.status(500).json({
    message: '服务器内部错误',
    error: err.message
  });
});

console.log('启动服务器...');
console.log('环境变量:', {
  PORT,
  WP_URL,
  NODE_ENV: process.env.NODE_ENV
});

// MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/center-believer';

const connectWithRetry = () => {
  console.log('尝试连接MongoDB:', MONGODB_URI);
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 2000,
  })
    .then(() => {
      console.log('MongoDB连接成功');
      // 在MongoDB连接成功后启动服务器
      const server = app.listen(PORT, () => {
        console.log(`服务器运行在端口：${PORT}`);
        console.log(`WordPress URL: ${WP_URL}`);
        console.log('CORS origin:', 'http://localhost:3000');
      });

      // 处理进程信号
      process.on('SIGTERM', () => {
        console.log('收到 SIGTERM 信号，正在关闭服务器...');
        server.close(() => {
          console.log('服务器已关闭');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('收到 SIGINT 信号，正在关闭服务器...');
        server.close(() => {
          console.log('服务器已关闭');
          process.exit(0);
        });
      });
    })
    .catch((error) => {
      console.error('MongoDB连接失败:', error);
      console.log('5秒后重试连接...');
      setTimeout(connectWithRetry, 5000);
    });
};

// 监听MongoDB连接事件
mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB连接断开，尝试重新连接...');
  setTimeout(connectWithRetry, 5000);
});

connectWithRetry();

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

// API路由
app.get('/api/health', (req, res) => {
  console.log('收到健康检查请求');
  res.json({ status: 'ok', message: '拜中心会后端API服务正常运行' });
});

// WordPress内容API
app.get('/api/wordpress/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const wpApiUrl = `${WP_URL}/wp-json/wp/v2/pages?slug=${slug}&_embed`;
    console.log('请求WordPress API:', wpApiUrl);
    
    const response = await axios.get(wpApiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('WordPress API响应:', response.data);
    
    if (response.data && response.data.length > 0) {
      const page = response.data[0];
      
      // 优化内容
      if (page.content && page.content.rendered) {
        page.content.rendered = optimizeContent(page.content.rendered);
      }
      
      res.json(page);
    } else {
      console.log('未找到页面内容，slug:', slug);
      res.status(404).json({ message: '未找到页面内容' });
    }
  } catch (error) {
    console.error('WordPress API错误:', error.message);
    console.error('完整错误:', error);
    
    res.status(500).json({ 
      message: '无法获取WordPress内容', 
      error: error.message,
      wpUrl: WP_URL,
      requestUrl: `${WP_URL}/wp-json/wp/v2/pages?slug=${req.params.slug}`,
      details: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
});

// 获取最新新闻
app.get('/api/wordpress/posts', async (req, res) => {
  try {
    const response = await axios.get(`${WP_URL}/wp-json/wp/v2/posts?_embed`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // 优化每篇文章的内容
    const optimizedPosts = response.data.map(post => {
      if (post.content && post.content.rendered) {
        post.content.rendered = optimizeContent(post.content.rendered);
      }
      return post;
    });
    
    res.json(optimizedPosts);
  } catch (error) {
    console.error('WordPress API错误:', error);
    res.status(500).json({ 
      message: '无法获取WordPress文章', 
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
});

// 获取单个文章
app.get('/api/wordpress/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${WP_URL}/wp-json/wp/v2/posts/${id}?_embed`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('WordPress API错误:', error);
    res.status(500).json({ 
      message: '无法获取文章内容', 
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
}); 
