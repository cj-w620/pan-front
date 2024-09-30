<template>
  <div class="login-body">
    <!-- 左面图标 -->
    <div class="bg"></div>
    <!-- 登录面板 -->
    <div class="login-panel">
      <el-form
        class="login-register"
        :model="formData"
        :rules="rules"
        ref="formDataRef"
        @submit.prevent
      >
        <div class="login-title">Easy云盘</div>
        <!-- input输入 -->
        <!-- 邮箱 -->
        <el-form-item prop="email">
          <!-- clearable：一键清除 -->
          <el-input
            size="large"
            clearable
            placeholder="请输入邮箱"
            v-model.trim="formData.email"
            maxlength="150"
          >
            <template #prefix>
              <span class="iconfont icon-account"></span>
            </template>
          </el-input>
        </el-form-item>
        <!-- 登录密码 -->
        <el-form-item prop="password" v-if="opType == 1">
          <!-- show-password：显示隐藏密码 -->
          <el-input
            type="password"
            size="large"
            placeholder="请输入密码"
            v-model.trim="formData.password"
            show-password
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>

        <!-- 注册 -->
        <div v-if="opType == 0 || opType == 2">
          <el-form-item prop="emailCode">
            <div class="send-email-panel">
              <el-input
                size="large"
                placeholder="请输入邮箱验证码"
                v-model.trim="formData.emailCode"
              >
                <template #prefix>
                  <span class="iconfont icon-checkcode"></span>
                </template>
              </el-input>
              <el-button class="send-mail-btn" type="primary" size="large" @click="getEmailCode">
                获取验证码
              </el-button>
            </div>

            <el-popover placement="left" :width="500" trigger="click">
              <div>
                <p>1、在垃圾箱中查找邮箱验证码</p>
                <p>2、在邮箱中头像->设置->反垃圾->白名单->设置邮件地址白名单</p>
                <p>3、将邮箱【2637753673@qq.com】添加到白名单</p>
              </div>
              <template #reference>
                <span class="a-link" :style="{ 'font-size': '14px0' }"
                  >未收到邮箱验证码？</span
                >
              </template>
            </el-popover>
          </el-form-item>

          <!-- 昵称 -->
          <el-form-item prop="nickName" v-if="opType == 0">
            <el-input
              size="large"
              placeholder="请输入昵称"
              v-model.trim="formData.nickName"
              maxlength="20"
            >
              <template #prefix>
                <span class="iconfont icon-account"></span>
              </template>
            </el-input>
          </el-form-item>

          <!-- 注册密码，找回密码 -->
          <el-form-item prop="registerPassword">
            <el-input
              type="password"
              size="large"
              placeholder="请输入密码"
              v-model.trim="formData.registerPassword"
            >
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
          <!-- 重复密码 -->
          <el-form-item prop="reRegisterPassword">
            <el-input
              type="password"
              size="large"
              placeholder="请再次输入密码"
              v-model.trim="formData.reRegisterPassword"
            >
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 验证码 -->
        <el-form-item prop="checkCode">
          <div class="check-code-panel">
            <!-- 输入框 -->
            <el-input
              size="large"
              placeholder="请输入验证码"
              v-model.trim="formData.checkCode"
              @keyup.enter="doSubmit"
            >
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <!-- 验证码图片 -->
            <img
              :src="checkCodeUrl"
              class="check-code"
              @click="changeCheckCode(0)"
            />
          </div>
        </el-form-item>

        <!-- 底下跳转链接 -->
        <!-- 登录状态 -->
        <!-- 记住我、忘记密码、没有账号 -->
        <el-form-item v-if="opType == 1">
          <div class="rememberme-panel">
            <el-checkbox v-model="formData.rememberMe">记住我</el-checkbox>
          </div>
          <div class="no-account">
            <a href="javascript:void(0)" class="a-link" @click="showPanel(2)"
              >忘记密码？</a
            >
            <a href="javascript:void(0)" class="a-link" @click="showPanel(0)"
              >没有账号？</a
            >
          </div>
        </el-form-item>

        <!-- 忘记密码状态 -->
        <el-form-item v-if="opType == 2">
          <a href="javascript:void(0)" class="a-link" @click="showPanel(1)"
            >去登录？</a
          >
        </el-form-item>
        <!-- 注册状态 -->
        <el-form-item v-if="opType == 0">
          <a href="javascript:void(0)" class="a-link" @click="showPanel(1)"
            >已有帐号？</a
          >
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button type="primary" class="op-btn" size="large" @click="doSubmit">
            <span v-if="opType==0">注册</span>
            <span v-if="opType==1">登录</span>
            <span v-if="opType==2">重置密码</span>
          </el-button>
        </el-form-item>
        <div class="login-btn-qq" v-if="opType == 1">
          快捷登录  <img src="@/assets/qq.jpg" @click="qqLogin" />
        </div>
      </el-form>
    </div>

    <Dialog
      :show="dialogConfig4sendMailCode.show"
      :title="dialogConfig4sendMailCode.title"
      :buttons="dialogConfig4sendMailCode.buttons"
      width="500px"
      :showCancel="false"
      @close="dialogConfig4sendMailCode.show = false">

      <el-form :model="formData4SendMailCode" :rules="rules" ref="formData4SendMailCodeRef" label-width="80px" @submit.prevent>
        <el-form-item label="邮箱">
          {{ formData.email }}
        </el-form-item>
        <el-form-item label="验证码" prop="checkCode">
        <div class="check-code-panel">
            <!-- 输入框 -->
            <el-input
              size="large"
              placeholder="请输入验证码"
              v-model.trim="formData4SendMailCode.checkCode"
            >
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <!-- 验证码图片 -->
            <img
              :src="checkCode4SendMailCode"
              class="check-code"
              @click="changeCheckCode(1)"
            />
          </div>
      </el-form-item>
      </el-form>

      


    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, onMounted } from "vue";
