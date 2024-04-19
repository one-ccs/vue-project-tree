# vue-project-tree

## 使用

1. 安装

`npm install vue-project-tree -S`

2. 导入


## 属性

| 名称 | 说明 | 类型| 默认值 |
| --- | --- | --- | --- |
| data | 树形数据，最外层必须是数组 | `Array` |  |
| idKey? | 主键属性名（值在树中必须唯一） | `string` | "id" |
| labelKey? | 标签属性名 | `string` | "label" |
| childrenKey? | 子节点数组属性名 | `string` | "children" |
| currentId? | 当前选中节点的主键值 | `any` |  |
| indent? | 左侧缩进值 | `number \| string` | 24 |
| nodeHeight? | 节点高度 | `number \| string` | 35 |
| expandIconSize? | 展开图标大小 | `number \| string` | 10 |
| nodeIcon? | 是否显示节点图标 | `boolean` | false |
| nodeIconSize? | 节点图标大小 | `number \| string` | 20 |
| filterMethod? | 过滤方法（需手动调用 filter 函数执行过滤） | `Function` | () => true |
| draggable? | 是否允许拖拽 | `boolean` | false |
| sortable? | 是否允许排序 | `boolean` | false |
| allowDrag? | 节点是否拖拽放下处理函数（返回 true 表示允许拖拽） | `Function` | () => false |
| allowDrop? | 节点是否允许放下处理函数（返回 true 表示允许放下） | `Function` | () => false |

## 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| nodeClick | 节点点击事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| nodeRightClick | 节点右键点击事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| start | 拖拽开始事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| enter | 拖拽进入事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| over | 拖拽进入后在节点内持续触发 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| leave | 拖拽离开事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| dropped | 节点放下事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| droppedBefore | 放在节点前事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| droppedIn | 放在节点内事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| droppedAfter | 放在节点后事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |
| end | 拖拽结束事件 | (event: DragEvent, data: any, nodeElement: HTMLElement)分别为事件数据，节点数据，节点元素 |

## 方法

| 方法 | 描述 | 参数 |
| --- | --- | --- |
| getMultipleList | 获取选择节点的 data 数据 |  |
| clearMultipleList | 清除选择节点 |  |
| filter | 执行过滤 | 接受一个参数并指定为 filter-method 的第一个参数 |


## 插槽
