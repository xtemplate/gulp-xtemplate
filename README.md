# gulp-xtemplate

compile .xtpl file to modulex module


## usage

```javascript
var XTemplate = require('xtemplate');
var gulpXTemplate = require('gulp-xtemplate');

gulp.src('lib/**/*')
    .pipe(gulpXTemplate({
        wrap: 'modulex', // defaults to modulex. set to define compiled to define() or kissy to KISSY.add. set to false compiled without wrapper.
        compileConfig: {
            isModule:1, // defaults to 1. use native template require
            catchError:false // defaults to false. whether to point to line of xtpl when exception occurs(impact performance)
        },
        // runtime:'', defaults to xtemplate, can set to kg/xtemplate/require('xtemplate/package.json').version/runtime
        suffix:'.xtpl', // defaults to .xtpl. transform xx.tpl -> xx.js
        truncatePrefixLen: 0,//optional, remove the first length string of file path from generate code
        XTemplate: require('xtemplate') // required. xtemplate module,
        renderJs:'-render.js'// render xtpl file suffix.set to 'none' don't create render file
    }))
    .pipe(uglify())
    .pipe(gulp.dest('build'))
```

## xtpl file example

### source

a.xtpl
```
{{include('./b')}}{{x}}
```

### after compile

a.js

```javascript
modulex.add(function(require, exports, module){
  function compiled(){
     require('./b');
     // ....
  }
  compiled.TPL_NAME = module.name;
  return compiled;
});
```

a-render.js

```javascript
modulex.add(function(require){
  // x.y.z is extracted from xtemplate.version 
  var runtime = require('kg/xtemplate-runtime/x.y.z/');
  var compiled = require('./a');
  var instance = new XTemplate(compiled);
  return function(){
    return instance.render.apply(instance, arguments);
  }
});
```

user call:

```javascript
modulex.use('xx/a-render', function(aRender){
    console.log(aRender({
        x:1
    },{
        commands: {
            //
        }
    }));
});
```