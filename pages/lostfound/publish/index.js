import { IMAGE_BASE_URL } from '../../../utils/config';

Page({
  data: {
    form: {
      type: 'lost',
      title: '',
      description: '', 
      images: [],
      location: '',
      contact: ''
    },
    showLocationPicker: false,
    selectedLocationIndex: 0,
    locationOptions: []
  },

  onLoad() {
    this.getLocationOptions();
  },
  showLocationPicker() {
    this.setData({ showLocationPicker: true });
  },

  onLocationChange(e) {
    this.setData({ selectedLocationIndex: e.detail.value,
      'form.location':  this.data.locationOptions.find(item => item.value == e.detail.value).label
    });
  },

  onPickerCancel() {
    this.setData({ showLocationPicker: false });
  },

  onPickerConfirm() {
    this.setData({ showLocationPicker: false });
  },

  getLocationOptions() {
    const app = getApp();
    app.request.get('/api/locations').then(res => { 
      console.log('res==>',res);
      const options = res.map(item => ({ label: item.name, value: item.id }));
      this.setData({ locationOptions: options });
    });
  },

  onTypeChange(e) {
    this.setData({
      'form.type': e.detail.value
    });
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  async onUploadSuccess(e) {
    const { files } = e.detail;
    console.log('files==>',files);
    wx.showLoading({ title: '上传中...' });
    
    try {
      const app = getApp();
      const uploadTasks = files.map(async file => {
        if (!file.url) {
          throw new Error('无效的文件URL');
        }
        return await app.request.upload('/api/upload', file.url);
      });

      const fileUrls = await Promise.all(uploadTasks);
      const validUrls = fileUrls
        .filter(res => res && res.url && typeof res.url === 'string')
        .map(res => ({ url: res.url })); // 修改为返回包含url的对象
      
      console.log('validUrls==>', validUrls);
        
      if (validUrls.length > 0) {
        this.setData({
          'form.images': [...this.data.form.images, ...validUrls]
        });
      }
      wx.hideLoading();
    } catch (error) {
      console.error('上传图片失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  onUploadRemove(e) {
    const { index } = e.detail;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({
      'form.images': images
    });
  },

  chooseLocation() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.selectLocation();
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要获取您的地理位置，请确认授权',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.selectLocation();
        }
      }
    });
  },

  selectLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location': res.name || res.address
        });
      },
      fail: (err) => {
        console.log("selectLocation==>",err);
        wx.showToast({
          title: '选择位置失败',
          icon: 'none'
        });
      }
    });
  },

  async onSubmit() {
    const { form } = this.data;
    
    // 表单验证
    if ( !form.location) {
      return wx.showToast({
        title: '请选择地点',
        icon: 'none'
      });
    }

    wx.showLoading({ title: '发布中...' });
    
    try {
      const app = getApp();
      const submitForm = {
        ...form,
        images: form.images.map(img => img.url.replace(IMAGE_BASE_URL, ''))
      };
      await app.request.post('/api/lost-found', submitForm);

      wx.hideLoading();
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      });
    }
  }
});