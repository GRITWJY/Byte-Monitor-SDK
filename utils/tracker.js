import { setConfig, genkey, getConfig, getUserConfig } from "../config";
import axios from "axios";
class SenderTracker {
  constructor() {
    this.user = false; // 这个表示当前数据库中没有这个用户
    this.cache = [];

    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = genkey(JSON.stringify(getConfig()), 32);
      localStorage.setItem("userId", userId);
    }
    setConfig({ userId });
  }

  // todo: 正常数据上报不用screen,selector等等
  send(data = {}) {
    // 上传用户信息
    if (!this.user) {
      axios
        .post("http://localhost:3005/sdk/saveUser", getUserConfig())
        .then((res) => {
          console.log(res);
        });
      this.user = true;
    }

    // 其他正常信息
    let extraData = getConfig();
    extraData.page = window.location.href;

    let log = { ...extraData, ...data };
    // 转成字符串
    for (const key in log) {
      log[key] = JSON.stringify(log[key]);
    }
    this.cache.push(log);
    console.log(this.cache.length);
    // 10条一次上传
    if (this.cache.length >= 10) {
      // 数据上报, 一个接口, 服务端做判断?
      axios
        .post("http://localhost:3005/sdk/transportData", this.cache)
        .then((res) => {
          console.log(res);
        });
      this.cache = [];
    }
  }
}

export default new SenderTracker();
