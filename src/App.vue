<template>
  <el-config-provider :locale="locale" :message="config">
    <router-view></router-view>
  </el-config-provider>
</template>

<script setup>
import {reactive} from "vue";
//注：这里跟视频不一样，视频是：import zhCn from "element-plus/lib/locale/lang/zh-cn";
//因为我用lib一直报错，然后换成了es。
import zhCn from "element-plus/es/locale/lang/zh-cn";
const locale = zhCn;
const config = reactive({
  max:1,
});
</script>

<style lang="scss" scoped>
</style>