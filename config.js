let userAgent = require("user-agent");
let crypto = require("crypto");

const config = {
  appId: "",
  page: "",
  timeStamp: Date.now(),
  userAgent: userAgent.parse(navigator.userAgent),
  screen: `${window.screen.width * window.devicePixelRatio} * ${
    window.screen.height * window.devicePixelRatio
  }`,
  vue: {
    Vue: null,
    router: null,
  },
};

export default config;

export function setConfig(options) {
  for (const key in config) {
    if (options[key]) {
      config[key] = options[key];
    }
  }
}

export function genkey(secret, length = 32) {
  return crypto
    .createHash("sha256")
    .update(String(secret))
    .digest("base64")
    .substr(0, length);
}

export function getConfig() {
  let obj = { ...config };
  delete obj.vue;
  return obj;
}
