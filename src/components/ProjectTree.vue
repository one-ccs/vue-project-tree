<template>
    <div
        class="vue-project-tree"
        ref="projectTreeRef"
        v-if="
            Array.isArray(props.data) ?
                true :
                (console.error(`ProjectTree 绑定的参数 data (${props.data}) 必须为数组类型`), false)
        "
    >
        <template v-for="node in props.data" :key="node">
            <project-tree-node
                v-if="node ? true : (console.warn(`未渲染节点, 无效的节点数据(${node})`), false)"
                :data="node"
                :id-key="props.idKey"
                :label-key="props.labelKey"
                :children-key="props.childrenKey"
                :current-data="currentData"
                :highlight-current="props.highlightCurrent"
                :level="0"
                :expand-icon-hold="props.expandIconHold"
                :expand-icon="props.expandIcon"
                :expand-icon-size="_expandIconSize"
                :node-icon="props.nodeIcon"
                :node-icon-size="_nodeIconSize"
                @expand-click="onExpandClick"
                @node-click="onNodeClick"
                @node-dblclick="onNodeDblclick"
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
                <template #expandIcon="{ data, size }">
                    <slot name="expandIcon" :data="data" :size="size"></slot>
                </template>
                <template #nodeIcon="{ data, size }">
                    <slot name="nodeIcon" :data="data" :size="size"></slot>
                </template>
            </project-tree-node>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { VueProjectTreeProps, DroppedExtraData } from '../utils/interface.ts';
import ProjectTreeNode from "./ProjectTreeNode.vue";

defineOptions({
    name: "VueProjectTree",
});


// 使用 props 而不解构，防止丢失响应性
const props = withDefaults(defineProps<VueProjectTreeProps>(), {
    idKey: "id",
    labelKey: "label",
    childrenKey: "children",
    indent: 24,
    nodeHeight: 35,
    highlightCurrent: true,
    expandIcon: true,
    expandIconSize: 12,
    expandIconHold: false,
    expandWithClick: true,
    nodeIcon: false,
    nodeIconSize: 20,
    filterMethod: () => true,
    draggable: false,
    sortable: false,
    allowDrag: () => true,
    allowDrop: () => true,
});

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
const _virtualRootData = computed(() => {
    let root = <any>{};

    root[props.idKey] = -2;
    root[props.labelKey] = "虚构根节点";
    root[props.childrenKey] = props.data;

    return root;
});

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
// 在节点内悬停的时间
const expandHoverTime = 380;
let _lastTimeStamp = 0;

