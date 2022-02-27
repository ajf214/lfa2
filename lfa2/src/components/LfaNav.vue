<template>
  <div id="nav">
    <router-link to="/" :class="{adminPresent: $route.path.slice(1, 6) === 'admin'}">
      <img class="logo wide" src="../assets/logo-wide.png" />
      <img class="logo narrow" src="../assets/logo-narrow.png" />
    </router-link>
    <div class="nav-buttons" v-if="$route.path.slice(1, 6) !== 'admin'">
      <router-link
        class="navlink"
        to="/about"
        :class="{ selected: currentRoute === 'about' }"
        >About</router-link
      >
      <router-link
        class="navlink"
        to="/store"
        :class="{ selected: currentRoute === 'store' }"
        >Shop</router-link
      >
      <router-link
        class="navlink"
        to="/contact"
        :class="{ selected: currentRoute === 'contact' }"
        >Contact</router-link
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "LfaNav",
  computed: {
    currentRoute() {
      return this.$route.name;
    },
  },
};
</script>

<style scoped>
#nav {
  text-align: center;
  color: var(--primary-brown);
  font-weight: 200;
  font-family: "Open Sans", sans-serif;
  font-size: 20px;
  text-decoration: none;
  margin-top: 30px;
}

.nav-buttons {
  display: flex;
  flex-grow: 1;
  justify-content: space-evenly;
  width: 90%;
  margin: auto;
  padding-left: 7px;
}

.navlink {
  display: inline-block;
  margin: 50px 0;
  text-align: center;
  text-decoration: none;
  color: rgba(64, 64, 64, 1);
}
.navlink:hover {
  color: var(--primary-brown)
}

.selected {
  color: var(--primary-brown);
  font-weight: bold;
}

.logo {
  width: 90%;
}

.wide {
  display: none;
}

.narrow {
  margin-left: -10px;
}

/** medium */
@media screen and (min-width: 480px) {
}

/** large */
@media screen and (min-width: 768px) {
  #nav {
    margin-top: 60px;
  }

  .logo {
    width: 60%;
  }

  .wide {
    display: initial;
  }

  .narrow {
    display: none;
  }

  .nav-buttons {
    justify-content: center;
  }
  .navlink {
    padding: 0 30px;
  }
}
</style>