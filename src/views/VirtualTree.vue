<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { DroppedExtraData, NodeData } from '@/utils/interface';
import VueProjectTree from '@/components/ProjectTree.vue';

interface TreeNode extends NodeData {
  id?: string;
  label?: string;
  children?: TreeNode[];
}

const treeRef = ref<HTMLElement>();
const treeData = ref<TreeNode[]>([]);
const currentData = ref<TreeNode>();

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = 'node'
): TreeNode[] => {
  let id = 0;
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber = deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren);
      const nodeKey = `${key}-${++id}`;

      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      };
    });
};
// 模拟异步加载数据
const getData = (): Promise<TreeNode[]> => {
  return new Promise<TreeNode[]>(resolve => {
    setTimeout(() => {
      resolve(createData(3, 50, 5));
    }, 1000);
  });
};

const t = ref(0);
const onCurrentDataChange = (data: TreeNode | undefined) => {
  t.value++;
};

onMounted(async () => {
  treeData.value = await getData();
});
</script>

<template>
  <div class="normal">
    <h3>虚拟滚动树</h3>
    <hr />
    <span
      class="item"
      v-for="i in ['1', '2', '3', '4', '5']"
      draggable="true"
      @dragstart="(event: DragEvent) => event.dataTransfer?.setData('text/plain', i)"
      >{{ i }}</span
    >
    <hr />
    <p>当前节点 id：{{ currentData?.id }}</p>
    <p>当前节点变化次数：{{ t }}</p>
    <vue-project-tree
      ref="treeRef"
      virtual
      v-model="currentData"
      :data="treeData"
      checkbox
      node-icon
      @current-data-change="onCurrentDataChange"
      draggable
      :height="500"
    >
    </vue-project-tree>
  </div>
</template>

<style lang="less"></style>
