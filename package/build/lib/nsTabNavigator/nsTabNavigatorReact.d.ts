import * as React from 'react';
import '../../generated/css/nsTabNavigator.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSTabNavigatorSetting } from "./interfaces";
export interface INSTabNavigatorReactSetting extends INSTabNavigatorSetting {
    setting?: INSTabNavigatorSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export declare class NSTabNavigatorReact extends NSBaseReactComponent<INSTabNavigatorReactSetting, any> {
    props: INSTabNavigatorReactSetting;
    state: any;
    private __nsTabNavigator;
    private __container;
    private __nsUtil;
    private __arrEvents;
    private __setting;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSTabNavigatorReactSetting, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    processProps(nextProps: any): void;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    getElement(): any;
    renderAddedComponents(): void;
    private __addMethods;
    private __addMethod;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
