const Module = require("module");

/**
 * 预执行插件
 * @param {import('@babel/core')} babel
 * @param {{ value: string | Array<string> }} options
 * @returns {{ visitor: import('@babel/core').Visitor }} 插件对象
 *@example
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
const plugin = function (babel, options = {}) {
  let ops;

  return {
    visitor: {
      Program(rootPath, state) {
        !ops && (ops = handleOptions(state.opts || options));

        rootPath.traverse(traverseOptions, {
          filename: state.filename,
          ...ops,
          babel,
        });
      },
    },
  };
};

/**
 * @type {import('@babel/core').Visitor}
 */
const traverseOptions = {
  Identifier(path, state) {
    /**
     * @type {{ babel: import('@babel/core') }}
     */
    const {
      filename = "p.js",
      keyMap,
      babel,
      babel: { types: t },
    } = state;

    const { name } = path.node;
    if (
      keyMap[name] &&
      path.key === "callee" &&
      t.isCallExpression(path.parent) &&
      !path.scope.hasBinding(name)
    ) {
      const n = path.parent.arguments[0];
      let moduleValue = "";
      if (t.isTemplateLiteral(n)) {
        moduleValue = n.quasis[0].value.raw;
      } else if (t.isStringLiteral(n)) {
        moduleValue = n.value;
      }

      replaceNode(path.parentPath, babel, moduleValue, filename);
    }
  },
  TaggedTemplateExpression(path, state) {
    /**
     * @type {{ babel: import('@babel/core') }}
     */
    const {
      filename = "p.js",
      keyMap,
      babel,
      babel: { types: t },
    } = state;
    const { tag, quasi } = path.node;
    if (t.isIdentifier(tag) && keyMap[tag.name] && t.isTemplateLiteral(quasi)) {
      replaceNode(path, babel, quasi.quasis[0].value.raw, filename);
    }
  },
};

/**
 *
 * @param {import('@babel/core').NodePath} path
 * @param {import('@babel/core')} babel
 * @param {*} moduleValue
 * @param {*} filename
 */
const replaceNode = (path, babel, moduleValue, filename) => {
  const { template, types: t, transform, transformSync = transform } = babel;
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
