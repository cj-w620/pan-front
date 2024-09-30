import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server:{
    port:1024,
    hmr:true,   //开启热更新
    proxy:{
      "/api":{
        target:"http://localhost:7090",   //请求后台接口
        changeOrigin:true,    //允许跨域
        pathRewrite:{
          "^api":"/api"   //重写请求
        }
      }
    }
  }
})
