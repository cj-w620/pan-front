<template>
  <span class="avatar" :style="{width:width + 'px',height:width + 'px'}">
    <!-- 视频中为`${proxy.globalInfo.avatarUrl}${userId}?${timestamp}`，但我改成下面这样，头像才出的来 -->
    <!-- 这里加时间戳的作用是，当有时间戳，路径会变化，浏览器就不会去拿缓存内容，这样头像修改后，到页面，才能立马更新，而不用说去刷新页面。 -->
    <img
        :src="avatar && avatar != '' ? avatar : `${proxy.globalInfo.avatarUrl}/${userId}?${timestamp}`"
        v-if="userId"
    />
  </span>
</template>

<script setup>
import {getCurrentInstance} from "vue"
const {proxy} = getCurrentInstance();

const props = defineProps({
    userId:{
        type:String,
    },
    avatar:{
        type:String,
    },
    timestamp:{
        type:Number,
        default:0,
    },
    width:{
        type:Number,
        default:40,
    },
});
</script>

<style lang="scss" scoped>
.avatar{
    display: flex;
    width:40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    img{
        width: 100%;
        object-fit: cover;
    }
}
</style>