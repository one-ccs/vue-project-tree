<template>
    <div
        class="vue-project-tree"
        ref="projectTreeRef"
        v-if="Array.isArray(props.data)"
    >
        <template v-for="node in props.data" :key="node">
            <project-tree-node
                v-if="node ? true : (console.warn(`未渲染节点, 无效的节点数据(${node})`), false)"
                :parent="virtualRoot"
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
                :checkbox="props.checkbox"
                :checkbox-size="props.checkboxSize"
                :node-icon="props.nodeIcon"
                :node-icon-size="_nodeIconSize"
                @expand-click="onExpandClick"
                @checkbox-click="onCheckboxClick"
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
                <template #checkbox="{ data, size }">
                    <slot name="checkbox" :data="data" :size="size"></slot>
                </template>
                <template #nodeIcon="{ data, size }">
                    <slot name="nodeIcon" :data="data" :size="size"></slot>
                </template>
                <template #label="{ data }">
                    <slot name="label" :data="data"></slot>
                </template>
            </project-tree-node>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import type { VueProjectTreeProps, DroppedExtraData, NodeData } from "../utils/interface.ts";
import { safeVolume, getChildren } from "../utils/common.js";
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
    expandHoverTime: 380,
    checkbox: false,
    checkboxSize: 18,
    nodeIcon: false,
    nodeIconSize: 20,
    filterMethod: (value: any, data: NodeData) => true,
    draggable: false,
    allowDrag: (data: NodeData) => true,
    allowDrop: (data: NodeData) => true,
    dropOffset: 8,
});
if (!Array.isArray(props.data)) console.error(`VueProjectTree 绑定的参数 data (${props.data}) 必须为数组类型`);

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
// 虚拟根节点
const virtualRoot = computed<NodeData>(() => ({
    [props.idKey]: -1,
    [props.labelKey]: "虚拟根节点",
    [props.childrenKey]: undefined,
    _isVisible: true,
    _isCurrent: false,
    _isChecked: false,
    _isExpanded: true,
    _isExpandedOld: true,
    _isMoving: false,
    _isDropBefore: false,
    _isDropIn: false,
    _isDropAfter: false,
    _parent: null,
    _id: -1,
    _label: "虚拟根节点",
    _children: undefined,
    _level: -1,
}));
watchEffect(() => {
    virtualRoot.value[props.childrenKey] = virtualRoot.value._children = props.data;
});

// 当前选中节点
const currentData = defineModel<NodeData | undefined>({
    required: false,
    default: undefined,
    get(value: NodeData | undefined) {
        return value;
    },
    set(value: NodeData | undefined) {
        if (value) value._isCurrent = true;
        if (_lastData) _lastData._isCurrent = false;
        if (_lastData !== value) {
            _lastData = value;
            onCurrentDataChange(value);
        }
        return value;
    },
});
// 多选列表
const multipleList = ref<NodeData[]>([]);
// 上次选中节点
let _lastData = <NodeData | undefined>undefined;
// 放下目标的 data
let _dropTargetData = <NodeData | null>null;
// 放下目标的 HTMLElement
let _dropTargetElement = <HTMLElement | null>null;
let _lastTimeStamp = 0;

/* 注意：以下事件已经冒泡到顶层，仅触发一次 */
const emit = defineEmits<{
    (e: "nodeClick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "nodeDblclick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "nodeRightClick", event: MouseEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "currentDataChange", data: NodeData | undefined): void,
    (e: "start", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "enter", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "over", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "leave", event: DragEvent, data: NodeData, nodeElement: HTMLElement): void,
    (e: "dropped", event: DragEvent, data: NodeData, nodeElement: HTMLElement, extraData: DroppedExtraData): void,
    (e: "droppedBefore", event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData): void,
    (e: "droppedIn", event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData): void,
    (e: "droppedAfter", event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData): void,
    (e: "end", event: DragEvent, data: [NodeData, NodeData], nodeElement: [HTMLElement, HTMLElement]): void,
}>();

