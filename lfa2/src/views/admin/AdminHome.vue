<template>
  <div class="admin-container">
    <div v-if="userToken !== null" class="signed-in-nav">
      <span>{{ userPayload.name }}</span>
      <button class="sign-out">Sign out</button>
    </div>
    <div v-if="userToken !== null" class="version">
      version:
      <a
        target="_blank"
        :href="`https://github.com/ajf214/lfa2/commit/${version}`"
        >{{ version }}</a
      >
    </div>
    <h1 v-if="userToken !== null" class="title">Manage Items</h1>
    <router-link
      v-if="userToken !== null"
      class="new-item button"
      :to="`/admin/manage-item`"
      ><i class="fa-solid fa-plus"></i> NEW ITEM</router-link
    >
    <div v-if="userToken !== null" class="main-content">
      <div class="items-table">
        <admin-store-item
          class="item"
          v-for="(item, index) in items"
          :key="index"
          :item="item"
          @update-sold-status="updateSoldStatus"
          @update-items="updateItems"
        ></admin-store-item>
      </div>

      <lfa-pager
        class="lfa-pager"
        @change-page="changePage"
        :currentPage="page"
        items-per-page="60"
      >
      </lfa-pager>
    </div>

    <div v-else class="no-auth-container">
      You must be signed in with a valid @lawrencefarmsantiques.com email
      address to view the content on this page.
      <!--<button
        v-if="userToken == null"
        v-google-signin-button="clientId"
        class="google-signin-button"
      >-->
      <!-- <div id="g_id_onload"
         data-client_id="1092000076053-gskfckaqihntrefibkmlce55n7dvul2b.apps.googleusercontent.com"
         data-callback="handleCredentialResponse">
      </div>
      <div class="g_id_signin" data-type="standard"></div> -->
      <button
        v-if="userToken == null"
        class="google-signin-button"
        id="gauth-button"
      >
        <img
          class="g-logo"
          src="../../assets/google-g.svg"
          alt='Google "G" logo'
        />
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
// import GoogleSignInButton from "vue-google-signin-button-directive";
import AdminStoreItem from "../../components/AdminStoreItem.vue";
import LfaPager from "../../components/LfaPager.vue";

