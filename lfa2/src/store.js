import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userToken: null,
    userPayload: null
  },
  mutations: { // syncronous
    setUser(state, payload) {
      state.userToken = payload.token
      state.userPayload = payload.userPayload
    }
  }, 
  actions: {},
  modules: {},
  getters: {
    getUserToken: state => state.userToken,
    getUserPayload: state => state.userPayload
  }
})