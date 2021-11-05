<template>
  <div class="item-container">
    <img class="item-image" src="https://via.placeholder.com/70" />
    <div class="item-info">
      <h3 class="item-name">{{ item.ItemName }}</h3>
      <h4 class="item-status">{{ item.ItemStatus === "isSold" ? "Sold" : "Active" }}</h4>
    </div>
    <div class="actions">
      <button @click="startEdit">Edit</button>
      <button>Delete</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdminStoreItem",
  props: [ 'item' ],
  data() {
    return {};
  },
  methods: {
    startEdit: function() {
      console.log(this)
      this.$router.push({
        name: 'addEditItem',
        params: {
          itemForEdit: this.item
        }
      })
    }
  }
};
</script>

<style scoped>

.item-container {
  display: flex;
  --spacing: 8px;
  padding-bottom: var(--spacing);
  margin-bottom: var(--spacing);
  padding-left: 0px;
  border-bottom: 1px solid #666;
}

.item-info {
  width: 70%;
  margin-left: 20px;
  margin-right: 20px;
}

.item-name {
  font-size: 24px;
}

.item-status {
  font-size: 16px;
  font-weight: 400;
}

h3, h4 {
  margin: 0px;
}

.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.actions button:first-child {
  margin-bottom: 5px;
}

@media screen and (max-width: 1000px) {
}
</style>
