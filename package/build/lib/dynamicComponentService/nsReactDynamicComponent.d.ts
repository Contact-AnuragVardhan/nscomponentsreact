import React from 'react';
import NSBaseReactComponent from '../base/nsBaseReactComponent';
type NSReactDynamicComponentProps<T> = {
    component: React.ComponentType<T>;
    containerId: string;
    parentInstance: NSBaseReactComponent<any, any>;
    props: T;
    getStyleForContainer?: () => Record<string, string>;
    onInstanceCreated?: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void;
};
export declare function CreatePortalWithProps<T>(Component: React.ComponentType<T>, props: T, containerId: string, setInstance: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void, getStyleForContainer?: () => Record<string, string>): React.ReactPortal;
export declare function NSReactDynamicComponent<T>({ component: Component, containerId, parentInstance, props, getStyleForContainer, onInstanceCreated, }: NSReactDynamicComponentProps<T>): React.ReactPortal;
export {};
