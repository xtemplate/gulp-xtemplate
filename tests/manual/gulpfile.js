var gulpXTemplate = require('../../');
var gulp = require('gulp');
var xtemplate = require('xtemplate');
gulp.task('default',function(){
   gulp.src('src/**/*').pipe(gulpXTemplate({
     esmodule:true,
       XTemplate: xtemplate
   })).pipe(gulp.dest('build'))
});
