import * as React from 'react';
import '../../generated/css/nsMultiSelectDropdown.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSMultiSelectDropdownSetting } from "./interfaces";
export interface INSMultiSelectDropdownReactSetting extends INSMultiSelectDropdownSetting {
    setting?: INSMultiSelectDropdownSetting;
    containerStyle?: any;
    dataSource?: any[];
    value?: any;
    [propName: string]: any;
}
export declare class NSMultiselectDropdownReact extends NSBaseReactComponent<INSMultiSelectDropdownReactSetting, any> {
    props: INSMultiSelectDropdownReactSetting;
    state: any;
    static readonly LABEL_TYPE_OF_TEXT: any;
    static readonly LABEL_TYPE_HORIZONTAL_LIST: any;
    static readonly LABEL_TYPE_VERTICAL_LIST: any;
    private __objNSMultiSelectDropdown;
    private __container;
    private __nsUtil;
    private __arrEvents;
    private __setting;
    private __source;
    private __arrItems;
    private __arrValues;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSMultiSelectDropdownReactSetting, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: any): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    getElement(): any;
    create(): void;
    dataSource(source: any[]): void;
    getSelectedIndexes(): number[];
    getSelectedItems(): any[];
    setSelectUnselectItemsByValue(arrValue: string | number, isSelected: boolean): void;
    setSelectUnselectItems(arrItems: any, isSelected: boolean): void;
    setStyle(styleProp: string, value: any): void;
    setFocus(isFocus: boolean): void;
    hasFocus(): boolean;
    setTheme(theme: string): void;
    changeProperty(propertyName: string, value: any): void;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