export default {
  name: "AdminHome",
  components: { AdminStoreItem, LfaPager },
  // directives: {
  //   GoogleSignInButton,
  // },
  data() {
    return {
      items: [],
      page: 1,
      sort: "recent",
      unsold: false,
      clientId: "1092000076053-gskfckaqihntrefibkmlce55n7dvul2b",
      version: null,
      gapi: window.gapi,
      auth2: null,
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
  async beforeMount() {
    // get ALL items - todo - should I get ALL or just a subset?
    // only get items if I am already auth'd
    if (this.userToken !== null) {
      await this.getVersion();
      await this.loadData();
    }

    await this.gapi.load("auth2", () => {
      this.auth2 = this.gapi.auth2.init({
        client_id: this.clientId,
        cookiepolicy: "single_host_origin",
        plugin_name: 'foobar'
      });

      if (this.userToken === null) {
        this.auth2.attachClickHandler(
          "gauth-button",
          {},
          this.OnGoogleAuthSuccess,
          this.OnGoogleAuthFail
        );
      }

      // check if user is signed in
      this.auth2.isSignedIn.listen(this.GoogleAuthSignInChanged);

      // const GoogleAuth = this.gapi.auth2.getAuthInstance()
      // const GoogleUser = GoogleAuth.currentUser.get()
      // console.log(GoogleUser)

      // not sure if I need to listen to userChanged
      //auth2.currentUser.listen(userChanged); // This is what you use to listen for user changes
    });
  },
  methods: {
    async getVersion() {
      const response = await axios.get(`${this.API_ENDPOINT}/version`);
      this.version = response.data.gitHash;
    },
    loadData: async function () {
      console.log(this.API_ENDPOINT);

      const response = await axios.get(
        `${this.API_ENDPOINT}/items?page=${this.page}&sort=${this.sort}&unsold=${this.unsold}`
      );
      this.items = response.data;
    },
    handleCredentialResponse() {},
    async OnGoogleAuthSuccess(googleUser) {
      console.log(googleUser)
      
      // Receive the idToken and make your magic with the backend
      const response = await axios.post(`${this.API_ENDPOINT}/token-signin`, {
        token: googleUser.getAuthResponse().id_token //googleUser.wc.id_token,
      });

      console.log(response.data);

      // committing user info will trigger loading the management panel
      this.$store.commit("setUser", {
        token: googleUser.getAuthResponse().id_token, //googleUser.wc.id_token,
        userPayload: response.data,
      });

      // only load data once the user has been set and verified as authentic
      // should I check this again??
      this.loadData();
      this.getVersion();
    },
    OnGoogleAuthFail(error) {
      console.log(error);
    },
    async GoogleAuthSignInChanged(val) {
      console.log("Signin state changed to ", val);

      const googleUser = this.auth2.currentUser.get();
      const response = await axios.post(`${this.API_ENDPOINT}/token-signin`, {
        token: googleUser.getAuthResponse().id_token //googleUser.wc.id_token,
      });

      this.$store.commit("setUser", {
        token: googleUser.getAuthResponse().id_token, // googleUser.wc.id_token,
        userPayload: response.data,
      });

      this.loadData();
      this.getVersion();
    },
    updateSoldStatus(value) {
      console.log("UPDATING SOLD STATUS");
      console.log(value);
      this.loadData(); // naive refresh for one item
    },
    updateItems() {
      console.log("UPDATING ITEMS AFTER DELETE");
      this.loadData();
    },
    changePage(pageNumber) {
      this.page = pageNumber;
      this.loadData();
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
  max-width: 500px;
  margin: auto;
  text-align: center;
  line-height: 130%;
  margin-top: 100px;
}

.signed-in-nav {
  float: right;
  grid-column: 8/13;
  justify-self: end;
  position: absolute;
  top: 10px;
  right: 10px;
}

.sign-out {
  margin-left: 5px;
  display: inline-block;
}

.title {
  grid-column: 1/9;
  font-family: "Mohave";
  font-weight: 200;
  margin-bottom: 0px;
  color: #333;
  margin-left: 8px;
}

.main-content {
  grid-column: 1/-1;
  border-top: 2px solid rgb(200, 200, 200);
  margin-top: 10px;
  padding-top: 20px;
}

.items-table {
  margin-bottom: 30px;
}

.lfa-pager {
  margin: 0 20px;
}

.new-item {
  padding: 5px;
  margin-left: 5px;
  display: block;
  float: left;
  text-decoration: none;
  grid-column: 9/-1;
  height: max-content;
  width: max-content;
  justify-self: flex-end;
  align-self: flex-end;
  font-family: "Open Sans";
  border-radius: 2px;
  color: #666;
  border-color: #666;
  margin-right: 20px;
}

.new-item:hover {
  cursor: pointer;
  color: white;
}

.google-signin-button {
  color: #000;
  background-color: white;
  display: block;
  margin: auto;
  height: 50px;
  font-size: 16px;
  padding: 10px 20px 10px 20px;
  margin-top: 20px;
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

.logo-container {
  grid-column: 4/-4;
}

.logo {
  width: 100%;
  margin: auto;
}

.version {
  position: absolute;
  top: 10px;
  left: 10px;
  color: #999;
}

.version a {
  color: var(--primary-brown);
  text-decoration: none;
}

.version a:hover {
  text-decoration: underline;
}

@media screen and (min-width: 768px) {
  .main-content {
    grid-column: 3/-3;
  }

  .title {
    grid-column: 3/7;
  }

  .new-item {
    grid-column: 8/11;
  }

  .lfa-pager {
    margin: 0 0;
  }
}
</style>