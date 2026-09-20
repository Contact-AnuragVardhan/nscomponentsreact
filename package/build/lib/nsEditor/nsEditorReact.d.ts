import * as React from 'react';
import '../../generated/css/nsEditor.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSEditorSetting } from "./interfaces";
declare const NSEditor: any;
export interface INSEditorReactSetting extends INSEditorSetting {
    setting?: INSEditorSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export declare class NSEditorReact extends NSBaseReactComponent<INSEditorReactSetting, any> {
    props: INSEditorReactSetting;
    state: any;
    private __objEditor;
    private __container;
    private __nsUtil;
    private __arrEvents;
    private __setting;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSEditorReactSetting, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    getElement(): any;
    create(): void;
    toggleLineNumber(): void;
    setDisabled(isDisabled: boolean): void;
    getDisabled(): boolean;
    setText(text: string): void;
    getText(): string;
    setHtml(html: string): void;
    getHtml(): string;
    setStyle(styleProp: string, value: any): void;
    setFocus(isFocus: boolean): void;
    hasFocus(): boolean;
    setTheme(theme: string): void;
    changeProperty(propertyName: string, value: any): void;
    getNSEditor(): ReturnType<typeof NSEditor>;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
export {};
