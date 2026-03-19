import React, { useRef, useEffect } from 'react';
import { ReactPortal } from 'react';
import * as ReactDOM from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
import { ReactUtil } from '../util/reactUtil';

export class DynamicComponentService {
    private component: any;
    private parent: any;
    private container: any;
    private componentRef: any;
    private statelessComponent: boolean;
    private memoHookComponent: boolean;
    private portal: ReactPortal | null = null;
    private oldPortal: ReactPortal | null = null;
    private __nsUtil: any;
    private staticMarkup: HTMLElement | null | string = null;
    private staticRenderTime: number = 0;
    private portalRefs: Map<ReactPortal, any> = new Map();

    constructor(component: any, parent?: any) {
        this.component = component;
        this.parent = parent;
        this.__nsUtil = new NSUtil();
        this.statelessComponent = DynamicComponentService.isStateless(this.component);
        this.memoHookComponent = DynamicComponentService.isMemoHook(this.component);
    }

    public init(params: any, compName: string): Promise<void> {
        this.container = this.__nsUtil.createDiv(null, compName + "-react-container");
        params.container = this.container;
        this.renderStaticMarkup(params);
        this.createPortal(params);
        return new Promise<void>(resolve => this.createComponent(params, resolve));
    }

    public rendered() {
        return this.isNullRender() ||
            this.staticMarkup ||
            (this.isStatelessComponent() && this.statelessComponentRendered()) ||
            (!this.isStatelessComponent() && this.getComponentInstance());
    }

    public isNullRender(): boolean {
        return this.staticMarkup === "";
    }

    public isStatelessComponent(): boolean {
        return this.statelessComponent;
    }

    public isMemoHookComponent(): boolean {
        return this.memoHookComponent;
    }

    public getReactComponentName(): string {
        return this.component.name;
    }

    public getComponentInstance(): any {
        return this.componentRef;
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public statelessComponentRendered(): boolean {
        return this.container.childElementCount > 0 || this.container.childNodes.length > 0;
    }

    public destroy(): void {
        if (this.portal) {
            this.parent.destroyPortal(this.portal);
            this.portal = null; // Clear reference to avoid reusing stale portal
        }
    }

    public refreshComponent(params: any) {
        if (params) {
            params.container = this.container;
        }
        this.oldPortal = this.portal;
        this.createPortal(params);
        this.parent.updatePortal(this.oldPortal!, this.portal!);
    }

    private createPortal(params: any): void {
        // Safeguard: Only create portal if one doesn't already exist
        if (!this.portal) {
            if (!this.isStatelessComponent() || this.isMemoHookComponent()) {
                params.ref = (element: any) => {
                    this.componentRef = element;
                    this.removeStaticMarkup();
                };
            }
            const reactComponent = React.createElement(this.component, params);
            const portal: ReactPortal = ReactDOM.createPortal(
                reactComponent,
                this.container as any
            );
            this.portalRefs.set(portal, this.componentRef);
            this.portal = portal;
        }
    }

    private createComponent(params: any, resolve: (value: any) => void) {
        const observer = new MutationObserver(() => {
            this.removeStaticMarkup();
        });

        observer.observe(this.container, { childList: true });

        this.parent.mountPortal(this.portal!, this, (value: any) => {
            resolve(value);
            observer.disconnect(); // Ensure observer is disconnected when component is destroyed
        });
    }

    private removeStaticMarkup() {
        if (this.staticMarkup) {
            if ((this.staticMarkup as HTMLElement).remove) {
                // Remove the static markup for modern browsers
                (this.staticMarkup as HTMLElement).remove();
            } else if (this.container.removeChild) {
                // For older browsers like IE11
                this.container.removeChild(this.staticMarkup as any);
            }
            this.staticMarkup = null;
        }
    }

    private renderStaticMarkup(params: any) {
        // Safeguard to ensure static markup is not duplicated
        if (this.staticMarkup) return;

        const reactComponent = React.createElement(this.component, params);
        try {
            const start = Date.now();
            const staticMarkup = renderToStaticMarkup(reactComponent);
            this.staticRenderTime = Date.now() - start;

            if (staticMarkup === "") {
                this.staticMarkup = staticMarkup;
            } else if (staticMarkup) {
                this.staticMarkup = document.createElement('span');
                this.staticMarkup.innerHTML = staticMarkup;
                this.container.appendChild(this.staticMarkup);
            }
        } catch (e) {
            console.error(e);
        }
    }

    private static hasSymbol() {
        return typeof Symbol === 'function' && Symbol.for;
    }

    private static isStateless(component: any) {
        return (typeof component === 'function' && !(component.prototype && component.prototype.isReactComponent)) ||
            this.isMemoHook(component);
    }

    private static isMemoHook(component: any) {
        const REACT_MEMO_TYPE = DynamicComponentService.hasSymbol() ? Symbol.for('react.memo') : 0xead3;
        return (typeof component === 'object' && component.$$typeof === REACT_MEMO_TYPE);
    }

    public static addDefaultMethods(instance: any, componentName: string, waitForInstanceCallback: Function, batchUpdateCallback: Function): void {
        if (instance == null) {
            return;
        }

        const waitForInstance = function (reactComponent: DynamicComponentService, resolve: (value: any) => void, runningTime = 0) {
            if (instance.__hasDestroyed) {
                resolve(null);
                return;
            }
            if (reactComponent.rendered()) {
                resolve(null);
            } else {
                if (waitForInstanceCallback) {
                    const retBool: Boolean = waitForInstanceCallback(reactComponent, runningTime);
                    if (!retBool) {
                        return;
                    }
                }
                window.setTimeout(() => instance.waitForInstance(reactComponent, resolve, runningTime + 5), 5);
            }
        };

        const mountPortal = function (portal: ReactPortal, reactComponent: DynamicComponentService, resolve: (value: any) => void) {
            instance.portals = [...instance.portals, portal];
            instance.batchUpdate(instance.waitForInstance(reactComponent, resolve));
        };

        const updatePortal = function (oldPortal: ReactPortal, newPortal: ReactPortal) {
            instance.portals[instance.portals.indexOf(oldPortal)] = newPortal;
            instance.batchUpdate();
        };

        const destroyPortal = function (portal: ReactPortal) {
            instance.portals = instance.portals.filter(curPortal => curPortal !== portal);
            instance.batchUpdate();
            const dynamicComponentInstance = this.portalRefs.get(portal);  // Retrieve the instance from the map
            if (dynamicComponentInstance) {
                dynamicComponentInstance.destroy();
                this.portalRefs.delete(portal);
            }
        };

        const batchUpdate = function (callback?: any) {
            if (instance.hasPendingPortalUpdate) {
                return callback && callback();
            }
            setTimeout(() => {
                if (!instance.__hasDestroyed) {
                    instance.forceUpdate(() => {
                        batchUpdateCallback && batchUpdateCallback();
                        callback && callback();
                        instance.hasPendingPortalUpdate = false;
                    });
                }
            });
            instance.hasPendingPortalUpdate = true;
        };

        ReactUtil.addMethod(instance, "waitForInstance", waitForInstance);
        ReactUtil.addMethod(instance, "mountPortal", mountPortal);
        ReactUtil.addMethod(instance, "updatePortal", updatePortal);
        ReactUtil.addMethod(instance, "destroyPortal", destroyPortal);
        ReactUtil.addMethod(instance, "batchUpdate", batchUpdate);
    }
}
