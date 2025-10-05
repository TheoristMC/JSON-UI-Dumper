import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import { Octokit } from "octokit";

createApp(App).mount("#app");

console.log("Token exist:", !!import.meta.env.VITE_GITHUB_TOKEN);

(async () => {
  const OctoInit = new Octokit({
    auth: import.meta.env.VITE_GITHUB_TOKEN,
  });

  const rate = await OctoInit.request("GET /rate_limit");
  console.log("Rate Limit:", rate.data.rate);
})();
