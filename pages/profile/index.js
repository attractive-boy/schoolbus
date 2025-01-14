Page({
  data: {
    userInfo: null,
    orderCount: 0
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'profile' });
    }
  },

  // 获取用户信息
  async getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
  },


  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.reLaunch({
            url: '/pages/login/index'
          });
        }
      }
    });
  },

  handleScanCode() {
    wx.scanCode({
      success: async (res) => {
        try {
          const app = getApp();
          // 使用封装的 request 发起请求
          const response = await app.request.post('/api/qrcode/bind', {
            qrCode: res.result
          });
          
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          });
        } catch (error) {
          wx.showToast({
            title: error.message || '绑定失败',
            icon: 'error'
          });
        }
      },
      fail: (error) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'error'
        });
      }
    });
  },

  // 验证车票
  async verifyTicket(ticketCode) {
    try {
      const app = getApp();
      // 使用封装的 request 发起请求
      const response = await app.request.post('/api/ticket/verify', {
        ticketCode
      });

      if (response.data.valid) {
        wx.showToast({
          title: '验票成功',
          icon: 'success'
        });
        this.setData({
          scanResult: response.data.ticketInfo
        });
      } else {
        wx.showToast({
          title: response.data.message || '无效车票',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.showToast({
        title: '验证失败',
        icon: 'none'
      });
    }
  }
}); 