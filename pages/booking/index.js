Page({
  data: {
    routes: [],
    current: 1,
    pageSize: 10000,
    total: 0,
    loading: false,
    showPopup: false,
    selectedMonth: '1',
    totalPrice: 0,
    dateOptions: [], // 可选择的日期列表
    selectedDateIndex: 0,
    selectedDates: [],
    pricePerDay: 0,  // 单日价格
    dateVisible: false,
    selectedRoute: null, // 添加选中路线数据
    datesInMonth: [],
    showDeparturePopup: false, // 新增：控制出发时间弹窗的显示
    tripType: '单程', // 新增：行程类型，默认为单程
    tripTypeOptions: [
      {
        value: '单程',
        label: '单程'
      },
      {
        value: '往返',
        label: '往返'
      }
    ],
    selectedTripTypeIndex: 0, // 新增：默认选择的行程类型索引
    showTripTypePicker: false, // 新增：控制行程类型选择器的显示
  },

  onLoad() {
    this.loadRoutes()
  },

  // 加载路线
  showTripTypePicker() {
    this.setData({ showTripTypePicker: true,
      showPopup: false
     })
  },
  async loadRoutes() {
    try {
      this.setData({ loading: true })
      const app = getApp()
      const result = await app.request.get('/api/bus-schedules', {
        current: this.data.current,
        pageSize: this.data.pageSize,
        status: 'active'
      })
      
      this.setData({
        routes: result.data.list.map(item => ({
          id: item.id,
          name: item.route_name,
          stops: item.stops,
          departureTime: item.departure_time,
          serviceDates: item.service_dates,
          dailyPrice: item.daily_price,
          status: item.status,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        total: result.data.total
      })
    } catch (error) {
      wx.showToast({
        title: '获取路线失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  goToBooking(e) {
    const routeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/booking-detail/index?id=${routeId}`
    })
  },

  // 显示预约弹窗
  showBookingPopup(e) {
    const routeId = e.currentTarget.dataset.id;
    const route = this.data.routes.find(r => r.id === routeId);
    
    // 处理服务日期
    const serviceDates = route.serviceDates || [];
    const monthOptions = [...new Set(serviceDates.map(date => date.substring(0, 7)))]; // 提取年月 YYYY-MM

    this.setData({ 
      showPopup: true,
      selectedRoute: route,
      pricePerDay: route.dailyPrice,
      start: monthOptions[0],
      end: monthOptions[monthOptions.length - 1],
      selectedDates: [], // 重置已选日期
      totalPrice: 0, // 重置总价
      datesInMonth: [], // 重置月份日期
      tripType: '单程', // 重置行程类型
      selectedTripTypeIndex: 0, // 重置行程类型索引
    });
  },

  // 关弹窗
  closePopup() {
    this.setData({ showPopup: false });
  },

  // 弹窗显示状态变化
  onVisibleChange(e) {
    this.setData({ showPopup: e.detail.visible });
  },

  // 月份选择变化
  onMonthChange(e) {
    const months = parseInt(e.detail.value);
    this.setData({
      selectedMonth: e.detail.value,
    },() => {
      this.setData({
        totalPrice: this.calculatePrice()
      })
    });
  },

  // 计算价格
  calculatePrice() {
    const monthlyPrice = this.data.pricePerDay
    const days = this.data.datesInMonth.length
    console.log('days', days)
    let totalPrice = monthlyPrice * days;


    // 根据行程类型调整价格
    if (this.data.tripType === '单程') {
      totalPrice /= 2; // 单程价格减半
    }

    return totalPrice;
  },

  // 处理预约
  async handleBooking() {
    try {
      wx.showLoading({ title: '正在创建订单...' });
      
      // 1. 先创建订单
      const app = getApp();
      const orderResult = await app.request.post('/api/orders', {
        routeId: this.data.selectedRoute.id,
        dates: this.data.datesInMonth,
        totalAmount: this.data.totalPrice,
        tripType: this.data.tripType
      });


      // 2. 调起微信支付
      await new Promise((resolve, reject) => {
        wx.requestPayment({
          ...orderResult.data, // 后端返回的支付参数
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      // 4. 支付成功处理
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });
      this.closePopup();

    } catch (error) {
      console.error('支付失败', error);
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理日期选择
  onConfirm(e) {
    console.log('onConfirm', e)
    const { value } = e.detail;
    const selectedMonth = value.substring(0, 7); // YYYY-MM
    
    
    // 获取月份的中文表示
    const date = new Date(selectedMonth);
    const monthDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    
    //如果已经有了，则不添加
    if (this.data.selectedDates.includes(monthDisplay)) {
      this.setData({
        dateVisible: false,
        showPopup: true
      })
      return;
    }
    // 从 serviceDates 中筛选出选中月份的所有日期
    const datesInMonth = this.data.selectedRoute.serviceDates.filter(date => 
      date.startsWith(selectedMonth)
    );

    this.setData({
      selectedDates: [...this.data.selectedDates, monthDisplay], 
      dateVisible: false,
      showPopup: true,
      datesInMonth: this.data.datesInMonth.concat(datesInMonth),
    },() => {
      this.setData({
        totalPrice: this.calculatePrice()
      })
    });
  },

  stopPropagation(e) {
    // e.stopPropagation();
    return false;
  },
  // 删除已选日期
  removeDate(e) {
    const index = e.currentTarget.dataset.index;
    console.log('index', index)
    const dates = [...this.data.selectedDates];
    dates.splice(index, 1);
    console.log('dates', dates)
    console.log('datesInMonth', this.data.datesInMonth)
    this.setData({
      selectedDates: dates,
      datesInMonth: this.data.datesInMonth.filter(date => {
        const dateObj = new Date(date);
        const monthDisplay = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月`;
        return dates.includes(monthDisplay);
      })
    },() => {
      this.setData({
        totalPrice: this.calculatePrice()
      })
    });
    return false;
  },

  showDatePicker() {
    this.setData({
      dateVisible: true,
      showPopup: false  // 显示日期选择器时隐藏底部弹出层
    });
  },
  closePopup() {
    this.setData({ showPopup: false });
  },
  confirmDate() {
    this.setData({ showPopup: false });
  },
  hidePicker() {
    this.setData({
      dateVisible: false,
      showPopup: true
    });
  },

  // 显示出发时间弹窗
  showDepartureTimes(e) {
    const routeId = e.currentTarget.dataset.id
    const route = this.data.routes.find(r => r.id === routeId);
    this.setData({ showDeparturePopup: true, departureTimes: route.departureTime });
  },

  // 关闭出发时间弹窗
  closeDeparturePopup() {
    this.setData({ showDeparturePopup: false });
  },

  // 出发时间弹窗状态变化
  onDeparturePopupChange(e) {
    this.setData({ showDeparturePopup: e.detail.visible });
  },

  // 处理行程类型选择
  onTripTypeChange(e) {
    const index = e.detail.value[0]; // 获取选择的行程类型索引
    console.log('index', index)
    this.setData({
      selectedTripTypeIndex: index,
      tripType: this.data.tripTypeOptions.find(item => item.value === index).label,
      
    },() => {
      this.setData({
        totalPrice: this.calculatePrice(),
        showPopup: true
      })
    })
  },
  onPickerConfirm(e) {
    console.log('onPickerConfirm', e)
    this.setData({
      showTripTypePicker: false,
      showPopup: true
    })
  },
  onPickerCancel() {
    this.setData({
      showTripTypePicker: false,
      showPopup: true
    })
  }
})

