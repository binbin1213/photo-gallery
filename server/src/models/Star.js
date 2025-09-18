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
  age: {
    type: Number // 年龄（根据出生日期自动计算）
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：自动计算年龄
starSchema.virtual('calculatedAge').get(function() {
  if (!this.birthDate) return null;
  
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // 如果还没到生日，年龄减1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// 保存前自动计算并更新年龄
starSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 如果有出生日期，自动计算年龄
  if (this.birthDate) {
    this.age = this.calculatedAge;
  }
  
  next();
});

// 创建索引
starSchema.index({ englishName: 1 });
starSchema.index({ chineseName: 1 });
starSchema.index({ birthMonth: 1 });
starSchema.index({ age: 1 });
starSchema.index({ university: 1 });
starSchema.index({ isActive: 1 });

module.exports = mongoose.model('Star', starSchema);
