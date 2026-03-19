import * as React from 'react';

import '../../generated/css/nsDatePicker.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSDatePickerSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompDatePicker = require('./generated/js/nsDatePicker.min.js');
const NSDatePicker = nsCompDatePicker.NSDatePicker;

export interface INSDatePickerReactSetting extends INSDatePickerSetting {
    setting?: INSDatePickerSetting;
    containerStyle? : any;
    value?: any;
    [propName: string]: any;
}

export class NSDatePickerReact extends NSBaseReactComponent<INSDatePickerReactSetting, any> 
{
    private __objNSDatePicker: any;
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSDatePickerReactSetting;
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSDatePickerReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__objNSDatePicker)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSDatePicker.CALENDAR_OPENED,
                                 NSDatePicker.CALENDAR_CLOSED,
                                 NSDatePicker.DATE_SELECTED,
                                 NSDatePicker.INPUT_CHANGE,
                               ];            
            const setting:INSDatePickerReactSetting = this.props.setting; //this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
        if(JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value)) {
            let valDate = nextProps.value;
            if(typeof valDate === 'string') {
                valDate = new Date(valDate)
            }
            this.setSelectedDate(valDate, null);
        }

        return false;
    }
    
    public componentWillUnmount() 
    {
        if(this.__hasInitialized)
        {
            this.__hasDestroyed = true;
        }
    }
    
    public render() 
    {
        return React.createElement<any>("div",{
            style: this.__getStyleForContainer(),
            ref: (e: HTMLElement) => {
                this.__container = e;
            }
        });
    }
    
    public getElement(): any
    {
        return this.__container;
    };
    
    public create(): void
    {
        this.__objNSDatePicker = new NSDatePicker(this.__container,this.__setting); 
    };
    
    getSelectedDate(): any
    {
        return this.__objNSDatePicker.getSelectedDate();
    };
    
    getSelectedDateAsString(format: string): any
    {
        return this.__objNSDatePicker.getSelectedDateAsString(format);
    };
    
    setSelectedDate(date: any,format: string): void
    {
        this.__objNSDatePicker.setSelectedDate(date,format);
    };
    
    setYear(year: number): void
    {
        this.__objNSDatePicker.setYear(year);
    };
    
    setMonth(month: number): void
    {
        this.__objNSDatePicker.setMonth(month);
    };
    
    reset(): void
    {
        this.__objNSDatePicker.reset();
    };
    
    setTodayDate(): void
    {
        this.__objNSDatePicker.setTodayDate();
    };
    
    showCalendar(isAbsolutePosition?: boolean): void
    {
        this.__objNSDatePicker.showCalendar(isAbsolutePosition);
    };
    
    closeCalendar(): void
    {
        this.__objNSDatePicker.closeCalendar();
    };
    
    getCalendar(): any
    {
        return this.__objNSDatePicker.getCalendar();
    };
    
    getTextBox(): any
    {
        return this.__objNSDatePicker.getTextBox();
    };
    
    getText(): any
    {
        if(this.__objNSDatePicker)
        {
            return this.__objNSDatePicker.getText();
        }
        return "";
    };
    
    toggleCalendarVisibility(): void
    {
        this.__objNSDatePicker.toggleCalendarVisibility();
    };
    
    setStyle(styleProp: string,value: any): void
    {
        this.__objNSDatePicker.setStyle(styleProp,value);
    };
    
    setFocus(isFocus: boolean): void
    {
        this.__objNSDatePicker.setFocus(isFocus);
    };
    
    hasFocus(): boolean
    {
        return this.__objNSDatePicker.hasFocus();
    };
    
    setTheme(theme: string): void
    {
        this.__objNSDatePicker.setTheme(theme);
    };
    
    changeProperty(propertyName: string,value: any): void
    {
        this.__objNSDatePicker.changeProperty(propertyName,value);
    };
    
    private __getStyleForContainer() 
    {
        const style: any = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    
    private __addEvents()
    {
        const self = this;
        for (const eventName of this.__arrEvents)
        {
            this.__nsUtil.addEvent(this.__container,eventName,(function(eventNameParam: string){
              return function(event: any) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                self.__eventListener.bind(self)(event,eventNameParam);
              }
            })(eventName));
        }
    }
    
    private __eventListener(event: any,eventName: string)
    {
        const eventListenerName: string = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if(this.props[eventListenerName])
        {
            this.props[eventListenerName](event);
        }
    }
    
}