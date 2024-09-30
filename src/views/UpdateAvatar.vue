<template>
  <div>
    <Dialog
      :show="dialogConfig.show"
      :title="dialogConfig.title"
      :buttons="dialogConfig.buttons"
      width="500px"
      :showCancel="false"
      @close="dialogConfig.show = false">
        <el-form
            :model="formData"
            :rules="rules"
            ref="formDataRef"
            label-width="80px"
            @submit.prevent
        >
            <el-form-item label="昵称">
                {{ formData.nickName }}
            </el-form-item>
            <el-form-item label="头像" prop="">
                <AvatarUpload v-model="formData.avatar"></AvatarUpload>
            </el-form-item>
        </el-form>
    </Dialog>

  </div>
</template>

<script setup>
import AvatarUpload from "@/components/AvatarUpload.vue";
import {ref,reactive,getCurrentInstance,nextTick} from "vue"
const {proxy} = getCurrentInstance();

const api = {
    updateUserAvatar:"updateUserAvatar", 
}

const formData = ref({});
const formDataRef = ref();



const show = (data) => {
    formData.value = Object.assign({},data);
    formData.value.avatar = {userId:data.userId,qqAvatar:data.avatar};
    dialogConfig.value.show = true;
}

defineExpose({show});

const dialogConfig = ref({
    show:false,
    title:"修改头像",
    buttons:[
        {
            type:"primary",
            text:"确定",
            click:(e)=>{
                submitForm();
            },
        },
    ],
});

const emit = defineEmits();
const submitForm = async () => {
    //不是文件。当只是点击了修改头像，让弹框出来，但是没有选择文件，这时的avatar也不是文件，应该是空值。
    if(!(formData.value.avatar instanceof File)){
        dialogConfig.value.show = false;
        return;
    }

    let result = await proxy.Request({
        url:api.updateUserAvatar,
        params:{
            avatar:formData.value.avatar,
        },
    });
    if(!result){
        return;
    }
    dialogConfig.value.show = false;
    //更新cookie
    const cookieUserInfo = proxy.VueCookies.get("userInfo");
    delete cookieUserInfo.avartar;
    proxy.VueCookies.set("userInfo",cookieUserInfo,0);
    //让外面知道我们更新了。
    emit("updateAvatar");
}

</script>

<style lang="scss" scoped>
</style>