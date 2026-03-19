import * as React from "react";
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;

class NSBaseReactComponent<Props, State> extends React.Component<Props, State>
{    
  
    constructor(public props: any, public state: any) 
    {
       super(props,state);
       //if renderer component is refreshed using updateRowByIndex,updateRowByKeyField,updateCellByIndex,updateCellByKeyField 
       //then React throws error in removeChild as Grid is internally deleting all cell element while reRendering data
       let nsUtil = new NSUtil();
       nsUtil.overrideRemoveChild();
    }

    render() 
    {
        return (
          <div>
          </div>
        )
    }

}

export default NSBaseReactComponent;
