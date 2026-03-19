import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import PropTypes from "prop-types";
import '../../generated/css/nsHorizontalNavigation.min.css';

import { INSHorizontalNavigationClickFunction, INSHorizontalNavigationMenu, INSHorizontalNavigationCustomClassSetting, INSHorizontalNavigationSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompHorizontalNavigation = require('./generated/js/nsHorizontalNavigation.min.js');
const NSHorizontalNavigation = nsCompHorizontalNavigation.NSHorizontalNavigation;
import { ReactUtil } from '../util/reactUtil';
import { NSHorizontalNavigationType } from '../..';
import { NavigateFunction, useNavigate } from 'react-router-dom';

export interface INSHorizontalNavigationReactSettings extends INSHorizontalNavigationSetting {
    setting?: INSHorizontalNavigationSetting;
    containerStyle? : any;
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

const NSHorizontalNavigationReactComponent: React.ForwardRefRenderFunction<INSHorizontalNavigationReactRef, INSHorizontalNavigationReactSettings> = (props, ref) => {
    let navigate: NavigateFunction | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        navigate = useNavigate();
    } catch (error) {
    }
    
    const nsNavigationRef = useRef<NSHorizontalNavigationType>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const nsUtilRef = useRef(new NSUtil());

    const dataSourceRef = useRef<INSHorizontalNavigationMenu[]>(props.dataSource || props.setting?.dataSource || []);
    const settingRef = useRef<any>(nsUtilRef.current.cloneObject(props.setting, true));
    const [hasInitialized, setHasInitialized] = useState(false);
    const [hasDataSource, setHasDataSource] = useState(false);

    const arrEvents: string[] = [
        NSHorizontalNavigation.NAVIGATION_MENU_SELECTED
    ];

    useEffect(() => {
        if(!navigate) {
            console.warn('NSHorizontalNavigationReact:: Navigation cannot be handled by NSHorizontalNavigationReact as the NSHorizontalNavigationReact is not a child of a Router. Either handle navigation programatically or place NSHorizontalNavigationReact as a child of Router.');
        }
        if (!nsNavigationRef.current) {
            settingRef.current.dataSource = dataSourceRef.current;
            nsNavigationRef.current = new NSHorizontalNavigation(containerRef.current, settingRef.current);
            addEvents();
            addMethods();
        }

        return () => {
            if (hasInitialized) {
                
            }
        };
    }, []);

    useImperativeHandle(ref, () => ({
        selectMenu: (itemOrElement: any) => nsNavigationRef.current?.selectMenu(itemOrElement),
        setDataSource: (source: INSHorizontalNavigationMenu[]) => {
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

    const manageDataSourceItem = (item: INSHorizontalNavigationMenu) => {
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

    const menuClickHandler = (event: any, item: INSHorizontalNavigationMenu) => {
        if (item) {
            let navigateAction = true;
            if (item.onClick) {
                navigateAction = item.onClick(event, item);
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

export const NSHorizontalNavigationReact = forwardRef(NSHorizontalNavigationReactComponent);
