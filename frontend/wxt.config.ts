import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  outDir: ".output",
  manifest: {
    name: "PageLens",
    description:
      "Track Core Web Vitals, memory, FPS, long tasks and rendering issues on any web app.",
    version: "0.1.0",
    permissions: ["storage", "activeTab", "scripting", "tabs", "sidePanel"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "PageLens",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
  },
});
