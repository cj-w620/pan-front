<template>
  <div class="share">
    <div class="header">
      <div class="header-content">
        <div class="logo" @click="jump">
          <span class="iconfont icon-pan"></span>
          <span class="name">Easy云盘</span>
        </div>
      </div>
    </div>
  </div>
  <div class="share-body">
    <!-- 当用户进分享页面，检查是否输入提取码需要时间，这时需要我们判断一下，如果后端接口还未返回结果，
         我们显示加载中的样式，有数据后再做跳转或展示分享页面。
         如果不这么做，那么没有输入提取码的用户，就会先看到分享页面一下，再闪一下跳转到输入提取码页面。
    -->
    <template v-if="Object.keys(shareInfo).length==0">
      <div class="loading" v-loading="Object.keys(shareInfo).length == 0"></div>
    </template>
    <template v-else>
      <div class="share-panel">
        <div class="share-user-info">
          <div class="avatar">
            <Avatar
              :userId="shareInfo.userId"
              :avatar="shareInfo.avatar"
              :width="50"
            ></Avatar>
          </div>
          <div  class="share-info">
            <div class="user-info">
              <span class="nick-name">{{ shareInfo.nickName }}</span>
              <span class="share-time">分享于：{{ shareInfo.shareTime }}</span>
            </div>
            <div class="file-name">分享文件：{{ shareInfo.fileName }}</div>
          </div>
        </div>
        <div class="share-op-btn">
          <el-button type="primary" @click="cancelShare"
            v-if="shareInfo.currentUser"
          >
          <span class="iconfont icon-cancel"></span>
          取消分享</el-button>
          <el-button v-else type="primary" @click="save2MyPan" :disabled="selectIdList.length==0">
            <span class="iconfont icon-import"></span>
            保存到我的网盘</el-button>
        </div>
      </div>
      <Navigation ref="navigationRef" @navChange="navChange" :shareId="shareId"></Navigation>
      <div class="file-list">
        <Table
          ref="dataTableRef"
          :columns="columns"
          :dataSource="tableData"
          :fetch="loadDataList"
          :initFetch="false"
          :options="tableOptions"
          @rowSelected="rowSelected"
        >
          <template #fileName="{index,row}">
            <div 
              class="file-item"
              @mouseenter="showOp(row)"
              @mouseleave="cancelShowOp(row)"
            >
              <!-- 如果是视频或图片，且要是转码完成的：展示封面 -->
              <template
                v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2"
              >
                <Icon :cover="row.fileCover" :width="32"></Icon>   
              </template>
              <!-- 普通类型，图标都在图片库中有。判断是文件还是目录，目录的话文件类型为0，文件就还是文件类型 -->
              <template v-else>
                <Icon v-if="row.folderType == 0" :fileType="row.fileType"></Icon>
                <Icon v-if="row.folderType == 1" :fileType="0"></Icon>
              </template>
              <span class="file-name" :title="row.fileName">
                <span @click="preview(row)">{{ row.fileName }}</span>
              </span>

              <span class="op" :style="{width:200 + 'px'}">
                  <span class="iconfont icon-download" v-if="row.folderType==0" @click="download(row)">下载</span>
                  <span class="iconfont icon-import" @click="save2MyPanSingle(row)"
                    v-if="row.showOp&&!shareInfo.currentUser">
                    保存到我的网盘</span>
              </span>
            </div>
          </template>
          <template #fileSize="{index,row}">
          <span v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
          </template>
        </Table>
      </div>
    </template>
    <!-- 目录选择 -->
    <FolderSelect ref="folderSelectRef" @folderSelect="save2MyPanDone"></FolderSelect>
    <Preview ref="previewRef"></Preview>
  </div>
</template>

