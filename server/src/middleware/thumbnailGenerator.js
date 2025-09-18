const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * 缩略图生成中间件
 * 支持多尺寸、WebP格式、智能缓存
 */

// 缩略图配置
const THUMBNAIL_SIZES = {
  small: { width: 300, height: 300, suffix: '_300' },
  medium: { width: 800, height: 800, suffix: '_800' },
  // large保持原图
};

// 支持的输出格式（按优先级排序）
const OUTPUT_FORMATS = {
  webp: { quality: 80, effort: 4 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 6 }
};

/**
 * 确保缩略图目录存在
 */
async function ensureThumbnailDir() {
  const thumbnailDir = path.join(process.env.UPLOAD_PATH || './uploads', 'thumbnails');
  try {
    await fs.access(thumbnailDir);
  } catch (error) {
    await fs.mkdir(thumbnailDir, { recursive: true });
    console.log('📁 创建缩略图目录:', thumbnailDir);
  }
  return thumbnailDir;
}

/**
 * 生成缩略图文件名
 */
function generateThumbnailFilename(originalFilename, size, format) {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  return `${name}${THUMBNAIL_SIZES[size].suffix}.${format}`;
}

/**
 * 检查缩略图是否存在且是最新的
 */
async function isThumbnailFresh(thumbnailPath, originalPath) {
  try {
    const [thumbnailStat, originalStat] = await Promise.all([
      fs.stat(thumbnailPath),
      fs.stat(originalPath)
    ]);
    // 缩略图修改时间晚于原图，认为是最新的
    return thumbnailStat.mtime >= originalStat.mtime;
  } catch (error) {
    return false; // 缩略图不存在或访问失败
  }
}

/**
 * 生成单个尺寸的缩略图
 */
async function generateThumbnail(originalPath, thumbnailPath, size, format) {
  const config = THUMBNAIL_SIZES[size];
  const formatOptions = OUTPUT_FORMATS[format];
  
  console.log(`🖼️  生成缩略图: ${size} (${config.width}x${config.height}) -> ${format}`);
  
  let sharpInstance = sharp(originalPath)
    .resize(config.width, config.height, {
      fit: 'cover',           // 裁剪适配
      position: 'center',     // 居中裁剪
      withoutEnlargement: false // 允许放大小图片
    });

  // 应用格式特定的配置
  switch (format) {
    case 'webp':
      sharpInstance = sharpInstance.webp(formatOptions);
      break;
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg(formatOptions);
      break;
    case 'png':
      sharpInstance = sharpInstance.png(formatOptions);
      break;
  }

  await sharpInstance.toFile(thumbnailPath);
  
  // 获取生成的文件信息
  const stat = await fs.stat(thumbnailPath);
  console.log(`✅ 缩略图生成完成: ${(stat.size / 1024).toFixed(1)}KB`);
  
  return {
    path: thumbnailPath,
    size: stat.size,
    format,
    dimensions: `${config.width}x${config.height}`
  };
}

/**
 * 批量生成所有尺寸和格式的缩略图
 */
async function generateAllThumbnails(originalPath, filename) {
  const thumbnailDir = await ensureThumbnailDir();
  const results = {};
  
  console.log(`🚀 开始为 ${filename} 生成缩略图...`);
  
  // 遍历所有尺寸
  for (const [sizeName, sizeConfig] of Object.entries(THUMBNAIL_SIZES)) {
    results[sizeName] = {};
    
    // 遍历所有格式
    for (const [formatName, formatConfig] of Object.entries(OUTPUT_FORMATS)) {
      const thumbnailFilename = generateThumbnailFilename(filename, sizeName, formatName);
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
      
      try {
        // 检查是否需要重新生成
        const needsGeneration = !(await isThumbnailFresh(thumbnailPath, originalPath));
        
        if (needsGeneration) {
          const result = await generateThumbnail(originalPath, thumbnailPath, sizeName, formatName);
          results[sizeName][formatName] = {
            filename: thumbnailFilename,
            path: thumbnailPath,
            size: result.size,
            url: `/uploads/thumbnails/${thumbnailFilename}`,
            fresh: true
          };
        } else {
          // 使用现有缩略图
          const stat = await fs.stat(thumbnailPath);
          results[sizeName][formatName] = {
            filename: thumbnailFilename,
            path: thumbnailPath,
            size: stat.size,
            url: `/uploads/thumbnails/${thumbnailFilename}`,
            fresh: false
          };
          console.log(`♻️  使用现有缩略图: ${thumbnailFilename}`);
        }
      } catch (error) {
        console.error(`❌ 生成缩略图失败 ${sizeName}/${formatName}:`, error.message);
        results[sizeName][formatName] = null;
      }
    }
  }
  
  console.log(`✨ ${filename} 缩略图生成完成`);
  return results;
}

