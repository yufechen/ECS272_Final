<script lang="ts">

import Scatterplot from './components/Scatterplot.vue'
import Herodetail from './components/Herodetail.vue'
import Heroradar from './components/Heroradar.vue';

export default {
  components: {
    Scatterplot,
    Herodetail,
    Heroradar,
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
      <v-col cols="6">
        <Herodetail />
      </v-col>
      <v-col>
        <Heroradar />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
#main-container{
  height: 100%;
}
</style>
