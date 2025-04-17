# vue-project-tree

使用 Vue3 + TS 不依赖其它第三方库，实现的树形结构展示组件，有拖拽、排序、节点过滤、多选、自定义图标等功能。
覆写内置的 css变量可修改节点样式。

![预览图](https://i-blog.csdnimg.cn/direct/fc7fff3eeabb4da7b335272eb54e8663.gif#pic_center)

## 一、使用

1. 安装

`npm install vue-project-tree -S`

2. 导入

`import VueProjectTree from "vue-project-tree";`

3. 使用

3.1. 工程化环境
```vue
<script setup lang="ts">
import { ref } from 'vue';
import VueProjectTree from "vue-project-tree";

interface TreeNode extends NodeData {
    id?: number;
    label?: string;
    children?: TreeNode[];
};

const data = ref<TreeNode[]>([
    {
        id: 1,
        label: "1",
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
        label: "6",
    },
    {
        id: 7,
        label: "7",
    },
]);
</script>

<template>
    <vue-project-tree :data="data"></vue-project-tree>
</template>
```

3.2. 浏览器环境
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>vue-project-tree</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <vue-project-tree :data="data" checkbox node-icon></vue-project-tree>
    </div>

    <script type="importmap">
        {
            "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
            }
        }
    </script>
    <script type="module">
        import { createApp, ref } from 'vue';
        import VueProjectTree from './vue-project-tree.js';

        const data = ref([{
            'id': 123,
            'label': 123,
            'children': [{
                'id': 456,
                'label': 456,
                'children': [{
                    'id': 789,
                    'label': 789
                }]
            }]
        }]);

        createApp({
            components: {
                VueProjectTree
            },
            data() {
                return {
                    data
                }
            }
        }).mount('#app');
    </script>
</body>
</html>
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
| expandIconHold? | 没有子节点时是否保留位置 | `boolean` | `false` |
| expandWithClick? | 是否在点击节点时展开 | `boolean` | `true` |
| expandHoverTime? | 拖拽时在节点上悬停多少毫秒展开该节点 | `number` | `380` |
| checkbox? | 是否显示复选框 | `boolean` | `false` |
| checkboxSize? | 复选框大小 | `number \| string` | `20` |
| nodeIcon? | 是否显示节点图标 | `boolean` | `false` |
| nodeIconSize? | 节点图标大小 | `number \| string` | `20` |
| filterMethod? | 过滤方法（需手动调用 `filter` 函数执行过滤） | `Function` | `(value: any, data: NodeData) => true` |
| draggable? | 是否允许拖拽 | `boolean` | `false` |
| allowDrag? | 节点是否拖拽放下处理函数（返回 `true` 表示允许拖拽） | `Function` | `(data: NodeData) => false` |
| allowDrop? | 节点是否允许放下处理函数（返回 `true` 表示允许放下） | `Function` | `(data: NodeData) => false` |
| dropOffset? | 放下位置偏移量 | `number` | `8` |

### 2、事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| nodeClick | 节点点击事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| nodeDblclick | 节点双击事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| nodeRightClick | 节点右键点击事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| currentDataChange | 当前节点改变事件 | (data: NodeData | undefined) 节点数据 |
| start | 拖拽开始事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| enter | 拖拽进入事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| over | 拖拽进入后在节点内持续触发 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| leave | 拖拽离开事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement) 分别为事件数据，节点数据，节点元素 |
| dropped | 节点放下事件 | (event: DragEvent, data: NodeData, nodeElement: HTMLElement, extraData: DroppedExtraData) 分别为事件数据，节点数据，节点元素，额外数据（type: 拖拽放下位置, isPreventDefault: 是否阻止默认操作, preventDefault: 调用后阻止默认操作, _default?: 调用后立即执行默认操作（仅放下子事件拥有）） |
| droppedBefore | 放在节点前事件 | (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) 分别为事件数据，拖拽节点数据列表，放下节点数据，额外数据（type: 拖拽放下位置, isPreventDefault: 是否阻止默认操作, preventDefault: 调用后阻止默认操作, _default?: 调用后立即执行默认操作（仅放下子事件拥有 |
| droppedIn | 放在节点内事件 | (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) 分别为事件数据，拖拽节点数据列表，放下节点数据，额外数据（type: 拖拽放下位置, isPreventDefault: 是否阻止默认操作, preventDefault: 调用后阻止默认操作, _default?: 调用后立即执行默认操作（仅放下子事件拥有 |
| droppedAfter | 放在节点后事件 | (event: DragEvent, dragData: NodeData[], dropData: NodeData, extraData: DroppedExtraData) 分别为事件数据，拖拽节点数据列表，放下节点数据，额外数据（type: 拖拽放下位置, isPreventDefault: 是否阻止默认操作, preventDefault: 调用后阻止默认操作, _default?: 调用后立即执行默认操作（仅放下子事件拥有 |
| end | 拖拽结束事件 | (event: DragEvent, data: [NodeData, NodeData], nodeElement: [HTMLElement, HTMLElement]) 分别为事件数据，[开始节点数据，结束节点数据]，[开始节点元素，结束节点元素] |

