import React from 'react';
import '../../generated/css/nsHorizontalNavigation.min.css';
import { INSHorizontalNavigationMenu, INSHorizontalNavigationSetting } from "./interfaces";
export interface INSHorizontalNavigationReactSettings extends INSHorizontalNavigationSetting {
    setting?: INSHorizontalNavigationSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export interface INSHorizontalNavigationReactRef {
    selectMenu: (itemOrElement: any) => void;
    setDataSource: (source: INSHorizontalNavigationMenu[]) => void;
    setStyle: (styleProp: string, value: any) => void;
    setFocus: (isFocus: boolean) => void;
    hasFocus: () => boolean;
    setTheme: (theme: string) => void;
    getElement: () => HTMLElement | null;
}
export declare const NSHorizontalNavigationReact: React.ForwardRefExoticComponent<Omit<INSHorizontalNavigationReactSettings, "ref"> & React.RefAttributes<INSHorizontalNavigationReactRef>>;
