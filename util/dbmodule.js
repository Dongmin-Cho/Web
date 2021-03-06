var util = require('util');
var fs = require('fs');

var xml_digester = require("xml-digester");
var digester = xml_digester.XmlDigester({});
var mysql = require('mysql');

var dbconfig   = require('../config/database.js');
var db = mysql.createConnection(dbconfig);
var EventEmitter = require('events').EventEmitter;

fs.readFile('./query/query.xml','utf8', function(error, data) {
  if (error) {
    console.log(error);
  } else {
    digester.digest(data, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        global.doLogin_query = result.query.doLogin;
        global.getStuInfo_query = result.query.getStuInfo;
        global.getProInfo_query = result.query.getProInfo;
        global.getAdminInfo_query = result.query.getAdminInfo;
        global.getSchedule_query = result.query.getSchedule;
        global.getStuAttend_query = result.query.getStuAttend;
        global.getUsersInfo_query = result.query.getUsersInfo;
        global.doAttend_query = result.query.doAttend;
        global.getAttendTimeAll_query = result.query.getAttendTimeAll;
        global.getCourseStuAll_query = result.query.getCourseStuAll;
        global.getAttendStatistic_query = result.query.getAttendStatistic;
      }
    });
  }
});

function doLogin(req, res){
  var id = req.body.id;
  var pw = req.body.pw;
  var query = util.format( global.doLogin_query , id, pw);
  console.log(query);
  db.query(query, function (error, result, field) {
    if (error) {
      res.writeHead(500).res.end();
    }
    else {
      if(result[0] && result[0].usr_num){
        var evt = getUserInfo(result[0].usr_num, result[0].auth_type);
        evt.on('err', function(error){
          console.log(error);
          res.writeHead(500);
          res.end();
          return false;
        });
        evt.on('end', function(error, datas){
          if (error) res.writeHead(500).end();
          req.session.user = datas.user;
          req.session.courses = datas.courses;
          res.redirect('/');
        });
      }
      else {
        res.render('login', { title: 'Login', state: 'wrong' });
      }
    }
  });
}

function doAttend(datas){
  var stuNumStr = "";
  for(var i=0; i<datas.usrNums.length; i++){
    if(i != 0)
      stuNumStr += ',';
    stuNumStr += datas.usrNums[i];
  }

  var query = util.format(global.doAttend_query ,
                          datas.order-1,
                          datas.order,
                          datas.order-1,
                          datas.order,
                          datas.couNum,
                          stuNumStr,
                          datas.order,
                          datas.time,
                          datas.couNum,
                          stuNumStr,
                          datas.order,
                          datas.time
                          );
  console.log(query);
  db.query(query, function (error, result, field) {
    if (error) {
      console.log(error);
    }
    else {
      console.log('-0=0-=98790-=9-87657890-80765457890-' + result);
      console.log('-0=0-=98790-=9-87657890-80765457890-' + result[0]);
    }
  });
}

function getUserInfo(usrNum, authType){
  var evt = new EventEmitter();
  var targetQuery;
  if(authType == 1) targetQuery = global.getStuInfo_query;
  else if(authType == 2) targetQuery = global.getProInfo_query;
  else if(authType == 3) targetQuery = global.getAdminInfo_query;
  var query = util.format(targetQuery, usrNum);
  console.log(query);
  db.query(query, function (error, result, field) {
    var datas = {user: {}, courses: []};
    if(!error){
      datas.user.usrNum = result[0].usr_num;
      datas.user.name = result[0].name;
      datas.user.authType = result[0].auth_type;
      for(var i=0; i<result.length; i++){
        datas.courses.push({
          couNum: result[i].cou_num,
          couName: result[i].cou_name,
          proName: result[i].pro_name
        });
      }
    }
    evt.emit('end', error, datas);
  });
  return evt;
}

function getSchedule(usrNum){
  var query = util.format( global.getSchedule_query , usrNum);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var schedules = [];
    for(var i=0; i<result.length; i++){
      var schedule = {
        couNum: result[i].cou_num,
        weekday: result[i].weekday,
        name: result[i].name,
        couName: result[i].cou_name,
        place: result[i].place,
        startTime: result[i].start_time,
        duringTime: result[i].during_time
      }
      schedules.push(schedule);
    }
    evt.emit('end', error, schedules);
  });
  return evt;
}

function getStuAttend(usrNum, couNum){
  var query = util.format( global.getStuAttend_query , usrNum, couNum);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var attends = [];
    for(var i=0; i<result.length; i++){
      var attend = {
        couName: result[i].cou_name,
        stuNum: result[i].stu_num,
        date: result[i].date,
        order: result[i].order,
        attCnt: result[i].att_cnt
      }
      attends.push(attend);
    }
    evt.emit('end', error, attends);
  });
  return evt;
}
function getUsersInfo(usrNums){
  var usrNumStr = '';
  for(var i=0; i<usrNums.length; i++){
    if(i != 0)
      usrNumStr += ',';
    usrNumStr += usrNums[i];
  }
  var query = util.format( global.getUsersInfo_query , usrNumStr);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var users = [];
    for(var i=0; i<result.length; i++){
      var user = {
        usrNum: result[i].usr_num,
        id: result[i].id,
        name: result[i].name
      }
      users.push(user);
    }
    evt.emit('end', error, users);
  });
  return evt;
}

function getAttendTimeAll(usrNum){
  var weekdayData = ['','월','화','수','목','금','토','일'];
  var query = util.format( global.getAttendTimeAll_query , usrNum);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var timeDatas = [];
    for(var i=0; i<result.length; i++){
      var weekdayIdx = result[i].time_string[result[i].time_string.indexOf('(')+1];
      var timeData = {
        couNum:  result[i].cou_num,
        order:  result[i].order,
        time:  result[i].time,
        timeString:  result[i].time_string.replace('('+weekdayIdx+')', '('+weekdayData[weekdayIdx]+')')
      }
      timeDatas.push(timeData);
    }
    evt.emit('end', error, timeDatas);
  });
  return evt;
}

function getCourseStuAll(courseNum){
  var query = util.format( global.getCourseStuAll_query, courseNum);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var stuNums = [];
    for(var i=0; i<result.length; i++){
      stuNums.push(result[i].usr_num);
    }
    evt.emit('end', error, stuNums)
  });
  return evt;
}
function getAttendStatistic(usrNum){
  var query = util.format( global.getAttendStatistic_query, usrNum);
  console.log(query);
  var evt = new EventEmitter();
  db.query(query, function (error, result, field) {
    var attendStats = [];
    for(var i=0; i<result.length; i++){
      var attendStat = {
        couNum:  result[i].cou_num,
        couName:  result[i].cou_name,
        attCnt:  result[i].att_cnt,
        latCnt:  result[i].lat_cnt,
        absCnt:  result[i].abs_cnt
      }
      attendStats.push(attendStat);
    }
    evt.emit('end', error, attendStats)
  });
  return evt;
}

exports.doLogin = doLogin;
exports.getSchedule = getSchedule;
exports.getStuAttend = getStuAttend;
exports.doAttend = doAttend;
exports.getUsersInfo = getUsersInfo;
exports.getAttendTimeAll = getAttendTimeAll;
exports.getCourseStuAll = getCourseStuAll;
exports.getAttendStatistic = getAttendStatistic;
