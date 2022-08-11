# 前端监控SDK


## V1.0.0

### 使用方法

`npm install wjy-monitor`
```javascript
// main.js
monitor.init({
  version: "01.39303",
  appId: "v93nfj3jdok20fdj3od",
  vue: {
    Vue,
    router,
  },
});

```


本前端监控系统目前为第一版, 实现了前端监控的各项基础指标, 具体指标如下:
- 错误
  - vue 错误
  - JS 错误
  - Promise 错误
  - 资源错误
  
- xhr 请求
  - ajax 请求
  - fetch 请求
  
- 性能
  - LCP,FP,FCP
  - 资源加载
  - vue路由渲染时间
  
- 行为
  - 页面跳转
  - 点击事件
  
具体例子可以看 代码仓库中的 example 里的代码, 目前还没有做数据展示, 可以打开控制台查看待上传信息


