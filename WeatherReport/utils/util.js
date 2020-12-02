const KEY = '你自己的key'
const ICON = 'icon'
const NOWURL = 'https://devapi.qweather.com/v7/weather/now?key=' + KEY + '&location='
const FORECASTURL = 'https://devapi.qweather.com/v7/weather/7d?key=' + KEY + '&location='
const CITYQUERYURL = 'https://geoapi.qweather.com/v2/city/lookup?key=' + KEY + '&location='
const LIFEURL = 'https://devapi.qweather.com/v7/indices/1d?type=1,2,3,4,5,6,7,8&key=' + KEY + '&location='
const HOURQ_WEATHER_URL = 'https://devapi.qweather.com/v7/weather/24h?&key=' + KEY + '&location='
const promisify = require('./promisify');
const get_location = promisify(wx.getLocation);
const wx_request = promisify(wx.request);

function getHotCity() {
  var res= [new Location('北京',39.90498,116.40528,'中国','北京市','','101010100'),
   new Location('上海',31.23170,121.47264,'中国','上海市','','101020100'),
   new Location('广州',23.12517,113.28063,'中国','广东省','','101280101'),
   new Location('深圳',22.54700,114.08594,'中国','广东省','','101280601'),
   new Location('南京',32.04154,118.76741,'中国','江苏省','','101190101'),
   new Location('杭州',30.28745,120.15357,'中国','浙江省','','101210101'),
   new Location('成都',30.65946,104.06573,'中国','四川省','','101270101'),
   new Location('重庆',29.56376,106.55046,'中国','重庆市','','101040100'),
   new Location('武汉',30.58435,114.29856,'中国','湖北省','','101200101'),
   new Location('合肥',31.86119,117.28304,'中国','安徽省','','101220101'),
   new Location('兰州',36.05804,103.82355,'中国','甘肃省','','101160101'),
   new Location('贵阳',26.57834,106.71347,'中国','贵州省','','101260101')];
  //这里查询城市的id
  /*res.forEach((item)=>{
    var url=CITYQUERYURL + item.name
    wx_request({
      'url': url
    }).then(res=>{
      var loc=res.data.location[0];
      console.log('new Location('+"'"+item.name+"',"+loc.lat+','+loc.lon+','+"'"+loc.country+"',"
      +"'"+loc.adm1+"',"+"'',"+"'"+loc.id+"'),")
    })
  })*/
  return res;
}
//位置类
function Location(name, lat, lon, country, adm1, adm2,id) {
  this.name = name;
  this.lat = lat;
  this.lon = lon;
  this.country = country;
  this.adm1 = adm1;
  this.adm2 = adm2;
  this.id=id;
}

//城市类
function City(id,location, weatherData) {
  this.id=id;
  this.location = location;
  this.weatherData = weatherData;
  this.refresh=false;//下拉刷新的属性
  this.refreshing=false;
}

function getLocation() {
  return get_location().then(res => {
    var cityUrl = CITYQUERYURL + res.longitude + ',' + res.latitude;
    return wx_request({
      'url': cityUrl
    })
  })
}

function queryCity(keyWords) {
  var cityUrl = CITYQUERYURL + keyWords;
  return wx_request({
    'url': cityUrl
  });
}

function queryWeatherData(location, callback) {
  //请求当前天气
  var locationID = location.lon + ',' + location.lat
  var nowUrl = NOWURL + locationID; //当前天气的url
  var forecastUrl = FORECASTURL + locationID; //天气预报的URL
  var hourUrl = HOURQ_WEATHER_URL + locationID; //逐小时天气预报
  runMultiFunction([wx_request({
    'url': nowUrl
  }), wx_request({
    'url': forecastUrl
  }), wx_request({
    'url': hourUrl
  })]).then((results) => {
    var weatherData = {};
    var nowData = results[0];
    var forecastData = results[1];
    var hourData = results[2];

    //当前天气
    if (nowData.statusCode == 200) {
      weatherData['now'] = parseNowWeatherData(nowData.data);
    } else {
      showTipInfo("请求当天的天气信息出错" + nowData.statusCode, "none");
    }
    //天气预报
    if (forecastData.statusCode == 200) {
      weatherData['forcast'] = parseForecast(forecastData.data);
    } else {
      showTipInfo("请求天气预报信息出错" + nowData.statusCode, "none");
    }
    //逐小时天气
    if (hourData.statusCode == 200) {
      weatherData['hour'] = parseHourWeather(hourData.data.hourly);
    }
    //进行最后的回调
    if (typeof callback == "function") {
      callback(weatherData);
    }
  }).catch((err) => {
    console.log(err);
    showTipInfo("请求天气信息出错" + err, "none");
  });
}

//请求天气预报
function queryForcast(location, callback) {
  var forecastUrl = FORECASTURL + location.lon + ',' + location.lat; //天气预报的URL
  wx_request({
    'url': forecastUrl
  }).then((forecastData) => {
    if (forecastData.statusCode == 200) {
      var res = parseForecast(forecastData.data);
      //进行最后的回调
      if (typeof callback == "function") {
        callback(res);
      }
    } else {
      showTipInfo("请求天气预报信息出错" + nowData.statusCode, "none");
    }
  }).catch((err) => {
    console.log(err);
    showTipInfo("请求天气信息出错" + err, "none");
  });
}

function parseHourWeather(data) {
  for (var i in data) {
    data[i].fxTime = getTime(data[i].fxTime);
    data[i].icon = '/weatherIcon/' + data[i].icon + '.png';
  }
  return data;
}

function getTime(timeStr) {
  var data = new Date(timeStr);
  return data.getHours() + ":" + "00";
}

function queryLifeInfo(location, callback) {
  var lifeInfoUrl = LIFEURL + location.lon + ',' + location.lat; //当前天气的url
  return wx_request({
    'url': lifeInfoUrl
  })
}

//解析当天的数据
function parseNowWeatherData(data) {
  //拼接天气图标
  data.now[ICON] = '/weatherIcon/' + data.now[ICON] + '.png';
  return data.now;
}

function parseForecast(data) {
  for (var i in data.daily) {
    //处理天气图标
    data.daily[i]['iconDay'] = '/weatherIcon/' + data.daily[i]['iconDay'] + '.png';
    data.daily[i]['iconNight'] = '/weatherIcon/' + data.daily[i]['iconNight'] + '.png';
    //处理日期
    data.daily[i]['date'] = shortDate(data.daily[i]['fxDate']);
    data.daily[i]['weekDay'] = getWeekDay(data.daily[i]['fxDate']);
  }
  return data.daily;
}

function shortDate(str) {
  var date = new Date(Date.parse(str));
  var now = new Date();
  var result = (date.getMonth() + 1) + "/" + date.getDate();
  if (now.getDate() == date.getDate()) {
    result = "今天";
  }
  return result;
}

function getWeekDay(str) {
  var date = new Date(Date.parse(str));
  return "周" + "日一二三四五六".charAt(date.getDay());
}

function showTipInfo(title, icon, callback) {
  wx.showToast({
    title: title,
    icon: icon,
    complete: function () {
      if (callback && typeof callback === "function") {
        callback();
      }
    }
  });
}

function runMultiFunction(functions) {
  return Promise.all(functions);
}

module.exports = {
  queryWeatherData: queryWeatherData,
  getLocation: getLocation,
  showTipInfo: showTipInfo,
  runMultiFunction: runMultiFunction,
  queryLifeInfo: queryLifeInfo,
  getHotCity: getHotCity,
  queryCity: queryCity,
  City: City,
  queryForcast: queryForcast
}