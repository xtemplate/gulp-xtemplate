# gulp-xtemplate

compile .xtpl file to modulex module


## usage

```javascript
var XTemplate = require('xtemplate');
var gulpXTemplate = require('gulp-xtemplate');

gulp.src('lib/**/*')
    .pipe(gulpXTemplate({
        wrap: 'modulex', // defaults to modulex. set to define compiled to define() or kissy to KISSY.add
        // runtime:'', defaults to kg/xtemplate/x.y.z/runtime
        suffix:'.xtpl' // defaults to .xtpl. transform xx.tpl -> xx.js
        XTemplate: XTemplate // required. xtemplate module
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