### 3、方法

| 方法 | 描述 | 参数 | 返回值 |
| --- | --- | --- | --- |
| getMultipleList | 获取多选列表 |  | NodeData[] |
| setMultipleList | 设置多选列表 | (dataList: NodeData[]) 需要多选的节点列表 |  |
| clearMultipleList | 清除多选列表 |  |  |
| toggleChecked | 切换节点选中状态 | (data: NodeData) 节点数据 |  |
| toggleExpanded | 切换节点展开状态 | (data: NodeData) 节点数据 |  |
| expandAll | 展开所有节点 |  |  |
| collapseAll | 收起所有节点 |  |  |
| filter | 立即调用 `filterMethod` 对节点进行过滤 | (value: any) 作为 `filterMethod` 的第一个参数 |  |
| findById | 通过节点主键值查找节点数据 | (id: string \| number) 节点主键值 | NodeData \| null |
| getLinealParents | 获取节点的所有直系父节点数据列表 | (data: NodeData) 节点数据 | NodeData[] |
| getParent | 获取节点的父节点数据，没有则返回 null | (data: NodeData) 节点数据 | NodeData \| null |
| getChildren | 获取节点的所有子节点数据列表 | (data: NodeData) 节点数据 | NodeData[] |
| hasChild | 递归判断父节点是否包含该子节点 | (parent: NodeData, data: NodeData) 分别为父节点数据，子节点数据 | boolean |
| removeData | 移除节点 | (dataList: NodeData[]) 节点数据列表 |  |
| insertData | 插入节点 | (parentData: NodeData, dataList: NodeData[], insertIndex = 0) 分别为父节点数据，节点数据列表，插入的下标（默认0） |  |
| moveBefore | 移动到节点前 | (dragData: NodeData[], dropData: NodeData) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |
| moveIn | 移动到节点内 | (dragData: NodeData[], dropData: NodeData) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |
| moveAfter | 移动到节点后 | (dragData: NodeData[], dropData: NodeData) 分别为拖拽节点数据列表，放下节点数据 | 移动后的节点索引 |

### 4、插槽

| 插槽名 | 说明 | 域 |
| --- | --- | --- |
| expandIcon | 自定义展开图标 | { data, size } 分别为节点数据，展开图标大小 |
| checkbox | 自定义复选框 | { data, size } 分别为节点数据，复选框大小 |
| nodeIcon | 自定义节点图标 | { data, size } 分别为节点数据，节点图标大小 |
| label | 自定义节点标签 | { data } 节点数据 |

### 5、CSS 变量

| 名称 | 说明 | 默认值 |
| --- | --- | --- |
| --color | 文本颜色 | `#666666` |
| --color-current | 当前选中节点文本颜色 | `#4C74F6` |
| --color-drop-in | 放入节点文本颜色 | `#fff` |
| --bg-color| 背景色 | `transparent` |
| --bg-color-current | 当前选中节点背景色 | `#E0EFFF` |
| --bg-color-checked | 选中节点背景色 | `#E0EFFF` |
| --bg-color-hover | 悬停节点背景色 | `#0000000a` |
| --bg-color-drop-in | 放入节点背景色 | `#409eff` |


### 6、注意事项

- 拖动节点时，若页面样式发生变动，会导致节点错位，进而导致拖拽事件不完整，致使节点样式错乱或数据丢失。
