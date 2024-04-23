<template>
    <div class="vue-project-tree" ref="projectTreeRef">
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
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ProjectTreeNode from "./ProjectTreeNode.vue";

defineOptions({
    name: "VueProjectTree",
});

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
    (e: "dropped", event: DragEvent, data: any, nodeElement: HTMLElement): void,
    (e: "droppedBefore", dragData: any[], dropData: any, preventDefault: Function, _default: Function): void,
    (e: "droppedIn", dragData: any[], dropData: any, preventDefault: Function, _default: Function): void,
    (e: "droppedAfter", dragData: any[], dropData: any, preventDefault: Function, _default: Function): void,
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
    // 清除拖动视觉提示
    data._isDropBefore = data._isDropIn = data._isDropAfter = false;
    // 抛出子事件
    if (props.sortable && event.offsetY <= dropOffset) {
        onDroppedBefore(getMoveList(), data);
    }
    else if (props.sortable && event.offsetY >= parseFloat(props.nodeHeight as string) - dropOffset) {
        onDroppedAfter(getMoveList(), data);
    }
    else if (safeBoolean(props.allowDrop(data))) {
        onDroppedIn(getMoveList(), data);
    }
    emit("dropped", event, data, nodeElement);
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (dragData: any[], dropData: any) => {
    let preventDefault = false;
    const _default = () => moveBefore(dragData, dropData);

    emit("droppedBefore", dragData, dropData, () => preventDefault = true, _default);

    !preventDefault && _default();
};
// 节点拖拽放到节点内事件
const onDroppedIn = (dragData: any[], dropData: any) => {
    let preventDefault = false;
    const _default = () => moveIn(dragData, dropData);

    emit("droppedIn", dragData, dropData, () => preventDefault = true, _default);

    !preventDefault && _default();
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (dragData: any[], dropData: any) => {
    let preventDefault = false;
    const _default = () => moveAfter(dragData, dropData);

    emit("droppedAfter", dragData, dropData, () => preventDefault = true, _default);

    !preventDefault && _default();
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
 * 通过节点主键值查找父节点数据，没有则返回 null, 根列表返回 undefined
 * @param id 节点主键值
 * @param data (可选)查找的节点数据
 */
const findParentById = (id: any, data?: any[], parent?: any): any | null | undefined => {
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
/**
 * 通过节点主键值查找父节点数据
 * 若为根节点列表的数据，则返回 children 为根列表的节点数据
 * @param id 节点主键值
 */
const safeFindParentById = (id: any) => {
    let data = findParentById(id);

    if (data === undefined) {
        data = <any>{};
        data[props.childrenKey] = props.data;
    }
    if (data === null) console.warn("safeFindParentById 未找到父节点")
    return data;
};

/**
 * 移除节点
 * @param dataList 节点数据列表
 */
const removeData = (dataList: any[]) => {
    dataList.forEach((data: any) => {
        const dataParent = safeFindParentById(data[props.idKey]);
        const dataIndex = dataParent[props.childrenKey].indexOf(data);

        dataParent[props.childrenKey].splice(dataIndex, 1);
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

    parentData[props.childrenKey].splice(insertIndex, 0, ...dataList);
};
/**
 * 移动到节点前
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
 const moveBefore = (dragData: any[], dropData: any): number => {
    // 移除旧节点
    removeData(dragData);
    // 添加新节点
    const dropParent = safeFindParentById(dropData[props.idKey]);
    const dropIndex = dropParent[props.childrenKey].indexOf(dropData);
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
    // 移除旧节点
    removeData(dragData);
    // 添加新节点
    const insertIndex = dropData[props.childrenKey]?.length || 0;
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
    // 移除旧节点
    removeData(dragData);
    // 添加新节点
    const dropParent = safeFindParentById(dropData[props.idKey]);
    const dropIndex = dropParent[props.childrenKey].indexOf(dropData) + 1;
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
    findNodeById,
    findParentById,
    safeFindParentById,
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
