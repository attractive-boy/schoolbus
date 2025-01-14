import { BASE_URL } from './config'

// 请求拦截器
const requestInterceptor = (config) => {
  // 获取token
  const token = wx.getStorageSync('token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  return config
}

// 响应拦截器
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  if (statusCode >= 200 && statusCode < 300) {
    return data
  } else if (statusCode === 401) {
    // token过期,清除本地存储并跳转到登录页
    wx.removeStorageSync('token')
    wx.redirectTo({
      url: '/pages/login/index'
    })
    const error = new Error('登录已过期,请重新登录')
    error.response = response
    throw error
  } else {
    const error = new Error(data.message || '请求失败')
    error.response = response
    throw error
  }
}

// 统一请求方法
const request = (options) => {
  const config = requestInterceptor(options)
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header: config.header || {},
      success: (res) => {
        try {
          resolve(responseInterceptor(res))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

// 文件上传方法
const uploadFile = (options) => {
  const config = requestInterceptor(options)
  
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}${config.url}`,
      filePath: config.filePath,
      name: config.name || 'file',
      header: config.header || {},
      formData: config.formData || {},
      success: (res) => {
        try {
          // 上传接口返回的是字符串，需要转换成对象
          const data = JSON.parse(res.data)
          resolve(responseInterceptor({ statusCode: res.statusCode, data }))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

// 导出封装的方法
export default {
  // GET请求
  get(url, data = {}, options = {}) {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    })
  },
  
  // POST请求
  post(url, data = {}, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    })
  },
  
  // PUT请求
  put(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  },
  
  // DELETE请求
  delete(url, data = {}, options = {}) {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  },
  
  // 文件上传
  upload(url, filePath, options = {}) {
    return uploadFile({
      url,
      filePath,
      ...options
    })
  }
} 