<script lang="ts">

import Notes from './components/Notes.vue'
import NotesWithStore from './components/NotesWithStore.vue'
import Example from './components/Example.vue'
import Scatterplot from './components/Scatterplot.vue'

export default {
  components: {
    Notes,
    Example,
    NotesWithStore,
    Scatterplot
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
  </v-container>
</template>

<style scoped>
#main-container{
  height: 100%;
}
</style>
