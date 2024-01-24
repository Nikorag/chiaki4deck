<template>
  <div class="container console_container">
    <div
      v-for="host in hosts"
      :key="host.hostId"
      :class="['console_tile', getStatus(host)]"
      @click="open(host)">
      <div class="console_details">
        <p>{{ host.hostName }}</p>
        <p>Address: {{ host.address }}</p>
        <p>ID: {{ host.hostId }}</p>
        <p>
          ({{ host.chiakiStatus.registered ? "registered" : "unregistered" }})
        </p>
        <p>{{ host.chiakiStatus.discovered ? "discovered" : "" }}</p>
      </div>
      <div class="console_image">
        <PS4Vector v-if="host.hostType === 0"/>
        <PS5Vector v-else/>
      </div>
      <p class="console_state">State: {{ getStatus(host) }}</p>
    </div>
    <form method="POST"
      action="streamWindow"
      class="console_stream_form"
      id="stream_form">
      <input type="hidden" name="hostId" v-model="selectedHostId" />
    </form>
  </div>
</template>

<script>
import io from 'socket.io-client';
import PS4Vector from './PS4Vector.vue';
import PS5Vector from './PS5Vector.vue';
import RegistrationForm from './RegistrationForm.vue';
import {openModal} from "jenesius-vue-modal";


export default {
    components : {
      PS4Vector,
      PS5Vector
    },
    data() {
        return {
            hosts: [],
            selectedHostId: null,
            socket: io('http://localhost:9944')
        };
    },
    methods: {
        triggerConsole(host) {
            console.log(`triggered Host ${host.hostId}`);
        },

        getStatus(host) {
          if (host.status == 620) { return "Standby"; }
          if (host.status == 200) { return "Ready"; }
          return "UNKNOWN";
        },

        async open(host) {
          const modal = await openModal(RegistrationForm, {host : host});
          modal.on("register_console", (form) => {
            this.socket.emit("register", form);
          })
        }
    },
    mounted() {

        // Connect to WebSocket and listen for 'discovered_hosts' message
        this.socket.on('discovered_hosts', (data) => {
            this.hosts = data;
        });
    },
};
</script>

<style lang="less" scoped>
@import '@/less/console_tiles.less';
</style>