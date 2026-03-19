import * as React from 'react';

import '../../generated/css/nsMultiSelectDropdown.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSMultiSelectDropdownSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompMultiSelectDropdown = require('./generated/js/nsMultiSelectDropdown.min.js');
const NSMultiSelectDropdown = nsCompMultiSelectDropdown.NSMultiSelectDropdown;

export interface INSMultiSelectDropdownReactSetting extends INSMultiSelectDropdownSetting {
    setting?: INSMultiSelectDropdownSetting;
    containerStyle? : any;
    dataSource?: any[];
    value?: any;
    [propName: string]: any;
}

export class NSMultiselectDropdownReact extends NSBaseReactComponent<INSMultiSelectDropdownReactSetting, any> 
{
    public static readonly LABEL_TYPE_OF_TEXT = NSMultiSelectDropdown.LABEL_TYPE_OF_TEXT;
    public static readonly LABEL_TYPE_HORIZONTAL_LIST = NSMultiSelectDropdown.LABEL_TYPE_HORIZONTAL_LIST;
    public static readonly LABEL_TYPE_VERTICAL_LIST = NSMultiSelectDropdown.LABEL_TYPE_VERTICAL_LIST;
    
    private __objNSMultiSelectDropdown: any;
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSMultiSelectDropdownReactSetting;
    private __source: any[];
    private __arrItems: any[];
    private __arrValues: any[];
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSMultiSelectDropdownReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__objNSMultiSelectDropdown)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSMultiSelectDropdown.DROPDOWN_OPEN,
                                 NSMultiSelectDropdown.DROPDOWN_CLOSE,
                                 NSMultiSelectDropdown.DROPDOWN_ITEM_CLICK,
                               ];            
            const setting:INSMultiSelectDropdownReactSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            if((!this.__source || this.__source.length === 0) && (this.props.dataSource && this.props.dataSource.length > 0)) {
                this.__source = [...this.props.dataSource];
            }
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
        /*for (const propName in nextProps) {
            if (JSON.stringify(nextProps[propName]) !== JSON.stringify(this.props[propName])) {
              console.log(`Prop '${propName}' changed from ${this.props[propName]} to ${nextProps[propName]}`);
            }
        }*/
        if (this.__objNSMultiSelectDropdown) {
            if(JSON.stringify(nextProps.dataSource) !== JSON.stringify(this.props.dataSource)) {
                this.dataSource(nextProps.dataSource);
            }
            if(JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value) || (nextProps.value?.length > 0 && this.getSelectedItems()?.length === 0)) {
                const selectedItems = this.getSelectedItems();
                if(selectedItems && selectedItems.length > 0 && JSON.stringify(selectedItems) !== JSON.stringify(nextProps.value)) {
                    this.setSelectUnselectItems(selectedItems, false);
                }
                this.setSelectUnselectItems(nextProps.value, true);
            }
            
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

    public componentDidUpdate(prevProps) {
        if (this.props.someValue !== prevProps.someValue) {
          console.log('someValue has changed!');
          // Perform any actions needed in response to the prop change.
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
        if(!this.__objNSMultiSelectDropdown && this.__setting)
        {
            if(this.__source && this.__source.length > 0)
            {
                this.__setting["dataSource"] = this.__source; 
            }
            this.__objNSMultiSelectDropdown = new NSMultiSelectDropdown(this.__container,this.__setting);
            if(this.__arrItems != null && this.__arrItems.length > 0)
            {
                for (let item of this.__arrItems) 
                {
                    this.setSelectUnselectItems(item.items,item.isSelected);
                }
                this.__arrItems = null;
            }
            if(this.__arrValues != null && this.__arrValues.length > 0)
            {
                for (let item of this.__arrValues) 
                {
                    this.setSelectUnselectItemsByValue(item.values,item.isSelected);
                }
                this.__arrValues = null;
            }
        }
    };
    
    dataSource(source: any[]): void
    {
        this.__source = source;
        this.create();
        if(this.__objNSMultiSelectDropdown)
        {
            this.__objNSMultiSelectDropdown.dataSource(source);
            if(this.props.value && this.props.value.length > 0) {
                this.__objNSMultiSelectDropdown.setSelectUnselectItems(this.props.value, true);
            }
        }
    };
    
    getSelectedIndexes(): number[]
    {
        return this.__objNSMultiSelectDropdown.getSelectedIndexes();
    };
    
    getSelectedItems(): any[]
    {
        return this.__objNSMultiSelectDropdown.getSelectedItems();
    };

    setSelectUnselectItemsByValue(arrValue: string | number,isSelected: boolean): void
    {
        if(this.__objNSMultiSelectDropdown)
        {
            this.__objNSMultiSelectDropdown.setSelectUnselectItemsByValue(arrValue,isSelected);
        }
        else
        {
            if(!this.__arrValues)
            {
                this.__arrValues = [];
            }
            this.__arrValues.push({values:arrValue,isSelected:isSelected});
        }
    };
    
    setSelectUnselectItems(arrItems: any,isSelected: boolean): void
    {
        if(this.__objNSMultiSelectDropdown)
        {
            this.__objNSMultiSelectDropdown.setSelectUnselectItems(arrItems,isSelected);
        }
        else
        {
            if(!this.__arrItems)
            {
                this.__arrItems = [];
            }
            this.__arrItems.push({items:arrItems,isSelected:isSelected});
        }
    };
    
    setStyle(styleProp: string,value: any): void
    {
        this.__objNSMultiSelectDropdown.setStyle(styleProp,value);
    };
    
    setFocus(isFocus: boolean): void
    {
        this.__objNSMultiSelectDropdown.setFocus(isFocus);
    };
    
    hasFocus(): boolean
    {
        return this.__objNSMultiSelectDropdown.hasFocus();
    };
    
    setTheme(theme: string): void
    {
        this.__objNSMultiSelectDropdown.setTheme(theme);
    };
    
    changeProperty(propertyName: string,value: any): void
    {
        this.__objNSMultiSelectDropdown.changeProperty(propertyName,value);
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