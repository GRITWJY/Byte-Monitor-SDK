import Axios from "axios";
// 根据当前请求体信息生成key
import { generateReqKey } from "../utils/util";

const options = {
  storage: true, // 是否开启loclastorage缓存
  storageKey: "apiCache",
  storage_expire: 600000, // localStorage 数据存储时间10min（刷新页面判断是否清除）
  expire: 20000, // 每个接口数据缓存ms 数
};
// 初始化, 看是否有了缓存, 并且看是否过了时间?
(function () {
  let cache = window.localStorage.getItem(options.storageKey);
  if (cache) {
    let { storageExpire } = JSON.parse(cache);
    // 未超时不做处理
    if (
      storageExpire &&
      getNowTime() - storageExpire < options.storage_expire
    ) {
      return;
    }
  }
  window.localStorage.setItem(
    options.storageKey,
    JSON.stringify({ data: {}, storageExpire: getNowTime() })
  );
})();

// 获取响应
function getCacheItem(key) {
  let cache = window.localStorage.getItem(options.storageKey);
  let { data, storageExpire } = JSON.parse(cache);
  return (data && data[key]) || null;
}
// 缓存响应
function setCacheItem(key, value) {
  let cache = window.localStorage.getItem(options.storageKey);
  let { data, storageExpire } = JSON.parse(cache);
  data[key] = value;
  window.localStorage.setItem(
    options.storageKey,
    JSON.stringify({ data, storageExpire })
  );
}

let _CACHES = {};
// 使用Proxy代理
let cacheHandler = {
  get: function (target, key) {
    let value = target[key];
    if (options.storage && !value) {
      value = getCacheItem(key);
    }
    console.log(`${key} 被读取`, value);
    return value;
  },
  set: function (target, key, value) {
    console.log(`${key} 被设置为 ${value}`);
    target[key] = value;
    if (options.storage) {
      setCacheItem(key, value);
    }

    return true;
  },
};
let CACHES = new Proxy(_CACHES, cacheHandler);

export function requestInterceptor(config, axios) {
  // 这里请求的话,只需要判断有没有
  if (config.cache) {
    // 拿缓存,会触发get
    let data = CACHES[`${generateReqKey(config)}`];
    // 这里用于存储是默认时间还是用户传递过来的时间
    let setExpireTime;
    config.setExpireTime
      ? (setExpireTime = config.setExpireTime)
      : (setExpireTime = options.expire);
    // 判断缓存数据是否存在 存在的话 是否过期 没过期就返回
    // 返回的时时候带了个取消请求, 因为结果是从缓存里拿的
    if (data && getNowTime() - data.expire < setExpireTime) {
      config.cancelToken = new Axios.CancelToken((cancel) => {
        // cancel 函数的参数会作为 promise 的 error 被捕获
        cancel(data);
      }); // 传递结果到catch中
    }
  }
}

export function responseInterceptor(response) {
  // 返回的code === 20000 时候才会缓存下来
  if (response && response.config.cache && response.data.code === 20000) {
    let data = {
      expire: getNowTime(),
      data: response,
    };

    // 这里就是设置缓存了
    CACHES[`${generateReqKey(response.config)}`] = data;
  }
}

// 获取当前时间戳
function getNowTime() {
  return new Date().getTime();
}
