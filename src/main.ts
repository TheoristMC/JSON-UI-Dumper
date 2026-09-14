import { createApp } from "vue";
import "./assets/main.css";

import App from "./App.vue";
import Metadata from "./services/getMetadata.ts";
import router from "./router.ts";

const app = createApp(App);
app.use(router);
app.mount("#app");

(async () => {
  const rate = await Metadata.getRate();
  console.log("Rate remaining:", rate);
})();
