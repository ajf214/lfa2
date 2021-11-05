<template>
  <div class="store-container">
    <div class="filter">
      <button :class="{selected: sort==='alpha'}" v-on:click="changeSort('alpha')">A-Z</button>
      <button :class="{selected: sort==='recent'}" v-on:click="changeSort('recent')">Recent</button>
      <div id="unsold-only">
        <input
          style="margin-right: 5px;"
          type="checkbox"
          :value="unsold"
          @change="changeSold"
          id="unsold-only"
          name="unsold-only"
        />
        <label for="unsold-only">Unsold only</label>
      </div>
    </div>

    <h3 class="store-description">
      Items from Lawrence Farms Antiques &amp; Interiors shown here are available for purchase from our storefront on
      <a
        href="https://www.1stdibs.com/dealers/lawrence-farms-antiques/?utm_source=lawrencefarmsantiques.azurewebsites.net&amp;utm_medium=referral&amp;utm_campaign=dealer&amp;utm_content=dealer_badge_shop_dealer"
        target="_blank"
      >1stdibs</a>
      and on
      <a
        href="https://www.chairish.com/shop/lawrencefarmsantiques"
        target="_blank"
      >chairish</a>
    </h3>
    <div class="container">
      <store-item :key="index" v-for="(item,index) in items" :item="item"></store-item>
    </div>

    <lfa-pager
      class="pager"
      :current-page="this.page"
      :unsold="this.unsold"
      @change-page="changePage"
    ></lfa-pager>

    <div class="first-dibs-wrapper">
      <div class="firstDibsDealerBadgeContainer">
        <div class="firstdibs-badge-shop-dealer">
          <a
            href="https://www.1stdibs.com/dealers/lawrence-farms-antiques/"
            target="_blank"
            class="firstdibs-badge-shop-dealer-text"
            name="dealer_badge_shop_dealer"
          >
            <div>SHOP</div>
            <div>Lawrence Farms Antiques</div>
            <div>
              <span class="dealer-badge-divider-line"></span>
              <span class="firstdibs-badge-shop-dealer-subtext">ON</span>
              <span class="dealer-badge-divider-line"></span>
            </div>
          </a>
          <div class="firstdibs-badge-shop-dealer-link-container">
            <a href="https://www.1stdibs.com/" target="_blank" name="dealer_badge_shop_dealer">
              <img
                src="https://shard1.1stdibs.us.com/static/images/dealers/dealer-badges/shop-1stdibs-dealer.png"
                alt="Shop Lawrence Farms Antiques's antique furniture on 1stdibs"
                border="0"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import StoreItem from "../components/StoreItem";
import LfaPager from "../components/LfaPager";
import router from "../router";

export default {
  name: "Store",
  data() {
    return {
      items: [],
      page: 1,
      sort: "recent",
      unsold: "false"
    };
  },
  components: { StoreItem, LfaPager },
  async beforeMount() {
    // 1st dibs stuff
    if (!window.document.getElementById("firstDibsDealerBadgeScript")) {
      var script = window.document.createElement("script");
      var cacheBust = new Date().getTime();
      script.type = "text/javascript";
      script.src =
        "https://shard1.1stdibs.us.com/static/dealer/brand-assets/badges/c/dealer-badge.js?" +
        cacheBust;
      script.id = "firstDibsDealerBadgeScript";
      window.document.getElementsByTagName("HEAD")[0].appendChild(script);
    }

    if (this.$route.query.page !== undefined) {
      this.page = this.$route.query.page;
    }
    if (this.$route.query.sort !== undefined) {
      this.sort = this.$route.query.sort;
    }
    if (this.$route.query.unsold !== undefined) {
      this.unsold = this.$route.query.unsold;
    }

    this.loadData();
  },
  methods: {
    changeSort: function(preference) {
      this.sort = preference;

      router.push({
        path: "/store",
        query: {
          page: this.page,
          sort: this.sort,
          unsold: this.unsold
        }
      });
    },
    loadData: async function() {
      const response = await axios.get(
        // todo - this needs to be able to get the ContainerApp FQDN dynamically
        `${this.API_ENDPOINT}/items?page=${this.page}&sort=${this.sort}&unsold=${this.unsold}`
      );
      this.items = response.data;
    },
    changePage(pageNumber) {
      this.page = pageNumber;

      router.push({
        path: "/store",
        query: {
          page: this.page,
          sort: this.sort,
          unsold: this.unsold
        }
      });
    },
    changeSold() {
      if (this.unsold === "true") this.unsold = "false";
      else if (this.unsold === "false") this.unsold = "true";

      router.push({
        path: "/store",
        query: {
          page: this.page,
          sort: this.sort,
          unsold: this.unsold
        }
      });
    }
  },
  beforeRouteUpdate(to, from, next) {
    this.loadData();
    next();
  }
};
</script>

<style scoped>
.store-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  margin: 20px 0;
}

.filter {
  grid-column: 1/3;
  display: flex;
  flex-direction: column;
  height: max-content;
  position: fixed;
  top: 400px;
}

.filter * {
  margin-bottom: 10px;
}

.filter button {
  padding: 6px;
  border-left: 0px;
}

.filter #unsold-only {
  margin-left: 5px;
}

.container {
  grid-column: 3/-3;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
  width: 100%;
  margin-bottom: 20px;
}

.store-description {
  grid-column: 3/-3;
}

.pager {
  grid-column: 3/-3;
}

.selected {
  border: 3px solid red;
}

.first-dibs-wrapper {
  grid-column: 1/-1;
  margin-top: 40px;
}

@media screen and (max-width: 600px) {
  
}

@import "../external-css/firstdibs.css";
</style>