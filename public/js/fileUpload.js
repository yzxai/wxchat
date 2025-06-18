// 文件上传处理

const FileUpload = {
    // 拖拽状态
    isDragging: false,
    dragCounter: 0,

    // 初始化文件上传
    init() {
        this.bindEvents();
        this.createDragOverlay();
        this.setupClipboardListener();
    },

    // 绑定事件
    bindEvents() {
        const fileInput = document.getElementById('fileInput');
        const fileButton = document.getElementById('fileButton');

        // 点击文件按钮
        if (fileButton) {
            fileButton.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // 文件选择（支持多文件）
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // 全局拖拽事件
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));

        // 阻止浏览器默认的拖拽行为
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    },
    
    // 创建拖拽覆盖层
    createDragOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'dragOverlay';
        overlay.className = 'drag-overlay';
        overlay.innerHTML = `
            <div class="drag-content">
                <div class="drag-icon">📁</div>
                <div class="drag-text">拖拽文件到此处上传</div>
                <div class="drag-hint">支持多文件同时上传</div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // 设置剪贴板监听
    setupClipboardListener() {
        document.addEventListener('paste', this.handlePaste.bind(this));

        // 添加键盘快捷键提示
        this.addKeyboardHints();
    },

    // 处理文件选择（支持多文件）
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        // 批量上传文件
        await this.uploadMultipleFiles(Array.from(files));
    },

    // 处理拖拽进入
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter++;

        if (e.dataTransfer.types.includes('Files')) {
            this.showDragOverlay();
            this.updateDragOverlayContent(e.dataTransfer.items.length);
        }
    },

    // 处理拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
        }
    },

    // 处理拖拽离开
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter--;

        if (this.dragCounter === 0) {
            this.hideDragOverlay();
        }
    },

    // 处理文件拖拽放下
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter = 0;
        this.hideDragOverlay();

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // 显示放下动画
            this.showDropAnimation();
            this.handleFileSelect(files);
        }
    },

    // 处理剪贴板粘贴
    async handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        let hasFiles = false;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                    hasFiles = true;
                }
            }
        }

        if (hasFiles) {
            e.preventDefault();

            // 显示粘贴提示
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const shortcut = isMac ? 'Cmd+V' : 'Ctrl+V';
            UI.showKeyboardHint(`📋 检测到 ${shortcut} 粘贴了 ${files.length} 个文件`, 2000);

            await this.uploadMultipleFiles(files);
        }
    },
    
    // 显示拖拽覆盖层
    showDragOverlay() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.classList.add('dragging');
            this.isDragging = true;
        }
    },

    // 隐藏拖拽覆盖层
    hideDragOverlay() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('dragging');
            this.isDragging = false;
        }
    },

    // 更新拖拽覆盖层内容
    updateDragOverlayContent(fileCount) {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            const dragText = overlay.querySelector('.drag-text');
            const dragHint = overlay.querySelector('.drag-hint');

            if (fileCount > 1) {
                dragText.textContent = `拖拽 ${fileCount} 个文件到此处上传`;
                dragHint.textContent = '支持批量上传';
            } else {
                dragText.textContent = '拖拽文件到此处上传';
                dragHint.textContent = '支持多文件同时上传';
            }
        }
    },

    // 显示放下动画
    showDropAnimation() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            const content = overlay.querySelector('.drag-content');
            content.style.transform = 'scale(1.1)';
            content.style.background = '#e8f5e8';

            setTimeout(() => {
                content.style.transform = 'scale(1)';
                content.style.background = 'white';
            }, 200);
        }
    },

    // 添加键盘快捷键提示
    addKeyboardHints() {
        // 检测操作系统
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const shortcut = isMac ? 'Cmd+V' : 'Ctrl+V';

        // 显示初始提示
        setTimeout(() => {
            UI.showKeyboardHint(`💡 提示：可以拖拽文件到窗口或使用 ${shortcut} 粘贴文件`, 5000);
        }, 2000);

        // 监听焦点事件，在用户交互时显示提示
        let hintShown = false;
        document.addEventListener('click', () => {
            if (!hintShown) {
                hintShown = true;
                setTimeout(() => {
                    UI.showKeyboardHint(`📎 支持拖拽多个文件同时上传`, 3000);
                }, 1000);
            }
        }, { once: true });
    },

    // 批量上传文件
    async uploadMultipleFiles(files) {
        if (!files || files.length === 0) return;

        // 验证所有文件
        const validFiles = [];
        const invalidFiles = [];

        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
        }

        // 显示无效文件警告
        if (invalidFiles.length > 0) {
            const reasons = invalidFiles.map(f => {
                if (!Utils.validateFileSize(f.size)) {
                    return `${f.name} (文件过大)`;
                }
                return `${f.name} (不支持的格式)`;
            });
            UI.showError(`以下文件无法上传：${reasons.join(', ')}`);
        }

        if (validFiles.length === 0) return;

        // 显示批量上传状态
        this.showBatchUploadStatus(validFiles.length);

        // 逐个上传文件
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            try {
                await this.uploadSingleFile(validFiles[i], i + 1, validFiles.length);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`文件 ${validFiles[i].name} 上传失败:`, error);
            }
        }

        // 隐藏上传状态
        this.hideBatchUploadStatus();

        // 显示结果
        if (successCount > 0) {
            UI.showSuccess(`成功上传 ${successCount} 个文件`);
            MessageHandler.loadMessages(true); // 强制滚动到底部
        }

        if (failCount > 0) {
            UI.showError(`${failCount} 个文件上传失败`);
        }

        // 清空文件输入
        this.clearFileInput();
    },

    // 上传单个文件
    async uploadSingleFile(file, current, total) {
        const deviceId = Utils.getDeviceId();

        // 更新当前上传进度显示
        this.updateBatchProgress(file.name, current, total);

        // 上传文件（带进度）
        const result = await API.uploadFile(file, deviceId, (progress) => {
            this.updateFileProgress(progress);
        });

        return result;
    },

    // 验证单个文件
    validateFile(file) {
        // 验证文件大小
        if (!Utils.validateFileSize(file.size)) {
            return false;
        }

        // 验证文件类型（如果需要）
        if (!this.validateFileType(file)) {
            return false;
        }

        return true;
    },
    

    // 显示批量上传状态
    showBatchUploadStatus(fileCount) {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.style.display = 'flex';
            statusElement.innerHTML = `
                <div class="upload-spinner">⏳</div>
                <div class="upload-info">
                    <div class="upload-text">正在上传 ${fileCount} 个文件...</div>
                    <div class="upload-current" id="uploadCurrent"></div>
                </div>
                <div class="upload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
            `;
        }
    },

    // 隐藏批量上传状态
    hideBatchUploadStatus() {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    },

    // 更新批量上传进度
    updateBatchProgress(fileName, current, total) {
        const currentElement = document.getElementById('uploadCurrent');
        if (currentElement) {
            // 截断长文件名
            const displayName = fileName.length > 30 ?
                fileName.substring(0, 27) + '...' : fileName;
            currentElement.textContent = `正在上传: ${displayName} (${current}/${total})`;
        }
    },

    // 更新文件上传进度
    updateFileProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    },

    // 清空文件输入
    clearFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            // 确保支持多文件选择
            if (!fileInput.hasAttribute('multiple')) {
                fileInput.setAttribute('multiple', 'true');
            }
        }
    },

    // 验证文件类型（如果需要限制）
    validateFileType(file) {
        // 目前允许所有文件类型
        return true;
    },

    // 获取文件预览（如果是图片）
    getFilePreview(file) {
        return new Promise((resolve) => {
            if (!Utils.isImageFile(file.type)) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
};

// 添加拖拽和上传相关样式
const uploadStyles = `
    /* 拖拽覆盖层 */
    .drag-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(7, 193, 96, 0.1);
        backdrop-filter: blur(2px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        pointer-events: none;
    }

    .drag-overlay.active {
        opacity: 1;
        visibility: visible;
    }

    .drag-content {
        background: white;
        border: 3px dashed #07c160;
        border-radius: 20px;
        padding: 3rem;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        transform: scale(0.9);
        transition: transform 0.2s ease;
    }

    .drag-overlay.active .drag-content {
        transform: scale(1);
    }

    .drag-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: bounce 1s infinite;
    }

    .drag-text {
        font-size: 1.5rem;
        font-weight: 600;
        color: #07c160;
        margin-bottom: 0.5rem;
    }

    .drag-hint {
        font-size: 1rem;
        color: #666;
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }

    /* 改进的上传状态 */
    .upload-status {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .upload-spinner {
        font-size: 1.2rem;
        animation: spin 1s linear infinite;
    }

    .upload-info {
        flex: 1;
    }

    .upload-text {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.25rem;
    }

    .upload-current {
        font-size: 0.9rem;
        color: #666;
    }

    .upload-progress {
        width: 200px;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #07c160, #06ad56);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    /* 文件按钮增强 */
    .file-button {
        position: relative;
        overflow: hidden;
    }

    .file-button::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(7, 193, 96, 0.1);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .file-button:hover::after {
        opacity: 1;
    }

    /* 键盘快捷键提示 */
    .keyboard-hint {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        font-size: 0.85rem;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        max-width: 300px;
        text-align: center;
    }

    .keyboard-hint.show {
        opacity: 1;
        transform: translateY(0);
    }

    /* 改进消息列表在拖拽时的样式 */
    .message-list {
        transition: all 0.2s ease;
    }

    body.dragging .message-list {
        filter: brightness(0.95);
        transform: scale(0.98);
    }

    /* 文件按钮悬停效果 */
    .file-button {
        transition: all 0.2s ease;
    }

    .file-button:hover {
        transform: scale(1.05);
        background-color: rgba(7, 193, 96, 0.1);
    }

    /* 上传状态动画 */
    @keyframes uploadPulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }

    .upload-status {
        animation: uploadPulse 2s ease-in-out infinite;
    }
`;

// 动态添加样式
const styleSheet = document.createElement('style');
styleSheet.textContent = uploadStyles;
document.head.appendChild(styleSheet);
