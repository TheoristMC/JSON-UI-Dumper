import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import { getFetchRate } from "./js/getUIFiles";

createApp(App).mount("#app");

(async () => {
  const { remaining: rateRemaining } = await getFetchRate();
  console.log(`Remaining fetch rate:`, rateRemaining);
})();
