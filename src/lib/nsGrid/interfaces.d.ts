//import { DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"

////////// Interfaces /////////////////////////////////////////////////////////

//export type GridComponentRef = DynamicComponentService | (() => void);
export type GridComponentRef = (() => void);

export interface INSGridCascadeFunction {
    (control : any,childControl : any,item : any,dataField: string,cellIndex: number,colItem : any,childCell: any,row : any):void;
}

export interface INSGridFilterRendererFunction {
    (colItem: INSGridColumn,colIndex: number,cell: any,row: any):any;
}

export interface INSGridAdvancedFilterHandler {
    (dataField:string,nsPopUp: any,advancedFilterSetting: any,rendererID: string,enableApply: boolean,createApplySectionCallback: any,advanceFilterGridCallback: any,removePopUpCallback: any):void;
}

export interface INSGridGroupRendererFunction {
    (item: any,dataField: string,index: number,colIndex: number,row: any,arrChildren: any[],childrenCount: number,arrFlatChildren: any[],groupLevel:number): string | any;
}

export interface INSGridItemRendererFunction {
    (item: any,dataField: string,index: number,colIndex: number,row: any): string | any;
}

export interface INSGridLabelFunction {
    (item: any,dataField: string,colItem: INSGridColumn):string;
}

export interface INSGridToolTipRendererFunction {
    (item: any,dataField: string,index: number,colIndex: number,row: any):string;
}

export interface INSGridTemplateSetDataFunction {
    (cellElement: any, item: any,dataField: string,colItem: INSGridColumn,row: any):void;
}

export interface INSGridHeaderRendererFunction {
    (colItem: INSGridColumn,colIndex: number): string | any;
}

export interface INSGridExtraRowHeaderRendererFunction {
    (dataField: string,colItem: INSGridColumn,arrFilteredGroupedSource: any[],rowIndex: number,colIndex: number,extraHeaderCell: any,extraHeaderRow: any): string | any;
}

export interface INSGridContextMenuProviderFunction {
    (item: any, colIndex: number,rowIndex: number): any;
}

export interface INSGridPaginationFetchRecordFunction {
    (fromRecord: number, toRecord: number,pageSize: number): void;
}

export interface INSGridFilterFunction {
    (item: any,filter: any,setting: any,isHierarchical: boolean,childField: string,parentItem: any): any;
}

export interface INSGridHierarchyFilterChildrenFunction {
    (item: any,index: number,isMatch: boolean,filter: any,setting: any,parentItem: any): boolean;
}

export interface INSGridRowMoverDropEndHandlerFunction {
    (row: any,targetTable: any,targetRow: any): any;
}

export interface INSGridEditorValidatorFunction {
    (element: any,value: any): boolean;
}

export interface INSGridEditorIsCellEditableFunction {
    (colItem: INSGridColumn,item: any,colIndex: number,row: any,rowIndex: number): boolean;
}

export interface INSGridEditorAPICommitChangesFunction {
    (): void;
}

export interface INSGridEditorAPICancelChangesFunction {
    (): void;
}

export interface INSGridOnDemandChildFetchCallbackFunction {
    (item: any,rowIndex: number,rowLevel: number,event: any): void;
}

export interface INSEventDispatcherFunction {
    (eventType: string,data: any,param: any,bubbles?: boolean,cancelable?: boolean): void;
}

export interface INSGridCustomClassSetting {
    outerContainer?: string,
    titleBar?: string,
    headerRow?: string,
    headerCell?: string,
    filterRow?: string,
    filterCell?: string,
    bodyRow?: string,
     //for Hierarchies and Grouping grid
    firstBodyColumn?: string,
    nonFirstBodyColumn?: string
}

export interface INSGridMultiCellSelectionSetting {
    scrollableElement?: any,
    enableFillHandle?: boolean,
    enableKeyboardNavigation?: boolean,
    enableCopy?: boolean,
    enablePaste?: boolean,
    cellClass?: string,
    areaClass?: string,
    areaClassLeft?: string,
    areaClassRight?: string,
    areaClassTop?: string,
    areaClassBottom?: string
}


