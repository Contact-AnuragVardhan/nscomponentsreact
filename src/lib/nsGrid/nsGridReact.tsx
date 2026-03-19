import * as React from 'react';
import {ReactPortal} from "react";

import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsGrid.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import {INSGridSetting, INSGridColumn, INSGridCascadeFunction, INSGridRendererComponentInstance, INSGridGroupRendererComponentInstance, INSGridHeaderRendererComponentInstance,
        INSGridToolTipRendererComponentInstance, INSGridExtraRowHeaderRendererComponentInstance, INSGridEditorCustomComponentInstance,
        INSGridEditorCustomComponentSetting,
        INSGridDetailRendererComponent,
        INSGridDetailRendererComponentInstance,
        INSGridMasterDetailSetting,
        INSGridDetailRendererComponentParam,
        GridComponentRef} from "./interfaces";
//import { DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"
import { NSReactDynamicComponent } from '../dynamicComponentService/nsReactDynamicComponent';

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompGrid = require('./generated/js/nsGrid.min.js');
const NSGrid = nsCompGrid.NSGrid;

export interface INSGridReactSettings extends INSGridSetting {
    setting?: INSGridSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSGridReact extends NSBaseReactComponent<INSGridReactSettings, any> {
    public static readonly GRID_RENDERED = "gridRendered";
    public static readonly MULTI_SELECTION_EDITORS_TEXT = "TEXT";
    public static readonly MULTI_SELECTION_EDITORS_TEXTAREA = "TEXTAREA";
    public static readonly GRID_TYPE_HIERARCHICAL = "hierarchical";
    public static readonly GRID_TYPE_GROUP = "group";
    public static readonly GRID_TYPE_NORMAL = "normal";
    public static readonly GRID_TYPE_MASTER_DETAIL = "masterdetail";
    public static readonly PAGINATION_TYPE_SCROLL = "scroll";
    public static readonly PAGINATION_TYPE_PAGES = "pages";
    public static readonly PAGINATION_MODE_AUTO = "auto";
    public static readonly PAGINATION_MODE_MANUAL = "manual";
    public static readonly RESPONSIVE_MODE_STACK = "stack";
    public static readonly RESPONSIVE_MODE_COLUMN_TOGGLE = "columnToggle";
    public static readonly ADVANCED_FILTER_TEXT = "text";
    public static readonly ADVANCED_FILTER_NUMBER = "number";
    public static readonly ADVANCED_FILTER_LIST = "list";
    public static readonly MULTICOLUMN_KEY_SHIFT = "shift";
    public static readonly MULTICOLUMN_KEY_CTRL = "ctrl";
    public static readonly MULTICOLUMN_KEY_ALT = "alt";
    public static readonly NAVIGATION_UP = "up";
    public static readonly NAVIGATION_DOWN = "down";
    //Editors
    public static readonly EDITOR_EDITTYPE_CELL = "cell";
    public static readonly EDITOR_EDITTYPE_ROW = "row";
    public static readonly EDITOR_EDITING_SINGLECLICK = "singleClick";
    public static readonly EDITOR_EDITING_DOUBLECLICK = "doubleClick";
    public static readonly EDITOR_EDITING_NOCLICK = "noClick";
    public static readonly EDITOR_TYPE_TEXT = "text";
    public static readonly EDITOR_TYPE_TEXTAREA = "textArea";
    public static readonly EDITOR_TYPE_CUSTOM = "custom";
    
    
    private __nsGrid: any;
    private __container: any;
    private __setting : any;
    private __dataSource : any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];

    private __hasInitialized: boolean = false;
    private __hasGridDataSource: boolean = false;
    private __hasDestroyed: boolean = false;
    private __objCustomComponent: any;
    private __masterDetailRendererInstance!: INSGridDetailRendererComponentInstance[];
    //private portals: ReactPortal[] = [];
    //private hasPendingPortalUpdate = false;
    private updateCallbacksOnUpdate: any[] = [];
    private instanceCount = 0;
    private hasPortalUpdated: boolean = false;
    
    //private MAX_COMPONENT_CREATION_TIME: number = 1000;

    constructor(public props: INSGridReactSettings, public state: any) 
    {
        super(props, state);
        this.state = {
            dynamicComponents: [],
        };
        //DynamicComponentService.addDefaultMethods(this,"NSGridReact",this.waitForInstanceCallback.bind(this),this.batchUpdateCallback.bind(this));
    }
    
