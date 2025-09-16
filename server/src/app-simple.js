const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 启动照片展示墙API服务...');

// 基本中间件
app.use(cors());
app.use(express.json());

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/app/uploads/photos');
    },
    filename: (req, file, cb) => {
        // 保持原始文件名，或者生成新的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // 只允许图片文件
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
        
        console.log('文件删除成功:', filename);
        res.json({ success: true, message: '文件删除成功' });
    } catch (error) {
        console.error('文件删除失败:', error);
        res.status(500).json({ error: '文件删除失败: ' + error.message });
    }
});

// 批量更新照片信息
app.post('/api/photos/batch', async (req, res) => {
    console.log('收到批量更新请求：', {
        headers: req.headers,
        body: req.body
    });

    try {
        const { photos } = req.body;
        console.log('解析的照片数据：', photos);
        
        if (!Array.isArray(photos)) {
            console.log('数据格式错误：photos 不是数组');
            return res.status(400).json({ error: '请提供正确的照片数据数组' });
        }

        // 读取当前的姓名数据
        const fs = require('fs').promises;
        const path = require('path');
        let namesData = {};
        
        try {
            const namesFile = await fs.readFile('/app/data/photo-names.json', 'utf8');
            namesData = JSON.parse(namesFile);
        } catch (err) {
            console.log('读取姓名数据失败，将创建新文件:', err.message);
        }

        // 更新姓名数据
        photos.forEach(photo => {
            namesData[photo.id] = {
                chinese: photo.chineseName,
                english: photo.englishName
            };
        });

        // 保存更新后的数据
        await fs.writeFile(
            '/app/data/photo-names.json',
            JSON.stringify({ names: namesData }, null, 2),
            'utf8'
        );

        res.json({
            message: '批量更新成功',
            updatedCount: photos.length
        });
    } catch (error) {
        console.error('批量更新失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 静态文件服务 - 提供照片访问
app.use('/uploads', express.static('/app/uploads'));

// 测试路由
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// 真实照片数据API
app.get('/api/photos', async (req, res) => {
    try {
        const { search, limit = 120 } = req.query;
        const fs = require('fs').promises;
        const path = require('path');

        // 读取姓名数据
        let namesData = {};
        try {
            // 尝试从多个可能的位置读取姓名数据
            let namesFile;
            try {
                namesFile = await fs.readFile('/app/data/photo-names.json', 'utf8');
            } catch {
                try {
                    namesFile = await fs.readFile('/app/uploads/data/photo-names.json', 'utf8');
                } catch {
                    // 如果都找不到，使用localStorage中的数据格式
                    console.log('未找到姓名数据文件，将使用默认姓名');
                }
            }

            if (namesFile) {
                const parsedData = JSON.parse(namesFile);
                namesData = parsedData.names || parsedData || {};
            }
        } catch (err) {
            console.log('读取姓名数据失败:', err.message);
        }

        // 扫描照片文件
        const photosDir = '/app/uploads/photos';
        let photoFiles = [];
        try {
            const files = await fs.readdir(photosDir);
            photoFiles = files.filter(file =>
                /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.startsWith('.')
            ).sort((a, b) => {
                const aNum = parseInt(a.split('.')[0]);
                const bNum = parseInt(b.split('.')[0]);
                return aNum - bNum;
            });
            console.log(`找到 ${photoFiles.length} 张照片文件`);
        } catch (err) {
            console.log('照片目录读取失败:', err.message);
            // 如果照片目录不存在，生成模拟数据
            for (let i = 1; i <= 120; i++) {
                photoFiles.push(`${i}.jpg`);
            }
        }

        // 构建照片数据
        const photos = [];
        photoFiles.forEach((filename, index) => {
            const id = parseInt(filename.split('.')[0]) || (index + 1);
            const nameInfo = namesData[id] || { chinese: '未设置', english: 'Not Set' };

            const photo = {
                id,
                filename,
                chineseName: nameInfo.chinese || `照片${id}`,
                englishName: nameInfo.english || `Photo${id}`,
                tags: ['人物'],
                metadata: {
                    size: 1024000,
                    width: 800,
                    height: 600,
                    format: 'jpeg'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 搜索过滤
            if (search) {
                const searchLower = search.toLowerCase();
                if (photo.chineseName.toLowerCase().includes(searchLower) ||
                    photo.englishName.toLowerCase().includes(searchLower)) {
                    photos.push(photo);
                }
            } else {
                photos.push(photo);
            }
        });

        // 按照中文姓名排序（拼音字母顺序）
        photos.sort((a, b) => {
            // 使用 localeCompare 进行中文拼音排序
            return a.chineseName.localeCompare(b.chineseName, 'zh-CN', {
                sensitivity: 'base',
                numeric: true
            });
        });

        // 限制数量
        const requestedLimit = parseInt(limit) || 120;
        const limitedPhotos = photos.slice(0, requestedLimit);

        console.log(`返回 ${limitedPhotos.length} 张照片，总共 ${photos.length} 张，按姓名排序`);

        res.json({
            photos: limitedPhotos,
            totalPages: Math.ceil(photos.length / limit),
            currentPage: 1,
            total: photos.length
        });

    } catch (error) {
        console.error('获取照片数据失败:', error);
        res.status(500).json({ error: '获取照片数据失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API 端点不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 照片展示墙API服务已启动`);
    console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
    console.log(`📸 照片目录: /app/uploads/photos`);
    console.log(`📝 数据文件: /app/data/photo-names.json`);
});