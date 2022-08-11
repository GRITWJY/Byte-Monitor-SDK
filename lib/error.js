import getLastEvent from "../utils/getLastEvent";
import getSelector from "../utils/getSelector";
import tracker from "../utils/tracker";
import config from "../config";

export default function error() {
  injectJsError();
  if (config.vue?.Vue) {
    vueError(config.vue.Vue);
  }
}

function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener(
    "error",
    function (event) {
      let lastEvent = getLastEvent(); // 最后一个交互事件
      // 脚本加载错误
      if (event.target && (event.target.src || event.target.href)) {
        tracker.send({
          type: "SourceError", // 小类型，这是一个错误
          msg: "资源加载失败",
          stack: [],
          extra: {
            filename: event.target.src || event.target.href,
            tagName: event.target.tagName,
          },
          selector: getSelector(event.target), // 代表最后一个操作的元素
        });
      } else {
        const parseError = ErrorStackParser.parse(event.error);
        // 错误事件对象
        tracker.send({
          type: event.error.name, // 小类型，这是一个错误
          message: event.error.message, // 报错信息
          stack: parseError,
          selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
        });
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      let lastEvent = getLastEvent();
      console.log(event);

      if (!event.reason.stack) {
        return;
      }
      const parseError = ErrorStackParser.parse(event.reason);

      // 错误事件对象
      tracker.send({
        type: event.reason.name, // 小类型，这是一个错误
        message: event.reason.message, // 报错信息
        stack: parseError,
        selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
      });

      // if (typeof reason === "string") {
      //   message = reason;
      // } else if (typeof reason === "object") {
      //   if (reason.stack) {
      //     let matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
      //     filename = matchResult[1];
      //     line = matchResult[2];
      //     colnum = matchResult[3];
      //   }
      //
      //   message = reason.message;
      //   stack = getLines(reason.stack);
      // }
      // tracker.send({
      //   kind: "stability", // 监控指标的大类，
      //   type: "error", // 小类型，这是一个错误
      //   errorType: "promiseError", // JS执行错误
      //   message, // 报错信息
      //   filename,
      //   position: `${line}:${colnum}`,
      //   stack,
      //   selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
      // });
    },
    true
  );
}

import ErrorStackParser from "error-stack-parser";

function vueError(app) {
  app.config.productionTip = false;
  app.config.errorHandler = (err, vm, info) => {
    let lastEvent = getLastEvent(); // 最后一个交互事件

    const parseError = ErrorStackParser.parse(err);
    let obj = {
      type: err.name,
      stack: parseError,
      msg: err.message,
      selector: getSelector(lastEvent.path) || "",
      extra: {
        componentName: formatComponentName(vm),
        lifecycleHook: info,
      },
    };

    tracker.send(obj);
  };
}
//

function formatComponentName(vm) {
  if (vm.$root === vm) {
    return "root instance";
  }
  var name = vm._isVue
    ? vm.$options.name || vm.$options._componentTag
    : vm.name;
  return (
    (name ? "component <" + name + ">" : "anonymous component") +
    (vm._isVue && vm.$options.__file ? " at " + vm.$options.__file : "")
  );
}
