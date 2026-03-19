import * as React from 'react';

import '../../generated/css/nsTextBox.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSTextBoxSetting } from "./interfaces";

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompTextBox = require('./generated/js/nsTextBox.min.js');
const NSTextBox = nsCompTextBox.NSTextBox;

export interface INSTextBoxReactSetting extends INSTextBoxSetting {
    setting?: INSTextBoxSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSTextBoxReact extends NSBaseReactComponent<INSTextBoxReactSetting, any> 
{
    public static readonly TYPE_AUTOTEXT = NSTextBox.TYPE_AUTOTEXT;
    public static readonly TYPE_AUTOCOMPLETE = NSTextBox.TYPE_AUTOCOMPLETE;
    public static readonly TYPE_EMAIL = NSTextBox.TYPE_EMAIL;
    public static readonly TYPE_NUMBER = NSTextBox.TYPE_NUMBER;
    public static readonly TYPE_PASSWORD = NSTextBox.TYPE_PASSWORD;
    public static readonly TYPE_URL = NSTextBox.TYPE_URL;
    public static readonly DROPDOWN_TYPE_LIST = NSTextBox.DROPDOWN_TYPE_LIST;
    public static readonly DROPDOWN_TYPE_GRID = NSTextBox.DROPDOWN_TYPE_GRID;
    public static readonly FILTER_TYPE_EXACT = "exact";
    public static readonly FILTER_TYPE_STARTS_WITH = "startsWith";
    public static readonly FILTER_TYPE_ENDS_WITH = "endsWith";
    public static readonly FILTER_TYPE_CONTAINS = "contains";
    
    private __nsTextBox: any;
    private __dataSource:any[];
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSTextBoxReactSetting;
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSTextBoxReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__nsTextBox)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSTextBox.ITEM_SELECTED,
                                 NSTextBox.ITEM_UNSELECTED];
            const setting:INSTextBoxReactSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__dataSource = this.props.dataSource || setting.dataSource;
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
        this.__nsTextBox = new NSTextBox(this.__container,this.__setting);
    };
    
    public dataSource(source?:any[]): any[]
    {
        return this.__nsTextBox.dataSource(source);
    };
    
    public getTextBox(): any
    {
        return this.__nsTextBox.getTextBox();
    };
    
    public setText(text : string): void
    {
        this.__nsTextBox.setText(text);
    };
    
    public getText(): string
    {
        return this.__nsTextBox.getText();
    };
    
    public setSelectedItems(arrItems: any[]): void
    {
        this.__nsTextBox.setSelectedItems(arrItems);
    };
    
    public setSelectedItem(item: any): void
    {
        this.__nsTextBox.setSelectedItem(item);
    };
    
    public setSelectedIndexes(arrSelectedIndex: number[]): void
    {
        this.__nsTextBox.setSelectedIndexes(arrSelectedIndex);
    };
    
    public setSelectedIndex(selectedIndex: number): void
    {
        this.__nsTextBox.setSelectedIndexes(selectedIndex);
    };
    
    public unSelectItems(arrItems: any[]): void
    {
        this.__nsTextBox.unSelectItems(arrItems);
    };
    
    public unSelectItem(item: any): void
    {
        this.__nsTextBox.unSelectItem(item);
    };
    
    public unSelectIndexes(arrSelectedIndex: number[]): void
    {
        this.__nsTextBox.unSelectIndexes(arrSelectedIndex);
    };
    
    public unSelectIndex(selectedIndex: number): void
    {
        this.__nsTextBox.unSelectIndex(selectedIndex);
    };
    
    public unSelectAll(fireEvent?: boolean): void
    {
        this.__nsTextBox.unSelectAll(fireEvent);
    };
    
    public getSelectedItem(): any
    {
        return this.__nsTextBox.getSelectedItem();
    };
    
    public getSelectedItems(): any[]
    {
        return this.__nsTextBox.getSelectedItems();
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