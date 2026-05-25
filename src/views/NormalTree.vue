<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import type { DroppedExtraData, NodeData } from '@/utils/interface';
import VueProjectTree from '@/components/ProjectTree.vue';

interface TreeNode extends NodeData {
  id?: number;
  label?: string;
  children?: TreeNode[];
}

const treeRef = useTemplateRef('treeRef');
const treeData = ref<TreeNode[]>([]);
const currentData = ref<TreeNode>();

// 模拟异步加载数据
const getData = (): Promise<TreeNode[]> => {
  return new Promise<TreeNode[]>(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          label: '1 不允许拖拽',
          children: [
            {
              id: 2,
              label: '2 延迟异步放入',
              children: [
                {
                  id: 3,
                  label: '3',
                },
                {
                  id: 4,
                  label: '4',
                },
              ],
            },
            {
              id: 5,
              label: '5 该节点被被拖放到节点内部时，不会真的移动',
            },
          ],
        },
        {
          id: 6,
          label: '6 不允许拖拽',
        },
        {
          id: 7,
          label: '7 不允许拖拽、放下',
        },
        {
          id: 8,
          label: '8 大量数据',
          children: [],
        },
      ]);
    }, 1000);
  });
};

const t = ref(0);
const onCurrentDataChange = (data: TreeNode | undefined) => {
  t.value++;
};
const allowDrag = (data: TreeNode) => {
  if (data.id === 1) return false;
  if (data.id === 6) return false;
  if (data.id === 7) return false;
  return true;
};
const allowDrop = (data: TreeNode) => {
  if (data.id === 7) return false;
  return true;
};
const onDroppedIn = async (
  event: DragEvent,
  dragData: TreeNode[],
  dropData: TreeNode,
  extraData: DroppedExtraData
) => {
  !!event;

  const dragItem = event.dataTransfer?.getData('text/plain');
  if (dragItem) {
    extraData.preventDefault();
    if (!dropData.children) dropData.children = [];

    dropData.children.push({
      id: Math.random(),
      label: `item ${dragItem}`,
    });
    return;
  }
  if (dropData.id === 2) {
    // 取消默认移动操作
    extraData.preventDefault();
    // 模拟异步
    let flag = await new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
    // 调用默认移动操作
    if (flag) extraData._default!();
  }
  if (dragData[0] && dragData[0].id === 5) {
    extraData.preventDefault();
  }
};

const filterMethod = (value: any, data: NodeData) => {
  console.log(data);

  return data._label?.includes(value);
};
const onSearch = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  (treeRef.value as any)?.filter(value);
};

onMounted(async () => {
  treeData.value = await getData();
});
</script>

<template>
  <div class="normal">
    <h3>普通树</h3>
    <hr />
    <span
      class="item"
      v-for="i in ['1', '2', '3', '4', '5']"
      draggable="true"
      @dragstart="(event: DragEvent) => event.dataTransfer?.setData('text/plain', i)"
      >{{ i }}</span
    >
    <hr />
    <input type="text" @change="onSearch" />
    <p>当前节点 id：{{ currentData?.id }}</p>
    <p>当前节点变化次数：{{ t }}</p>
    <vue-project-tree
      ref="treeRef"
      v-model="currentData"
      :data="treeData"
      checkbox
      node-icon
      @current-data-change="onCurrentDataChange"
      :filter-method="filterMethod"
      draggable
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      @dropped-in="onDroppedIn"
    >
    </vue-project-tree>
  </div>
</template>

<style lang="less">
.normal {
  hr {
    opacity: 0.3;
  }

  & > p {
    padding: 0;
    margin: 0;
  }

  .item {
    margin-right: 8px;
    border-radius: 8px;
    padding: 3px 8px;
    background-color: #fff;
    box-shadow: 0 0 6px -2px #333;
  }

  .vue-project-tree {
    --color-current: unset;
  }
}
</style>
