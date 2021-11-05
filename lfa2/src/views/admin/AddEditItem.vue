<template>
  <div class="item-container">
      <label>Item name: </label>
      <input type="text" v-model="name" />

      <label>1st Dibs URL: </label>
      <input @change="scrapeFirstDibs" type="text" v-model="firstDibsUrl" />
      
      <div>
        <input type="checkbox" v-model="sold" />
        <label> Sold</label>
      </div>

      <button @click="submitItem">Create Item</button>

      <h3>Preview item</h3>
      <store-item v-if="cdnUrl !== ''" :item="item"></store-item>
  </div>
</template>

<script>
import axios from 'axios'
import StoreItem from '../../components/StoreItem'

export default {
  name: 'AddEditItem',
  components: { StoreItem },
  props: [ 'itemForEdit' ],
  data () {
    return {
      name: '',
      firstDibsUrl: '',
      sold: false,
      cdnUrl: ''  
    }
  },
  beforeMount() {
    if (this.itemForEdit !== undefined) {
      this.name = this.itemForEdit.ItemName
      this.sold = this.itemForEdit.Sold
      this.firstDibsUrl = this.itemForEdit.Url

      this.scrapeFirstDibs()
    }
  },
  methods: {
      async scrapeFirstDibs() {
          const response = await axios.get(`${this.API_ENDPOINT}/get-hero-image?url=${this.firstDibsUrl}`)
          this.cdnUrl = response.data.cdnUrl
      },
      async submitItem () {
          try {
            let imageName = parseInt(this.itemForEdit.Image)
            
            // only increment if this is a new item
            if (this.itemForEdit === undefined) {
              // get latest image #, so I can increment it
              console.log("Getting next possible image ID...")
              const latestImageResponse = await axios.get(`${this.API_ENDPOINT}/latest-image-reference`)
              imageName = (parseInt(latestImageResponse.data.Image) + 1)
            }

            // upload image to cloudinary then
            // post request with item contents (name, imageNumber, sold, url)
            await axios.post(`${this.API_ENDPOINT}/item`, { // todo - I think the ID should be in the POST url
              name: this.name,
              imageName: imageName,
              firstDibsUrl: this.firstDibsUrl,
              cdnUrl: this.cdnUrl,
              sold: this.sold,
              token: this.$store.getters.getUserToken
            })

            // take me to a confirmation page
            console.log('successfully added item')
            this.$router.push('/admin/manage-item/confirmation')
          } catch (e) {
            // show some red stuff on the page depending on the error
          }
      }
  },
  computed: {
    item: function () {
      return {
        Image: this.cdnUrl,
        ItemName: this.name,
        Sold: this.sold,
        Url: this.firstDibsUrl
      }
    }
  },
}
</script>

<style scoped>

img {
    width: 300px;
}

.item-container {
  display: flex;
  flex-direction: column;
  width: 60%;
  margin: auto;
  text-align: left;
}

.item-container > * {
  margin: 5px;
  padding: 5px;
}

</style>