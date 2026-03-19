export interface INSNavigationClickFunction {
    (event:any,item:INSNavigationMenu,li:any):boolean;
}

export interface INSNavigationMenu {
    menuName: string;
    href ?: string;
    iconBeforeHtml ?: string;
    iconAfterHtml ?: string;
    onClick ?: INSNavigationClickFunction;
    childMenus?: INSNavigationMenu[];
    attributes?: Record<string, string>;
    [propName: string]: any;
}

export interface INSNavigationCustomClassSetting {
    navContainer?: string,
    menuContainer?: string,
    headerMenu?: string,
    menu?: string,
    selectedParentMenu?: string,
    selectedMenu?: string
}

export interface INSNavigationSetting {
    containerElement?: any,
    elementsBeforeMenu?: any,
    pageHeaderContainer?: any,
    pageContentContainer?: any,
    header?: any,
    showCollapseIcon?: boolean,
    iconCollapse?: any,
    dataSource?: INSNavigationMenu[],
    titleField?: string,
    childField?: string,
    iconPosition?: string,
    iconMenuExpanded?: string,
    iconMenuCollapsed?: string,
    context?: any,
    collapseLeftOffset?: number,
    collapseTopOffset?: number,
    isPositionAbsolute?: boolean,
    extraAttribute?: string,
    customClass?: INSNavigationCustomClassSetting,
    [propName: string]: any;
}