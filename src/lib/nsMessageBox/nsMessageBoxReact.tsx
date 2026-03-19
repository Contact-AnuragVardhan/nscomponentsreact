import * as React from 'react';
import {ReactPortal} from "react";

import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsMessageBox.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompMessageBox = require('./generated/js/nsMessageBox.min.js');
const NSMessageBox = nsCompMessageBox.NSMessageBox;
const NSPanel = nsCompMessageBox.NSPanel;

import {INSMessageBoxCallbackFunction, INSMessageBoxSetting, INSMessageBoxAlertSetting, INSMessageBoxConfirmSetting,
        INSMessageBoxCustomSetting,
        MessageBoxComponentRef
       } from "./interfaces";
import { NSReactDynamicComponent } from '../dynamicComponentService/nsReactDynamicComponent';
       
//import{ DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"


export interface INSMessageBoxReactSettings extends INSMessageBoxSetting {
    setting?: INSMessageBoxSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSMessageBoxReact extends NSBaseReactComponent<INSMessageBoxReactSettings, any> {
    
    private __objNSMessageBox: any;
    private __objNSPanel: any;
    private __container: any;
    private __objBodyContent: any;
    private __setting : any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __objCustomComponent: any;
    private __bodyComponentInstance: any;

    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    private instanceCount = 0;
    private hasPortalUpdated: boolean = false;
    
    constructor(public props: INSMessageBoxReactSettings, public state: any) 
    {
        super(props, state);
        this.state = {
            dynamicComponents: [],
        };
        //DynamicComponentService.addDefaultMethods(this,"NSMessageBoxReact",null,this.batchUpdateCallback.bind(this));
    }
    
    public componentDidMount() 
    {
        if(!this.__objNSPanel)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSPanel.DRAG_STARTING,
                                NSPanel.DRAGGING,
                                NSPanel.DRAG_END,
                                NSPanel.RESIZE_STARTING,
                                NSPanel.RESIZING,
                                NSPanel.RESIZE_END,
                                NSPanel.COLLAPSE_STARTING,
                                NSPanel.COLLAPSE_END,
                                NSPanel.EXPANSION_STARTING,
                                NSPanel.EXPANSION_END,
                                NSPanel.MINIMIZE_STARTING,
                                NSPanel.MINIMIZE_END,
                                NSPanel.MAXIMIZE_STARTING,
                                NSPanel.MAXIMIZE_END,
                                NSPanel.FULLSCREEN_STARTING,
                                NSPanel.FULLSCREEN_END,
                                NSPanel.RESTORE_STARTING,
                                NSPanel.RESTORE_END,
                                NSPanel.CLOSED];
            if(!this.props)
            {
                this.props = {};
            }
            const setting:INSMessageBoxReactSettings =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            /*if(this.__container)
            {
               this.__objBodyContent = this.__container;
            }
            this.__createComponent();*/
        }
        this.__hasInitialized = true;
        this.__hasDestroyed = false;
    }
    
    public shouldComponentUpdate(nextProps: any, nextState: any) 
    {
        if(this.hasPortalUpdated) {
            setTimeout(() => {
                this.hasPortalUpdated = false;
            }, 0);
            
            return true;
        }
        return false;
    }
    
    public componentWillUnmount() 
    {
        if(this.__hasInitialized)
        {
            if(this.__objNSPanel)
            {
                this.__objNSPanel.removeComponent();
                this.__objNSPanel = null;
            }
            /*if(this.__objCustomComponent) {
                const dynamicCompRef: MessageBoxComponentRef = this.__objCustomComponent.componentRef;
                if(dynamicCompRef) {
                    if(typeof dynamicCompRef === 'function'){
                        setTimeout(() => {
                            dynamicCompRef();
                        }, 0); 
                    }
                }
            }*/
            const arrCon : NodeListOf<Element> = document.querySelectorAll(".nsPanelModal");
            if(arrCon && arrCon.length)
            {
                for (const div of arrCon as any)
                {
                    if(div.parentElement)
                    {
                        div.parentElement.removeChild(div);
                    }
                } 
            }
            this.__arrEvents.forEach(eventName => {
                this.__nsUtil.removeEvent(this.__container, eventName);
            });
            this.__hasDestroyed = true;
        }
    }

    public render() 
    {
        return (
            <div style={this.__getStyleForContainer()} ref={(e: HTMLDivElement) => { this.__container = e; }}>
                {this.__objNSPanel && this.state.dynamicComponents?.map((portal: React.ReactPortal, index: number) => (
                    <React.Fragment key={index}>{portal}</React.Fragment>
                ))}
            </div>
        );
    }

    getElement(): HTMLElement
    {
        return this.__container;
    };
  
    minimize(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.minimize();
        }
    };
    
    maximize(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.maximize();
        }
    };
    
    collapse(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.collapse();
        }
    };
    
    expand(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.expand();
        }
    };
    
    fullScreen(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.fullScreen();
        }
    };
    
    restore(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.restore();
        }
    };
    
    disableResize(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableResize();
        }
    };
    
    disableDrag(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableDrag();
        }
    };
    
    disableCollapse(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableCollapse();
        }
    };
    
    disableMinMax(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableMinMax();
        }
    };
    
    disableFullScreen(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableFullScreen();
        }
    };
    
    isCollapsed(): boolean
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.isCollapsed();
        }
        return false;
    };
    
    isMinimized(): boolean
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.isMinimized();
        }
        return false;
    };
    
    isFullScreen(): boolean
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.isFullScreen();
        }
        return false;
    };
    
    alert(message: string | INSMessageBoxAlertSetting, title?: string, callback?: INSMessageBoxCallbackFunction): void
    {
        this.__createComponent();
        this.__objNSMessageBox.alert(message,title,callback);
        this.__creationHandler();
    };
    
    confirm(message: string | INSMessageBoxConfirmSetting, title?: string, confirmCallback?: INSMessageBoxCallbackFunction, cancelCallback?: INSMessageBoxCallbackFunction): void
    {
        this.__createComponent();
        this.__objNSMessageBox.confirm(message,title,confirmCallback,cancelCallback);
        this.__creationHandler();
    };
    
    custom(setting: INSMessageBoxCustomSetting):void
    {
        this.__createComponent();
        if(!setting)
        {
            setting = {};
        }
        if(setting.bodyComponent)
        {
            setting.bodyComponent = this.__customBodyComponent(setting.bodyComponent,(instance: any) => {
                setting.bodyComponentInstance = instance;
                this.__bodyComponentInstance = instance;
            });
        }
        else if(!setting.bodyContent && !setting.bodyTemplate && !setting.bodyContent)
        {
            if(this.__container)
            {
                setting.bodyContent = this.__container;
            }
        }
        this.__objNSMessageBox.custom(setting);
        this.__creationHandler();
    };
    
    close(): void
    {
        if(this.__objNSMessageBox)
        {
            //this.__objNSMessageBox.close();
            if(this.__objNSPanel)
            {
                const divModal: HTMLElement = this.__objNSPanel.__divModal; 
                divModal.style.display = "none";
                divModal.classList.remove("nsPanelModalOpen");
            }
            if(this.__objCustomComponent && this.__objCustomComponent.componentRef)
            {
                //this.__objCustomComponent.componentRef.refreshComponent(this.__objCustomComponent.data);
            }
        }
        if(this.__bodyComponentInstance)
        {
            if(this.__bodyComponentInstance.componentWillUnmount)
            {
                this.__bodyComponentInstance.componentWillUnmount.call(this.__bodyComponentInstance);
            }
            this.__bodyComponentInstance = null;
        }
        this.__objNSPanel = null;
    };
    
    removeModal (): void
    {
        if(this.__objNSMessageBox)
        {
            this.__objNSMessageBox.removeModal();
            if(this.__objCustomComponent && this.__objCustomComponent.componentRef)
            {
                //this.__objCustomComponent.componentRef.refreshComponent(this.__objCustomComponent.data);
            }
        }
        if(this.__bodyComponentInstance)
        {
            if(this.__bodyComponentInstance.componentWillUnmount)
            {
                this.__bodyComponentInstance.componentWillUnmount.call(this.__bodyComponentInstance);
            }
            this.__bodyComponentInstance = null;
        }
        this.__objNSPanel = null;
    };
    
    changeButtonStyle(btnIdentifier: any,objStyle: any): void
    {
        if(this.__objNSMessageBox)
        {
            this.__objNSMessageBox.changeButtonStyle(btnIdentifier,objStyle);
        }
    }
    
    getPanel(): any
    {
        return this.__objNSPanel;
    };
    
    getBodyComponentInstance(): any
    {
        return this.__bodyComponentInstance;
    };
    
    private __createComponent(): void
    {
        if(this.__objNSMessageBox)
        {
            this.__objNSMessageBox = null;
        }
        this.__objNSMessageBox = new NSMessageBox(this.__setting); 
        this.__addEvents();
    };
    
    private __creationHandler(): void
    {
        this.__objNSPanel =  this.__objNSMessageBox.getPanel();
        if(!this.__container)
        {
            this.__container = this.__objNSPanel.getBaseElement();
        }
    };
    
    private __customBodyComponent(customEditorComponent: any,mainCallback: any): new () => CustomBodyComponent {
        const parentIns = this;

        return class extends CustomBodyComponent {
            constructor() {
                super(parentIns, customEditorComponent, mainCallback);
            }
        };
    };

    private __getComponent(rendererComponent: any, paramCallback?: any, prop?: any): Promise<any> {
        return new Promise((parResolve, parReject) => {
            let params = {};
            if (prop) {
                params = prop;
            }
    
            const onInstanceCreated = (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => {
                paramCallback && paramCallback(null, instance, container);
                parResolve({ instance, container, portal });
            };
    
            const portal = this.createUpdatedPortal(rendererComponent, params, onInstanceCreated);
            this.setState((prevState: any) => {
                //console.log("Previous State:", prevState);
                this.hasPortalUpdated = true;
                return {
                    dynamicComponents: [...prevState.dynamicComponents, portal],
                };
            });
        });
    };

    private createUpdatedPortal(rendererComponent: any,prop: any | null,
        setInstance: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void
    ): React.ReactPortal {
        this.instanceCount += 1;
        const portal = NSReactDynamicComponent({
            component: rendererComponent,
            containerId: `ns-message-box-react-container-${this.instanceCount}`,
            parentInstance: this,
            props: prop, 
            //getStyleForContainer: this.__getStyleForContainer,
            onInstanceCreated: setInstance
        });
    
        return portal;
    }  
    
    private __getStyleForContainer() 
    {
        const style: any = { height: "100%",display:"none" };
        /*const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }*/
        return style;
    }
    
    private __addEvents()
    {
        for (const eventName of this.__arrEvents)
        {
            this.__nsUtil.addEvent(this.__container,eventName,((eventNameParam: string) => {
              return (event: any) => {
                this.__eventListener(event,eventNameParam);
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

class CustomBodyComponent {
    private objComponent: any = null;
    private componentRef: any = null;
    private containerRef!: HTMLElement;
    private parentInstance: any;
    private customEditorComponent: any;
    private mainCallback: any;

    constructor(parentInstance: any, customEditorComponent: any, mainCallback: any) {
        this.parentInstance = parentInstance;
        this.customEditorComponent = customEditorComponent;
        this.mainCallback = mainCallback;
    }

    public init(data: any): Promise<any> {
        return new Promise((parResolve, parReject) => {
            const callback = (dynamicCompRef: MessageBoxComponentRef, localComponentRef: any, container: HTMLElement) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;

                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;

                    if (this.objComponent && this.objComponent.init) {
                        this.mainCallback && this.mainCallback(this.objComponent);
                        this.objComponent.init(data);
                    }

                    this.parentInstance.__objCustomComponent = {
                        instance: this.objComponent,
                        componentRef: this.componentRef,
                        component: this.customEditorComponent,
                        data: data,
                    };

                    this.parentInstance.__emitRendererComponentCreated(this.parentInstance.__objCustomComponent);
                    parResolve(dynamicCompRef);
                } else {
                    this.parentInstance.updateCallbacksOnUpdate.push({
                        callback: callback,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        data: data
                    });
                }
            };

            this.parentInstance.__getComponent(this.customEditorComponent, callback, data);
        });
    }

    public getElement(): HTMLElement {
        return this.containerRef;
    }

    public elementAdded(): void {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded();
        }
    }

    public destroy(): void {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }
}
