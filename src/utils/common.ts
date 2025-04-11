import { NodeData } from "./interface";


/**
 * 安全的属性赋值，如果对象存在且为对象，则赋值给对象属性
 * @param object 对象
 * @param property 属性
 * @param value 值
 */
export const safeVolume = (object: any, property: string, value: any) => {
    object && typeof object === "object" && (object[property] = value);
};

/**
 * 获取节点的所有子节点数据列表
 * @param data 节点数据
 * @returns 子节点数据列表
 */
export const getChildren = (data: NodeData): NodeData[] => {
    const children: NodeData[] = [];
    if (data._children) {
        data._children.forEach((child: NodeData) => {
            children.push(child);
            children.push(...getChildren(child));
        });
    }
    return children;
};
