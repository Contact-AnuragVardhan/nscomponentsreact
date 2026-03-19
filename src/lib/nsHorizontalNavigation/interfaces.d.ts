export interface INSHorizontalNavigationClickFunction {
    (event:any,item:INSHorizontalNavigationMenu):boolean;
}

export interface INSHorizontalNavigationMenu {
    menuName: string;
    href ?: string;
    iconBeforeHtml ?: string;
    iconAfterHtml ?: string;
    onClick ?: INSHorizontalNavigationClickFunction;
    childMenus?: INSHorizontalNavigationMenu[];
    attributes?: Record<string, string>;
    [propName: string]: any;
}

export interface INSHorizontalNavigationCustomClassSetting {
    navContainer?: string,
    nonSubMenuItem?: string,
    subMenuItem?: string,
    subMenuCon?: string,
    mouseHover?: string
}

export interface INSHorizontalNavigationSetting {
    dataSource?: INSHorizontalNavigationMenu[],
    titleField?: string,
    childField?: string,
    enableOpenOnClick?: boolean,
    enableAnimation?: boolean,
    theme?: string,
    extraAttribute?: string,
    customClass?: INSHorizontalNavigationCustomClassSetting,
    [propName: string]: any;
}