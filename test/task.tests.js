var assert = require('chai').assert;
var expect = require('chai').expect;
var mock = require('./mock-require');

describe('Task', function () {

	var mockLog = null;
	var mockValidate = null;
	var mockTaskRunner = null;

	var testObject = null;

	var init = function (mockTaskModule) {
		mockLog = {};
		mockValidate = {};
		mockTaskRunner = {
			getTask: function () {
			},
		};

		var fullFilePath = 'blah/foo/test.js';

		mock(fullFilePath, mockTaskModule);

		var Task = require('../task');

		testObject = new Task('test.js', 'foo/test.js', fullFilePath, null, mockLog, mockValidate, mockTaskRunner);
	};

	afterEach(function () {
		testObject = null;
		mockLog = null;
		mockValidate = null;
		mockConfig = null;
		mockTaskMap = null;
	});

	it('bad task module throws', function () {

		expect(
				function () {
					init(null);
				}
			).to.throw(Error);
	});

	it('non-function task throws', function () {

		expect(
				function () {
					init({});
				}
			).to.throw(Error);
	});


	it('can get name', function () {

		debugger;

		init(function () {});

		expect(testObject.name()).to.be.equal("test");
	});

});