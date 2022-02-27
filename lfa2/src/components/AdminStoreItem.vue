<template>
  <div class="item-container">
    <img class="item-image" :src="`${rootImagePath}/${item.Image}.jpg`" />
    <div class="item-info">
      <h3 class="item-name">{{ item.ItemName }}</h3>
    </div>
    <div class="actions">
      <!-- <button @click="startEdit">Edit</button> -->
      <div
        @click="toggleSoldStatus"
        class="sold-tag"
        :class="{ isSold: item.Sold === 'isSold' }"
      >
        SOLD
      </div>
      <div class="delete-button" @click="deleteItem">
        <i class="fa-solid fa-trash"></i>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import axios from "axios";

export default {
  name: "AdminStoreItem",
  props: ["item"],
  data() {
    return {
      rootImagePath: `https://res.cloudinary.com/dqbr44qlr/${process.env.VUE_APP_CLOUDINARY_DIR}`,
    };
  },
  methods: {
    startEdit: function () {
      console.log(this);
      this.$router.push({
        name: "addEditItem",
        params: {
          itemForEdit: this.item,
        },
      });
    },
    async toggleSoldStatus() {
      const toggledStatus = this.item.Sold === "isSold" ? "" : "isSold";

      try {
        const result = await axios.post(
          `${this.API_ENDPOINT}/item/set-status`,
          {
            name: this.item.ItemName,
            newStatus: toggledStatus,
            token: this.$store.getters.getUserToken,
          }
        );

        // todo - check status?
        console.log(result);

        // change state of soldStatus
        this.$emit("update-sold-status", toggledStatus);
      } catch (error) {
        console.log(error);
      }
    },
    async deleteItem() {
      // todo - should get a confirmatio that they want to delete
      try {
        const result = await axios.delete(
          `${this.API_ENDPOINT}/item/${this.item.Image}`
        );
        this.$emit("update-items");
        console.log("got here");
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style scoped>
.item-container {
  display: flex;
  --spacing: 8px;
  padding-bottom: var(--spacing);
  margin-bottom: var(--spacing);
  padding-left: 0px;
  border-bottom: 1px solid rgb(225, 225, 225);
  word-break: break-word;
}

.item-info {
  width: 70%;
  margin-left: 20px;
  display: flex;
  align-items: center;
}

.item-name {
  font-size: 16px;
  font-family: "Open Sans";
  font-weight: 500;
  height: max-content;
}

.item-status {
  font-size: 16px;
  font-weight: 400;
}

h3,
h4 {
  margin: 0px;
}

.actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  flex-grow: 2;
}

.actions button:first-child {
  margin-bottom: 5px;
}

.item-image {
  width: 70px;
  padding-left: 10px;
}

.sold-tag {
  font-family: Mohave;
  border: 1px solid #999;
  height: max-content;
  width: max-content;
  padding: 3px 6px;
  align-self: center;
  margin: 0 20px 0 10px;
  color: #999;
  padding-top: 6px;
}

.sold-tag:hover {
  color: var(--sold-red);
  border-color: var(--sold-red);
  cursor: pointer;
}

.isSold {
  background-color: var(--sold-red);
  border: 1px solid var(--sold-red);
  color: white;
}

.isSold:hover {
  background-color: white;
  color: black;
  border: 1px solid black;
}

.delete-button {
  color: #999;
  margin-right: 20px;
  font-size: 20px;
  align-self: center;
}

.delete-button:hover {
  color: var(--sold-red);
  cursor: pointer;
}

@media screen and (min-width: 768px) {
  .item-name {
    font-size: 20px;
  }
}
</style>
