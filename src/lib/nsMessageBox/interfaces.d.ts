//import { DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"

import {INSPanelSetting, INSPanelDivSetting, INSPanelToolBarDetails, INSPanelToolBarDetailsObject, INSPanelCustomClass, INSPanelMinimizeAddRemoveElementFunction
} from "../nsPanel/interfaces";

////////// Interfaces /////////////////////////////////////////////////////////

export type MessageBoxComponentRef = (() => void);

export interface INSMessageBoxCallbackFunction {
    (event: any):void;
}

export interface INSMessageBoxConfirmButtonSetting{
    label?: string;
    cssClass?: string;
    parentCssClass?: string;
    horizontalAlign?: string;
    initialStyle?: any;
    callback?: INSMessageBoxCallbackFunction;
}

export interface INSMessageBoxToolBarDetails extends INSPanelToolBarDetails {
    messageBody?: string;
    messageFooter?: string;
    messageFooterLeft? :string;
    messageFooterRight? :string;
}

export interface INSMessageBoxBodyComponent{
     // gets called once after the component is created
    init?(data: any): Promise<any> | void;
    // Return the DOM element of editor which gets added in DOM
    getElement(): HTMLElement;
    //fired when element is added in DOM
    elementAdded?(): void;
    // gets called when editor is being destroyed.Used to do editor cleanup
    destroy?(): void;
}

export interface INSMessageBoxSetting extends INSPanelSetting {
    
} 

export interface INSMessageBoxAlertSetting extends INSMessageBoxSetting {
    bodyContent?: any;
    bodyTemplate?: string;
    bodyTemplateUrl?: string;
    buttonLabel?: string;
    buttonClass?: string;
    parentClass?: string;
    horizontalAlign?: string;
    callback?: INSMessageBoxCallbackFunction;
}

export interface INSMessageBoxConfirmSetting extends INSMessageBoxSetting {
    bodyContent?: any;
    bodyTemplate?: string;
    bodyTemplateUrl?: string;
    confirm?: INSMessageBoxConfirmButtonSetting;
    cancel?: INSMessageBoxConfirmButtonSetting;
}

export interface INSMessageBoxCustomSetting extends INSMessageBoxSetting {
    bodyContent?: any;
    bodyTemplate?: string;
    bodyTemplateUrl?: string;
    bodyComponent?: any;
    bodyComponentData?: any;
    buttons?: INSMessageBoxConfirmButtonSetting[];
}