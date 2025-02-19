/**
 * 为 `undefined` 和 `null` 指定 `bool` 结果
 * @param value 判断值
 * @param result 当 value 为 `undefined` 或 `null` 时的返回值, 默认为 `false`
 */
export const safeBoolean = (value: any, result = false): boolean => {
    if (value === undefined || value === null) return result;
    return !!value;
};


/**
 * 安全的属性赋值，如果对象存在且为对象，则赋值给对象属性
 * @param object 对象
 * @param property 属性
 * @param value 值
 */
export const safeVolume = (object: any, property: string, value: any) => {
    object && typeof object === "object" && (object[property] = value);
};
