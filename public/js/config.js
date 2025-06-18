// 应用配置文件

const CONFIG = {
    // API 配置
    API: {
        BASE_URL: '',  // 使用相对路径
        ENDPOINTS: {
            MESSAGES: '/api/messages',
            FILES_UPLOAD: '/api/files/upload',
            FILES_DOWNLOAD: '/api/files/download',
            SYNC: '/api/sync',
            CLEAR_ALL: '/api/clear-all'
        }
    },
    
    // 文件上传配置
    FILE: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: '*', // 允许所有类型
        CHUNK_SIZE: 1024 * 1024 // 1MB chunks (如果需要分片上传)
    },
    
    // UI 配置
    UI: {
        AUTO_REFRESH_INTERVAL: 3000, // 3秒自动刷新（更快响应）
        MESSAGE_LOAD_LIMIT: 50, // 每次加载消息数量
        ANIMATION_DURATION: 100, // 动画持续时间(ms)（更快动画）
        TYPING_INDICATOR_DELAY: 1000 // 输入指示器延迟
    },
    
    // 设备配置
    DEVICE: {
        ID_PREFIX: 'web-',
        NAME_MOBILE: '移动设备',
        NAME_DESKTOP: 'Web浏览器',
        STORAGE_KEY: 'deviceId'
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        TEXT: 'text',
        FILE: 'file'
    },
    
    // 文件类型图标映射
    FILE_ICONS: {
        'image/': '🖼️',
        'video/': '🎥',
        'audio/': '🎵',
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'application/vnd.ms-excel': '📊',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
        'application/vnd.ms-powerpoint': '📈',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📈',
        'application/zip': '📦',
        'application/x-rar-compressed': '📦',
        'application/x-7z-compressed': '📦',
        'text/': '📄',
        'default': '📄'
    },
    
    // 清理功能配置
    CLEAR: {
        TRIGGER_COMMANDS: ['/clear-all', '清空数据', '/清空', 'clear all'],
        CONFIRM_CODE: '1234',
        CONFIRM_MESSAGE: '⚠️ 此操作将永久删除所有聊天记录和文件，无法恢复！\n\n请输入确认码：1234'
    },

    // 错误消息
    ERRORS: {
        NETWORK: '网络连接失败，请检查网络',
        FILE_TOO_LARGE: '文件大小不能超过10MB',
        FILE_UPLOAD_FAILED: '文件上传失败',
        MESSAGE_SEND_FAILED: '消息发送失败',
        LOAD_MESSAGES_FAILED: '加载消息失败',
        DEVICE_SYNC_FAILED: '设备同步失败',
        CLEAR_FAILED: '数据清理失败',
        CLEAR_CANCELLED: '数据清理已取消'
    },
    
    // 成功消息
    SUCCESS: {
        FILE_UPLOADED: '文件上传成功',
        MESSAGE_SENT: '消息发送成功',
        DEVICE_SYNCED: '设备同步成功',
        DATA_CLEARED: '数据清理成功'
    }
};

// 冻结配置对象，防止意外修改
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.API.ENDPOINTS);
Object.freeze(CONFIG.FILE);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.DEVICE);
Object.freeze(CONFIG.MESSAGE_TYPES);
Object.freeze(CONFIG.FILE_ICONS);
Object.freeze(CONFIG.CLEAR);
Object.freeze(CONFIG.ERRORS);
Object.freeze(CONFIG.SUCCESS);
