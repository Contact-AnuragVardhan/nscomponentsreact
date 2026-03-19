import React from 'react';
import { createPortal } from 'react-dom';
import NSBaseReactComponent from '../base/nsBaseReactComponent';

type NSReactDynamicComponentProps<T> = {
  component: React.ComponentType<T>; 
  containerId: string;
  parentInstance: NSBaseReactComponent<any, any>;  
  props: T;
  getStyleForContainer?: () => Record<string, string>;
  onInstanceCreated?: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void;
};

export function CreatePortalWithProps<T>(
  Component: React.ComponentType<T>, 
  props: T, 
  containerId: string, 
  setInstance: (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => void, 
  getStyleForContainer?: () => Record<string, string>
) {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    if(getStyleForContainer) {
      const styles = getStyleForContainer();
      Object.keys(styles).forEach(key => {
        (container?.style as any)[key] = styles[key];
      });
    }
    // Ensure the container is attached to the DOM
    document.body.appendChild(container);
  }

  const callSetInstance = (instance: any) => {
    setInstance(instance, container, portal);
  };

  const mergedProps = { ...props, ref: callSetInstance };

  const portal = createPortal(
    <Component {...mergedProps} />,
    container
  );

  // Instead of rendering here, return the portal to be rendered in the render method
  return portal;
};

export function NSReactDynamicComponent<T>({
  component: Component,
  containerId,
  parentInstance,
  props = {} as T,
  getStyleForContainer,
  onInstanceCreated,
}: NSReactDynamicComponentProps<T>): React.ReactPortal {
    
  let instanceCreated = false;

  const setInstance = (instance: any, container: HTMLElement | null, portal: React.ReactPortal) => {
    if (instance && onInstanceCreated && !instanceCreated) {
      onInstanceCreated(instance, container, portal);
      instanceCreated = true;
    }
  };

  return CreatePortalWithProps(Component, props, containerId, setInstance, getStyleForContainer);
}

