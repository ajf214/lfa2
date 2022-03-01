<template>
  <div class="confirmation-container">
      <span class="confirmation-message" >Successfully added item</span>
      <router-link :to="`/admin/manage-item`">Add another</router-link>
      <router-link :to="`/admin`">Back to manage items</router-link>
  </div>
</template>

<script>
export default {

}
</script>

<style scoped>
  .confirmation-container {
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  .confirmation-message {
    display: inline-block;
    margin: 50px 0;
  }

  .confirmation-container a {
    margin: 8px 0;
    color: var(--primary-brown);
  }
</style>