export interface INSGridFilterSetting {
    filterRenderer?: INSGridFilterRendererFunction,
    filterTemplate?: string,
    enableAdvancedFilter?: boolean,
    advancedFilterType?: string,
    advancedFilterHandler?: INSGridAdvancedFilterHandler,
    advancedFilterPopUpPos?: string,
    [propName: string]: any;
}

export interface INSGridColumnCustomIcon {
    menu?: string,
    filter?: string,
    sortAscending?: string,
    sortDescending?: string,
    columnMove?: string
}

export interface INSGridCustomIcon extends INSGridColumnCustomIcon {
    exportButton?: string,
    rowExpanded?: string,
    rowCollapsed?: string
}

export interface INSGridEditorSetting {
    editType?: string,//can be EDITOR_EDITTYPE_CELL,EDITOR_EDITTYPE_ROW
    clickType?: string,// can be EDITOR_EDITING_SINGLECLICK,EDITOR_EDITING_DOUBLECLICK,EDITOR_EDITING_NOCLICK
    stopEditingOnGridFocusOut?: boolean, // if true then grids stops editing when focus is out of grid
    enableMultipleEdit?: boolean // if true then grid allows multiple edits
}

export interface INSGridColumnEditorSetting {
    type?: string, // can be EDITOR_TYPE_TEXT,EDITOR_TYPE_TEXTAREA,EDITOR_TYPE_CUSTOM
    params?: any,// any param to the editor. Properties will differ according to editors
    customEditor?: any,
    validator?: INSGridEditorValidatorFunction,
    isCellEditableCallback?: INSGridEditorIsCellEditableFunction
}

export interface INSGridMasterDetailSetting {
    hasChildField?: string;
    hasChildCallback?: (item: any) => void;
    detailColumns?: INSGridColumn; //detail grid column
    detailDataSourceCallback: (params: any) => void;
    detailGridSetting?: INSGridColumnEditorSetting;//detail grid setting
    gridRefreshEverytimeCallback?: (params: any) => boolean; //callback to tell if detail grid needs to be rendered everytime the master is expanded
    gridHtmlCallback?: (params: any) => string; //returns html with a container having attribute "detailGrid" in which the detail grid will be rendered
    detailRenderer?: INSGridDetailRendererComponent | any; //any for functional component
    detailRendererParam?: any;
    detailHeight?: number;
}

export interface INSGridDetailRendererComponent {
    init: (params: INSGridDetailRendererComponentParam) => Promise<any>;
    getElement?: () => HTMLElement;
    elementAdded?: (params: INSGridDetailRendererComponentParam) => void;
    renderEverytime?: (params: INSGridDetailRendererComponentParam) => boolean;
    destroy?: () => void;
}

export interface INSGridDetailRendererComponentParam {
    masterData: any;
    container: HTMLElement;
    cell: HTMLTableCellElement;
    row: HTMLTableRowElement;
    rowIndex: number;
    [propName: string]: any;
}

export interface INSGridEditorCustomComponentSetting {
    cell: any,
    row: any,
    item: any,
    rowIndex: number,
    cellIndex: number,
    position: any,
    defaultValue: any,
    commitChanges: INSGridEditorAPICommitChangesFunction,
    cancelChanges: INSGridEditorAPICancelChangesFunction,
    validator: INSGridEditorValidatorFunction,
    setting: INSGridColumnEditorSetting,
    column: INSGridColumn,
    //grid instance
    api: any
}

export interface INSGridRendererComponentInstance
{
    instance: INSGridRendererComponent | null,
    componentRef: GridComponentRef, 
    item: any,
    index: number,
    colIndex: number,
    columnName: string;
}

export interface INSGridDetailRendererComponentInstance
{
    instance: INSGridDetailRendererComponent | null,
    componentRef: GridComponentRef,
    param: INSGridDetailRendererComponentParam
}

export interface INSGridRendererComponent 
{
    setData(item: any,dataField: string,index: number,colIndex: number,row: any): void;
}

export interface INSGridGroupRendererComponentInstance
{
    instance: INSGridGroupRendererComponent | null,
    componentRef: GridComponentRef,
    item: any,
    index: number,
    colIndex: number,
    columnName: string;
}

