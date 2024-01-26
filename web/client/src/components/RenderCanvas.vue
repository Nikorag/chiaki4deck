<template>
  <div class="imageContainer">
    <img :src="jpegFrame" alt="Frame">
  </div>
</template>

<script>
export default {
  props: {
    jpegFrame: String
  }
}
</script>
  
<style lang="less" scoped>
  .imageContainer {
    position:absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>