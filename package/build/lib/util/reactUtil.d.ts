export declare class ReactUtil {
    constructor();
    static hasMethod(instance: any, name: string): boolean;
    static callMethod(instance: any, name: string, args: any): any;
    static addMethod(instance: any, name: string, callback: Function): void;
    static getMethods(instance: any, arrCompIgnore?: string[], callback?: any): string[];
}
