import Vue from "vue";
import Router from "vue-router";
const Home = () => import("../views/Home");
const About = () => import("../views/About");
const test = () => import("../views/test/text");

Vue.use(Router);
export default new Router({
  // history: createWebHashHistory(),
  routes: [
    {
      path: "/home",
      component: Home,
    },
    {
      path: "/about",
      name: "about",
      component: About,
      children: [
        {
          path: "a",
          component: test,
        },
      ],
    },
  ],
});
