/*jshint node:true*/
"use strict";
var express = require('express');

function createMiddleware(config, callback) {
    var app = express();

    Object.keys(config.routes).forEach(function(pattern) {
        var taskName = config.routes[pattern];
        app.use(pattern, function(req, res, next) {
            callback(taskName, req.params, next);
        });
    });
    app.use(express.static(config.baseDir));
    return app;
}

module.exports = function(config, callback) {
    return createMiddleware(config, callback).listen(config.port || 3000);
};

module.exports.middleware = createMiddleware;
