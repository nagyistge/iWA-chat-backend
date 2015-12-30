'use strict';

var settings = require('../../../settings.js');
var should = require('should');
var uObjs = require(settings.libsPath + '/iwazat/util/objects');

describe('libs/util/objects', function () {

	describe('get Object Property Value in dot notation', function () {

		it('should return the value of the array position 3 under aSubObj.anArray', function () {

			var obj = {
				aString: 'heloo world',
				aSubObj: {
					anArray: ['one', 'two', 'three']
				}
			};

			'three'.should.equal(uObjs.getObjectPropValue(obj, 'aSubObj.anArray.2'));
		});

	});

	describe('flatten object', function () {

		it('but not including arrays properties', function () {

			var originalObj = {
				aString: 'string',
				aNumber: 0,
				aBoolean: true,
				aArray: [10, 20],
				subObj: {
					aString: 'String1',
					aNumber: 1,
					subObj: {
						aString: 'String2',
						aNumber: 2
					}
				}
			};

			var flattenedObj = uObjs.flatten(originalObj);

			flattenedObj.aArray.should.eql(originalObj.aArray);
			flattenedObj.should.have.property('subObj.aString', 'String1');
			flattenedObj.should.have.property('subObj.subObj.aNumber', 2);

		});

		it('including array properties', function () {

			var originalObj = {
				aString: 'string',
				aNumber: 0,
				aBoolean: true,
				aArray: [10, 20],
				subObj: {
					aString: 'String1',
					aNumber: 1,
					subObj: {
						aString: 'String2',
						aNumber: 2
					}
				}
			};

			var flattenedObj = uObjs.flatten(originalObj, {flattenArrays: true});

			flattenedObj.should.have.property('aArray.0', 10);
			flattenedObj.should.have.property('aArray.1', 20);
			flattenedObj.should.have.property('subObj.aString', 'String1');
			flattenedObj.should.have.property('subObj.subObj.aNumber', 2);

		});

		it('flattened object return the an equal flattened object', function () {

			var originalObj = {
				aString: 'string',
				aNumber: 0,
				aBoolean: true,
				aArray: ['ele1', 'ele2']
			};

			var flattenedObj = uObjs.flatten(originalObj);

			originalObj.should.eql(flattenedObj);
			originalObj.should.not.equal(flattenedObj);

		});

		it('object but with property arrays', function () {

			var originalObj = {
				aString: 'string',
				aNumber: 0,
				aBoolean: true,
				aArray: ['ele1', 'ele2']
			};

			var flattenedObj = uObjs.flatten(originalObj, {flattenArrays: true});

			flattenedObj.should.have.property('aArray.0', 'ele1');
			flattenedObj.should.have.property('aArray.1', 'ele2');

		});

		it('object only one level of deep', function () {

			var originalObj = {
				aString: 'string',
				aNumber: 0,
				aBoolean: true,
				aArray: [10, 20],
				subObj: {
					aString: 'String1',
					aNumber: 1,
					aArray: [30, 40],
					subObj: {
						aString: 'String2',
						aNumber: 2
					}
				}
			};

			var flattenedObj = uObjs.flatten(originalObj, {flattenArrays: true, maxDeep: 1});

			flattenedObj.should.have.property('aArray.0', 10);
			flattenedObj.should.have.property('aArray.1', 20);
			flattenedObj.should.have.property('subObj.aString', 'String1');
			flattenedObj['subObj.subObj'].should.have.property('aString', 'String2');
			flattenedObj['subObj.aArray'].should.eql([30, 40]);

		});

	});

  describe('subtractObjectProperties', function () {

    describe('subtract primitives', function () {

      it('the object {i: 1, s: \'string\', b: true} shouldn\'t contain \'i\' property after ' +
        'subtracting it',
        function () {

          var srcObj = {
            i: 1,
            s: 'string',
            b: true
          };

          uObjs.subtractObjectProperties(srcObj, {i: true});
          should.not.exist(srcObj.i);
          should.exist(srcObj.s);
          should.exist(srcObj.b);
        });

      it('the object {i: 1, s: \'string\', b: true} shouldn\'t contain \'s\' property after ' +
        'subtracting it',
        function () {

          var srcObj = {
            i: 1,
            s: 'string',
            b: true
          };

          uObjs.subtractObjectProperties(srcObj, {s: 0});
          should.exist(srcObj.i);
          should.not.exist(srcObj.s);
          should.exist(srcObj.b);

        });

      it('the object {i: 1, s: \'string\', b: true} shouldn\'t contain \'b\' property after ' +
        'subtracting it',
        function () {

          var srcObj = {
            i: 1,
            s: 'string',
            b: true
          };

          uObjs.subtractObjectProperties(srcObj, {b: false});
          should.exist(srcObj.i);
          should.exist(srcObj.s);
          should.not.exist(srcObj.b);
        });

    }); // End subtract primitive properties

    describe('subtract primitives from subobjects and whole objects', function () {

      it('the object {s: \'string\', o: {os: \'subobj string\', oi: 1}} shouldn\'t contain \'o.s\' ' +
        'property after subtracting it',
        function () {

          var srcObj = {
            s: 'string',
            o: {
              os: 'sbuobj string',
              oi: 1
            }
          };

          uObjs.subtractObjectProperties(srcObj, {o: {os: 0}});
          should.exist(srcObj.s);
          should.not.exist(srcObj.o.os);
          should.exist(srcObj.o.oi);
        });

      it('the object {s: \'string\', o: {os: \'subobj string\', oi: 1}} shouldn\'t contain \'o\' ' +
        'property after subtracting it',
        function () {

          var srcObj = {
            s: 'string',
            o: {
              os: 'sbuobj string',
              oi: 1
            }
          };

          uObjs.subtractObjectProperties(srcObj, {o: 0});
          should.exist(srcObj.s);
          should.not.exist(srcObj.o);
        });

    }); // End subtract primitive from suobjects and whole objects

    describe('subtract whole arrays and assign undefined to array\'s elements from root object\'s ' +
      'properties ',
      function () {

        it('the object {s: \'string\', a: [1, 2, 3, 4]} should have \'a[0]\' to undefined ',
          function () {

            var srcObj = {
              s: 'string',
              a: [1, 2, 3, 4]
            };

            uObjs.subtractObjectProperties(srcObj, {a: [1]});
            should.exist(srcObj.s);
            should.not.exist(srcObj.a[0]);
            should.exist(srcObj.a[1]);
          });

        it('the object {s: \'string\', a: [1, 2, 3, 4]} should have \'a[0]\' to undefined ',
          function () {

            var srcObj = {
              s: 'string',
              a: [1, 2, 3, 4]
            };

            uObjs.subtractObjectProperties(srcObj, {a: [undefined, 1]});
            should.exist(srcObj.s);
            should.not.exist(srcObj.a[1]);
            should.exist(srcObj.a[0]);
            should.exist(srcObj.a[2]);
          });

        it('the object {s: \'string\', a: [1, 2, 3, 4]} shouldn\'t have \'a\' after subtracting it ',
          function () {

            var srcObj = {
              s: 'string',
              a: [1, 2, 3, 4]
            };

            uObjs.subtractObjectProperties(srcObj, {a: 'remove'});
            should.exist(srcObj.s);
            should.not.exist(srcObj.a);
          });

      }); // End subtract whole arrays and assign undefined to array's (root object)

    describe('subtract properties from object array\'s elements ',
      function () {

        it('the object {s: \'string\', ao: [{i: 0, s: \'string 0\', b: true}, ' +
          '{i: 1, s: \'string 1\', b: true}]} shouldn\'t have \'oa[0].i nor oa[1].s\' ',
          function () {

            var srcObj = {
              s: 'string',
              ao: [
                {
                  i: 0,
                  s: 'string 0',
                  b: true
                },
                {
                  i: 1,
                  s: 'string 1',
                  b: true
                }
              ]
            };

            uObjs.subtractObjectProperties(srcObj, {ao: [
              {i: true},
              {s: 0}
            ]});
            should.exist(srcObj.s);
            should.not.exist(srcObj.ao[0].i);
            should.exist(srcObj.ao[0].s);
            should.not.exist(srcObj.ao[1].s);
            should.exist(srcObj.ao[1].i);
            srcObj.should.eql({
              s: 'string',
              ao: [
                {
                  s: 'string 0',
                  b: true
                },
                {
                  i: 1,
                  b: true
                }
              ]
            });
          });

        it('the object {s: \'string\', ao: [{i: 0, s: \'string 0\', a: [0, 1]}, ' +
          '{i: 1, s: \'string 1\', b: true}]} shouldn\'t have \'oa[1].s\' and \'oa[0].a[0]\' ' +
          'should be undefined',
          function () {

            var srcObj = {
              s: 'string',
              ao: [
                {
                  i: 0,
                  s: 'string 0',
                  a: [0, 1]
                },
                {
                  i: 1,
                  s: 'string 1',
                  b: true
                }
              ]
            };

            uObjs.subtractObjectProperties(srcObj, {ao: [
              {a: [-1]},
              {s: 0}
            ]});

            srcObj.should.eql({
              s: 'string',
              ao: [
                {
                  i: 0,
                  s: 'string 0',
                  a: [undefined, 1]
                },
                {
                  i: 1,
                  b: true
                }
              ]
            });

          });

      }); // End subtract object's properties from  arrays of objects

    describe('subtract any element if the subtract object doesn\'t fit to the source object\'s ' +
      'structure',
      function () {

        it('the object {s: \'string\', ao: [{i: 0, s: \'string 0\', b: true}, ' +
          '{i: 1, s: \'string 1\', b: true}]} should remain equal',
          function () {

            var srcObj = {
              s: 'string',
              ao: [
                {
                  i: 0,
                  s: 'string 0',
                  b: true
                },
                {
                  i: 1,
                  s: 'string 1',
                  b: true
                }
              ]
            };

            uObjs.subtractObjectProperties(srcObj, {nots: true, not: [
              {i: true},
              {s: 0}
            ]});
            srcObj.should.eql({
              s: 'string',
              ao: [
                {
                  i: 0,
                  s: 'string 0',
                  b: true
                },
                {
                  i: 1,
                  s: 'string 1',
                  b: true
                }
              ]
            });
          });

      }); // End subtract object's properties from  arrays of objects

  }) // End subtractObjectProperties function test;
});
