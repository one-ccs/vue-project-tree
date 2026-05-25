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
const allowDrop = (data: TreeNode) => {
  return true;
};
const onDroppedIn = async (
  event: DragEvent,
  dragData: TreeNode[],
  dropData: TreeNode,
  extraData: DroppedExtraData
) => {
  const dragItem = event.dataTransfer?.getData('text/plain');
  if (dragItem) {
    extraData.preventDefault();
    if (!dropData.children) dropData.children = [];

    dropData.children.push({
      id: `${dropData.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: `item ${dragItem}`,
    });
    return;
  }
};

const filterMethod = (value: any, data: NodeData) => {
  return data._label?.includes(value);
};
const doFilter = (value: any) => {
  (treeRef.value as any)?.filter(value);
};

onMounted(async () => {
  treeData.value = await getData();
});

defineExpose({ doFilter });
</script>

<template>
  <div class="normal">
    <h3>虚拟滚动树</h3>
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
      :filter-method="filterMethod"
      draggable
      :height="500"
      :allow-drop="allowDrop"
      @dropped-in="onDroppedIn"
    >
    </vue-project-tree>
  </div>
</template>

<style lang="less"></style>
