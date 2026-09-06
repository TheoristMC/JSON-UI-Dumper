import "./assets/main.css";

import { createApp } from "vue";
import { getFetchRate } from "./js/getUIFiles";
import App from "./App.vue";

createApp(App).mount("#app");

(async () => {
  const { remaining: rateRemaining } = await getFetchRate();
  console.log(`Remaining fetch rate:`, rateRemaining);
})();
