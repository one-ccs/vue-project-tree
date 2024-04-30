# vue-project-tree

![预览图](https://img-blog.csdnimg.cn/direct/a2270f23312d45e89610cdb524fb9d41.gif#pic_center)

## 一、使用

1. 安装

`npm install vue-project-tree -S`

2. 导入

`import VueProjectTree from "vue-project-tree";`

3. 使用

```javascript
import { ref } from 'vue';
import VueProjectTree from "vue-project-tree";

interface TreeNode {
    id: number;
    label: string;
    children?: TreeNode[];
};

const data = ref<TreeNode[]>([
    {
        id: 1,
        label: "1 不允许拖拽",
        children: [
            {
                id: 2,
                label: "2",
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
                label: "5",
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
]);
```

```html
<vue-project-tree :data="data"></vue-project-tree>
```

## 二、API

### 1、属性

| 名称 | 说明 | 类型| 默认值 |
| --- | --- | --- | --- |
| data | 树形数据，最外层必须是数组 | `Array` |  |
| idKey? | 主键属性名（值在树中必须唯一） | `string` | `"id"` |
| labelKey? | 标签属性名 | `string` | `"label"` |
| childrenKey? | 子节点数组属性名 | `string` | `"children"` |
| indent? | 左侧缩进值 | `number \| string` | `24` |
| nodeHeight? | 节点高度 | `number \| string` | `35` |
| highlightCurrent? | 是否高亮当前选中节点 | `boolean` | `true` |
| expandIcon? | 是否显示展开图标 | `boolean` | `true` |
| expandIconSize? | 展开图标大小 | `number \| string` | `10` |
| nodeIcon? | 是否显示节点图标 | `boolean` | `false` |
| nodeIconSize? | 节点图标大小 | `number \| string` | `20` |
| filterMethod? | 过滤方法（需手动调用 `filter` 函数执行过滤） | `Function` | `() => true` |
| draggable? | 是否允许拖拽 | `boolean` | `false` |
| sortable? | 是否允许排序 | `boolean` | `false` |
| allowDrag? | 节点是否拖拽放下处理函数（返回 `true` 表示允许拖拽） | `Function` | `() => false` |
| allowDrop? | 节点是否允许放下处理函数（返回 `true` 表示允许放下） | `Function` | `() => false` |

### 2、事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| nodeClick | 节点点击事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| nodeDblclick | 节点双击事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| nodeRightClick | 节点右键点击事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| currentNodeChange | 当前节点改变事件 | (data: any) 节点数据 |
| start | 拖拽开始事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| enter | 拖拽进入事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| over | 拖拽进入后在节点内持续触发 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| leave | 拖拽离开事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| dropped | 节点放下事件 | (event: DragEvent, data: any, nodeElement: HTMLElement, extraData: DroppedExtraData) 分别为事件数据，节点数据，节点元素，额外数据（type: 拖拽方下位置） |
| droppedBefore | 放在节点前事件 | (event: DragEvent, dragData: any[], dropData: any, preventDefault: Function, _default: Function) 分别为事件数据，拖拽节点数据列表，放下节点数据，回调函数（调用后阻止默认的移动操作），回调函数（调用后移动节点） |
| droppedIn | 放在节点内事件 | (event: DragEvent, dragData: any[], dropData: any, preventDefault: Function, _default: Function) 分别为事件数据，拖拽节点数据列表，放下节点数据，回调函数（调用后阻止默认的移动操作），回调函数（调用后移动节点） |
| droppedAfter | 放在节点后事件 | (event: DragEvent, dragData: any[], dropData: any, preventDefault: Function, _default: Function) 分别为事件数据，拖拽节点数据列表，放下节点数据，回调函数（调用后阻止默认的移动操作），回调函数（调用后移动节点） |
| end | 拖拽结束事件 | (event: DragEvent, data: any, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |

### 3、方法

| 方法 | 描述 | 参数 | 返回值 |
| --- | --- | --- | --- |
| getMultipleList | 获取选择节点的 data 数据 |  |  |
| clearMultipleList | 清除选择节点 |  |  |
| getMoveList| 获取多选列表，多选列表为空时返回元素为当前节点数据的列表 |  |  |
| filter | 执行过滤 | 接受一个参数并指定为 filter-method 的第一个参数 |  |
| setCurrentData | 设置当前选中节点的数据 | (data: any) 节点数据 |  |
| getCurrentData | 获取当前选中节点的数据 |  |  |
| findById | 通过节点主键值查找节点数据 | (id: any, data?: any[]) 分别为节点主键值，（可选）查找的节点数据 |  |
| findParentById | 通过节点主键值查找父节点数据，没有则返回 null | (id: any) 分别为节点主键值 |  |
| removeData | 移除节点 | (dataList: any[]) 节点数据列表 |  |
| addData | 添加节点 | (dataList: any[], parentData: any, insertIndex = 0) 分别为节点数据列表，父节点数据，插入的下标（默认0） |  |
| moveBefore | 移动到节点前 | (dragData: any[], dropData: any) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |
| moveIn | 移动到节点内 | (dragData: any[], dropData: any) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |
| moveAfter | 移动到节点后 | (dragData: any[], dropData: any) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |

### 4、插槽

| 插槽名 | 说明 | 域 |
| --- | --- | --- |
| nodeIcon | 自定义展开图标 | { data, size } 分别为节点数据，展开图标大小 |
| nodeIcon | 自定义节点图标 | { data, size } 分别为节点数据，节点图标大小 |
