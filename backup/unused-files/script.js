class PhotoGallery {
    constructor() {
        this.photos = [];
        this.names = {};
        this.isAdmin = false;
        this.adminPassword = 'admin123'; // 可以修改为你想要的密码
        this.adminSessionTimeout = 30 * 60 * 1000; // 30分钟超时
        this.init();
    }

    async init() {
        await this.loadPhotos();
        await this.loadNames(); // 等待数据加载完成
        this.checkAdminSession();
        this.setupEventListeners();

        // 直接显示主界面，不再检查设置
        this.showMainContent();
    }

    async loadPhotos() {
        // 现在所有照片都已重命名为标准格式：1.jpg 到 120.jpg
        for (let i = 1; i <= 120; i++) {
            this.photos.push({
                id: i,
                filename: `${i}.jpg`,
                path: `photos/${i}.jpg`
            });
        }
        
        console.log(`已加载 ${this.photos.length} 张照片`);
    }

    async loadNames() {
        // 首先尝试从localStorage加载
        const savedNames = localStorage.getItem('photoNames');
        if (savedNames) {
            this.names = JSON.parse(savedNames);
            console.log('从localStorage加载了姓名数据');
            return;
        }

        // 如果localStorage没有数据，尝试加载本地JSON文件
        try {
            const response = await fetch('data/photo-names.json');
            if (response.ok) {
                const data = await response.json();
                if (data.names) {
                    this.names = data.names;
                    // 标记有本地文件
                    localStorage.setItem('hasLocalFile', 'true');
                    // 加载后保存到localStorage
                    localStorage.setItem('photoNames', JSON.stringify(this.names));
                    // 标记设置已完成
                    localStorage.setItem('setupCompleted', 'true');
                    console.log('已从本地JSON文件加载姓名数据');
                    this.showSyncStatus('已同步');
                }
            }
        } catch (error) {
            console.log('无法加载本地JSON文件，将使用空数据');
            localStorage.setItem('hasLocalFile', 'false');
        }
    }

    saveNames() {
        localStorage.setItem('photoNames', JSON.stringify(this.names));
        
        // 显示修改状态
        const hasLocalFile = localStorage.getItem('hasLocalFile') === 'true';
        if (hasLocalFile) {
            this.showSyncStatus('已修改');
        }
        
        // 检查是否需要提示用户更新本地文件
        this.checkForLocalFileUpdate();
    }

    checkForLocalFileUpdate() {
        // 检查是否有本地JSON文件
        const hasLocalFile = localStorage.getItem('hasLocalFile') === 'true';
        const lastPrompt = localStorage.getItem('lastUpdatePrompt');
        const now = Date.now();
        
        // 如果有本地文件且距离上次提示超过5分钟，显示更新提示
        if (hasLocalFile && (!lastPrompt || now - parseInt(lastPrompt) > 5 * 60 * 1000)) {
            this.showUpdatePrompt();
            localStorage.setItem('lastUpdatePrompt', now.toString());
        }
    }

    showUpdatePrompt() {
        // 创建更新提示
        const prompt = document.createElement('div');
        prompt.className = 'update-prompt';
        prompt.innerHTML = `
            <div class="update-prompt-content">
                <span>📝 检测到姓名数据已修改</span>
                <button class="update-btn" onclick="this.parentElement.parentElement.style.display='none'">知道了</button>
                <button class="export-update-btn">导出并更新本地文件</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // 绑定导出按钮事件
        prompt.querySelector('.export-update-btn').addEventListener('click', () => {
            this.exportForLocalUpdate();
            prompt.style.display = 'none';
        });
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.style.display = 'none';
            }
        }, 8000);
    }

    exportForLocalUpdate() {
        // 创建用于本地文件更新的导出数据
        const exportData = {
            version: '1.0',
            description: '照片展示墙姓名数据',
            lastUpdated: new Date().toISOString(),
            names: this.names
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'photo-names.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.showToast('请将下载的文件替换到 data/photo-names.json', 'success');
    }

    checkIfNeedsSetup() {
        // 检查是否已经完成过初始设置
        const setupCompleted = localStorage.getItem('setupCompleted');
        if (setupCompleted) {
            return false; // 已经完成过设置，不需要再显示
        }

        // 如果没有任何姓名数据，需要设置
        if (Object.keys(this.names).length === 0) {
            return true;
        }

        // 检查是否有实际的姓名内容（不是默认的占位符）
        const hasRealNames = Object.values(this.names).some(nameInfo => {
            return nameInfo.chinese && nameInfo.chinese !== '未设置' && nameInfo.chinese !== '1' &&
                nameInfo.english && nameInfo.english !== 'Not Set' && nameInfo.english !== '1';
        });

        // 如果有真实姓名，标记为已完成设置
        if (hasRealNames) {
            localStorage.setItem('setupCompleted', 'true');
            return false;
        }

        return true;
    }

    checkAdminSession() {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            const sessionData = JSON.parse(adminSession);
            const now = Date.now();
            if (now - sessionData.timestamp < this.adminSessionTimeout) {
                this.isAdmin = true;
                this.updateAdminUI();
            } else {
                localStorage.removeItem('adminSession');
            }
        }
    }

    setAdminSession() {
        const sessionData = {
            timestamp: Date.now()
        };
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        this.isAdmin = true;
        this.updateAdminUI();
    }

    clearAdminSession() {
        localStorage.removeItem('adminSession');
        this.isAdmin = false;
        this.updateAdminUI();
    }

    updateAdminUI() {
        const indicator = document.getElementById('admin-indicator');
        const toggleBtn = document.getElementById('admin-toggle');

        if (this.isAdmin) {
            indicator.textContent = '管理员模式';
            indicator.className = 'admin-indicator admin';
            toggleBtn.textContent = '退出管理';
        } else {
            indicator.textContent = '普通模式';
            indicator.className = 'admin-indicator normal';
            toggleBtn.textContent = '管理员模式';
        }
    }

    showSetupModal() {
        const modal = document.getElementById('setup-modal');
        const setupList = document.getElementById('setup-list');

        setupList.innerHTML = '';

        this.photos.forEach(photo => {
            const setupItem = document.createElement('div');
            setupItem.className = 'setup-item';

            const existingName = this.names[photo.id] || { chinese: '', english: '' };

            setupItem.innerHTML = `
                <img src="${photo.path}" alt="照片 ${photo.id}" onerror="this.src='placeholder.jpg'">
                <div class="setup-inputs">
                    <input type="text" 
                           placeholder="中文姓名" 
                           value="${existingName.chinese}"
                           data-photo-id="${photo.id}" 
                           data-type="chinese">
                    <input type="text" 
                           placeholder="English Name" 
                           value="${existingName.english}"
                           data-photo-id="${photo.id}" 
                           data-type="english">
                </div>
            `;

            setupList.appendChild(setupItem);
        });

        modal.style.display = 'flex';
    }

    hideSetupModal() {
        document.getElementById('setup-modal').style.display = 'none';
    }

    showMainContent() {
        console.log('显示主界面...');
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            console.log('主界面已显示');
            this.renderPhotos();
        } else {
            console.error('找不到main-content元素');
        }
    }

    renderPhotos(filteredPhotos = null) {
        console.log('开始渲染照片...');
        const photoGrid = document.getElementById('photo-grid');
        const photosToRender = filteredPhotos || this.photos;
        
        console.log('照片数量:', photosToRender.length);
        console.log('姓名数据:', this.names);

        if (!photoGrid) {
            console.error('找不到photo-grid元素');
            return;
        }

        photoGrid.innerHTML = '';

        photosToRender.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';

            const nameInfo = this.names[photo.id] || { chinese: '未设置', english: 'Not Set' };

            photoItem.innerHTML = `
                <img src="${photo.path}" alt="${nameInfo.chinese}" onerror="this.src='placeholder.jpg'">
                <div class="photo-info">
                    <div class="chinese-name">${nameInfo.chinese}</div>
                    <div class="english-name">${nameInfo.english}</div>
                </div>
            `;

            // 添加点击事件显示大图
            photoItem.addEventListener('click', () => {
                this.showPhotoPreview(photo.path, nameInfo, photo.id);
            });

            // 添加悬停预览功能
            photoItem.addEventListener('mouseenter', (e) => {
                this.showHoverPreview(e, photo.path);
            });

            photoItem.addEventListener('mouseleave', () => {
                this.hideHoverPreview();
            });

            photoItem.addEventListener('mousemove', (e) => {
                this.updateHoverPreviewPosition(e);
            });

            photoGrid.appendChild(photoItem);
        });
    }

    setupEventListeners() {
        // 设置弹窗相关功能已移除

        // 管理员模式切换
        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                if (this.isAdmin) {
                    this.clearAdminSession();
                } else {
                    this.showAdminModal();
                }
            });
        }

        // 管理员验证
        const adminLogin = document.getElementById('admin-login');
        const adminCancel = document.getElementById('admin-cancel');
        const adminPasswordInput = document.getElementById('admin-password');

        if (adminLogin) {
            adminLogin.addEventListener('click', () => {
                this.verifyAdminPassword();
            });
        }

        if (adminCancel) {
            adminCancel.addEventListener('click', () => {
                this.hideAdminModal();
            });
        }

        if (adminPasswordInput) {
            adminPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyAdminPassword();
                }
            });
        }

        // 导出数据按钮
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 下载模板按钮
        const templateBtn = document.getElementById('download-template');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => {
                this.downloadTemplate();
            });
        }

        // 导入数据按钮
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', (e) => {
                this.handleFileImport(e);
            });
        }

        // 导入确认按钮
        const confirmImport = document.getElementById('confirm-import');
        const cancelImport = document.getElementById('cancel-import');
        if (confirmImport) {
            confirmImport.addEventListener('click', () => {
                this.confirmImport();
            });
        }
        if (cancelImport) {
            cancelImport.addEventListener('click', () => {
                this.hideImportModal();
            });
        }

        // 编辑姓名按钮
        const editButton = document.getElementById('edit-names');
        if (editButton) {
            editButton.addEventListener('click', () => {
                this.showSetupModal();
            });
        }

        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchPhotos(e.target.value);
            });
        }
    }

    collectNames() {
        const inputs = document.querySelectorAll('#setup-list input');

        inputs.forEach(input => {
            const photoId = parseInt(input.dataset.photoId);
            const type = input.dataset.type;
            const value = input.value.trim();

            if (!this.names[photoId]) {
                this.names[photoId] = { chinese: '', english: '' };
            }

            this.names[photoId][type] = value;
        });
    }

    searchPhotos(query) {
        if (!query.trim()) {
            this.renderPhotos();
            return;
        }

        const filteredPhotos = this.photos.filter(photo => {
            const nameInfo = this.names[photo.id];
            if (!nameInfo) return false;

            const searchText = (nameInfo.chinese + ' ' + nameInfo.english).toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        this.renderPhotos(filteredPhotos);
    }

    showPhotoPreview(imagePath, nameInfo, photoId) {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'photo-overlay';

        // 创建预览容器
        const preview = document.createElement('div');
        preview.className = 'photo-preview';

        const editableClass = this.isAdmin ? 'editable' : '';
        const editControls = this.isAdmin ? `
            <div class="preview-edit-controls">
                <button class="btn-save">保存修改</button>
                <button class="btn-cancel-edit">取消</button>
            </div>
        ` : '';

        preview.innerHTML = `
            <button class="photo-preview-close">&times;</button>
            <img src="${imagePath}" alt="${nameInfo.chinese}">
            <div class="photo-preview-info ${editableClass}">
                <div class="chinese-name">${nameInfo.chinese}${this.isAdmin ? '<span class="edit-icon">✏️</span>' : ''}</div>
                <div class="english-name">${nameInfo.english}${this.isAdmin ? '<span class="edit-icon">✏️</span>' : ''}</div>
            </div>
            ${editControls}
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(preview);

        // 如果是管理员模式，设置编辑功能
        if (this.isAdmin) {
            this.setupPreviewEdit(preview, photoId, nameInfo);
        }

        // 显示动画
        setTimeout(() => {
            overlay.classList.add('show');
            preview.classList.add('show');
        }, 10);

        // 关闭功能
        const closePreview = () => {
            overlay.classList.remove('show');
            preview.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(preview);
            }, 300);
        };

        // 绑定关闭事件
        preview.querySelector('.photo-preview-close').addEventListener('click', closePreview);
        overlay.addEventListener('click', closePreview);

        // ESC键关闭
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closePreview();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);

        return closePreview;
    }

    setupPreviewEdit(preview, photoId, originalNameInfo) {
        const chineseNameDiv = preview.querySelector('.chinese-name');
        const englishNameDiv = preview.querySelector('.english-name');
        const saveBtn = preview.querySelector('.btn-save');
        const cancelBtn = preview.querySelector('.btn-cancel-edit');

        let isEditing = false;
        let chineseInput, englishInput;

        // 点击姓名开始编辑
        chineseNameDiv.addEventListener('click', () => {
            if (!isEditing) startEdit();
        });

        englishNameDiv.addEventListener('click', () => {
            if (!isEditing) startEdit();
        });

        const startEdit = () => {
            isEditing = true;

            // 创建输入框
            chineseInput = document.createElement('input');
            chineseInput.className = 'name-input';
            chineseInput.value = originalNameInfo.chinese;
            chineseInput.placeholder = '中文姓名';

            englishInput = document.createElement('input');
            englishInput.className = 'name-input';
            englishInput.value = originalNameInfo.english;
            englishInput.placeholder = 'English Name';

            // 替换显示内容
            chineseNameDiv.innerHTML = '';
            englishNameDiv.innerHTML = '';
            chineseNameDiv.appendChild(chineseInput);
            englishNameDiv.appendChild(englishInput);

            chineseInput.focus();
            chineseInput.select();
        };

        // 保存修改
        saveBtn.addEventListener('click', () => {
            if (isEditing) {
                const newChineseName = chineseInput.value.trim();
                const newEnglishName = englishInput.value.trim();

                // 更新数据
                this.names[photoId] = {
                    chinese: newChineseName || '未设置',
                    english: newEnglishName || 'Not Set'
                };

                this.saveNames();

                // 更新显示
                chineseNameDiv.innerHTML = `${this.names[photoId].chinese}<span class="edit-icon">✏️</span>`;
                englishNameDiv.innerHTML = `${this.names[photoId].english}<span class="edit-icon">✏️</span>`;

                // 刷新主页面
                this.renderPhotos();

                isEditing = false;
            }
        });

        // 取消编辑
        cancelBtn.addEventListener('click', () => {
            if (isEditing) {
                chineseNameDiv.innerHTML = `${originalNameInfo.chinese}<span class="edit-icon">✏️</span>`;
                englishNameDiv.innerHTML = `${originalNameInfo.english}<span class="edit-icon">✏️</span>`;
                isEditing = false;
            }
        });
    }

    showAdminModal() {
        const modal = document.getElementById('admin-modal');
        const passwordInput = document.getElementById('admin-password');
        const errorDiv = document.getElementById('admin-error');

        passwordInput.value = '';
        errorDiv.style.display = 'none';
        modal.style.display = 'flex';

        setTimeout(() => passwordInput.focus(), 100);
    }

    hideAdminModal() {
        document.getElementById('admin-modal').style.display = 'none';
    }

    verifyAdminPassword() {
        const passwordInput = document.getElementById('admin-password');
        const errorDiv = document.getElementById('admin-error');
        const password = passwordInput.value;

        if (password === this.adminPassword) {
            this.setAdminSession();
            this.hideAdminModal();
            errorDiv.style.display = 'none';
        } else {
            errorDiv.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    exportData() {
        try {
            // 准备导出数据
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                totalPhotos: this.photos.length,
                names: this.names,
                metadata: {
                    description: '照片展示墙姓名数据',
                    photoCount: Object.keys(this.names).length
                }
            };

            // 创建下载链接
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            // 生成文件名
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `photo-names-${dateStr}.json`;

            // 创建下载链接并触发下载
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 清理URL对象
            URL.revokeObjectURL(url);

            this.showToast('数据导出成功！', 'success');

        } catch (error) {
            console.error('导出失败:', error);
            this.showToast('导出失败，请重试', 'error');
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showToast('请选择JSON格式的文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                this.validateAndPreviewImport(importData);
            } catch (error) {
                console.error('文件解析失败:', error);
                this.showToast('文件格式错误，请检查JSON格式', 'error');
            }
        };

        reader.readAsText(file);

        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }

    validateAndPreviewImport(importData) {
        try {
            // 验证数据格式
            if (!importData.names || typeof importData.names !== 'object') {
                throw new Error('数据格式不正确：缺少names字段');
            }

            const names = importData.names;
            const nameCount = Object.keys(names).length;

            if (nameCount === 0) {
                throw new Error('导入文件中没有姓名数据');
            }

            // 验证每个姓名数据的格式
            for (const [id, nameInfo] of Object.entries(names)) {
                if (!nameInfo.chinese && !nameInfo.english) {
                    throw new Error(`照片ID ${id} 的姓名数据不完整`);
                }
            }

            // 显示预览
            this.showImportPreview(names, nameCount);

        } catch (error) {
            console.error('数据验证失败:', error);
            this.showToast(error.message, 'error');
        }
    }

    showImportPreview(names, count) {
        const modal = document.getElementById('import-modal');
        const countSpan = document.getElementById('import-count');
        const preview = document.getElementById('import-preview');

        countSpan.textContent = count;

        // 生成预览内容（显示前10条）
        const entries = Object.entries(names).slice(0, 10);
        preview.innerHTML = entries.map(([id, nameInfo]) => `
            <div class="import-preview-item">
                <span>照片 ${id}</span>
                <span>${nameInfo.chinese} / ${nameInfo.english}</span>
            </div>
        `).join('');

        if (count > 10) {
            preview.innerHTML += `<div style="text-align: center; color: #666; margin-top: 10px;">... 还有 ${count - 10} 条数据</div>`;
        }

        // 保存待导入的数据
        this.pendingImportData = names;

        modal.style.display = 'flex';
    }

    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        this.pendingImportData = null;
    }

    confirmImport() {
        if (!this.pendingImportData) {
            this.showToast('没有待导入的数据', 'error');
            return;
        }

        try {
            // 导入数据
            this.names = { ...this.pendingImportData };
            this.saveNames();

            // 标记设置已完成
            localStorage.setItem('setupCompleted', 'true');

            // 刷新显示
            this.renderPhotos();

            // 关闭模态框
            this.hideImportModal();

            const count = Object.keys(this.names).length;
            this.showToast(`成功导入 ${count} 条姓名数据！`, 'success');

        } catch (error) {
            console.error('导入失败:', error);
            this.showToast('导入失败，请重试', 'error');
        }
    }

    showToast(message, type = 'success') {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 3秒后自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    downloadTemplate() {
        // 创建模板数据
        const templateData = {
            version: '1.0',
            description: '照片展示墙姓名数据模板',
            exportDate: new Date().toISOString(),
            totalPhotos: this.photos.length,
            names: {},
            metadata: {
                description: '请按照此格式填写姓名数据，照片ID对应photos文件夹中的文件编号',
                photoCount: 0
            }
        };

        // 为所有照片生成模板条目
        this.photos.forEach(photo => {
            templateData.names[photo.id] = {
                chinese: '请填写中文姓名',
                english: 'Please fill English name'
            };
        });

        templateData.metadata.photoCount = this.photos.length;

        // 创建下载
        const dataStr = JSON.stringify(templateData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'photo-names-template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        this.showToast('模板下载成功！请编辑后导入', 'success');
    }

    showSyncStatus(status) {
        // 移除现有状态指示器
        const existing = document.querySelector('.sync-status');
        if (existing) {
            existing.remove();
        }

        // 创建新的状态指示器
        const statusDiv = document.createElement('div');
        statusDiv.className = 'sync-status';
        
        if (status === '已同步') {
            statusDiv.classList.add('synced');
            statusDiv.textContent = '📁 已同步本地文件';
        } else if (status === '已修改') {
            statusDiv.classList.add('modified');
            statusDiv.textContent = '📝 数据已修改';
        }
        
        document.body.appendChild(statusDiv);
        
        // 3秒后淡出
        setTimeout(() => {
            statusDiv.style.opacity = '0.3';
        }, 3000);
    }

    showLocalFileInfo() {
        const hasShownInfo = localStorage.getItem('hasShownLocalFileInfo');
        const hasLocalFile = localStorage.getItem('hasLocalFile') === 'true';
        
        if (!hasShownInfo && hasLocalFile) {
            setTimeout(() => {
                this.showToast('💡 已自动加载本地数据文件，修改后会提示更新', 'success');
                localStorage.setItem('hasShownLocalFileInfo', 'true');
            }, 2000);
        }
    }

    showHoverPreview(event, imagePath) {
        // 移除现有的预览
        this.hideHoverPreview();

        // 创建预览元素
        this.hoverPreview = document.createElement('div');
        this.hoverPreview.className = 'photo-hover-preview';
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = '预览图片';
        
        // 等待图片加载完成后获取真实尺寸
        img.onload = () => {
            if (this.hoverPreview) {
                // 获取图片的真实尺寸
                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;
                
                // 计算适合屏幕的尺寸（保持原始比例）
                const maxWidth = Math.min(500, window.innerWidth * 0.4);
                const maxHeight = Math.min(600, window.innerHeight * 0.6);
                
                let displayWidth = naturalWidth;
                let displayHeight = naturalHeight;
                
                // 如果图片太大，按比例缩放
                if (displayWidth > maxWidth || displayHeight > maxHeight) {
                    const widthRatio = maxWidth / displayWidth;
                    const heightRatio = maxHeight / displayHeight;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    displayWidth = displayWidth * ratio;
                    displayHeight = displayHeight * ratio;
                }
                
                // 设置图片显示尺寸
                img.style.width = displayWidth + 'px';
                img.style.height = displayHeight + 'px';
                
                // 存储预览窗口尺寸供定位使用
                this.previewWidth = displayWidth;
                this.previewHeight = displayHeight;
                
                // 更新位置
                this.updateHoverPreviewPosition(event);
                
                // 显示预览
                this.hoverPreview.classList.add('show');
            }
        };
        
        this.hoverPreview.appendChild(img);
        document.body.appendChild(this.hoverPreview);

        // 设置初始位置（使用默认尺寸）
        this.previewWidth = 300;
        this.previewHeight = 400;
        this.updateHoverPreviewPosition(event);
    }

    hideHoverPreview() {
        if (this.hoverPreview) {
            this.hoverPreview.classList.remove('show');
            setTimeout(() => {
                if (this.hoverPreview && this.hoverPreview.parentNode) {
                    this.hoverPreview.parentNode.removeChild(this.hoverPreview);
                }
                this.hoverPreview = null;
            }, 300);
        }
    }

    updateHoverPreviewPosition(event) {
        if (!this.hoverPreview) return;

        const preview = this.hoverPreview;
        const previewWidth = this.previewWidth || 300;
        const previewHeight = this.previewHeight || 400;
        const offset = 20;

        let x = event.clientX + offset;
        let y = event.clientY + offset;

        // 防止预览图超出屏幕右边
        if (x + previewWidth > window.innerWidth) {
            x = event.clientX - previewWidth - offset;
        }

        // 防止预览图超出屏幕底部
        if (y + previewHeight > window.innerHeight) {
            y = event.clientY - previewHeight - offset;
        }

        // 防止预览图超出屏幕左边和顶部
        x = Math.max(offset, x);
        y = Math.max(offset, y);

        preview.style.left = x + 'px';
        preview.style.top = y + 'px';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PhotoGallery();
});