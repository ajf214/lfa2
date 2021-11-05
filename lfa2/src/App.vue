<template>
  <div id="app">
    <!-- removing img from header bc in nav  <img class="image" src="./assets/logo-wide.png" /> -->
    <lfa-nav v-if="$route.path.slice(1, 6) !== 'admin'"></lfa-nav> <!-- don't show nav if manage is in the path -->
    <router-view/>
    <footer>
      Web Design by Schmoopie
    </footer>

  </div>

</template>

<style>

@import url('https://fonts.googleapis.com/css?family=Alegreya:300,400,500&display=swap');
@import url('https://fonts.googleapis.com/css?family=Open+Sans:300,400&display=swap');
@font-face {
  font-family: 'Mohave';
  src: 
    url('./assets/fonts/mohave-webfont.woff2') format('woff2'), /* Chrome 26+, Opera 23+ */
    url('./assets/fonts/mohave-webfont.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}

#app {
  font-family: 'Alegreya', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #000;
  margin-top: 60px;

  /* Default 12 column grid */
  /* display: grid; */
  /* grid-template-columns: repeat(12, 1fr); */
}
  .image {
    width: 100%;
  }

  body {
    margin: 0;
  }

  button {
    background-color: white;
    border: 1px solid rgb(128,128,128);
    color:black;
  }

  button:hover {
    background-color: rgba(161,91,73,1.0);
    color: white;
    cursor: pointer;
  }
  
  .button {
    background-color: white;
    border: 1px solid rgb(128,128,128);
    color:black;
  }

  .button:hover {
    background-color: rgba(161,91,73,1.0);
    color: white;
    cursor: pointer;
  }

  footer {
    text-align: center;
    margin: 80px; 
  }
</style>

<script>
import LfaNav from './components/LfaNav'

export default {
  components: { LfaNav }
}
</script>
