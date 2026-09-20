import * as React from 'react';
import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsMessageBox.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSPanelSetting } from "./interfaces";
export interface INSPanelReactSettings extends INSPanelSetting {
    setting?: INSPanelSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export declare class NSPanelReact extends NSBaseReactComponent<INSPanelReactSettings, any> {
    props: INSPanelReactSettings;
    state: any;
    private __objNSPanel;
    private __container;
    private __setting;
    private __nsUtil;
    private __arrEvents;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSPanelReactSettings, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    open(): void;
    close(): void;
    removeModal(): void;
    getBaseElement(): any;
    getElement(): HTMLElement;
    minimize(): void;
    maximize(): void;
    collapse(): void;
    expand(): void;
    fullScreen(): void;
    restore(): void;
    disableResize(): void;
    disableDrag(): void;
    disableCollapse(): void;
    disableMinMax(): void;
    disableFullScreen(): void;
    isCollapsed(): boolean;
    isMinimized(): boolean;
    isFullScreen(): boolean;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
