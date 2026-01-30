import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Naive UI
import naive from "naive-ui";

// Add FontAwesome via CDN to avoid font loading issues
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
link.crossOrigin = "anonymous";
document.head.appendChild(link);

const app = createApp(App);
app.use(router);
app.use(naive);
app.mount("#app");
