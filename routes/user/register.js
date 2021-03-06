var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var fs = require('fs-extra');
var formidable = require('formidable');
var sessioning = require('../../util/sessioning');
var dbmodule = require('../../util/dbmodule.js');
var errorControl = require('../../util/errorControl');
var errCtl = errorControl.errCtl;
var params = {};
var rootDir = __dirname.replace('/routes/user','');

router.use(function(req, res, next){
  params = sessioning.getSession(req);
  errCtl(res, next, !params.user, '/login', '로그인 페이지로 이동합니다.');
});

router.post('/', function(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if (err) {
      console.error(err);
    }
  });
  form.on('end', function(fields, files) {
    for (var i=0; i < this.openedFiles.length; i++) {
      var tempPath = this.openedFiles[i].path;
      var fileName = this.openedFiles[i].name;
      var fileExt = fileName.split(".")[fileName.split(".").length-1].toLowerCase();
      var index = fileName.indexOf('/');
      var newLoc = rootDir + '/public/faceImage/' + params.user.usrNum + '/temp/';

      var newFileName = 'temp.' + fileExt;
      console.log(tempPath, newLoc + newFileName);
      fs.copy(tempPath, newLoc + newFileName, function(err) {
        if (err) {
          console.error(err);
        } else {
          console.log(newLoc + newFileName + ' has been saved!');
          var discs = getDescriptor(newLoc, newFileName);
          if(discs > 0)
            res.redirect('/register?msg='+'등록이 완료되었습니다.');
          else
            res.redirect('/register?msg='+'얼굴이 인식되지 않았습니다. 다른 사진을 등록해주시기 바랍니다.');
        }
      });
    }
  });
});
router.get('/', function(req, res, next) {
  params.imgSrcs = getFaceImage();
  display(req, res);
});

function display(req, res){
  console.log('user : ', params.user);
  console.log('courses : ', params.courses);
  console.log('imgSrcs : ', params.imgSrcs);
  if(!params.imgSrcs){
    return;
  }
  res.render('user/register', { title: 'register', params: params});
}

function getFaceImage(){
  shell.cd(rootDir + '/public');
  var imgSrcs = shell.ls('faceImage/' + params.user.usrNum + '/*.png').stdout.split('\n');
  imgSrcs.splice(imgSrcs.length-1,1);
  return imgSrcs;
}

function getDescriptor(filePath, fileName){
  var userDir = filePath.replace('/temp','')
  var beforeImgs = shell.ls(userDir + '*.*g').stdout.split('\n');
  shell.cd(rootDir + '/../face_recognition/src/build/');
  shell.exec('./crop ' + userDir + ' ' + filePath+fileName);
  shell.rm(filePath+fileName);
  shell.cd(userDir);
  var afterImgs = shell.ls(userDir + '*.*g').stdout.split('\n');
  var detImgs = afterImgs.length - beforeImgs.length;
  afterImgs = afterImgs.filter(function(e) {
    return beforeImgs.indexOf(e) < 0;
  });
  shell.cd(rootDir + '/../caffe/build/extract_descriptor/');
  for(var i=0; i<afterImgs.length; i++){
    shell.exec('./extract_descriptor ' + userDir + ' ' + afterImgs[i]);
  }
  shell.cd(rootDir);
  return detImgs;
}

module.exports = router;
