import * as React from 'react';
import '../../generated/css/nsDatePicker.min.css';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSCalendarSetting } from "./interfaces";
export interface INSCalendarReactSetting extends INSCalendarSetting {
    setting?: INSCalendarSetting;
    containerStyle?: any;
    [propName: string]: any;
}
export declare class NSCalendarReact extends NSBaseReactComponent<INSCalendarReactSetting, any> {
    props: INSCalendarReactSetting;
    state: any;
    private __objNSCalendar;
    private __container;
    private __nsUtil;
    private __arrEvents;
    private __setting;
    private __hasInitialized;
    private __hasDestroyed;
    constructor(props: INSCalendarReactSetting, state: any);
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
    setStyle(styleProp: string, value: any): void;
    setFocus(isFocus: boolean): void;
    hasFocus(): boolean;
    setTheme(theme: string): void;
    changeProperty(propertyName: string, value: any): void;
    private __getStyleForContainer;
    private __addEvents;
    private __eventListener;
}