// 当前节点改变事件
const onCurrentDataChange = (data: NodeData | undefined) => {
    emit("currentDataChange", data);
};
// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    currentData.value = data;
    data._isExpanded = !data._isExpanded;
    emit("nodeClick", event, data, nodeElement);
};
// 复选框点击事件
const onCheckboxClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    toggleChecked(data);
    emit("nodeClick", event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    if (event.ctrlKey && event.shiftKey) {

    }
    else if (event.ctrlKey) {
        // 选中上次点击元素
        if (_lastData && !_lastData._isChecked) {
            toggleChecked(_lastData);
        }
        // 选中当前元素
        toggleChecked(data);
    }
    else if (event.shiftKey) {

    }
    else { // 普通单击
        // 切换节点展开状态
        if (props.expandWithClick) data._isExpanded = !data._isExpanded;
        // 清除多选状态
        clearMultipleList();
    }
    // 处理多选逻辑后设置当前节点
    currentData.value = data;

    emit("nodeClick", event, data, nodeElement);
};
// 节点双击事件
const onNodeDblclick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    emit("nodeDblclick", event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
    currentData.value = data;
    emit("nodeRightClick", event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    currentData.value = data;

    // 若拖拽的不是选中节点，则更正多选列表
    if (!data._isChecked) {
        clearMultipleList();
        toggleChecked(data);
    }

    multipleList.value.forEach(data => {
        data._isMoving = true;
        // 折叠节点
        data._isExpandedOld = data._isExpanded;
        data._isExpanded = false;
    });

    emit("nodeClick", event, data, nodeElement);
    emit("start", event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    // 阻止默认拖拽行为
    event.preventDefault();

    _lastTimeStamp = event.timeStamp;
    // 记录目标节点
    _dropTargetData = data;
    _dropTargetElement = nodeElement;
    emit("enter", event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    // 阻止默认拖拽行为
    event.preventDefault();

    // 自动展开下级节点
    if (
        !data._isMoving &&
        !data._isExpanded &&
        event.timeStamp - _lastTimeStamp >= props.expandHoverTime
    ) data._isExpanded = true;

    // 拖动视觉提示
    if (_allowDrop(data)) {
        // 移动样式
        if (event.offsetY <= props.dropOffset) {
            safeVolume(event.dataTransfer, "dropEffect", "move");
            data._isDropBefore = true;
            data._isDropIn = data._isDropAfter = false;
        }
        else if (event.offsetY >= parseFloat(props.nodeHeight as string) - props.dropOffset) {
            safeVolume(event.dataTransfer, "dropEffect", "move");
            data._isDropBefore = data._isDropIn = false;
            data._isDropAfter = true;
        }
        else {
            safeVolume(event.dataTransfer, "dropEffect", "move");
            data._isDropIn = true;
            data._isDropBefore = data._isDropAfter = false;
        }
        // 复制样式
        if (event.ctrlKey) {
            safeVolume(event.dataTransfer, "dropEffect", "copy");
        }
    }
    else {
        // 禁用样式
        safeVolume(event.dataTransfer, "dropEffect", "none");
        data._isDropIn = data._isDropBefore = data._isDropAfter = false;
    }
    emit("over", event, data, nodeElement);
};
// 节点拖拽离开事件
const onDragLeave = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    // 清除拖动视觉提示
    data._isDropBefore = data._isDropIn = data._isDropAfter = false;
    emit("leave", event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    const extraData = <DroppedExtraData>{
        type: "dropped",
        isPreventDefault: false,
        preventDefault: () => extraData.isPreventDefault = true,
    };

    // 清除拖动视觉提示
    data._isDropBefore = data._isDropIn = data._isDropAfter = false;

    // 判断放下范围
    if (event.offsetY <= props.dropOffset) {
        extraData.type = "before";
    }
    else if (event.offsetY >= parseFloat(props.nodeHeight as string) - props.dropOffset) {
        extraData.type = "after";
    }
    else {
        extraData.type = "in";
    }

    emit("dropped", event, data, nodeElement, extraData);

    // 抛出子事件
    if (extraData.type === "before") {
        onDroppedBefore(event, getMultipleList(), data, extraData);
    }
    else if (extraData.type === "in") {
        onDroppedIn(event, getMultipleList(), data, extraData);
    }
    else if (extraData.type === "after") {
        onDroppedAfter(event, getMultipleList(), data, extraData);
    }
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) => {
    extraData._default = () => moveBefore(dragData, dropData);

    emit("droppedBefore", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽放到节点内事件
const onDroppedIn = (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) => {
    extraData._default = () => moveIn(dragData, dropData);

    emit("droppedIn", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) => {
    extraData._default = () => moveAfter(dragData, dropData);

    emit("droppedAfter", event, dragData, dropData, extraData);

    !extraData.isPreventDefault && extraData._default();
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
    multipleList.value.forEach(data => {
        // 取消移动状态
        data._isMoving = false
        // 还原节点展开状态
        data._isExpanded = data._isExpandedOld;
        // 展开父节点
        if (data._parent) data._parent._isExpanded = true;
    });

    // 默认的 data 和 nodeElement 为拖拽开始时的值，需在 dragenter 追踪变化
    emit("end", event, [data, _dropTargetData!], [nodeElement, _dropTargetElement!]);
};

// 判断节点是否允许放下，包括允许拖拽、允许放入、非选中状态、父节点非选中状态
const _allowDrop = (data: NodeData): boolean => {
    return props.allowDrop(data) && !data._isChecked && (!data._parent || _allowDrop(data._parent));
};
/**
 * 获取多选列表
 */
const getMultipleList = (): NodeData[] => {
    const minLevel = Math.min(...multipleList.value.map(data => data._level!));
    return multipleList.value.filter(data => data._level === minLevel);
};
/**
 * 设置多选列表
 * @param list 需要多选的节点列表
 */
const setMultipleList = (dataList: NodeData[]): void => {
    clearMultipleList();
    multipleList.value.push(...dataList);
    multipleList.value.forEach((data: NodeData) => data._isChecked = true);
};
/**
 * 清除多选列表
 */
const clearMultipleList = (): void => {
    multipleList.value.forEach(data => data._isChecked = false)
    multipleList.value.length = 0;
};
/**
 * 切换节点选中状态
 * @param data 节点数据
 */
const toggleChecked = (data: NodeData, isChecked?: boolean) => {
    data._isChecked = isChecked ?? !data._isChecked;

    if (data._children) data._children.forEach(child => toggleChecked(child, data._isChecked));
    if (data._isChecked) {
        if (!multipleList.value.includes(data)) multipleList.value.push(data);
        getLinealParents(data).forEach(parent => {
            if (parent._children?.every(child => child._isChecked)) {
                parent._isChecked = true;
                if (!multipleList.value.includes(parent)) multipleList.value.push(parent);
            }
        });
    }
    else {
        const index = multipleList.value.indexOf(data);
        if (index >= 0) multipleList.value.splice(index, 1);
        getLinealParents(data).forEach(parent => {
            const index = multipleList.value.indexOf(parent);
            parent._isChecked = false;

            if (index >= 0) multipleList.value.splice(index, 1);
        });
    }
};
/**
 * 切换节点展开状态
 * @param data 节点数据
 */
const toggleExpanded = (data: NodeData) => {
    data._isExpanded = !data._isExpanded;
};
/**
 * 展开所有节点
 */
const expandAll = () => {
    _expandAll(virtualRoot.value);
};
const _expandAll = (root: NodeData) => {
    root._children?.forEach((data: NodeData) => {
        data._isExpanded = true;
        if (data._children?.length) _expandAll(data);
    });
}
/**
 * 折叠所有节点
 */
const collapseAll = () => {
    _collapseAll(virtualRoot.value);
};
const _collapseAll = (root: NodeData) => {
    root._children?.forEach((data: NodeData) => {
        data._isExpanded = false;
        if (data._children?.length) _collapseAll(data);
    });
}
/**
 * 立即调用 `filterMethod` 对节点进行过滤
 * @param value 作为 `filterMethod` 的第一个参数
 */
const filter = (value: any) => {
    _filter(value, virtualRoot.value);
};
const _filter = (value: any, root: NodeData) => {
    root._children?.forEach((data: NodeData) => {
        data._isVisible = props.filterMethod(value, data);
        if (data._children?.length) _filter(value, data);
    });
}
/**
 * 通过节点主键值查找节点数据
 * @param id 节点主键值
 */
const findById = (id: string | number): NodeData | null => {
    return _findById(id, virtualRoot.value);
}
const _findById = (id: string | number, root: NodeData): NodeData | null => {
    for (const data of root._children!) {
        if (data._id === id) {
            return data;
        }
        if (data._children?.length) {
            const found = _findById(id, data);
            if (found) return found;
        }
    }
    return null;
};
/**
 * 获取节点的所有直系父节点数据列表
 * @param data 节点数据
 * @returns 直系父节点数据列表
 */
const getLinealParents = (data: NodeData): NodeData[] => {
    const parents: NodeData[] = [];
    let parent = data._parent;
    while (parent) {
        parents.push(parent);
        parent = parent._parent;
    }
    return parents;
};
/**
 * 获取节点的父节点数据
 * @param data 节点数据
 * @returns 父节点数据
 */
const getParent = (data: NodeData): NodeData | null => {
    return data._parent!;
};
/**
 * 递归判断父节点是否包含该子节点
 * @param parent 父节点数据
 * @param data 子节点数据
 */
const hasChild = (parent: NodeData, data: NodeData): boolean => {
    if (parent._children?.includes(data)) return true;
    if (parent._children?.length) {
        for (const child of parent._children!) {
            if (child._children?.includes(data)) return true;
            if (child._children?.length) {
                const found = hasChild(child, data);
                if (found) return true;
            }
        }
    }
    return false;
};
/**
 * 移除节点
 * @param dataList 节点数据列表
 */
const removeData = (dataList: NodeData[]) => {
    dataList.forEach((data: NodeData) => {
        const dataIndex = data._parent!._children!.indexOf(data);
        if (dataIndex >= 0) data._parent!._children!.splice(dataIndex, 1);
    });
};
/**
 * 插入节点
 * @param parentData 父节点数据
 * @param dataList 节点数据列表
 * @param insertIndex 插入的位置下标（默认0）
 */
const insertData = (parentData: NodeData, dataList: NodeData[], insertIndex = 0) => {
    if (!parentData._children) parentData[props.childrenKey] = parentData._children = [];

    parentData._children!.splice(insertIndex, 0, ...dataList.filter((data: NodeData) => !!data));
};
/**
 * 移动到节点前
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
 const moveBefore = (dragData: NodeData[], dropData: NodeData): number => {
    if (!dropData._parent) return -1;
    let dropIndex = dropData._parent._children!.indexOf(dropData);

    // 同级 移动到当前节点的 下一个节点之前 无需移动
    const sameParentData = dragData.filter(data => {
        if (!data._parent) return false;
        if (data._parent._id === dropData._parent?._id) return true;
    });
    const sameParentDataLength = sameParentData.length;
    if (sameParentDataLength) {
        const sameParent = sameParentData[0]._parent;

        let noNeedMoveIds = <any>[];
        for (let beforeIndex = dropIndex - 1; beforeIndex >= 0; beforeIndex--) {
            let i = 0;
            for (; i < sameParentDataLength; i++) {
                const index = sameParent?._children?.indexOf(sameParentData[i]);

                if (index === beforeIndex) {
                    noNeedMoveIds.push(sameParentData[i]._id);
                    break;
                }
            }
            if (i === sameParentDataLength) break;
        }
        dragData = dragData.filter(data => data && !noNeedMoveIds.includes(data._id));
    }

    // 延迟操作，避免事件未触发
    setTimeout(() => {
        // 移除旧节点
        removeData(dragData);

        // 更新下标
        dropIndex = dropData._parent!._children?.indexOf(dropData)!;

        // 添加新节点
        insertData(dropData._parent!, dragData, dropIndex);
    }, 100);

    return dropIndex;
};
/**
 * 移动到节点内
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
const moveIn = (dragData: NodeData[], dropData: NodeData): number => {
    const insertIndex = dropData._children?.length || 0;

    // 延迟操作，避免事件未触发
    setTimeout(() => {
        // 移除旧节点
        removeData(dragData);
        // 添加新节点
        insertData(dropData, dragData, insertIndex);
    }, 100);

    return insertIndex;
};
/**
 * 移动到节点后
 * @param dragData 拖拽节点数据列表
 * @param dropData 放下节点数据
 * @returns 移动后的节点索引
 */
const moveAfter = (dragData: NodeData[], dropData: NodeData) => {
    if (!dropData._parent) return;

    let dropIndex = 0;

    // 延迟操作，避免事件未触发
    setTimeout(() => {
        // 移除旧节点
        removeData(dragData);

        dropIndex = dropData._parent!._children!.indexOf(dropData) + 1;

        // 添加新节点
        insertData(dropData._parent!, dragData, dropIndex);
    }, 100);

    return dropIndex;
};

// 抛出方法
defineExpose({
    getMultipleList,
    setMultipleList,
    clearMultipleList,
    toggleChecked,
    toggleExpanded,
    expandAll,
    collapseAll,
    filter,
    findById,
    getLinealParents,
    getParent,
    getChildren,
    hasChild,
    removeData,
    insertData,
    moveBefore,
    moveIn,
    moveAfter,
});
</script>

<style lang="less">
.vue-project-tree {
    --indent-width: v-bind(_indent);
    --node-height: v-bind(_nodeHeight);

    --color: #666666;
    --color-current: #4C74F6;
    --color-drop-in: #fff;
    --bg-color: transparent;
    --bg-color-current: #E0EFFF;
    --bg-color-checked: #E0EFFF;
    --bg-color-hover: #0000000a;
    --bg-color-drop-in: #409eff;

    width: 100%;
    height: 100%;
}
</style>
