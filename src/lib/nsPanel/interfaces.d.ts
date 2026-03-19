////////// Interfaces /////////////////////////////////////////////////////////

export interface INSPanelMinimizeAddRemoveElementFunction {
    (component: any,parentComponent: any,isMinimized: boolean):void;
}

export interface INSPanelContentComponent{
    // gets called once after the component is created
   init?(data: any): Promise<any> | void;
   // Return the DOM element of editor which gets added in DOM
   getElement(): HTMLElement;
   //fired when element is added in DOM
   elementAdded?(): void;
   // gets called when editor is being destroyed.Used to do editor cleanup
   destroy?(): void;
}

export interface INSPanelCustomClass {
    container?: string;
    titleBar?: string;
    iconContainer?: string;
    icon?: string;
    body?: string;
    [propName: string]: any;
}

export interface INSPanelToolBarDetailsObject {
    iconHTML?: string;
    title?: string;
}

export interface INSPanelToolBarDetails {
    minimize?: INSPanelToolBarDetailsObject;
    maximize?: INSPanelToolBarDetailsObject;
    expand?: INSPanelToolBarDetailsObject;
    collapse?: INSPanelToolBarDetailsObject;
    fullScreen?: INSPanelToolBarDetailsObject;
    restore?: INSPanelToolBarDetailsObject;
    close?: INSPanelToolBarDetailsObject;
}

export interface INSPanelDivSetting {
    top?: string;
    left?: string;
    width?: string;
    height?: string;
}

export interface INSPanelSetting {
    context?: any;
    parent?: any;
    title?: string;
    titleHtml?: string;
    content?: any;
    contentComponent?: any;
    contentComponentData?: any;
    template?: string;
    templateUrl?: string;
    minWidth?: number;
    minHeight?: number;
    enablePopUp?: boolean;
    enableModal?: boolean;
    enableCollapse?: boolean;
    enableMinimization?: boolean;
    enableFullScreen?: boolean;
    enableDrag?: boolean;
    enableResize?: boolean;
    enableTitleDblClick?: boolean;
    enableMoveOnClick?: boolean;
    enableModalAnimation?: boolean;
    enableModalCloseOnOutsideClick?: boolean;
    enableModalCloseOnEscape?: boolean;
    enableCloseIconVisibility?: boolean;
    minimizedDirection?: string;
    theme?: string;
    minimizeAddRemoveElementCallback?: INSPanelMinimizeAddRemoveElementFunction,
    customClass?: INSPanelCustomClass;
    toolBarDetails?: INSPanelToolBarDetails;
    panelSetting?: INSPanelDivSetting;
    [propName: string]: any;
}