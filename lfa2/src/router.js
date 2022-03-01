import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/home-view.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/about-item.vue')
    },
    {
      path: '/store',
      name: 'store',
      component: () => import('./views/store-view.vue')
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('./views/contact-item.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('./views/admin/AdminHome.vue')
    },
    // {
    //   path: '/admin/manage-item/:itemNumber*',
    //   name: 'addEditItem',
    //   component: () => import('./views/admin/AddEditItem.vue'), // TODO -- this route takes precedent over confirmation...
    //   props: true
    // },
    {
      path: '/admin/manage-item/confirmation',
      name: 'addConfirmation',
      component: () => import('./views/admin/CreateSuccess.vue')
    },
  ]
})