    public componentDidMount() 
    {
        if (!this.__hasInitialized) {
            this.__hasDestroyed = false;
            if(!this.__nsGrid)
            {
                this.__nsUtil = new NSUtil();
                this.__arrEvents = [ NSGrid.GRID_RENDERED,
                                NSGrid.ROW_SELECTED,
                                NSGrid.ROW_UNSELECTED,
                                NSGrid.ROW_CLICKED,
                                NSGrid.ROW_DOUBLE_CLICKED,
                                NSGrid.ROW_NAVIGATED,
                                NSGrid.CELL_SELECTED,
                                NSGrid.CELL_UNSELECTED,
                                NSGrid.CELL_CLICKED,
                                NSGrid.CELL_DOUBLE_CLICKED,
                                NSGrid.SORT_CHANGING,
                                NSGrid.SORT_CHANGED,
                                NSGrid.ADVANCED_FILTER_CLOSING,
                                NSGrid.FILTER_CHANGING,
                                NSGrid.FILTER_CHANGED,
                                NSGrid.FILTER_RESETTED,
                                NSGrid.COLUMN_RESIZING,
                                NSGrid.COLUMN_RESIZED,
                                NSGrid.COLUMN_MOVING,
                                NSGrid.COLUMN_MOVED,
                                NSGrid.MULTI_SELECTION_EDITORS_TEXT,
                                NSGrid.MULTI_SELECTION_EDITORS_TEXTAREA,
                                NSGrid.EDITOR_CELL_VALUE_CHANGED];
                if(!this.props)
                {
                    this.props = {};
                }
                const setting:INSGridSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
                //setting.columns = [];
                //setting.multiLevelGroupColumn = null;
                this.__dataSource = this.props.dataSource || setting.dataSource;
                setting.columns = this.__setColumn(setting.columns || []);
                setting.multiLevelGroupColumn = this.__setColumnObject(setting.multiLevelGroupColumn || {});
                setting.masterDetailSetting = this.__processMasterDetailSetting(setting.masterDetailSetting);
                //setting.eventDispatcher = this.__eventDispatcher.bind(this);
                if(this.__dataSource)
                {
                    setting.dataSource = this.__dataSource;
                    if(this.__dataSource.length > 0)
                    {
                        this.__hasGridDataSource = true;
                    }
                }
                this.__objCustomComponent = {};
                this.__setting = setting;
                this.__nsGrid = new NSGrid(this.__container,this.__setting);
                this.__addEvents();
            }
            this.__hasInitialized = true;
        }
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
        this.processProps(nextProps);
        if(this.hasPortalUpdated) {
            setTimeout(() => {
                this.hasPortalUpdated = false;
            }, 0);
            
            return true;
        }
        return false;
    }
    
    private processProps(nextProps: any) 
    {
        const objChanges: any = {};
        const arrPropKeys: string[] = Object.keys(nextProps);
        const arrSettingKeys: string[] = Object.keys(this.__setting);
        for (const propKey of arrPropKeys)
        {
            if(propKey === "setting")
            {
                const newSetting: INSGridSetting =  nextProps.setting;
                for (const settingKey of arrSettingKeys)
                {
                    if(!this.__nsUtil.isObjectEqual(this.__setting[settingKey],newSetting[settingKey]))
                    {
                        objChanges[settingKey] = {oldValue: this.__setting[settingKey], newValue: newSetting[settingKey]};
                    }  
                }
            }
            else if(!this.__nsUtil.isObjectEqual(this.props[propKey],nextProps[propKey]))
            {
                objChanges[propKey] = {oldValue: this.props[propKey], newValue: nextProps[propKey]};
            }
        }
        const arrChangeKeys: string[] = Object.keys(objChanges);
        for (const changeKey of arrChangeKeys)
        {
            if(changeKey === "dataSource")
            {
                this.__dataSource = objChanges[changeKey].newValue;
                if(this.__nsGrid)
                {
                    this.__objCustomComponent = {};
                    if(this.__dataSource && this.__dataSource.length > 0)
                    {
                        this.__hasGridDataSource = true;
                    }
                    this.__nsGrid.dataSource(this.__dataSource);
                }
            }
            else if(this.__hasGridDataSource)
            {
                /*const oldPortal = this.portals[0];
                const newPortal = this.createUpdatedPortal(
                    YourDynamicComponent,  // Replace this with the component you want to render
                    this.props,  // Pass in any necessary props
                    (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => {
                        // Handle instance creation callback if needed
                    }
                );
                this.updatePortal(oldPortal, newPortal);*/
            }
        }
    }
    
    public componentWillUnmount() 
    {
        if(this.__hasInitialized)
        {
            if(this.__nsGrid)
            {
                this.__nsGrid.removeComponent();
                this.__nsGrid = null;
            }
            /*if(this.__objCustomComponent) {
                Object.keys(this.__objCustomComponent).forEach((dataField: string) => {
                    const itemDataField: any[] = this.__objCustomComponent[dataField];
                    itemDataField.forEach((itemIndex: any) => {
                        // Check for renderer component instances and call their destroy methods if available
                        ['renderer', 'groupRenderer', 'headerRenderer', 'toolTipRenderer', 'extraRowHeaderRenderer', 'editor'].forEach(rendererType => {
                            if (itemIndex?.[rendererType]) {
                                const componentInstance = itemIndex[rendererType].instance;
                                if (componentInstance && typeof componentInstance.destroy === 'function') {
                                    componentInstance.destroy();
                                }
                            }
                        });
                    });
                });
            }*/
            this.__objCustomComponent = {};
            
            this.__arrEvents.forEach(eventName => {
                this.__nsUtil.removeEvent(this.__container, eventName);
            });
            this.__hasDestroyed = true;
            this.__hasInitialized = false;
        }
    }

