'use strict';

var should = require('should');

describe('COB', function ( ) {
  var cob = require('../lib/plugins/cob')();

  var profile = {
    sens: 95
    , carbratio: 18
    , carbs_hr: 30
  };

  it('should calculate IOB, multiple treatments', function() {

    var treatments = [
      {
        "carbs": "100",
        "created_at": new Date("2015-05-29T02:03:48.827Z")
      },
      {
        "carbs": "10",
        "created_at": new Date("2015-05-29T03:45:10.670Z")
      }
    ];

    var after100 = cob.cobTotal(treatments, profile, new Date("2015-05-29T02:03:49.827Z"));
    var before10 = cob.cobTotal(treatments, profile, new Date("2015-05-29T03:45:10.670Z"));
    var after10 = cob.cobTotal(treatments, profile, new Date("2015-05-29T03:45:11.670Z"));

    console.info('>>>>after100:', after100);
    console.info('>>>>before10:', before10);
    console.info('>>>>after2nd:', after10);

    after100.cob.should.equal(100);
    Math.round(before10.cob).should.equal(59);
    Math.round(after10.cob).should.equal(69); //WTF == 128
  });

  it('should calculate IOB, single treatment', function() {

    var treatments = [
      {
        "carbs": "8",
        "created_at": new Date("2015-05-29T04:40:40.174Z")
      }
    ];

    var rightAfterCorrection = new Date("2015-05-29T04:41:40.174Z");
    var later1 = new Date("2015-05-29T05:04:40.174Z");
    var later2 = new Date("2015-05-29T05:20:00.174Z");
    var later3 = new Date("2015-05-29T05:50:00.174Z");
    var later4 = new Date("2015-05-29T06:50:00.174Z");

    var result1 = cob.cobTotal(treatments, profile, rightAfterCorrection);
    var result2 = cob.cobTotal(treatments, profile, later1);
    var result3 = cob.cobTotal(treatments, profile, later2);
    var result4 = cob.cobTotal(treatments, profile, later3);
    var result5 = cob.cobTotal(treatments, profile, later4);

    result1.cob.should.equal(8);
    result2.cob.should.equal(6);
    result3.cob.should.equal(0);
    result4.cob.should.equal(0);
    result5.cob.should.equal(0);
  });


});