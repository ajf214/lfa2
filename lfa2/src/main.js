import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import getEnv from '@/utils/env'

const app = createApp(App)

app.use(router)
app.use(store)

// distribute runtime config into every vue component
app.mixin({
  data() {
    return {
      API_ENDPOINT: getEnv('VUE_APP_BASE_URL')
    }
  }
})

app.mount('#app')
