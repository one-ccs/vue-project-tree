<template>
    <div
        class="project-tree-node"
        :class="{
            'is-current': highlightCurrent && currentData && currentData[idKey] === data[idKey],
            'is-expanded': data._isExpanded,
            'is-selected': data._isSelected,
            'is-moving': data._isMoving,
        }"
        v-show="data._isVisible"
        ref="projectTreeNodeRef"
        :draggable="draggable && allowDrag(data)"
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
            <!-- 缩进 -->
            <div class="project-tree-node-line" v-for="_ in level" />
            <!-- 展开图标 -->
            <div
                v-if="expandIcon"
                class="project-tree-icon project-tree-expand-icon"
                :style="{
                    visibility: data[childrenKey]?.length ? 'visible' : 'hidden',
                    display: !data[childrenKey]?.length && !expandIconHold ? 'none' : undefined,
                }"
                @click="onExpandClick($event, data, projectTreeNodeRef)"
            >
                <slot name="expandIcon" :data="data" :size="expandIconSize">
                    <svg viewBox="0 0 1024 1024" fill="currentColor" :width="expandIconSize" :height="expandIconSize">
                        <path d="M322.58048 852.35712a34.05824 34.05824 0 0 1-8.51968-48.9472l192.14336-255.50848a59.65824 59.65824 0 0 0 0-71.80288l-192.14336-255.488a34.03776 34.03776 0 0 1 8.51968-48.9472 47.18592 47.18592 0 0 1 57.344 4.096l310.12864 276.70528a79.60576 79.60576 0 0 1 0 119.07072l-310.10816 276.6848a47.18592 47.18592 0 0 1-57.344 4.13696z" />
                    </svg>
                </slot>
            </div>
            <!-- 节点图标 -->
            <div
                v-if="nodeIcon"
                class="project-tree-icon project-tree-node-icon"
            >
                <slot name="nodeIcon" :data="data" :size="nodeIconSize">
                    <svg viewBox="0 0 1024 1024" fill="currentColor" :width="nodeIconSize" :height="nodeIconSize">
                        <path d="M512 178c45.1 0 88.8 8.8 130 26.2 39.8 16.8 75.5 40.9 106.2 71.6 30.7 30.7 54.8 66.4 71.6 106.2 17.4 41.1 26.2 84.9 26.2 130s-8.8 88.8-26.2 130c-16.8 39.8-40.9 75.5-71.6 106.2-30.7 30.7-66.4 54.8-106.2 71.6-41.1 17.4-84.9 26.2-130 26.2s-88.8-8.8-130-26.2c-39.8-16.8-75.5-40.9-106.2-71.6-30.7-30.7-54.8-66.4-71.6-106.2-17.4-41.1-26.2-84.9-26.2-130s8.8-88.8 26.2-130c16.8-39.8 40.9-75.5 71.6-106.2 30.7-30.7 66.4-54.8 106.2-71.6 41.2-17.4 84.9-26.2 130-26.2m0-50c-212.1 0-384 171.9-384 384s171.9 384 384 384 384-171.9 384-384-171.9-384-384-384z" />
                        <path d="M470.8 712.3c-1.7-24.1 12.2-42.6 32.7-46.6 25.5-5 49 15 49.7 41 0.7 24.9-15.1 44.4-40.2 44.9-22.2 0.6-40.6-17-42.2-39.3z m16.7-127.8l-8.1-278.6c-0.5-18.4 14.2-33.6 32.6-33.6 18.4 0 33.2 15.2 32.6 33.6l-8.1 278.6c-0.4 13.2-11.2 23.8-24.5 23.8-13.3-0.1-24.1-10.6-24.5-23.8z" />
                    </svg>
                </slot>
            </div>
            <!-- 节点标签 -->
            <div class="project-tree-label">
                <div v-if="data._isDropBefore" class="project-tree-label-drag-top-line"></div>
                <div
                    class="project-tree-label-text"
                    :class="{
                        'is-drop-in': data._isDropIn,
                    }"
                >
                    <slot name="label" :data="data">
                        <span>{{ data._label }}</span>
                    </slot>
                </div>
                <div v-if="data._isDropAfter" class="project-tree-label-drag-bottom-line"></div>
            </div>
        </div>
        <!-- 子节点 -->
        <template v-if="data[childrenKey]?.length">
            <expand-transition>
                <div
                    class="project-tree-node__children"
                    v-show="data._isExpanded"
                >
                    <template v-for="node in data[childrenKey]" :key="node">
                        <project-tree-node
                            v-if="node ? true : (console.warn(`未渲染节点, 无效的节点数据(${node})`), false)"
                            :parent="data"
                            :data="node"
                            :id-key="idKey"
                            :label-key="labelKey"
                            :children-key="childrenKey"
                            :current-data="currentData"
                            :highlight-current="highlightCurrent"
                            :level="level + 1"
                            :expand-icon-hold="expandIconHold"
                            :expand-icon="expandIcon"
                            :expand-icon-size="expandIconSize"
                            :node-icon="nodeIcon"
                            :node-icon-size="nodeIconSize"
                            @expand-click="onExpandClick"
                            @node-click.self="onNodeClick"
                            @node-dblclick="onNodeDblclick"
                            @node-right-click="onNodeRightClick"
                            :draggable="draggable"
                            :allow-drag="allowDrag"
                            :allow-drop="allowDrop"
                            @start="onDragStart"
                            @enter="onDragEnter"
                            @leave="onDragLeave"
                            @over="onDragOver"
                            @dropped="onDropped"
                            @end="onDragEnd"
                        >
                            <template #expandIcon="slotProps: { data : NodeData, size: number }">
                                <slot name="expandIcon" :data="slotProps.data" :size="slotProps.size"></slot>
                            </template>
                            <template #nodeIcon="slotProps: { data : NodeData, size: number }">
                                <slot name="nodeIcon" :data="slotProps.data" :size="slotProps.size"></slot>
                            </template>
                        </project-tree-node>
                    </template>
                </div>
            </expand-transition>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watchEffect } from "vue";
