<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <el-button type="primary">
              <span class="iconfont icon-upload"></span>
              上传
            </el-button>
          </el-upload>
        </div>
        <el-button type="success" @click="newFolder">
          <span class="iconfont icon-folder-add"></span>
          新建文件夹
        </el-button>
        <el-button type="danger" :disabled="selectFileIdList.length == 0"
          @click="delFileBatch">
          <span class="iconfont icon-del"></span>
          批量删除
        </el-button>
        <el-button type="warning" :disabled="selectFileIdList.length == 0" @click="moveFolderBatch">
          <span class="iconfont icon-folder-add"></span>
          批量移动
        </el-button>
        <div class="search-panel">
          <el-input clearable placeholder="输入文件名进行搜索" v-model="fileNameFuzzy" @keyup.enter="search">
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
      </div>
      <!-- 导航 -->
      <Navigation ref="navigationRef" @navChange="navChange"></Navigation>
    </div>
    <!-- 文件列表 --> 
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

            <!-- 新增目录 -->
            <div class="edit-panel" v-if="row.showEdit">
              <el-input
                v-model.trim="row.fileNameReal"
                ref="editNameRef"
                :maxLength="190"
                @keyup.enter="saveNameEdit(index)"
              >
                <template #suffix>{{ row.fileSuffix }}</template>
              </el-input>
              <!-- √按钮，如果row.fileNameReal存在，即有输入，按钮可以按，否则，按钮值为not-allow，无法点击 -->
              <span :class="['iconfont icon-right1',row.fileNameReal?'':'not-allow']" @keyup.enter="saveNameEdit(index)" @click="saveNameEdit(index)"></span>
              <span class="iconfont icon-error" @click="cancelNameEdit(index)"></span>
            </div>

            <span class="op">
              <template v-if="row.showOp && row.fileId && row.status == 2">
                <span class="iconfont icon-share1" @click="share(row)">分享</span>
                <span class="iconfont icon-download" v-if="row.folderType==0" @click="download(row)">下载</span>
                <span class="iconfont icon-del" @click="delFile(row)">删除</span>
                <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
                <span class="iconfont icon-move" @click="moveFolder">移动</span>
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
    <!-- 目录没文件情况下： -->
    <div class="no-data" v-else>
      <div class="no-data-inner">
        <Icon iconName="no_data" :width="120" fit="fill"></Icon>
        <div class="tips">当前目录为空，上传你的第一个文件吧</div>
        <div class="op-list">
          <!-- 上传文件 -->
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
           <div class="op-item">
            <Icon iconName="file" :width="60"></Icon>
            <div>上传文件</div>
           </div>
          </el-upload>
          <!-- 新建目录 -->
          <div class="op-item" v-if="category == 'all'" @click="newFolder">
            <Icon iconName="folder" :width="60"></Icon>
            <div>新建目录</div>
          </div>
        </div>
      </div>
    </div>
    <FolderSelect ref="folderSelectRef" @folderSelect="moveFolderDone"></FolderSelect>
    <!-- 预览 -->
    <Preview ref="previewRef"></Preview>
    <!-- 分享 -->
    <FileShare ref="shareRef"></FileShare>
  </div>
</template>

<script setup>
import CategoryInfo from "@/js/CategoryInfo";
import FileShare from "./ShareFile.vue";
import {ref,reactive,getCurrentInstance,nextTick, computed} from "vue"
const {proxy} = getCurrentInstance();

//上传文件，点击后，上传，要弹框出来显示上传的文件。
//不是在这个组件中的，而是整个大页面的顶部的弹框。
//所以，这里是子组件调用父组件。要emit出去。
const emit = defineEmits(["addFile"]);
const addFile = (fileData) => {
  emit("addFile",{file:fileData.file,filePid:currentFolder.value.fileId});
};

//添加文件回调
const reload = () => {
  showLoading.value = false;
    loadDataList();
}
defineExpose({
    reload,
});

//当前目录
const currentFolder = ref({fileId:"0"});

const api = {
  loadDataList:"/file/loadDataList",
  rename:"/file/rename",
  newFoloder:"/file/newFoloder",
  getFolderInfo:"/file/getFolderInfo",
  delFile:"/file/delFile",
  changeFileFolder:"/file/changeFileFolder",
  createDownloadUrl:"/file/createDownloadUrl",
  download:"/api/file/download",
};

//用户选择上传文件时，过滤文件，拿出符合格式的文件供用户选择，提升用户体验
const fileAccept = computed(() => {
  const categoryItem = CategoryInfo[category.value];
  return categoryItem ? categoryItem.accept : "*";
});


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

//搜索
const search = () => {
  showLoading.value = true;
  loadDataList();
}

const tableData = ref({});
const tableOptions = ref({
  extHeight:50,
  selectType:"checkbox",
});

const fileNameFuzzy = ref();
const showLoading = ref(true);
const category = ref();

