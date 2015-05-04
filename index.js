/*jshint node:true*/
"use strict";
var _ = require('lodash'),
    express = require('express'),
    promisify = require('promisify-node');

function Task(taskName, cooldown, callback) {
    var promise = null,
        action = promisify(callback),
        successFinish = cooldown ? _.debounce(finish, cooldown) : finish;

    this.run = function(cb) {
        if(!promise) {
            promise = action(taskName);
            promise.catch(finish);
        }
        promise.then(function() {
            cb();
            successFinish();
        }, function(err) {
            cb(err);
        });
    };
    function finish() {
        promise = null;
    }
}

function createMiddleware(config, callback) {
    var app = express(),
        cooldown = config.cooldownTime || 0;

    _.forEach(config.routes, function(taskName, pattern) {
        var task = new Task(taskName, cooldown, callback);
        app.use(pattern, function(req, res, next) {
            task.run(next);
        });
    });
    app.use(express.static(config.baseDir));
    return app;
}

module.exports = function(config, callback) {
    return createMiddleware(config, callback).listen(config.port || 3000);
};

module.exports.middleware = createMiddleware;