import type { VueProjectTreeNodeProps, NodeData } from "../utils/interface.ts";
import ExpandTransition from "./ExpandTransition.vue";

const props = defineProps<VueProjectTreeNodeProps>();

const {
    parent,
    data,
    idKey,
    labelKey,
    childrenKey,
    currentData,
    highlightCurrent,
    level,
    expandIconHold,
    expandIcon,
    expandIconSize,
    nodeIcon,
    nodeIconSize,
    draggable,
    allowDrag,
    allowDrop,
} = toRefs(props);

// 设置节点的不可枚举属性和默认值
Object.entries({
    _isVisible: data.value._isVisible === undefined ? true : data.value._isVisible,
    _isCurrent: data.value._isCurrent === undefined ? false : data.value._isCurrent,
    _isSelected: data.value._isSelected === undefined ? false : data.value._isSelected,
    _isExpanded: data.value._isExpanded === undefined ? true : data.value._isExpanded,
    _isExpandedOld: data.value._isExpandedOld === undefined ? true : data.value._isExpandedOld,
    _isMoving: data.value._isMoving === undefined ? false : data.value._isMoving,
    _isDropBefore: data.value._isDropBefore === undefined ? false : data.value._isDropBefore,
    _isDropIn: data.value._isDropIn === undefined ? false : data.value._isDropIn,
    _isDropAfter: data.value._isDropAfter === undefined ? false : data.value._isDropAfter,
    _parent: undefined,
    _id: undefined,
    _label: undefined,
    _children: undefined,
}).forEach(([key, value]: [string, any]) => {
    Object.defineProperty(data.value, key, {
        value,
        writable: true,
        enumerable: false,
    });
});
watchEffect(() => {
    data.value._parent = parent.value;
    data.value._id = data.value[idKey.value];
    data.value._label = data.value[labelKey.value];
    data.value._children = data.value[childrenKey.value];
});

