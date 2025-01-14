Page({
  data: {
    orders: [],
    showPayPopup: false,
    showRefundPopup: false,
    currentOrder: null,
    loading: false,
    statusMap: {
      0: { text: '待支付', color: 'blue' },
      1: { text: '已支付', color: 'green' },
      2: { text: '已取消', color: 'red' },
      3: { text: '已退款', color: 'orange' },
      4: { text: '退款申请中', color: 'purple' }
    }
  },

  onLoad() {
    this.getOrders()
  },

  // 获取订单列表
  async getOrders() {
    try {
      this.setData({ loading: true })
      const app = getApp()
      const result = await app.request.get('/api/orders', {
        userId: wx.getStorageSync('userId')
      })
      
      if (result.data) {
        this.setData({
          orders: result.data.list.map(item => ({
            id: item.id,
            orderNo: item.order_no,
            routeName: item.route_name,
            totalAmount: item.total_amount,
            status: item.status,
            createdAt: item.created_at,
            selectedDates: item.selected_dates
          }))
        })
      }
    } catch (error) {
      wx.showToast({
        title: '获取订单失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 处理订单点击
  handleOrderClick(e) {
    const order = e.currentTarget.dataset.order
    // 根据不同状态显示不同操作
    switch(order.status) {
      case 0: // 待支付
        this.setData({
          showPayPopup: true,
          currentOrder: order
        })
        break
      case 1: // 已支付，可以申请退款
        this.setData({
          showRefundPopup: true,
          currentOrder: order
        })
        break
      default:
        // 其他状态只展示详情
        this.showOrderDetail(order)
        break
    }
  },

  showOrderDetail(order) {
    wx.showModal({
      title: '订单详情',
      content: `订单号：${order.orderNo}\n金额：¥${order.totalAmount}\n状态：${this.data.statusMap[order.status].text}\n创建时间：${order.createdAt}`,
      showCancel: false
    })
  },

  // 支付弹出层控制
  onPayPopupChange(e) {
    this.setData({ showPayPopup: e.detail.visible })
  },

  // 退款弹出层控制
  onRefundPopupChange(e) {
    this.setData({ showRefundPopup: e.detail.visible })
  },

  // 处理支付
  async handlePay() {
    const { currentOrder } = this.data
    try {
      wx.showLoading({ title: '正在支付...' })
      const app = getApp()
      
      // 1. 调用支付接口
      const payResult = await app.request.post(`/api/payment/${currentOrder.id}`)

      // 2. 调起微信支付
      await new Promise((resolve, reject) => {
        wx.requestPayment({
          ...payResult.data,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        })
      })

      // 3. 支付成功处理
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      })
      this.setData({ showPayPopup: false })
      this.getOrders() // 刷新订单列表

    } catch (error) {
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 处理退款
  async handleRefund() {
    const { currentOrder } = this.data
    try {
      wx.showLoading({ title: '提交退款申请...' })
      const app = getApp()
      
      // 计算退款金额和天数信息
      const refundData = {
        refundAmount: currentOrder.totalAmount, // 这里可以根据实际业务逻辑计算退款金额
        usedDays: this.calculateUsedDays(currentOrder.selectedDates), // 计算已使用天数
        remainingDays: this.calculateRemainingDays(currentOrder.selectedDates) // 计算剩余天数
      }
      
      const result = await app.request.post(`/api/refund-request/${currentOrder.id}`, refundData)
      
      if (result.success) {
        wx.showToast({
          title: '退款申请已提交',
          icon: 'success'
        })
        this.setData({ showRefundPopup: false })
        this.getOrders() // 刷新订单列表
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '退款申请失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 计算已使用天数
  calculateUsedDays(selectedDates) {
    // 根据实际业务逻辑计算已使用天数
    const today = new Date()
    const dates = selectedDates.filter(date => new Date(date) <= today)
    return dates.length
  },

  // 计算剩余天数
  calculateRemainingDays(selectedDates) {
    // 根据实际业务逻辑计算剩余天数
    const today = new Date()
    const dates = selectedDates.filter(date => new Date(date) > today)
    return dates.length
  }
}) 