export interface INSGridGroupRendererComponent
{
    setData(item: any,dataField: string,index: number,colIndex: number,row: any,arrChildren: any[],childrenCount: number,arrFlatChildren: any[],groupLevel:number): void;
}

export interface INSGridHeaderRendererComponentInstance
{
    instance: INSGridHeaderRendererComponent | null,
    componentRef: GridComponentRef,
    index: number,
    colItem: INSGridColumn,
    colIndex: number
}

export interface INSGridHeaderRendererComponent
{
    setData(colItem: INSGridColumn,colIndex: number): void;
}

export interface INSGridToolTipRendererComponentInstance
{
    instance: INSGridToolTipRendererComponent | null,
    componentRef: GridComponentRef,
    item: any,
    index: number,
    colIndex: number,
    columnName: string;
}

export interface INSGridToolTipRendererComponent
{
    setData(item: any,dataField: string,index: number,colIndex: number,row: any): void;
}

export interface INSGridExtraRowHeaderRendererComponentInstance
{
    instance: INSGridExtraRowHeaderRendererComponent | null,
    componentRef: GridComponentRef,
    colItem: INSGridColumn,
    index: number,
    colIndex: number,
    columnName: string;
}

export interface INSGridExtraRowHeaderRendererComponent
{
    setData(dataField: string,colItem: INSGridColumn,filteredDataSource: any[],index: number,colIndex: number,extraHeaderCell: any,extraHeaderRow: any): void;
}

export interface INSGridEditorCustomComponentInstance
{
    instance: INSGridEditorCustomComponent | null,
    componentRef: GridComponentRef,
    setting: INSGridEditorCustomComponentSetting,
    colItem: INSGridColumn,
    index: number,
    colIndex: number,
    columnName: string | undefined;
}

export interface INSGridEditorCustomComponent
{
     // gets called once after the editor is created
    init(setting: INSGridEditorCustomComponentSetting): Promise<any> | void;
    // Return the DOM element of editor which gets added in DOM
    getElement(): HTMLElement;
    //fired when element is added in DOM
    elementAdded?(): void;
    //fired when a key was pressed. can be used if component is preventing event propagation.
    handleKeyDown?(event: any,keyCode: any): void;
    // Should return the final value to the grid, the result of the editing
    getValue(): any;
    // gets called when editor is being destroyed.Used to do editor cleanup
    destroy?(): void;
    // gets called when editor is on focus. used when element added in dom and the element which should have focus is different
    setFocus(): void;
    // gets called when grid checks if editor has focus. used when element added in dom and the element which should have focus is different
    hasFocus?(): boolean;
    // gets called when grid wants the current editor value. used when element added in dom and the element which should have focus is different
    hasValueChanged?(currentValue: any): boolean
    // gets called when grid has to commit value.If the validate function returns false then editor value is not committed and editor is not destroyed.
    validate?() : boolean;
    // gets called at the start to figure out whether the editor is popUp or not.
    isPopUp() : boolean;
    // gets called when editor has to save the value. should be used when user wants to manipulate the value before save
    save?(): void;
    // gets called when editor has to cancel the value. should be used when user wants to manipulate the value before cancel
    cancel?(): void;
    setPopUpWrapper?(popUpWrapper: any): void;
}

export interface INSGridColumn {
    dataField?: string,
    headerText?: string,
    width?: any;
    sortable?: boolean;
    sortDescending?: boolean;
    truncateToFit?: boolean;
    headerTruncateToFit?: boolean;
    sortField?: string;
    resizable?: boolean;
    draggable?: boolean;
    autoSize?: boolean;
    showMenu?: boolean;
    minWidth?: number,
    groupRenderer?: INSGridGroupRendererFunction,
    groupRendererComponent?: any,
    groupRendererComponentProps?: any,
    itemRenderer?: INSGridItemRendererFunction,
    itemRendererComponent?: any,
    itemRendererComponentProps?: any,
    template?: string,
    setData?: INSGridTemplateSetDataFunction,
    labelFunction?: INSGridLabelFunction,
    headerRenderer?: INSGridHeaderRendererFunction,
    headerRendererComponent?: any,
    headerRendererComponentProps?: any,
    headerTemplate?: string,
    toolTipField?: string,
    toolTipRenderer?: INSGridToolTipRendererFunction,
    toolTipRendererComponent?: any,
    toolTipRendererComponentProps?: any,
    extraRowHeaderRenderer?: INSGridExtraRowHeaderRendererFunction,
    extraRowHeaderRendererComponent?: any,
    extraRowHeaderRendererComponentProps?: any,
    priority?: number ,
    hideable?: boolean,
    /*****filter related ***********/
    enableFilter?: boolean,
    filter?: INSGridFilterSetting,
    /*****editor related ***********/
    enableEditable?: boolean,
    editorSetting?: INSGridColumnEditorSetting,
    icons?: INSGridColumnCustomIcon,
    [propName: string]: any;
}

