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
  height,
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
// 格式化容器高度
const _height = computed(() => {
  if (height === undefined) return undefined;
  if (typeof height === 'number') return height + 'px';
  return height;
});

// 虚拟根节点 - 使用 ref 保持稳定引用，避免 computed 每次创建新对象导致属性修改丢失
const virtualRoot = ref<NodeData>({
  [idKey]: -1,
  [labelKey]: '虚拟根节点',
  [childrenKey]: undefined as any,
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
  _children: undefined as any,
  _level: -1,
});
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

// 显示节点列表 - 使用 ref + 手动触发更新，因为不可枚举属性变化不会触发 computed
const visibleListVersion = ref(0);
const isFiltering = ref(false);
const visibleList = computed(() => {
  // 依赖 visibleListVersion 以在展开/折叠时触发重新计算
  visibleListVersion.value;
  return _getVisibleList();
});
const refreshVisibleList = () => {
  visibleListVersion.value++;
};
const _getVisibleList = () => {
  const list = <NodeData[]>[];
  if (!Array.isArray(data)) return list;

  const traverse = (children: NodeData[], parent: NodeData, level: number) => {
    children.forEach((child: NodeData) => {
      // 初始化节点的不可枚举属性
      Object.entries({
        _isVisible: child._isVisible ?? false,
        _isCurrent: child._isCurrent ?? false,
        _isChecked: child._isChecked ?? false,
        _isExpanded: child._isExpanded ?? false,
        _isExpandedOld: child._isExpandedOld ?? false,
        _isMoving: child._isMoving ?? false,
        _isDropBefore: child._isDropBefore ?? false,
        _isDropIn: child._isDropIn ?? false,
        _isDropAfter: child._isDropAfter ?? false,
        _parent: undefined,
        _id: undefined,
        _label: undefined,
        _children: undefined,
        _level: level,
      }).forEach(([key, value]: [string, any]) => {
        if (!(key in child)) {
          Object.defineProperty(child, key, {
            value,
            writable: true,
            enumerable: false,
          });
        } else {
          // 已存在的属性更新 _level
          if (key === '_level') child._level = level;
        }
      });
      // 更新动态属性
      child._id = child[idKey];
      child._label = child[labelKey];
      child._children = child[childrenKey];
      child._parent = parent;

      // 虚拟树：节点默认不可见，需要父节点展开才可见
      // 根节点的子节点始终可见
      // 如果 _filter 已将 _isVisible 设为 false，则不显示（过滤状态）
      const isParentExpanded = parent === virtualRoot.value || parent._isExpanded;
      const isFilteredOut =
        '_isVisible' in child && child._isVisible === false && isFiltering.value;
      if (isParentExpanded && !isFilteredOut) {
        child._isVisible = true;
        list.push(child);
        // 如果节点展开，递归处理子节点
        if (child._isExpanded && child._children?.length) {
          traverse(child._children, child, level + 1);
        }
      } else {
        child._isVisible = false;
      }
    });
  };

  traverse(data, virtualRoot.value, 0);
  return list;
};

// ============ 虚拟滚动 ============
const scrollRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const nodeHeightNum = computed(() => parseFloat(nodeHeight as string));
// 缓冲区行数
const BUFFER = 5;

// 总高度
const totalHeight = computed(() => visibleList.value.length * nodeHeightNum.value);

// 可视区域起始索引
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / nodeHeightNum.value) - BUFFER;
  return Math.max(0, index);
});

// 可视区域结束索引
const endIndex = computed(() => {
  if (!scrollRef.value) return startIndex.value + 30;
  const viewHeight = scrollRef.value.clientHeight || 500;
  const index = Math.ceil((scrollTop.value + viewHeight) / nodeHeightNum.value) + BUFFER;
  return Math.min(visibleList.value.length, index);
});

// 实际渲染的节点列表
const renderList = computed(() => visibleList.value.slice(startIndex.value, endIndex.value));

// 偏移量
const offsetY = computed(() => startIndex.value * nodeHeightNum.value);

