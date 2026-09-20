import * as React from 'react';
import '../../generated/css/nsDatePicker.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSDatePickerSetting } from "./interfaces";
export interface INSDatePickerReactSetting extends INSDatePickerSetting {
    setting?: INSDatePickerSetting;
    containerStyle?: any;
    value?: any;
    [propName: string]: any;
}
export declare class NSDatePickerReact extends NSBaseReactComponent<INSDatePickerReactSetting, any> {
    props: INSDatePickerReactSetting;
    state: any;
    private __objNSDatePicker;
    private __container;
    private __nsUtil;
    private __arrEvents;
    private __setting;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSDatePickerReactSetting, state: any);
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    getElement(): any;
    create(): void;
    getSelectedDate(): any;
    getSelectedDateAsString(format: string): any;
    setSelectedDate(date: any, format: string): void;
    setYear(year: number): void;
    setMonth(month: number): void;
    reset(): void;
    setTodayDate(): void;
    showCalendar(): void;
    closeCalendar(): void;
    getCalendar(): any;
    getTextBox(): any;
    getText(): any;
    toggleCalendarVisibility(): void;
    setStyle(styleProp: string, value: any): void;
    setFocus(isFocus: boolean): void;
    hasFocus(): boolean;
    setTheme(theme: string): void;
    changeProperty(propertyName: string, value: any): void;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
