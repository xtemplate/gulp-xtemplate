var through2 = require('through2');
var path = require('path');
var util = require('modulex-util');

var requireTplInner = [
  '/*compiled by xtemplate#@version@*/',
  'var ret = module.exports = @func@;',
  'ret.TPL_NAME = "@tplName@";'
].join('\n');
var esTplInner = [
  '/*compiled by xtemplate#@version@*/',
  '@imports@',
  'var ret = @func@;',
  'ret.TPL_NAME = "@tplName@";',
  'export default ret;'
].join('\n');
var tpl = ['@define@{',
  requireTplInner,
  '});'].join('\n');
var requireRenderTplInner = [
  '/*compiled by xtemplate#@version@*/',
  'var tpl = require("@tpl@");',
  'var XTemplateRuntime = require("@runtime@");',
  'XTemplateRuntime=XTemplateRuntime.default || XTemplateRuntime;',
  'var instance = new XTemplateRuntime(tpl);',
  'module.exports = function(){',
  'return instance.render.apply(instance,arguments);',
  '};'
].join('\n');

var esRenderTplInner = [
  '/*compiled by xtemplate#@version@*/',
  'import tpl from "@tpl@";',
  'import XTemplateRuntime from "@runtime@";',
  'var instance = new XTemplateRuntime(tpl);',
  'export default function(){',
  'return instance.render.apply(instance,arguments);',
  '};'
].join('\n');

var renderTpl = ['@define@{',
  requireRenderTplInner,
  '});'].join('\n');

var eslintDisable = '/* eslint-disable */\n'

function getFunctionName(name) {
  return name.replace(/-(.)/g, function (m, m1) {
    return m1.toUpperCase();
  });
}

var wrapper = {
  'modulex': 'modulex.add(function(require,exports,module)',
  'kissy': 'KISSY.add(function(S,require,exports,module)',
  'define': 'define(function(require,exports,module)'
};

module.exports = function (config) {
  var suffix = config.suffix || '.xtpl';
  var XTemplate = config.XTemplate;
  var runtime = config.runtime || 'xtemplate-runtime';
  var wrap = config.wrap;
  var esmodule = config.esmodule;
  const tplInner = esmodule ? esTplInner : requireTplInner;
  const renderTplInner = esmodule ? esRenderTplInner : requireRenderTplInner;

  var renderJs = config.renderJs || '-render.js';
  var truncatePrefixLen = config.truncatePrefixLen || 0;
  var define = wrapper[wrap] || wrapper.define;
  var compileConfig = util.merge({
    isModule: 1
  }, config.compileConfig);
  return through2.obj(function (file, encoding, callback) {
    if (path.extname(file.path) !== suffix) {
      callback(file);
      return;
    }
    var fileContent = file.contents.toString();
    file.contents = null;
    var name = path.basename(file.path, suffix);
    var functionName = getFunctionName(name);
    var compiledFunc = XTemplate.Compiler.compileToCode(util.merge(compileConfig, {
      name: file.path.slice(truncatePrefixLen),
      functionName: functionName,
      content: fileContent
    }));
    var tplFile = file.clone();
    tplFile.path = file.path.slice(0, 0 - suffix.length) + '.js';
    tplFile.contents = new Buffer(eslintDisable + util.substitute(wrap ? tpl : tplInner, {
      version: XTemplate.version,
      func: compiledFunc.func,
      imports: compiledFunc.imports,
      define: define,
      tplName: path.basename(file.path),
    }, /@([^@]+)@/g));
    this.push(tplFile);
    if (renderJs != 'none') {
      var tplRenderFile = file.clone();
      tplRenderFile.path = file.path.slice(0, 0 - suffix.length) + '-render.js';
      tplRenderFile.contents = new Buffer(eslintDisable + util.substitute(wrap ? renderTpl : renderTplInner, {
        tpl: './' + name,
        version: XTemplate.version,
        runtime: runtime,
        define: define
      }, /@([^@]+)@/g));
      this.push(tplRenderFile);
    }
    callback();
  });
};
