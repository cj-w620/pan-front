<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="search-panel">
          <el-input clearable placeholder="输入文件名进行搜索" v-model="fileNameFuzzy" @keyup.enter="search">
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
        <el-button type="danger" @click="delFileBatch" :style="{'margin-left':'10px'}" :disabled="selectFileIdList.length == 0">
          <span class="iconfont icon-del"></span>
          批量删除</el-button>
      </div>
      <!-- 导航 -->
      <Navigation ref="navigationRef" @navChange="navChange"></Navigation>
    </div>
    <div class="file-list" v-if="tableData.list && tableData.list.length > 0">
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
            <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
              <span @click="preview(row)">{{ row.fileName }}</span>
              <span v-if="row.status == 0" class="transfer-status">转码中</span>
              <span v-if="row.status == 1" class="transfer-status transfer-fail">转码失败</span>
            </span>

            <span class="op">
              <template v-if="row.showOp && row.fileId && row.status == 2">
                <span class="iconfont icon-download" v-if="row.folderType==0" @click="download(row)">下载</span>
                <span class="iconfont icon-del" @click="delFile(row)">删除</span>
              </template>
            </span>
          </div>
        </template>
        <!-- 文件大小 -->
        <template #fileSize="{index,row}">
          <span v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
        </template>
      </Table>
    </div>
    <!-- 预览 -->
    <Preview ref="previewRef"></Preview>
  </div>
</template>

<script setup>
import {ref,reactive,getCurrentInstance,nextTick} from "vue"
const {proxy} = getCurrentInstance();

const api = {
  loadDataList:"/admin/loadFileList",
  delFile:"/admin/delFile",
  createDownloadUrl:"/admin/createDownloadUrl",
  download:"/api/admin/download",
};

const columns = [
  {
    label:"文件名",
    prop:"fileName",
    scopedSlots:"fileName",
  },
  {
    label:"发布人",
    prop:"nickName",
    width:250,
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

//搜索
const search = () => {
  showLoading.value = true;
  loadDataList();
};


//多选
const selectFileIdList = ref([]);
const rowSelected = (rows) => {
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.userId + "_" + item.fileId);
  });
};


const fileNameFuzzy = ref();
const showLoading = ref(true);

const tableData = ref({});
const tableOptions = ref({
  extHeight:50,
  selectType:"checkbox",
});
//加载文件列表
const loadDataList = async () => {
  let params = {
    pageNo:tableData.value.pageNo,
    pageSize:tableData.value.pageSize,
    fileNameFuzzy:fileNameFuzzy.value,
    filePid:currentFolder.value.fileId,
  };

  let result = await proxy.Request({
    url:api.loadDataList,
    showLoading:showLoading.value,
    params:params,
  });
  if(!result){
    return;
  }
  tableData.value = result.data;
};

//展示操作按钮
const showOp = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};

const cancelShowOp = (row) => {
  row.showOp = false;
}

//预览
const navigationRef = ref();
const previewRef = ref();
const preview = (data) => {
  //目录
  if(data.folderType == 1){
    navigationRef.value.openFolder(data);
    return;
  }
  //文件
  //转码中的不能预览
  if(data.status != 2){
    proxy.Message.warning("文件未完成转码,无法预览");
    return;
  }
  previewRef.value.showPreview(data,1);

};

//目录
const currentFolder = ref({fileId:0});
const navChange = (data) => {
  const {curFolder} = data;
  currentFolder.value = curFolder;
  showLoading.value = true;
  loadDataList();
};

//删除文件
const delFile = (row) => {
  proxy.Confirm(`你确定要删除【${row.fileName}】吗？删除的文件可在10天内通过回收站还原`,
  async () => {
      let result = await proxy.Request({
        url:api.delFile,
        params:{
          fileIdAndUserIds:row.userId + "_" + row.fileId,
        },
      });
      if(!result){
        return;
      }
      loadDataList();
    }
  )
};

//批量删除
const delFileBatch = () => {
  if(selectFileIdList.value.length == 0){
    return;
  }
  proxy.Confirm(`你确定要删除这些文件吗？删除的文件可在10天内通过回收站还原`,
    async () => {
      let result = await proxy.Request({
        url:api.delFile,
        params:{
          fileIdAndUserIds:selectFileIdList.value.join(","),
        },
      });
      if(!result){
        return;
      }
      loadDataList();
    }
  );
}

const download = async (row) => {
  let result = await proxy.Request({
    url:api.createDownloadUrl + "/" + row.userId + "/" + row.fileId,
  });
  if(!result){
    return;
  }
  window.location.href = api.download + "/" + result.data;
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
.search-panel{
  margin-left: 0px !important;
}
.file-list{
  margin-top: 10px;
  .file-item{
    .op{
      width:120px;
    }
  }
}
</style>