/**
 * compile xtemplate file
 * @author: daxingplay
 * @date: 8/25/14
 */
var through = require('through2');
var gutil = require('gulp-util');
var esprima = require('esprima');
var escodegen = require('escodegen');
var PLUGIN_NAME = require('./package.json').name;

var wrapper = '' +
    '/** compiled by xtemplate */\n' +
    '/*jshint quotmark:false, loopfunc:true, indent:false, asi:true, unused:false, boss:true, sub:true*/\n' +
    'modulex.add(function(require, exports, module){' +
    'function compiled(){ {{XTEMPLATE_CONTENT}} }' +
    'compiled.TPL_NAME = module.name;' +
    'return compiled;' +
    '});';

var renderWrapper = "" +
    "modulex.add(function(require){" +
    "var runtime = require('kg/xtemplate-runtime/x.y.z/');" +
    "var compiled = require('./{{XTEMPLATE_FILENAME}}');" +
    "var instance = new XTemplate(compiled);" +
    "return function(){" +
    "return instance.render.apply(instance, arguments);" +
    "}" +
    "});";

function beautify(){
    try {
        return escodegen.generate(esprima.parse(str));
    } catch (e) {
        console.log('syntax error: ');
        console.log(str);
        throw e;
    }
}

module.exports = function(config){

    config = config || {};
    config.suffix = config.suffix || 'xtpl';
    var xtemplate = config.xtemplate || require('xtemplate');

    var fileHeader = '/** compiled by xtemplate ' + xtemplate.version + ' */\n' +
        '/*jshint quotmark:false, loopfunc:true, indent:false, asi:true, unused:false, boss:true, sub:true*/\n';

    return through.obj(function(file, encoding, callback){
        var code = file.contents.toString(encoding);
        if (!file.isBuffer()) {
            throw new gutil.PluginError(PLUGIN_NAME, 'only support buffer');
        }

        var fileName = file.path.replace(new RegExp('.' + config.suffix + '$'), '');
        var compiledFile = {
            path: fileName + '.js',
            contents: ''
        };

        var compiledContent = xtemplate.compile(code);
        compiledContent = 'modulex.add(function(require, exports, module){' +
            'function compiled(){' +
            compiledContent +
            '}' +
            'compiled.TPL_NAME = module.name;' +
            'return compiled;' +
            '});';

        compiledFile.contents = fileHeader + beautify(compiledContent);

        this.push(compiledFile);

        if(config.noRenderFile !== true){
            var renderFileContent = "modulex.add(function(require){" +
                "var runtime = require('kg/xtemplate-runtime/" + xtemplate.version + "/');" +
                "var compiled = require('./" + fileName + "');" +
                "var instance = new XTemplate(compiled);" +
                "return function(){" +
                "return instance.render.apply(instance, arguments);" +
                "}" +
                "});";
            this.push({
                path: fileName + '-render.js',
                contents: fileHeader + beautify(renderFileContent)
            });
        }

        callback();
    });

};