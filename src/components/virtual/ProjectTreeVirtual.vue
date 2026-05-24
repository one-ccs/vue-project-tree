<script setup lang="ts">
import { computed, ref, watchEffect, type Ref } from 'vue';
import type { ProjectTreeProps, DroppedExtraData, NodeData } from '@/utils/interface.js';
import { safeVolume, getAllChildren } from '@/utils/common.js';
import ProjectTreeVirtualNode from './ProjectTreeVirtualNode.vue';

const {
  virtual,
  data,
  idKey = 'id',
  labelKey = 'label',
  childrenKey = 'children',
  indent = 24,
  nodeHeight = 35,
  highlightCurrent = true,
  expandIcon = true,
  expandIconSize = 12,
  expandIconHold = 'show',
  expandWithClick = true,
  expandHoverTime = 380,
  checkbox = false,
  checkboxSize = 18,
  nodeIcon = false,
  nodeIconSize = 20,
  filterMethod = (value: any, data: NodeData) => true,
  draggable = false,
  allowDrag = (data: NodeData) => true,
  allowDrop = (data: NodeData) => true,
  dropOffset = 8,
} = defineProps<ProjectTreeProps>();
if (!Array.isArray(data)) console.error(`VueProjectTree 绑定的参数 data (${data}) 必须为数组类型`);

// 格式化缩进
const _indent = computed(() => {
  if (typeof indent === 'number') return indent + 'px';
  return indent;
});
// 格式化高度
const _nodeHeight = computed(() => {
  if (typeof nodeHeight === 'number') return nodeHeight + 'px';
  return nodeHeight;
});
// 格式化展开图标大小
const _expandIconSize = computed(() => {
  if (typeof expandIconSize === 'number') return expandIconSize + 'px';
  return expandIconSize;
});
// 格式化节点图标大小
const _nodeIconSize = computed(() => {
  if (typeof nodeIconSize === 'number') return nodeIconSize + 'px';
  return nodeIconSize;
});

// 虚拟根节点
const virtualRoot = computed<NodeData>(() => ({
  [idKey]: -1,
  [labelKey]: '虚拟根节点',
  [childrenKey]: undefined,
  _isVisible: false,
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
  _label: '虚拟根节点',
  _children: undefined,
  _level: -1,
}));
watchEffect(() => {
  virtualRoot.value[childrenKey] = virtualRoot.value._children = data;
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

// 显示节点列表
const visibleList = computed(() => {
  return _getVisibleList(virtualRoot.value);
});
const _getVisibleList = (data: NodeData) => {
  const visibleList = <NodeData[]>[];

  data._children?.forEach((child: NodeData) => {});
  return visibleList;
};

// 多选列表
const multipleList = ref<NodeData[]>([]) as Ref<NodeData[]> & {
  push: Function;
  remove: Function;
};
multipleList.push = (data: NodeData) => {
  if (!multipleList.value.includes(data)) multipleList.value.push(data);
  data._isChecked = true;
};
multipleList.remove = (data: NodeData) => {
  const index = multipleList.value.indexOf(data);
  if (index !== -1) multipleList.value.splice(index, 1);
  data._isChecked = false;
};

// 上次选中节点
let _lastData = <NodeData | undefined>undefined;
// 放下目标的 data
let _dropTargetData = <NodeData | null>null;
// 放下目标的 HTMLElement
let _dropTargetElement = <HTMLElement | null>null;
let _lastTimeStamp = 0;

/* 注意：以下事件已经冒泡到顶层，仅触发一次 */
const emit = defineEmits<{
  currentDataChange: [data: NodeData | undefined];
  nodeClick: [event: MouseEvent, data: NodeData, nodeElement: HTMLElement];
  nodeDblclick: [event: MouseEvent, data: NodeData, nodeElement: HTMLElement];
  nodeRightClick: [event: MouseEvent, data: NodeData, nodeElement: HTMLElement];
  start: [event: DragEvent, data: NodeData, nodeElement: HTMLElement];
  enter: [event: DragEvent, data: NodeData, nodeElement: HTMLElement];
  over: [event: DragEvent, data: NodeData, nodeElement: HTMLElement];
  leave: [event: DragEvent, data: NodeData, nodeElement: HTMLElement];
  dropped: [
    event: DragEvent,
    data: NodeData,
    nodeElement: HTMLElement,
    extraData: DroppedExtraData
  ];
  droppedBefore: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData
  ];
  droppedIn: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData
  ];
  droppedAfter: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData
  ];
  end: [event: DragEvent, data: [NodeData, NodeData], nodeElement: [HTMLElement, HTMLElement]];
}>();

