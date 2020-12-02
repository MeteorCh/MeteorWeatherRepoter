// pages/addCity/addCity.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cities: [],
    deletedCity: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('当前的城市列表为', options.data)
    this.data.deletedCity=new Set()
    this.data.cities = JSON.parse(options.data);
    this.setData({
      navH: app.globalData.navHeight,
      slideButtons: [{
        type: 'warn',
        text: '删除'
      }],
      historyLocation: this.data.cities
    })
  },
  citySelect: function (event) {
    //选择当前城市后，跳转到当前的城市
    var pos = event.currentTarget.dataset.status;
    var homePage = getCurrentPages()[0];
    homePage.setData({
      selectPos: pos
    });
    wx.navigateBack({
      delta: 10,
    })
  },

  navTap: function () {
    wx.navigateBack();
  },
  slideButtonTap(event) {
    //删除城市后，更新UI和数据
    var pos = event.currentTarget.dataset.status;
    var cityID = this.data.cities[pos].id;
    this.data.cities.splice(pos, 1);
    this.setData({
      historyLocation: this.data.cities
    });
    this.data.deletedCity.add(cityID);
  },
  searchCity() { //点击搜索按钮跳转到选择城市页面
    wx.navigateTo({
      url: '../citySelect/citySelect?'
    })
  },
  onUnload: function () { //在页面消失的时候，去同步主页中的城市
    this.dealDelete();
  },

  onHide:function(){
    this.dealDelete();
  },
  dealDelete:function(){
    if (this.data.deletedCity.size == 0) {
      return;
    }
    var homePage = getCurrentPages()[0];
    homePage.deleteCity(this.data.deletedCity);
    homePage.data.haveDeleteCities=true;
    this.data.deletedCity.clear();
  }
})