import { useRoute,useRouter } from "vue-router";
import md5 from "js-md5";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();

//因为checkCode没有走request，所以需要手动加前缀/api。
//而sendEmailCode是走request的，Request.js中规定了baseUrl为'/api',所以这里不用加了。
const api = {
  checkCode: "/api/checkCode",
  sendEmailCode:"/sendEmailCode",
  register:"/register",
  login:"/login",
  resetPwd:"/resetPwd",
  qqlogin:"/qqlogin",

};

//操作类型 0：注册 1：登录 2：重置密码
//默认值为1.登录
const opType = ref(1);

const showPanel = (type) => {
  opType.value = type;
  resetForm();
};

onMounted(() => {
  showPanel(1);
});

//校验重复密码是否与初始密码一样
const checkRePassword = (rule,value,callback) => {
  if(value !== formData.value.registerPassword){
    callback(new Error(rule.message));
  }else{
    callback();
  }
};

//rules
const rules = {
  email: [
    {required: true, message: "请输入正确的邮箱" },
    {validator:proxy.Verify.email, message:"请输入正确的邮箱格式"}
  ],
  password:[{required:true, message:"请输入密码"}],
  emailCode:[{required:true, message:"请输入邮箱验证码"}],
  nickName:[{required:true, message:"请输入昵称"}],
  registerPassword: [
    {required: true, message: "请输入密码" },
    {validator:proxy.Verify.password, message:"密码只能由数字、字母、特殊字符组成,长度为8-18位"}
  ],
  reRegisterPassword: [
    {required: true, message: "请再次输入密码" },
    {validator:checkRePassword, message:"两次输入的密码不一致"}
  ],
  checkCode:[{required:true, message:"请输入图片验证码"}],

};

const formData = ref({});
const formDataRef = ref();


const checkCodeUrl = ref(api.checkCode);
const checkCode4SendMailCode = ref(api.checkCode);
const changeCheckCode = (type) => {
  if(type == 0){
    checkCodeUrl.value =
    api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
  }else{
    checkCode4SendMailCode.value =
    api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
  }
  
};

//发送邮箱验证码
const formData4SendMailCode = ref({});
const formData4SendMailCodeRef = ref();

const dialogConfig4sendMailCode = reactive({
  show:false,
  title:"发送邮箱验证码",
  buttons:[
    {
      type:"primary",
      text:"发送验证码",
      click:(e) => {
        sendEmailCode();
      },
    },
  ],
});

const getEmailCode = () => {
  formDataRef.value.validateField("email",(valid) => {
    if(!valid){
      return;
    }
    dialogConfig4sendMailCode.show = true;

    nextTick(()=>{
      changeCheckCode(1);
      formData4SendMailCodeRef.value.resetFields();
      formData4SendMailCode.value={
        email:formData.value.email,
      };
    })


  });
};

//调用接口发送邮箱验证码
const sendEmailCode = () => {
  formData4SendMailCodeRef.value.validate(async (valid) => {
    //校验
    if(!valid){
      return;
    }

    const params = Object.assign({},formData4SendMailCode.value);
    params.type = opType.value == 0 ? 0 : 1;
    let result = await proxy.Request({
      url:api.sendEmailCode,
      params:params,
      errorCallback:() => {
        changeCheckCode(1);
      },
    });
    if(!result){
      return;
    }
    proxy.Message.success("验证码发送成功，请登录邮箱查看");
    dialogConfig4sendMailCode.show = false;
  });
};

