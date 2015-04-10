/*jshint node:true*/
"use strict";
var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
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

module.exports = function(config, callback) {
    var app = express(),
        cooldown = config.cooldownTime || 0;

    _.forEach(config.routes, function(taskName, pattern) {
        var task = new Task(taskName, cooldown, callback);
        app.use(pattern, function(req, res, next) {
            task.run(next);
        });
    });
    //TODO use module for static serving
    app.get('*', function(req, res) {
        var file = path.join(config.baseDir, req.path);
        fs.open(file, 'r', function(err, fd) {
            if(err) {
                res.status(404).send({'not': 'found'});
            } else {
                fs.createReadStream(null, {fd: fd}).pipe(res);
            }
        });
    });
    app.listen(3000);
};
