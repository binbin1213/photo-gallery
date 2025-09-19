const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Star = require('./models/Star');
const XLSX = require('xlsx'); // 用于解析Excel文件
const { thumbnailMiddleware, preGenerateThumbnails } = require('./middleware/thumbnailGenerator');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');

// TMDB API配置
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZWRhYTA1YzBmY2RlMmRiYjE3ZTdjZDg4ZDI0ZjNkOSIsIm5iZiI6MTU5OTk2NjM5MS43NDcsInN1YiI6IjVmNWQ4Y2I3NjNkOTM3MDAzNmJiMmZjMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.saAFMNKEZz_51mxXyTq-CjJSMI3Tjpk6KzTmbYQqaCo';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 配置代理（如果需要）
const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// TMDB API请求函数
function makeTMDBRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
        'accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      agent: agent
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(result)
          });
        } catch (e) {
          reject(new Error(`JSON解析失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`请求失败: ${e.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时 (30秒)'));
    });

    req.end();
  });
}

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

// 专门用于表格文件的multer配置
const tableUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/tmp'); // 使用临时目录
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'table-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    // 允许Excel和CSV文件
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv 的另一种MIME类型
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel或CSV文件'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制，表格文件通常较小
  }
});

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  try {
    // 总明星数
    const totalStars = await Star.countDocuments({ isActive: true })
    
    // 学校数量（去重）
    const universities = await Star.distinct('university', { 
      isActive: true, 
      university: { $exists: true, $ne: null, $ne: '' } 
    })
    const totalUniversities = universities.length
    
    // 平均年龄 - 优先使用age字段，如果没有则从birthDate计算
    let averageAge = 0
    
    // 先尝试使用age字段
    const starsWithAge = await Star.find({ 
      isActive: true, 
      age: { $exists: true, $ne: null, $gt: 0 } 
    }).select('age')
    
    if (starsWithAge.length > 0) {
      averageAge = Math.round(starsWithAge.reduce((sum, star) => sum + star.age, 0) / starsWithAge.length)
    } else {
      // 如果没有age字段，从birthDate计算
      const starsWithBirthDate = await Star.find({ 
        isActive: true, 
        birthDate: { $exists: true, $ne: null } 
      }).select('birthDate')
      
      if (starsWithBirthDate.length > 0) {
        const now = new Date()
        const ages = starsWithBirthDate.map(star => {
          const birthDate = new Date(star.birthDate)
          let age = now.getFullYear() - birthDate.getFullYear()
          const monthDiff = now.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            age--
          }
          return age
        })
        averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
      }
    }
    
    // 本月新增（当前月份创建的记录）
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newestAdditions = await Star.countDocuments({
      isActive: true,
      createdAt: { $gte: startOfMonth }
    })
    
    res.json({
      totalStars,
      totalUniversities,
      averageAge,
      newestAdditions
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

// 获取所有明星信息
app.get('/api/stars', async (req, res) => {
  try {
    const { search, month, university, page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;
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

    // 计算分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // 排序
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // 获取总数
    const total = await Star.countDocuments(query);
    
    // 获取分页数据
    const stars = await Star.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    res.json({ 
      stars, 
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + stars.length < total
    });
  } catch (error) {
    console.error('获取明星列表失败:', error);
    res.status(500).json({ error: '获取明星列表失败' });
  }
});

// 搜索艺人（支持模糊匹配）- 必须在 :id 路由之前
app.get('/api/stars/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ success: true, stars: [] });
    }
    
    const searchTerm = q.trim();
    
    // 构建搜索条件 - 支持中英文名、昵称的模糊匹配
    const searchConditions = [
      { englishName: { $regex: searchTerm, $options: 'i' } },
      { chineseName: { $regex: searchTerm, $options: 'i' } },
      { nickname: { $regex: searchTerm, $options: 'i' } }
    ];
    
    // 执行搜索，按相关性排序
    const stars = await Star.find({
      $or: searchConditions,
      isActive: true
    })
    .select('_id englishName chineseName nickname birthDate height university major representativeWorks photoFilename')
    .limit(parseInt(limit))
    .sort({ 
      // 优先显示有照片的记录
      photoFilename: -1,
      // 然后按创建时间排序
      createdAt: -1 
    });
    
    // 计算匹配度并排序
    const rankedStars = stars.map(star => {
      let score = 0;
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      // 精确匹配得分更高
      if (star.englishName && star.englishName.toLowerCase() === lowerSearchTerm) score += 10;
      if (star.chineseName && star.chineseName === searchTerm) score += 10;
      if (star.nickname && star.nickname.toLowerCase() === lowerSearchTerm) score += 10;
      
      // 包含匹配
      if (star.englishName && star.englishName.toLowerCase().includes(lowerSearchTerm)) score += 5;
      if (star.chineseName && star.chineseName.includes(searchTerm)) score += 5;
      if (star.nickname && star.nickname.toLowerCase().includes(lowerSearchTerm)) score += 5;
      
      // 有照片的加分
      if (star.photoFilename && !star.photoFilename.startsWith('placeholder_')) score += 3;
      
      return { ...star.toObject(), matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({ 
      success: true, 
      stars: rankedStars,
      total: rankedStars.length 
    });
    
  } catch (error) {
    console.error('搜索艺人失败:', error);
    res.status(500).json({ error: '搜索失败: ' + error.message });
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

// 更新明星信息
app.put('/api/stars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 验证必填字段
    if (!updateData.englishName || !updateData.chineseName) {
      return res.status(400).json({ error: '英文名和中文名不能为空' });
    }

    // 处理生日和出生月份
    if (updateData.birthDate) {
      const birthDate = new Date(updateData.birthDate);
      updateData.birthMonth = birthDate.getMonth() + 1;
    }

    // 更新明星信息
    const star = await Star.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!star) {
      return res.status(404).json({ error: '明星信息不存在' });
    }

    res.json({ 
      success: true, 
      star,
      message: '明星信息更新成功' 
    });
  } catch (error) {
    console.error('更新明星信息失败:', error);
    res.status(500).json({ error: '更新明星信息失败: ' + error.message });
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


// 关联照片和艺人
app.post('/api/stars/associate-photo', async (req, res) => {
  try {
    const { starId, photoFilename } = req.body;
    
    if (!starId || !photoFilename) {
      return res.status(400).json({ error: '请提供明星ID和照片文件名' });
    }
    
    // 检查明星是否存在
    const star = await Star.findById(starId);
    if (!star) {
      return res.status(404).json({ error: '未找到该明星' });
    }
    
    // 检查是否有其他明星已经关联了这张照片
    const existingAssociation = await Star.findOne({ 
      photoFilename: photoFilename,
      _id: { $ne: starId }
    });
    
    if (existingAssociation) {
      // 解除旧的关联 - 将旧记录的照片设为placeholder
      await Star.findByIdAndUpdate(
        existingAssociation._id,
        { photoFilename: `placeholder_${existingAssociation._id}.jpg` }
      );
      console.log(`解除旧关联: ${existingAssociation.chineseName || existingAssociation.englishName} -> ${photoFilename}`);
    }
    
    // 更新明星的照片文件名
    const updatedStar = await Star.findByIdAndUpdate(
      starId,
      { photoFilename: photoFilename },
      { new: true }
    );
    
    console.log(`成功关联照片 ${photoFilename} 到明星 ${updatedStar.chineseName || updatedStar.englishName}`);
    
    res.json({ 
      success: true, 
      star: updatedStar,
      message: `成功关联到 ${updatedStar.chineseName || updatedStar.englishName}` 
    });
    
  } catch (error) {
    console.error('关联照片和艺人失败:', error);
    res.status(500).json({ error: '关联失败: ' + error.message });
  }
});

// 清空所有数据
app.post('/api/stars/clear-all', async (req, res) => {
  try {
    const deleteResult = await Star.deleteMany({});
    console.log(`清空数据库：删除了 ${deleteResult.deletedCount} 条记录`);

    res.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      message: `数据库已清空：删除了 ${deleteResult.deletedCount} 条记录`
    });

  } catch (error) {
    console.error('清空数据库失败:', error);
    res.status(500).json({ error: '清空失败: ' + error.message });
  }
});

// 清理重复数据
app.post('/api/stars/cleanup-duplicates', async (req, res) => {
  try {
    // 查找所有记录
    const allStars = await Star.find({});
    console.log(`找到 ${allStars.length} 条记录`);

    // 按照片文件名分组，找出有照片的记录和没照片的记录
    const withRealPhotos = allStars.filter(star => 
      star.photoFilename && 
      !star.photoFilename.startsWith('placeholder_') &&
      !star.photoFilename.startsWith('unmatched_')
    );
    
    const withPlaceholderPhotos = allStars.filter(star => 
      !star.photoFilename || 
      star.photoFilename.startsWith('placeholder_') ||
      star.photoFilename.startsWith('unmatched_')
    );

    console.log(`有真实照片的记录: ${withRealPhotos.length} 条`);
    console.log(`有placeholder照片的记录: ${withPlaceholderPhotos.length} 条`);

    // 删除placeholder记录
    const deleteResult = await Star.deleteMany({
      $or: [
        { photoFilename: { $exists: false } },
        { photoFilename: null },
        { photoFilename: { $regex: '^placeholder_' } },
        { photoFilename: { $regex: '^unmatched_' } }
      ]
    });

    console.log(`删除了 ${deleteResult.deletedCount} 条placeholder记录`);

    res.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      remainingCount: withRealPhotos.length,
      message: `清理完成：删除 ${deleteResult.deletedCount} 条placeholder记录，保留 ${withRealPhotos.length} 条有真实照片的记录`
    });

  } catch (error) {
    console.error('清理重复数据失败:', error);
    res.status(500).json({ error: '清理失败: ' + error.message });
  }
});

// 批量导入明星数据
app.post('/api/stars/import', async (req, res) => {
  try {
    const { stars, updateMode = 'smart' } = req.body;
    
    if (!Array.isArray(stars)) {
      return res.status(400).json({ error: '请提供正确的明星数据数组' });
    }

    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    if (updateMode === 'clear') {
      // 清空现有数据模式
      await Star.deleteMany({});
      console.log('已清空现有数据');
      const result = await Star.insertMany(stars);
      createdCount = result.length;
    } else {
      // 智能更新模式
      for (const starData of stars) {
        try {
          // 尝试通过照片文件名匹配现有记录
          let existingRecord = null;
          
          if (starData.photoFilename) {
            existingRecord = await Star.findOne({ photoFilename: starData.photoFilename });
          }
          
          // 如果没找到，尝试通过姓名匹配
          if (!existingRecord && (starData.englishName || starData.chineseName)) {
            const nameQuery = {};
            if (starData.englishName) nameQuery.englishName = starData.englishName;
            if (starData.chineseName) nameQuery.chineseName = starData.chineseName;
            
            existingRecord = await Star.findOne({
              $or: [
                nameQuery.englishName ? { englishName: nameQuery.englishName } : {},
                nameQuery.chineseName ? { chineseName: nameQuery.chineseName } : {}
              ].filter(obj => Object.keys(obj).length > 0)
            });
          }

          if (existingRecord) {
            // 更新现有记录，保留原有的照片文件名
            const updateData = {
              ...starData,
              photoFilename: existingRecord.photoFilename // 保留原有照片
            };
            
            await Star.findByIdAndUpdate(existingRecord._id, updateData);
            updatedCount++;
            console.log(`更新记录: ${starData.englishName || starData.chineseName} -> ${existingRecord.photoFilename}`);
          } else {
            // 创建新记录
            await Star.create(starData);
            createdCount++;
            console.log(`创建新记录: ${starData.englishName || starData.chineseName}`);
          }
        } catch (error) {
          console.error(`处理记录失败:`, starData, error.message);
          skippedCount++;
        }
      }
    }

    const message = updateMode === 'clear' 
      ? `成功导入 ${createdCount} 条明星数据`
      : `处理完成: 更新 ${updatedCount} 条, 新建 ${createdCount} 条, 跳过 ${skippedCount} 条`;

    console.log(message);

    res.json({ 
      success: true, 
      updatedCount,
      createdCount,
      skippedCount,
      message
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

// 表格文件导入解析
app.post('/api/import/table', tableUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    if (fileExtension === '.csv') {
      // 解析CSV文件
      const csvContent = await fs.readFile(filePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      // 解析Excel文件
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: '不支持的文件格式' });
    }

    // 清理临时文件
    await fs.unlink(filePath);

    // 数据映射和验证
    console.log('解析到的原始数据:', data);
    if (data.length > 0) {
      console.log('第一行数据示例:', data[0]);
      console.log('数据的所有列名:', Object.keys(data[0]));
    }
    
    const mappedData = data.map((row, index) => {
      console.log(`处理第 ${index + 1} 行数据:`, row);
      
      // 字段映射 - 支持全角和半角括号
      const englishName = row['姓名（英）'] || row['姓名(英)'] || row['英文名'] || row['English Name'] || row['englishName'] || '';
      const chineseName = row['姓名（中）'] || row['姓名(中)'] || row['中文名'] || row['Chinese Name'] || row['chineseName'] || '';
      const nickname = row['昵称'] || row['Nickname'] || row['nickname'] || '';
      const birthDate = row['生日'] || row['Birth Date'] || row['birthDate'] || '';
      const height = parseInt(row['身高（cm）'] || row['身高(cm)'] || row['身高'] || row['Height'] || row['height'] || '0');
      const university = row['毕业（就读）院校'] || row['毕业(就读)院校'] || row['毕业院校'] || row['大学'] || row['University'] || row['university'] || '';
      const major = row['所学专业'] || row['专业'] || row['Major'] || row['major'] || '';
      const representativeWorks = row['代表作'] || row['Representative Works'] || row['representativeWorks'] || '';
      const photoFilename = row['照片文件名'] || row['Photo Filename'] || row['photoFilename'] || '';
      
      console.log(`映射结果:`, { englishName, chineseName, nickname, birthDate, height, university, major });

      // 处理代表作（可能是用顿号或逗号分隔的字符串）
      let works = [];
      if (representativeWorks && typeof representativeWorks === 'string') {
        works = representativeWorks.split(/[、，,]/).map(work => 
          (work || '').toString().trim().replace(/《|》/g, '')
        ).filter(work => work);
      }

      // 处理生日格式
      let processedBirthDate = birthDate;
      if (birthDate && typeof birthDate === 'string' && birthDate.includes('.')) {
        // 处理 1995.1.4 格式
        const parts = birthDate.split('.');
        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          processedBirthDate = `${year}-${month}-${day}`;
        }
      }

      return {
        englishName: (englishName || '').toString().trim() || undefined,
        chineseName: (chineseName || '').toString().trim() || undefined,
        thaiName: '',
        nickname: (nickname || '').toString().trim() || undefined,
        birthDate: processedBirthDate ? new Date(processedBirthDate) : undefined,
        birthMonth: processedBirthDate ? new Date(processedBirthDate).getMonth() + 1 : undefined,
        height: height || undefined,
        weight: null,
        university: (university || '').toString().trim() || undefined,
        major: (major || '').toString().trim() || undefined,
        degree: '',
        representativeWorks: works,
        // 不设置photoFilename，让照片保持文件模式显示
        // photoFilename: undefined,
        description: '',
        tags: ['待完善'],
        isActive: true
      };
    }).filter(item => item.englishName || item.chineseName); // 只要有英文名或中文名其中一个即可

    res.json({
      success: true,
      data: mappedData,
      message: `成功解析 ${mappedData.length} 条记录`
    });

  } catch (error) {
    console.error('表格文件解析失败:', error);
    res.status(500).json({ error: '表格文件解析失败: ' + error.message });
  }
});

// 获取所有可用照片文件列表
app.get('/api/photos/files', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // 读取 photos 目录
    const photosDir = '/app/uploads/photos';
    const files = await fs.readdir(photosDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    ).sort();

    // 检查哪些照片已经被使用
    const usedPhotos = await Star.find({ 
      photoFilename: { $in: imageFiles },
      isActive: true 
    }).select('photoFilename englishName chineseName');

    const usedFilenames = new Set(usedPhotos.map(star => star.photoFilename));
    
    const availablePhotos = imageFiles.map(filename => ({
      filename,
      isUsed: usedFilenames.has(filename),
      starInfo: usedPhotos.find(star => star.photoFilename === filename) || null
    }));

    res.json({
      success: true,
      photos: availablePhotos,
      total: imageFiles.length,
      used: usedPhotos.length,
      available: imageFiles.length - usedPhotos.length
    });
  } catch (error) {
    console.error('获取照片文件列表失败:', error);
    res.status(500).json({ error: '获取照片文件列表失败: ' + error.message });
  }
});

// 批量生成明星记录（为所有照片创建基本记录）
app.post('/api/stars/generate-records', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // 读取 photos 目录
    const photosDir = '/app/uploads/photos';
    const files = await fs.readdir(photosDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`📸 找到 ${imageFiles.length} 张图片`);

    // 为每张图片创建明星记录
    const results = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      
      // 检查是否已存在
      const existingStar = await Star.findOne({ photoFilename: filename });
      if (existingStar) {
        console.log(`⏭️  跳过已存在的记录: ${filename}`);
        results.push({ status: 'skipped', filename, starId: existingStar._id });
        continue;
      }

      // 从文件名生成基本信息
      const nameWithoutExt = path.parse(filename).name;
      const englishName = `Star_${String(i + 1).padStart(3, '0')}`;
      const chineseName = `明星_${String(i + 1).padStart(3, '0')}`;

      // 生成默认的必填字段
      const defaultBirthDate = new Date('1990-01-01'); // 默认生日
      const defaultBirthMonth = 1; // 默认1月
      const defaultHeight = 175; // 默认身高175cm

      const starData = {
        englishName,
        chineseName,
        photoFilename: filename,
        birthDate: defaultBirthDate,
        birthMonth: defaultBirthMonth,
        height: defaultHeight,
        description: `这是第 ${i + 1} 张照片，请完善相关信息`,
        tags: ['待完善'],
        isActive: true
      };

      try {
        const newStar = new Star(starData);
        await newStar.save();
        results.push({ status: 'created', filename, starId: newStar._id });
        console.log(`✅ 创建记录: ${filename} -> ${englishName}`);
      } catch (error) {
        console.error(`❌ 创建失败: ${filename}`, error.message);
        results.push({ status: 'failed', filename, error: error.message });
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    res.json({
      success: true,
      message: `批量生成完成！成功创建 ${created} 条记录，跳过 ${skipped} 条，失败 ${failed} 条`,
      stats: { created, skipped, failed, total: imageFiles.length },
      results
    });
  } catch (error) {
    console.error('批量生成明星记录失败:', error);
    res.status(500).json({ error: '批量生成失败: ' + error.message });
  }
});

