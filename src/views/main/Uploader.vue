<template>
  <div class="uploader-panel">
    <div class="uploader-title">
      <span>上传任务</span>
      <span class="tips">（仅展示本次上传任务）</span>
    </div>
    <!-- 文件列表 -->
    <div class="file-list">
      <!-- 每个文件 -->
      <div v-for="(item, index) in fileList" class="file-item">
        <!-- 上传面板 -->
        <div class="upload-panel">
          <!-- 文件名 -->
          <div class="file-name">
            {{ item.fileName }}
          </div>
          <!-- 上传进度条 -->
          <div class="progress">
            <el-progress
              :percentage="item.uploadProgress"
              v-if="
                item.status == STATUS.uploading.value ||
                item.status == STATUS.upload_seconds.value ||
                item.status == STATUS.upload_finish.value
              "
            >
            </el-progress>
          </div>
          <!-- 上传状态 -->
          <div class="upload-status">
            <!-- 图标 -->
            <span
              :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
              :style="{ color: STATUS[item.status].color }"
            ></span>
            <!-- 状态描述 -->
            <span class="status" :style="{ color: STATUS[item.status].color }">
              {{
                item.status == "fail" ? item.errorMsg : STATUS[item.status].desc
              }}
            </span>
            <!-- 上传中 （上传进度 xxM/xxxM）-->
            <span
              class="upload-info"
              v-if="item.status == STATUS.uploading.value"
            >
              {{ proxy.Utils.size2Str(item.uploadSize) }} /
              {{ proxy.Utils.size2Str(item.totalSize) }}
            </span>
          </div>
        </div>
        <div class="op">
        <!-- MD5 -->
        <el-progress
          type="circle"
          :width="50"
          :percentage="item.md5Progress"
          v-if="item.status == STATUS.init.value"
        ></el-progress>
        <!-- 操作按钮 -->
        <div class="op-btn">
          <!-- 上传中 -->
          <span v-if="item.status === STATUS.uploading.value">
            <!-- 暂停时出现“上传”图标 -->
            <Icon 
                :width="28" 
                class="btn-item" 
                iconName="upload"
                v-if="item.pause" 
                title="上传"
                @click="startUpload(item.uid)"
            ></Icon>
            <!-- 上传时出现“暂停”图标 -->
            <Icon
                v-else
                :width="28" 
                class="btn-item" 
                iconName="pause"
                title="暂停"
                @click="pauseUpload(item.uid)"
            ></Icon>
          </span>
          <!-- 删除按钮 解析时、上传完成后，都不需要删除，这时如果不想要，就是清除操作了。 -->
          <Icon
                :width="28" 
                class="del btn-item" 
                iconName="del"
                title="删除"
                v-if="
                    item.status != STATUS.init.value &&
                    item.status != STATUS.upload_finish.value &&
                    item.status != STATUS.upload_seconds.value
                "
                @click="delUpload(item.uid,index)"
            ></Icon>
            <!-- 清除按钮 -->
            <Icon
                :width="28" 
                class="clean btn-item" 
                iconName="clean"
                title="清除"
                v-if="
                    item.status == STATUS.upload_finish.value ||
                    item.status == STATUS.upload_seconds.value
                "
                @click="delUpload(item.uid,index)"
            ></Icon>
        </div>
      </div>
      </div>
      <!-- 没有文件时，显示：暂无上传任务 -->
      <div v-if="fileList.length == 0">
        <NoData msg="暂无上传任务"></NoData>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from "vue";
const { proxy } = getCurrentInstance();
import SparkMD5 from "spark-md5";

const api = {
  upload:"/file/uploadFile",
}

const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#F75000",
    icon: "close",
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#F75000",
    icon: "close",
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#e6a23c",
    icon: "clock",
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#409eff",
    icon: "upload",
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#67c23a",
    icon: "ok",
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "秒传",
    color: "#67c23a",
    icon: "ok",
  },
};
//分片大小 5M
const chunkSize = 1024 * 1024 * 5;

const delList = ref([]);
const fileList = ref([]);
const addFile = async (file, filePid) => {
  const fileItem = {
    //文件，文件大小，文件流，文件名...
    file: file,
    //文件UID
    uid: file.uid,
    //md5进度
    md5Progress: 0,
    //md5值
    md5: null,
    //文件名
    fileName: file.name,
    //上传状态
    status: STATUS.init.value,
    //已上传文件大小
    uploadSize: 0,
    //文件总大小
    totalSize: file.size,
    //上传进度
    uploadProgress: 0,
    //暂停
    pause: false,
    //当前分片
    chunkIndex: 0,
    //文件父级ID
    filePid: filePid,
    //错误信息
    errorMsg: null,
  };
  //让fileItem在fileList最顶端
  //unshift()：在数组头部添加内容
  fileList.value.unshift(fileItem);
   
  //文件为空
  if(fileItem.totalSize == 0){
    fileItem.status = STATUS.emptyfile.value;
    return;
  }

  //md5
  let md5FileUid = await computeMd5(fileItem);
  if(md5FileUid == null){
    return;
  } 

  //上传文件
  uploadFile(md5FileUid);
};

defineExpose({ addFile });

