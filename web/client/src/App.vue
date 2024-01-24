<template>
    <ConsoleTile/>
    <widget-container-modal />
</template>

<script>
import ConsoleTile from "./components/ConsoleTile";
import {container} from "jenesius-vue-modal";


export default {
  name: 'App',
  components: {
    ConsoleTile,
    WidgetContainerModal: container
  }
}
</script>

<style>

</style>
