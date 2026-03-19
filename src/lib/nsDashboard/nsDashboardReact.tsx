import * as React from 'react';
import {ReactPortal} from "react";

import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsDashboard.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';


const nsCompDashboard = require('./generated/js/nsDashboard.min.js');
const NSDashboard = nsCompDashboard.NSDashboard;
const NSPanel = nsCompDashboard.NSPanel;

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;

import {INSDashboardSetting,INSDashboardBodyComponent,INSDashboardPanelSetting} from "./interfaces";
       
import{ DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"


export interface INSDashboardReactSettings extends INSDashboardSetting {
    setting?: INSDashboardSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSDashboardReact extends NSBaseReactComponent<INSDashboardReactSettings, any> {
    private __objNSDashboard: any;
    private __container: any;
    private __objBodyContent: any;
    private __setting : any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __arrCustomComponent: any[] = [];
    private __arrComponentInstance: any[] = [];

    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;
    private portals: ReactPortal[] = [];
    private hasPendingPortalUpdate = false;
    private updateCallbacksOnUpdate: any[] = [];
    
    constructor(public props: INSDashboardReactSettings, public state: any) 
    {
        super(props, state);
        DynamicComponentService.addDefaultMethods(this,"NSDashboardReact",null,this.batchUpdateCallback.bind(this));
    }
    
    public componentDidMount() 
    {
        if(!this.__objNSDashboard)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSDashboard.PANEL_DRAG_START,
                                 NSDashboard.PANEL_DRAG_ENTER,
                                 NSDashboard.PANEL_DRAG_OVER,
                                 NSDashboard.PANEL_DRAG_LEAVE,
                                 NSDashboard.PANEL_DROP,
                                 NSDashboard.PANEL_DRAG_END];
            if(!this.props)
            {
                this.props = {};
            }
            const setting:INSDashboardReactSettings =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.__createComponent();
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
            if(this.__objNSDashboard)
            {
                this.__objNSDashboard.removeComponent();
                this.__objNSDashboard = null;
            }
            for (let comp of this.__arrCustomComponent)
            {
                if(comp && comp.componentRef)
                {
                    comp.componentRef.destroy();
                }
            } 
            this.__hasDestroyed = true;
        }
    }

    public render() 
    {
        return React.createElement<any>("div",{
            style: this.__getStyleForContainer(),
            className: this.props.className,
            ref: (e: HTMLElement) => {
                this.__container = e;
            }
        }, this.portals);
    }
    
    getElement(): HTMLElement
    {
        return this.__container;
    };
  
    getAllPanel(): ReturnType<typeof NSPanel>[]
    {
        if(this.__objNSDashboard)
        {
            return this.__objNSDashboard.getAllPanel();
        }
        return null;
    };
    
    getPanel(item: any): ReturnType<typeof NSPanel>
    {
        if(this.__objNSDashboard)
        {
            return this.__objNSDashboard.getPanel(item);
        }
        return null;
    };
    
    getAllBodyComponentInstance(index: number): any[]
    {
        return this.__arrComponentInstance;
    };
    
    getBodyComponentInstance(index: number): any
    {
        if(index > -1 && index < this.__arrComponentInstance.length)
        {
            return this.__arrComponentInstance[index];
        }
        return null;
    };
    
    private batchUpdateCallback()
    {
        if(this.updateCallbacksOnUpdate.length > 0)
        {
            for (let item of this.updateCallbacksOnUpdate)
            {
                if(item && item.dynamicCompRef && item.dynamicCompRef.getComponentInstance())
                {
                    item.callback(item.dynamicCompRef,item.dynamicCompRef.getComponentInstance(),item.container);
                }
            }
            this.updateCallbacksOnUpdate = [];
        }
    };
    
    private __createComponent(): void
    {
        if(this.__objNSDashboard)
        {
            this.__objNSDashboard = null;
        }
        if(this.__setting.arrPanelSetting)
        {
            let panelSetting: INSDashboardPanelSetting = null;
            let index: number = 0;
            for(panelSetting of this.__setting.arrPanelSetting)
            {
                this.__initPanel(panelSetting,index);
            }
        }
        this.__setting.container = this.getElement();
        this.__objNSDashboard = new NSDashboard(this.__setting); 
        this.__addEvents();
    };
    
    private __initPanel(setting: INSDashboardPanelSetting,index: number): void
    {
        if(setting.contentComponent)
        {
            let self: any = this;
            setting.contentComponent = this.__customEditor(setting.contentComponent,index,(instance: any) => {
                setting.bodyComponentInstance = instance;
                this.__arrComponentInstance[index] = instance;
            });
        }
    };
    
    private __customEditor(customEditorComponent: any,index: number,mainCallback: any): any
    {
        const self: any = this;
        const __editor: any = function(this: any)
        {
            let objComponent: any = null;
            let componentRef: any = null;
            
            this.init = function(data: any): Promise<any>
            {
                const objPromise = new Promise((parResolve,parReject) => {
                     const callback = (dynamicCompRef: DynamicComponentService,localComponentRef: any,container: HTMLElement) => {
                         componentRef = dynamicCompRef;
                         if(localComponentRef)
                         {
                            objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                            if(objComponent && objComponent.init)
                            {
                                mainCallback && mainCallback(objComponent);
                                objComponent.init(data);
                            }
                            let item: any = {instance: objComponent,componentRef: componentRef,component: customEditorComponent,data: data};
                            self.__arrCustomComponent[index] = item;
                            self.__emitRendererComponentCreated(item);
                            parResolve(dynamicCompRef);
                         }
                         else
                         {
                             self.updateCallbacksOnUpdate.push({callback: callbackSent,dynamicCompRef: dynamicCompRef,container: container,data: data});
                         }
                         
                     };
                     const callbackSent: any = callback.bind(self);
                     self.__getComponent(customEditorComponent,callbackSent,data);
                 });
                 return objPromise;
            };
            this.getElement = function(): HTMLElement
            {
                return componentRef.getElement();
            };
            this.elementAdded = function(): void
            {
                if(objComponent && objComponent.elementAdded)
                {
                    objComponent.elementAdded();
                }
            };
            this.fullScreenChanged = function(isFullScreen:boolean): void
            {
                if(objComponent && objComponent.fullScreenChanged)
                {
                    objComponent.fullScreenChanged(isFullScreen);
                }
            };
            this.destroy = function(): void
            {
                if(objComponent && objComponent.destroy)
                {
                    objComponent.destroy();
                }
            };
        };
        
        return __editor;
    };
    
    private __getComponent(rendererComponent: any,paramCallback?: null,prop?: null): Promise<any>
    {
        let self = this;
        var objPromise = new Promise(function(parResolve,parReject)
        {
            let params = {};
            if(prop)
            {
                params = prop;
            }
            const dynamicComponentService: DynamicComponentService = new DynamicComponentService(rendererComponent,self);
            let promise: any = dynamicComponentService.init(params,"nsMessageBox");
            promise.then(function () 
            {
                //dynamicComponentService.createComponent(callback,prop);
                const objComponent: any = dynamicComponentService.getComponentInstance();
                const container: any = dynamicComponentService.getElement();
                let callback: any = paramCallback;
                callback && callback(dynamicComponentService,objComponent,container);
                parResolve({ref: dynamicComponentService,instance: objComponent,container: container});
                //return dynamicComponentService; 
            });
        });
        return objPromise;
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
    
    private __emitRendererComponentCreated(objItem:any)
    {
        this.__eventListener(objItem,"rendererComponentCreated");
    };
    
}