<script setup lang="ts">
import NormalTree from './views/NormalTree.vue';
import VirtualTree from './views/VirtualTree.vue';
</script>

<template>
  <div class="wrapper">
    <h1>Vue Project Tree</h1>
    <p>使用 Vue3 + TS 实现的树形结构展示组件，有拖拽、排序、自定义图标等功能</p>
    <div class="container">
      <div class="tree">
        <normal-tree />
      </div>
      <div class="tree">
        <virtual-tree />
      </div>
    </div>
  </div>
</template>

<style lang="less">
html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  color: #888;
}

#app {
  width: 100%;
  height: 100%;
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .tree {
      box-sizing: border-box;
      margin: 8px 20px;
      height: 100%;
      width: 50%;
    }
  }
}
</style>
