<template>
  <div class="admin-container">
    <div v-if="userToken !== null" class="signed-in-nav">
      <span>{{ userPayload.name }}</span>
      <button>Sign out</button>
    </div>
    <h1 class="title">Manage Items</h1>
    <div v-if="userToken !== null" class="main-content">
      <router-link class="new-item button" :to="`/admin/manage-item`">+ NEW ITEM</router-link>
      <div class="items-table">
        <admin-store-item 
          class="item" 
          v-for="(item, index) in items" 
          :key="index"
          :item="item"
          ></admin-store-item>
      </div>
    </div>
    <div v-else class="no-auth-container">
      You must be signed in with a valid @lawrencefarmsantiques.com email address to 
      view the content on this page.
      <button
        v-if="userToken == null"
        v-google-signin-button="clientId"
        class="google-signin-button"
      >
        <img class="g-logo" src='../../assets/google-g.svg' alt='Google "G" logo'>
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import GoogleSignInButton from "vue-google-signin-button-directive";
import AdminStoreItem from '../../components/AdminStoreItem.vue';

// const { OAuth2Client } = require("google-auth-library");
// const client = new OAuth2Client(process.env.VUE_APP_GSUITE_CLIENT_ID);

export default {
  name: "AdminHome",
  components: { AdminStoreItem },
  directives: {
    GoogleSignInButton,
  },
  data() {
    return {
      items: [],
      page: 1,
      sort: "recent",
      unsold: false,
      clientId: "1092000076053-gskfckaqihntrefibkmlce55n7dvul2b",
    };
  },
  computed: {
    userToken: {
      get() {
        return this.$store.state.userToken;
      },
      set(newToken) {
        return newToken;
      },
    },
    userPayload: {
      get() {
        return this.$store.state.userPayload;
      },
      set(newPayload) {
        return newPayload;
      },
    },
  },
  beforeMount() {
    // get ALL items - todo - should I get ALL or just a subset?

    // only get items if I am already auth'd
    if (this.userToken !== null) {
      this.loadData();
    }
  },
  methods: {
    loadData: async function () {
      console.log(this.API_ENDPOINT)

      const response = await axios.get(
        `${this.API_ENDPOINT}/items?page=${this.page}&sort=${this.sort}&unsold=${this.unsold}`
      );
      this.items = response.data;
    },
    // async OnGoogleAuthSuccess(idToken) {
    //   // Receive the idToken and make your magic with the backend

    //   // const ticket = await client.verifyIdToken({
    //   //   idToken: idToken,
    //   //   // audience: process.env.GSUITE_CLIENT_ID,
    //   // });
    //   // const payload = ticket.getPayload();

    //   // committing user info will trigger loading the management panel
    //   // this.$store.commit("setUser", {
    //   //   token: idToken,
    //   //   userPayload: payload,
    //   // });

    //   //backend should validate idToken before getting the list
    //   this.loadData();
    // },
    OnGoogleAuthFail(error) {
      console.log(error);
    },
  },
};
</script>

<style scoped>

.admin-container {
  --my-grid-gap: 5px;
  margin: auto;

  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--my-grid-gap);
}

.no-auth-container {
  grid-column: 3/11;
}

.signed-in-nav {
  float: right;
  grid-column: 8/13;
  justify-self: end;
}

.title {
  grid-column: 3/12;
}

.main-content {
  grid-column: 1/13;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--my-grid-gap);
}

.new-item {
  padding: 5px;
  margin-left: 5px;
  display: block;
  float: left;
  text-decoration: none;
  grid-column: 1/3;
  height: max-content;
  width: max-content;
  justify-self: center;
  background-color: rgba(161,91,73,1.0);
  color: white;
  position: fixed;
  top: 170px;
  left: 20px;
}

.new-item:hover {
  cursor: pointer;
  background-color: #777;
}

.items-table {
  grid-column: 3/12;
}

.items-table .item {

}

.table-content {
  width: 80%;
}

.google-signin-button {
  color: #000;
  background-color: white;
  display: block;
  margin: auto;
  height: 50px;
  font-size: 16px;
  /* border-radius: 10px; */
  padding: 10px 20px 10px 20px;
  margin-top: 100px;
  /* box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); */
}

.google-signin-button:hover {
  cursor: pointer;
  background-color: #777;
  color: white;
}

.g-logo {
  height: 20px;
  margin-bottom: -4px;
  padding-right: 11px;
}
</style>