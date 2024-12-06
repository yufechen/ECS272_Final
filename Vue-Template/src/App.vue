<script lang="ts">

import { ref, onMounted, onUnmounted} from 'vue';
import Scatterplot from './components/Scatterplot.vue'
import Herodetail from './components/Herodetail.vue'
import Heroradar from './components/Heroradar.vue'
import mapTracker from './components/mapTracker.vue';

export default {
  components: {
    Scatterplot,
    Herodetail,
    Heroradar,
    mapTracker,
  },

  setup() {
    const scale = ref(1);

    const updateScale = () => {
        const width = window.innerWidth;
        scale.value = width / 1650; // Adjust 1920 to your base width for scaling
    };

    onMounted(() => {
        window.addEventListener('resize', updateScale);
        updateScale(); // Set initial scale
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScale);
    });

    return {scale};
  }
}
</script>

<!--This is using the grid component from Vuetify to do layout design-->
<template>
  <v-container id="main-container" class="d-flex flex-column flex-nowrap" fluid>
    <v-row no-gutters>
      <v-col cols="5">
        <Scatterplot />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="6" class="scale-container" fluid :style="{ transform: `scale(${scale})` }">
        <Herodetail />
      </v-col>
      <v-col cols="6" class="scale-container" fluid :style="{ transform: `scale(${scale})` }">
        <Heroradar />
      </v-col>
    </v-row>
    <!-- <v-row no-gutters>
      <v-col>
          <mapTracker />
      </v-col>
    </v-row> -->
  </v-container>
</template>

<style scoped>
#main-container{
  margin-top: 2vh;
  height: 100%;
}
.scale-container {
  transition: transform 0.3s ease-in-out; 
  transform-origin: top left;
}
</style>
