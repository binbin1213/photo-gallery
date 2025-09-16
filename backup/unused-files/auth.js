const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 简单的管理员认证（生产环境应该使用数据库）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  bcrypt.hashSync('admin123', 10); // 默认密码：admin123

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: { username, role: 'admin' },
      expiresIn: 24 * 60 * 60 * 1000 // 24小时
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 验证token
router.get('/verify', (req, res) => {
  res.json({ message: 'Auth route working' });
});

module.exports = router;