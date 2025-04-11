export interface VueProjectTreeProps {
    data: NodeData[];
    idKey?: string;
    labelKey?: string;
    childrenKey?: string;
    indent?: number | string;
    nodeHeight?: number | string;
    highlightCurrent?: boolean;
    expandIcon?: boolean;
    expandIconSize?: number | string;
    expandIconHold?: boolean;
    expandWithClick?: boolean;
    expandHoverTime?: 380;
    checkbox?: boolean;
    checkboxSize?: number | string;
    nodeIcon?: boolean;
    nodeIconSize?: number | string;
    filterMethod?: Function;
    draggable?: boolean;
    allowDrag?: Function;
    allowDrop?: Function;
    dropOffset?: number;
};

export interface VueProjectTreeNodeProps {
    parent: NodeData | null;
    data: NodeData;
    idKey: string;
    labelKey: string;
    childrenKey: string;
    currentData?: NodeData;
    highlightCurrent?: boolean;
    level: number;
    expandIcon: boolean;
    expandIconSize: number | string;
    expandIconHold: boolean;
    checkbox: boolean;
    checkboxSize: number | string;
    nodeIcon: boolean;
    nodeIconSize: number | string;
    draggable: boolean;
    allowDrag: Function;
    allowDrop: Function;
};

export interface DroppedExtraData {
    type: "dropped" | "before" | "in" | "after";
    isPreventDefault: boolean;
    preventDefault: Function;
    _default?: Function;
};

export interface NodeData {
    [key: string]: any;
    _isVisible?: boolean;
    _isCurrent?: boolean;
    _isChecked?: boolean;
    _isExpanded?: boolean;
    _isExpandedOld?: boolean;
    _isMoving?: boolean;
    _isDropBefore?: boolean;
    _isDropIn?: boolean;
    _isDropAfter?: boolean;
    _parent?: NodeData | null;
    _id?: string | number;
    _label?: string;
    _children?: NodeData[];
    _level?: number;
}