//计算Md5
const computeMd5 = (fileItem) => {
  let file = fileItem.file;
  let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  //分片数，向上取整
  let chunks = Math.ceil(file.size / chunkSize);
  //当前分片
  let currentChunk = 0;
  let spark = new SparkMD5.ArrayBuffer();
  let fileReader = new FileReader();

  let loadNext = () => {
    let start = currentChunk * chunkSize;   //开始节点
    //每个分片是5M，到最后一分片时，可能是小于5M的，这时如果再加5M，就会超出文件大小，报错
    //所以当开始节点加上分片大小大于文件大小时，结束节点就是文件大小了。
    let end = start + chunkSize >= file.size ? file.size : start + chunkSize; //结束节点
    //开读
    fileReader.readAsArrayBuffer(blobSlice.call(file,start,end));
  }

  loadNext();

  return new Promise((resolve,reject) => {
    let resultFile = getFileByUid(file.uid);
    fileReader.onload = (e) => {
      spark.append(e.target.result);
      currentChunk++;
      if(currentChunk < chunks){  //不是最后一片
        console.log(
          `${file.name},第${currentChunk}分片解析完成，开始第${currentChunk + 1}`
        );
        //进度条
        let percent = Math.floor((currentChunk / chunks) * 100);
        resultFile.md5Progress = percent;
        //递归去跑
        loadNext();
      }else{  //最后一片
        let md5 = spark.end();  //拿到md5值
        spark.destroy();
        resultFile.md5Progress = 100; //进度拉满
        resultFile.status = STATUS.uploading.value; //解析完毕了，状态改为上传中。
        resultFile.md5 = md5; //设置md5值
        resolve(fileItem.uid);
      }
    };

    fileReader.onerror = () => {
      resultFile.md5Progress = -1;
      resultFile.status = STATUS.fail.value;
      resolve(fileItem.uid);
    }
  }).catch((error) => {
    return null;
  });
};

//获取文件
const getFileByUid = (uid) => {
  let file = fileList.value.find(item => {
    return item.file.uid === uid;
  })
  return file;
};

const emit = defineEmits(["uploadCallback"]);
//上传文件
//chunkIndex，分片下标，用于用户上传时暂停，再次上传，我们知道该从哪片开始上传
const uploadFile = async (uid,chunkIndex) => {
  //chunkIndex是否存在，不存在取0
  chunkIndex = chunkIndex ? chunkIndex : 0;
  //分片上传
  let currentFile = getFileByUid(uid);
  const file = currentFile.file;
  const fileSize = currentFile.totalSize;
  const chunks = Math.ceil(fileSize / chunkSize);
  for(let i = chunkIndex;i < chunks;i++){
    //在分片上传过程中，用户删除了该操作，就中止上传
    //具体操作是：拿当前文件id去删除列表找，如果找到了，就是用户删除了该操作
    //indexOf() 返回-1，证明没找到
    //注意：在某一分片上传时，删除，要等到该分片上传完，到下一分片才会中止操作。
    let delIndex = delList.value.indexOf(uid);
    if(delIndex != -1){ //找到了
      //删除
      delList.value.splice(delIndex,1);
      break;
    }
    currentFile = getFileByUid(uid);
    if(currentFile.pause){
      break;
    }

    let start = i * chunkSize;
    let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
    let chunkFile = file.slice(start,end);
    //TODO：其实这里应该是uploadResult吧。。。先跟视频写了
    let updateResult = await proxy.Request({
      url:api.upload,
      showLoading:false,
      dataType:"file",
      params:{
        file:chunkFile,
        fileName:file.name,
        fileMd5:currentFile.md5,
        chunkIndex:i,
        chunks:chunks,
        fileId:currentFile.fileId,
        filePid:currentFile.filePid,
      },
      showError:false,
      errorCallback:(errorMsg) => {
        currentFile.status = STATUS.fail.value;
        currentFile.errorMsg = errorMsg;
      },
      uploadProgressCallback:(event) => {
        let loaded = event.loaded;
        if(loaded > fileSize){
          loaded = fileSize;
        }
        currentFile.uploadSize = i * chunkSize + loaded;
        currentFile.uploadProgress = Math.floor((currentFile.uploadSize / fileSize) * 100);
      },
    });

    if(updateResult == null){
      break;
    }

    currentFile.fileId = updateResult.data.fileId;
    currentFile.status = STATUS[updateResult.data.status].value;
    currentFile.chunkIndex = i;
    if(updateResult.data.status == STATUS.upload_seconds.value ||
      updateResult.data.status == STATUS.upload_finish.value
    ){
      currentFile.uploadProgress = 100;
      emit("uploadCallback");
      break;
    }
  }
};
</script>

<style lang="scss" scoped>
.uploader-panel {
  .uploader-title {
    border-bottom: 1px solid #ddd;
    line-height: 40px;
    padding: 0px 10px;
    font-size: 15px;
    .tips {
      font-size: 13px;
      color: rgb(169, 169, 169);
    }
  }
  .file-list {
    overflow: auto;
    padding: 10px 0px;
    min-height: calc(100vh / 2);
    max-height: calc(100vh - 120px);
    .file-item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3px 10px;
      background-color: #fff;
      border-bottom: 1px solid #ddd;
    }
    .file-item:nth-child(even) {
      background-color: #fcf8f4;
    }
    .upload-panel {
      flex: 1;
      .file-name {
        color: rgb(64, 62, 62);
      }
      .upload-status {
        display: flex;
        align-items: center;
        margin-top: 5px;
        .iconfont {
          margin-right: 3px;
        }
        .status {
          color: red;
          font-size: 13px;
        }
        .upload-info {
          margin-left: 5px;
          font-size: 12px;
          color: rgb(112, 111, 111);
        }
      }
      .progress {
        height: 10px;
      }
    }
    .op {
      width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .op-btn {
        .btn-item {
          cursor: pointer;
        }
        .del,
        .clean {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>