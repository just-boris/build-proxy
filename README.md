# Build proxy

> [Express.js](http://expressjs.com/) app which helps you update your resources on demand
 
 
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
}, function(action, done) {
    // run Gulp task 'scripts' to process get your js from coffee, for example
    gulp.start(action, done);
});
```

This code will run a webserver on http://localhost:3000, and it will call your action every time, when you try to get
some resource. It means that you don't need to keep some watcher daemon, you will get built resource every time. 
Instead of watchers pattern, which build your project for after save, here it will be built only when it is really 
needed.

You can pass several routes for different purposes:

```js
var proxy = require('build-proxy');

proxy({
    '**/*.js': 'scripts',
    '**/*.css': 'styles',
}, function(action, done) {
    // action will be 'styles' or 'scripts'
    gulp.start(action, done);
});
```

## Grunt and other build systems

You do not need to use Gulp! Here is Webpack:
 
```js
proxy({
    '**/*.js': 'scripts'
}, function(action, done) {
    webpack({/*config*/}, done);
});
```

Grunt doesn't have programmatically API with callback (see [issue 1184](https://github.com/gruntjs/grunt/issues/1184)), 
use child_process for it

```js
proxy({
    '**/*.js': 'scripts',
}, function(action, done) {
    // build scripts via grunt
    require('child_process').execFile('grunt', [action], done);
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
* cooldownTime (default: 0) – time in millisecond when your recently built files should be considered as valid. Is is 
useful when you have a lot of result files and one task and want to build and load them all with one callback
  
## Epilogue

Any help and questions will be appreciated in [issues](https://github.com/just-boris/build-proxy/issues) to this repo
