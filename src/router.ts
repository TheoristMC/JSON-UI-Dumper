import { createRouter, createWebHistory } from "vue-router";

import Content from "./views/Content.vue";
import Home from "./views/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/content", name: "content", component: Content },
  ],
});

export default router;
