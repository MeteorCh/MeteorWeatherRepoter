//index.js
//获取应用实例
var util = require('../../utils/util')
const app = getApp()
const maxCity = 8 //主页最大的城市数量，如果超过这个数量，就从第二个开始移除
Page({
  data: {
    loadingHidden:true,
    curSwiperItem: 0,
    haveDeleteCities: false, //是否有在城市管理中删除的数据
    cities: [], //用一个数组存储所有的城市
    selectPos: -1, //在城市管理页面，点击某个已有的城市，此值会非负
    updateLocation: null //用于更新定位城市，如果为空则证明没更新位置，不需要更新数据
  },
  onShow: function () {
    //更新从别的页面传过来的数据
    if (this.data.selectPos >= 0) {
      //设置swiper的当前位置
      var tmp = this.data.curSwiperItem;
      this.data.curSwiperItem = this.data.selectPos < this.data.cities.length ? this.data.selectPos : 0;
      this.setData({
        curSwiperItem: this.data.curSwiperItem
      });
      this.data.selectPos = -1;
      if (this.data.updateLocation != null) {
        this.data.cities[0].location = this.data.updateLocation;
        this.data.cities[0].weatherData = null; //清除数据以重新请求
        if (tmp == 0) { //直接定位过来不会请求数据，需要手动请求一下
          this.showLoading(0)
          this.loadWeather(this.data.cities[0].location, 0);
        }
      }
    } else if (this.data.updateLocation != null) { //给主页城市增加元素
      var city = new util.City(this.data.updateLocation.id, this.data.updateLocation, null);
      this.data.cities.push(city);
      if (this.data.cities.length > maxCity) { //主页城市数量超过最大数量，移除第二个（定位城市不能移除）
        console.log('城市个数过多，移除第二个元素')
        this.data.cities.splice(1, 1);
      }
      this.data.curSwiperItem = this.data.cities.length - 1
      //设置数据
      this.setData({
        cities: this.data.cities,
        curSwiperItem: this.data.curSwiperItem
      });
      //重新设置历史城市
      this.storeLocation();
      //请求数据
      this.showLoading(this.data.cities.length - 1);
      this.loadWeather(this.data.cities[this.data.cities.length - 1].location, this.data.cities.length - 1);
    }
    this.data.updateLocation = null;
    //处理需要删除的页面
    if (this.data.haveDeleteCities) {
      //设置数据
      this.setData({
        cities: this.data.cities,
        curSwiperItem: this.data.curSwiperItem
      });
      this.data.haveDeleteCities=false
    }
  },

  deleteCity: function (deleteCities) {
   if(deleteCities.size==0){
     return;
   }
    var res = [];
    for (var i = 0; i < this.data.cities.length; ++i) {
      if (!deleteCities.has(this.data.cities[i].id)) {
        res.push(this.data.cities[i]);
      }
    }
    this.data.cities = res;
    this.storeLocation();
    this.data.curSwiperItem = 0;
  },
  //判断一个城市是否存在
  isCityExist: function (location) {
    var res = -1;
    for (var i = 0; i < this.data.cities.length; ++i) {
      if (this.data.cities[i].id == location.id) {
        return i;
      }
    }
    return res;
  },

  storeLocation: function () {
    var selectedCity = [];
    for (var i = 1; i < this.data.cities.length; ++i) {
      selectedCity.push(this.data.cities[i].location);
    }
    wx.setStorageSync('historyLocation', selectedCity);
  },
  //加载信息
  requestData: function () {
    var that = this;
    app.getLocation().then(() => {
      //在这里当前定位已经获取到了，构建城市数组
      //首先获取位置信息
      var location = location = wx.getStorageSync('location');
      if (typeof location == 'string') {
        location = app.globalData.location;
      }
      //读取缓存中的保存的数据
      var localCity = new util.City(location.id, location, null);
      localCity.refreshing = true;
      var history = wx.getStorageSync('historyLocation');
      that.data.cities.push(localCity);
      if (typeof history == 'object' && history.length > 0) {
        history.forEach(element => {
          var selectedCity = new util.City(element.id, element, null);
          that.data.cities.push(selectedCity);
        });
      }
      //设置全部的数据
      this.data.loadingHidden=false;
      that.setData({
        cities: that.data.cities,
        loadingHidden:false
      });
    });
  },

  //获取当前天气
  loadWeather: function (location, position) {
    var that = this;
    util.queryWeatherData(location, function (weatherData) {
      that.data.cities[position].weatherData = weatherData;
      that.data.cities[position].refresh = true;
      that.data.cities[position].refreshing = false;
      var updateKey = 'cities[' + position + ']'
      //局部更新
      that.setData({
        [updateKey]: that.data.cities[position]
      });
    });
  },

  onLoad: function () {
    //用一个set来保存删除的元素
    this.data.deletedCityPos = new Set();
    //设置屏幕相关的一些配置
    this.setData({
      navH: app.globalData.navHeight,
      screenHeight: app.globalData.screenHeight
    })
    this.requestData();
  },

  //分享
  onShareAppMessage: function () {},

  showLiftInfo: function () {
    var city = this.data.cities[this.data.curSwiperItem];
    wx.navigateTo({
      url: '../lifeInfo/lifeInfo?location=' + JSON.stringify(city.location) + "&weatherData=" + JSON.stringify(city.weatherData.forcast[0])
    })
  },

  //点击搜索按钮
  navTap: function () {
    var that = this;
    var locations = []
    for (var i = 0; i < that.data.cities.length; ++i) {
      locations.push(that.data.cities[i].location);
    }
    wx.navigateTo({
      url: '../addCity/addCity?data=' + JSON.stringify(locations)
    })
  },

  itemChange: function (event) { //左右滑动导致swiper当前页改变
    var pos = event.detail.current;
    this.data.curSwiperItem = pos;
    if (typeof (this.data.cities[pos].weatherData) == "undefined" || this.data.cities[pos].weatherData == null) {
      //显示下拉框
      this.showLoading(pos)
      this.loadWeather(this.data.cities[pos].location, pos);
    }
  },
  showLoading: function (pos) {
    if (pos < 0 || pos >= this.data.cities.length) {
      return;
    }
    const setDataObj = {}
    for (var i = 0; i < this.data.cities.length; ++i) {
      if (i == pos) {
        setDataObj[`cities[${i}].refreshing`] = true
        setDataObj[`cities[${i}].refresh`] = false
      } else {
        setDataObj[`cities[${i}].refreshing`] = false
        setDataObj[`cities[${i}].refresh`] = true
      }
    }
    this.setData(setDataObj)
  },
  //下拉刷新
  refresh(e) {
    const index = e.currentTarget.dataset.index;
    this.data.cities[index].weatherData = null;
    this.loadWeather(this.data.cities[index].location, index);
  }
})