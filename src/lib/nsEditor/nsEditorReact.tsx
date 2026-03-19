import * as React from 'react';

import '../../generated/css/nsEditor.min.css';

import NSBaseReactComponent from '../base/nsBaseReactComponent';
import { INSEditorSetting } from "./interfaces";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompEditor = require('./generated/js/nsEditor.min.js');
const NSEditor = nsCompEditor.NSEditor;

export interface INSEditorReactSetting extends INSEditorSetting {
    setting?: INSEditorSetting;
    containerStyle? : any;
    [propName: string]: any;
}

export class NSEditorReact extends NSBaseReactComponent<INSEditorReactSetting, any> 
{
    private __objEditor: any;
    private __container: any;
    private __nsUtil : any;
    private __arrEvents: string[] = [];
    private __setting:INSEditorReactSetting;
    private __hasInitialized: boolean = false;
    private __hasDestroyed: boolean = false;

    constructor(public props: INSEditorReactSetting, public state: any) 
    {
        super(props, state);
    }
    
    public componentDidMount() 
    {
        if(!this.__objEditor)
        {
            this.__nsUtil = new NSUtil();
            this.__arrEvents = [ NSEditor.EVENT_MAXIMIZED,
                                 NSEditor.EVENT_RESTORED,
                               ];            
            const setting:INSEditorReactSetting = this.props.setting; //this.__nsUtil.cloneObject(this.props.setting,true);
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
        this.__objEditor = new NSEditor(this.__container,this.__setting); 
    };
    
    toggleLineNumber(): void
    {
        this.__objEditor.toggleLineNumber();
    };
    
    setDisabled(isDisabled: boolean): void
    {
        this.__objEditor.setDisabled(isDisabled);
    };
    
    getDisabled(): boolean
    {
        return this.__objEditor.getDisabled();
    };
    
    setText(text: string): void
    {
        this.__objEditor.setText(text);
    };
    
    getText(): string
    {
        return this.__objEditor.getText();
    };
    
    setHtml(html: string): void
    {
        this.__objEditor.setHtml(html);
    };
    
    getHtml(): string
    {
        return this.__objEditor.getHtml();
    };
    
    setStyle(styleProp: string,value: any): void
    {
        this.__objEditor.setStyle(styleProp,value);
    };
    
    setFocus(isFocus: boolean): void
    {
        this.__objEditor.setFocus(isFocus);
    };
    
    hasFocus(): boolean
    {
        return this.__objEditor.hasFocus();
    };
    
    setTheme(theme: string): void
    {
        this.__objEditor.setTheme(theme);
    };
    
    changeProperty(propertyName: string,value: any): void
    {
        this.__objEditor.changeProperty(propertyName,value);
    };
    
    getNSEditor(): ReturnType<typeof NSEditor>
    {
       return this.__objEditor;
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