//加载文件列表
const loadDataList = async () => {
  let params = {
    pageNo:tableData.value.pageNo,
    pageSize:tableData.value.pageSize,
    fileNameFuzzy:fileNameFuzzy.value,
    filePid:currentFolder.value.fileId,
    category:category.value,
  };

  //如果是有分类的，比如选择了视频类，那么展现出来的就是视频，而且是直接所有
  //视频展现出来，没有分层级。
  //而没有分类的列表，会分层级展现，即会有目录的存在。
  if(params.category !== "all"){
    delete params.filePid;
  }

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

//多选
//选择的行
//Table.vue中emit出去了
//把选中的文件的id加入selectFileIdList
const selectFileIdList = ref([]);
const rowSelected = (rows) => {
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.fileId);
  });
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

//编辑行
const editing = ref(false);
const editNameRef = ref();
//新建文件夹
const newFolder = () => {
  //用户点击新建文件夹后，出现编辑框，editing为true，这时用户如果再次
  //点击新建文件夹，阻止他。
  if(editing.value){
    return;
  }

  //让其他的都不能编辑
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });

  editing.value = true;

  tableData.value.list.unshift({
    showEdit:true,
    fileType:0,
    fileId:"",
    filePid:0,
  });
  nextTick(() => {
    editNameRef.value.focus();
  });
};

const cancelNameEdit = (index) => {
  //拿到当前行文件信息
  const fileData = tableData.value.list[index];
  //如果有文件id，证明是文件，进行的是重命名操作
  if(fileData.fileId){
    fileData.showEdit = false;
  }else{  //目录
    //从表中删除该条数据
    tableData.value.list.splice(index,1);
  }
  //editing置为false
  editing.value = false;
};

//新建文件夹
const saveNameEdit = async (index) => {
  const {fileId,filePid,fileNameReal} = tableData.value.list[index];
  if(fileNameReal == "" || fileNameReal.indexOf("/") != -1){
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }

  //如果有文件id，是文件重命名操作。没有，就是新建目录操作
  let url = api.rename;
  if(fileId == ""){
    url = api.newFoloder;
  }

  let result = await proxy.Request({
    url:url,
    params:{
      fileId:fileId,
      filePid:filePid,
      fileName:fileNameReal,
    },
  });

  if(!result){
    return;
  }

  tableData.value.list[index] = result.data;
  editing.value = false;
};

//重命名
const editFileName = (index) => {
  //列表第一个文件id为空，删掉。
  //效果：用户点击了新建文件夹，但是没有输入，也没有关闭输入框，就点击了别的文件的重命名
  //     这时，输入框会消失。
  if(tableData.value.list[0].fileId == ""){
    tableData.value.list.splice(0,1);
    //因为删掉了一行，所以index应该-1
    index = index - 1;
  }
  //其他的输入框都为false
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });

  //当前行
  let currentData = tableData.value.list[index];
  //让当前行出现输入框
  currentData.showEdit = true;

  //编辑文件
  if(currentData.folderType == 0){
    currentData.fileNameReal = currentData.fileName.substring(0,currentData.fileName.indexOf("."));
    currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.indexOf("."));
  }else{
    currentData.fileNameReal = currentData.fileName;
    currentData.fileSuffix = "";
  }
  //正在编辑置为true。这时如果不取消输入框，无法进行新建目录的操作
  editing.value = true;
  nextTick(() => {
    editNameRef.value.focus();
  });
};

//删除文件
const delFile = (row) => {
  proxy.Confirm(`你确定要删除【${row.fileName}】吗？删除的文件可在10天内通过回收站还原`,
  async () => {
      let result = await proxy.Request({
        url:api.delFile,
        params:{
          fileIds:row.fileId,
        },
      });
      if(!result){
        return;
      }
      loadDataList();
    }
  )

}

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
          fileIds:selectFileIdList.value.join(","),
        },
      });
      if(!result){
        return;
      }
      loadDataList();
    }
  );
}

const currentMoveFile = ref({});
const moveFolder = (data) => {
  currentMoveFile.value = data;
  folderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
}
//批量移动
const folderSelectRef = ref();
const moveFolderBatch = () => {
  currentMoveFile.value = {};
  folderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
}

const moveFolderDone = async (folderId) => {
  //TODO：currentFolder不对，现在是0
  if(currentFolder.value.fileId == folderId){
    proxy.Message.warning("文件正在当前目录，无需移动");
    return;
  } 
  let fileIdsArray = [];
  if(currentMoveFile.value.fileId){
     fileIdsArray.push(currentMoveFile.value.fileId);
  }else{
    fileIdsArray = fileIdsArray.concat(selectFileIdList.value);
  }
  let result = await proxy.Request({
    url:api.changeFileFolder,
    params:{
      fileIds:fileIdsArray.join(","),
      filePid:folderId,
    },
  });
  if(!result){
    return;
  }
  folderSelectRef.value.close();
  loadDataList();
};

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
  previewRef.value.showPreview(data,0);

};

const navChange = (data) => {
   const {categoryId,curFolder} = data;
   currentFolder.value = curFolder;
   category.value = categoryId;
  loadDataList();
}

//下载文件
const download = async (row) => {
  let result = await proxy.Request({
    url:api.createDownloadUrl + "/" + row.fileId,
  });
  if(!result){
    return;
  }
  window.location.href = api.download + "/" + result.data;
}

//分享
const shareRef = ref();
const share = (row) => {
  shareRef.value.show(row);
}
</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
</style>