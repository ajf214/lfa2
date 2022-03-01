<template>
  <a :href="item.Url" target="_blank" class="item-container">
    <div :class="{unsold: item.Sold !== 'isSold'}" class="sold-tag">
      SOLD
    </div>
    <img v-if="item.Image === 999" :src="`${rootImagePath}/1.jpg`" />
    <img
      v-else-if="item.Image.toString().length < 5"
      :src="`${rootImagePath}/${item.Image}.jpg`"
    />
    <img v-else :src="item.Image" />
    <!-- if it's not a short url, it's a full url -->
    <h3>{{ item.ItemName }}</h3>
  </a>
</template>

<script>
export default {
  name: "StoreItem",
  props: ["item"],
  data() {
    return {
      rootImagePath: `https://res.cloudinary.com/dqbr44qlr/${process.env.VUE_APP_CLOUDINARY_DIR}`,
    };
  },
};
</script>

<style scoped>
img {
  width: 100%;
}

.item-container {
  padding: 10px;
  box-shadow: 0px 0px 8px #aaaaaa;
  word-break: break-word;
  text-decoration: none;
  font-family: Mohave;
  font-size: 20px;
  line-height: 120%;
  color: var(--primary-brown);
  text-transform: uppercase;
}

/* @-webkit-keyframes fadeIn{
	50% {box-shadow: 0,0,3px,black;}
}

@keyframes fadeIn{
	from{box-shadow: 0,0,0,black;}
	to{box-shadow: 0,0,3px,black;}
} */

.item-container:hover {
  box-shadow: 0px 0px 10px #444444;
  -webkit-animation: fadeIn 0.2s;
  -webkit-animation-fill-mode: forwards;
  animation: fadeIn 0.2s;
  animation-fill-mode: forwards;
}

.item-container h3 {
  font-weight: 300;
}

.item-container .sold-tag {
  float: right;
  margin-top: -20px;
  margin-right: 4px;
  background-color: var(--sold-red);
  color: white;
  padding: 10px 9px 7px 10px;
  border: 1px solid var(--sold-red);
  border-radius: 1px; 
}

.unsold {
  visibility: hidden;
}
</style>