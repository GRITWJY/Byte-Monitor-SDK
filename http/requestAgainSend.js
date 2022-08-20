// 实现 请求错误时重新发送接口
import { isJsonStr } from "../utils/util";
/**
 * @param {失败信息} err
 * @param {实例化的单例} axios
 * @returns
 */
export function againRequest(err, axios) {
  let config = err.config;
  // config.retry 具体接口配置的重发次数
  if (!config || !config.retry) return Promise.reject(err);

  // 设置用于记录重试计数的变量 默认为0
  config.__retryCount = config.__retryCount || 0;

  // 判断是否超过了重试次数
  if (config.__retryCount >= config.retry) {
    return Promise.reject(err);
  }
  // 重试次数
  config.__retryCount += 1;

  // 延时处理
  var backoff = new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, config.retryDelay || 1000);
  });
  // 重新发起axios请求
  return backoff.then(function () {
    // 判断是否是JSON字符串
    if (config.data && isJsonStr(config.data)) {
      config.data = JSON.parse(config.data);
    }
    return axios(config);
  });
}
