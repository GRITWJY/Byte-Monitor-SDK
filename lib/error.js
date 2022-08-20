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
          category: "error",
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
          category: "error",
          type: event.error.name, // 小类型，这是一个错误
          msg: event.error.message, // 报错信息
          stack: extractErrorStack(event.error),
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
        category: "error",
        type: event.reason.name, // 小类型，这是一个错误
        msg: event.reason.message, // 报错信息
        stack: extractErrorStack(event.reason),
        selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
      });
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
      stack: extractErrorStack(err),
      msg: err.message,
      selector: getSelector(lastEvent.path) || "",
      category: "error",
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

// 解析错误栈

/**
 * 解析 error 的 stack, 并返回 args, column, line, func, url
 * @param ex
 */
function extractErrorStack(ex) {
  const chrome =
      /^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|[a-z]:|\/).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i,
    chromeEval = /\((\S*)(?::(\d+))(?::(\d+))\)/;

  const lines = ex.stack.split("\n"),
    stack = [];

  let submatch, parts, element;

  for (let i = 0, j = lines.length; i < j; ++i) {
    if ((parts = chrome.exec(lines[i]))) {
      const isNative = parts[2] && parts[2].indexOf("native") === 0; // start of linec
      const isEval = parts[2] && parts[2].indexOf("eval") === 0; // start of line

      if (isEval && (submatch = chromeEval.exec(parts[2]))) {
        // throw out eval line/column and use top-most line/column number
        parts[2] = submatch[1]; // url
        parts[3] = submatch[2]; // line
        parts[4] = submatch[3]; // column
      }

      element = {
        url: !isNative ? parts[2] : null,
        func: parts[1] || "",
        args: isNative ? [parts[2]] : [],
        line: parts[3] ? +parts[3] : null,
        column: parts[4] ? +parts[4] : null,
      };
    }
  }

  if (!element.func && element.line) {
    element.func = "";
  }
  stack.push(element);
  return stack;
}
