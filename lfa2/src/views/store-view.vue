<template>
  <div class="store-container">
    <h3 class="store-description">
      Items from Lawrence Farms Antiques &amp; Interiors shown here are
      available for purchase from our storefront on
      <a
        href="https://www.1stdibs.com/dealers/lawrence-farms-antiques/?utm_source=lawrencefarmsantiques.azurewebsites.net&amp;utm_medium=referral&amp;utm_campaign=dealer&amp;utm_content=dealer_badge_shop_dealer"
        target="_blank"
        >1stdibs</a
      >
      and on
      <a
        href="https://www.chairish.com/shop/lawrencefarmsantiques"
        target="_blank"
        >chairish</a
      >
    </h3>

    <div class="filter">
      <div id="unsold-only">
        <input
          style="margin-right: 5px"
          type="checkbox"
          :value="unsold"
          @change="changeSold"
          id="unsold-only"
          name="unsold-only"
        />
        <label for="unsold-only">Unsold only</label>
      </div>
    </div>

    <div class="container">
      <store-item
        class="store-item"
        :key="index"
        v-for="(item, index) in items"
        :item="item"
      ></store-item>
    </div>

    <lfa-pager
      class="pager"
      :current-page="this.page"
      :unsold="this.unsold"
      items-per-page="36"
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
            <a
              href="https://www.1stdibs.com/"
              target="_blank"
              name="dealer_badge_shop_dealer"
            >
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
  name: "store-view",
  data() {
    return {
      items: [],
      page: 1,
      sort: "recent",
      unsold: "false",
    };
  },
  components: { StoreItem, LfaPager },
  async beforeMount() {
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
  mounted() {
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
  },
  methods: {
    loadData: async function () {
      const response = await axios.get(
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
          unsold: this.unsold,
        },
      });

      window.scrollTo(0,0)
    },
    changeSold() {
      if (this.unsold === "true") this.unsold = "false";
      else if (this.unsold === "false") this.unsold = "true";

      this.page = 1

      router.push({
        path: "/store",
        query: {
          page: '1',
          sort: this.sort,
          unsold: this.unsold,
        },
      });
    },
  },
  beforeRouteUpdate(to, from, next) {
    window.scrollTo(0,0)
    this.loadData();
    next();
  },
};
</script>

<style scoped>
.store-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  margin: 20px 0;
}

.filter {
  display: flex;
  flex-direction: column;
  height: max-content;
  grid-column: 1/-1;
}

.filter button {
  padding: 6px;
  border-left: 0px;
}

.container {
  grid-column: 1/-1;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  width: 92%;
  margin: auto;
  margin-bottom: 40px;
  grid-gap: 40px;
}

.store-item {
  grid-column: 1/-1;
}

.store-description {
  grid-column: 1/-1;
  font-size: 18px;
  color: rgba(64, 64, 64, 1);
  font-weight: 200;
  text-align: center;
  width: 85%;
  margin: auto;
  margin-bottom: 40px;
}

.store-description a {
  color: var(--primary-brown);
  text-decoration: none;
}

.store-description a:hover {
  text-decoration: underline;
}

.pager {
  grid-column: 3/-3;
}

.first-dibs-wrapper {
  grid-column: 1/-1;
  margin: auto;
  margin-top: 40px;
}

#unsold-only {
  font-family: Mohave;
  text-transform: uppercase;
  font-size: 18px;
  width: max-content;
  margin: auto;
  margin-bottom: 15px;
}

@media screen and (min-width: 768px) {
  .store-item {
    grid-column: span 3;
  }

  .container {
    grid-column: 3/-1;
    width: 90%;
    grid-gap: 30px;
  }

  .pager {
    grid-column: 3/-1;
    width: 90%;
    margin: auto;
  }

  .store-description {
    grid-column: 3/-3;
  }

  .filter {
    position: fixed;
    top: 400px;
  }

  .filter * {
    margin-bottom: 10px;
  }

  #unsold-only {
    margin-left: 10px;
    margin-top: 40px;
  }
}

@media screen and (min-width: 1000px) {
  .container {
    grid-column: 2/-2;
  }

  .pager {
    grid-column: 2/-2;
  }

  .store-item {
    grid-column: span 2;
  }
}

@import "../external-css/firstdibs.css";
</style>