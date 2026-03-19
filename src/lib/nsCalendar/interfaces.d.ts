export interface INSCalendarMarkDayDisabledFunction {
    (date : any):void;
}

export interface INSCalendarButtonSettingObject {
    html?: string;
    cssClass?: string;
}

export interface INSCalendarButtonSetting {
    prev?: INSCalendarButtonSettingObject;
    next?: INSCalendarButtonSettingObject;
}

export interface INSCalendarCustomClass {
    container?: string;
    headerContainer?: string;
    prevButton?: string;
    nextButton?: string;
    monthDropdown?: string;
    yearDropdown?: string;
    weekContainer?: string;
    week?: string;
    dayContainer?: string;
    day?: string;
    footerContainer?: string;
    [propName: string]: any;
}

export interface INSCalendarSetting {
    context?: any;
    inputDateFormat?: string;
    minDate?: any;
    maxDate?: any;
    selectedDate?: any;
    monthValueName?: string[];
    monthTextName?: string[];
    weekName?: string[];
    markDayDisabled?: INSCalendarMarkDayDisabledFunction;
    showFooter?: boolean;
    footerContent?: any;
    theme?: string;
    buttonSetting?: INSCalendarButtonSetting,
    customClass?: INSCalendarCustomClass;
}