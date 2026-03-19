export interface INSTextBoxServerSearchFunction {
    (searchString:string,filterSetting:any,enableHighlighting:boolean,searchRecordLimit:number):void;
}

export interface INSTextBoxRendererFunction {
    (item:any,labelField:string):string;
}

export interface INSTextBoxSetting {
    type?: string;
    context?: any;
    dropDownType?: string;
    maxChars?: number;
    minChars?: number;
    minSearchStartChars?: number;
    caseSensitive?: boolean;
    required?: boolean;
    placeholder?: string;
    displayAsPassword?: boolean;
    enableServerSide?: boolean;
    enableServerWithSmartSearch?: boolean;
    serverSearchCallback?: INSTextBoxServerSearchFunction;
    textBoxRendererCallback?: INSTextBoxRendererFunction;
    delay?: number;
    maxListHeight?: number,
    listWidth?: number;
    labelField?: string;
    arrGridSearchField?:string[];
    isGridOrFilter?: boolean;
    stopHoveringField?: string;
    labelFunction?: any;
    template?: string;
    setDataCallBack?: any;
    itemRenderer?: any;
    enableMultipleSelection?: boolean;
    enableKeyboardNavigation?: boolean;
    noRecordsFoundMessage?: string;
    multiSelectionSeparator?: string;
    pattern?: string;
    restrict?: string;
    dataSource?:any[];
    styleClass?: string;
    dropDownSetting?: any;
    filterSetting?: any;
    enableHighlighting?: boolean;
    searchRecordLimit?: number;
    [propName: string]: any;
}