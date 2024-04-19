<template>
    <div class="project-tree" ref="projectTreeRef">
        <project-tree-node
            v-if="Array.isArray(props.data)"
            v-for="node in props.data"
            :key="node[props.idKey]"
            :data="node"
            :id-key="props.idKey"
            :label-key="props.labelKey"
            :children-key="props.childrenKey"
            :current-node="currentData"
            :level="0"
            :expand-icon-size="_expandIconSize"
            :node-icon="props.nodeIcon"
            :node-icon-size="_nodeIconSize"
            @expand-click="onExpandClick"
            @node-click="onNodeClick"
            @node-right-click="onNodeRightClick"
            :draggable="props.draggable"
            :allow-drag="props.allowDrag"
            :allow-drop="props.allowDrop"
            @start="onDragStart"
            @enter="onDragEnter"
            @leave="onDragLeave"
            @over="onDragOver"
            @dropped="onDropped"
            @end="onDragEnd"
        >
            <template #nodeIcon="{ data, size }">
                <slot name="nodeIcon" :data="data" :size="size"></slot>
            </template>
        </project-tree-node>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ProjectTreeNode from "./ProjectTreeNode.vue";

interface Props {
    data: any[];
    idKey?: string;
    labelKey?: string;
    childrenKey?: string;
    indent?: number | string;
    nodeHeight?: number | string;
    expandIconSize?: number | string;
    nodeIcon?: boolean;
    nodeIconSize?: number | string;
    filterMethod?: Function;
    draggable?: boolean;
    sortable?: boolean;
    allowDrag?: Function;
    allowDrop?: Function;
};

// 使用 props 而不解构，防止丢失响应性
const props = withDefaults(defineProps<Props>(), {
    idKey: "id",
    labelKey: "label",
    childrenKey: "children",
    indent: 24,
    nodeHeight: 35,
    expandIconSize: 12,
    nodeIcon: false,
    nodeIconSize: 20,
    filterMethod: () => true,
    draggable: false,
    sortable: false,
    allowDrag: () => true,
    allowDrop: () => true,
});

if (!Array.isArray(props.data)) console.error("ProjectTree 绑定的参数 data 必须为数组类型");

// 当前选中节点
const currentData = ref(props.data[0]);

// 格式化缩进
const _indent = computed(() => {
    if (typeof props.indent === "number") return props.indent + "px";
    return props.indent;
});
// 格式化高度
const _nodeHeight = computed(() => {
    if (typeof props.nodeHeight === "number") return props.nodeHeight + "px";
    return props.nodeHeight;
});
// 格式化展开图标大小
const _expandIconSize = computed(() => {
    if (typeof props.expandIconSize === "number") return props.expandIconSize + "px";
    return props.expandIconSize;
});
// 格式化节点图标大小
const _nodeIconSize = computed(() => {
    if (typeof props.nodeIconSize === "number") return props.nodeIconSize + "px";
    return props.nodeIconSize;
});

const projectTreeRef = ref<any>(null);

// 放下位置偏移量
const dropOffset = 8;
// 放下目标的 data
const _dropTargetData = ref<any>(null);
// 放下目标的 HTMLElement
const _dropTargetElement = ref<any>(null);
// 是否是多选开始
let _isMultipleStart = true;
// 上次点击的元素的 data
let _lastClickData = <any>null;
// 多选列表（多选元素的 data）
let _multipleList = <any>[];

