<template>
    <div class="modal-content">
  <div class="modal-header">
    <h3 class="modal-title">Register Console</h3>
</div>
<div class="modal-body">
    <div class="form-group">
        <label for="InputAddress">Host address</label>
        <input type="text" class="form-control" id="InputAddress"
               aria-describedby="addressHelp" placeholder="Enter Host" v-model="address">
    </div>
    <span @change="handleRadioChange">
        <div class="form-check">
            <input class="form-check-input" type="radio" name="addressType" id="addressType_ps4_lt7" value="ps4_lt7" v-model="addressType">
            <label class="form-check-label" for="addressType_ps4_lt7">
                PS4 Firmware &lt; 7.0
            </label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="addressType" id="addressType_ps4_gt_7_lt_8" value="ps4_gt_7_lt_8" v-model="addressType">
            <label class="form-check-label" for="addressType_ps4_gt_7_lt_8">
                PS4 Firmware >= 7.0, &lt; 8.0
            </label>
        </div>
        <div class="form-check disabled">
            <input class="form-check-input" type="radio" name="addressType" id="addressType_ps4_gt_8" value="ps4_gt_8" v-model="addressType">
            <label class="form-check-label" for="addressType_ps4_gt_8">
                PS4 Firmware >= 8.0
            </label>
        </div>
        <div class="form-check disabled">
            <input class="form-check-input" type="radio" name="addressType" id="addressType_ps5" value="ps5" v-model="addressType">
            <label class="form-check-label" for="addressType_ps5">
                PS5
            </label>
        </div>
    </span>
    <div class="form-group">
        <label for="psnOnlineId">PSN Online-ID</label>
        <input type="text" class="form-control" id="psnOnlineId" v-model="psnOnlineId"
               aria-describedby="psnOnlineIdHelp" placeholder="Enter PSN Online-ID" :disabled="isOnlineIdDisabled">
    </div>
    <div class="form-group">
        <label for="psnAccountId">PSN Account-ID (base64)</label>
        <input type="text" class="form-control" id="psnAccountId" v-model="psnAccountId"
               aria-describedby="psnAccountIdHelp" placeholder="Enter PSN Account-ID (base64)">
    </div>
    <div class="form-group">
        <label for="pin">PIN</label>
        <input type="number" class="form-control" id="pin" v-model="pin"
               aria-describedby="psnAccountIdHelp" placeholder="Enter PIN">
    </div>
</div>
<div class="modal-footer">
    <button class="btn btn-primary" type="button" @click="ok()">Register</button>
    <button class="btn btn-warning" type="button" @click="cancel()">Cancel</button>
</div>
</div>
</template>

<script>
import { closeModal } from "jenesius-vue-modal"
    export default {
        props : {
            host: Object
        },
        data() {
            let dataObj = {
                ...this.host,
                addressType : (this.host.hostType == 1 ? "ps5" : "ps4_gt_8"),
                psnOnlineId: "",
                psnAccountId: "",
                pin: ""
            }
            console.log(dataObj);
            return dataObj;
        },
        methods : {
            ok() {
                this.$emit('register_console', {
                    hostId: this.hostId,
                    inputAddress: this.address,
                    addressType: mapAddressType(this.addressType),
                    psnOnlineId: this.psnOnlineId,
                    psnAccountId: this.psnAccountId,
                    pin: this.pin.toString(),
                });
                closeModal();
            },
            cancel() {
                closeModal();
            },
            handleRadioChange() {
                if (this.addressType == "ps5" || this.addressType == "ps4_gt_8"){
                    this.psnOnlineId = "";
                }
            },
            isOnlineIdDisabled() {
                console.log("Disabled is "+(this.addressType == "ps5" || this.addressType == "ps4_gt_8")+" "+this.addressType);
                return (this.addressType == "ps5" || this.addressType == "ps4_gt_8");
            }
        }
    }

    function mapAddressType(type) {
	if (type == "ps5") return 1000100;
	if (type == "ps4_lt_7") return 800;
	if (type == "ps4_gt_7_lt_8") return 900;
	if (type == "ps4_gt_8") return 1000;
	return 1000100;
}
</script>

<style>
.modal-content {
  width: 45%;
}
</style>