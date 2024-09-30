<template>
  <div class="image-viewer"></div>
  <el-image-viewer 
    :initial-index="previewImgIndex"
    hide-on-click-modal
    :url-list="imageList"
    @close="closeImgViewer"
    v-if="previewImgIndex != null"
  >

  </el-image-viewer>
</template>

<script setup>
import {ref,reactive,getCurrentInstance,nextTick} from "vue"
const {proxy} = getCurrentInstance();

const props = defineProps({
    imageList:{
        type:Array,
    },
});

const previewImgIndex = ref(null);
const show = (index) => {
    //stopScroll();
    previewImgIndex.value = index;
}
defineExpose({show});

const closeImgViewer = () => {
    //startScroll();
    previewImgIndex.value = null;
};

//页面滚动条在外部的，需要有这两个方法，当打开图片预览时，滚动条会隐藏，关闭预览后，滚动条会显示。
/*const stopScroll = () => {
    document.body.style.overflow = "hidden";
};

const startScroll = () => {
    document.body.style.overflow = "auto";
}
*/
</script>

<style lang="scss" scoped>
.image-viewer{
    .el-image-viewer__mask{
        opacity: 0.7;
    }
}
</style>