//重置表单
const resetForm = () => {
  changeCheckCode(0);
  //重置表单项
  formDataRef.value.resetFields();
  formData.value = {};
   
  //登录：如果用户勾选了记住我，要从cookie里拿信息展示
  if(opType.value == 1){
    const cookieLoginInfo = proxy.VueCookies.get("loginInfo");
    if(cookieLoginInfo){
      formData.value = cookieLoginInfo;
    }
  }
};

//提交表单：登录、注册、重置密码
const doSubmit = () => {
  //校验表单项
  formDataRef.value.validate(async (valid) => {
    if(!valid){
      return;
    }
    let params = {};
    //拷贝参数
    Object.assign(params,formData.value);
    
    //参数处理
    //注册 找回密码
    if(opType.value == 0 || opType.value == 2){
      //注册和找回密码时，表单密码输入框属性名为registerPassword，而后端接收参数名为password，所以我们将password属性赋值。
      params.password = params.registerPassword;  
      //删除无效属性
      //不删也是可以的，传给后端，后端不会接收，但为了好看，就删了。
      delete params.registerPassword;
      delete params.reRegisterPassword;
    }
    //登录
    if(opType.value == 1){
      //如果表单密码参数不是从cookie里面拿的，就没有经过md5加密，我们要将其进行md5加密。
      //cookie里面拿的已经经过md5加密
      let cookieLoginInfo = proxy.VueCookies.get("loginInfo");
      let cookiePassword = cookieLoginInfo == null ? null : cookieLoginInfo.password;
      if(params.password !== cookiePassword){
        params.password = md5(params.password);
      }
    }

    //url
    let url = null;
    if(opType.value == 0){
      url = api.register;
    }else if(opType.value == 1){
      url = api.login;
    }else if(opType.value == 2){
      url = api.resetPwd;
    }

    //发送请求
    let result = await proxy.Request({
      url:url,
      params:params,
      errorCallback:()=>{
        //失败了，更新验证码
        changeCheckCode(0);
      },
    });
    //请求没有发送成功：直接结束
    if(!result){
      return;
    }

    //成功了
    if(opType.value == 0){  //注册返回
      proxy.Message.success("注册成功，请登录");  //提示信息
      showPanel(1); //页面跳转：注册成功，跳转到登录界面
    }else if(opType.value == 1){  //登录返回
      //记住我
      if(params.rememberMe){
        const loginInfo = {
          email:params.email,
          password:params.password,
          rememberMe:params.rememberMe,
        };
        //cookie存信息，7天
        proxy.VueCookies.set("loginInfo",loginInfo,"7d");
      }else{
        //没有勾选“记住我”，移除cookie中信息
        proxy.VueCookies.remove("loginInfo");
      }
      proxy.Message.success("登录成功");
      //存储cookie
      //存储用户信息，0代表关闭浏览器就没了
      proxy.VueCookies.set("userInfo",result.data,0);
      //重定向到原始页面，没有就返回首页
      const redirectUrl = route.query.redirectUrl || "/";
      router.push(redirectUrl);
    }else if(opType.value == 2){  //忘记密码页面返回
      proxy.Message.success("重置密码成功，请登录"); 
      showPanel(1); 
    }
  });

};

//qq登录
const qqLogin = async()=>{
  let result = await proxy.Request({
    url:api.qqlogin,
    params:{
      callbackUrl:route.query.redirectUrl || "",
    },
  });
  if(!result){
    return;
  }
  proxy.VueCookies.remove("userInfo");
  document.location.href = result.data;
};


</script>

<style lang="scss" scoped>
.login-body {
  height: calc(100vh);
  background-size: cover;
  background: url("../assets/login_bg.jpg");
  display: flex;
  .bg {
    flex: 1;
    background-size: cover;
    background-position: center;
    background-size: 800px;
    background-repeat: no-repeat;
    background-image: url("../assets/login_img.png");
  }
  .login-panel {
    width: 430px;
    margin-right: 15%;
    margin-top: calc((100vh - 500px) / 2);
    .login-register {
      padding: 25px;
      background: #fff;
      border-radius: 5px;
      .login-title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .send-email-panel {
        display: flex;
        width: 100%;
        justify-content: space-between;
        .send-mail-btn {
          margin-left: 5px;
        }
      }
      .rememberme-panel {
        width: 100%;
      }
      .no-account {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
      .op-btn {
        width: 100%;
      }
    }
  }

  .check-code-panel {
    width: 100%;
    display: flex;
    .check-code {
      margin-left: 5px;
      cursor: pointer;
    }
  }
  .login-btn-qq {
    margin-top: 20px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      cursor: pointer;
      margin-left: 10px;
      width: 20px;
    }
  }
}
</style>