// 批量生成缩略图API（管理员功能）
app.post('/api/thumbnails/generate', async (req, res) => {
  try {
    console.log('🚀 开始批量生成缩略图...');
    const photosDir = '/app/uploads/photos';
    
    // 异步执行，不阻塞响应
    preGenerateThumbnails(photosDir).catch(error => {
      console.error('❌ 后台缩略图生成失败:', error);
    });
    
    res.json({ 
      success: true, 
      message: '缩略图生成任务已启动，请稍后查看进度' 
    });
    
  } catch (error) {
    console.error('批量生成缩略图失败:', error);
    res.status(500).json({ error: '批量生成失败: ' + error.message });
  }
});

// 获取缩略图生成状态
app.get('/api/thumbnails/status', async (req, res) => {
  try {
    const photosDir = '/app/uploads/photos';
    const thumbnailsDir = '/app/uploads/thumbnails';
    
    // 统计原图数量
    const photoFiles = await fs.readdir(photosDir);
    const imageFiles = photoFiles.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    // 统计缩略图数量
    let thumbnailCount = 0;
    try {
      const thumbnailFiles = await fs.readdir(thumbnailsDir);
      thumbnailCount = thumbnailFiles.length;
    } catch (error) {
      // 目录不存在
      thumbnailCount = 0;
    }
    
    res.json({
      totalPhotos: imageFiles.length,
      thumbnailFiles: thumbnailCount,
      coverage: imageFiles.length > 0 ? (thumbnailCount / (imageFiles.length * 6)).toFixed(2) : '0.00', // 每张图6个缩略图文件
      photosDir,
      thumbnailsDir
    });
    
  } catch (error) {
    console.error('获取缩略图状态失败:', error);
    res.status(500).json({ error: '获取状态失败: ' + error.message });
  }
});

