export interface VueProjectTreeProps {
    data: any[];
    idKey?: string;
    labelKey?: string;
    childrenKey?: string;
    indent?: number | string;
    nodeHeight?: number | string;
    highlightCurrent?: boolean;
    expandIcon?: boolean;
    expandIconSize?: number | string;
    nodeIcon?: boolean;
    nodeIconSize?: number | string;
    filterMethod?: Function;
    draggable?: boolean;
    sortable?: boolean;
    allowDrag?: Function;
    allowDrop?: Function;
};

export interface VueProjectTreeNodeProps {
    data: any;
    idKey: string;
    labelKey: string;
    childrenKey: string;
    currentData: any;
    highlightCurrent?: boolean;
    level: number;
    expandIcon: boolean,
    expandIconSize: number | string;
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
