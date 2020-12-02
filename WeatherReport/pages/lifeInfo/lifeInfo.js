const util = require("../../utils/util");

// pages/lifeInfo/lifeInfo.js
const daily=["保持热爱，奔赴山海","生活明朗，万物可爱","但行好事，莫问前程","眼里有光，心里有爱","世间美好，与你环环相扣","等风来，不如追风去","心之所向，素履以往"]
const app=getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    location:{},
    refreshing:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      navH: app.globalData.navHeight,
      screenHeight:app.globalData.screenHeight
    })
    var location=JSON.parse(options.location);
    this.data.location=location;
    var weatherData=JSON.parse(options.weatherData);
    this.setNowInfo(location,weatherData);
  },

  setNowInfo:function(location,weatherData){
    //转化一下时间
    var date=new Date();
    weatherData['dateStr']=date.getFullYear()+"年"+(date.getMonth()+1)+"月"+date.getDate()+"日";
    weatherData['weekDay']="周"+"日一二三四五六".charAt(date.getDay());
    //设置当天的数据
    var tip=daily[Math.floor(Math.random()*daily.length)];
    this.setData({
      'location':location,
      'weatherData':weatherData,
      'tip':tip
    });
  },
  requestData:function(cityId){
    //请求数据
    var that=this;
    util.queryLifeInfo(cityId).then((res)=>{
      //取消加载的圆圈
      this.setData({
        refreshing:false,
        refreshed:true
      })
      if(res.statusCode!=200||res.data.daily.length==0){
        util.showTipInfo("请求生活指数信息出错"+nowData.statusCode,"none");
        return;
      }
      //处理数据
      var data=res.data.daily;
      that.dealLifeInfo(data);
      that.setData({
        'lifeInfo':data
      });
      //缓存
      wx.setStorage({
        data: data,
        key: 'lifeInfo',
      })
    }).catch((err)=>{
      this.setData({
        refreshing:false,
        refreshed:true
      })
      util.showTipInfo("请求生活指数信息出错"+err,"none");
    });
  },

  dealLifeInfo:function(data){
    //对数组按照type进行排序
    data.sort((a,b)=>{
      return parseInt(a.type)-parseInt(b.type);
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  refresh: function () {
    this.requestData(this.data.location);
  },
  navTap:function(){
    wx.navigateBack({
      delta: 200,
    })
  }
})