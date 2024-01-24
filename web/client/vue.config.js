const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      less: {
        additionalData: `@import "@/less/console_tiles.less";`
      }
    }
  }
});
