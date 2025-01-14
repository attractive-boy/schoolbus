import { BASE_URL } from '../../utils/config'

Page({
  data: {
    authUrl: '',
    loading: true
  },

  async onLoad() {
    try {
      // 获取当前用户信息，用于构建state参数
      const userInfo = wx.getStorageSync('userInfo') || {}
      const token = wx.getStorageSync('token')
      console.log('userInfo', userInfo)

      // 构建授权URL
      const authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize' +
        '?appid=wx85570a9bf2385a6b' +  // 替换为你的公众号 appid
        '&redirect_uri=' + `https://bingshi.xn--vuqw0e54ixuh2wab7xjjnvyb7x0m.online/api/wechat-association?token=${token}` + 
        '&response_type=code' +
        '&scope=snsapi_base' + 
        '#wechat_redirect'

      console.log('authUrl', authUrl)

      this.setData({
        authUrl,
        loading: false
      })
    } catch (error) {
      console.error('初始化失败：', error)
      wx.showToast({
        title: '页面初始化失败',
        icon: 'none'
      })
    }
  },

  // web-view 加载成功
  bindload(e) {
    console.log('web-view 加载成功', e)
    this.setData({ loading: false })
  },

  // web-view 加载失败
  binderror(e) {
    console.error('web-view 加载失败', e)
    this.setData({ loading: false })
    wx.showToast({
      title: '页面加载失败',
      icon: 'none'
    })
  },

  // 监听网页向小程序 postMessage 的消息
  bindmessage(e) {
    console.log('收到网页消息：', e.detail)
    const { data } = e.detail

    switch (data[0].type) {
      case 'auth_success':
        this.handleAuthSuccess(data.data)

        break
      case 'auth_fail':
        this.handleAuthFail(data.error)
        break
      default:
        console.warn('未知消息类型：', data.type)
    }
  },

  // 处理授权成功
  handleAuthSuccess(data) {
    wx.showToast({
      title: '关联成功',
      icon: 'success'
    })

    // 获取用户信息决定跳转页面
    const userInfo = wx.getStorageSync('userInfo')
    const url = userInfo.role === 'driver' 
      ? '/pages/scan-ticket/index'
      : '/pages/agreement/index'

    // 延迟跳转
    setTimeout(() => {
      wx.switchTab({ url })
    }, 1500)
  },

  // 处理授权失败
  handleAuthFail(error) {
    console.error('授权失败：', error)
    wx.showToast({
      title: '请先关注公众号',
      icon: 'none',
      duration: 2000
    })
    // 跳转到公众号关注的小程序页面
    wx.navigateTo({
      url: '/pages/subscribe-official/index'
    })

  },

}) 

