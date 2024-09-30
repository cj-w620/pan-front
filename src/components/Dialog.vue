<template>
  <div>
    <!--     dialog组件
     属性
       draggable：为 Dialog 启用可拖拽功能	
       model-value / v-model：是否显示 Dialog
       close-on-click-modal：是否可以通过点击 modal 关闭 Dialog
       top：dialog CSS 中的 margin-top 值，默认为 15vh
       width：对话框的宽度，默认值为 50%
     事件
       close：Dialog 关闭的回调
    
    -->
       
    <el-dialog
      :show-close="showClose"
      :draggable="true"
      :model-value="show"
      :close-on-click-modal="false"
      :title="title"
      class="cust-dialog"
      :top="top + 'px'"
      :width="width"
      @close="close"
    >
      <!-- ???? style格式不一样？ -->
      <div
        class="dialog-body"
        :style="{ 'max-height': maxHeight + 'px', padding: padding + 'px' }"
      >
        <slot></slot>
      </div>

      <template v-if="(buttons && buttons.length > 0) || showCancel">
        <div class="dialog-footer">
          <el-button link @click="close" v-if="showCancel"> 取消 </el-button>
         <!-- :key在视频里是没有的，但我这个检验报错，所以加上了，看着key应该是btn -->
          <el-button    
            v-for="btn in buttons"
            :key="btn"      
            :type="btn.type || 'primary'"
            @click="btn.click"
          >
            {{ btn.text }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const props = defineProps({
    title:{
        type: String,
    },
    show:{
        type:Boolean,
        default:false,
    },
    showClose:{
        type:Boolean,
        default:true,
    },
    showCancel:{
        type:Boolean,
        default:true,
    },
    top:{
        type:Number,
        default:50,
    },
    width:{
        type:String,
        default:"30%",
    },
    buttons:{
        type:Array,
    },
    padding:{
        type:Number,
        default:15,
    },
});

const maxHeight = window.innerHeight - props.top - 100;

const emit = defineEmits();
const close = () => {
    emit("close");
};
</script>

<style lang="scss">
.cust-dialog{
    margin: 30px auto 10px !important;
    .el-dialog__body{
        padding:0px;
    }
    .dialog-body{
        border-top: 1px solid #ddd;
        border-bottom: 1px splid #ddd;
        min-height: 80px;
        overflow:auto;
    }
    .dialog-footer{
        text-align: right;
        padding: 5px 20px;
    }
}
</style>