    public render() 
    {
        /*return React.createElement<any>("div",{
            style: this.__getStyleForContainer(),
            ref: (e: HTMLElement) => {
                this.__container = e;
            }
        }, this.portals);*/
        return (
            <div style={this.__getStyleForContainer()} ref={(e: HTMLDivElement) => { this.__container = e; }}>
                {this.state.dynamicComponents.map((portal: React.ReactPortal, index: number) => (
                    <React.Fragment key={index}>{portal}</React.Fragment>
                ))}
            </div>
        );
    }
    
    setHeightOffset(offset : number) : void
    {
        this.__nsGrid?.setHeightOffset(offset);
    };
    
    deviceViewChanged(conditionTrue : boolean,queryIndex : number = 0,query : string = "") : void
    {
        this.__nsGrid?.deviceViewChanged(conditionTrue,queryIndex,query);
    };
    
    setGridState(data : any): void
    {
        this.__nsGrid?.setGridState(data);
    };
    
    getGridState(): any
    {
        return this.__nsGrid?.getGridState();
    };
    
    setColumn(arrColumns:INSGridColumn[]): void
    {
        this.__nsGrid?.setColumn(this.__setColumn(arrColumns));
    };
    
    dataSource(source?:any[],isReset?: boolean): any[]
    {
        return this.__nsGrid?.dataSource(source,isReset);
    };
    
    setContextMenuSetting(contextMenuSetting:any): void
    {
        this.__nsGrid?.setContextMenuSetting(contextMenuSetting);
    };
    
    getOrignalItem(item : any): void
    {
        return this.__nsGrid?.getOrignalItem(item);
    };
    
    addRows(source : any[]): void
    {
        this.__nsGrid?.addRows(source);
    };
    
    removeRows(arrIndex : any[]): void
    {
        this.__nsGrid?.removeRows(arrIndex);
    };
    
    groupBy(groupByField : string): void
    {
        this.__nsGrid?.groupBy(groupByField);
    };
    
    expandAll(): void
    {
        this.__nsGrid?.expandAll();
    };
    
    collapseAll(): void
    {
        this.__nsGrid?.collapseAll();
    };
    
    expandCollapseByRow(element : any,rowIndex : number): void
    {
        this.__nsGrid?.expandCollapseByRow(element,rowIndex);
    };
    
    getRowInfo(row : any): any
    {
        return this.__nsGrid?.getRowInfo(row);
    };
    
    getCellInfo(cell : any): any
    {
        return this.__nsGrid?.getCellInfo(cell);
    };
    
    getItemInfo(objItem : any): any
    {
        return this.__nsGrid?.getItemInfo(objItem);
    };
    
    getItemInfoByKeyField(keyFieldValue : string): any
    {
        return this.__nsGrid?.getItemInfoByKeyField(keyFieldValue);
    };
    
    cascadeValues(event: any,callBack: INSGridCascadeFunction): void
    {
        this.__nsGrid?.cascadeValues(event,callBack);
    };
    
    setFontSize(fontSize: number): void
    {
        this.__nsGrid?.setFontSize(fontSize);
    };
    
    addColumn(objColumn: INSGridColumn): void
    {
        this.__nsGrid?.addColumn(this.__setColumnObject(objColumn));
    };
    
    changeDeviceView(conditionTrue: boolean): void
    {
        this.__nsGrid?.changeDeviceView(conditionTrue);
    };
    
    hideColumn(column: INSGridColumn): boolean
    {
        return this.__nsGrid?.hideColumn(column);
    };
    
    showColumn(column: INSGridColumn): boolean
    {
        return this.__nsGrid?.showColumn(column);
    };
    
    swapColumns(sourceColumn: INSGridColumn,destinationColumn: INSGridColumn): boolean
    {
        return this.__nsGrid?.swapColumns(sourceColumn,destinationColumn);
    };
    
    moveColumn(column: INSGridColumn,toIndex: number): boolean
    {
        return this.__nsGrid?.moveColumn(column,toIndex);
    };
    
    sortBy(column: INSGridColumn,isAscending: boolean): void
    {
        this.__nsGrid?.sortBy(column,isAscending);
    };
    
    autoResizeColumn(column: INSGridColumn): void
    {
        this.__nsGrid?.autoResizeColumn(column);
    };
    
    updateRowByIndex(index: number): void
    {
        this.__nsGrid?.updateRowByIndex(index);
    };
    
    updateRowByKeyField(keyFieldValue: any): void
    {
        this.__nsGrid?.updateRowByKeyField(keyFieldValue);
    };
    
    updateCellByIndex(index: number,dataField: string): void
    {
        this.__nsGrid?.updateCellByIndex(index,dataField);
    };
    
    updateCellByKeyField(keyFieldValue: any,dataField: string): void
    {
        this.__nsGrid?.updateCellByKeyField(keyFieldValue,dataField);
    };
    
    updateItemInDataSource(item: any): void
    {
        this.__nsGrid?.updateItemInDataSource(item);
    };
    
    getGroupedSource(): any[]
    {
        return this.__nsGrid?.getGroupedSource();
    }
    
    setSelectedItems(arrItems: any[]): void
    {
        this.__nsGrid?.setSelectedItems(arrItems);
    };
    
    addSelectedItems(arrItems: any[]): void
    {
        this.__nsGrid?.addSelectedItems(arrItems);
    };
    
