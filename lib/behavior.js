// 路由跳转, vue 写的话就用路由来记录PV数和页面跳转
import tracker from "../utils/tracker";
import config from "../config";

export default function () {
  // 监听页面跳转
  // PV量通过页面跳转的数量来统计
  // if (config.vue?.router) {
  //   onVueRouterPage(config.vue.router);
  // }
  // 用户的点击行为
  onClick();

  // pageChange();/**/
}

function onClick() {
  ["mousedown", "touchstart"].forEach((eventType) => {
    let timer;
    window.addEventListener(eventType, (event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const target = event.target;
        const { top, left } = target.getBoundingClientRect();

        tracker.send({
          top,
          left,
          eventType,
          pageHeight:
            document.documentElement.scrollHeight || document.body.scrollHeight,
          scrollTop:
            document.documentElement.scrollTop || document.body.scrollTop,
          category: "behavior",
          subType: "click",
          target: target.tagName,
          paths: event.path?.map((item) => item.tagName).filter(Boolean),
          outerHTML: target.outerHTML,
          innerHTML: target.innerHTML,
          width: target.offsetWidth,
          height: target.offsetHeight,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        });
      }, 500);
    });
  });
}

function onVueRouterPage(router) {
  router.beforeEach((to, from, next) => {
    const data = {
      params: to.params,
      query: to.query,
    };

    tracker.send({
      data,
      name: to.name || to.path,
      startTime: performance.now(),
      from: from.fullPath,
      to: to.fullPath,
      type: "vue-change",
    });
    next();
  });
}

// 否则就用 hash 和 history 记录跳转
// function pageChange() {
//   let from = "";
//   window.addEventListener(
//     "popstate",
//     () => {
//       const to = window.location.href;
//
//       tracker.send({
//         from,
//         to,
//         type: "history-change",
//         subType: "popstate",
//         startTime: performance.now(),
//       });
//
//       from = to;
//     },
//     true
//   );
//
//   let oldURL = "";
//   window.addEventListener(
//     "hashchange",
//     (event) => {
//       const newURL = event.newURL;
//
//       tracker.send({
//         type: "hash-change",
//         from: oldURL,
//         to: newURL,
//         startTime: performance.now(),
//       });
//
//       oldURL = newURL;
//     },
//     true
//   );
// }