// 缩略图服务 - 智能生成和缓存
app.get('/uploads/thumbnails/:filename', thumbnailMiddleware);

// TMDB API接口
// 搜索艺人
app.get('/api/tmdb/search/person', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }
    
    console.log(`🔍 TMDB搜索艺人: "${query}"`);
    const searchUrl = `${TMDB_BASE_URL}/search/person?query=${encodeURIComponent(query.trim())}&language=zh-CN&include_adult=false&page=1`;
    console.log(`📡 请求URL: ${searchUrl}`);
    
    const response = await makeTMDBRequest(searchUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('TMDB API错误:', data);
      return res.status(500).json({ error: 'TMDB API请求失败', details: data });
    }
    
    // 格式化返回数据
    const formattedResults = data.results.slice(0, parseInt(limit)).map(person => ({
      id: person.id,
      name: person.name,
      chineseName: person.also_known_as?.[0] || person.name,
      englishName: person.name,
      birthday: person.birthday,
      placeOfBirth: person.place_of_birth,
      biography: person.biography,
      profilePath: person.profile_path,
      profileImage: person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null,
      knownFor: person.known_for?.map(item => item.title || item.name) || [],
      popularity: person.popularity,
      department: person.known_for_department,
      gender: person.gender,
      adult: person.adult,
      source: 'tmdb'
    }));
    
    res.json({ 
      results: formattedResults,
      total: data.total_results,
      page: data.page,
      totalPages: data.total_pages
    });
    
  } catch (error) {
    console.error('❌ TMDB搜索失败:', error.message);
    console.error('错误详情:', error);
    res.status(500).json({ error: 'TMDB搜索失败', details: error.message });
  }
});