// 当前节点改变事件
const onCurrentDataChange = (data: NodeData | undefined) => {
  emit('currentDataChange', data);
};
// 展开节点图标点击事件
const onExpandClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  emit('nodeClick', event, data, nodeElement);
};
// 复选框点击事件
const onCheckboxClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  emit('nodeClick', event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  emit('nodeClick', event, data, nodeElement);
};
// 节点双击事件
const onNodeDblclick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  emit('nodeDblclick', event, data, nodeElement);
};
// 节点右键单击事件
const onNodeRightClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  emit('nodeRightClick', event, data, nodeElement);
};
// 节点拖拽开始事件
const onDragStart = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  emit('nodeClick', event, data, nodeElement);
  emit('start', event, data, nodeElement);
};
// 节点拖拽进入事件
const onDragEnter = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  // 阻止默认拖拽行为
  event.preventDefault();

  _lastTimeStamp = event.timeStamp;
  // 记录目标节点
  _dropTargetData = data;
  _dropTargetElement = nodeElement;
  emit('enter', event, data, nodeElement);
};
// 节点拖拽 over 事件
const onDragOver = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  // 阻止默认拖拽行为
  event.preventDefault();
  emit('over', event, data, nodeElement);
};
// 节点拖拽离开事件
const onDragLeave = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  // 清除拖动视觉提示
  data._isDropBefore = data._isDropIn = data._isDropAfter = false;
  emit('leave', event, data, nodeElement);
};
// 节点拖拽放下事件
const onDropped = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  const extraData = <DroppedExtraData>{
    type: 'dropped',
    isPreventDefault: false,
    preventDefault: () => (extraData.isPreventDefault = true),
  };

  // 清除拖动视觉提示
  data._isDropBefore = data._isDropIn = data._isDropAfter = false;

  // 判断放下范围
  if (event.offsetY <= dropOffset) {
    extraData.type = 'before';
  } else if (event.offsetY >= parseFloat(nodeHeight as string) - dropOffset) {
    extraData.type = 'after';
  } else {
    extraData.type = 'in';
  }

  emit('dropped', event, data, nodeElement, extraData);
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  emit('droppedBefore', event, dragData, dropData, extraData);
};
// 节点拖拽放到节点内事件
const onDroppedIn = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  emit('droppedIn', event, dragData, dropData, extraData);
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  emit('droppedAfter', event, dragData, dropData, extraData);
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  // 默认的 data 和 nodeElement 为拖拽开始时的值，需在 dragenter 追踪变化
  emit('end', event, [data, _dropTargetData!], [nodeElement, _dropTargetElement!]);
};
</script>

<template>
  <div v-if="Array.isArray(data)" class="vue-project-tree virtual">
    <template v-for="node in visibleList" :key="node[idKey]">
      <project-tree-virtual-node
        v-if="node ? true : (console.warn(`未渲染节点, 无效的节点数据(${node})`), false)"
        :virtual="virtual"
        :parent="virtualRoot"
        :data="node"
        :id-key="idKey"
        :label-key="labelKey"
        :children-key="childrenKey"
        :current-data="currentData"
        :highlight-current="highlightCurrent"
        :level="0"
        :expand-icon-hold="expandIconHold"
        :expand-icon="expandIcon"
        :expand-icon-size="_expandIconSize"
        :checkbox="checkbox"
        :checkbox-size="checkboxSize"
        :node-icon="nodeIcon"
        :node-icon-size="_nodeIconSize"
        @expand-click="onExpandClick"
        @checkbox-click="onCheckboxClick"
        @node-click="onNodeClick"
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
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}"></slot>
        </template>
      </project-tree-virtual-node>
    </template>
  </div>
</template>

<style lang="less">
.vue-project-tree .virtual {
  --indent-width: v-bind(_indent);
  --node-height: v-bind(_nodeHeight);

  width: 100%;
  height: 100%;
}
</style>
