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
import PS4Vector from './PS4Vector.vue';
import PS5Vector from './PS5Vector.vue';
import RegistrationForm from './RegistrationForm.vue';
import ConfirmDialog from "./ConfirmDialog.vue";
import {openModal} from "jenesius-vue-modal";


export default {
    components : {
      PS4Vector,
      PS5Vector
    },
    props: {
        hosts: Array,
        socket: Object
    },
    data() {
        return {
            selectedHostId: null,
            frameData: null
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
          if (host.registered){
            if (host.status == 620) { //standby
              console.log(host);
              const modal = await openModal(ConfirmDialog, {
                title : `Wakeup up ${host.hostName}?`,
                message : `${host.hostName} is in Standby. Would you like to wake it up?`,
                okButton : "Wakeup",
                cancelButton : "Cancel"
              });
              modal.on("confirmed", () => {
                this.socket.emit("wake", host);
              })
            } else {
              this.socket.emit("start_stream", host.hostId);
            }
          } else {
            const modal = await openModal(RegistrationForm, {host : host});
            modal.on("register_console", (form) => {
              this.socket.emit("register", form);
            })
          }
        }
    }
};
</script>

<style lang="less" scoped>
@import '@/less/console_tiles.less';
</style>