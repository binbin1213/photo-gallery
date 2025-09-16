const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Star = require('./models/Star');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 启动泰海男星图鉴API服务...');

// 连接 MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thai-stars';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

connectDB();

// 基本中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/app/uploads/photos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 获取所有明星信息
app.get('/api/stars', async (req, res) => {
  try {
    const { search, month, university } = req.query;
    let query = { isActive: true };

    // 搜索功能
    if (search) {
      query.$or = [
        { englishName: { $regex: search, $options: 'i' } },
        { chineseName: { $regex: search, $options: 'i' } },
        { thaiName: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } }
      ];
    }

    // 按月份筛选
    if (month) {
      query.birthMonth = parseInt(month);
    }

    // 按大学筛选
    if (university) {
      query.university = { $regex: university, $options: 'i' };
    }

    const stars = await Star.find(query).sort({ birthMonth: 1, englishName: 1 });
    res.json({ stars });
  } catch (error) {
    console.error('获取明星列表失败:', error);
    res.status(500).json({ error: '获取明星列表失败' });
  }
});

// 获取单个明星详细信息
app.get('/api/stars/:id', async (req, res) => {
  try {
    const star = await Star.findById(req.params.id);
    if (!star) {
      return res.status(404).json({ error: '明星信息不存在' });
    }
    res.json({ star });
  } catch (error) {
    console.error('获取明星详情失败:', error);
    res.status(500).json({ error: '获取明星详情失败' });
  }
});

// 根据照片文件名获取明星信息
app.get('/api/stars/by-photo/:filename', async (req, res) => {
  try {
    const star = await Star.findOne({ 
      photoFilename: req.params.filename,
      isActive: true 
    });
    if (!star) {
      return res.status(404).json({ error: '明星信息不存在' });
    }
    res.json({ star });
  } catch (error) {
    console.error('根据照片获取明星信息失败:', error);
    res.status(500).json({ error: '获取明星信息失败' });
  }
});

// 批量导入明星数据
app.post('/api/stars/import', async (req, res) => {
  try {
    const { stars } = req.body;
    
    if (!Array.isArray(stars)) {
      return res.status(400).json({ error: '请提供正确的明星数据数组' });
    }

    // 清空现有数据（可选）
    if (req.query.clear === 'true') {
      await Star.deleteMany({});
      console.log('已清空现有数据');
    }

    // 批量插入
    const result = await Star.insertMany(stars);
    console.log(`成功导入 ${result.length} 条明星数据`);

    res.json({ 
      success: true, 
      count: result.length,
      message: `成功导入 ${result.length} 条明星数据`
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ error: '批量导入失败: ' + error.message });
  }
});

// 创建或更新明星信息
app.post('/api/stars', async (req, res) => {
  try {
    const star = new Star(req.body);
    await star.save();
    res.json({ success: true, star });
  } catch (error) {
    console.error('创建明星信息失败:', error);
    res.status(500).json({ error: '创建明星信息失败: ' + error.message });
  }
});

// 更新明星信息
app.put('/api/stars/:id', async (req, res) => {
  try {
    const star = await Star.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!star) {
      return res.status(404).json({ error: '明星信息不存在' });
    }
    res.json({ success: true, star });
  } catch (error) {
    console.error('更新明星信息失败:', error);
    res.status(500).json({ error: '更新明星信息失败: ' + error.message });
  }
});

// 删除明星信息
app.delete('/api/stars/:id', async (req, res) => {
  try {
    const star = await Star.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { new: true }
    );
    if (!star) {
      return res.status(404).json({ error: '明星信息不存在' });
    }
    res.json({ success: true, message: '明星信息已删除' });
  } catch (error) {
    console.error('删除明星信息失败:', error);
    res.status(500).json({ error: '删除明星信息失败: ' + error.message });
  }
});

// 文件上传接口
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log('文件上传成功:', req.file.filename);
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
});

// 多文件上传接口
app.post('/api/upload-multiple', upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    console.log(`批量上传成功: ${req.files.length} 个文件`);

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      files: uploadedFiles,
      count: req.files.length,
      message: `成功上传 ${req.files.length} 个文件`
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({ error: '批量上传失败: ' + error.message });
  }
});

// 删除文件接口
app.delete('/api/photos/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('/app/uploads/photos', filename);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 删除文件
    await fs.unlink(filePath);

    // 同时删除数据库中的相关记录
    await Star.findOneAndUpdate(
      { photoFilename: filename },
      { isActive: false }
    );

    console.log('文件删除成功:', filename);
    res.json({ success: true, message: '文件删除成功' });
  } catch (error) {
    console.error('文件删除失败:', error);
    res.status(500).json({ error: '文件删除失败: ' + error.message });
  }
});

// 替换文件接口
app.post('/api/photos/:filename/replace', upload.single('photo'), async (req, res) => {
  try {
    const { filename } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const oldFilePath = path.join('/app/uploads/photos', filename);
    const newFilePath = path.join('/app/uploads/photos', req.file.filename);

    // 检查原文件是否存在
    try {
      await fs.access(oldFilePath);
    } catch (error) {
      // 如果原文件不存在，直接使用新文件
      console.log('原文件不存在，直接使用新文件:', filename);
      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        message: '文件替换成功'
      });
      return;
    }

    // 删除原文件
    await fs.unlink(oldFilePath);

    // 将新文件重命名为原文件名
    await fs.rename(newFilePath, oldFilePath);

    console.log('文件替换成功:', filename, '->', req.file.filename);
    res.json({
      success: true,
      filename: filename, // 保持原文件名
      originalName: req.file.originalname,
      size: req.file.size,
      message: '文件替换成功'
    });
  } catch (error) {
    console.error('文件替换失败:', error);
    res.status(500).json({ error: '文件替换失败: ' + error.message });
  }
});

// 提供静态文件服务
app.use('/uploads', express.static('/app/uploads'));

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 泰海男星图鉴API服务已启动`);
  console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`📸 照片目录: /app/uploads/photos`);
  console.log(`🗄️ 数据库: MongoDB`);
});
