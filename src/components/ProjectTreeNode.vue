<template>
    <div
        class="project-tree-node"
        :class="{
            'is-current': highlightCurrent && currentNode[idKey] === data[idKey],
            'is-expanded': safeBoolean(data._isExpanded, true),
            'is-checked': safeBoolean(data._isChecked),
        }"
        v-show="safeBoolean(data._isVisible, true)"
        ref="projectTreeNodeRef"
        :draggable="safeBoolean(draggable && allowDrag(data))"
        @dragstart.self="onDragStart($event, data, projectTreeNodeRef)"
        @dragend.self="onDragEnd($event, data, projectTreeNodeRef)"
    >
        <div
            class="project-tree-node__content"
            @click.self="onNodeClick($event, data, projectTreeNodeRef)"
            @dblclick.self="onNodeDblclick($event, data, projectTreeNodeRef)"
            @contextmenu.self="onNodeRightClick($event, data, projectTreeNodeRef)"
            @dragenter.self="onDragEnter($event, data, projectTreeNodeRef)"
            @dragover.self="onDragOver($event, data, projectTreeNodeRef)"
            @dragleave.self="onDragLeave($event, data, projectTreeNodeRef)"
            @drop="onDropped($event, data, projectTreeNodeRef)"
        >
            <div class="project-tree-node-line" v-for="_ in level" />
            <div
                class="project-tree-icon project-tree-expand-icon"
                v-if="expandIcon"
                :style="{ visibility: data[childrenKey]?.length ? 'visible' : 'hidden'}"
                @click="onExpandClick($event, data, projectTreeNodeRef)"
            >
                <slot name="expandIcon" :data="data" :size="expandIconSize">
                    <svg viewBox="0 0 1024 1024" fill="currentColor" :width="expandIconSize" :height="expandIconSize">
                        <path d="M322.58048 852.35712a34.05824 34.05824 0 0 1-8.51968-48.9472l192.14336-255.50848a59.65824 59.65824 0 0 0 0-71.80288l-192.14336-255.488a34.03776 34.03776 0 0 1 8.51968-48.9472 47.18592 47.18592 0 0 1 57.344 4.096l310.12864 276.70528a79.60576 79.60576 0 0 1 0 119.07072l-310.10816 276.6848a47.18592 47.18592 0 0 1-57.344 4.13696z" />
                    </svg>
                </slot>
            </div>
            <div
                class="project-tree-icon project-tree-node-icon"
                v-if="nodeIcon"
            >
                <slot name="nodeIcon" :data="data" :size="nodeIconSize">
                    <svg viewBox="0 0 1024 1024" fill="currentColor" :width="nodeIconSize" :height="nodeIconSize">
                        <path d="M512 178c45.1 0 88.8 8.8 130 26.2 39.8 16.8 75.5 40.9 106.2 71.6 30.7 30.7 54.8 66.4 71.6 106.2 17.4 41.1 26.2 84.9 26.2 130s-8.8 88.8-26.2 130c-16.8 39.8-40.9 75.5-71.6 106.2-30.7 30.7-66.4 54.8-106.2 71.6-41.1 17.4-84.9 26.2-130 26.2s-88.8-8.8-130-26.2c-39.8-16.8-75.5-40.9-106.2-71.6-30.7-30.7-54.8-66.4-71.6-106.2-17.4-41.1-26.2-84.9-26.2-130s8.8-88.8 26.2-130c16.8-39.8 40.9-75.5 71.6-106.2 30.7-30.7 66.4-54.8 106.2-71.6 41.2-17.4 84.9-26.2 130-26.2m0-50c-212.1 0-384 171.9-384 384s171.9 384 384 384 384-171.9 384-384-171.9-384-384-384z" />
                        <path d="M470.8 712.3c-1.7-24.1 12.2-42.6 32.7-46.6 25.5-5 49 15 49.7 41 0.7 24.9-15.1 44.4-40.2 44.9-22.2 0.6-40.6-17-42.2-39.3z m16.7-127.8l-8.1-278.6c-0.5-18.4 14.2-33.6 32.6-33.6 18.4 0 33.2 15.2 32.6 33.6l-8.1 278.6c-0.4 13.2-11.2 23.8-24.5 23.8-13.3-0.1-24.1-10.6-24.5-23.8z" />
                    </svg>
                </slot>
            </div>
            <div class="project-tree-label">
                <div v-if="safeBoolean(data._isDropBefore)" class="project-tree-label-drag-top-line"></div>
                <div
                    class="project-tree-label-text"
                    :class="{
                        'is-drop-in': safeBoolean(data._isDropIn),
                    }"
                >{{ data.label }}</div>
                <div v-if="safeBoolean(data._isDropAfter)" class="project-tree-label-drag-bottom-line"></div>
            </div>
        </div>
        <template v-if="data[childrenKey]?.length">
            <expand-transition>
                <div
                    class="project-tree-node__children"
                    v-show="safeBoolean(data._isExpanded, true)"
                >
                    <project-tree-node
                        v-for="node in data[childrenKey]"
                        :key="node[idKey]" :data="node"
                        :id-key="idKey"
                        :label-key="labelKey"
                        :children-key="childrenKey"
                        :current-node="currentNode"
                        :highlight-current="highlightCurrent"
                        :level="level + 1"
                        :expand-icon="expandIcon"
                        :expand-icon-size="expandIconSize"
                        :node-icon="nodeIcon"
                        :node-icon-size="nodeIconSize"
                        @expand-click="onExpandClick"
                        @node-click.self="onNodeClick"
                        @node-dblclick="onNodeDblclick"
                        @node-right-click="onNodeRightClick" :draggable="draggable"
                        :allow-drag="allowDrag"
                        :allow-drop="allowDrop"
                        @start="onDragStart"
                        @enter="onDragEnter"
                        @leave="onDragLeave"
                        @over="onDragOver"
                        @dropped="onDropped"
                        @end="onDragEnd"
                    >
                        <template #expandIcon="slotProps: { data : any, size: number }">
                            <slot name="expandIcon" :data="slotProps.data" :size="slotProps.size"></slot>
                        </template>
                        <template #nodeIcon="slotProps: { data : any, size: number }">
                            <slot name="nodeIcon" :data="slotProps.data" :size="slotProps.size"></slot>
                        </template>
                    </project-tree-node>
                </div>
            </expand-transition>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, toRefs } from 'vue';
