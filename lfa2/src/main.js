import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import getEnv from '@/utils/env'

Vue.config.productionTip = false

console.log(getEnv('VUE_APP_BASE_URL'))

Vue.mixin({
  // distribute runtime config into every vue component
  data() {
    return {
      API_ENDPOINT: getEnv('VUE_APP_BASE_URL') // 'http://localhost:2999'// process.env.API_ENDPOINT
    }
  }
})

new Vue({
  router,
  render: h => h(App),
  store
}).$mount('#app')
