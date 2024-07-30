# babel-plugin-precall

babel 预执行插件

## 插件功能

自动引入配置的模块

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
    module.exports=1+1
  `);
// 输出内容
2;
```

```js
// 输入内容
precall`
    module.exports=1+1
  `;
// 输出内容
2;
```