/* 注意：以下事件已经冒泡到顶层，仅触发一次 */
const emit = defineEmits<{
    (e: "nodeClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeRightClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "currentNodeChange", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "start", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "enter", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "over", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "leave", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "dropped", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "droppedBefore", dragData: any, dropData: any): void,
    (e: "droppedIn", dragData: any, dropData: any): void,
    (e: "droppedAfter", dragData: any, dropData: any): void,
    (e: "end", event: DragEvent, data: any, nodeElement: HTMLElement): void,
}>();

// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    data._isExpanded = !safeBoolean(data._isExpanded, true);
    currentData.value = data;
    emit("currentNodeChange", event, data, nodeElement);
    emit("nodeClick", event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    // ctrl 多选
    if (event.ctrlKey) {
        // 选中上次点击元素
        if (_isMultipleStart) {
            _isMultipleStart = false;
            _lastClickData._isChecked = true;
            _multipleList.push(_lastClickData);
        };
        // 选中当前元素
        data._isChecked = true;
        _multipleList.push(data);
    }
    // 普通单击
    if (!event.ctrlKey) {
        // 清除多选状态
        _isMultipleStart = true;
        clearMultipleList();
    }

    // 记录上次点击元素对应的 data
    _lastClickData = data;

    currentData.value = data;
    emit("currentNodeChange", event, data, nodeElement);
    emit("nodeClick", event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("nodeRightClick", event, data, nodeElement);
};
// 当前节点改变事件
const onCurrentNodeChange = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("currentNodeChange", event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    currentData.value = data;
    emit("currentNodeChange", event, data, nodeElement);
    emit("nodeClick", event, data, nodeElement);
    emit("start", event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 自动展开下级节点
    if (data[props.childrenKey]?.length) data._isExpanded = true;
    // 记录目标节点
    _dropTargetData.value = data;
    _dropTargetElement.value = nodeElement;
    emit("enter", event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 阻止默认事件，防止样式不生效
    event.preventDefault();
    safeVolume(event.dataTransfer, "dropEffect", "none");
    // 拖动视觉提示
    if (currentData.value[props.idKey] !== data[props.idKey] && safeBoolean(props.allowDrop(data))) {
        // 修改鼠标样式
        event.ctrlKey ?
            safeVolume(event.dataTransfer, "dropEffect", "copy") :
            safeVolume(event.dataTransfer, "dropEffect", "move");
        // 放下提示效果
        if (props.sortable && event.offsetY <= dropOffset) {
            data._isDropTop = true;
            data._isDropIn = data._isDropBottom = false;
        }
        else if (props.sortable && event.offsetY >= parseFloat(props.nodeHeight as string) - dropOffset) {
            data._isDropTop = data._isDropIn = false;
            data._isDropBottom = true;
        }
        else {
            data._isDropIn = true;
            data._isDropTop = data._isDropBottom = false;
        }
    }
    emit("over", event, data, nodeElement);
};
// 节点拖拽离开事件
const onDragLeave = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 清除拖动视觉提示
    data._isDropTop = data._isDropIn = data._isDropBottom = false;
    emit("leave", event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 清除拖动视觉提示
    data._isDropTop = data._isDropIn = data._isDropBottom = false;
    // 抛出子事件
    if (safeBoolean(props.allowDrop(data))) {
        // 放下提示效果
        if (props.sortable && event.offsetY <= dropOffset) {
            onDroppedBefore(currentData.value, data);
        }
        else if (props.sortable && event.offsetY >= parseFloat(props.nodeHeight as string) - dropOffset) {
            onDroppedAfter(currentData.value, data);
        }
        else {
            onDroppedIn(currentData.value, data);
        }
    }
    emit("dropped", event, data, nodeElement);
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (dragData: any, dropData: any) => {
    moveBefore(dragData, dropData);
    emit("droppedBefore", dragData, dropData);
};
// 节点拖拽放到节点内事件
const onDroppedIn = (dragData: any, dropData: any) => {
    moveIn(dragData, dropData);
    emit("droppedIn", dragData, dropData);
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (dragData: any, dropData: any) => {
    moveAfter(dragData, dropData);
    emit("droppedAfter", dragData, dropData);
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    !!data;
    !!nodeElement;
    // 默认的 data 和 nodeElement 为拖拽开始时的值，需在 dragenter 追踪变化
    emit("end", event, _dropTargetData.value, _dropTargetElement.value);
    clearMultipleList();
};

/**
 * 返回多选节点的 data
 */
const getMultipleList = () => _multipleList;
/**
 * 清除多选列表
 */
const clearMultipleList = () => {
    _multipleList.forEach((data: any) => data._isChecked = false);
    _multipleList.length = 0;
};
/**
 * 获取多选列表，多选列表为空时返回元素为当前节点数据的列表
 */
const getMoveList = () => {
  let dataList = getMultipleList();

  return dataList.length ? dataList : [currentData.value];
};
/**
 * 过滤节点
 * @param value 作为 的第一个参数
 */
const filter = (value: any, _data: any) => {
    if (!_data) _data = props.data;

    _data?.forEach((data: any) => {
        data._isVisible = props.filterMethod(value, data);
        if (data[props.childrenKey]?.length) filter(value, data[props.childrenKey]);
    });
};
/**
 * 设置当前选中节点
 * @param data 节点数据
 */
const setCurrentNode = (data: any) => {
    currentData.value = data;
};
/**
 * 通过节点主键值查找节点数据
 * @param id 节点主键值
 * @param data (可选)查找的节点数据
 */
const findNodeById = (id: any, data?: any[]): any | null => {
    if (!data) data = props.data;

    for (const _data of data) {
        if (_data[props.idKey as any] === id) return _data;
        if (_data[props.childrenKey as any]?.length) {
            const foundData = findNodeById(id, _data[props.childrenKey]);
            if (foundData) return foundData;
        }
    }
    return null;
}
/**
 * 通过节点主键值查找父节点数据
 * @param id 节点主键值
 * @param data (可选)查找的节点数据
 */
const findParentById = (id: any, data?: any[], parent?: any): any | null => {
    if (!data) data = props.data;

    for (const _data of data) {
        if (_data[props.idKey as any] === id) return parent;
        if (_data[props.childrenKey as any]?.length) {
            const foundData = findParentById(id, _data[props.childrenKey], _data);
            if (foundData) return foundData;
        }
    }
    return null;
};
const _findSafeParentById = (id: any) => {
    const data = findParentById(id);
    if (data) return data;

    let _data = <any>{};
    _data[props.childrenKey] = props.data;
    return _data;
};

/**
 * 移动到节点前
 */
 const moveBefore = (dragData: any, dropData: any) => {
    const dragParent = _findSafeParentById(dragData[props.idKey]);
    const dropParent = _findSafeParentById(dropData[props.idKey]);
    const dragIndex = dragParent[props.childrenKey].indexOf(dragData);
    const dropIndex = dropParent[props.childrenKey].indexOf(dropData);
    // 特殊情况
    if (dragParent === dropParent && dragIndex === dropIndex - 1) return;
    dragParent[props.childrenKey].splice(dragIndex, 1);
    dropParent[props.childrenKey].splice(dropIndex, 0, dragData);
};
/**
 * 移动到节点内
 */
const moveIn = (dragData: any, dropData: any) => {
    const dragParent = _findSafeParentById(dragData[props.idKey]);
    const dragIndex = dragParent[props.childrenKey].indexOf(dragData);
    // 添加新节点
    dropData[props.childrenKey] ?
        dropData[props.childrenKey].push(dragData) :
        (dropData[props.childrenKey] = [ dragData ]);
    // 删除旧节点
    dragParent[props.childrenKey].splice(dragIndex, 1);
};
/**
 * 移动到节点后
 */
const moveAfter = (dragData: any, dropData: any) => {
    const dragParent = _findSafeParentById(dragData[props.idKey]);
    const dropParent = _findSafeParentById(dropData[props.idKey]);
    const dragIndex = dragParent[props.childrenKey].indexOf(dragData);
    const dropIndex = dropParent[props.childrenKey].indexOf(dropData);
    dragParent[props.childrenKey].splice(dragIndex, 1);
    dropParent[props.childrenKey].splice(dropIndex + 1, 0, dragData);
};

// 抛出方法
defineExpose({
    getMultipleList,
    clearMultipleList,
    getMoveList,
    filter,
    setCurrentNode,
    findNodeById,
    findParentById,
    moveBefore,
    moveIn,
    moveAfter,
});

/**
 * 加强的布尔判断
 * @param value 判断值
 * @param _default 当 value 为 undefined 或 null 时的返回值
 */
const safeBoolean = (value: any, _default = false): boolean => {
    if (value === undefined || value === null) return _default;
    return !!value;
};
/**
 * 安全的复制
 * @param value 值
 */
const safeVolume = (object: any, property: string, value: any) => {
    object && object[property] && (object[property] = value);
};
</script>

<style lang="less">
.project-tree {
    --indent-width: v-bind(_indent);
    --node-height: v-bind(_nodeHeight);
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
}
</style>
