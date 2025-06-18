// API 接口封装

const API = {
    // 通用请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },
    
    // GET 请求
    async get(url, params = {}) {
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams}` : url;
        
        return this.request(fullUrl, {
            method: 'GET',
        });
    },
    
    // POST 请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    // 文件上传请求
    async upload(url, formData) {
        return this.request(url, {
            method: 'POST',
            headers: {}, // 让浏览器自动设置Content-Type
            body: formData,
        });
    },
    
    // 获取消息列表
    async getMessages(limit = CONFIG.UI.MESSAGE_LOAD_LIMIT, offset = 0) {
        try {
            const response = await this.get(CONFIG.API.ENDPOINTS.MESSAGES, {
                limit,
                offset
            });

            if (response && response.success) {
                return response.data || [];
            } else {
                throw new Error(response?.error || CONFIG.ERRORS.LOAD_MESSAGES_FAILED);
            }
        } catch (error) {
            console.error('获取消息失败:', error);
            // 静默处理所有错误，返回空数组，让UI显示空状态
            console.log('API错误，返回空消息列表以避免显示加载状态');
            return [];
        }
    },
    
    // 发送文本消息
    async sendMessage(content, deviceId) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.MESSAGES, {
                content,
                deviceId
            });
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.MESSAGE_SEND_FAILED);
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            throw new Error(CONFIG.ERRORS.MESSAGE_SEND_FAILED);
        }
    },
    
    // 上传文件
    async uploadFile(file, deviceId, onProgress = null) {
        try {
            // 验证文件大小
            if (!Utils.validateFileSize(file.size)) {
                throw new Error(CONFIG.ERRORS.FILE_TOO_LARGE);
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('deviceId', deviceId);
            
            // 如果需要进度回调，可以使用XMLHttpRequest
            if (onProgress) {
                return this.uploadWithProgress(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData, onProgress);
            }
            
            const response = await this.upload(CONFIG.API.ENDPOINTS.FILES_UPLOAD, formData);
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.FILE_UPLOAD_FAILED);
            }
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    },
    
    // 带进度的文件上传
    uploadWithProgress(url, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('响应解析失败'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('网络错误'));
            });
            
            xhr.open('POST', url);
            xhr.send(formData);
        });
    },
    
    // 下载文件
    downloadFile(r2Key, fileName) {
        try {
            const url = `${CONFIG.API.ENDPOINTS.FILES_DOWNLOAD}/${r2Key}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('文件下载失败:', error);
            return false;
        }
    },
    
    // 设备同步
    async syncDevice(deviceId, deviceName) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.SYNC, {
                deviceId,
                deviceName
            });

            if (response.success) {
                return true;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.DEVICE_SYNC_FAILED);
            }
        } catch (error) {
            console.error('设备同步失败:', error);
            // 设备同步失败不应该阻止应用运行
            return false;
        }
    },

    // 清空所有数据
    async clearAllData(confirmCode) {
        try {
            const response = await this.post(CONFIG.API.ENDPOINTS.CLEAR_ALL, {
                confirmCode
            });

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || CONFIG.ERRORS.CLEAR_FAILED);
            }
        } catch (error) {
            console.error('数据清理失败:', error);
            throw new Error(error.message || CONFIG.ERRORS.CLEAR_FAILED);
        }
    }
};

// 冻结API对象
Object.freeze(API);