// 搜索电影
app.get('/api/tmdb/search/movie', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }
    
    const searchUrl = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query.trim())}&language=zh-CN&include_adult=false&page=1`;
    
    const response = await makeTMDBRequest(searchUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('TMDB电影搜索API错误:', data);
      return res.status(500).json({ error: 'TMDB电影搜索失败', details: data });
    }
    
    // 格式化返回数据
    const formattedResults = data.results.slice(0, parseInt(limit)).map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      posterPath: movie.poster_path,
      posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path,
      genreIds: movie.genre_ids,
      adult: movie.adult,
      originalLanguage: movie.original_language,
      source: 'tmdb'
    }));
    
    res.json({ 
      results: formattedResults,
      total: data.total_results,
      page: data.page,
      totalPages: data.total_pages
    });
    
  } catch (error) {
    console.error('TMDB电影搜索失败:', error);
    res.status(500).json({ error: 'TMDB电影搜索失败', details: error.message });
  }
});

// 获取电影演员列表
app.get('/api/tmdb/movie/:movieId/cast', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const castUrl = `${TMDB_BASE_URL}/movie/${movieId}/credits`;
    
    const response = await makeTMDBRequest(castUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('TMDB演员列表API错误:', data);
      return res.status(500).json({ error: '获取演员列表失败', details: data });
    }
    
    // 格式化演员数据
    const formattedCast = data.cast.map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      order: actor.order,
      profilePath: actor.profile_path,
      profileImage: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null,
      adult: actor.adult,
      gender: actor.gender,
      knownForDepartment: actor.known_for_department,
      popularity: actor.popularity
    }));
    
    // 格式化工作人员数据
    const formattedCrew = data.crew.map(member => ({
      id: member.id,
      name: member.name,
      job: member.job,
      department: member.department,
      profilePath: member.profile_path,
      profileImage: member.profile_path ? `https://image.tmdb.org/t/p/w500${member.profile_path}` : null,
      adult: member.adult,
      gender: member.gender,
      knownForDepartment: member.known_for_department,
      popularity: member.popularity
    }));
    
    res.json({
      id: data.id,
      cast: formattedCast,
      crew: formattedCrew,
      castCount: data.cast.length,
      crewCount: data.crew.length
    });
    
  } catch (error) {
    console.error('获取演员列表失败:', error);
    res.status(500).json({ error: '获取演员列表失败', details: error.message });
  }
});

// 获取艺人详情
app.get('/api/tmdb/person/:personId', async (req, res) => {
  try {
    const { personId } = req.params;
    
    const personUrl = `${TMDB_BASE_URL}/person/${personId}?language=zh-CN`;
    
    const response = await makeTMDBRequest(personUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('TMDB艺人详情API错误:', data);
      return res.status(500).json({ error: '获取艺人详情失败', details: data });
    }
    
    // 格式化艺人详情数据
    const formattedPerson = {
      id: data.id,
      name: data.name,
      chineseName: data.also_known_as?.[0] || data.name,
      englishName: data.name,
      birthday: data.birthday,
      deathday: data.deathday,
      placeOfBirth: data.place_of_birth,
      biography: data.biography,
      profilePath: data.profile_path,
      profileImage: data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : null,
      popularity: data.popularity,
      gender: data.gender,
      adult: data.adult,
      knownForDepartment: data.known_for_department,
      imdbId: data.imdb_id,
      homepage: data.homepage,
      alsoKnownAs: data.also_known_as || [],
      source: 'tmdb'
    };
    
    res.json(formattedPerson);
    
  } catch (error) {
    console.error('获取艺人详情失败:', error);
    res.status(500).json({ error: '获取艺人详情失败', details: error.message });
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
