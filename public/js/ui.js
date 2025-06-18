// UI 操作和渲染

const UI = {
    // DOM 元素缓存
    elements: {},

    // 消息缓存（用于增量更新）
    messageCache: new Map(),

    // 初始化UI
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    // 缓存DOM元素
    cacheElements() {
        this.elements = {
            messageList: document.getElementById('messageList'),
            messageForm: document.getElementById('messageForm'),
            messageText: document.getElementById('messageText'),
            sendButton: document.getElementById('sendButton'),
            fileInput: document.getElementById('fileInput'),
            uploadStatus: document.getElementById('uploadStatus'),
            progressBar: document.getElementById('progressBar'),
            fileButton: document.getElementById('fileButton')
        };
    },
    
    // 绑定事件
    bindEvents() {
        // 自动调整文本框高度和切换发送按钮
        this.elements.messageText.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.checkInputAndToggleSendButton();
        });

        // 回车发送消息
        this.elements.messageText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                MessageHandler.sendMessage();
            }
        });

        // 初始化时检查输入状态
        this.checkInputAndToggleSendButton();
    },
    

    
    // 自动调整文本框高度
    autoResizeTextarea() {
        const textarea = this.elements.messageText;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    },
    
    // 显示加载状态
    showLoading(message = '加载中...') {
        this.elements.messageList.innerHTML = `
            <div class="loading">
                <div class="loading-spinner">⏳</div>
                <span>${message}</span>
            </div>
        `;
    },
    
    // 显示空状态
    showEmpty(message = '还没有消息，开始聊天吧！') {
        this.elements.messageList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>${message}</p>
            </div>
        `;
    },
    
    // 渲染消息列表（增量更新）
    renderMessages(messages, forceScroll = false) {
        if (!messages || messages.length === 0) {
            this.showEmpty();
            this.messageCache.clear();
            return;
        }

        // 检查用户是否在底部
        const wasAtBottom = this.isAtBottom();

        // 按时间戳升序排序（旧消息在上，新消息在下）
        const sortedMessages = [...messages].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        // 执行增量更新
        this.updateMessagesIncremental(sortedMessages);

        // 只有在用户原本在底部或强制滚动时才滚动到底部
        if (wasAtBottom || forceScroll) {
            this.scrollToBottom();
        }
    },

    // 增量更新消息列表
    updateMessagesIncremental(messages) {
        const currentDeviceId = Utils.getDeviceId();
        const messageContainer = this.elements.messageList;

        // 如果是空状态，清空并重新开始
        if (messageContainer.querySelector('.empty-state')) {
            messageContainer.innerHTML = '';
            this.messageCache.clear();
        }

        // 创建新的消息ID集合
        const newMessageIds = new Set(messages.map(msg => msg.id));

        // 移除不存在的消息（静默移除）
        this.messageCache.forEach((element, messageId) => {
            if (!newMessageIds.has(messageId)) {
                element.remove();
                this.messageCache.delete(messageId);
            }
        });

        // 批量处理新消息，减少DOM操作
        const fragment = document.createDocumentFragment();
        const newElements = [];

        messages.forEach((message, index) => {
            if (!this.messageCache.has(message.id)) {
                const messageElement = this.createMessageElement(message, currentDeviceId);

                // 找到正确的插入位置
                const insertPosition = this.findInsertPosition(message, messages, index);

                if (insertPosition === null) {
                    // 添加到fragment，稍后一次性插入
                    fragment.appendChild(messageElement);
                } else {
                    // 直接插入到指定位置
                    messageContainer.insertBefore(messageElement, insertPosition);
                }

                this.messageCache.set(message.id, messageElement);
                newElements.push(messageElement);
            }
        });

        // 一次性添加所有新消息到末尾
        if (fragment.children.length > 0) {
            messageContainer.appendChild(fragment);
        }

        // 批量添加淡入动画
        if (newElements.length > 0) {
            requestAnimationFrame(() => {
                newElements.forEach(element => {
                    element.classList.add('fade-in');
                });
            });
        }
    },
    
    // 创建消息DOM元素
    createMessageElement(message, currentDeviceId) {
        const isOwn = message.device_id === currentDeviceId;
        const time = Utils.formatTime(message.timestamp);
        const deviceName = isOwn ? '我的设备' : '其他设备';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        messageDiv.dataset.messageId = message.id;
        messageDiv.dataset.timestamp = message.timestamp;

        if (message.type === CONFIG.MESSAGE_TYPES.TEXT) {
            messageDiv.innerHTML = this.renderTextMessageContent(message, deviceName, time);
        } else if (message.type === CONFIG.MESSAGE_TYPES.FILE) {
            messageDiv.innerHTML = this.renderFileMessageContent(message, deviceName, time);
        }

        return messageDiv;
    },

    // 找到消息的正确插入位置
    findInsertPosition(message, allMessages, currentIndex) {
        const messageContainer = this.elements.messageList;
        const existingMessages = Array.from(messageContainer.children);

        // 如果是第一条消息或容器为空
        if (currentIndex === 0 || existingMessages.length === 0) {
            return existingMessages[0] || null;
        }

        // 查找下一条已存在的消息
        for (let i = currentIndex + 1; i < allMessages.length; i++) {
            const nextMessage = allMessages[i];
            const existingElement = this.messageCache.get(nextMessage.id);
            if (existingElement && messageContainer.contains(existingElement)) {
                return existingElement;
            }
        }

        return null; // 插入到末尾
    },

    // 渲染单个消息（保留用于兼容性）
    renderMessage(message, currentDeviceId) {
        const isOwn = message.device_id === currentDeviceId;
        const time = Utils.formatTime(message.timestamp);
        const deviceName = isOwn ? '我的设备' : '其他设备';

        if (message.type === CONFIG.MESSAGE_TYPES.TEXT) {
            return this.renderTextMessage(message, isOwn, deviceName, time);
        } else if (message.type === CONFIG.MESSAGE_TYPES.FILE) {
            return this.renderFileMessage(message, isOwn, deviceName, time);
        }

        return '';
    },
    
    // 渲染文本消息内容
    renderTextMessageContent(message, deviceName, time) {
        return `
            <div class="message-content">
                <div class="text-message">${this.escapeHtml(message.content)}</div>
            </div>
            <div class="message-meta">
                <span>${deviceName}</span>
                <span class="message-time">${time}</span>
            </div>
        `;
    },

    // 渲染文本消息（保留用于兼容性）
    renderTextMessage(message, isOwn, deviceName, time) {
        return `
            <div class="message ${isOwn ? 'own' : 'other'} fade-in">
                <div class="message-content">
                    <div class="text-message">${this.escapeHtml(message.content)}</div>
                </div>
                <div class="message-meta">
                    <span>${deviceName}</span>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;
    },
    
    // 渲染文件消息内容
    renderFileMessageContent(message, deviceName, time) {
        const fileIcon = Utils.getFileIcon(message.mime_type);
        const fileSize = Utils.formatFileSize(message.file_size);
        const isImage = Utils.isImageFile(message.mime_type);

        let imagePreview = '';
        if (isImage) {
            imagePreview = `
                <div class="image-preview">
                    <img src="/api/files/download/${message.r2_key}"
                         alt="${this.escapeHtml(message.original_name)}"
                         loading="lazy">
                </div>
            `;
        }

        return `
            <div class="message-content">
                <div class="file-message">
                    <div class="file-info">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-details">
                            <div class="file-name">${this.escapeHtml(message.original_name)}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <button class="download-btn"
                                onclick="API.downloadFile('${message.r2_key}', '${this.escapeHtml(message.original_name)}')">
                            ⬇️ 下载
                        </button>
                    </div>
                    ${imagePreview}
                </div>
            </div>
            <div class="message-meta">
                <span>${deviceName}</span>
                <span class="message-time">${time}</span>
            </div>
        `;
    },

    // 渲染文件消息（保留用于兼容性）
    renderFileMessage(message, isOwn, deviceName, time) {
        const fileIcon = Utils.getFileIcon(message.mime_type);
        const fileSize = Utils.formatFileSize(message.file_size);
        const isImage = Utils.isImageFile(message.mime_type);

        let imagePreview = '';
        if (isImage) {
            imagePreview = `
                <div class="image-preview">
                    <img src="/api/files/download/${message.r2_key}"
                         alt="${this.escapeHtml(message.original_name)}"
                         loading="lazy">
                </div>
            `;
        }

        return `
            <div class="message ${isOwn ? 'own' : 'other'} fade-in">
                <div class="message-content">
                    <div class="file-message">
                        <div class="file-info">
                            <div class="file-icon">${fileIcon}</div>
                            <div class="file-details">
                                <div class="file-name">${this.escapeHtml(message.original_name)}</div>
                                <div class="file-size">${fileSize}</div>
                            </div>
                            <button class="download-btn"
                                    onclick="API.downloadFile('${message.r2_key}', '${this.escapeHtml(message.original_name)}')">
                                ⬇️ 下载
                            </button>
                        </div>
                        ${imagePreview}
                    </div>
                </div>
                <div class="message-meta">
                    <span>${deviceName}</span>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;
    },
    
    // 添加新消息到列表（增量方式）
    addMessage(message) {
        // 检查用户是否在底部
        const wasAtBottom = this.isAtBottom();

        // 如果当前是空状态，先清空
        if (this.elements.messageList.querySelector('.empty-state')) {
            this.elements.messageList.innerHTML = '';
            this.messageCache.clear();
        }

        // 如果消息已存在，不重复添加
        if (this.messageCache.has(message.id)) {
            return;
        }

        const currentDeviceId = Utils.getDeviceId();
        const messageElement = this.createMessageElement(message, currentDeviceId);

        // 添加到末尾
        this.elements.messageList.appendChild(messageElement);
        this.messageCache.set(message.id, messageElement);

        // 添加淡入动画
        requestAnimationFrame(() => {
            messageElement.classList.add('fade-in');
        });

        // 只有在用户原本在底部时才自动滚动
        if (wasAtBottom) {
            this.scrollToBottom();
        }
    },
    
    // 检查是否在底部
    isAtBottom() {
        const container = this.elements.messageList;
        const threshold = 50; // 50px的容差
        return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    },

    // 滚动到底部
    scrollToBottom() {
        // 使用requestAnimationFrame确保DOM更新完成后再滚动
        requestAnimationFrame(() => {
            const container = this.elements.messageList;
            container.scrollTop = container.scrollHeight;
        });
    },
    
    // 设置发送按钮状态 - 微信移动端风格
    setSendButtonState(disabled, loading = false) {
        this.elements.sendButton.disabled = disabled;

        if (loading) {
            this.elements.sendButton.classList.add('loading');
        } else {
            this.elements.sendButton.classList.remove('loading');
        }
    },

    // 显示/隐藏发送按钮 - 微信移动端风格
    toggleSendButton(show) {
        if (show) {
            this.elements.sendButton.classList.add('show');
        } else {
            this.elements.sendButton.classList.remove('show');
        }
    },

    // 检查输入内容并切换发送按钮显示
    checkInputAndToggleSendButton() {
        const hasContent = this.getInputValue().length > 0;
        this.toggleSendButton(hasContent);
    },
    

    
    // 清空输入框
    clearInput() {
        this.elements.messageText.value = '';
        this.autoResizeTextarea();
        this.toggleSendButton(false); // 清空输入时隐藏发送按钮
    },
    
    // 获取输入内容
    getInputValue() {
        return this.elements.messageText.value.trim();
    },
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 显示错误消息
    showError(message) {
        Utils.showNotification(message, 'error');
        
        // 可以添加更明显的错误提示UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4757;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    },
    
    // 显示成功消息
    showSuccess(message) {
        Utils.showNotification(message, 'success');

        // 如果是多行消息，也显示一个更明显的成功提示
        if (message.includes('\n')) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.innerHTML = message.replace(/\n/g, '<br>');
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #07c160;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 1000;
                animation: fadeIn 0.3s ease-out;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
                font-size: 14px;
                line-height: 1.5;
            `;

            document.body.appendChild(successDiv);

            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }
    },

    // 设置连接状态（简化版，仅用于控制台日志）
    setConnectionStatus(status) {
        console.log(`连接状态: ${status}`);
        // 可以在这里添加其他状态指示，比如在消息列表中显示状态
    },

    // 显示上传状态
    showUploadStatus(show = true) {
        const uploadStatus = this.elements.uploadStatus;
        if (uploadStatus) {
            uploadStatus.style.display = show ? 'flex' : 'none';
        }
    },

    // 更新上传进度
    updateUploadProgress(percent) {
        const progressBar = document.getElementById('progressBar') || this.elements.progressBar;
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    },

    // 重置上传状态
    resetUploadStatus() {
        this.showUploadStatus(false);
        this.updateUploadProgress(0);
    },

    // 显示键盘快捷键提示
    showKeyboardHint(message, duration = 3000) {
        // 移除现有提示
        const existingHint = document.querySelector('.keyboard-hint');
        if (existingHint) {
            existingHint.remove();
        }

        // 创建新提示
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.textContent = message;
        document.body.appendChild(hint);

        // 显示动画
        setTimeout(() => hint.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, duration);
    },

    // 添加消息状态指示器
    addMessageStatus(messageElement, status) {
        const metaElement = messageElement.querySelector('.message-meta');
        if (metaElement) {
            const statusSpan = document.createElement('span');
            statusSpan.className = `message-status status-${status}`;

            switch (status) {
                case 'sending':
                    statusSpan.textContent = '⏳';
                    break;
                case 'sent':
                    statusSpan.textContent = '✓';
                    break;
                case 'failed':
                    statusSpan.textContent = '✗';
                    break;
            }

            metaElement.appendChild(statusSpan);
        }
    },

    // 更新消息时间显示格式
    updateMessageTime(messageElement, timestamp) {
        const timeElement = messageElement.querySelector('.message-meta span:last-child');
        if (timeElement) {
            timeElement.innerHTML = `<span class="message-time">${Utils.formatTime(timestamp)}</span>`;
        }
    }
};
