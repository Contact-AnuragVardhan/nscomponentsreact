import * as React from 'react';

import '../../generated/css/nsComponent.min.css';
import '../../generated/css/nsMessageBox.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';

import {INSPanelSetting, INSPanelDivSetting, INSPanelToolBarDetails, INSPanelToolBarDetailsObject, INSPanelCustomClass, INSPanelMinimizeAddRemoveElementFunction
       } from "./interfaces";

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompMessageBox = require('./generated/js/nsMessageBox.min.js');
const NSPanel = nsCompMessageBox.NSPanel;

export interface INSPanelReactSettings extends INSPanelSetting {
    setting?: INSPanelSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSPanelReact extends NSBaseReactComponent<INSPanelReactSettings, any> {
    
    private __objNSPanel: any;
    private __container: any;
    private __setting : any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];

    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSPanelReactSettings, public state: any) 
    {
        super(props, state);
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
            const setting:INSPanelReactSettings =  this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.__objNSPanel = new NSPanel(this.__container,this.__setting);
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
            if(this.__objNSPanel)
            {
                this.__objNSPanel.removeComponent();
                this.__objNSPanel = null;
            }
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
    
    open(): void
    {
        /*if(!this.__objNSPanel)
        {
            this.__element = this.elementRef.nativeElement;
            this.__objNSPanel = new NSPanel(this.__element,this.setting); 
            this.__creationHandler();
            this.__addEventHandlers();
        }*/
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.open();
        }
    };
    
    close(): void
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.close();
        }
    };
    
    removeModal(): void
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.removeModal();
        }
    };
    
    getBaseElement(): any
    {
        if(this.__objNSPanel)
        {
            return this.__objNSPanel.getBaseElement();
        }
        return null;
    };
  
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
            this.__objNSPanel.disableCollapse();
        }
    };
    
    disableFullScreen(): void
    {
        if(this.__objNSPanel)
        {
            this.__objNSPanel.disableCollapse();
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
    
    private __getStyleForContainer() 
    {
        const style: any = {};
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