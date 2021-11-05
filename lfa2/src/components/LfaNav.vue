<template>
    <div id="nav">
      <router-link to="/"><img class="logo" src="../assets/logo-wide.png"/></router-link>
    <div>
      <router-link class="navlink" to="/about">About</router-link>  
      <router-link class="navlink" to="/store">Shop</router-link> 
      <router-link class="navlink" to="/contact">Contact</router-link>
      </div>
    </div>



    
</template>

<script>
export default {
  name: 'LfaNav'
}
</script>

<style>
#nav {
  text-align: center;
  color: rgba(161,91,73,1);
  font-weight: 200;
  font-family: 'Open Sans', sans-serif;
  font-size: 20px;
  text-decoration: none;

}
.navlink { 
  display: inline-block;
  margin: 50px 60px; 
  text-align: center;
  text-decoration: none;
  color: rgba(64,64,64,1);
  
}
.navlink:hover {
  color: rgba(161,91,73,1);
  
}
.logo {
  width: 60%;
}

</style>