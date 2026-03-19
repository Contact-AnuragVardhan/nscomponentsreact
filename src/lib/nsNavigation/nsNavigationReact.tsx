import React, { useRef, useEffect, useImperativeHandle, forwardRef, useContext, useState } from 'react';

import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsNavigation.min.css';

import { INSNavigationClickFunction, INSNavigationMenu, INSNavigationCustomClassSetting, INSNavigationSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompNavigation = require('./generated/js/nsNavigation.min.js');
const NSNavigation = nsCompNavigation.NSNavigation;
import { ReactUtil } from '../util/reactUtil';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { NSNavigationType } from '../..';

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

const NSNavigationReactComponent: React.ForwardRefRenderFunction<INSNavigationReactRef, INSNavigationReactSettings> = (props, ref) => {
    let navigate: NavigateFunction | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        navigate = useNavigate();
    } catch (error) {
    }

    const nsNavigationRef = useRef<NSNavigationType>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const nsUtilRef = useRef(new NSUtil());
    
    const dataSourceRef = useRef<INSNavigationMenu[]>(props.dataSource || props.setting?.dataSource || []);
    const settingRef = useRef<any>(nsUtilRef.current.cloneObject(props.setting, true));
    const [hasInitialized, setHasInitialized] = useState(false);
    const [hasDataSource, setHasDataSource] = useState(false);

    const arrEvents: string[] = [
        NSNavigation.NAVIGATION_OPEN_START,
        NSNavigation.NAVIGATION_OPEN_END,
        NSNavigation.NAVIGATION_CLOSE_START,
        NSNavigation.NAVIGATION_CLOSE_END,
        NSNavigation.NAVIGATION_MENU_SELECTED,
        NSNavigation.NAVIGATION_MENU_DESELECTED
    ];

    useEffect(() => {
        if(!navigate) {
            console.warn('NSComponentReact:: Navigation cannot be handled by NSComponentReact as the NSComponentReact is not a child of a Router. Either handle navigation programatically or place NSNavigationReact as a child of Router.');
        }
        if (!nsNavigationRef.current) {
            settingRef.current.dataSource = dataSourceRef.current;
            nsNavigationRef.current = new NSNavigation(containerRef.current, settingRef.current);
            addEvents();
            addMethods();
        }

        return () => {
            if (hasInitialized) {
                
            }
        };
    }, []);

    useImperativeHandle(ref, () => ({
        isNavOpen: () => (nsNavigationRef.current ? nsNavigationRef.current.isNavOpen() : false),
        toggleNavigation: () => nsNavigationRef.current?.toggleNavigation(),
        openNavigation: () => nsNavigationRef.current?.openNavigation(),
        closeNavigation: () => nsNavigationRef.current?.closeNavigation(),
        getItemByField: (field: string, value: any, source?: null) => nsNavigationRef.current?.getItemByField(field, value, source),
        selectMenu: (itemOrElement: any) => nsNavigationRef.current?.selectMenu(itemOrElement),
        setDataSource: (source: INSNavigationMenu[]) => {
            dataSourceRef.current = source;
            setHasDataSource(source.length > 0);
            nsNavigationRef.current?.dataSource(source);
            manageDataSource();
        },
        setStyle: (styleProp: string, value: any) => nsNavigationRef.current?.setStyle(styleProp, value),
        setFocus: (isFocus: boolean) => nsNavigationRef.current?.setFocus(isFocus),
        hasFocus: () => (nsNavigationRef.current ? nsNavigationRef.current.hasFocus() : false),
        setTheme: (theme: string) => nsNavigationRef.current?.setTheme(theme),
        getElement: () => containerRef.current
    }));

    const addMethods = () => {
        ReactUtil.getMethods(nsNavigationRef.current, null, addMethod);
    };

    const addMethod = (funcName: string) => {
        const callback = function () {
            return ReactUtil.callMethod(nsNavigationRef.current, funcName, arguments);
        };
        ReactUtil.addMethod(nsNavigationRef.current, funcName, callback);
    };

    const manageDataSource = () => {
        if (dataSourceRef.current && dataSourceRef.current.length > 0) {
            for (const source of dataSourceRef.current) {
                manageDataSourceItem(source);
            }
        }
    };

    const manageDataSourceItem = (item: INSNavigationMenu) => {
        if (item) {
            if (item.childMenus && item.childMenus.length > 0) {
                for (const childMenu of item.childMenus) {
                    manageDataSourceItem(childMenu);
                }
            } else {
                item.click = menuClickHandler;
            }
        }
    };

    const menuClickHandler = (event: any, item: INSNavigationMenu, li: any) => {
        if (item) {
            let navigateAction = true;
            if (item.onClick) {
                navigateAction = item.onClick(event, item, li);
            }
            if (navigate && navigateAction && (item.href || item.link)) {
                let newRoute = item.href || item.link;
                newRoute = (newRoute && newRoute.startsWith('/')) ? newRoute : ('/' + newRoute);
                if (newRoute !== window.location.pathname) {
                    navigate(newRoute);
                } else {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }
            else {
                console.log('Navigation is not available');
            }
        }
    };

    const addEvents = () => {
        for (const eventName of arrEvents) {
            nsUtilRef.current.addEvent(containerRef.current, eventName, (event: any) => {
                eventListener(event, eventName);
            });
        }
    };

    const eventListener = (event: any, eventName: string) => {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (props[eventListenerName]) {
            props[eventListenerName](event);
        }
    };

    const getStyleForContainer = () => {
        const style: any = {};
        const containerStyle = props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    };

    return (
        <div style={getStyleForContainer()} ref={containerRef}></div>
    );
};

export const NSNavigationReact = forwardRef(NSNavigationReactComponent);