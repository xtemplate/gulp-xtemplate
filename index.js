var through2 = require('through2');
var path = require('path');
var util = require('modulex-util');
var tpl = ['@define@(function(require,exports,module){',
    'module.exports = @func@;',
    'module.exports.TPL_NAME = module.name;',
    '});'].join('\n');
var renderTpl = ['@define@(function(require,exports,module){',
    'var tpl = require("@tpl@");',
    'var XTemplateRuntime = require("@runtime@");',
    'var instance = new XTemplateRuntime(tpl);',
    'return function(){',
    'return instance.render.apply(instance,arguments);',
    '};',
    '});'].join('\n');

function getFunctionName(name) {
    return name.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase();
    })
}

module.exports = function (config) {
    var suffix = config.suffix || '.xtpl';
    var XTemplate = config.XTemplate;
    var useGallery = config.useGallery;
    var version = XTemplate.version;
    var useDefine = config.useDefine;
    var define = useDefine ? 'define' : 'modulex.add';
    if (useGallery === undefined) {
        useGallery = true;
    }
    return through2.obj(function (file, encoding, callback) {
        if (path.extname(file.path) !== suffix) {
            callback(file);
            return;
        }
        var fileContent = file.contents.toString();
        file.contents = null;
        var name = path.basename(file.path, suffix);
        var functionName = getFunctionName(name);
        var compiledFunc = XTemplate.Compiler.compileToStr({
            name: file.path,
            isModule: 1,
            functionName: functionName,
            content: fileContent
        });
        var tplFile = file.clone();
        tplFile.path = file.path.slice(0, 0 - suffix.length) + '.js';
        tplFile.contents = new Buffer(util.substitute(tpl, {
            func: compiledFunc,
            define: define
        }, /@([^@]+)@/g));
        this.push(tplFile);
        var tplRenderFile = file.clone();
        tplRenderFile.path = file.path.slice(0, 0 - suffix.length) + '-render.js';
        tplRenderFile.contents = new Buffer(util.substitute(renderTpl, {
            tpl: './' + name,
            runtime: useGallery ? 'kg/xtemplate/' + version + '/runtime' : 'xtemplate/runtime',
            define: define
        }, /@([^@]+)@/g));
        this.push(tplRenderFile);
        callback();
    });
};