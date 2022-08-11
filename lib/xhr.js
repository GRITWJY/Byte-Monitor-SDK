import tracker from "../utils/tracker";

export default function () {
  injectXHR();
  injectFetch();
}

// 记录请求？
function injectXHR() {
  let originalProto = window.XMLHttpRequest.prototype;
  let originalSend = XMLHttpRequest.prototype.send;

  let originalOpen = originalProto.open;

  originalProto.open = function newOpen(...args) {
    // // 判断
    // if (!url.match(/logstores/) && !url.match(/sockjs/)) {
    //   this.logData = { method, url, async };
    // }
    this.logData = {
      url: args[1],
      method: args[0],
    };
    return originalOpen.apply(this, args);
  };

  originalProto.send = function newSend(body) {
    // 如果是需要统计的
    if (this.logData) {
      let startTime = Date.now(); // 发送前记录开始时间

      let handlers = () => {
        let endTime = Date.now();
        let status = this.status;
        tracker.send({
          startTime,
          endTime,
          status, // 状态码
          type: "xhr",
          duration: endTime - startTime, // 持续时间
          url: this.logData.url, // 请求路径
          method: (this.logData.method || "GET").toUpperCase(),
          success: status >= 200 && status < 300,
          params: body,
          response: this.response,
        });
        this.removeEventListener("loadend", handlers, true);
      };

      this.addEventListener("loadend", handlers, true);
    }
    return originalSend.apply(this, arguments);
  };
}

const originalFetch = window.fetch;

function injectFetch() {
  window.fetch = function newFetch(url, config) {
    const startTime = Date.now();
    const reportData = {
      startTime,
      url,
      method: (config?.method || "GET").toUpperCase(),
      type: "fetch",
    };

    return originalFetch(url, config)
      .then((res) => {
        reportData.endTime = Date.now();
        reportData.duration = reportData.endTime - reportData.startTime;

        const data = res.clone();
        reportData.status = data.status;
        reportData.success = data.ok;

        tracker.send(reportData);

        return res;
      })
      .catch((err) => {
        reportData.endTime = Date.now();
        reportData.duration = reportData.endTime - reportData.startTime;
        reportData.status = 0;
        reportData.success = false;

        tracker.send(reportData);

        throw err;
      });
  };
}
