var fakeFs = require('mock-fs'),
    request = require("q-supertest"),
    q = require('q'),
    proxy = require("../");

describe("build-proxy", function() {
    var app, cb;

    beforeEach(function() {
        cb = jasmine.createSpy('build callback');
        app = proxy({
            baseDir: '/tmp',
            routes: {
                '/scripts/*': 'build-js',
                '/styles/*': 'build-styles',
                '/templates/*': 'build-templates'
            }
        }, cb);
    });

    afterEach(function() {
        fakeFs.restore();
        app.close();
    });

    it("should build file before response", function(done) {
        cb.and.callFake(function(task, params, cb) {
            fakeFs({
                '/tmp/scripts/main.js': 'script content'
            });
            cb();
        });
        request(app).get("/scripts/main.js").expect(200, 'script content').then(function(res) {
            expect(cb).toHaveBeenCalledWith('build-js', {0:'main.js'}, jasmine.any(Function));
            done();
        }, done.fail);
    });

    it("should allow concurrent builds", function(done) {
        cb.and.callFake(function(task, params, cb) {
            fakeFs({
                '/tmp/styles/main.css': 'some styles',
                '/tmp/scripts/main.js': 'script content',
                '/tmp/scripts/extra.js': 'extra script'
            });
            setTimeout(cb, 1);
        });
        q.all([
            request(app).get("/styles/main.css").expect(200, 'some styles'),
            request(app).get("/scripts/main.js").expect(200, 'script content'),
            request(app).get("/scripts/extra.js").expect(200, 'extra script')
        ]).then(function() {
            expect(cb).toHaveBeenCalledWith('build-js', {0:'main.js'}, jasmine.any(Function));
            expect(cb).toHaveBeenCalledWith('build-js', {0:'extra.js'}, jasmine.any(Function));
            expect(cb).toHaveBeenCalledWith('build-styles', {0:'main.css'}, jasmine.any(Function));
            expect(cb.calls.count()).toBe(3);
        }).then(done, done.fail);
    });

    it("should rebuild again on new request", function(done) {
        function makeRequest() {
            return request(app).get("/scripts/main.js").expect(200, 'script content');
        }
        cb.and.callFake(function(task, params, cb) {
            fakeFs({
                '/tmp/scripts/main.js': 'script content'
            });
            cb();
        });
        makeRequest().then(function() {
            return makeRequest()
        }).then(function() {
            expect(cb).toHaveBeenCalledWith('build-js', {0:'main.js'}, jasmine.any(Function));
            expect(cb.calls.count()).toBe(2);
            done();
        }, done.fail);
    });

    it("should return an error if it has been occurred", function(done) {
        cb.and.callFake(function(task, params, cb) {
            cb(new Error("error in build"));
        });
        request(app).get("/scripts/main.js").expect(500, /^Error: error in build/).then(function(res) {
            expect(cb).toHaveBeenCalledWith('build-js', {0:'main.js'}, jasmine.any(Function));
            done();
        }, done.fail);
    });
});
