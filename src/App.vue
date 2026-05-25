<script setup lang="ts">
import { ref } from 'vue';
import NormalTree from './views/NormalTree.vue';
import VirtualTree from './views/VirtualTree.vue';

const normalTreeRef = ref<InstanceType<typeof NormalTree>>();
const virtualTreeRef = ref<InstanceType<typeof VirtualTree>>();
const filterText = ref('');

const onSearchInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  filterText.value = value;
  normalTreeRef.value?.doFilter(value);
  virtualTreeRef.value?.doFilter(value);
};
</script>

<template>
  <div class="wrapper">
    <h1 class="title">Vue Project Tree</h1>
    <p class="desc">使用 Vue3 + TS 实现的树形结构展示组件，有拖拽、排序、自定义图标等功能</p>
    <div class="toolbar">
      <div class="drag-items">
        <span class="tip">拖拽添加：</span>
        <span
          class="item"
          v-for="i in ['1', '2', '3', '4', '5']"
          :key="i"
          draggable="true"
          @dragstart="(event: DragEvent) => event.dataTransfer?.setData('text/plain', i)"
          >{{ i }}</span
        >
      </div>
      <div class="search-box">
        <input type="text" placeholder="输入关键词筛选节点…" @input="onSearchInput" />
      </div>
    </div>
    <div class="container">
      <div class="tree">
        <normal-tree ref="normalTreeRef" />
      </div>
      <div class="tree">
        <virtual-tree ref="virtualTreeRef" />
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
  width: 100%;
  height: 100%;

  .title {
    margin: 10px;
  }

  .desc {
    margin: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    width: calc(100% - 40px);
    margin: 10px 0 -10px;
    gap: 16px;
    flex-shrink: 0;

    .drag-items {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;

      .tip {
        font-size: 13px;
        color: #999;
        margin-right: 4px;
      }

      .item {
        border-radius: 8px;
        padding: 3px 8px;
        background-color: #fff;
        box-shadow: 0 0 6px -2px #333;
        cursor: grab;
        user-select: none;

        &:active {
          cursor: grabbing;
        }
      }
    }

    .search-box {
      input {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 13px;
        outline: none;
        width: 180px;
        color: #666;

        &:focus {
          border-color: #4c74f6;
        }
      }
    }
  }

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
