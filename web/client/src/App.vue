<template>
  <div v-if="!sessionStarted">
    <nav class="navbar navbar-default" role="navigation">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">Web Chiaki</a>
            </div>
        </div>
    </nav>
    <ConsoleTile :hosts="hosts" :socket="socket"/>
  </div>
  <div v-if="sessionStarted">
    <RenderCanvas ref="renderCanvas" :jpegFrame="jpegFrame"/>
  </div>
  <widget-container-modal />
</template>
<script>
  import io from 'socket.io-client';
  import ConsoleTile from "./components/ConsoleTile";
  import RenderCanvas from './components/RenderCanvas';
  import {container} from "jenesius-vue-modal";
  
  
  export default {
    name: 'App',
    components: {
      ConsoleTile,
      RenderCanvas,
      WidgetContainerModal: container
    },
    data() {
          return {
              sessionStarted: false,
              socket: io('http://localhost:9944'),
              hosts: [],
              jpegFrame: ""
          };
      },
    mounted() {
      // Connect to WebSocket and listen for 'discovered_hosts' message
      this.socket.on('discovered_hosts', (data) => {
        this.hosts = data;
      });
  
      this.socket.on('image_data', (jpeg) => {
        if (!this.sessionStarted) this.sessionStarted = true;
        this.jpegFrame = jpeg;
      });
    }
  }
</script>
<style>
</style>