<template>
  <div class="add-item-container">
      <label>Item name: </label>
      <input type="text" v-model="name" />

      <label>1st Dibs URL: </label>
      <input @change="scrapeFirstDibs" type="text" v-model="firstDibsUrl" />
      
      <div>
        <input type="checkbox" v-model="sold" />
        <label> Sold</label>
      </div>

      <h3>Item preview</h3>
      <store-item class="item" v-if="cdnUrl !== ''" :item="item"></store-item>
      <div v-else class="item-placeholder">
        <span>Fill in fields to generate item preview</span>
      </div>

      <button class="create-item-button" @click="submitItem">Create Item</button>
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
      cdnUrl: '',  
      itemPlaceholder: {
        name: 'Placeholder name',
        cdnUrl: 'https://via.placeholder.com/400',
        sold: false
      }
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
          console.log('called submitItem')
          try {
            let imageName = parseInt(this.item.Image)
            
            // only increment if this is a new item
            if (this.itemForEdit === undefined) {
              // get latest image #, so I can increment it
              console.log("Getting next possible image ID...")
              const latestImageResponse = await axios.get(`${this.API_ENDPOINT}/latest-image-reference`)
              imageName = (parseInt(latestImageResponse.data.Image) + 1)
            }

            // upload image to cloudinary then
            // post request with item contents (name, imageNumber, sold, url)
            console.log('calling api')
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
            this.$router.push('/admin/confirmation')
          } catch (e) {
            console.log(e)
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

.add-item-container {
  display: flex;
  flex-direction: column;
  width: 95%;
  margin: auto;
  text-align: left;
}

.add-item-container > * {
  margin: 5px;
  padding: 5px;
}

.item-placeholder {
  background-color: rgb(200,200,200);
  width: 95%;
  margin: auto;
  height: 400px;
  border: 2px solid rgb(200,200,200);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-placeholder span {
  text-align: center;
  color: #444;
}

.item {
  margin: auto;
}

.create-item-button {
  margin-top: 20px;
  font-size: 20px;
  padding: 10px 0;
}

@media screen and (min-width: 768px) {
  .add-item-container {
    max-width: 400px;
    width: 60%;
  }

  .create-item-button {
    width: max-content;
    padding: 10px;
    margin-left: 10px;
  }

  .item, .item-placeholder {
    max-width: 400px;
    margin-left: 10px;
  }
}

</style>