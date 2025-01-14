import { IMAGE_BASE_URL } from '../../utils/config';

Page({
  data: {
    searchValue: '',
    userList: []
  },

  onLoad() {
    this.loadUserList();
  },

  // 加载用户列表
  async loadUserList() {
    try {
      const app = getApp();
      const res = await app.request.get('/api/getUsers', {
        nickname: this.data.searchValue
      });

      console.log('获取到的用户数据：', res);

      // 确保数据格式正确
      if (res && Array.isArray(res)) {
        const userList = res.map(user => ({
          ...user,
          avatar_url: user.avatar_url ? user.avatar_url : '/assets/images/default-avatar.png'
        }));
        this.setData({
          userList
        });
      }
    } catch (err) {
      console.error('加载用户列表失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 搜索框变化
  onSearchChange(e) {
    console.log('搜索关键词：', e.detail.value);
    this.setData({
      searchValue: e.detail.value
    });
    this.loadUserList();
  },

  // 选择用户
  onUserSelect(e) {
    const user = e.currentTarget.dataset.user;
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${user.id}&nickname=${user.nickname}`
    });
  }
});