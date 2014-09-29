var through2 = require('through2');
var path = require('path');
var util = require('modulex-util');
var tplInner = [
    'module.exports = @func@;',
    'module.exports.TPL_NAME = module.id || module.name;'
];
var tpl = ['@define@{',
    tplInner.join('\n'),
    '});'].join('\n');
var renderTplInner = [
    'var tpl = require("@tpl@");',
    'var XTemplateRuntime = require("@runtime@");',
    'var instance = new XTemplateRuntime(tpl);',
    'return function(){',
    'return instance.render.apply(instance,arguments);',
    '};'
];
var renderTpl = ['@define@{',
    renderTplInner.join('\n'),
    '});'].join('\n');

function getFunctionName(name) {
    return name.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase();
    })
}

var wrapper = {
    'modulex': 'modulex.add(function(require,exports,module)',
    'kissy': 'KISSY.add(function(S,require,exports,module)',
    'define': 'define(function(require,exports,module)'
};

module.exports = function (config) {
    var suffix = config.suffix || '.xtpl';
    var XTemplate = config.XTemplate;
    var runtime = config.runtime || 'kg/xtemplate/' + XTemplate.version + '/runtime';
    var wrap = config.wrap;
    var truncatePrefixLen = config.truncatePrefixLen || 0;
    var define = wrapper[wrap] || wrapper.modulex;
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
            name: file.path.slice(truncatePrefixLen),
            isModule: 1,
            catchError: config.catchError,
            functionName: functionName,
            content: fileContent
        });
        var tplFile = file.clone();
        tplFile.path = file.path.slice(0, 0 - suffix.length) + '.js';
        tplFile.contents = new Buffer(util.substitute(wrap ? tpl : tplInner, {
            func: compiledFunc,
            define: define
        }, /@([^@]+)@/g));
        this.push(tplFile);
        var tplRenderFile = file.clone();
        tplRenderFile.path = file.path.slice(0, 0 - suffix.length) + '-render.js';
        tplRenderFile.contents = new Buffer(util.substitute(wrap ? renderTpl : renderTplInner, {
            tpl: './' + name,
            runtime: runtime,
            define: define
        }, /@([^@]+)@/g));
        this.push(tplRenderFile);
        callback();
    });
};