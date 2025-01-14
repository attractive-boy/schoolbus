// pages/agreement/agreementinfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    agreementContent: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 修改标题
    wx.setNavigationBarTitle({
      title: options.title // 设置为所需的标题
    });
    switch(options.title){
      case '求知专线乘车制度':
        this.fetchAgreementContent('乘车制度');
        break;
      case '求知专线乘车公约':
        this.fetchAgreementContent('乘车公约');
        break;
    }
  },

  async fetchAgreementContent(type) {

    const app = getApp();

    // 新增：获取协议内容
    const response = await app.request.get(`/api/protocols/current`);
    console.log(response);
    if (response.success) {
      const content = response.data.find(item => item.type == type);
      if (content) {
        this.setData({
          agreementContent: content.content
        });
      }
    } else {
      console.error('获取协议内容失败:', response.message);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})