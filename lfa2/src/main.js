import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import getEnv from '@/utils/env'

Vue.config.productionTip = false

import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
    applicationId: 'ef963356-0eca-4c60-87a5-ef70de349123',
    clientToken: 'pubc326e4428d43fe290364451852a3b4a6',
    site: 'datadoghq.com',
    service:'lfa2',
    env:'dev',
    // Specify a version number to identify the deployed version of your application in Datadog 
    // version: '1.0.0',
    sampleRate: 100,
    premiumSampleRate: 100,
    trackInteractions: true,
    defaultPrivacyLevel:'mask-user-input'
});
    
datadogRum.startSessionReplayRecording();

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
