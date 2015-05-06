/*jshint node:true*/
"use strict";
var _ = require('lodash'),
    express = require('express');

function createMiddleware(config, callback) {
    var app = express();

    _.forEach(config.routes, function(taskName, pattern) {
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
