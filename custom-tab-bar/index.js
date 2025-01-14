Component({
  data: {
    value: 'booking',
    userRole: '',
    passengerList: [
      {
        value: 'booking',
        icon: 'calendar',
        label: '班车预定',
        url: '/pages/booking/index'
      },
      {
        value: 'lostfound',
        icon: 'search',
        label: '失物招领',
        url: '/pages/lostfound/index'
      },
      {
        value: 'feedback',
        icon: 'chat',
        label: '我的留言',
        url: '/pages/feedback/index'
      },
      {
        value: 'profile',
        icon: 'user',
        label: '个人信息',
        url: '/pages/profile/index'
      }
    ],
    driverList: [
      {
        value: 'scan',
        icon: 'qrcode',
        label: '扫码验票',
        url: '/pages/scan-ticket/index'
      },
      {
        value: 'lostfound',
        icon: 'search',
        label: '失物招领',
        url: '/pages/lostfound/index'
      }
    ]
  },

  lifetimes: {
    attached() {
      // 获取用户角色
      const userInfo = wx.getStorageSync('userInfo');
      this.setData({
        userRole: userInfo.role || 'passenger'
      });
    }
  },

  methods: {
    onChange(e) {
      const value = e.detail.value;
      const list = this.data.userRole === 'driver' ? this.data.driverList : this.data.passengerList;
      const tabItem = list.find(item => item.value === value);
      
      wx.switchTab({
        url: tabItem.url
      });

      this.setData({
        value
      });
    }
  }
}); 