import tracker from "../utils/tracker";
import config from "../config";

export default function () {
  observeLCP();
  observePaint();
  observeEvent("resource");
  observeLoad();
  checkDataChange();

  if (config.vue?.Vue && config.vue?.router) {
    onVueRouteRender(config.vue.Vue, config.vue.router);
  }
}

// LCP 获取
// lcp是否完成
let LCP;
let lcpDone = false;
// LCP 需要最大内容渲染
function observeLCP() {
  const entryHandler = (list) => {
    lcpDone = true;
    if (observer) {
      observer.disconnect();
    }
    for (const entry of list.getEntries()) {
      LCP = entry.startTime;
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({
    type: "largest-contentful-paint",
    buffered: true,
  });
}

let FP;
let FCP;
let fpdone = false;

export function observePaint() {
  const entryHandler = (list) => {
    fpdone = true;
    for (const entry of list.getEntries()) {
      if (entry.name === "first-paint") {
        FP = entry.startTime;
        observer.disconnect();
      }
      if (entry.name === "first-contentful-paint") {
        FCP = entry.startTime;
        observer.disconnect();
      }
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "paint", buffered: true });
}

let ob;
let obdone = false;
export function observeEvent(entryType) {
  function entryHandler(list) {
    obdone = true;
    const data = list.getEntries ? list.getEntries() : list;
    for (const entry of data) {
      ob = {
        resourceName: entry.name, // 资源名称
        sourceType: entry.initiatorType, // 资源类型
        duration: entry.duration, // 资源加载耗时
        dns: entry.domainLookupEnd - entry.domainLookupStart, // DNS 耗时
        tcp: entry.connectEnd - entry.connectStart, // 建立 tcp 连接耗时
        redirect: entry.redirectEnd - entry.redirectStart, // 重定向耗时
        ttfb: entry.responseStart, // 首字节时间
        protocol: entry.nextHopProtocol, // 请求协议
        responseBodySize: entry.encodedBodySize, // 响应内容大小
        responseHeaderSize: entry.transferSize - entry.encodedBodySize, // 响应头部大小
        resourceSize: entry.decodedBodySize, // 资源解压后的大小
        isCache: isCache(entry), // 是否命中缓存
        startTime: performance.now(),
      };
    }
  }
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: entryType, buffered: true });
}

function isCache(entry) {
  // 直接从缓存读取或 304
  return (
    entry.transferSize === 0 ||
    (entry.transferSize !== 0 && entry.encodedBodySize === 0)
  );
}

export function observeLoad() {
  ["load", "DOMContentLoaded"].forEach((type) => onEvent(type));
}

let load;
let DOMContentLoaded;

let loadone = false;
function onEvent(type) {
  const callback = () => {
    if (type === "load") {
      loadone = true;
      load = performance.now();
    }
    if (type === "DOMContentLoaded") {
      DOMContentLoaded = performance.now();
    }

    window.removeEventListener(type, callback, true);
  };
  window.addEventListener(type, callback, true);
}

// Vue单页路由渲染
export function onVueRouteRender(Vue, router) {
  let isFirst = true;
  let startTime;
  router.beforeEach((to, from, next) => {
    // 首次进入页面已经有其他统计的渲染时间
    if (isFirst) {
      isFirst = false;
      return next();
    }
    // 给 router 新增一个字段, 表示是否要计算渲染时间
    // 只有路由跳转才需要计算
    router.needCalculateRenderTime = true;
    startTime = performance.now();

    next();
  });

  let timer;
  Vue.mixin({
    mounted() {
      if (!router.needCalculateRenderTime) return;

      this.$nextTick(() => {
        // 仅在整个视图都被渲染之后才会运行的代码
        const now = performance.now();
        clearTimeout(timer);

        timer = setTimeout(() => {
          router.needCalculateRenderTime = false;
          tracker.send({
            type: "router-time",
            duration: now - startTime,
            startTime: now,
          });
        }, 1000);
      });
    },
  });
}

let timer;

export function checkDataChange() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (lcpDone && fpdone && obdone && loadone) {
      let obj = {
        FP,
        FCP,
        LCP,
        load,
        DOMContentLoaded,
        ...ob,
        category: "performace",
      };
      tracker.send(obj);
    } else {
      checkDataChange();
    }
  }, 500);
}
