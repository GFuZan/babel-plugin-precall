const Module = require("module");

/**
 * 预执行插件
 * @param {import('@babel/core')} babel
 * @param {{ value: string | Array<string> }} options
 * @returns {import('@babel/core').PluginObj} 插件对象
 * @example
 * ```js
 *   // 插件配置
 *   plugins: [
 *    [
 *       "babel-plugin-precall",
 *       {
 *         value: 'precall',
 *       },
 *     ],
 *   ],
 *
 *   // 转换
 *   precall(`module.exports=1555`) => 1555  // 方式1
 *   precall`module.exports=1555` => 1555  // 方式2
 * ```
 */
const plugin = function (babel, options) {
  const { types: t } = babel;
  const emptyObj = {}
  let opts = options && handleOptions(options);

  return {
    visitor: {
      Program: {
        enter(path, state) {
          !opts && (opts = handleOptions(state.opts || {}));
          Object.assign(state, opts);
        },
      },
      CallExpression(path, state) {
        const { filename = "p.js", keyMap } = state;

        if (
          t.isIdentifier(path.node.callee) &&
          keyMap[path.node.callee.name] &&
          !path.scope.hasBinding(path.node.callee.name)
        ) {
          const n = path.node.arguments[0];
          let moduleValue = "";
          if (t.isTemplateLiteral(n)) {
            moduleValue = n.quasis[0].value.raw;
          } else if (t.isStringLiteral(n)) {
            moduleValue = n.value;
          }

          replaceNode(path, babel, moduleValue, filename);
        }
      },
      TaggedTemplateExpression(path, state) {
        const { filename = "p.js", keyMap } = state;
        const { tag, quasi } = path.node;
        if (
          t.isIdentifier(tag) &&
          !emptyObj[tag.name] &&
          keyMap[tag.name] &&
          t.isTemplateLiteral(quasi)
        ) {
          replaceNode(path, babel, quasi.quasis[0].value.raw, filename);
        }
      },
    },
  };
};

/**
 *
 * @param {import('@babel/core').NodePath} path
 * @param {import('@babel/core')} babel
 * @param {*} moduleValue
 * @param {*} filename
 */
const replaceNode = (path, babel, moduleValue, filename) => {
  const { types: t, transform, transformSync = transform } = babel;
  if (moduleValue) {
    const { code } = transformSync(moduleValue, {
      filename,
    });
    const m = new Module(filename);
    m._compile(code, filename);
    const newValue = m.exports;
    path.replaceWithSourceString(
      newValue === undefined
        ? "undefined"
        : typeof newValue === "function"
        ? String(newValue)
        : JSON.stringify(newValue)
    );
  } else {
    path.replaceWith(t.identifier("undefined"));
  }
};

/**
 * 处理入参
 * @param {{ value: string | Array<string> }} options
 * @returns
 */
const handleOptions = (options) => {
  const { value = "precall" } = options;
  const keyList = Array.isArray(value) ? value : [value];
  const keyMap = keyList.reduce((sum, v) => {
    sum[v] = true;
    return sum;
  }, {});

  return {
    keyList,
    keyMap,
  };
};

module.exports = plugin;
