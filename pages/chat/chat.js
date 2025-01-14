import { getImageUrl } from '../../utils/config'

Page({
  data: {
    messages: [],
    inputValue: '',
    isRefreshing: false,
    nickname: '',
    userId: '',
    showModal: false,
    sending: false
  },

  onLoad(options) {
    // 设置导航栏标题为用户昵称
    if (options.nickname) {
      wx.setNavigationBarTitle({
        title: options.nickname
      });
      this.setData({
        nickname: options.nickname,
        userId: options.userId
      });
    }
    this.loadMessages();
  },

  // 加载消息列表
  async loadMessages() {
    try {
      const app = getApp();
      const res = await app.request.get('/api/getMessages', {
        userId: this.data.userId
      });

      if (res && Array.isArray(res)) {
        // 处理消息数据
        const formattedMessages = res.map(msg => ({
          id: msg.id,
          content: msg.content,
          author: msg.sender_nickname,
          avatarUrl: getImageUrl(msg.sender_avatar),
          time: this.formatTime(msg.created_at)
        }));

        this.setData({ messages: formattedMessages });
      }
    } catch (err) {
      console.error('加载消息失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 今天的消息显示具体时间
    if (diff < 24 * 60 * 60 * 1000) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 一周内的消息显示周几
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()];
    }
    
    // 更早的消息显示具体日期
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 下拉刷新
  async onRefresh() {
    this.setData({ isRefreshing: true });
    await this.loadMessages();
    this.setData({ isRefreshing: false });
  },

  // 输入框变化
  onInputChange(e) {
    console.log("onInputChange=>", e)
    this.setData({ 
      inputValue: e.detail.value || e.detail  
    });
  },

  // 发送消息
  async sendMessage() {
    if (!this.data.inputValue.trim()) {
      this.showMessage('请输入留言内容');
      return;
    }

    this.setData({ sending: true });

    try {
      const app = getApp();
      const messageData = {
        receiverId: this.data.userId,
        content: this.data.inputValue.trim(),
        senderNickname: app.globalData.userInfo?.nickName,
        senderAvatar: app.globalData.userInfo?.avatarUrl
      };

      await app.request.post('/api/sendMessage', messageData);

      this.setData({ 
        inputValue: '',
        showModal: false,
        sending: false
      });
      
      await this.loadMessages();
      this.showMessage('发送成功', 'success');
    } catch (err) {
      console.error('发送消息失败：', err);
      this.showMessage(err.message || '发送失败，请稍后重试');
    } finally {
      this.setData({ sending: false });
    }
  },

  showMessage(message, type = 'error') {
    wx.showToast({
      title: message,
      icon: type === 'success' ? 'success' : 'error',
      duration: 2000
    });
  },

  showModal() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showModal({
        title: '提示',
        content: '发布留言需要先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }
    this.setData({ showModal: true });
  },

  hideModal() {
    this.setData({ 
      showModal: false,
      inputValue: '',
      sending: false
    });
  },

  // 处理弹窗显示状态变化
  onVisibleChange(e) {
    const { visible } = e.detail;
    if (!visible) {
      this.hideModal();
    }
  }
}); 