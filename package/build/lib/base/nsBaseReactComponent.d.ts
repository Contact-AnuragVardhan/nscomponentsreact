import * as React from "react";
declare class NSBaseReactComponent<Props, State> extends React.Component<Props, State> {
    props: any;
    state: any;
    constructor(props: any, state: any);
    render(): React.JSX.Element;
}
export default NSBaseReactComponent;