export interface INSGridSetting {
    nsTitle?: string,
    type?: string,
    context?: any,
    enableMouseHover?: boolean,
    enableMultipleSelection?: boolean,
    enableKeyboardNavigation?: boolean,
    enableColumnMouseHover?: boolean,
    childField?: string,
    rowKeyField?: string,
    groupByField?: string,
    columnMinWidth?: number,
    customScrollerRequired?: boolean,
    columnResizable?: boolean,
    columnDraggable?: boolean,
    columnSortable?: boolean,
    columnAutoSize?: boolean,
    enablePagination?: boolean,
    paginationType?: string,
    paginationMode?: boolean,
    enableAsyncLoadPagination?: boolean,
    pageSize?: number,
    totalRecords?: number,
    paginationFetchRecordCallBack?: INSGridPaginationFetchRecordFunction,
    enableContextMenu?: boolean,
    contextMenuProvider?: INSGridContextMenuProviderFunction,
    enableFilter?: boolean,
    filterFunction?: INSGridFilterFunction,
    hierarchyFilterChildrenFunction?: INSGridHierarchyFilterChildrenFunction,
    enableAdvancedFilter?: boolean,
    enableVirtualScroll?: boolean,
    enableDataRefreshOnScrollEnd?: boolean,
    dataRefreshfireDelay?: number,
    bottomPercentageForAddRows?: number,
    enableServerCall?: boolean,
    rowHeight?: number,
    enableExport?: boolean,
    exportFileName?: boolean,
    enableResponsive?: boolean,
    enableRowSelection?: boolean,
    enableCellSelection?: boolean,
    enableMultiCellSelection?: boolean,
    responsiveMode?: string,
    noDataMessage?: string,
    leftFixedColumn?: number,
    rightFixedColumn?: number,
    enableFixedColumnAnimation?: boolean,
    enableRowMove?: boolean,
    isSameTableMove?: boolean,
    rowMoverDropEndHandler?: INSGridRowMoverDropEndHandlerFunction,
    renderInCachedMode?: boolean,
    enableVariableRowHeight?: boolean,
    enableToolTipForTruncateText?: boolean,
    heightOffset?: number,
    enableMultiSort?: boolean,
    multiColumnKey?: string,
    dataSource?: any[],
    columns?: INSGridColumn[] | undefined,
    headerExtraRowCount?: number,
    customClass?: INSGridCustomClassSetting,
    theme?: string,
    showExpandCollapseIcon?: boolean,
    multiCellSelectionSetting?: INSGridMultiCellSelectionSetting,
    isSingleLevelGrouping?: boolean,
    multiLevelGroupColumn?: INSGridColumn | undefined,
    enableEditable?: boolean,
    editorSetting?: INSGridEditorSetting,
    //isPopUp should be true if the grid is used in cases like autocomplete so that componentResized is called multiple times so that width is adjusted properly
    isPopUp?: boolean,
    //eventDispatcher to support different frameworks 
    eventDispatcher?: INSEventDispatcherFunction,
    enableOnDemandHierarchy?: boolean,
    onDemandChildDetectionField?: string,
    onDemandChildFetchCallback?: INSGridOnDemandChildFetchCallbackFunction,
    icons?: INSGridCustomIcon,
    enableColumnSetting?: boolean,
    masterDetailSetting?: INSGridMasterDetailSetting,
    [propName: string]: any;
}