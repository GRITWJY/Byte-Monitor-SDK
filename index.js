import error from "./lib/error";
import xhr from "./lib/xhr";
import performance from "./lib/performace";
import { setConfig } from "./config";
import behavior from "./lib/behavior";

function init(options = {}) {
  setConfig(options);

  // 错误
  error();

  // 接口
  xhr();
  // 性能
  performance();

  // 行为
  behavior();
}

export default { init };