/* 注意：以下事件已经冒泡到顶层，仅触发一次 */
const emit = defineEmits<{
    (e: "nodeClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeDblclick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "nodeRightClick", event: MouseEvent, data: any, nodeElement: HTMLElement): void,
    (e: "currentNodeChange", data: any): void,
    (e: "start", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "enter", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "over", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "leave", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "dropped", event: DragEvent, data: any, nodeElement: HTMLElement, extraData: DroppedExtraData): void,
    (e: "droppedBefore", event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData): void,
    (e: "droppedIn", event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData): void,
    (e: "droppedAfter", event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData): void,
    (e: "end", event: DragEvent, data: any, nodeElement: HTMLElement): void,
}>();

// 当前节点改变事件
const onCurrentNodeChange = (data: any) => {
    emit("currentNodeChange", data);
};
// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    data._isExpanded = !safeBoolean(data._isExpanded, true);
    setCurrentData(data);
    emit("nodeClick", event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    // ctrl 多选
    if (event.ctrlKey) {
        // 选中上次点击元素
        if (_isMultipleStart) {
            _isMultipleStart = false;

            safeVolume(_lastClickData, "_isChecked", true);
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
        if (props.expandWithClick) {
            data._isExpanded = !safeBoolean(data._isExpanded, true);
        }
    }

    // 记录上次点击元素对应的 data
    _lastClickData = data;

    setCurrentData(data);
    emit("nodeClick", event, data, nodeElement);
};
// 节点双击事件
const onNodeDblclick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    emit("nodeDblclick", event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: any, nodeElement: HTMLElement) => {
    setCurrentData(data);
    emit("nodeRightClick", event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    setCurrentData(data);
    // 若直接移动其它节点 则清除多选列表
    const moveList = getMoveList();
    if (moveList.length && !moveList.includes(data)) clearMultipleList();
    emit("nodeClick", event, data, nodeElement);
    emit("start", event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    _lastTimeStamp = event.timeStamp;
    // 记录目标节点
    _dropTargetData.value = data;
    _dropTargetElement.value = nodeElement;
    emit("enter", event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 自动展开下级节点
    if (
        !safeBoolean(data._isExpanded, true) &&
        event.timeStamp - _lastTimeStamp >= expandHoverTime &&
        data[props.childrenKey]?.length
    ) data._isExpanded = true;

    // 阻止默认事件，防止样式不生效
    event.preventDefault();

    // 拖动视觉提示
    if (!getMoveList().includes(data)) {
        // 修改放下提示效果、鼠标样式
        if (props.sortable && event.offsetY <= dropOffset) {
            safeVolume(event.dataTransfer, "dropEffect", "copy");
            data._isDropBefore = true;
            data._isDropIn = data._isDropAfter = false;
        }
        else if (props.sortable && event.offsetY >= parseFloat(props.nodeHeight as string) - dropOffset) {
            safeVolume(event.dataTransfer, "dropEffect", "copy");
            data._isDropBefore = data._isDropIn = false;
            data._isDropAfter = true;
        }
        else if (safeBoolean(props.allowDrop(data))) {
            safeVolume(event.dataTransfer, "dropEffect", "copy");
            data._isDropIn = true;
            data._isDropBefore = data._isDropAfter = false;
        }
        else {
            safeVolume(event.dataTransfer, "dropEffect", "none");
            data._isDropIn = data._isDropBefore = data._isDropAfter = false;
        }
        if (event.ctrlKey && event.dataTransfer?.dropEffect === "copy") {
            safeVolume(event.dataTransfer, "dropEffect", "move");
        }
    }
    else {
        safeVolume(event.dataTransfer, "dropEffect", "none");
    }
    emit("over", event, data, nodeElement);
};
// 节点拖拽离开事件
const onDragLeave = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    // 清除拖动视觉提示
    data._isDropBefore = data._isDropIn = data._isDropAfter = false;
    emit("leave", event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    event.preventDefault();
    const extraData = <DroppedExtraData>{
        type: "dropped",
        isPreventDefault: false,
        preventDefault: () => extraData.isPreventDefault = true,
    };

    // 清除拖动视觉提示
    data._isDropBefore = data._isDropIn = data._isDropAfter = false;

    // 判断放下范围
    if (props.sortable && event.offsetY <= dropOffset) {
        extraData.type = "before";
    }
    else if (props.sortable && event.offsetY >= parseFloat(props.nodeHeight as string) - dropOffset) {
        extraData.type = "after";
    }
    else if (safeBoolean(props.allowDrop(data))) {
        extraData.type = "in";
    }

    emit("dropped", event, data, nodeElement, extraData);

    // 抛出子事件
    if (extraData.type === "before") {
        onDroppedBefore(event, getMoveList(), data, extraData);
    }
    else if (extraData.type === "in") {
        onDroppedIn(event, getMoveList(), data, extraData);
    }
    else if (extraData.type === "after") {
        onDroppedAfter(event, getMoveList(), data, extraData);
    }
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData) => {
    extraData._default = () => moveBefore(dragData, dropData);

    emit("droppedBefore", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽放到节点内事件
const onDroppedIn = (event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData) => {
    extraData._default = () => moveIn(dragData, dropData);

    emit("droppedIn", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (event: DragEvent, dragData: any[], dropData: any, extraData: DroppedExtraData) => {
    extraData._default = () => moveAfter(dragData, dropData);

    emit("droppedAfter", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: any, nodeElement: HTMLElement) => {
    !!data;
    !!nodeElement;
    // 默认的 data 和 nodeElement 为拖拽开始时的值，需在 dragenter 追踪变化
    emit("end", event, _dropTargetData.value, _dropTargetElement.value);
};

/**
 * 返回多选节点的 data
 */
const getMultipleList = () => {
    return _multipleList;
};
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
 * 设置当前选中节点的数据
 * @param data 节点数据
 */
const setCurrentData = (data: any) => {
    currentData.value = data;
    onCurrentNodeChange(data);
};
/**
 * 获取当前选中节点的数据
 */
const getCurrentData = () => {
    return currentData.value;
};
/**
 * 通过节点主键值查找节点数据
 * @param id 节点主键值
 * @param data (可选)查找的节点数据
 */
const findById = (id: any, data?: any): any | null => {
    const queue = data ? [...data[props.childrenKey]] : [..._virtualRootData.value[props.childrenKey]];

    while (queue.length > 0) {
        const current = queue.shift();

        if (current && current.id === id) return current;
        if (current && Array.isArray(current[props.childrenKey])) queue.push(...current[props.childrenKey]);
    }
    return null;
}
/**
 * 通过节点主键值查找父节点数据，没有则返回 null
 * @param id 节点主键值
 */
const findParentById = (id: any): any | null => {
    const queue = <any>[{ data: _virtualRootData.value, parent: null }];

    while (queue.length > 0) {
        const { data, parent } = queue.shift()!;

        if (!data) continue;
        if (data[props.idKey] === id) return parent;

        if (!Array.isArray(data[props.childrenKey])) continue;
        for (const child of data[props.childrenKey]) {
            queue.push({ data: child, parent: data });
        }
    }
    return null;
};

/**
 * 移除节点
 * @param dataList 节点数据列表
 */
const removeData = (dataList: any[]) => {
    dataList.forEach((data: any) => {
        const dataParent = data && findParentById(data[props.idKey]);
        if (!dataParent) return;
        const dataIndex = dataParent[props.childrenKey]?.indexOf(data);

        dataParent[props.childrenKey]?.splice(dataIndex, 1);
    });
};
/**
 * 添加节点
 * @param dataList 节点数据列表
 * @param parentData 父节点数据
 * @param insertIndex 插入的下标（默认0）
 */
const addData = (dataList: any[], parentData: any, insertIndex = 0) => {
    if (!parentData[props.childrenKey]?.length) parentData[props.childrenKey] = [];

    parentData[props.childrenKey]?.splice(insertIndex, 0, ...dataList.filter((data: any) => !!data));
};
/**
 * 移动到节点前
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
 const moveBefore = (dragData: any[], dropData: any): number => {
    const dropParent = findParentById(dropData[props.idKey]);
    if (!dropParent) return -1;
    let dropIndex = dropParent[props.childrenKey]?.indexOf(dropData);

    // 同级 移动到当前节点的 下一个节点之前 无需移动
    const sameParentData = dragData.filter(data => {
        if (!data) return false;
        const dragParent = findParentById(data[props.idKey]);
        if (!dragParent) return false;

        if (dragParent[props.idKey] === dropParent[props.idKey]) return true;
    });
    const sameParentDataLength = sameParentData.length;
    if (sameParentDataLength) {
        const sameParent = findParentById(sameParentData[0][props.idKey]);

        let noNeedMoveIds = <any>[];
        for (let beforeIndex = dropIndex - 1; beforeIndex >= 0; beforeIndex--) {
            let i = 0;
            for (; i < sameParentDataLength; i++) {
                const index = sameParent[props.childrenKey]?.indexOf(sameParentData[i]);

                if (index === beforeIndex) {
                    noNeedMoveIds.push(sameParentData[i][props.idKey]);
                    break;
                }
            }
            if (i === sameParentDataLength) break;
        }
        dragData = dragData.filter(data => data && !noNeedMoveIds.includes(data[props.idKey]));
    }

    // 移除旧节点
    removeData(dragData);

    // 更新下标
    dropIndex = dropParent[props.childrenKey]?.indexOf(dropData);

    // 添加新节点
    addData(dragData, dropParent, dropIndex);

    return dropIndex;
};
/**
 * 移动到节点内
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
const moveIn = (dragData: any[], dropData: any): number => {
    const insertIndex = dropData[props.childrenKey]?.length || 0;

    // 移除旧节点
    removeData(dragData);
    // 添加新节点
    addData(dragData, dropData, insertIndex);

    return insertIndex;
};
/**
 * 移动到节点后
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
const moveAfter = (dragData: any[], dropData: any) => {
    const dropParent = findParentById(dropData[props.idKey]);
    if (!dropParent) return;

    // 移除旧节点
    removeData(dragData);

    const dropIndex = dropParent[props.childrenKey]?.indexOf(dropData) + 1;

    // 添加新节点
    addData(dragData, dropParent, dropIndex);

    return dropIndex;
};

// 抛出方法
defineExpose({
    getMultipleList,
    clearMultipleList,
    getMoveList,
    filter,
    setCurrentData,
    getCurrentData,
    findById,
    findParentById,
    removeData,
    addData,
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
 * 安全的赋值
 * @param value 值
 */
const safeVolume = (object: any, property: string, value: any) => {
    object && typeof object === "object" && (object[property] = value);
};
</script>

<style lang="less">
.vue-project-tree {
    --indent-width: v-bind(_indent);
    --node-height: v-bind(_nodeHeight);
    width: 100%;
    height: 100%;
}
</style>
