import * as React from 'react';

import '../../generated/css/nsDatePicker.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSCalendarSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompDatePicker = require('./generated/js/nsDatePicker.min.js');
const NSCalendar = nsCompDatePicker.NSCalendar;

export interface INSCalendarReactSetting extends INSCalendarSetting {
    setting?: INSCalendarSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSCalendarReact extends NSBaseReactComponent<INSCalendarReactSetting, any> 
{
    private __objNSCalendar: any;
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSCalendarReactSetting;
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSCalendarReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__objNSCalendar)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSCalendar.DATE_SELECTED
                               ];            
            const setting:INSCalendarReactSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
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
        this.__objNSCalendar = new NSCalendar(this.__container,this.__setting); 
    };
    
    getSelectedDate(): any
    {
        return this.__objNSCalendar.getSelectedDate();
    };
    
    getSelectedDateAsString(format: string): any
    {
        return this.__objNSCalendar.getSelectedDateAsString(format);
    };
    
    setSelectedDate(date: any,format: string): void
    {
        this.__objNSCalendar.setSelectedDate(date,format);
    };
    
    setYear(year: number): void
    {
        this.__objNSCalendar.setYear(year);
    };
    
    setMonth(month: number): void
    {
        this.__objNSCalendar.setMonth(month);
    };
    
    reset(): void
    {
        this.__objNSCalendar.reset();
    };
    
    setTodayDate(): void
    {
        this.__objNSCalendar.setTodayDate();
    };
    
    setStyle(styleProp: string,value: any): void
    {
        this.__objNSCalendar.setStyle(styleProp,value);
    };
    
    setFocus(isFocus: boolean): void
    {
        this.__objNSCalendar.setFocus(isFocus);
    };
    
    hasFocus(): boolean
    {
        return this.__objNSCalendar.hasFocus();
    };
    
    setTheme(theme: string): void
    {
        this.__objNSCalendar.setTheme(theme);
    };
    
    changeProperty(propertyName: string,value: any): void
    {
        this.__objNSCalendar.changeProperty(propertyName,value);
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
                console.log(event);
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