// 滚动事件处理
const onScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
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
    extraData: DroppedExtraData,
  ];
  droppedBefore: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData,
  ];
  droppedIn: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData,
  ];
  droppedAfter: [
    event: DragEvent,
    dragData: NodeData[],
    dropData: NodeData,
    extraData: DroppedExtraData,
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
  toggleExpanded(data);
  emit('nodeClick', event, data, nodeElement);
};
// 复选框点击事件
const onCheckboxClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  currentData.value = data;
  toggleChecked(data);
  emit('nodeClick', event, data, nodeElement);
};
// 节点单击事件
const onNodeClick = (event: MouseEvent, data: NodeData, nodeElement: HTMLElement) => {
  if (event.ctrlKey && event.shiftKey) {
  } else if (event.ctrlKey) {
    // 选中上次点击元素
    if (_lastData && !_lastData._isChecked) {
      toggleChecked(_lastData);
    }
    // 选中当前元素
    toggleChecked(data);
  } else if (event.shiftKey) {
  } else {
    // 普通单击
    if (checkbox) {
      if (!data._isChecked && !data._children?.every(child => child._isChecked))
        clearMultipleList();

      // 切换选中状态
      toggleChecked(data);
    } else if (expandWithClick) {
      clearMultipleList();
      // 切换展开状态
      toggleExpanded(data);
    }
  }
  // 处理多选逻辑后设置当前节点
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

  // 若拖拽的不是选中节点，则更正多选列表
  if (!data._isChecked) {
    clearMultipleList();
    toggleChecked(data, true);
  }

  getMultipleList().forEach(data => {
    data._isMoving = true;
    // 折叠节点
    data._isExpandedOld = data._isExpanded;
    data._isExpanded = false;
  });

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

  // 自动展开下级节点
  if (!data._isMoving && !data._isExpanded && event.timeStamp - _lastTimeStamp >= expandHoverTime)
    data._isExpanded = true;

  // 拖动视觉提示
  if (_allowDrop(data)) {
    // 移动样式
    if (event.offsetY <= dropOffset) {
      safeVolume(event.dataTransfer, 'dropEffect', 'move');
      data._isDropBefore = true;
      data._isDropIn = data._isDropAfter = false;
    } else if (event.offsetY >= parseFloat(nodeHeight as string) - dropOffset) {
      safeVolume(event.dataTransfer, 'dropEffect', 'move');
      data._isDropBefore = data._isDropIn = false;
      data._isDropAfter = true;
    } else {
      safeVolume(event.dataTransfer, 'dropEffect', 'move');
      data._isDropIn = true;
      data._isDropBefore = data._isDropAfter = false;
    }
    // 复制样式
    if (event.ctrlKey) {
      safeVolume(event.dataTransfer, 'dropEffect', 'copy');
    }
  } else {
    // 禁用样式
    safeVolume(event.dataTransfer, 'dropEffect', 'none');
    data._isDropIn = data._isDropBefore = data._isDropAfter = false;
  }
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

  // 抛出子事件
  if (extraData.type === 'before') {
    onDroppedBefore(event, getMultipleList(), data, extraData);
  } else if (extraData.type === 'in') {
    onDroppedIn(event, getMultipleList(), data, extraData);
  } else if (extraData.type === 'after') {
    onDroppedAfter(event, getMultipleList(), data, extraData);
  }
};
// 节点拖拽放到节点前事件
const onDroppedBefore = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  extraData._default = () => moveBefore(dragData, dropData);

  emit('droppedBefore', event, dragData, dropData, extraData);

  if (!extraData.isPreventDefault) {
    extraData._default!();
  } else {
    refreshVisibleList();
  }
};
// 节点拖拽放到节点内事件
const onDroppedIn = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  extraData._default = () => moveIn(dragData, dropData);

  emit('droppedIn', event, dragData, dropData, extraData);

  if (!extraData.isPreventDefault) {
    extraData._default!();
  } else {
    refreshVisibleList();
  }
};
// 节点拖拽放到节点后事件
const onDroppedAfter = (
  event: DragEvent,
  dragData: NodeData[],
  dropData: NodeData,
  extraData: DroppedExtraData
) => {
  extraData._default = () => moveAfter(dragData, dropData);

  emit('droppedAfter', event, dragData, dropData, extraData);

  if (!extraData.isPreventDefault) {
    extraData._default!();
  } else {
    refreshVisibleList();
  }
};
// 节点拖拽结束事件
const onDragEnd = (event: DragEvent, data: NodeData, nodeElement: HTMLElement) => {
  getMultipleList().forEach(data => {
    // 取消移动状态
    data._isMoving = false;
    // 还原节点展开状态
    data._isExpanded = data._isExpandedOld;
    // 展开父节点
    if (data._parent) data._parent._isExpanded = true;
  });

  // 默认的 data 和 nodeElement 为拖拽开始时的值，需在 dragenter 追踪变化
  emit('end', event, [data, _dropTargetData!], [nodeElement, _dropTargetElement!]);
};

// 判断节点是否允许放下，包括允许拖拽、允许放入、非选中状态、父节点非选中状态
const _allowDrop = (data: NodeData): boolean => {
  return allowDrop(data) && !data._isChecked && (!data._parent || _allowDrop(data._parent));
};
/**
 * 获取多选列表
 */
const getMultipleList = (): NodeData[] => {
  return multipleList.value.filter(child => child._parent && !child._parent._isChecked);
};
/**
 * 设置多选列表
 * @param list 需要多选的节点列表
 */
const setMultipleList = (dataList: NodeData[]): void => {
  clearMultipleList();
  multipleList.value.push(...dataList);
  multipleList.value.forEach((data: NodeData) => (data._isChecked = true));
};
/**
 * 清除多选列表
 */
const clearMultipleList = (): void => {
  multipleList.value.forEach(data => (data._isChecked = false));
  multipleList.value.length = 0;
};
/**
 * 切换节点选中状态
 * @param data 节点数据
 */
