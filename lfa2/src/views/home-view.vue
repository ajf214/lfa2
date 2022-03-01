<template>
  <div class="container">
    <div class="carousel-container wide">
      <div class="carousel" id="carousel">
        <div :key="index" v-for="index in imagesCount">
          <img
            class="slider-image"
            :src="`${rootImagePath}/w_1300,c_scale/lfa-slider/wide-0${index+1}.png`"
          />
        </div>
      </div>
    </div>

    <div class="carousel-container narrow">
      <div class="carousel" id="carousel-narrow">
        <div :key="index" v-for="index in imagesCount">
          <img
            class="slider-image"
            :src="`${rootImagePath}/w_800,c_scale/lfa-slider/narrow-0${index+1}.png`"
          />
        </div>
      </div>
    </div>


    <div class="infoBox">
      <h3>&ldquo;We shape our homes...and then our homes shape us.&rdquo;</h3>
      <h4>- Winston Churchill</h4>
    </div>
  </div>
</template>

<script>
import { tns } from "tiny-slider";

export default {
  name: "home-view",
  data() {
    return {
      imagesCount: 5,
      windowWidth: window.innerWidth,
      isWide: true,
      rootImagePath: 'https://res.cloudinary.com/dqbr44qlr/image/upload'
    };
  },
  watch: {
    windowWidth(newWidth) {
      if(newWidth < 600) {
        this.isWide = false
      }
      else {
        this.isWide = true
      }
    }
  },
  mounted() {
    // eslint-disable-next-line
    const sliderWide = tns({
      container: "#carousel",
      slideBy: "page",
      autoplay: true,
      mode: "gallery",
      controls: false,
      nav: false,
      autoplayButtonOutput: false, // stupid name, but this gets rid of start/stop button
    });

        // eslint-disable-next-line
    const sliderNarrow = tns({
      container: "#carousel-narrow",
      slideBy: "page",
      autoplay: true,
      mode: "gallery",
      controls: false,
      nav: false,
      autoplayButtonOutput: false, // stupid name, but this gets rid of start/stop button
    });
  },
};
</script>

<style>

/* for some reason this can't go in the 'scoped' section */
#carousel-iw {
  width: 70%; /* TODO: USE CSS VAR */
  /* max-width: 1000px; */
  margin: auto;
}

#carousel-narrow-iw {
  width: 80%;
  margin: auto;
}
</style>

<style scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/tiny-slider.css");

.slider-image {
  width: 100%; /* TODO: USE CSS VAR */
}

.infoBox {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  margin-top: 80px;
  margin-bottom: 20px;
  color: #ffffcc;
  padding: 30px;
  color: rgba(161, 91, 73, 1);
}

.infoBox h3,
.infoBox h4 {
  display: block;
  margin-bottom: 0px;
  font-weight: 400;
}

.infoBox h3 {
  font-family: Mohave;
  font-size: 30px;
  margin-right: 5px;
  line-height: 130%;
  text-transform: uppercase;
}

.infoBox h4 {
  font-size: 20px;
  font-family: Open Sans;
  font-weight: 300;
  float: right;
  margin-right: 0px;
  color: rgba(64, 64, 64, 1);
}

.wide {
  display: none;
}

.narrow img {
  width: 100%;
}

/** medium */
@media screen and (min-width: 768px) {
  
  .infoBox {
    width: 70%;
    max-width: 600px;
  }

  .infoBox h3 {
    font-size: 42px;
  }

  .narrow {
    display: none;
  }

  .wide {
    display: initial;
  }
}
</style>
