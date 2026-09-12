import { createApp } from "vue";
import "./assets/main.css";

import App from "./App.vue";
import Metadata from "./services/getMetadata.ts";

createApp(App).mount("#app");

(async () => {
  const rate = await Metadata.getRate();
  console.log("Rate remaining:", rate);
})();
