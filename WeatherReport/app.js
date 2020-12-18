const util = require("./utils/util");
//app.js
App({
  onShow:function(){
     //获取手机系统信息
     var that=this
     wx.getSystemInfo({
       success:(res) => {
         //屏幕高度
         that.globalData.screenHeight=res.windowHeight;
         that.globalData.screenWidth=res.windowWidth;
         //导航高度
         that.globalData.navHeight = res.statusBarHeight + 46;
       }, fail(err) {
         console.log(err);
         that.globalData.navHeight=66;
       }
     })
  },
  //获取定位信息
  getLocation: function () {
    var that = this;
    return util.getLocation().then(((res)=>{
      //将查询得到的数据存储
      if(res.statusCode!=200||res.data.location.length<1){
        that.errLocation();
        return;
      }
      var {id,name, lat, lon,country,adm1,adm2} = res.data.location[0];
      var location = {id,name, lat, lon,country,adm1,adm2};
      wx.setStorageSync('location', location);
    })).catch((err)=>{
      that.errLocation();
    });
  },

  errLocation:function() {
    console.log('定位出错')
    var that=this;
    util.showTipInfo("定位失败，将展示北京的天气","none",()=>{
      wx.setStorageSync('location',that.globalData.location);
    });
  },
  globalData: {
    location: {
      name: '北京',
      lat: 39.90498,
      lon: 116.40528,
      country:'中国',
      adm1:'北京市',
      adm2:'',
      id:'101010100'
    },
    navHeight:0,
    screenHeight:0,
    screenWidth:0
  }
})