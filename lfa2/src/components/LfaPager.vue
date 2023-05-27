<template>
  <div class="pager">
    <button
      :class="{ selected: currentPage === index }"
      v-on:click="changePage(index)"
      v-for="index in pages"
      :key="index"
    >
      {{ index }}
    </button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LfaPager",
  props: ["currentPage", "unsold", "itemsPerPage"],
  data() {
    return {
      pages: 0,
      itemCount: 0,
    };
  },
  async beforeMount() {
    // find out how many items are in the db
    await this.getItemCount();

    // calculate pages based on response
    this.calcPages(this.itemCount);
  },
  methods: {
    getItemCount: async function () {
      // must account for sold flag
      const response = await axios.get(
        `${this.API_ENDPOINT}/all-items?unsold=${this.unsold}`
      );
      this.itemCount = response.data.ItemCount;
    },
    calcPages: function (count) {
      // const itemsPerPage = 36
      this.pages = Math.floor(count / this.itemsPerPage) + 1;
    },
    changePage: function (pageNumber) {
      window.scrollTo(0,0)
      this.$emit("change-page", pageNumber);
    },
  },
  watch: {
    unsold: async function () {
      await this.getItemCount();
      this.calcPages(this.itemCount);
    },
  },
};
</script>

<style scoped>
.selected {
  /* border: 2px solid rgba(161, 91, 73, 1); */
  background-color: rgba(161, 91, 73, 1);
  color: white;
}

.pager button:first-of-type {
    margin-left: 0px;
}

.pager button {
  padding: 5px 0;
  margin: 5px;
  font-family: Mohave;
  font-weight: 300;
  font-size: 20px;
  width: 32px;
}
</style>