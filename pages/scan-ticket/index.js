Page({
  data: {

    isScanning: false,
    image: null,
    nickname: '',
    routeNames: '',

  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'scan' });
    }
  },

  // 开始扫码
  startScan() {
    this.setData({ isScanning: true });
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        this.verifyTicket(res.result);
      },
      fail: (error) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ isScanning: false });
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
      console.log("response=>",response)
      if (response.valid) {
        wx.showToast({
          title: '验票成功',
          icon: 'success'
        });

        this.setData({
          image: response.availableRoutes[0].avatar_url,
          nickname: response.availableRoutes[0].nickname,
          routeNames: response.availableRoutes.map(route => route.route_name).join(', '),
        });
      } else {
        wx.showToast({
          title: response.message || '无效车票',
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