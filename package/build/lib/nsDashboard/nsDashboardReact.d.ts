import * as React from 'react';
import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsDashboard.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
declare const NSPanel: any;
import { INSDashboardSetting } from "./interfaces";
export interface INSDashboardReactSettings extends INSDashboardSetting {
    setting?: INSDashboardSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export declare class NSDashboardReact extends NSBaseReactComponent<INSDashboardReactSettings, any> {
    props: INSDashboardReactSettings;
    state: any;
    private __objNSDashboard;
    private __container;
    private __objBodyContent;
    private __setting;
    private __nsUtil;
    private __arrEvents;
    private __arrCustomComponent;
    private __arrComponentInstance;
    private __hasInitialized;
    private __hasDestroyed;
    private portals;
    private hasPendingPortalUpdate;
    private updateCallbacksOnUpdate;
    constructor(props: INSDashboardReactSettings, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    getElement(): HTMLElement;
    getAllPanel(): ReturnType<typeof NSPanel>[];
    getPanel(item: any): ReturnType<typeof NSPanel>;
    getAllBodyComponentInstance(index: number): any[];
    getBodyComponentInstance(index: number): any;
    private batchUpdateCallback;
    private __createComponent;
    private __initPanel;
    private __customEditor;
    private __getComponent;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
    private __emitRendererComponentCreated;
}
export {};
