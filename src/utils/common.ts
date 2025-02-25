/**
 * 安全的属性赋值，如果对象存在且为对象，则赋值给对象属性
 * @param object 对象
 * @param property 属性
 * @param value 值
 */
export const safeVolume = (object: any, property: string, value: any) => {
    object && typeof object === "object" && (object[property] = value);
};
