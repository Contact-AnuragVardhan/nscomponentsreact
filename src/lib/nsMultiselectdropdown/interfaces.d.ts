export interface INSMultiSelectDropdownSelectedCallback {
    (item: any,index: number): boolean;
}

export interface INSMultiSelectDropdownDisabledCallback {
    (item: any,index: number): boolean;
}

export interface INSMultiSelectDropdownLabelRenderer {
    (arrSelectedItem: any[],arrSelectedIndexes: number[],arrTexts: string[],labelField:string): HTMLElement | string ;
}

export interface INSMultiSelectDropdownFilterSetting {
    caseSensitive?: boolean,
    multiline?: boolean,
    matchType?: string;
}


export interface INSMultiSelectDropdownSetting {
    context?: any,
    dataSource?:any[],
    labelField?: string,
    enableVirtualScroll?: boolean,
    itemHeight?: number,
    labelType?: string,
    itemAllowedToBeSelected?: number,
    countAfterShowText?: number,
    truncateText?: boolean,
    listWidth?: string,
    listHeight?: string,
    filterSetting?: INSMultiSelectDropdownFilterSetting,
    noDataMessage?: string,                              
    placeHolder?: string,
    searchPlaceHolder?: string,
    selectedCallback?: INSMultiSelectDropdownSelectedCallback,
    disabledCallback?: INSMultiSelectDropdownDisabledCallback,
    textSelectAll?: string,
    textAllSelected?: string,
    textSelectedCount?: string,
    setTitle?: boolean,
    displayDelimiter?: string,
    enableDefaultOpen?: boolean,
    labelRenderer?: INSMultiSelectDropdownLabelRenderer,
    position?: string,
    showDropDownIcon?: boolean,
    searchInterval?: number,
    [propName: string]: any;
}