    removeSelectedItems(arrItems: any[]): void
    {
        this.__nsGrid?.removeSelectedItems(arrItems);
    };
    
    setSelectedItem(item: any): void
    {
        this.__nsGrid?.setSelectedItem(item);
    };
    
    setSelectedIndexes(arrSelectedIndex: number[]): void
    {
        this.__nsGrid?.setSelectedIndexes(arrSelectedIndex);
    };
    
    getSelectedIndex(): number
    {
        return this.__nsGrid?.getSelectedIndex();
    };
    
    getSelectedItem(): any
    {
        return this.__nsGrid?.getSelectedItem();
    };
    
    getSelectedIndexes(): number[]
    {
        return this.__nsGrid?.getSelectedIndexes();
    };
    
    getSelectedItems(): any[]
    {
        return this.__nsGrid?.getSelectedItems();
    };
    
    deselectAll(): void
    {
        this.__nsGrid?.deselectAll();
    };
    
    filter(filter: any,setting: any,enableHighlighting: boolean = false,recordLimit: number = -1): void
    {
        this.__nsGrid?.filter(filter,setting,enableHighlighting,recordLimit);
    };
    
    resetFilters(): void
    {
        this.__nsGrid?.resetFilters();
    };
    
    getFilteredData(): any[]
    {
        return this.__nsGrid?.getFilteredData();
    };
    
    highlightText(dataField: string,text: string): void
    {
        this.__nsGrid?.highlightText(dataField,text);
    };
    
    unHighlightText(): void
    {
        this.__nsGrid?.unHighlightText();
    };
    
    fixFixedHeader(): void
    {
        this.__nsGrid?.fixFixedHeader();
    };
    
    scrollToIndex(selectedIndex: number,animationRequired: boolean = false): void
    {
        this.__nsGrid?.scrollToIndex(selectedIndex,animationRequired);
    };
    
    setNoDataMessage(message: string): void
    {
        this.__nsGrid?.setNoDataMessage(message);
    };
    
    renderHeaderExtraRows(): void
    {
        this.__nsGrid?.renderHeaderExtraRows();
    };
    //Editor related public functions
    editByIndex(index: any,dataField?: string): void
    {
        this.__nsGrid?.editByIndex(index,dataField);
    };
    editByKeyField(keyFieldValue: any,dataField?: string): void
    {
        this.__nsGrid?.editByKeyField(keyFieldValue,dataField);
    };
    editByItem(item: any,dataField?: string): void
    {
        this.__nsGrid?.editByItem(item,dataField);
    };
    editStopByIndex(index: any,dataField?: string,isCancel?:boolean): void
    {
        this.__nsGrid?.editStopByIndex(index,dataField,isCancel);
    };
    editStopByKeyField(keyFieldValue: any,dataField?: string,isCancel?:boolean): void
    {
        this.__nsGrid?.editStopByKeyField(keyFieldValue,dataField,isCancel);
    };
    editStopByItem(item: any,dataField?: string,isCancel?:boolean): void
    {
        this.__nsGrid?.editStopByItem(item,dataField,isCancel);
    };
    getEditorInstances(element?: any,dataField?: string): any[]
    {
        return this.__nsGrid?.getEditorInstances(element,dataField);
    };
    //end of editor related public functions
    setStyle(styleProp: string,value: any): void
    {
        this.__nsGrid?.setStyle(styleProp,value);
    };
    
    setFocus(isFocus: boolean): void
    {
        this.__nsGrid?.setFocus(isFocus);
    };
    
    hasFocus(): boolean
    {
        return this.__nsGrid?.hasFocus();
    };
    
    setTheme(theme: string): void
    {
        this.__nsGrid?.setTheme(theme);
    };
    
    changeProperty(propertyName: string,value: any): void
    {
        this.__nsGrid?.changeProperty(propertyName,value);
    };
    
