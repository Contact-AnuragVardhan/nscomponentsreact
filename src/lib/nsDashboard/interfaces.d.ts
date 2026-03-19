import { DynamicComponentService } from "../dynamicComponentService/dynamicComponentService"

import {INSPanelSetting} from "../nsPanel/interfaces";

////////// Interfaces /////////////////////////////////////////////////////////

export interface INSDashboardBodyComponent{
    // gets called once after the component is created
   init?(data: any): Promise<any> | void;
   // Return the DOM element of editor which gets added in DOM
   getElement(): HTMLElement;
   //fired when element is added in DOM
   elementAdded?(): void;
   fullScreenChanged?(isFullScreen:boolean):void;
   // gets called when editor is being destroyed.Used to do editor cleanup
   destroy?(): void;
}

export interface INSDashboardPanelSetting extends INSPanelSetting {
    bodyComponent?: any;
    bodyComponentData?: any;
}

export interface INSDashboardSetting {
    container?: HTMLElement;
    panelClass?: string;
    panelDragClass?: string;
    panelHoverClass?: string;
    panelCount?: number;
    panelPerRow?: number;
    arrPanelSetting?: INSDashboardPanelSetting[];
}

