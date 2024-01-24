<template>
    <div class="modal-content">
       <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
       </div>
       <div class="modal-body">
          {{ message }}
       </div>
       <div class="modal-footer">
          <button class="btn btn-primary" type="button" @click="ok()">{{ okButton }}</button>
          <button class="btn btn-warning" type="button" @click="cancel()">{{ cancelButton}}</button>
       </div>
    </div>
 </template>

 <script>
    import { closeModal } from "jenesius-vue-modal"

    export default {
        props : {
            title: String,
            message: String,
            okButton: String,
            cancelButton: String
        },
        methods : {
            ok() {
                this.$emit('confirmed', {});
                closeModal();
            },
            cancel() {
                closeModal();
            }
        }
    }
</script>