    getRendererComponentInstance(columnName:string,rowIndex: number): INSGridRendererComponentInstance | null
    {
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].renderer)
        {
            return this.__objCustomComponent[columnName][rowIndex].renderer;
        }
        return null;
    };
    
    getGroupRendererComponentInstance(columnName:string,rowIndex: number): INSGridGroupRendererComponentInstance | null
    {
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].groupRenderer)
        {
            return this.__objCustomComponent[columnName][rowIndex].groupRenderer;
        }
        return null;
    };
    
    getHeaderRendererComponentInstance(columnName:string): INSGridHeaderRendererComponentInstance | null
    {
        const rowIndex: number = 0;
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].headerRenderer)
        {
            return this.__objCustomComponent[columnName][rowIndex].headerRenderer;
        }
        return null;
    };
    
    getToolTipRendererComponentInstance(columnName:string,rowIndex: number): INSGridToolTipRendererComponentInstance | null
    {
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].toolTipRenderer)
        {
            return this.__objCustomComponent[columnName][rowIndex].toolTipRenderer;
        }
        return null;
    };
    
    getExtraRowHeaderRendererComponentInstance(columnName:string,rowIndex: number): INSGridExtraRowHeaderRendererComponentInstance | null
    {
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].extraRowHeaderRenderer)
        {
            return this.__objCustomComponent[columnName][rowIndex].extraRowHeaderRenderer;
        }
        return null;
    };
    
    getEditorComponentInstance(columnName:string,rowIndex: number): INSGridEditorCustomComponentInstance | null
    {
        if(this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].editor)
        {
            return this.__objCustomComponent[columnName][rowIndex].editor;
        }
        return null;
    };

    getDetailComponentInstance(rowIndex: number): INSGridDetailRendererComponent | null
    {
        if(this.__masterDetailRendererInstance && this.__masterDetailRendererInstance.length > rowIndex && this.__masterDetailRendererInstance[rowIndex]) {
            return this.__masterDetailRendererInstance[rowIndex].instance;
        }
        return null;
    };
    
    getGrid(): any
    {
        return this.__nsGrid;
    };
    
    private __setColumn(arrColumns:INSGridColumn[]): INSGridColumn[]
    {
        if(arrColumns && arrColumns.length > 0)
        {
            const retValue: INSGridColumn[] = [];
            for (const column of arrColumns)
            {
                retValue.push(this.__setColumnObject(column));
            }
            return retValue;
        }
        return arrColumns;
    };
    
    private __setColumnObject(objColumn: INSGridColumn): INSGridColumn
    {
        if(objColumn)
        {
            if(objColumn.itemRendererComponent)
            {
                objColumn.itemRenderer = (item: any,dataField: string,index: number,colIndex: number,row: any): any =>
                {
                    let promise = this.__renderer(objColumn.itemRendererComponent,item,dataField,index,colIndex,row,objColumn.itemRendererComponentProps);
                    const objPromise = new Promise((parResolve,parReject) =>
                    {
                        promise.then((element: any) =>{
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if(objColumn.groupRendererComponent)
            {
                objColumn.groupRenderer = (item: any,dataField: string,index: number,colIndex: number,row: any,arrChildren: any[],childrenCount: number,arrFlatChildren: any[],groupLevel:number): any =>
                { 
                    let promise = this.__groupRenderer(objColumn.groupRendererComponent,item,dataField,index,colIndex,row,arrChildren,childrenCount,arrFlatChildren,groupLevel,objColumn.groupRendererComponentProps);
                    const objPromise = new Promise((parResolve,parReject) =>
                    {
                        promise.then((element: any) =>{
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if(objColumn.headerRendererComponent)
            {
                objColumn.headerRenderer = (colItem: INSGridColumn,colIndex: number): any =>
                {
                    let promise = this.__headerRenderer(objColumn.headerRendererComponent,colItem,colIndex,objColumn.headerRendererComponentProps);
                    const objPromise = new Promise((parResolve,parReject) =>
                    {
                        promise.then((element: any) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if(objColumn.toolTipRendererComponent)
            {
                objColumn.toolTipRenderer = (item: any,dataField: string,index: number,colIndex: number,row: any): any =>
                {
                    let promise = this.__toolTipRenderer(objColumn.toolTipRendererComponent,item,dataField,index,colIndex,row,objColumn.toolTipRendererComponentProps);
                    const objPromise = new Promise((parResolve,parReject) =>
                    {
                        promise.then((element: any) =>{
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if(objColumn.extraRowHeaderRendererComponent)
            {
                objColumn.extraRowHeaderRenderer = (dataField: string,colItem: INSGridColumn,arrFilteredGroupedSource: any[],rowIndex: number,colIndex: number,extraHeaderCell: any,extraHeaderRow: any): any =>
                {
                    let promise = this.__extraRowHeaderRenderer(objColumn.extraRowHeaderRendererComponent,dataField,colItem,arrFilteredGroupedSource,rowIndex,colIndex,extraHeaderCell,extraHeaderRow,objColumn.extraRowHeaderRendererComponentProps);
                    const objPromise = new Promise((parResolve,parReject) =>
                    {
                        promise.then((element: any) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if(objColumn.editorSetting && objColumn.editorSetting.customEditor)
            {
                objColumn.editorSetting.customEditor = this.__customEditor(objColumn.editorSetting.customEditor,objColumn);
            }
        }
        return objColumn;
    };

    private __customEditor(customEditorComponent: any, objColumn: INSGridColumn): new () => NSGridCustomEditor {
        const parentIns = this;
    
        return class extends NSGridCustomEditor {
            constructor() {
                super(parentIns, customEditorComponent, objColumn);
            }
        };
    }
    
    
    private __renderer(rendererComponent: any,item: any,dataField: string,index: number,colIndex: number,row: any, props: any): Promise<any>
    {
        
        const objPromise = new Promise((parResolve,parReject) =>
        {
            if(item)
            {
                let objRef: any = null;
                const callback = (dynamicCompRef: GridComponentRef,componentRef: any,container: HTMLElement) =>
                {
                   if(componentRef)
                   {
                        componentRef.setData(item,dataField,index,colIndex,row);
                        const objItem: INSGridRendererComponentInstance = {instance: componentRef,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                        this.__initializeCompInObject(dataField,index);
                        this.__objCustomComponent[dataField][index].renderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                   }
                   else
                   {
                        const objItem: INSGridRendererComponentInstance = {instance: null,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                        this.__initializeCompInObject(dataField,index);
                        this.__objCustomComponent[dataField][index].renderer = objItem;
                        this.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,objItem: objItem});
                   }
                };
                const callbackSent: any = callback;
                const promise = this.__getComponent(rendererComponent,dataField,index,callbackSent,props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else
            {
                parResolve(null);
            }
        });
        return objPromise;
    };
    
    private __groupRenderer(rendererComponent: any,item: any,dataField: string,index: number,colIndex: number,row: any,arrChildren: any[],childrenCount: number,arrFlatChildren: any[],groupLevel:number,props: any): Promise<any>
    {
        
        const objPromise = new Promise((parResolve,parReject) =>
        {
            if(item)
            {
                let objRef: any = null;
                const callback = (dynamicCompRef: GridComponentRef,componentRef: any,container: HTMLElement) =>
                {
                    if(componentRef)
                    {
                         componentRef.setData(item,dataField,index,colIndex,row,arrChildren,childrenCount,arrFlatChildren,groupLevel);
                         const objItem:INSGridGroupRendererComponentInstance = {instance: componentRef,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                         this.__initializeCompInObject(dataField,index);
                         this.__objCustomComponent[dataField][index].groupRenderer = objItem;
                         this.__emitRendererComponentCreated(objItem);
                    }
                    else
                    {
                         const objItem:INSGridGroupRendererComponentInstance = {instance: null,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                         this.__initializeCompInObject(dataField,index);
                         this.__objCustomComponent[dataField][index].groupRenderer = objItem;
                         this.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,objItem: objItem});
                    }
                };
                const callbackSent: any = callback;
                const promise = this.__getComponent(rendererComponent,dataField,index,callbackSent,props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else
            {
                parResolve(null);
            }
        });
        return objPromise;
    };
    
    private __headerRenderer(rendererComponent: any,colItem: INSGridColumn,colIndex: number,props: any): Promise<any>
    {
        
        const objPromise = new Promise((parResolve,parReject) =>
        {
            if(colItem)
            {
                let objRef: any = null;
                const callback = (dynamicCompRef: GridComponentRef,componentRef: any,container: HTMLElement) =>
                {
                    if(componentRef)
                    {
                        componentRef.setData(colItem,colIndex);
                        const objItem: INSGridHeaderRendererComponentInstance = {instance: componentRef,componentRef: dynamicCompRef,index: index,colItem: colItem,colIndex: colIndex};
                        this.__initializeCompInObject(dataField,index);
                        this.__objCustomComponent[dataField][index].headerRenderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else
                    {
                        
                        const objItem: INSGridHeaderRendererComponentInstance = {instance: null,componentRef: dynamicCompRef,index: index,colItem: colItem,colIndex: colIndex};
                        this.__initializeCompInObject(dataField,index);
                        this.__objCustomComponent[dataField][index].headerRenderer = objItem;
                        this.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,objItem: objItem});
                    }                    
                };
                const callbackSent: any = callback;
                const dataField : string = colItem.dataField || '';
                const index : number = 0;
                const promise = this.__getComponent(rendererComponent,dataField,index,callbackSent,props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else
            {
                parResolve(null);
            }
        });
        return objPromise;
    };
    
    private __toolTipRenderer(rendererComponent: any,item: any,dataField: string,index: number,colIndex: number,row: any,props: any): Promise<any>
    {
        
        const objPromise = new Promise((parResolve,parReject) =>
        {
            if(item)
            {
                let objRef: any = null;
                const callback = (dynamicCompRef: GridComponentRef,componentRef: any,container: HTMLElement) =>
                {
                    if(componentRef)
                    {
                          componentRef.setData(item,dataField,index,colIndex,row);
                          const objItem: INSGridToolTipRendererComponentInstance = {instance: componentRef,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                          this.__initializeCompInObject(dataField,index);
                          this.__objCustomComponent[dataField][index].toolTipRenderer = objItem;
                          this.__emitRendererComponentCreated(objItem);
                    }
                    else
                    {
                          const objItem: INSGridToolTipRendererComponentInstance = {instance: null,componentRef: dynamicCompRef,item: item,index: index,colIndex: colIndex,columnName: dataField};
                          this.__initializeCompInObject(dataField,index);
                          this.__objCustomComponent[dataField][index].toolTipRenderer = objItem;
                          this.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,objItem: objItem});
                    }                    
                };
                const callbackSent: any = callback;
                const promise = this.__getComponent(rendererComponent,dataField,index,callbackSent,props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else
            {
                parResolve(null);
            }
        });
        return objPromise;
    };
    
    private __extraRowHeaderRenderer(rendererComponent: any,dataField: string,colItem: INSGridColumn,filteredDataSource: any[],index: number,colIndex: number,extraHeaderCell: any,extraHeaderRow: any, props: any): Promise<any>
    {
        
        const objPromise = new Promise((parResolve,parReject) =>
        {
            if(colItem)
            {
                let objRef: any = null;
                const callback = (dynamicCompRef: GridComponentRef,componentRef: any,container: HTMLElement) =>
                {
                    if(componentRef)
                    {
                          componentRef.setData(dataField,colItem,filteredDataSource,index,colIndex,extraHeaderCell,extraHeaderRow);
                          const objItem: INSGridExtraRowHeaderRendererComponentInstance = {instance: componentRef,componentRef: dynamicCompRef,colItem: colItem,index: index,colIndex: colIndex,columnName: dataField};
                          this.__initializeCompInObject(dataField,index);
                          this.__objCustomComponent[dataField][index].extraRowHeaderRenderer = objItem;
                          this.__emitRendererComponentCreated(objItem);
                    }
                    else
                    {
                          const objItem: INSGridExtraRowHeaderRendererComponentInstance = {instance: null,componentRef: dynamicCompRef,colItem: colItem,index: index,colIndex: colIndex,columnName: dataField};
                          this.__initializeCompInObject(dataField,index);
                          this.__objCustomComponent[dataField][index].extraRowHeaderRenderer = objItem;
                          this.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,objItem: objItem});
                    }
                };
                const callbackSent: any = callback;
                const promise: any = this.__getComponent(rendererComponent,dataField,index,callbackSent,props);
                promise.then((objParam: any) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else
            {
                parResolve(null);
            }
        });
        return objPromise;
    };
    
    private __getComponent(rendererComponent: any, dataField: string | null, index: number, paramCallback?: any, prop?: any): Promise<any>
    {
        return new Promise((parResolve, parReject) =>
        {
            if(dataField) {
                this.__initializeCompInObject(dataField, index);
            }
            const params = prop || {};
            const onInstanceCreated = (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => {
                paramCallback && paramCallback(null, instance, container);
                parResolve({ instance, container, portal });
            };
            const portal = this.createUpdatedPortal(rendererComponent, params, onInstanceCreated);
            this.setState((prevState: any) => {
                //console.log("Previous State:", prevState);
                this.hasPortalUpdated = true;
                return {
                    dynamicComponents: [...prevState.dynamicComponents, portal],
                };
            });
        });
    }

    private createUpdatedPortal(rendererComponent: any,prop: any | null,
        setInstance: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void
    ): React.ReactPortal {
        this.instanceCount += 1;
        const portal = NSReactDynamicComponent({
            component: rendererComponent,
            containerId: `ns-grid-react-container-${this.instanceCount}`,
            parentInstance: this,
            props: prop, 
            //getStyleForContainer: this.__getStyleForContainer,
            onInstanceCreated: setInstance
        });
    
        return portal;
    }    

    private __initializeCompInObject(dataField: string,index: number) {
        if(!this.__objCustomComponent[dataField])
        {
            this.__objCustomComponent[dataField] = [];
        }
        if(!this.__objCustomComponent[dataField][index])
        {
            this.__objCustomComponent[dataField][index] = {};
        }
    }

    private __processMasterDetailSetting(masterDetailSetting: INSGridMasterDetailSetting | undefined): INSGridMasterDetailSetting | undefined {
        if(masterDetailSetting) {
            if(masterDetailSetting.detailRenderer) {
                masterDetailSetting.detailRenderer = this.__customDetailComponent(masterDetailSetting.detailRenderer);
            }
        }
        return masterDetailSetting;
    }

    private __customDetailComponent(detailRenderer: INSGridDetailRendererComponent): new () => INSGridDetailRendererComponent {
        const parentIns = this;

        return class extends NSGridCustomDetailRenderer {
            constructor() {
                super(parentIns, detailRenderer);
            }
        };
    }    
    
    
    private __getStyleForContainer(): Record<string, string>
    {
        const style: Record<string, string> = {};
        const containerStyle = this.props?.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    
    private __addEvents()
    {
        for (const eventName of this.__arrEvents)
        {
            this.__nsUtil.addEvent(this.__container,eventName,((eventNameParam: string) => {
              return (event: any) => {
                this.__eventListener(event,eventNameParam);
              }
            })(eventName));
        }
    }
    
    private __eventListener(event: any,eventName: string)
    {
        const eventListenerName: string = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if(this.props[eventListenerName])
        {
            this.props[eventListenerName](event);
        }
    }
  
    private __emitRendererComponentCreated(objItem:any)
    {
        this.__eventListener(objItem,"rendererComponentCreated");
    };

    private __emitDetailComponentCreated(objItem:any)
    {
        this.__eventListener(objItem,"detailComponentCreated");
    };
}

class NSGridCustomDetailRenderer implements INSGridDetailRendererComponent {
    private objComponent: any = null;
    private componentRef: any = null;
    private containerRef!: HTMLElement;
    private parentIns: any;
    private detailRenderer: INSGridDetailRendererComponent;

    constructor(parentIns: any, detailRenderer: INSGridDetailRendererComponent) {
        this.parentIns = parentIns;
        this.detailRenderer = detailRenderer;
    }

    public init(param: INSGridDetailRendererComponentParam): Promise<any> {
        return new Promise((parResolve, parReject) => {
            const callback = (dynamicCompRef: GridComponentRef, localComponentRef: any, container: HTMLElement) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;

                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                    this.objComponent.init(param);

                    const objItem: INSGridDetailRendererComponentInstance = {
                        instance: this.objComponent,
                        componentRef: dynamicCompRef,
                        param: param
                    };

                    this.parentIns.__masterDetailRendererInstance[param.rowIndex] = objItem;
                    this.parentIns.__emitDetailComponentCreated(objItem);
                    parResolve(dynamicCompRef);
                } else {
                    const objItem: INSGridDetailRendererComponentInstance = {
                        instance: null,
                        componentRef: this.componentRef,
                        param: param
                    };

                    this.parentIns.__masterDetailRendererInstance[param.rowIndex] = objItem;
                    this.parentIns.updateCallbacksOnUpdate.push({
                        callback: callbackSent,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        objItem: objItem
                    });
                }
            };

            const callbackSent = callback.bind(this); // Ensure `this` refers to Renderer instance
            if (!this.parentIns.__masterDetailRendererInstance) {
                this.parentIns.__masterDetailRendererInstance = [];
            }

            this.parentIns.__getComponent(this.detailRenderer, null, -1, callbackSent, param);
        });
    }

    public getElement(): HTMLElement {
        return this.containerRef;
    }

    public elementAdded(params: INSGridDetailRendererComponentParam): void {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded(params);
        }
    }

    public renderEverytime(params: INSGridDetailRendererComponentParam): boolean {
        if (this.objComponent && this.objComponent.renderEverytime) {
            return this.objComponent.renderEverytime(params);
        }
        return true;
    }

    public destroy(): void {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }
};

class NSGridCustomEditor {
    private objComponent: any = null;
    private componentRef: any = null;
    private containerRef!: HTMLElement;
    private customEditorComponent: any;
    private objColumn: INSGridColumn;
    private parentIns: any;

    constructor(parentIns: any, customEditorComponent: any, objColumn: INSGridColumn) {
        this.customEditorComponent = customEditorComponent;
        this.objColumn = objColumn;
        this.parentIns = parentIns;
    }

    public init(setting: INSGridEditorCustomComponentSetting): Promise<any> {
        return new Promise((parResolve, parReject) => {
            const callback = (dynamicCompRef: GridComponentRef, localComponentRef: any, container: HTMLElement) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;

                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                    this.objComponent.init(setting);

                    const objItem: INSGridEditorCustomComponentInstance = {
                        instance: this.objComponent,
                        componentRef: dynamicCompRef,
                        setting: setting,
                        colItem: this.objColumn,
                        index: setting.rowIndex,
                        colIndex: setting.cellIndex,
                        columnName: this.objColumn.dataField
                    };

                    if (this.objColumn.dataField) {
                        this.parentIns.__initializeCompInObject(this.objColumn.dataField, setting.rowIndex);
                        this.parentIns.__objCustomComponent[this.objColumn.dataField][setting.rowIndex].editor = objItem;
                    }

                    this.parentIns.__emitRendererComponentCreated(objItem);
                    parResolve(dynamicCompRef);
                } else {
                    const objItem: INSGridEditorCustomComponentInstance = {
                        instance: null,
                        componentRef: this.componentRef,
                        setting: setting,
                        colItem: this.objColumn,
                        index: setting.rowIndex,
                        colIndex: setting.cellIndex,
                        columnName: this.objColumn.dataField
                    };

                    if (this.objColumn.dataField) {
                        this.parentIns.__initializeCompInObject(this.objColumn.dataField, setting.rowIndex);
                        this.parentIns.__objCustomComponent[this.objColumn.dataField][setting.rowIndex].editor = objItem;
                    }

                    this.parentIns.updateCallbacksOnUpdate.push({
                        callback: callbackSent,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        objItem: objItem
                    });
                }
            };

            const callbackSent = callback.bind(this);
            const index = setting.rowIndex;
            this.parentIns.__getComponent(this.customEditorComponent, this.objColumn?.dataField || '', index, callbackSent, setting);
        });
    }

    public getElement(): HTMLElement {
        return this.containerRef;
    }

    public elementAdded(): void {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded();
        }
    }

    public handleKeyDown(event: any, keyCode: any): void {
        if (this.objComponent && this.objComponent.handleKeyDown) {
            this.objComponent.handleKeyDown(event, keyCode);
        }
    }

    public getValue(): any {
        return this.objComponent.getValue();
    }

    public destroy(): void {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }

    public setFocus(): void {
        if (this.objComponent && this.objComponent.setFocus) {
            this.objComponent.setFocus();
        }
    }

    public hasFocus(): any {
        if (this?.objComponent && this.objComponent.hasFocus) {
            return this.objComponent.hasFocus();
        }
        return null;
    }

    public hasValueChanged(currentValue: any): any {
        if (this.objComponent && this.objComponent.hasValueChanged) {
            return this.objComponent.hasValueChanged(currentValue);
        }
        return null;
    }

    public validate(): any {
        if (this.objComponent && this.objComponent.validate) {
            return this.objComponent.validate();
        }
        return null;
    }

    public isPopUp(): boolean {
        if (this.objComponent && this.objComponent.isPopUp) {
            return this.objComponent.isPopUp();
        }
        return false;
    }

    public save(): void {
        if (this.objComponent && this.objComponent.save) {
            this.objComponent.save();
        }
    }

    public cancel(): void {
        if (this.objComponent && this.objComponent.cancel) {
            this.objComponent.cancel();
        }
    }

    public setPopUpWrapper(popUpWrapper: HTMLElement): void {
        if (this.objComponent && this.objComponent.setPopUpWrapper) {
            this.objComponent.setPopUpWrapper(popUpWrapper);
        }
    }
};