/**
 * 获取客户端支持的最佳图片格式
 */
function getBestFormat(acceptHeader) {
  if (!acceptHeader) return 'jpeg';
  
  const accept = acceptHeader.toLowerCase();
  if (accept.includes('image/webp')) return 'webp';
  if (accept.includes('image/jpeg')) return 'jpeg';
  if (accept.includes('image/png')) return 'png';
  
  return 'jpeg'; // 默认格式
}

/**
 * 缩略图服务中间件
 * 处理 /uploads/thumbnails/:filename 请求
 */
const thumbnailMiddleware = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { size = 'small' } = req.query;
    
    // 解析原始文件名（去掉尺寸后缀）
    const match = filename.match(/^(.+?)(_\d+)?\.(webp|jpeg|jpg|png)$/i);
    if (!match) {
      return res.status(400).json({ error: '无效的文件名格式' });
    }
    
    const [, baseName, sizeSuffix, requestedFormat] = match;
    const originalFilename = `${baseName}.jpg`; // 假设原图都是jpg
    const originalPath = path.join(process.env.UPLOAD_PATH || './uploads', 'photos', originalFilename);
    
    // 检查原图是否存在
    try {
      await fs.access(originalPath);
    } catch (error) {
      return res.status(404).json({ error: '原图不存在' });
    }
    
    // 确定最佳格式
    const bestFormat = getBestFormat(req.headers.accept);
    const actualSize = size in THUMBNAIL_SIZES ? size : 'small';
    
    // 生成缩略图
    const thumbnails = await generateAllThumbnails(originalPath, originalFilename);
    const thumbnail = thumbnails[actualSize]?.[bestFormat];
    
    if (!thumbnail) {
      return res.status(500).json({ error: '缩略图生成失败' });
    }
    
    // 设置缓存头
    res.set({
      'Cache-Control': 'public, max-age=2592000, immutable', // 30天强缓存
      'ETag': `"${thumbnail.filename}-${thumbnail.size}"`,
      'Content-Type': `image/${bestFormat}`,
      'Content-Length': thumbnail.size,
      'X-Thumbnail-Size': actualSize,
      'X-Thumbnail-Format': bestFormat,
      'X-Thumbnail-Fresh': thumbnail.fresh
    });
    
    // 检查协商缓存
    if (req.headers['if-none-match'] === res.get('ETag')) {
      return res.status(304).end();
    }
    
    // 发送缩略图文件
    res.sendFile(thumbnail.path);
    
  } catch (error) {
    console.error('缩略图中间件错误:', error);
    next(error);
  }
};

/**
 * 批量预生成缩略图（用于初始化或定时任务）
 */
async function preGenerateThumbnails(photoDir) {
  console.log('🔄 开始批量预生成缩略图...');
  
  try {
    const files = await fs.readdir(photoDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    console.log(`📊 找到 ${imageFiles.length} 个图片文件`);
    
    let processed = 0;
    let errors = 0;
    
    for (const filename of imageFiles) {
      try {
        const originalPath = path.join(photoDir, filename);
        await generateAllThumbnails(originalPath, filename);
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`📈 进度: ${processed}/${imageFiles.length} (${Math.round(processed/imageFiles.length*100)}%)`);
        }
      } catch (error) {
        console.error(`❌ 处理 ${filename} 失败:`, error.message);
        errors++;
      }
    }
    
    console.log(`✅ 批量预生成完成: 成功 ${processed}, 失败 ${errors}`);
    
  } catch (error) {
    console.error('❌ 批量预生成失败:', error);
  }
}

module.exports = {
  thumbnailMiddleware,
  generateAllThumbnails,
  preGenerateThumbnails,
  THUMBNAIL_SIZES,
  OUTPUT_FORMATS
};
