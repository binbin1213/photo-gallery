const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

// 连接 MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/thai_stars?authSource=admin';

// Star 模型（简化版，不需要完整的模型文件）
const starSchema = new mongoose.Schema({
  englishName: { type: String, required: true, trim: true },
  chineseName: { type: String, required: true, trim: true },
  thaiName: { type: String, trim: true },
  nickname: { type: String, trim: true },
  birthDate: { type: Date },
  birthMonth: { type: Number, min: 1, max: 12 },
  height: { type: Number },
  weight: { type: Number },
  university: { type: String, trim: true },
  major: { type: String, trim: true },
  degree: { type: String, trim: true },
  representativeWorks: [{ type: String, trim: true }],
  photoFilename: { type: String, trim: true },
  description: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Star = mongoose.model('Star', starSchema);

async function generateStarRecords() {
  try {
    console.log('🚀 开始生成明星记录...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 连接成功');

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
        continue;
      }

      // 从文件名生成基本信息
      const nameWithoutExt = path.parse(filename).name;
      const englishName = `Star_${String(i + 1).padStart(3, '0')}`;
      const chineseName = `明星_${String(i + 1).padStart(3, '0')}`;

      const starData = {
        englishName,
        chineseName,
        photoFilename: filename,
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

    console.log('\n📊 生成结果统计:');
    const created = results.filter(r => r.status === 'created').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    console.log(`✅ 成功创建: ${created} 条记录`);
    console.log(`⏭️  跳过已存在: ${skipped} 条记录`);
    console.log(`❌ 创建失败: ${failed} 条记录`);

    if (failed > 0) {
      console.log('\n❌ 失败的记录:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  - ${r.filename}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('❌ 生成明星记录失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  generateStarRecords();
}

module.exports = { generateStarRecords };
