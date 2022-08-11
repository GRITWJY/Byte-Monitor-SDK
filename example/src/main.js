import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import monitor from "../../index";

Vue.config.productionTip = false;
monitor.init({
  version: "01.39303",
  appId: "v93nfj3jdok20fdj3od",
  vue: {
    Vue,
    router,
  },
});

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
