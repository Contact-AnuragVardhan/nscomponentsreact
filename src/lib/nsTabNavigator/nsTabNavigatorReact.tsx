import * as React from 'react';

import '../../generated/css/nsTabNavigator.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSTabNavigatorSetting } from "./interfaces";
import { ReactUtil } from '../util/reactUtil';
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompTabNavigator = require('./generated/js/nsTabNavigator.min.js');
const NSTabNavigator = nsCompTabNavigator.NSTabNavigator;

export interface INSTabNavigatorReactSetting extends INSTabNavigatorSetting {
    setting?: INSTabNavigatorSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSTabNavigatorReact extends NSBaseReactComponent<INSTabNavigatorReactSetting, any> 
{
    private __nsTabNavigator: any;
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSTabNavigatorReactSetting;
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSTabNavigatorReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__nsTabNavigator)
        {
            this.__arrEvents = [ NSTabNavigator.TAB_CHANGE_STARTING,
                                 NSTabNavigator.TAB_CHANGED,
                                 NSTabNavigator.TAB_CHANGE_END];
            this.__nsUtil = new NSUtil();
            if(!this.props)
            {
                this.props = {};
            }
            //const setting:INSTabNavigatorReactSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
            const arrIgnore: any[] = ["children"];
            const tempSetting:INSTabNavigatorReactSetting =  this.props.setting ? this.props.setting : this.props;
            const setting:INSTabNavigatorReactSetting = this.__nsUtil.cloneObject(tempSetting,true,arrIgnore);
            this.__setting = setting;
            this.__addEvents();
            this.__nsTabNavigator = new NSTabNavigator(this.__container,this.__setting);
            this.__addMethods();
        }
        this.__hasInitialized = true;
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
        this.processProps(nextProps);
        return false;
    }
    
    public processProps(nextProps: any) 
    {
        const objChanges: any = {};
        const arrPropKeys: string[] = Object.keys(nextProps);
        const arrSettingKeys: string[] = Object.keys(this.__setting);
        for (const propKey of arrPropKeys)
        {
            if(propKey === "setting")
            {
                const newSetting: INSTabNavigatorReactSetting =  nextProps.setting;
                for (const settingKey of arrSettingKeys)
                {
                    if(!this.__nsUtil.isObjectEqual(this.__setting[settingKey],newSetting[settingKey]))
                    {
                        objChanges[settingKey] = {oldValue: this.__setting[settingKey], newValue: newSetting[settingKey]};
                    }  
                }
            }
            else if(!this.__nsUtil.isObjectEqual(this.props[propKey],nextProps[propKey]))
            {
                objChanges[propKey] = {oldValue: this.props[propKey], newValue: nextProps[propKey]};
            }
        }
        /*const arrChangeKeys: string[] = Object.keys(objChanges);
        for (const changeKey of arrChangeKeys)
        {
        }*/
        
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
            children: this.props.children,
            ref: (e: HTMLElement) => {
                this.__container = e;
            }
        });
    }
    
    public getElement(): any
    {
        return this.__container;
    };

    public renderAddedComponents(): void 
    {
        if(this.__nsTabNavigator) {
            this.__nsTabNavigator.renderAddedComponents();
        }
    }

    private __addMethods(): void
    {
        ReactUtil.getMethods(this.__nsTabNavigator,null,this.__addMethod.bind(this));
    };
    
    private __addMethod(funcName: string): void
    {
        let self = this;
        let callback = function()
        {
            return ReactUtil.callMethod(self.__nsTabNavigator,funcName,arguments); 
        };
        ReactUtil.addMethod(this,funcName,callback);
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