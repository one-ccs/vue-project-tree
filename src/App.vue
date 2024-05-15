<script setup lang="ts">
import { onMounted, ref } from 'vue';
import VueProjectTree, { type DroppedExtraData } from './components/ProjectTree.vue';

interface TreeNode {
    id: number;
    label: string;
    children?: TreeNode[];
};

const treeRef = ref<any>(null);
const treeData = ref<TreeNode[]>([]);
const currentNode = ref(treeData.value[0]);
let dragItem = <number | null>null;

// 模拟异步加载数据
const getData = () => {
    setTimeout(() => {
        treeData.value = [
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
        ];


        console.log(treeRef.value);
    }, 1000);
};

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
const onDroppedIn = async (event: DragEvent, dragData: any, dropData: any, extraData: DroppedExtraData) => {
    !!event;
    !!dragData;

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
        if (flag) extraData._default!();
    }
    if (dropData.id === 5) {
        extraData.preventDefault();
    }
};

onMounted(() => {
    getData();
});
</script>

<template>
    <div class="wrapper">
        <span
            class="item"
            v-for="i in [1,2,3,4,5]"
            draggable="true"
            @dragstart="dragItem = i, treeRef.setCurrentData(null)"
            @dragend="dragItem = null"
        >{{ i }}</span>
        <vue-project-tree
            ref="treeRef"
            :data="treeData"
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

<style lang="less">
html, body {
    margin: 0;
    width: 100%;
    height: 100%;
}
.wrapper {
    padding: 8px;

    .item {
        margin-right: 8px;
        border-radius: 8px;
        padding: 3px 8px;
        background-color: #fff;
        box-shadow: 0 0 6px -2px #333;
    }
    .vue-project-tree {
        margin-top: 12px;
        border-top: 1px solid #000;
    }
}
</style>
