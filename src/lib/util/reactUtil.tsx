export class ReactUtil 
{
    constructor() 
    {
    }
    
    public static hasMethod(instance: any,name: string): boolean 
    {
        if(instance == null) 
        {
            return false;
        }
        return instance[name] != null;
    }
    
    public static callMethod(instance: any,name: string,args: any): any 
    {
        if(!instance || !instance[name]) 
        {
            return;
        }
        let method = instance[name];
        return method.apply(instance,args);
    }
    
    public static addMethod(instance: any,name: string, callback: Function): void
    {
        if(!instance || instance[name]) 
        {
            return;
        }
        instance[name] = callback;
    }
    
    public static getMethods(instance: any,arrCompIgnore?: string[],callback ?:any): string[]
    {
        arrCompIgnore = arrCompIgnore || [];
        let arrFunc: string[] = [];
        let arrIgnore: string[] = ["constructor", "toString", "toLocaleString", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable",
                                   "initializeComponent","setComponentProperties","propertyChange","removeComponent","componentResized"]
                                   .concat(arrCompIgnore);
        const proto = Object.getPrototypeOf (instance);  
        let arrProps = Object.getOwnPropertyNames(proto);
        for(var count = 0;count < arrProps.length;count++)
        {
            var prop = arrProps[count];
            /*if(prop && typeof instance[prop] == 'function')
            {
                console.log(prop);
            }
            if(prop == "isNavOpen" || prop == "toggleNavigation" || prop == "openNavigation")
            {
                console.log(prop);
            }*/
            if(prop && typeof instance[prop] == 'function' && arrIgnore.indexOf(prop) == -1 && !prop.startsWith("_"))
            {
                arrFunc.push(prop);
                if(callback)
                {
                    callback(prop);
                }
            }
        }
        return arrFunc;
    }
        
}