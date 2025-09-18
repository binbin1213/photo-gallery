const mongoose = require('mongoose');

const starSchema = new mongoose.Schema({
  // 基本信息
  englishName: {
    type: String,
    trim: true
  },
  chineseName: {
    type: String,
    trim: true
  },
  thaiName: {
    type: String,
    trim: true
  },
  nickname: {
    type: String,
    trim: true
  },
  
  // 个人信息
  birthDate: {
    type: Date
  },
  birthMonth: {
    type: Number // 1-12
  },
  height: {
    type: Number // 厘米
  },
  weight: {
    type: Number // 公斤
  },
  
  // 教育信息
  university: {
    type: String,
    trim: true
  },
  major: {
    type: String,
    trim: true
  },
  degree: {
    type: String, // 本科、硕士、博士等
    trim: true
  },
  
  // 作品信息
  representativeWorks: [{
    type: String,
    trim: true
  }],
  
  // 照片信息
  photoFilename: {
    type: String
  },
  
  // 缩略图元数据
  thumbnails: {
    small: {
      webp: { url: String, size: Number, lastGenerated: Date },
      jpeg: { url: String, size: Number, lastGenerated: Date },
      png: { url: String, size: Number, lastGenerated: Date }
    },
    medium: {
      webp: { url: String, size: Number, lastGenerated: Date },
      jpeg: { url: String, size: Number, lastGenerated: Date },
      png: { url: String, size: Number, lastGenerated: Date }
    }
  },
  
  // 其他信息
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // 系统信息
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时自动设置 updatedAt
starSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 创建索引
starSchema.index({ englishName: 1 });
starSchema.index({ chineseName: 1 });
starSchema.index({ birthMonth: 1 });
starSchema.index({ university: 1 });
starSchema.index({ isActive: 1 });

module.exports = mongoose.model('Star', starSchema);
