// index.js
import { getImageUrl,IMAGE_BASE_URL } from '../../utils/config'

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    role: 'student',
    avatarUrl: defaultAvatarUrl,
    nickname: '',
    communityName: '',
    communityOptions: [],
    loading: false,
    showCommunityPicker: false
  },

  async onLoad() {
    console.log('onLoad')
    // 假设从服务器获取小区选项
    const communityOptions = await this.fetchCommunityOptions();
    const communitySelected = communityOptions.map(item => ({
      value: item.id,
      label: item.name
    }))
    this.setData({ communityOptions, communitySelected });

    // 检查是否已登录
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
      console.log('userInfo', userInfo)
      // 如果有缓存的用户信息，设置到页面数据中
      if (userInfo) {
        this.setData({
          avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
          nickname: userInfo.nickname || '',
          role: userInfo.role || 'student',
          communityIndex: userInfo.communityId || '',
          communityName: userInfo.communityName || ''
        })
      }

    // if (token) {
    //   //后台查看是否关联微信公众号
    //   const app = getApp()
    //   const result = await app.request.get('/api/check-wechat-association')
    //   console.log('result', result)
    //   if (result.code === 200 && !result.data.hasUnionid) {
    //     //跳转到关联微信公众号页面
    //     wx.navigateTo({
    //       url: '/pages/wechat-association/index'
    //     })
    //     return
    //   }

    //   // 根据角色跳转到不同页面
    //   const url = userInfo.role === 'driver' 
    //     ? '/pages/scan-ticket/index'
    //     : '/pages/agreement/agreement'  
    //   wx.switchTab({
    //     url
    //   })
    //   return
    // }

  
  },

  async fetchCommunityOptions() {
    const app = getApp();
    const result = await app.request.get('/api/get-communities');
    console.log('result', result)
    return result.data || [];
  },

  onRoleChange(e) {
    this.setData({
      role: e.detail.value
    });
  },

  handleSelectCommunity() {
    this.setData({
      showCommunityPicker: true
    });
  },

  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    
    try {
      const app = getApp();
      const uploadResult = await app.request.upload('/api/upload', avatarUrl, {
        name: 'file',
        formData: {
          type: 'avatar'
        }
      });

      this.setData({
        avatarUrl: getImageUrl(uploadResult.url) || defaultAvatarUrl
      });

    } catch (error) {
      wx.showToast({
        title: '头像上传失败',
        icon: 'none'
      });
      this.setData({
        avatarUrl: defaultAvatarUrl
      });
    }
  },

  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  async handleLogin() {
    const nicknamePattern = /^\d{3}[^\d]{2,5}$/; // 正则表达式：3位数字 + 2-5个汉字
    if(this.data.role === 'student' && (!this.data.nickname || !nicknamePattern.test(this.data.nickname))) {
      wx.showToast({
        title: '请输入格式为班级+姓名（如：123班张三）',
        icon: 'none'
      });
      return;
    }
    if(this.data.role === 'driver' && (!this.data.nickname || !/^\d{8}$/.test(this.data.nickname))) {
      wx.showToast({
        title: '请输入8位数字工号',
        icon: 'none'
      });
      return;
    }
    if(this.data.role === 'student' && !this.data.communityIndex) {
      wx.showToast({
        title: '请选择所在小区',
        icon: 'none'
      });
      return;
    }
    this.setData({ loading: true });

    try {
      // 获取微信登录凭证
      const loginRes = await wx.login()
      
      // 发送登录请求
      const app = getApp()
      const result = await app.request.post('/api/aplogin', {
        code: loginRes.code,
        role: this.data.role,
        nickname: this.data.nickname,
        avatarUrl: this.data.avatarUrl.replace(IMAGE_BASE_URL, ''),
        communityId: this.data.communityIndex || '',
        communityName: this.data.communityName || ''
      })

      // 保存用户信息和token
      wx.setStorageSync('userInfo', {
        nickname: this.data.nickname,
        avatarUrl: this.data.avatarUrl,
        role: this.data.role,
        communityId: this.data.communityIndex || '',
        communityName: this.data.communityName || ''
      });
      wx.setStorageSync('token', result.token);

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      const checkresult = await app.request.get('/api/check-wechat-association')
      if (checkresult.code === 200 && !checkresult.data.hasUnionid) {
        //跳转到关联微信公众号页面
        wx.navigateTo({
          url: '/pages/wechat-association/index'
        })
        return
      }

      // 根据角色跳转到不同页面
      const url = this.data.role === 'driver' 
        ? '/pages/scan-ticket/index'
        : '/pages/agreement/agreement';
        
        this.data.role === 'driver' ? wx.switchTab({ url }) : wx.navigateTo({ url }); 

    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCommunityChange(e) {
    console.log('onCommunityChange', e)
    const community = this.data.communityOptions.find(item => item.id === e.detail.value[0])
    console.log('community', community)
    this.setData({
      communityName: community.name,
      showCommunityPicker: false,
      communityIndex: e.detail.value[0]
    });
  },

  onPickerCancel() {
    this.setData({
      showCommunityPicker: false
    });
  },

  onPickerConfirm(e) {
    console.log('onPickerConfirm', e)
  }
});