const toggleChecked = (data: NodeData, isChecked?: boolean) => {
  const _isChecked = isChecked ?? !data._isChecked;

  if (data._children?.some(child => !child._isChecked) && isChecked === void 0) {
    _setChecked(data, _isChecked, 'children');
  } else {
    _setChecked(data, _isChecked, 'all');
  }
};
const _setChecked = (data: NodeData, checked: boolean, mode: 'all' | 'children') => {
  if (mode === 'all') {
    if (checked) {
      multipleList.push(data);
    } else {
      multipleList.remove(data);
      if (data._parent) multipleList.remove(data._parent);
    }
  }
  if (data._children) {
    data._children.forEach(child => _setChecked(child, checked, 'all'));
  }
};
/**
 * 切换节点展开状态
 * @param data 节点数据
 */
const toggleExpanded = (data: NodeData) => {
  data._isExpanded = !data._isExpanded;
  refreshVisibleList();
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
  refreshVisibleList();
};
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
  refreshVisibleList();
};
/**
 * 立即调用 `filterMethod` 对节点进行过滤
 * @param value 作为 `filterMethod` 的第一个参数
 */
const filter = (value: any) => {
  isFiltering.value = !!value;
  _filter(value, virtualRoot.value);
  refreshVisibleList();
};
const _filter = (value: any, root: NodeData) => {
  root._children?.forEach((data: NodeData) => {
    const match = filterMethod(value, data);
    // 如果子节点有匹配，则当前节点也需要展开
    let childMatch = false;
    if (data._children?.length) {
      _filter(value, data);
      childMatch = data._children!.some((child: NodeData) => child._isVisible);
    }
    data._isVisible = match || childMatch;
    if (childMatch) data._isExpanded = true;
  });
};
/**
 * 通过节点主键值查找节点数据
 * @param id 节点主键值
 */
const findById = (id: string | number): NodeData | null => {
  return _findById(id, virtualRoot.value);
};
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
 * 获取节点的所有父节点数据列表
 * @param data 节点数据
 * @returns 父节点数据列表
 */
const getParents = (data: NodeData): NodeData[] => {
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
 * 获取节点的子节点数据列表
 * @param data 节点数据
 * @returns 子节点数据列表
 */
const getChildren = (data: NodeData): NodeData[] | undefined => {
  return data._children;
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
  refreshVisibleList();
};
/**
 * 插入节点
 * @param parentData 父节点数据
 * @param dataList 节点数据列表
 * @param insertIndex 插入的位置下标（默认0）
 */
const insertData = (parentData: NodeData, dataList: NodeData[], insertIndex = 0) => {
  if (!parentData._children) parentData[childrenKey] = parentData._children = [];

  parentData._children!.splice(insertIndex, 0, ...dataList.filter((data: NodeData) => !!data));
  refreshVisibleList();
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

/**
 * 滚动到指定节点位置
 * @param data 节点数据或节点主键值
 */
const scrollTo = (data: NodeData | string | number) => {
  let targetData: NodeData | null = null;
  if (typeof data === 'string' || typeof data === 'number') {
    targetData = findById(data);
  } else {
    targetData = data;
  }
  if (!targetData) return;

  // 确保所有父节点展开
  let parent = targetData._parent;
  while (parent && parent !== virtualRoot.value) {
    if (!parent._isExpanded) {
      parent._isExpanded = true;
    }
    parent = parent._parent;
  }
  refreshVisibleList();

  // 查找节点在可见列表中的索引
  const index = visibleList.value.indexOf(targetData);
  if (index < 0) return;

  // 滚动到对应位置
  if (scrollRef.value) {
    scrollRef.value.scrollTop = index * nodeHeightNum.value;
  }
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
  getParents,
  getParent,
  getAllChildren,
  getChildren,
  hasChild,
  removeData,
  insertData,
  moveBefore,
  moveIn,
  moveAfter,
  scrollTo,
});
</script>

<template>
  <div
    v-if="Array.isArray(data)"
    class="vue-project-tree virtual"
    ref="scrollRef"
    @scroll="onScroll"
    :style="_height ? { height: _height } : undefined"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div class="virtual-scroll-content" :style="{ transform: `translateY(${offsetY}px)` }">
        <project-tree-virtual-node
          v-for="node in renderList"
          :key="node[idKey]"
          :virtual="virtual"
          :parent="node._parent ?? null"
          :data="node"
          :id-key="idKey"
          :label-key="labelKey"
          :children-key="childrenKey"
          :current-data="currentData"
          :highlight-current="highlightCurrent"
          :level="node._level ?? 0"
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
      </div>
    </div>
  </div>
</template>

<style lang="less">
.vue-project-tree.virtual {
  --indent-width: v-bind(_indent);
  --node-height: v-bind(_nodeHeight);

  width: 100%;
  height: 100%;
  overflow-y: auto;

  .virtual-scroll-spacer {
    position: relative;
    width: 100%;
  }

  .virtual-scroll-content {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }
}
</style>
