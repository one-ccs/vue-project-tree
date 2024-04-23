<script setup lang="ts">
import { ref } from 'vue';
import VueProjectTree from './components/ProjectTree.vue';

interface TreeNode {
    id: number;
    label: string;
    children?: TreeNode[];
};

const data = ref<TreeNode[]>([
    {
        id: 1,
        label: "1 不允许拖拽",
        children: [
            {
                id: 2,
                label: "2 延迟异步放入",
                children: [
                    {
                        id: 3,
                        label: "3"
                    },
                    {
                        id: 4,
                        label: "4"
                    },
                ]
            },
            {
                id: 5,
                label: "5 取消默认的移动操作",
            },
        ],
    },
    {
        id: 6,
        label: "6 不允许拖拽",
    },
    {
        id: 7,
        label: "7 不允许拖拽、放下",
    },
]);
const currentNode = ref(data.value[0]);

const onCurrentNodeChange = (data: any) => {
    currentNode.value = data;
};
const allowDrag = (data: any) => {
    if (data.id === 1) return false;
    if (data.id === 6) return false;
    if (data.id === 7) return false;
    return true;
};
const allowDrop = (data: any) => {
    if (data.id === 7) return false;
    return true;
};
const onDroppedIn = async (dragData: any, dropData: any, preventDefault: Function, _default: Function) => {
    !!dragData;
    if (dropData.id === 2) {
        // 取消默认移动操作
        preventDefault();
        // 模拟异步
        let flag = await new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
        if (flag) _default();
    }
    if (dropData.id === 5) {
        preventDefault();
    }
};
</script>

<template>
    <div class="tree">
        <vue-project-tree
            :data="data"
            node-icon
            @current-node-change="onCurrentNodeChange"
            draggable
            sortable
            :allow-drag="allowDrag"
            :allow-drop="allowDrop"
            @dropped-in="onDroppedIn"
        >
        </vue-project-tree>
    </div>
</template>

<style>
html, body {
    margin: 0;
    width: 100%;
    height: 100%;
}
.tree {
    padding: 8px;
}
</style>
