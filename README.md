# gulp-xtemplate

compile .xtpl file to modulex module


## usage

```javascript
var xtemplate = require('xtemplate');
var gulpXTemplate = require('gulp-xtemplate');

gulp.src('lib/**/*')
    .pipe(gulpXTemplate({
        suffix:'xtpl' // defaults to xtpl, transform xx.tpl -> xx.js
        xtemplate: xtemplate // required. xtemplate module
    }))
    .pipe(uglify())
    .pipe(gulp.dest('build'))
```