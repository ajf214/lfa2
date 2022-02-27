<template>
  <div id="app">
    <!-- removing img from header bc in nav  <img class="image" src="./assets/logo-wide.png" /> -->
    <lfa-nav></lfa-nav>
    <!-- don't show nav if manage is in the path -->
    <router-view />
    <footer>
      <p>Built by A+H</p>
      <router-link class="navlink" to="/admin">Adminstrator</router-link>
    </footer>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css?family=Alegreya:300,400,500&display=swap");
@import url("https://fonts.googleapis.com/css?family=Open+Sans:300,400&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Mohave:wght@300&display=swap");

/** Global variables for project */
:root {
  --primary-brown: rgba(161, 91, 73, 1);
  --subtle-brown: rgba(161, 91, 73, 0.7);
  --sold-red: rgb(173, 38, 38);
  --subtle-sold-red: rgb(173, 38, 38, 0.6);
  --subtle-gray: '';
  --strong-gray: '';
}

* {
  box-sizing: border-box;
}

#app {
  font-family: "Alegreya", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #000;
}
.image {
  width: 100%;
}

body {
  margin: 0;
}

button {
  background-color: white;
  border: 1px solid rgb(128, 128, 128);
  color: black;
}

button:hover {
  background-color: var(--primary-brown);
  color: white;
  cursor: pointer;
}

.button {
  background-color: white;
  border: 1px solid rgb(128, 128, 128);
  color: black;
}

.button:hover {
  background-color: var(--primary-brown);
  color: white;
  cursor: pointer;
}

footer {
  text-align: center;
  margin: 120px 0 20px;
  display: flexbox;
  flex-direction: row;
  color: rgba(180,180,180);
}

footer p {
  margin-bottom: 5px;
}

footer a {
  color: var(--subtle-brown);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media screen and (min-width: 480px) {
  
}
</style>

<script>
import LfaNav from "./components/LfaNav";

export default {
  components: { LfaNav },
};
</script>
