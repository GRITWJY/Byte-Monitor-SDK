// import { getToken, removeToken } from "@/utils/cookie";
import Axios from "axios"; // 此处引入axios官方文件
import { addPendingRequest, removePendingRequest } from "./cancelRepeatRequest"; // 取消重复请求
import { againRequest } from "./requestAgainSend"; // 请求重发
import {
  requestInterceptor as cacheReqInterceptor,
  responseInterceptor as cacheResInterceptor,
} from "./requestCache.js"; // 缓存请求

/**
 * 功能说明
 export default {
    // 正常请求
    middleViewData: data => request.get('/jscApi/middleViewData', { data }),
    // 测试取消请求
    cancelReq: data => request.get('http://localhost:3003/jscApi/middleViewData', { data, cancelRequest: true }),
    // 测试请求重发，除了原请求外还会重发3次,就是不管出什么错都会请求重发
    reqAgainSend: data => request.get('/equ/equTypeList11', { data, retry: 3, retryDelay: 1000 }),
    // 测试缓存请求带参数：setExpireTime 为缓存有效时间ms, 一些接口，如页面的列表，如果连着刷新可能会需要很多次请求
    cacheEquList: data => request.get('/equ/equList', { data, cache: true, setExpireTime: 30000 }),
};

 * ***/

// 返回结果处理
// 自定义约定接口返回{code: xxx, data: xxx, msg:'err message'}
const responseHandle = {
  20000: (response) => {
    return response.data;
  },
  401: (response) => {
    window.location.href = window.location.origin;
  },
  default: (response) => {
    return Promise.reject(response);
  },
};

const axios = Axios.create({
  baseURL: "http://localhost:3005",
  timeout: 50000,
});

// 添加请求拦截器
axios.interceptors.request.use(
  function (config) {
    // 请求头用于接口token 认证

    // pending 中的请求，后续请求不发送（由于存放的pedingMap 的key 和参数有关，所以放在参数处理之后）
    addPendingRequest(config); // 把当前请求信息添加到pendingRequest对象中
    //  请求缓存
    cacheReqInterceptor(config, axios);
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    // 响应正常时候就从pendingRequest对象中移除请求
    removePendingRequest(response);
    // 缓存响应的结果
    cacheResInterceptor(response);
    // 返回结果
    return responseHandle[response.data.code || "default"](response);
  },
  (error) => {
    // 从pending 列表中移除请求
    console.log(error);
    // 失败后也要移除这个请求
    removePendingRequest(error.config || {});
    // 需要特殊处理请求被取消的情况
    // 如果不是取消请求导致的, 就进行重新发送
    if (!Axios.isCancel(error)) {
      // 请求重发
      return againRequest(error, axios);
    }
    // 如果是取消请求导致的, 这里就不用返回reject的了, 因为是主动取消
    if (
      Axios.isCancel(error) &&
      error.message.data &&
      error.message.data.config.cache
    ) {
      return Promise.resolve(error.message.data.data.data); // 返回结果数据
    }
    return Promise.reject(error);
  }
);
export default axios;
