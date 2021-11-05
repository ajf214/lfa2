<template>
  <a :href="item.Url" class="item-container">
    <div v-if="item.Sold === 'isSold'" class="sold-tag">SOLD</div>
    <img v-if="item.Image === 999" :src="`${rootImagePath}/1.jpg`"/>
    <img v-else-if="item.Image.toString().length < 5" :src="`${rootImagePath}/${item.Image}.jpg`"/>
    <img v-else :src="item.Image" /> <!-- if it's not a short url, it's a full url -->
    <h3>{{item.ItemName}}</h3>
  </a>
</template>

<script>
export default {
    name: 'StoreItem',
    props: ['item'],
    data () {
      return {
        rootImagePath: `https://res.cloudinary.com/dqbr44qlr/${process.env.VUE_APP_CLOUDINARY_DIR}`
      }
    }
}
</script>

<style scoped>
  img {
    width: 100%;
    max-width: 400px;
  }

  .item-container {
    padding: 10px;
    box-shadow: 0px 0px 8px #aaaaaa;
  }

  .item-container .sold-tag {
    float: right;
    margin-top: -20px;
    margin-right: 4px;
    background-color: #AD2626;
    color: white;
    padding: 10px;
    position: relative;
  }
</style>