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
                '/scripts/**': 'build-js',
                '/styles/**': 'build-styles',
                '/templates/**': 'build-templates'
            }
        }, cb);
    });

    afterEach(function() {
        fakeFs.restore();
        app.close();
    });

    it("should build file before request", function(done) {
        cb.and.callFake(function(task, cb) {
            fakeFs({
                '/tmp/scripts/main.js': 'script content'
            });
            cb();
        });
        request(app).get("/scripts/main.js").expect(200, 'script content').then(function(res) {
            expect(cb).toHaveBeenCalledWith('build-js', jasmine.any(Function));
            done();
        });
    });

    it("should run one job for all files", function(done) {
        cb.and.callFake(function(task, cb) {
            fakeFs({
                '/tmp/scripts/main.js': 'script content',
                '/tmp/scripts/extra.js': 'extra script'
            });
            setTimeout(cb, 1);
        });
        q.all([
            request(app).get("/scripts/main.js").expect(200, 'script content'),
            request(app).get("/scripts/extra.js").expect(200, 'extra script')
        ]).then(function() {
            expect(cb).toHaveBeenCalledOnceWith('build-js', jasmine.any(Function));
        }).then(done, done.fail);
    });

    it("should run job for each type of files", function(done) {
        cb.and.callFake(function(task, cb) {
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
            expect(cb).toHaveBeenCalledWith('build-js', jasmine.any(Function));
            expect(cb).toHaveBeenCalledWith('build-styles', jasmine.any(Function));
            expect(cb.calls.count()).toBe(2);
        }).then(done, done.fail);
    });
});

describe("cooldown option", function() {
    function makeRequest() {
        return request(app).get("/scripts/main.js").expect(200, 'build result')
    }

    var app, cb;

    beforeEach(function() {
        cb = jasmine.createSpy('build callback').and.callFake(function(task, cb) {
            fakeFs({
                '/tmp/scripts/main.js': 'build result'
            });
            cb();
        });
        app = proxy({
            baseDir: '/tmp',
            cooldownTime: 100,
            routes: {
                '/scripts/**': 'build-js'
            }
        }, cb);
    });

    afterEach(function() {
        fakeFs.restore();
        app.close();
    });

    it("should reuse build result for a while", function(done) {
        makeRequest().then(function() {
            return makeRequest()
        }).then(function() {
            expect(cb).toHaveBeenCalledOnceWith('build-js', jasmine.any(Function));
        }).then(done, done.fail);
    });

    it("should build again after cooldown time", function(done) {
        makeRequest().then(function() {
            cb.calls.reset();
        }).then(function() {
            return q.delay(100);
        }).then(function() {
            return makeRequest();
        }).then(function() {
            expect(cb).toHaveBeenCalledOnceWith('build-js', jasmine.any(Function));
        }).then(done, done.fail);
    });
});
