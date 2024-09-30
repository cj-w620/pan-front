import { createRouter, createWebHistory } from 'vue-router'
import VueCookies from 'vue-cookies'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import("@/views/Login.vue")
    },
    {
      path: '/qqlogincallback',
      name: 'qq登录回调',
      component: () => import("@/views/QqLoginCallback.vue")
    },
    {
      path: '/',
      name: 'Framework',
      component: () => import("@/views/Framework.vue"),
      children:[
        {
          path:'/',
          redirect:"/main/all"
        },
        {
          path:'/main/:category',
          name:'首页',
          meta:{
            needLogin:true,
            menuCode:"main"
          },
          component:()=>import("@/views/main/Main.vue")
        },
        {
          path:'/myshare',
          name:'我的分析',
          meta:{
            needLogin:true,
            menuCode:"share"
          },
          component:()=>import("@/views/share/Share.vue")
        },
        {
          path:'/recycle',
          name:'回收站',
          meta:{
            needLogin:true,
            menuCode:"recycle"
          },
          component:()=>import("@/views/recycle/Recycle.vue")
        },
        {
          path:'/settings/sysSetting',
          name:'系统设置',
          meta:{
            needLogin:true,
            menuCode:"settings"
          },
          component:()=>import("@/views/admin/SysSetting.vue")
        },
        {
          path:'/settings/userList',
          name:'用户管理',
          meta:{
            needLogin:true,
            menuCode:"settings"
          },
          component:()=>import("@/views/admin/UserList.vue")
        },
        {
          path:'/settings/fileList',
          name:'用户文件',
          meta:{
            needLogin:true,
            menuCode:"settings"
          },
          component:()=>import("@/views/admin/FileList.vue")
        },
      ]
    },
    {
      path: '/shareCheck/:shareId',
      name: '分享校验',
      component: () => import("@/views/webshare/ShareCheck.vue")
    },
    {
      path: '/share/:shareId',
      name: '分享',
      component: () => import("@/views/webshare/Share.vue")
    },
  ]
})

//路由前，检查当前操作是否需要登录。
//因为在路由中设置了needLogin属性为true
//所以一开始，如果直接在地址栏输入首页地址，是会一直跳进登录页面的，除非你登录。
router.beforeEach((to,from,next)=>{
  const userInfo = VueCookies.get("userInfo");
  if(to.meta.needLogin != null && to.meta.needLogin && userInfo == null){
    router.push("/login");
  }
  next();
})

export default router
