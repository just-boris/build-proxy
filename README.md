# Build proxy

> [Express.js](http://expressjs.com/) app which updates your resources on demand
 

This is like [webpack-dev-server](http://webpack.github.io/docs/webpack-dev-server.html), but framework-agnostic  
 
## Getting started

Install via npm:

```
npm install build-proxy --save-dev
```

Then define some routes which you need to listen and pass callback where you will do something:

```js
var proxy = require('build-proxy');

proxy({
    '**/*.js': 'scripts'
}, function(action, params, done) {
    // run Gulp task 'scripts' to process get your js from coffee, for example
    gulp.start(action, done);
});
```

This code will run a webserver on http://localhost:3000, and it will call your action every time, when you try to get
some resource. It means that you don't need to keep some watcher daemon, you will get actual resource every time. 
Instead of watchers pattern, which works after each save, here it will be built only when it is really needed.

You can pass several routes for different purposes:

```js
var proxy = require('build-proxy');

proxy({
    '/': 'main-page',
    '/gallery': 'gallery-page',
}, function(action, params, done) {
    // build starts only for these resources that you actually need now 
    gulp.start(action, done);
});
```

*Note that you also have to describe gulp task for each page on your own.*

Also you will get route params in the second argument. This is just [request params](http://expressjs.com/4x/api.html#req.params)
from Express.js. You can use it to determine, which file should be built now.

```js
proxy({
    '/:page': 'page'
}, function(action, params, done) {
    // run something like 'main-page-build'
    gulp.start(params.page + '-page-build', done)
});
```

## Grunt and other build systems

You do not need to use Gulp! Here is Browserify:
                              
```js
proxy({
 '**/*.js': 'scripts'
}, function(action, params, done) {
 browserify({/*config*/}).bundle(done);
});
```

Grunt doesn't have programmatically API with callback (see [issue 1184](https://github.com/gruntjs/grunt/issues/1184)), 
use child_process for it

```js
proxy({
    '**/*.js': 'scripts',
}, function(action, params, done) {
    // build scripts via grunt
    require('child_process').execFile('grunt', [action], done);
});
```

You even can use it with webpack although it has its own solution:
 
```js
proxy({
    '**/*.js': 'scripts'
}, function(action, params, done) {
    webpack({/*config*/}, done);
});
```

You can use whatever which can be called as function.

## API and options

`proxy(options, callback)` – create and start an express app for building and serving
 
`proxy.middleware(options, callback)` – returns a middleware, so you can use it in your app

### Supported options

* baseDir (required) – directory, where proxy will look for result of build. Usually the same as destination directory 
in your build config
* port (default: 3000) – if you don't want to run server on defuault port, run on any another
* routes (required) – key-value pair, defines your actions for routes. Key can be any valid express url expression. 
Value will be passed into your callback, when attempt to this route will be occurred
  
## Epilogue

Any help and questions will be appreciated in [issues](https://github.com/just-boris/build-proxy/issues) to this repo
