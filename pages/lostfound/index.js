import { getImageUrl,IMAGE_BASE_URL } from '../../utils/config'

Page({
  data: {
    tabValue: '1',
    items: [],
    isAdmin: false,
    current: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    searchValue: '',
    refreshing: false,
  },

  onLoad() {
    this.checkAdminRole();
    this.getItems();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'lostfound' });
    }
  },

  // 检查是否为管理员
  async checkAdminRole() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      isAdmin: userInfo.role == 'admin' || userInfo.role == 'driver'
    });
  },

  // 获取失物招领列表
  async getItems() {
    try {
      this.setData({ loading: true });
      const app = getApp();
      const result = await app.request.get('/api/lost-found', {
        current: this.data.current,
        pageSize: this.data.pageSize,
        type: this.getTypeByTab(),
        keyword: this.data.searchValue
      });

      const newItems = result.data.list.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        images: item.images.map(img =>  img),
        location: item.location,
        contact: item.contact,
        status: item.status,
        userName: item.user_name,
        userAvatar: item.user_avatar ?  item.user_avatar : '/assets/images/default-avatar.png',
        createdAt: item.created_at
      }));

      this.setData({
        items: this.data.current === 1 ? newItems : [...this.data.items, ...newItems],
        total: result.data.total
      });
    } catch (error) {
      wx.showToast({
        title: '获取列表失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 根据tab获取类型
  getTypeByTab() {
    switch (this.data.tabValue) {
      case '1':
        return 'lost';
      case '2':
        return 'found';
      default:
        return '';
    }
  },

  // 切换标签
  onTabChange(e) {
    this.setData({
      tabValue: e.detail.value,
      current: 1
    }, () => {
      this.getItems();
    });
  },

  // 搜索
  onSearch(e) {
    this.setData({
      searchValue: e.detail.value,
      current: 1
    }, () => {
      this.getItems();
    });
  },

  // 查看详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/lostfound/detail?id=${id}`
    });
  },

  // 发布新帖
  goToPublish() {
    console.log('goToPublish');
    wx.navigateTo({
      url: '/pages/lostfound/publish/index'
    });
  },

  // 加载更多
  onLoadMore() {
    if (this.data.loading) return;
    if (this.data.items.length >= this.data.total) {
      wx.showToast({
        title: '没有更多数据了',
        icon: 'none'
      });
      return;
    }

    this.setData({
      current: this.data.current + 1
    }, () => {
      this.getItems();
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      refreshing: true,
      current: 1
    });
    
    this.getItems().then(() => {
      this.setData({ refreshing: false });
    }).catch(() => {
      this.setData({ refreshing: false });
    });
  }
}); 