const projectTreeNodeRef = ref<HTMLDivElement>(null as any);

/* 注意：以下事件会层层冒泡，多次触发，请勿添加事务代码，仅抛出事件 */
const emit = defineEmits<{
    (e: "expandClick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "nodeClick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "nodeDblclick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "nodeRightClick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "start", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "enter", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "over", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "leave", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "dropped", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "end", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
}>();

// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("expandClick", event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("nodeClick", event, data, nodeElement);
};
// 节点双击事件
const onNodeDblclick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("nodeDblclick", event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("nodeRightClick", event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("start", event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("enter", event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("over", event, data, nodeElement);
};
// 节点拖拽；离开事件
const onDragLeave = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("leave", event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("dropped", event, data, nodeElement);
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("end", event, data, nodeElement);
};
</script>

<style lang="less">
.project-tree-node {
    --color: #666666;
    --color-current: #4C74F6;
    --color-drop-in: #fff;
    --bg-color: transparent;
    --bg-color-current: #E0EFFF;
    --bg-color-selected: #E0EFFF;
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
    &.is-selected {
        background-color: var(--bg-color-selected);
    }

    /* 展开节点样式 */
    &.is-expanded {
        >.project-tree-node__content {
            >.project-tree-expand-icon {
                transform: rotateZ(90deg);
            }
        }
    }

    /* 拖拽中样式 */
    &.is-moving {
        .transparent {
            color: transparent;
            background: transparent;
        }
        .transparent;

        > .project-tree-node__content {
            &:hover {
                background-color: unset;
            }

            .project-tree-expand-icon,
            .project-tree-node-icon,
            .project-tree-label {
                .transparent;
                border: 1px dashed #ccc;

                > .project-tree-label-text {
                    .transparent;
                }
            }
            .project-tree-expand-icon {
                border: unset;
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
            transition: transform .5s ease-out;
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
            overflow: hidden;

            .project-tree-label-drag-top-line {
                position: absolute;
                top: 0;
                width: 100%;
                border-top: 1px solid var(--bg-color-drop-in);

                &::before {
                    content: "⇑";
                    display: inline-block;
                    position: fixed;
                    color: var(--bg-color-drop-in);
                    transform: translate(-8px, -5px);
                    animation: arrow-up .5s infinite alternate;

                    @keyframes arrow-up {
                        from {
                            transform: translate(-8px, 0);
                        }
                        to {
                            transform: translate(-8px, -5px);
                        }
                    }
                }
            }

            .project-tree-label-text {
                padding: 3px 0;
                color: var(--color);
                background-color: var(--bg-color);
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;

                &.is-drop-in {
                    --color: var(--color-drop-in);
                    background-color: var(--bg-color-drop-in);

                    &::before {
                        content: "⇘";
                        display: inline-block;
                        position: fixed;
                        color: var(--bg-color-drop-in);
                        transform: translate(-13px, -2px);
                        animation: arrow-in .5s infinite alternate;

                        @keyframes arrow-in {
                            from {
                                transform: translate(-10px, 3px);
                            }
                            to {
                                transform: translate(-13px, -2px);
                            }
                        }
                    }
                }
            }

            .project-tree-label-drag-bottom-line {
                position: absolute;
                bottom: 0;
                width: 100%;
                border-bottom: 2px solid var(--bg-color-drop-in);

                &::before {
                    content: "⇓";
                    display: inline-block;
                    position: fixed;
                    color: var(--bg-color-drop-in);
                    transform: translate(-8px, -15px);
                    animation: arrow-down .5s infinite alternate;

                    @keyframes arrow-down {
                        from {
                            transform: translate(-8px, -15px);
                        }
                        to {
                            transform: translate(-8px, -20px);
                        }
                    }
                }
            }
        }
    }
}
</style>
