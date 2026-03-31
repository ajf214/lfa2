import { createStore } from 'vuex'

export default createStore({
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
