//properties from pluggins and utils are missing
export interface INSEditorSetting {
    context?: any;
    enableToolBar?: boolean;
    toolBarButton?: any[];
    enableReadOnly?: boolean;
    width?: any;
    height?: any;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    theme?: string;
    enableTagsForProps?: boolean;
    enableSpellCheck?: boolean;
    enableTabBar?: boolean;
    enableLineNumber?: boolean;
    enableAutoSuggest?: boolean;
    autoSuggestTriggers?: any[];
    mode?: string;
    placeholder?: string;
    enterElement?: string;
    maxCharCount?: number;
    charCounterType?: string;
    enableStickyToolbar?: boolean;
    enableStickyToolbarForMobile?: boolean;
    promptBoxCallback?: boolean;
    [propName: string]: any;
}