// pages/previewWeather/previewWeather.js
const app = getApp()
var util = require('../../utils/util')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    item:{
      navH:0,
      screenHeight:0,
      icon:'/sysIcon/back.png',
      title:'预览',
      ratio:1
    },
    location:{},
    exist:false,
    selectPos:-1,
    refreshing:true
  },

  onLoad: function (options) {
    //设置导航栏数据
    this.data.item.navH=app.globalData.navHeight;
    this.data.item.ratio=750/app.globalData.screenWidth;
    this.data.item.screenHeight=app.globalData.screenHeight;
    var location=JSON.parse(options.location);
    //在这里获取主页中的城市，并判断是否已经添加到主页中
    var homePage=getCurrentPages()[0];
    this.data.selectPos=homePage.isCityExist(location);
    this.data.exist=this.data.selectPos>=0;
    this.data.location=location
    this.data.item.title=location.name;
    this.setData({
      item: this.data.item,
      exist:this.data.exist
    })
  },

  requestData(location){
    //请求天气预报数据
    util.queryForcast(location,(res)=>{
      //请求的数据
      this.setData({
        refreshing:false,
        refreshed:true,
        forcast:res
      })
    });
  },

  navTap: function () {
    wx.navigateBack();
  },

  //在预览界面将城市添加到主页去
  addCityToHome:function(){
    var homePage=getCurrentPages()[0];
    //构造数据
    if(this.data.exist&&this.data.selectPos>=0){
      homePage.setData({
        selectPos:this.data.selectPos
      });
    }else{
      homePage.setData({
        updateLocation:this.data.location
      });
    }
    wx.navigateBack({
      delta: 10,
    })
  },
  refresh: function () {//下拉刷新的逻辑
    this.requestData(this.data.location);
  },
})