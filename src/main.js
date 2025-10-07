import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import { getFetchRate } from "./js/getUIFiles";

createApp(App).mount("#app");

(async () => {
  const { used: rateUsed, remaining: rateRemaining } = await getFetchRate();
  console.log(`Fetch Rate (${rateUsed}/${rateRemaining})`);
})();