import ExpandTransition from './ExpandTransition.vue';

const props = defineProps<{
    data: any;
    idKey: string;
    labelKey: string;
    childrenKey: string;
    currentNode: any;
    highlightCurrent?: boolean;
    level: number;
    expandIcon: boolean,
    expandIconSize: number | string;
    nodeIcon: boolean;
    nodeIconSize: number | string;
    draggable: boolean;
    allowDrag: Function;
    allowDrop: Function;
}>();

const {
    data,
    idKey,
    labelKey,
    childrenKey,
    currentNode,
    highlightCurrent,
    level,
    expandIcon,
    expandIconSize,
    nodeIcon,
    nodeIconSize,
    draggable,
    allowDrag,
    allowDrop,
} = toRefs(props);

const projectTreeNodeRef = ref<any>(null);

/* 注意：以下事件会层层冒泡，多次触发，请勿添加事务代码，仅抛出事件 */
const emit = defineEmits<{
    (e: "expandClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeDblclick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeRightClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "start", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "enter", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "over", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "leave", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "dropped", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "end", event: DragEvent, data: any, nodeElement: HTMLElement): void,
}>();

// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("expandClick", event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("nodeClick", event, data, nodeElement);
};
// 节点双击事件
const onNodeDblclick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("nodeDblclick", event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("nodeRightClick", event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("start", event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("enter", event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("over", event, data, nodeElement);
};
// 节点拖拽；离开事件
const onDragLeave = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("leave", event, data, nodeElement);
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("end", event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    emit("dropped", event, data, nodeElement);
};

/**
 * 加强的布尔判断
 * @param value 判断值
 * @param _default 当 value 为 undefined 或 null 时的返回值
 */
const safeBoolean = (value: any, _default = false): boolean => {
    if (value === undefined || value === null) return _default;
    return !!value;
};
</script>

<style lang="less">
.project-tree-node {
    --color: #666666;
    --color-current: #4C74F6;
    --color-drop-in: #fff;
    --bg-color: transparent;
    --bg-color-current: #E0EFFF;
    --bg-color-checked: #E0EFFF;
    --bg-color-hover: #0000000a;
    --bg-color-drop-in: #409eff;
    white-space: nowrap;
    color: var(--color);
    background-color: var(--bg-color);

    /* 当前节点样式 */
    &.is-current {
        .project-tree-node__content {
            --color: var(--color-current);
        }

        >.project-tree-node__content {
            background-color: var(--bg-color-current);

            &:hover {
                background-color: var(--bg-color-current);
            }
        }
    }

    /* 选中节点样式 */
    &.is-checked {
        background-color: var(--bg-color-checked);
    }

    /* 展开节点样式 */
    &.is-expanded {
        >.project-tree-node__content {
            >.project-tree-expand-icon {
                transform: rotateZ(90deg);
            }
        }
    }

    .project-tree-node__content {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        color: var(--color);
        height: var(--node-height);
        background-color: var(--bg-color);
        user-select: none;
        cursor: pointer;

        &:hover {
            background-color: var(--bg-color-hover);
        }

        /* 连接线占位盒子 */
        .project-tree-node-line {
            position: relative;
            flex: 0 0 auto;
            width: var(--indent-width);
            height: 100%;

            /* 连接线 */
            &::before {
                content: "";
                position: absolute;
                top: 0;
                left: 50%;
                border-left: 1px solid #d9d9d9;
                height: 100%;
            }
        }
        .project-tree-icon {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
        }
        .project-tree-expand-icon {
            flex: 0 0 auto;
            width: var(--indent-width);
            text-align: center;
            transform: rotateZ(0deg);
            transition: transform .3s ease-in-out;
        }

        .project-tree-node-icon {
            flex: 0 0 auto;
            width: var(--indent-width);
            pointer-events: none;
        }

        .project-tree-label {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            margin: 0 5px;
            width: 100%;
            height: 100%;
            color: var(--color);
            background-color: var(--bg-color);
            pointer-events: none;

            .project-tree-label-drag-top-line {
                position: absolute;
                top: 0;
                width: 100%;
                border-top: 1px solid var(--bg-color-drop-in);
            }

            .project-tree-label-text {
                padding: 3px 0;
                color: var(--color);
                background-color: var(--bg-color);

                &.is-drop-in {
                    --color: var(--color-drop-in);
                    background-color: var(--bg-color-drop-in);
                }
            }

            .project-tree-label-drag-bottom-line {
                position: absolute;
                bottom: 0;
                width: 100%;
                border-bottom: 2px solid var(--bg-color-drop-in);
            }
        }
    }
}
</style>