<script setup>
import {ref,reactive,getCurrentInstance,nextTick} from "vue"
const {proxy} = getCurrentInstance();
import { useRoute,useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

const api = {
  getShareLoginInfo:"/showShare/getShareLoginInfo",
  loadFileList:"/showShare/loadFileList",
  createDownloadUrl:"/showShare/createDownloadUrl",
  download:"/api/showShare/download",
  cancelShare:"/share/cancelShare",
  saveShare:"/showShare/saveShare",
};

const shareId = route.params.shareId;
const shareInfo = ref({});
const getShareInfo = async () => {
  let result = await proxy.Request({
    url:api.getShareLoginInfo,
    showLoading:false,
    params:{
      shareId,
    },
  });
  if(!result){
    return;
  }
  //查不到，证明还没有输入过提取码，跳去输入
  if(result.data == null){
    router.push(`/shareCheck/${shareId}`);
    return; 
  }
  shareInfo.value = result.data;
};
getShareInfo();

const columns = [
  {
    label:"文件名",
    prop:"fileName",
    scopedSlots:"fileName",
  },
  {
    label:"修改时间",
    prop:"lastUpdateTime",
    width:200,
  },
  {
    label:"大小",
    prop:"fileSize",
    scopedSlots:"fileSize",
    width:200,
  },
];

const tableData = ref({});
const tableOptions = {
  extHeight:80,
  selectType:"checkbox",
};

const loadDataList = async () => {
  let params = {
    pageNo:tableData.value.pageNo,
    pageSize:tableData.value.pageSize,
    shareId:shareId,
    filePid:currentFolder.value.fileId,
  };

  let result = await proxy.Request({
    url:api.loadFileList,
    params,
  });
  if(!result){
    return;
  }
  tableData.value = result.data;
};

const showOp = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};
const cancelShowOp  = (row) => {
  row.showOp = false;
}
const selectIdList = ref([]);
const rowSelected = (rows) => {
  selectIdList.value = [];
  rows.forEach((item) => {
    selectIdList.value.push(item.fileId);
  });
};

const currentFolder = ref({fileId:"0"});
const navChange = (data) => {
  const {curFolder} = data;
  currentFolder.value = curFolder;
  loadDataList();
};

const previewRef = ref();
const navigationRef = ref();

const preview = (data) => {
  if(data.folderType == 1){
    navigationRef.value.openFolder(data);
    return;
  }
  data.shareId = shareId;
  previewRef.value.showPreview(data,2);
}

const download = async (row) => {
  let result = await proxy.Request({
    url:api.createDownloadUrl + "/" + shareId + "/" + row.fileId,
  });
  if(!result){
    return;
  }
  window.location.href = api.download + "/" + result.data;
}


//保存到我的网盘
const folderSelectRef = ref();
const save2MyPanFileIdArray = [];
const save2MyPan = () => {
  if(selectIdList.value.length == 0){
    return;
  }
  //没登录，去登录
  if(!proxy.VueCookies.get("userInfo")){
    router.push("/login?redirectUrl=" + route.path);
    return;
  }
  save2MyPanFileIdArray.value = selectIdList.value;
  folderSelectRef.value.showFolderDialog();
}
//单个保存到网盘
const save2MyPanSingle = (row) => {
  if(!proxy.VueCookies.get("userInfo")){
    router.push("/login?redirectUrl=" + route.path);
    return;
  };
  save2MyPanFileIdArray.value = [row.fileId];
  folderSelectRef.value.showFolderDialog();
};

const save2MyPanDone = async (folderId) => {
  let result = await proxy.Request({
    url:api.saveShare,
    params:{
      shareId:shareId,
      shareFileIds:save2MyPanFileIdArray.value.join(","),
      myFolderId:folderId,
    }
  })
  if(!result){
    return;
  }
  loadDataList();
  proxy.Message.success("保存成功");
  folderSelectRef.value.close();
};

//取消分享
const cancelShare = () => {
  proxy.Confirm(`你确定要取消分享吗？`,async () => {
    let result = await proxy.Request({
      url:api.cancelShare,
      params:{
        shareIds:shareId,
      },
    });
    if(!result){
      return;
    };
    proxy.Message.success("取消分享成功");
    router.push("/");
  })
};

const jump = () => {
  router.push("/");
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
.header{
  width:100%;
  position: fixed;
  background: #0c95f7;
  height: 50px;
  .header-content{
    width: 70%;
    margin: 0px auto;
    color: #fff;
    line-height: 50px;
    .logo{
      display: flex;
      align-items: center;
      cursor: pointer;
      .icon-pan{
        font-size: 40px;
      }
      .name{
        font-weight: bold;
        margin-left: 5px;
        font-size: 25px;
      }
    }
  }
}
.share-body{
  width: 70%;
  margin: 0px auto;
  padding-top: 50px;
  .loading{
    height: calc(100vh / 2);
    width: 100%;
  }
  .share-panel{
    margin-top: 20px;
    display: flex;
    justify-content: space-around;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
    .share-user-info{
      flex: 1;
      display: flex;
      align-items: center;
      .avatar{
        margin-right: 5px;
      }
      .share-info{
        .user-info{
          display: flex;
          align-items: center;
          .nick-name{
            font-size: 15px;
          }
          .share-time{
            margin-left: 20px;
            font-size: 12px;
          }
        }
        .file-name{
          margin-top: 10px;
          font-size: 12px;
        }
      }
    }
  }
}

.file-list{
  margin-top: 10px;
  .file-item{
    .op{
      width: 170px;
    }
  }
}
</style>