import { createApp } from "vue";
import App from "./app.vue";
import DynamicSlot from "../index";

createApp(App).use(DynamicSlot).mount("#app");
