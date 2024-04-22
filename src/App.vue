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
                label: "2",
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
                label: "5",
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
