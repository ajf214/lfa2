<template>
  <div class="container">
      <h1>Store!</h1>
      <!-- <img src="fleur-de-lis" /> -->

      <div :key="index" v-for="(item,index) in items">
        <h3><a :href="item.Url">{{item.ItemName}}</a></h3>   
      </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Store',
    data () {
      return {
        items: []
      } 
    },
    async beforeMount () {
        const response = await axios.get('http://localhost:3000/query-something')
        // console.log(response.data)
        this.items = response.data
    }
}
</script>

<style scoped>

</style>