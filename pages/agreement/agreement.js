Page({
  data: {
    agreementChecked: false
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  toggleAgreement(e) {
    this.setData({
      agreementChecked: e.detail.value.length > 0
    });
  },

  submitAgreement() {
    if (this.data.agreementChecked) {
      wx.switchTab({
        url: '/pages/booking/index' // 替换为实际的主页面路径
      });
    } else {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
    }
  },
   openLink(event) {
    const url = event.currentTarget.dataset.url; // 获取链接
    wx.navigateTo({
        url: `/pages/agreement/agreementinfo?title=${url}` // 替换为实际路径
    });
}
}); 