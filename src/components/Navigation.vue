<template>
    <!-- 头部导航 -->
  <div class="top-navigation">
    <!-- folderList.length>0 ：有进入目录，出现返回上一级链接 -->
    <template v-if="folderList.length > 0">
        <span class="back link" @click="backParent">返回上一级</span>
        <!-- 一条竖线，作分隔用 -->
        <el-divider direction="vertical"></el-divider>
    </template>
    <!-- 全部文件  当有进入目录时，全部文件是可以点击的链接，可以跳转到根目录
                  当没有进入目录，即在根目录下，全部文件是文本，无法点击跳转 
    -->
    <span v-if="folderList.length == 0" class="all-file">全部文件</span>
    <span v-if="folderList.length > 0" class="link" @click="setCurrentFolder(-1)">全部文件</span>
    <!-- folderList存放进入的文件夹id，遍历folderList，显示层级导航 -->
    <template v-for="(item,index) in folderList">
        <span class="iconfont icon-right"></span>
        <!-- 不是最后一个，也就是不是当前目录，可以跳转 -->
        <span class="link" v-if="index < folderList.length - 1" @click="setCurrentFolder(index)">
            {{ item.fileName }}
        </span>
        <!-- 最后一个，即为当前目录，只是文本，不能跳转 -->
        <span class="text" v-if="index == folderList.length - 1"> 
            {{ item.fileName }}
        </span>
    </template>
  </div>
</template>

<script setup>
import {ref,reactive,getCurrentInstance,nextTick,watch} from "vue"
const {proxy} = getCurrentInstance();
import { useRouter,useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();

const props = defineProps({
    watchPath:{
        type:Boolean,
        default:true,
    },
    shareId:{
        type:String,

    },
    adminShow:{
        type:Boolean,
        default:false,
    },
});

const api = {
    getFolderInfo:"/file/getFolderInfo",
    getFolderInfo4Share:"/showShare/getFolderInfo",
    getFolderInfo4Admin:"/admin/getFolderInfo",
};

//分类
const category = ref();
//目录集合
const folderList = ref([]);
//当前目录
const currentFolder = ref({fileId:"0"});

//初始化
const init = () => {
    folderList.value = [];
    currentFolder.value = {fileId:"0"};
    doCallback();
}

//点击目录时
const openFolder = (data) => {
    const {fileId,fileName} = data;
    const folder = {
        fileName:fileName,
        fileId:fileId,
    }
    folderList.value.push(folder);
    currentFolder.value = folder;
    setPath();
};

defineExpose({openFolder});

//返回上一级
const backParent = () => {
    let currentIndex = null;
    for(let i = 0;i < folderList.value.length;i++){
        if(folderList.value[i].fileId == currentFolder.value.fileId){
            currentIndex = i;
            break;
        }
    }
    setCurrentFolder(currentIndex - 1);
};

//点击导航设置当前目录 
const setCurrentFolder = (index) => {
    if(index == -1){
        //点击的是“全部文件”链接
        //返回全部
        currentFolder.value = {fileId:"0"};
        folderList.value = [];   
    }else{
        currentFolder.value = folderList.value[index];
        //点击了导航条中的某个目录跳转，在导航条中，应该删除该目录后面的部分。
        folderList.value.splice(index+1,folderList.value.length);
    }
    setPath();
};

//设置路径（在网址中）
const setPath = () => {
    if(!props.watchPath){
        //TODO 设置不监听路由回调方法
        doCallback();   
        return;
    }
    let pathArray = [];
    folderList.value.forEach((item) => {
        pathArray.push(item.fileId);
    });
    router.push({
        path:route.path,
        query:pathArray.length == 0 ? "" : {path:pathArray.join("/")},
    });
};

//获取当前路径的目录
const getNavigationFolder = async(path) => {
    let url = api.getFolderInfo;
    if(proxy.shareId){
        url = api.getFolderInfo4Share;
    }
    if(props.adminShow){
        url = api.getFolderInfo4Admin;
    }
    let result = await proxy.Request({
        url:url,
        showLoading:false,
        params:{
            path:path,
            shareId:props.shareId,
        },
    });
    if(!result){
        return;
    }
    folderList.value = result.data;
};

const emit = defineEmits(["navChange"]);
//回调
const doCallback = () => {
    emit("navChange",{
        categoryId:category.value,
        curFolder:currentFolder.value,
    });
};

watch(
    //监听路由
    () => route,
    (newVal,oldVal) => {
        //不监听当前路径，return
        if(!props.watchPath){
            return;
        }
        //不是在全部分类里，而是在视频、图片等分类里，是没有目录的，不用监听路径，return
        if(newVal.path.indexOf("/main")===-1 && 
           newVal.path.indexOf("/settings/fileList")===-1 &&
           newVal.path.indexOf("/share")===-1
        ){
            return;
        }
        const path = newVal.query.path; //query是参数，即？后带的内容
        category.value =  newVal.params.category;  //params是路由的内容，？前的。具体属性名是在index.js中定义的
        if(path == undefined){
            init();
        }else{
            getNavigationFolder(path);
            let pathArray = path.split("/");
            currentFolder.value = {
                fileId:pathArray[pathArray.length - 1],
            };
            doCallback();
        }
    },
    {immediate:true,deep:true}
);

</script>

<style lang="scss" scoped>
.top-navigation{
    font-size: 13px;
    display: flex;
    align-items: center;
    line-height: 40px;
    .all-file{
        font-weight: bold;
    }
    .link{
        color:#06a7ff;
        cursor: pointer;
    }
    .icon-right{
        color:#06a7ff;
        padding: 0px 5px;
        font-size: 13px;
    }
}
</style>