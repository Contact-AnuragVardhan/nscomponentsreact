import React from 'react';
import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsNavigation.min.css';
import { INSNavigationMenu, INSNavigationSetting } from "./interfaces";
export interface INSNavigationReactSettings extends INSNavigationSetting {
    setting?: INSNavigationSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export interface INSNavigationReactRef {
    isNavOpen: () => boolean;
    toggleNavigation: () => void;
    openNavigation: () => void;
    closeNavigation: () => void;
    getItemByField: (field: string, value: any, source?: null) => any;
    selectMenu: (itemOrElement: any) => void;
    setDataSource: (source: INSNavigationMenu[]) => void;
    setStyle: (styleProp: string, value: any) => void;
    setFocus: (isFocus: boolean) => void;
    hasFocus: () => boolean;
    setTheme: (theme: string) => void;
    getElement: () => HTMLElement | null;
}
export declare const NSNavigationReact: React.ForwardRefExoticComponent<Omit<INSNavigationReactSettings, "ref"> & React.RefAttributes<INSNavigationReactRef>>;
