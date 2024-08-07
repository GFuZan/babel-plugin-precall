# babel-plugin-precall

babel 预执行插件

## 插件功能

自动引入配置的模块

## 引入插件

```shell
 npm install babel-plugin-precall --save-dev
```

## 插件配置

```js
// babel.config.js
module.exports = {
  presets: [
    // other presets
  ],
  plugins: [
    [
      "babel-plugin-precall",
      {
        value: "precall",
      },
    ],
  ],
};
```

## 使用

根据[以上配置](#插件配置)插件执行结果如下

```js
// 输入内容
precall(`
    // 此处可编写 node 模块代码, 如读取文件等操作
    module.exports=1+1
  `);
// 输出内容
2;
```

```js
// 输入内容
precall`
    // 此处可编写 node 模块代码, 如读取文件等操作
    module.exports=1+1
  `;
// 输出内容
2;
```
