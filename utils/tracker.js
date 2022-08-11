import { setConfig, genkey, getConfig } from "../config";

class SenderTracker {
  constructor() {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = genkey(JSON.stringify(getConfig()), 32);
      localStorage.setItem("userId", userId);
    }
    setConfig({ userId });
  }

  send(data = {}) {
    let extraData = getConfig();
    delete extraData.vue;
    extraData.page = window.location.href;

    let log = { ...extraData, ...data };
    console.log(log);
    // for (const key in log) {
    //   log[key] = JSON.stringify(log[key]);
    // }
    // let body = JSON.stringify({
    //   __logs__: [log],
    // });
    // this.xhr.open("POST", this.url, true);
    // this.xhr.setRequestHeader("Content-Type", "application/json;uft-8"); // 请求体类型
    // this.xhr.setRequestHeader("x-log-apiversion", "0.6.0"); // 请求版本号
    // this.xhr.setRequestHeader("x-log-bodyrawsize", body.length); // 请求体大小
    // this.xhr.onload = function () {};
    // this.xhr.onerror = function (error) {};
    // this.xhr.send(body);
  }
}

export default new SenderTracker();
