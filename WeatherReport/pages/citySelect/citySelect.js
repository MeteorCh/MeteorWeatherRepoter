// pages/citySelect/citySelect.js
const app = getApp()
var util = require('../../utils/util')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    hotCity: [],
    show: false,
    searchRes:[],
    searchResHeight:400
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      navH: app.globalData.navHeight
    })
    //设置热门城市
    this.data.hotCity = util.getHotCity();
    this.setData({
      'hotCity': this.data.hotCity
    });
  },

  navTap: function () {
    wx.navigateBack();
  },
  startSearch: function (event) {
    var that = this
    var inputVal = event.detail.value;
    wx.showLoading({
      title: 'Loading...',
    })
    util.queryCity(inputVal).then((res) => {
      wx.hideLoading();
      if(res.statusCode!=200||res.data.code!=200||res.data.location.length<1){
        util.showTipInfo("查询城市出错或结果为空", 'none');
        return;
      }else{
        that.data.searchRes=that.dealSearchCityRes(res.data.location)
      }
      that.showContent();
    }).catch((err) => {
      wx.hideLoading();
      console.log('查询城市出错',err);
      util.showTipInfo("查询城市出错：" + err, 'none');
    })
  },

  dealSearchCityRes:function(data){
    var res=[]
    for(var i in data){
      var {id,name, lat, lon,adm1,adm2,country} = data[i];
      var item = {id,name, lat, lon,adm1,adm2,country};
      res.push(item)
    }
    return res;
  },

  //热门城市被点击
  onHotCitySel: function (event) {
    var location = this.data.hotCity[event.currentTarget.dataset.status];
    this.previewWeather(location);
  },

  previewWeather:function(location){
    wx.navigateTo({
      url: '/pages/previewWeather/previewWeather?location='+JSON.stringify(location)
    })
  },

  showContent() {
    this.data.searchResHeight=Math.min((app.globalData.screenHeight * (750 / app.globalData.screenWidth))/2,(this.data.searchRes.length+1)*130);
    if(this.data.searchRes.length==0){
      util.showTipInfo("查询结果为空，请检查关键字是否正确",'none')
      return;
    }
    this.setData({
      show: true,
      searchResHeight:this.data.searchResHeight,
      searchRes:this.data.searchRes
    })
  },
  close() {
    this.setData({
      show: false
    })
  },

  selectSearchCity:function(event){
    var location = this.data.searchRes[event.currentTarget.dataset.status];
    this.previewWeather(location);
  },
  //选择当前位置
  selectCurLocation:function(){
    var that=this
    //请求位置
    util.getLocation().then(((res)=>{
      //将查询得到的数据存储
      if(res.statusCode!=200||res.data.location.length<1){
        that.errLocation();
        return;
      }
      var {id,name, lat, lon,country,adm1,adm2} = res.data.location[0];
      var location = {id,name, lat, lon,country,adm1,adm2};
      wx.setStorageSync('location', location);
      var homePage = getCurrentPages()[0];
      homePage.setData({
        selectPos:0,
        updateLocation: location
      })
      wx.navigateBack({
        delta: 10,
      })
    })).catch((err)=>{
      console.log("搜索城市界面点击当前页面报错",err)
    });
  }
})