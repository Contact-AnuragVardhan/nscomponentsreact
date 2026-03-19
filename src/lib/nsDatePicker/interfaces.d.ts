import { INSCalendarSetting } from "../nsCalendar/interfaces";

export interface INSDatePickerCustomClass {
    container?: string;
    textInput?: string;
    button?: string;
    calContainer?: string;
    calHeaderContainer?: string;
    calPrevButton?: string;
    calNextButton?: string;
    calMonthDropdown?: string;
    calYearDropdown?: string;
    calWeekContainer?: string;
    calWeek?: string;
    calDayContainer?: string;
    calDay?: string;
    calFooterContainer?: string;
    [propName: string]: any;
}

export interface INSDatePickerSetting  extends INSCalendarSetting {
    dateOutputFormat?: string;
    placeHolder?: string;
    buttonHtml?: string;
    enableTextBoxDisabled?: boolean;
    isAbsolutePosition?: boolean;
    customClass?: INSDatePickerCustomClass;
    [propName: string]: any;
}