<template>
  <div class="container">
      <img class="image" src="../assets/logo-wide.png" />

      <div class="carousel"></div>
  </div>
</template>

<script>

export default {
  name: 'home',
  data () {
    return {
      items: []
    }
  }
}
</script>

<style scoped>

  @media screen and (max-width: 1000px) {

  }

  .image {
    width: 100%;
  }

</style>
