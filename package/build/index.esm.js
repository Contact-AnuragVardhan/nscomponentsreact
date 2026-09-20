import * as React from 'react';
import React__default, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import * as ReactDOM from 'react-dom';
import { createPortal } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNavigate } from 'react-router-dom';

class ReactUtil {
    constructor() {
    }
    static hasMethod(instance, name) {
        if (instance == null) {
            return false;
        }
        return instance[name] != null;
    }
    static callMethod(instance, name, args) {
        if (!instance || !instance[name]) {
            return;
        }
        let method = instance[name];
        return method.apply(instance, args);
    }
    static addMethod(instance, name, callback) {
        if (!instance || instance[name]) {
            return;
        }
        instance[name] = callback;
    }
    static getMethods(instance, arrCompIgnore, callback) {
        arrCompIgnore = arrCompIgnore || [];
        let arrFunc = [];
        let arrIgnore = ["constructor", "toString", "toLocaleString", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable",
            "initializeComponent", "setComponentProperties", "propertyChange", "removeComponent", "componentResized"]
            .concat(arrCompIgnore);
        const proto = Object.getPrototypeOf(instance);
        let arrProps = Object.getOwnPropertyNames(proto);
        for (var count = 0; count < arrProps.length; count++) {
            var prop = arrProps[count];
            /*if(prop && typeof instance[prop] == 'function')
            {
                console.log(prop);
            }
            if(prop == "isNavOpen" || prop == "toggleNavigation" || prop == "openNavigation")
            {
                console.log(prop);
            }*/
            if (prop && typeof instance[prop] == 'function' && arrIgnore.indexOf(prop) == -1 && !prop.startsWith("_")) {
                arrFunc.push(prop);
                if (callback) {
                    callback(prop);
                }
            }
        }
        return arrFunc;
    }
}

const nsCompUtil$e = require('./generated/js/nsUtil.min.js');
const NSUtil$e = nsCompUtil$e.NSUtil;
class DynamicComponentService {
    constructor(component, parent) {
        this.portal = null;
        this.oldPortal = null;
        this.staticMarkup = null;
        this.staticRenderTime = 0;
        this.portalRefs = new Map();
        this.component = component;
        this.parent = parent;
        this.__nsUtil = new NSUtil$e();
        this.statelessComponent = DynamicComponentService.isStateless(this.component);
        this.memoHookComponent = DynamicComponentService.isMemoHook(this.component);
    }
    init(params, compName) {
        this.container = this.__nsUtil.createDiv(null, compName + "-react-container");
        params.container = this.container;
        this.renderStaticMarkup(params);
        this.createPortal(params);
        return new Promise(resolve => this.createComponent(params, resolve));
    }
    rendered() {
        return this.isNullRender() ||
            this.staticMarkup ||
            (this.isStatelessComponent() && this.statelessComponentRendered()) ||
            (!this.isStatelessComponent() && this.getComponentInstance());
    }
    isNullRender() {
        return this.staticMarkup === "";
    }
    isStatelessComponent() {
        return this.statelessComponent;
    }
    isMemoHookComponent() {
        return this.memoHookComponent;
    }
    getReactComponentName() {
        return this.component.name;
    }
    getComponentInstance() {
        return this.componentRef;
    }
    getElement() {
        return this.container;
    }
    statelessComponentRendered() {
        return this.container.childElementCount > 0 || this.container.childNodes.length > 0;
    }
    destroy() {
        if (this.portal) {
            this.parent.destroyPortal(this.portal);
            this.portal = null; // Clear reference to avoid reusing stale portal
        }
    }
    refreshComponent(params) {
        if (params) {
            params.container = this.container;
        }
        this.oldPortal = this.portal;
        this.createPortal(params);
        this.parent.updatePortal(this.oldPortal, this.portal);
    }
    createPortal(params) {
        // Safeguard: Only create portal if one doesn't already exist
        if (!this.portal) {
            if (!this.isStatelessComponent() || this.isMemoHookComponent()) {
                params.ref = (element) => {
                    this.componentRef = element;
                    this.removeStaticMarkup();
                };
            }
            const reactComponent = React__default.createElement(this.component, params);
            const portal = ReactDOM.createPortal(reactComponent, this.container);
            this.portalRefs.set(portal, this.componentRef);
            this.portal = portal;
        }
    }
    createComponent(params, resolve) {
        const observer = new MutationObserver(() => {
            this.removeStaticMarkup();
        });
        observer.observe(this.container, { childList: true });
        this.parent.mountPortal(this.portal, this, (value) => {
            resolve(value);
            observer.disconnect(); // Ensure observer is disconnected when component is destroyed
        });
    }
    removeStaticMarkup() {
        if (this.staticMarkup) {
            if (this.staticMarkup.remove) {
                // Remove the static markup for modern browsers
                this.staticMarkup.remove();
            }
            else if (this.container.removeChild) {
                // For older browsers like IE11
                this.container.removeChild(this.staticMarkup);
            }
            this.staticMarkup = null;
        }
    }
    renderStaticMarkup(params) {
        // Safeguard to ensure static markup is not duplicated
        if (this.staticMarkup)
            return;
        const reactComponent = React__default.createElement(this.component, params);
        try {
            const start = Date.now();
            const staticMarkup = renderToStaticMarkup(reactComponent);
            this.staticRenderTime = Date.now() - start;
            if (staticMarkup === "") {
                this.staticMarkup = staticMarkup;
            }
            else if (staticMarkup) {
                this.staticMarkup = document.createElement('span');
                this.staticMarkup.innerHTML = staticMarkup;
                this.container.appendChild(this.staticMarkup);
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    static hasSymbol() {
        return typeof Symbol === 'function' && Symbol.for;
    }
    static isStateless(component) {
        return (typeof component === 'function' && !(component.prototype && component.prototype.isReactComponent)) ||
            this.isMemoHook(component);
    }
    static isMemoHook(component) {
        const REACT_MEMO_TYPE = DynamicComponentService.hasSymbol() ? Symbol.for('react.memo') : 0xead3;
        return (typeof component === 'object' && component.$$typeof === REACT_MEMO_TYPE);
    }
    static addDefaultMethods(instance, componentName, waitForInstanceCallback, batchUpdateCallback) {
        if (instance == null) {
            return;
        }
        const waitForInstance = function (reactComponent, resolve, runningTime = 0) {
            if (instance.__hasDestroyed) {
                resolve(null);
                return;
            }
            if (reactComponent.rendered()) {
                resolve(null);
            }
            else {
                if (waitForInstanceCallback) {
                    const retBool = waitForInstanceCallback(reactComponent, runningTime);
                    if (!retBool) {
                        return;
                    }
                }
                window.setTimeout(() => instance.waitForInstance(reactComponent, resolve, runningTime + 5), 5);
            }
        };
        const mountPortal = function (portal, reactComponent, resolve) {
            instance.portals = [...instance.portals, portal];
            instance.batchUpdate(instance.waitForInstance(reactComponent, resolve));
        };
        const updatePortal = function (oldPortal, newPortal) {
            instance.portals[instance.portals.indexOf(oldPortal)] = newPortal;
            instance.batchUpdate();
        };
        const destroyPortal = function (portal) {
            instance.portals = instance.portals.filter(curPortal => curPortal !== portal);
            instance.batchUpdate();
            const dynamicComponentInstance = this.portalRefs.get(portal); // Retrieve the instance from the map
            if (dynamicComponentInstance) {
                dynamicComponentInstance.destroy();
                this.portalRefs.delete(portal);
            }
        };
        const batchUpdate = function (callback) {
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

const nsCompAjax$1 = require('./generated/js/nsAjax.min.js');
const NSAjax$1 = nsCompAjax$1.NSAjax;
class NSAjaxReact {
    constructor(defaultSetting) {
        this.ajax = null;
        this.ajax = new NSAjax$1(defaultSetting);
        this.post = this.post.bind(this);
        this.get = this.get.bind(this);
        this.jsonp = this.jsonp.bind(this);
    }
    post(url, data, setting) {
        return this.ajax.post(url, data, setting);
    }
    get(url, data, setting) {
        return this.ajax.get(url, data, setting);
    }
    delete(url, data, setting) {
        return this.ajax.delete(url, data, setting);
    }
    head(url, data, setting) {
        return this.ajax.head(url, data, setting);
    }
    options(url, data, setting) {
        return this.ajax.options(url, data, setting);
    }
    put(url, data, setting) {
        return this.ajax.put(url, data, setting);
    }
    jsonp(url, data, setting) {
        return this.ajax.jsonp(url, data, setting);
    }
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$a = ".nsCalendar\r\n{\r\n\twidth: 240px;\r\n\tmin-width: 240px;\r\n    border-radius: 3px;\r\n    overflow: hidden;\r\n}\r\n.nsCalendar .nsCalendarContainer\r\n{\r\n}\r\n.nsCalendar .nsCalendarHeader\r\n{\r\n\tdisplay: flex;\r\n    height: 32px;\r\n    line-height: 30px;\r\n}\r\n.nsCalendar .nsCalendarButton\r\n{\r\n\tbackground: none;\r\n    border: 0;\r\n    outline: none;\r\n    color: inherit;\r\n    font: inherit;\r\n    line-height: normal;\r\n    overflow: visible;\r\n    padding: 0;\r\n    -webkit-appearance: button;\r\n    -moz-user-select: none;\r\n    -ms-user-select: none;\r\n    cursor: pointer;\r\n}\r\n.nsCalendar .nsCalendarHeaderNav\r\n{\r\n\twidth: 100%;\r\n    text-align: center;\r\n}\r\n.nsCalendar .nsCalendarSelect\r\n{\r\n    line-height: 1.25;\r\n    height: inherit;\r\n    width: 49%;\r\n    display: inline-block;\r\n    max-width: 100%;\r\n}\r\n.nsCalendar .nsCalendarWeekContainer\r\n{\r\n\tdisplay: flex;\r\n    flex-wrap: wrap;\r\n}\r\n.nsCalendar .nsCalendarWeek\r\n{\r\n    width: 32px;\r\n    height: 32px;\r\n    line-height: 32px;\r\n    text-align: center;\r\n}\r\n.nsCalendar .nsCalendarDayContainer\r\n{\r\n\tdisplay: flex!important;\r\n\tpadding-bottom: 4px!important;\r\n\tpadding-left: 4px!important;\r\n\tpadding-right: 4px!important;\r\n}\r\n.nsCalendar .nsCalendarDayContainerBody \r\n{\t\r\n}\r\n.nsCalendar .nsCalendarDayContainerRow \r\n{\r\n\tdisplay: flex!important;\r\n}\r\n.nsCalendar .nsCalendarDayContainerCell\r\n{\r\n    width: 32px;\r\n    height: 32px;\r\n    line-height: 32px;\r\n    border-radius: 4px;\r\n    text-align: center;\r\n    cursor: pointer;\r\n}\r\n.nsCalendar .nsCalendarDayDisabled\r\n{\r\n\topacity: 0.35;\r\n    background-image: none;\r\n    border-style: initial;\r\n    border-color: initial;\r\n    border-image: initial;\r\n    pointer-events: none;\r\n    cursor: default;\r\n}\r\n.nsCalendar .nsCalendarFooterContainer\r\n{\r\n}\r\n.nsCalendar .nsCalendarTimeContainer {\r\n    display: flex;\r\n    flex-direction: row;\r\n    /*padding-bottom: 4px;*/\r\n    padding-left: 4px;\r\n    padding-right: 4px;\r\n    justify-content: space-between;\r\n}\r\n\r\n.nsCalendar .nsCalendarTimeInput {\r\n    border-radius: 4px;\r\n    height: 24px;\r\n    margin: 0px;\r\n    padding: 0px;\r\n    text-align: center;\r\n    width: 40px;\r\n    font-size: 10px;\r\n}\r\n\r\n.nsCalendar .nsCalendarTimeSaveContainer {\r\n    padding: 2px;\r\n    padding-bottom: 0px;\r\n}\r\n\r\n.nsCalendar .nsCalendarIconButton {\r\n    background: transparent;\r\n    border: none;\r\n    padding: 0px;\r\n}\r\n.nsCalendar .nsCalendarIconTime {\r\n    width: 24px;\r\n    height: 24px;\r\n}\r\n\r\n.nsCalendar .nsCalendarIconTime.nsCalendarIconTimeSmall {\r\n    width: 20px;\r\n    height: 20px;\r\n}\r\n\r\n.nsCalendar .nsCalendarIconTime.nsCalendarIconTimeSave{\r\n    color: green;\r\n}\r\n\r\n.nsCalendar .nsCalendarIconTime.nsCalendarIconTimeCancel{\r\n    color: red;\r\n}\r\n\r\n.nsCalendarWhite\r\n{\r\n\tbackground-color: #fff;\r\n\tbox-shadow: 0 4px 22px 0 rgba(0, 0, 0, 0.05);\r\n    border: solid 1px #e7e9ed;\r\n}\r\n.nsCalendarWhite .nsCalendarHeaderButtonSvg \r\n{\r\n    fill: #0A9297;\r\n}\r\n.nsCalendarWhite .nsCalendarSelect\r\n{\r\n\tcolor: #495057;\r\n\tbackground: #fff;\r\n\tborder: 1px solid rgba(0,0,0,.15);\r\n\tvertical-align: middle;\r\n    background-size: 8px 10px;\r\n    border-radius: 4px;\r\n    padding: 4px 8px;\r\n    font-size: 14px;\r\n}\r\n.nsCalendarWhite .nsCalendarWeekContainer\r\n{\r\n\tbackground-color: #E7E9ED;\r\n}\r\n.nsCalendarWhite .nsCalendarWeek\r\n{\r\n\tbackground-color: #E7E9ED;\r\n\tcolor: #17a2b8;\r\n    font-style: italic;\r\n    font-size: 80%;\r\n    font-weight: 400;\r\n}\r\n.nsCalendarWhite .nsCalendarWeek\r\n{\r\n\tbackground: transparent;\r\n    color: #111;\r\n    border-color: #f8f9fa;\r\n}\r\n.nsCalendarWhite .nsCalendarOtherMonth\r\n{\r\n\tbackground-color: #e2e6ea;\r\n    background-image: none;\r\n    border-color: #dae0e5;\r\n    color: #868e96!important;\r\n    opacity: 0.5;\r\n    border-radius: 0;\r\n}\r\n.nsCalendarWhite .nsCalendarToday\r\n{\r\n    background: #fffa90;\r\n    color: #777620;\r\n}\r\n.nsCalendarWhite .nsCalendarSelected\r\n{\r\n\tbackground-color: #007bff;\r\n\tcolor: #fff;\r\n}\r\n.nsCalendarWhite .nsCalendarFooterContainer\r\n{\r\n\tborder-top: 1px solid #e9e9e9;\r\n\tpadding: 0 12px;\r\n\tline-height: 38px;\r\n}.nsDatePicker\r\n{\r\n\t\r\n}\r\n.nsDatePickerContainer\r\n{\r\n\tposition: relative;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    width: 100%;\r\n}\r\n.nsDatePickerTextBox\r\n{\r\n    line-height: 1.25;\r\n    color: #495057;\r\n    background-color: #fff;\r\n    background-image: none;\r\n    background-clip: padding-box;\r\n    border: 1px solid rgba(0,0,0,.15);\r\n    border-radius: .25rem;\r\n    border-top-right-radius: 0;\r\n    border-bottom-right-radius: 0;\r\n    width:100%;\r\n}\r\n.nsDatePickerTextBoxDisabled\r\n{\r\n\tbackground: #CCC; \r\n    color: #333; \r\n    border: 1px solid #666;\r\n    pointer-events: none; \r\n}\r\n.nsDatePickerCalContainer\r\n{\r\n\tposition: absolute;\r\n    top: 100%;\r\n    left: 0;\r\n    z-index: 1000;\r\n    display: none;\r\n    float: left;\r\n    min-width: 10rem;\r\n    padding: .5rem 0;\r\n    margin: .125rem 0 0;\r\n    color: #212529;\r\n    text-align: left;\r\n    background-color: #fff;\r\n    background-clip: padding-box;\r\n    border: 1px solid rgba(0,0,0,.15);\r\n    border-radius: .25rem;\r\n}\r\n.nsDatePickerCalContainerVisible\r\n{\r\n\tdisplay: inline-block!important;\r\n}\r\n.nsDatePickerButton\r\n{\r\n\tline-height: 1.25;\r\n    color: #495057;\r\n    text-align: center;\r\n    background-color: #e9ecef;\r\n    border: 1px solid rgba(0,0,0,.15);\r\n    border-radius: .25rem;\r\n    border-top-left-radius: 0;\r\n    border-bottom-left-radius: 0;\r\n    cursor: pointer;\r\n    padding:1px;\r\n}\r\n";
styleInject(css_248z$a);

const nsCompUtil$d = require('./generated/js/nsUtil.min.js');
const NSUtil$d = nsCompUtil$d.NSUtil;
class NSBaseReactComponent extends React.Component {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        //if renderer component is refreshed using updateRowByIndex,updateRowByKeyField,updateCellByIndex,updateCellByKeyField 
        //then React throws error in removeChild as Grid is internally deleting all cell element while reRendering data
        let nsUtil = new NSUtil$d();
        nsUtil.overrideRemoveChild();
    }
    render() {
        return (React.createElement("div", null));
    }
}

const nsCompUtil$c = require('./generated/js/nsUtil.min.js');
const NSUtil$c = nsCompUtil$c.NSUtil;
const nsCompDatePicker$2 = require('./generated/js/nsDatePicker.min.js');
const NSCalendar$1 = nsCompDatePicker$2.NSCalendar;
class NSCalendarReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__objNSCalendar) {
            this.__nsUtil = new NSUtil$c();
            this.__arrEvents = [NSCalendar$1.DATE_SELECTED
            ];
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    create() {
        this.__objNSCalendar = new NSCalendar$1(this.__container, this.__setting);
    }
    ;
    getSelectedDate() {
        return this.__objNSCalendar.getSelectedDate();
    }
    ;
    getSelectedDateAsString(format) {
        return this.__objNSCalendar.getSelectedDateAsString(format);
    }
    ;
    setSelectedDate(date, format) {
        this.__objNSCalendar.setSelectedDate(date, format);
    }
    ;
    setYear(year) {
        this.__objNSCalendar.setYear(year);
    }
    ;
    setMonth(month) {
        this.__objNSCalendar.setMonth(month);
    }
    ;
    reset() {
        this.__objNSCalendar.reset();
    }
    ;
    setTodayDate() {
        this.__objNSCalendar.setTodayDate();
    }
    ;
    setStyle(styleProp, value) {
        this.__objNSCalendar.setStyle(styleProp, value);
    }
    ;
    setFocus(isFocus) {
        this.__objNSCalendar.setFocus(isFocus);
    }
    ;
    hasFocus() {
        return this.__objNSCalendar.hasFocus();
    }
    ;
    setTheme(theme) {
        this.__objNSCalendar.setTheme(theme);
    }
    ;
    changeProperty(propertyName, value) {
        this.__objNSCalendar.changeProperty(propertyName, value);
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    console.log(event);
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}

const nsCompUtil$b = require('./generated/js/nsUtil.min.js');
const NSUtil$b = nsCompUtil$b.NSUtil;
const nsCompDatePicker$1 = require('./generated/js/nsDatePicker.min.js');
const NSDatePicker$1 = nsCompDatePicker$1.NSDatePicker;
class NSDatePickerReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__objNSDatePicker) {
            this.__nsUtil = new NSUtil$b();
            this.__arrEvents = [NSDatePicker$1.CALENDAR_OPENED,
                NSDatePicker$1.CALENDAR_CLOSED,
                NSDatePicker$1.DATE_SELECTED,
                NSDatePicker$1.INPUT_CHANGE,
            ];
            const setting = this.props.setting; //this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value)) {
            let valDate = nextProps.value;
            if (typeof valDate === 'string') {
                valDate = new Date(valDate);
            }
            this.setSelectedDate(valDate, null);
        }
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    create() {
        this.__objNSDatePicker = new NSDatePicker$1(this.__container, this.__setting);
    }
    ;
    getSelectedDate() {
        return this.__objNSDatePicker.getSelectedDate();
    }
    ;
    getSelectedDateAsString(format) {
        return this.__objNSDatePicker.getSelectedDateAsString(format);
    }
    ;
    setSelectedDate(date, format) {
        this.__objNSDatePicker.setSelectedDate(date, format);
    }
    ;
    setYear(year) {
        this.__objNSDatePicker.setYear(year);
    }
    ;
    setMonth(month) {
        this.__objNSDatePicker.setMonth(month);
    }
    ;
    reset() {
        this.__objNSDatePicker.reset();
    }
    ;
    setTodayDate() {
        this.__objNSDatePicker.setTodayDate();
    }
    ;
    showCalendar() {
        this.__objNSDatePicker.showCalendar();
    }
    ;
    closeCalendar() {
        this.__objNSDatePicker.closeCalendar();
    }
    ;
    getCalendar() {
        return this.__objNSDatePicker.getCalendar();
    }
    ;
    getTextBox() {
        return this.__objNSDatePicker.getTextBox();
    }
    ;
    getText() {
        if (this.__objNSDatePicker) {
            return this.__objNSDatePicker.getText();
        }
        return "";
    }
    ;
    toggleCalendarVisibility() {
        this.__objNSDatePicker.toggleCalendarVisibility();
    }
    ;
    setStyle(styleProp, value) {
        this.__objNSDatePicker.setStyle(styleProp, value);
    }
    ;
    setFocus(isFocus) {
        this.__objNSDatePicker.setFocus(isFocus);
    }
    ;
    hasFocus() {
        return this.__objNSDatePicker.hasFocus();
    }
    ;
    setTheme(theme) {
        this.__objNSDatePicker.setTheme(theme);
    }
    ;
    changeProperty(propertyName, value) {
        this.__objNSDatePicker.changeProperty(propertyName, value);
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}

var css_248z$9 = "/************Util Classes ***************/\r\n.nsContainer\r\n{\r\n\tdisplay:block;\r\n}\r\n/* used to measure the scrollbar width on a temporal element */\r\n.nsGetScrollBar \r\n{\r\n  width: 50px;\r\n  height: 50px;\r\n  position: absolute;\r\n  top: -9999px;\r\n  overflow: auto;\r\n  top:-100px;\r\n  left:-100px\r\n}\r\n\r\n.nsGetDPI \r\n{\r\n  height: 1in;\r\n  left: -100%;\r\n  position: absolute;\r\n  top: -100%;\r\n  width: 1in;\r\n}\r\n\r\n*.nsUnselectable \r\n{\r\n   -webkit-touch-callout: none;\r\n\t-webkit-user-select: none;\r\n\t-khtml-user-select: none;\r\n\t-moz-user-select: none;\r\n\t-ms-user-select: none;\r\n\tuser-select: none;\r\n}\r\n\r\n.nsGhostElement\r\n{\r\n    background:#D8D8D8;\r\n    padding: 20px; \r\n    width: 200px;\r\n    height: 150px;   \r\n    position: absolute;\r\n    margin: 0;\r\n    padding: 0;\r\n    z-index: 98;\r\n}\r\n\r\n.nsMoveOnClick\r\n{\r\n\tleft:0px;\r\n\ttop:0px;\r\n\ttransition: left .5s cubic-bezier(.42,-0.3,.78,1.25), \r\n\t\t\t\ttop .5s cubic-bezier(.42,-0.3,.78,1.25);\r\n}\r\n/************End of Util Classes ***************/\r\n\r\n/***********For NSToolTip ***************/\r\n.nsTooltip \r\n{\t\r\n\tposition: relative;\r\n}\r\n.nsTooltip span \r\n{\r\n\tcolor: #000000; \r\n\tmargin-left: -999em;\r\n\tposition: absolute;\r\n\toutline: none;\r\n\ttext-decoration: none;\r\n}\r\n.nsTooltip:hover span \r\n{\r\n\tborder-radius: 5px 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; \r\n\tbox-shadow: 5px 5px 5px rgba(0, 0, 0, 0.1); -webkit-box-shadow: 5px 5px rgba(0, 0, 0, 0.1); -moz-box-shadow: 5px 5px rgba(0, 0, 0, 0.1);\r\n\tfont-family: Calibri, Tahoma, Geneva, sans-serif;\r\n\tposition: absolute; left: 1em; top: 2em; z-index: 99;\r\n\tmargin-left: 0; width: 250px;\r\n}\r\n.nsTooltip:hover em \r\n{\r\n\tfont-family: Candara, Tahoma, Geneva, sans-serif; font-size: 1.2em; font-weight: bold;\r\n\tdisplay: block; padding: 0.2em 0 0.6em 0;\r\n}\r\n.nsTooltipClassic \r\n{ \r\n\tpadding: 0.8em 1em; \r\n}\r\n.nsTooltipCustom \r\n{ \r\n\tpadding: 0.5em 0.8em 0.8em 2em; \r\n}\r\n.nsTooltipClassic \r\n{\r\n\tbackground: #FFFFAA; border: 1px solid #FFAD33; \r\n}\r\n.nsTooltipCritical \r\n{ \r\n\tbackground: #FFCCAA; border: 1px solid #FF3334;\t\r\n}\r\n.nsTooltipHelp \r\n{ \r\n\tbackground: #9FDAEE; border: 1px solid #2BB0D7;\t\r\n}\r\n.nsTooltipInfo \r\n{ \r\n\tbackground: #9FDAEE; border: 1px solid #2BB0D7;\t\r\n}\r\n.nsTooltipWarning \r\n{ \r\n\tbackground: #FFFFAA; border: 1px solid #FFAD33; \r\n}\r\n\r\n/***********End of NSToolTip ***************/\r\n/***********For NSCheckBox ****************/\r\n/*.checkbox ,.radioButton\r\n{\r\n  display:block;\r\n  margin:4px 0 0 0;\r\n  padding:0;\r\n  width:13px;\r\n  height:13px;\r\n}*/\r\n\r\n.label\r\n{\r\n  cursor:pointer; /* iPad Label Click Fix */\r\n}\r\n/***********End of NSCheckBox ****************/\r\n\r\n/***********For NSDividerBox ***************/\r\n.nsHorizontalResizerContainer\r\n{\r\n\tposition: relative;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\twidth: 100%;\r\n\theight: 100%;\r\n\toverflow: hidden;\r\n}\r\n.nsResizerAnimation\r\n{\r\n  \t-webkit-transition: all 0.6s ease-in-out;\r\n  \t-moz-transition: all 0.6s ease-in-out;\r\n  \t-o-transition: all 0.6s ease-in-out;\r\n  \ttransition: all 0.6s ease-in-out;\r\n}\r\n.nsHorizontalResizerChild \r\n{\r\n\tposition: absolute;\r\n\tleft: 0;\r\n\tright: 0;\r\n\twidth:100%;\r\n\toverflow:auto;\r\n}\r\n.nsVerticalResizerContainer\r\n{\r\n\tposition: relative;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\twidth: 100%;\r\n\theight: 100%;\r\n}\r\n.nsVerticalResizerChild \r\n{\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tbottom: 0;\r\n\theight:100%;\r\n\toverflow:auto;\r\n}\r\n.nsDivider\r\n{\tbackground: #d9d9d9;\r\n    border-color: #b3b3b3;\r\n    box-shadow: none;\r\n    -webkit-box-shadow: none;\r\n    -moz-box-shadow: none;\r\n}\r\n.nsDivider:hover\r\n{\r\n\tborder-color:#222; \r\n\tbackground-color:#888888; \r\n\tcolor: #fff;\r\n}\r\n\r\n.nsDivider:hover > .nsResizerLines\r\n{\r\n\tborder-color:#d9d9d9; \r\n\tbackground-color:#b3b3b3; \r\n}\r\n.nsVerticalResizer \r\n{\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tbottom: 0;\r\n\tcursor: col-resize;\r\n}\r\n.nsHorizontalResizer \r\n{\r\n\tposition: absolute;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tcursor: row-resize;\r\n}\r\n.nsVerticalResizerLines \r\n{\r\n  position: absolute;\r\n  border-color: #999;;\r\n  background-color: #999;;\r\n  cursor: pointer;\r\n  left:0;\r\n  top: 50%;\r\n  height: 40px;\r\n  width: 100%;\r\n}\r\n.nsHorizontalResizerLines\r\n{\r\n  position: absolute;\r\n  border-color: #999;;\r\n  background-color: #999;;\r\n  cursor: pointer;\r\n  top:0;\r\n  left: 50%;\r\n  width: 40px;\r\n  height: 100%;\r\n}\r\n.nsResizerCollapser \r\n{\r\n\t position: absolute;\r\n    background-color: #999;\r\n    cursor: pointer;\r\n    display: inline-block;\r\n   \r\n}\r\n.nsVerticalResizerCollapser\r\n{\r\n    height: 20px;\r\n    left: 0;\r\n    margin-top: -10px;\r\n    top: 5%;\r\n    width: inherit;\r\n}\r\n.nsHorizontalResizerCollapser {\r\n    height: inherit;\r\n    top: 0;\r\n    left: 5%;\r\n    margin-left: -10px;\r\n    width: 20px;\r\n}\r\n/************End of NSDividerBox******************/\r\n\r\n/***********For NSBanner ***************/\r\n.nsInfoBanner\r\n {\r\n  border-bottom:1px solid black;\r\n  background:#E5ECEF;\r\n  padding: 3px 0;\r\n  text-indent: 5px;\r\n  font: normal 11px Verdana;\r\n }\r\n \r\n .nsWarningBanner\r\n {\r\n  border-bottom:1px solid black;\r\n  background:#FFFF99;\r\n  padding: 3px 0;\r\n  text-indent: 5px;\r\n  font: normal 11px Verdana;\r\n }\r\n \r\n .nsErrorBanner\r\n {\r\n  border-bottom:1px solid black;\r\n  background:#FACDCA;\r\n  padding: 3px 0;\r\n  text-indent: 5px;\r\n  font: normal 11px Verdana;\r\n }\r\n \r\n .nsCloseBannerButton\r\n{\r\n    font-family: Verdana, Geneva, sans-serif;\r\n    font-size: small;\r\n    font-weight: bold;\r\n    color : #000000;\r\n}\r\n\r\n.nsCloseBannerButton_hover\r\n{\r\n    font-family: Verdana, Geneva, sans-serif;\r\n    font-size: small;\r\n    font-weight: bold;\r\n    color : #FC1D00;\r\n}\r\n\r\n.nsFixedElement\r\n{\r\n position:fixed;\r\n}\r\n/************End of NSBanner******************/\r\n/************Start of nsScroller************/\r\n.gm-scrollbar-container {\r\n  position: relative;\r\n  overflow: hidden!important;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n.gm-scrollbar-container .gm-scroll-view {\r\n  width: 100%;\r\n  height: 100%;\r\n  overflow: scroll;\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\n/* @option: autoshow */\r\n.gm-scrollbar-container.gm-autoshow .gm-scrollbar {\r\n  opacity: 0;\r\n  transition: opacity 120ms ease-out;\r\n}\r\n.gm-scrollbar-container.gm-autoshow:hover .gm-scrollbar,\r\n.gm-scrollbar-container.gm-autoshow:focus .gm-scrollbar {\r\n  opacity: 1;\r\n  transition: opacity 340ms ease-out;\r\n}\r\n.gm-prevented .gm-scrollbar {\r\n  display: none;\r\n}\r\n.gm-scrollbar {\r\n  position: absolute;\r\n  right: 2px;\r\n  bottom: 2px;\r\n  z-index: 1;\r\n  border-radius: 3px;\r\n}\r\n\r\n.gm-scrollbar.-vertical {\r\n  width: 6px;\r\n  top: 2px;\r\n}\r\n\r\n.gm-scrollbar.-horizontal {\r\n  height: 6px;\r\n  left: 2px;\r\n}\r\n\r\n.gm-scrollbar .thumb {\r\n  position: relative;\r\n  width: 0;\r\n  height: 0;\r\n  cursor: pointer;\r\n  border-radius: inherit;\r\n  background-color: rgba(0,0,0,.2);\r\n}\r\n\r\n.gm-scrollbar .thumb:hover,\r\n.gm-scrollbar .thumb:active {\r\n  background-color: rgba(0,0,0,.3);\r\n}\r\n\r\n.gm-scrollbar.-vertical .thumb {\r\n  width: 100%;\r\n}\r\n\r\n.gm-scrollbar.-horizontal .thumb {\r\n  height: 100%;\r\n}\r\n\r\n.gm-scrollbar-disable-selection {\r\n  -webkit-touch-callout: none;\r\n  -webkit-user-select: none;\r\n  -khtml-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n\r\n.gm-prevented {\r\n  -webkit-overflow-scrolling: touch;\r\n}\r\n\r\n.nsScrollerBackground \r\n{\r\n\tbackground-color:rgba(0,0,0,0.15);\r\n \tbox-shadow:inset 0 1px 3px rgba(0,0,0,0.5),inset 0 0 2px rgba(0,0,0,0.2),0 0 0 1px rgba(255,255,255,0.5);\r\n}\r\n/************End of nsScroller************/\r\n/************Start of Loader******************/\r\n.nsLoaderOverlay {\r\n  position: absolute;\r\n  z-index: 999;\r\n  top: 0px;\r\n  bottom: 0px;\r\n  left: 0px;\r\n  right: 0px;\r\n  background:#333;/*#FFFFFF;*/\r\n  opacity:0.8;\r\n}\r\n\r\n.nsLoaderContainerParent {\r\n\tposition:absolute;\r\n\tz-index: 1000;\r\n\tdisplay: inline-block;\r\n\tbackground-color:#fff;\r\n\twidth:300px;\r\n\theight:140px;\r\n\tborder:1px solid black;\r\n\t-webkit-box-shadow: rgba(50, 50, 50, 0.74902) 0px 10px 5px 0px; \r\n\tbox-shadow: rgba(50, 50, 50, 0.74902) 0px 10px 5px 0px;\r\n}\r\n\t\t\t\r\n.nsLoaderContainer {\r\n\tvertical-align:center;\r\n\tposition:relative;\r\n\ttext-align:center;\r\n}\r\n\r\n.nsLoaderText {\r\n\tpadding-top:10px;\r\n\tposition:absolute;\r\n\ttop:0px;\r\n\tleft:0px;\r\n\tfont-weight: bold;\r\n}\r\n\r\n/* loading dots */\r\n.nsLoaderText:after {\r\n  content: ' ...';\r\n  -webkit-animation: dots 1s steps(5, end) infinite;\r\n  animation: dots 1s steps(5, end) infinite;\r\n}\r\n/************End of Loader******************/\r\n.nsListRenderer \r\n{\r\n\toverflow:hidden;\r\n\ttext-align: left;\r\n}\r\n\r\n/************For making an element resizable and draggable ***********/\r\n.nsHiddenDiv {\r\n    background: #999;\r\n    opacity: 0;\r\n    position: absolute;\r\n    margin: 0;\r\n    padding: 0;\r\n    z-index: 98;\r\n    -webkit-transition: all 0.25s ease-in-out;\r\n    -moz-transition: all 0.25s ease-in-out;\r\n    -ms-transition: all 0.25s ease-in-out;\r\n    -o-transition: all 0.25s ease-in-out;\r\n    transition: all 0.25s ease-in-out;\r\n}\r\n\r\n.nsTextHighlight{\r\n    color:#CA2420;\r\n    font-weight:bold;\r\n    font-size:105%;\r\n}\r\n\r\n/************For making an row of table Draggable ***********/\r\n.nsDraggableRow{\r\n}\r\n.nsDraggableRow.nsDraggableRowDrag\r\n{\r\n\tcursor: move;\t\r\n}\r\n.nsDraggableCloneRow{\r\n    background: #FFF;\r\n    position: absolute;\r\n}\r\n.nsDraggableCloneRow > table {\r\n\tborder-collapse: collapse;\r\n}\r\n\r\n.nsDraggableCloneRow > table,.nsDraggableCloneRow > th,.nsDraggableCloneRow > td {\r\n\tborder: 1px solid black;\r\n}\r\n.nsDraggingRow {\r\n    box-shadow:3px 5px 6px -4px rgba(0,0,0,0.8);\r\n}\r\n.nsDraggingRow > td {\r\n     position:relative;\r\n     z-index: 9999;\r\n}\r\n.nsDraggingRow > td:first-child::before {\r\n\tborder-top-left-radius:5px;\r\n\tborder-bottom-left-radius:5px;\r\n}\r\n.nsDraggingRow > td:last-child::before {\r\n\tborder-top-right-radius:5px;\r\n\tborder-bottom-right-radius:5px;\r\n}\r\n.nsDraggingRow > td::before {\r\n   \tbackground-color:white;\r\n   \tbox-shadow:3px 5px 6px -4px rgba(0,0,0,0.8);\r\n    display:block;\r\n    padding:0 9px 0 0;\r\n    content:'';\r\n    position:absolute;\r\n    left:0;\r\n    top:0;\r\n    z-index:-1;\r\n    width:100%;\r\n    height:100%;\r\n}\r\n.nsDottedRow > td:first-child \r\n{\r\n    border-left: 2px dotted red!important;\r\n}\r\n.nsDottedRow > td\r\n{\r\n    border-top: 2px dotted red!important;\r\n    border-bottom: 2px dotted red!important;\r\n}\r\n.nsDottedRow > td:last-child \r\n{\r\n    border-right: 2px dotted red!important;\r\n}\r\n.nsTableRowMoverGhost {\r\n    background: #e5e5e5;\r\n    border: 1px solid black;\r\n    cursor: move;\r\n    font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\r\n    font-size: 14px;\r\n    line-height: 1.4;\r\n    overflow: hidden;\r\n    padding: 3px;\r\n    position: absolute;\r\n    text-overflow: ellipsis;\r\n    -webkit-user-select: none;\r\n    -moz-user-select: none;\r\n    -ms-user-select: none;\r\n    user-select: none;\r\n    background: white;\r\n    border-radius: 2px;\r\n    box-shadow: none;\r\n    padding: 4px;\r\n    border: 1px solid #BDC3C7;\r\n    color: rgba(0, 0, 0, 0.54);\r\n    font-weight: 600;\r\n    font-size: 12px;\r\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\r\n    height: 32px !important;\r\n    line-height: 32px;\r\n    margin: 0;\r\n    padding: 0 8px;\r\n    transform: translateY(8px);\r\n    z-index: 10000;\r\n}\r\n.nsTableRowMoverAnimation {\r\n\tposition: absolute;\r\n    -webkit-transition: top 0.4s, height 0.4s, background-color 0.1s, opacity 0.2s, -webkit-transform 0.4s;\r\n    transition: top 0.4s, height 0.4s, background-color 0.1s, opacity 0.2s, -webkit-transform 0.4s;\r\n    transition: transform 0.4s, top 0.4s, height 0.4s, background-color 0.1s, opacity 0.2s;\r\n    transition: transform 0.4s, top 0.4s, height 0.4s, background-color 0.1s, opacity 0.2s, -webkit-transform 0.4s;\r\n}\r\n\r\n/*********************NSPopUp CSS **********************/\r\n.nsPopUp {\r\n  position: absolute;\r\n  width: 200px;\r\n  padding: 2px;\r\n  margin: 0;\r\n  background-color: #fefefe;\r\n  border: solid thin #1e4691;\r\n  z-index: 999;\r\n  border-radius: 5px;\r\n  box-shadow: 1px 1px 4px rgba(0,0,0,.2);\r\n  opacity: 0;\r\n  -webkit-transform: translate(0, 15px) scale(.95);\r\n  transform: translate(0, 15px) scale(.95);\r\n  transition: transform 0.1s ease-out, opacity 0.1s ease-out;\r\n  pointer-events: none;\r\n  display: none;\r\n}\r\n\r\n.nsPopUp.nsShowPopUp {\r\n  opacity: 1!important;\r\n  -webkit-transform: translate(0, 0) scale(1);\r\n  transform: translate(0, 0) scale(1)!important;\r\n  pointer-events: auto!important;\r\n  display: block;\r\n}\r\n\r\n.nsPopUp .nsPopUpHeader\r\n{\r\n\toutline: none;\r\n\tborder-bottom: 1px solid rgb(218, 222, 224);\r\n\twidth: 100%;\r\n}\r\n\r\n.nsPopUp .nsPopUpHeaderContainer\r\n{\r\n    padding: 0;\r\n\twhite-space: nowrap;\r\n\twidth: 100%;\r\n\tmin-height:30px;\r\n\tbox-sizing: content-box;\r\n\tbackground: transparent;\r\n    -webkit-font-smoothing: antialiased;\r\n    cursor: default;\r\n    background-color: rgb(255, 255, 255);\r\n    white-space: normal;\r\n    -webkit-appearance: none;\r\n    overflow: hidden;\r\n    border-width: 0px;\r\n    border-style: solid;\r\n    border-color: rgb(218, 222, 224);\r\n    border-image: initial;\r\n}\r\n\r\n.nsPopUp .nsPopUpTitleContainer\r\n{\r\n\theight:calc(100% - 1px);\r\n\twidth:calc(100% - 40px);\r\n\tdisplay: inline-block;\r\n    vertical-align: top;\r\n    border-width: 0px;\r\n    margin-top: 0px;\r\n    box-sizing: content-box;\r\n    letter-spacing: 0px;\r\n}\r\n\r\n.nsPopUp .nsPopUpTitle\r\n{\r\n\tfont-weight: bold;\r\n\tpadding-top: 0px;\r\n    padding-bottom: 0px;\r\n\tpadding-left: 12px;\r\n\theight: 100%;\r\n    box-sizing: border-box;\r\n    padding: 4px 12px;\r\n}\r\n\r\n.nsPopUp .nsPopUpCloseContainer\r\n{\r\n\tdisplay: inline-block;\r\n    vertical-align: top;\r\n\tbox-sizing: border-box;\r\n    height:calc(100% - 1px);\r\n    width:40px;\r\n    padding: 3px 2px;\r\n    overflow: hidden;\r\n\ttext-align: center;\r\n    position: relative;\r\n    cursor: pointer;\r\n    padding: 0px;\r\n    margin: 0px auto;\r\n    overflow: visible;\r\n}\r\n\r\n.nsPopUp .nsPopUpBtnClose\r\n{\r\n\theight: 100%;\r\n    width: 100%;\r\n    border-width: 0px;\r\n    position: relative;\r\n    z-index: 0;\r\n    background-color: transparent;\r\n    border: none;\r\n    cursor: pointer;\r\n    vertical-align: middle;\r\n    padding: 0px;\r\n}\r\n\r\n.nsPopUp .nsPopUpBtnClose::before\r\n{\r\n\tcontent: \"\";\r\n    opacity: 0;\r\n    position: absolute;\r\n    transition-duration: 0.15s;\r\n    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\r\n    z-index: -1;\r\n    bottom: 0px;\r\n    left: 0px;\r\n    right: 0px;\r\n    top: 0px;\r\n    transform: scale(0);\r\n    transition-property: transform, opacity;\r\n    border-radius: 50%;\r\n}\r\n\r\n.nsPopUp .nsPopUpClose\r\n{\r\n\tfont-size: 20px;\r\n    height: 20px;\r\n    width: 20px;\r\n    display: inline-block;\r\n    text-align: center;\r\n    color: rgb(148, 161, 179);\r\n}\r\n\r\n.nsPopUp .nsPopUpClose::before\r\n{\r\n\tdisplay: inline-block;\r\n  \tcontent: \"\\00d7\";\r\n  \tfont-weight: 300;\r\n  \tfont-family: Arial, sans-serif;\r\n}\r\n\r\n\r\n\r\n/************For adding tooltip to an element ***********/\r\n.nsElementTooltipContainer\r\n{\r\n\tmin-width: 100px; \r\n\tpadding: 10px 12px; \r\n\topacity: 0; \r\n\tdisplay:none;\r\n\tz-index: 99999; \r\n\tposition: absolute; \r\n\tmargin-left: 0px;\r\n\tmargin-top: 30px; \r\n\tfont-size: 12px; \r\n\tfont-style: normal; \r\n\t-webkit-border-radius: 3px; \r\n\t-moz-border-radius: 3px; -o-border-radius: 3px; \r\n\tborder-radius: 3px; \r\n\t-webkit-box-shadow: 4px 4px 4px #d9b3c3; \r\n\t-moz-box-shadow: 4px 4px 4px #d9b3c3; \r\n\tbox-shadow: 4px 4px 4px #d9b3c3; \r\n\tcolor: #000000; \r\n\tbackground: #f4f4f4; \r\n\tbackground: -moz-linear-gradient(top, #FBF5E6 0%, #FFFFFF 100%); \r\n\tbackground: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#FBF5E6), color-stop(100%,#FFFFFF)); \r\n\tfilter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#FBF5E6', endColorstr='#FFFFFF',GradientType=0 ); \r\n\tborder: 1px solid #8c8c8c; \r\n} \r\n\r\n\r\n.nsElementTooltipContainerVisible\r\n{ \r\n\tdisplay: inline; \r\n\tborder: 1px solid #8c8c8c; \r\n\tbackground: #f4f4f4;\r\n\topacity: 1; \r\n\ttext-decoration:none;\r\n\toverflow: visible; \r\n}\r\n\r\n.nsElementTooltipContainer .nsElementTooltipTipArrow\r\n{ \t\r\n\twidth: 15px; \r\n\theight: 15px; \r\n\tmargin-left: 5%; \r\n\tmargin-top: -19px; \r\n\tdisplay: block; \r\n\tposition: absolute; \r\n\t-webkit-transform: rotate(-45deg); \r\n\t-moz-transform: rotate(-45deg); \r\n\t-o-transform: rotate(-45deg); \r\n\ttransform: rotate(-45deg); \r\n\t-webkit-box-shadow: inset -1px 1px 0 #fff; \r\n\t-moz-box-shadow: inset 0 1px 0 #fff; -o-box-shadow: inset 0 1px 0 #fff; \r\n\tbox-shadow: inset 0 1px 0 #fff; \r\n\tbackground: #f4f4f4; \r\n\tborder-top: 1px solid #8c8c8c; \r\n\tborder-right: 1px solid #8c8c8c; \t \r\n}\r\n\r\n/************************ Custom Buttons ********************************/\r\n.nsButton {\r\nbackground-color: #4CAF50;\r\nborder: none;\r\ncolor: #FFFFFF;\r\npadding: 15px 15px;\r\ntext-align: center;\t\r\n-webkit-transition-duration: 0.4s; /* Safari */\r\ntransition-duration: 0.4s;\r\nmargin: 2px;\r\ntext-decoration: none;\r\nfont-size:16px;\r\n}\r\n.nsButtonGreen{border-radius:3px;background-color:#4CAF50;color:white;border: 2px solid #4CAF50;}\r\n.nsButtonBlue{border-radius:3px;background-color:#008CBA;color:white;border:2px solid #008CBA;}\r\n.nsButtonRed {border-radius:3px;background-color:#f44336;color:white;border:2px solid #f44336;}\r\n.nsButtonGrey {border-radius:3px;background-color:#A9A9A9;border:2px solid #A9A9A9;}\r\n.nsButtonOrange {border-radius:3px;background-color:#f0ad4e;border:2px solid #f0ad4e;}\r\n\r\n.nsButtonGreen:hover {background-color:white;color:black;border:2px solid #4CAF50;}\r\n.nsButtonBlue:hover {background-color:white;color:black;border:2px solid #008CBA;}\r\n.nsButtonRed:hover {background-color:white;color:black;border:2px solid #f44336;}\r\n.nsButtonGrey:hover {background-color:white;color:black;border:2px solid #e7e7e7;}\r\n.nsButtonOrange:hover {background-color:white;color:black;border:2px solid #f0ad4e;}\r\n\r\n.nsButtonShadow:hover{box-shadow:0 12px 16px 0 rgba(0,0,0,0.24),0 17px 50px 0 rgba(0,0,0,0.19) !important;}\r\n.nsButtonDisabled{cursor: not-allowed;opacity: 0.6;}\r\n\r\n.nsButtonFont10 {font-size:10px;padding: 4px 4px;}\r\n.nsButtonFont12 {font-size:12px;padding: 6px 6px;}\r\n.nsButtonFont14 {font-size:14px;padding: 8px 8px;}\r\n.nsButtonFont16 {font-size:16px;padding: 8px 8px;}\r\n.nsButtonFont18 {font-size:18px;padding: 9px 9px;}\r\n.nsButtonFont20 {font-size:20px;padding: 10px 10px;}\r\n.nsButtonFont24 {font-size:24px;padding: 10px 10px;}\r\n\r\n/************************ SearchTextBox ********************************/\r\n.nsSearchTextBoxWrapper {\r\n    display: block;\r\n    float: left;\r\n    margin-bottom: 5px;\r\n    border-width: 1px;\r\n    border-style: solid;\r\n\tborder-color: #989898;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchInput {\r\n    float: left;\r\n    height: 20px;\r\n    width: calc(100% - 20px);\r\n    border: 1px none;\r\n    padding: 0;\r\n    text-indent: 2px;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIconWrapper,.nsSearchTextBoxWrapper .nsSearchIconWrapper:hover {\r\n    float: right;\r\n    height: 20px;\r\n    width: 11%;\r\n    display: block;\r\n    border-width: 0 0 0 1px;\r\n    border-style: solid;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIconWrapper {\r\n    border-color: #989898;\r\n    background-color: #e6e6e6;\r\n    width:20px;\r\n\tmax-width:20px;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIconWrapper:hover {\r\n     border-color: black;\r\n     background-color: #d3d3d3;\r\n     width:20px;\r\n\t max-width:20px;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIconParent > * {\r\n    padding:1px;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIcon\r\n{\r\n \twidth:14px;\r\n \theight:14px;\r\n}\r\n.nsSearchTextBoxWrapper .nsSearchIcon:hover\r\n{\r\n\tfill:red;\r\n}\r\n\r\n.nsSearchInlineTextBox \r\n{\r\n    background: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDYxNS41MiA2MTUuNTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYxNS41MiA2MTUuNTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8Zz4KCQk8ZyBpZD0iU2VhcmNoX194MjhfYW5kX3Rob3Vfc2hhbGxfZmluZF94MjlfIj4KCQkJPGc+CgkJCQk8cGF0aCBkPSJNNjAyLjUzMSw1NDkuNzM2bC0xODQuMzEtMTg1LjM2OGMyNi42NzktMzcuNzIsNDIuNTI4LTgzLjcyOSw0Mi41MjgtMTMzLjU0OEM0NjAuNzUsMTAzLjM1LDM1Ny45OTcsMCwyMzEuMjU4LDAgICAgICBDMTA0LjUxOCwwLDEuNzY1LDEwMy4zNSwxLjc2NSwyMzAuODJjMCwxMjcuNDcsMTAyLjc1MywyMzAuODIsMjI5LjQ5MywyMzAuODJjNDkuNTMsMCw5NS4yNzEtMTUuOTQ0LDEzMi43OC00Mi43NzcgICAgICBsMTg0LjMxLDE4NS4zNjZjNy40ODIsNy41MjEsMTcuMjkyLDExLjI5MSwyNy4xMDIsMTEuMjkxYzkuODEyLDAsMTkuNjItMy43NywyNy4wODMtMTEuMjkxICAgICAgQzYxNy40OTYsNTg5LjE4OCw2MTcuNDk2LDU2NC43NzcsNjAyLjUzMSw1NDkuNzM2eiBNMzU1LjksMzE5Ljc2M2wtMTUuMDQyLDIxLjI3M0wzMTkuNywzNTYuMTc0ICAgICAgYy0yNi4wODMsMTguNjU4LTU2LjY2NywyOC41MjYtODguNDQyLDI4LjUyNmMtODQuMzY1LDAtMTUyLjk5NS02OS4wMzUtMTUyLjk5NS0xNTMuODhjMC04NC44NDYsNjguNjMtMTUzLjg4LDE1Mi45OTUtMTUzLjg4ICAgICAgczE1Mi45OTYsNjkuMDM0LDE1Mi45OTYsMTUzLjg4QzM4NC4yNzEsMjYyLjc2OSwzNzQuNDYyLDI5My41MjYsMzU1LjksMzE5Ljc2M3oiIGZpbGw9IiMwMDAwMDAiLz4KCQkJPC9nPgoJCTwvZz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K) no-repeat 4px 2px #FFF;\r\n    min-height: 20px !important;\r\n    border: 1px solid #848484;\r\n\tborder-radius:2px;\r\n\tpadding-left:24px !important;\r\n\t-webkit-transition: all 0.3s ease-out;\r\n    -moz-transition: all 0.3s ease-out;\r\n    -ms-transition: all 0.3s ease-out;\r\n    -o-transition: all 0.3s ease-out;\r\n    transition: all 0.3s ease-out;\r\n    width:100%;\r\n}\r\n.nsSearchInlineTextBox:focus {\r\n    background-color: yellow;\r\n\t color: #414848;\r\n    outline: 0;\r\n\t-moz-box-shadow: 0 0 5px #51cbee;\r\n\t-webkit-box-shadow: 0 0 5px #51cbee;\r\n\tbox-shadow: 0 0 5px #51cbee;\r\n}\r\n/************************End of SearchTextBox ********************************/\r\n\r\n\r\n.nsNodeDragEnabled:hover\r\n{\r\n\tcursor:pointer;\r\n}\r\n.nsDraggableCloneItem\r\n{\r\n    position: absolute;\r\n    zIndex: 999;\r\n}\r\n.nsDraggablePlaceholder\r\n{\r\n\tborder:1px dashed darkgrey;\r\n\tbox-sizing:border-box;\r\n\tbackground-color:#dbdbdb!important;\r\n}\r\n.nsNodeDragHover\r\n{\r\n\tbackground-color:red!important;\r\n}\r\n.nsNodeDraggingClass\r\n{\r\n\topacity:0.5;\r\n}\r\n\r\n.nsAnimateGhost\r\n{\r\n    -webkit-transition: all 0.5s ease-in-out;\r\n    -moz-transition: all 0.5s ease-in-out;\r\n    -o-transition: all 0.5s ease-in-out;\r\n    -ms-transition: all 0.5s ease-in-out;\r\n    transition: all 0.5s ease-in-out;\r\n}\r\n\r\n/************************Start of Table Cell Selector********************************/\r\n.nsSelectionTable tr.nsArea-top > td.nsArea{\r\n  border-top: 2px solid #5292F7;\r\n}\r\n.nsSelectionTable tr.nsArea-bottom > td.nsArea{\r\n  border-bottom: 2px solid #5292F7;\r\n}\r\n.nsSelectionTable td.nsArea.nsArea-left{\r\n  border-left: 2px solid #5292F7;\r\n}\r\n.nsSelectionTable td.nsArea.nsArea-right{\r\n  border-right: 2px solid #5292F7;\r\n}\r\n.nsSelectionTable td.nsArea.nsCell,\r\n.nsSelectionTable td.nsCell{\r\n  border-right: 2px solid #5292F7;\r\n  background: #FAFAFF;\r\n}\r\n.nsSelectionTable.focus td.nsArea.nsCell,\r\n.nsSelectionTable.focus td.nsCell{\r\n  background: #FAFAFF;\r\n  border-right: 2px solid #5292F7;\r\n}\r\n.nsSelectionTable td.nsArea{\r\n\tbackground: #ECF3FF;\r\n}\r\n\r\n.nsTextAreaEditor\r\n{\r\n\tz-index:10000;\r\n\tposition:absolute;\r\n\tbackground:white;\r\n\tpadding:5px;\r\n\tborder:3px solid gray; \r\n\t-moz-border-radius:10px; \r\n\tborder-radius:10px;\r\n}\r\n.nsTextAreaEditor .nsTextArea\r\n{\r\n\tbackround:white;\r\n\twidth:250px;\r\n\theight:80px;\r\n\tborder:0;\r\n\toutline:0;\r\n}\r\n\r\n.nsTextEditor \r\n{\r\n    width: 100%;\r\n    height: 100%;\r\n    /*border: 0;\r\n    margin: 0;\r\n    background: transparent;\r\n    outline: 0;\r\n    padding: 0;*/\r\n    line-height: normal;\r\n    border: 1px solid #95a5a6;\r\n}\r\n/************************End of Table Cell Selector********************************/\r\n/************************Start of Mobile Webkit scrollbar css********************************/\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar {\r\n    width: 15px;\r\n    height: 15px;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb {\r\n    background-color: #c2c2c2;\r\n    border-radius: 10px;\r\n    background-clip: content-box;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb:hover {\r\n    background-color: #7d7d7d;\r\n    border-radius: 10px;\r\n    background-clip: content-box;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb:vertical,.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb:vertical:hover {\r\n    border: 3px solid transparent;\r\n    border-left-width: 4px;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb:horizontal,.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-thumb:horizontal:hover {\r\n    border: 3px solid transparent;\r\n    border-top: 4px solid transparent;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-track {\r\n    background-color: #fafafa;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-track:vertical {\r\n    border-left: 1px solid #e8e8e8;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-track:horizontal {\r\n    border-top: 1px solid #e8e8e8;\r\n}\r\n\r\n.nsContainerMobile:not(.nsContainerMobileBlack) ::-webkit-scrollbar-corner {\r\n    background-color: #fafafa;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar {\r\n    width: 15px;\r\n    height: 15px;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb {\r\n    background-color: #6b6b6b;\r\n    border-radius: 10px;\r\n    background-clip: content-box;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb:hover {\r\n    background-color: #959595;\r\n    border-radius: 10px;\r\n    background-clip: content-box;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb:vertical,.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb:vertical:hover {\r\n    border: 3px solid transparent;\r\n    border-left-width: 4px;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb:horizontal,.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-thumb:horizontal:hover {\r\n    border: 3px solid transparent;\r\n    border-top: 4px solid transparent;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-track {\r\n    background-color: #1c1f20;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-track:vertical {\r\n    border-left: 1px solid #424242;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-track:horizontal {\r\n    border-top: 1px solid #424242;\r\n}\r\n\r\n.nsContainerMobile.nsContainerMobileBlack ::-webkit-scrollbar-corner {\r\n    background-color: #1c1f20;\r\n}\r\n/************************end of Mobile Webkit scrollbar css********************************/\r\n\r\n.nsAnimateSpin {\r\n    animation: nsAnimateSpin 2s infinite linear;\r\n}\r\n\r\n@keyframes nsAnimateSpin {\r\n    0% {\r\n        transform: rotate(0deg);\r\n    }\r\n\r\n    100% {\r\n        transform: rotate(359deg);\r\n    }\r\n}\r\n\r\n.nsAnimateFading {\r\n    animation: nsAnimateFading 10s infinite;\r\n}\r\n\r\n@keyframes nsAnimateFading {\r\n    0% {\r\n        opacity: 0;\r\n    }\r\n\r\n    50% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n    }\r\n}\r\n\r\n.nsAnimateOpacity {\r\n    animation: nsAnimateOpacity 0.8s;\r\n}\r\n\r\n@keyframes nsAnimateOpacity {\r\n    from {\r\n        opacity: 0;\r\n    }\r\n\r\n    to {\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n.nsAnimateTop {\r\n    position: relative;\r\n    animation: nsAnimateTop 0.4s;\r\n}\r\n\r\n@keyframes nsAnimateTop {\r\n    from {\r\n        top: -300px;\r\n        opacity: 0;\r\n    }\r\n\r\n    to {\r\n        top: 0;\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n.nsAnimateLeft {\r\n    position: relative;\r\n    animation: nsAnimateLeft 0.4s;\r\n}\r\n\r\n@keyframes nsAnimateLeft {\r\n    from {\r\n        left: -300px;\r\n        opacity: 0;\r\n    }\r\n\r\n    to {\r\n        left: 0;\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n.nsAnimateRight {\r\n    position: relative;\r\n    animation: nsAnimateRight 0.4s\r\n}\r\n\r\n@keyframes nsAnimateRight {\r\n    from {\r\n        right: -300px;\r\n        opacity: 0;\r\n    }\r\n\r\n    to {\r\n        right: 0;\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n.nsAnimateBottom {\r\n    position: relative;\r\n    animation: nsAnimateBottom 0.4s;\r\n}\r\n\r\n@keyframes nsAnimateBottom {\r\n    from {\r\n        bottom: -300px;\r\n        opacity: 0;\r\n    }\r\n\r\n    to {\r\n        bottom: 0;\r\n        opacity: 1;\r\n    }\r\n}\r\n\r\n.nsAnimateZoom {\r\n    animation: nsAnimateZoom 0.6s;\r\n}\r\n\r\n@keyframes nsAnimateZoom {\r\n    from {\r\n        transform: scale(0);\r\n    }\r\n\r\n    to {\r\n        transform: scale(1);\r\n    }\r\n}\r\n\r\n/******For nsResizableTable *******/\r\n.nsResizableTable .nsResizableTableColumn\r\n{\r\n\tposition: relative;;\r\n}\r\n.nsResizableTable .nsColumnResizer\r\n{\r\n\tposition: absolute;\r\n\ttop: 0;\r\n  \tright: 0;\r\n  \twidth: 5px;\r\n  \tcursor: col-resize;\r\n  \t-webkit-user-select: none; /* Safari */\r\n  \t-ms-user-select: none; /* IE 10 and IE 11 */\r\n  \tuser-select: none; \r\n}\r\n.nsResizableTable .nsColumnResizer.nsColumnResizerMoving\r\n{\r\n\tborder-right: 2px solid #0000ff;\r\n}\r\n\r\n\r\n/******end of nsResizableTable *******/";
styleInject(css_248z$9);

var css_248z$8 = ".nsDataGridContainer\r\n{\r\n\twidth:100%;\r\n\theight:100%;\r\n\tposition: relative;\r\n    border-radius: 2px;\r\n    /* donot add it as the footer is not visible when overflow is hidden*/\r\n    /*overflow: hidden!important;*/\r\n}\r\n.nsDataGridContainer .nsDataGridTable\r\n{\r\n    width: 100%;\r\n    border: 0px;\r\n\tmargin: 0px;\r\n\tpadding: 0px;\r\n\tborder-collapse: separate;\r\n\tborder-spacing: 0px;\r\n    table-layout: fixed;\r\n}\r\n.nsDataGridContainer .nsDataGridTitleBar\r\n{\r\n   position: relative;\r\n   overflow: hidden;\r\n   border-top-left-radius: 2px;\r\n   border-top-right-radius: 2px;\r\n   border-collapse: separate;\r\n}\r\n.nsDataGridContainer .nsDataGridExport\r\n{\r\n\tfloat: right;\r\n}\r\n.nsDataGridContainer .nsTableWrapper\r\n{\r\n    position: relative;\r\n}\r\n.nsDataGridContainer .nsGridHeaderContainer\r\n{\r\n\tposition: relative;\r\n}\r\n\r\n.nsDataGridContainer .nsGridFooterContainer\r\n{\r\n\tposition: relative;\r\n}\r\n.nsDataGridContainer .nsHeaderBarCorner \r\n{\r\n    position: absolute;\r\n    bottom: 0;\r\n    right: 0;\r\n    width: 16px;\r\n    height: 100%;\r\n    z-index: 2;\r\n}\r\n.nsDataGridContainer .nsFooterBarCorner \r\n{\r\n    position: absolute;\r\n    top: 0;\r\n    right: 0;\r\n    width: 16px;\r\n    height: calc(100% - 16px);\r\n    z-index: 2;\r\n}\r\n.nsDataGridContainer .nsDataGridHeaderContainer\r\n{\r\n\toverflow: hidden; \r\n}\r\n.nsDataGridContainer .nsDataGridFooterContainer\r\n{\r\n\toverflow-y: hidden; \r\n\toverflow-x: auto;\r\n}\r\n.nsDataGridHeader\r\n{\r\n  height: 0px;\r\n  margin: 0px;\r\n  overflow:hidden;\r\n  padding-right: 0px;\r\n}\r\n.nsDataGridFooter\r\n{\r\n  margin: 0px;\r\n  overflow:hidden;\r\n}\r\n.nsDataGridContainer .nsDataGridHeaderRenderer\r\n{\r\n  margin: 0px;\r\n  overflow:hidden;\r\n}\r\n.nsDataGridHeaderCellContainer\r\n{\r\n  position:relative;\r\n  overflow:hidden;\r\n  align:center;\r\n  display: -webkit-box;           /* OLD - iOS 6-, Safari 3.1-6 */\r\n  display: -moz-box;              /* OLD - Firefox 19- (doesn't work very well) */\r\n  display: -ms-flexbox;           /* TWEENER - IE 10 */\r\n  display: -webkit-flex;          /* NEW - Chrome */\r\n  display: flex;               /* NEW, Spec - Opera 12.1, Firefox 20+ */\r\n  align-items:center;\r\n  vertical-align:middle;\r\n  height: 100%;\r\n  min-height: 100%;\r\n}\r\n.nsDataGridHeaderCellContainer > *\r\n{\r\n\tpadding:5px 0px 5px 5px;\r\n\tvertical-align:middle;\r\n}\r\n.nsGhostHeader\r\n{\r\n    -webkit-transition: all 0.5s ease-in-out;\r\n    -moz-transition: all 0.5s ease-in-out;\r\n    -o-transition: all 0.5s ease-in-out;\r\n    -ms-transition: all 0.5s ease-in-out;\r\n    transition: all 0.5s ease-in-out;\r\n}\r\n.nsHeaderMove\r\n{\r\n\tcursor:move;\r\n}\r\n.nsHeaderText\r\n{\r\n\ttext-align:center;\r\n\tword-break: break-all;\r\n}\r\n.nsHeaderSortContainer\r\n{\r\n\ttext-align:center;\r\n\tword-break: break-all;\r\n\tfont-weight: bold;\r\n}\r\n.nsSortAsc \r\n{\r\n\twidth: 0; \r\n\theight: 0; \r\n\tborder-left: 5px solid transparent;\r\n\tborder-right: 5px solid transparent;\r\n\tborder-bottom: 5px solid black;\r\n}\r\n.nsSortAsc:hover\r\n{\r\n\tborder-bottom: 5px solid red;\r\n}\r\n.nsSortSpacer\r\n{\r\n\tmargin-top:2px;\r\n}\r\n.nsSortDesc \r\n{\r\n\twidth: 0; \r\n\theight: 0; \r\n\tborder-left: 5px solid transparent;\r\n\tborder-right: 5px solid transparent;\r\n\tborder-top: 5px solid black;\r\n}\r\n.nsSortDesc:hover\r\n{\r\n\tborder-top: 5px solid red;\r\n}\r\n.nsMenuArrowSVG\r\n{\r\n    width:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsFilterContainer\r\n{\r\n  padding: 3px 5px;\r\n  overflow:hidden;\r\n  align:center;\r\n  display: -webkit-box;           /* OLD - iOS 6-, Safari 3.1-6 */\r\n  display: -moz-box;              /* OLD - Firefox 19- (doesn't work very well) */\r\n  display: -ms-flexbox;           /* TWEENER - IE 10 */\r\n  display: -webkit-flex;          /* NEW - Chrome */\r\n  display: flex;               /* NEW, Spec - Opera 12.1, Firefox 20+ */\r\n  align-items:center;\r\n  vertical-align:middle;\r\n  display: inline-block;\r\n  width: 96%;\r\n  padding-top: 0px;\r\n}\r\n.nsDataGridContainer .nsAdvancedFilterParentContainer .nsFilterContainer\r\n{\r\n\twidth: calc(100% - 26px);\r\n}\r\n.nsDataGridContainer .nsFilter\r\n{\r\n  display: table-cell;\r\n  vertical-align: middle;\r\n  padding-left: 5px;\r\n  margin-right: 2px;\r\n  width: 100%;\r\n}\r\n.nsDataGridContainer .nsFilterIconContainer\r\n{\r\n\tdisplay: inline-block;\r\n\tvertical-align:top;\r\n\tpadding-top:3px;\r\n\tcursor:pointer;\r\n}\r\n.nsDataGridContainer .nsCenterContainer \r\n{\r\n    position: relative;\r\n    overflow: hidden;\r\n    top:0;\r\n    left:0;\r\n}\r\n.nsDataGridContainer .nsDataGridBodyContainer\r\n{\r\n\toverflow:auto;\r\n\t-webkit-overflow-scrolling: touch;\r\n}\r\n.nsDataGridContainer .nsDataGridBodyContainerWithFooter\r\n{\r\n\toverflow-x:hidden !important;\r\n}\r\n/*.nsDataGridContainer .nsDataGridBodyContainerVirtual\r\n{\r\n\tfloat:left;\r\n\toverflow-y:hidden;\r\n\twidth:97%;\r\n\twidth: -webkit-calc(100% - 18px);\r\n\twidth: -moz-calc(100% - 18px);\r\n\twidth: -o-calc(100% - 18px);\r\n\twidth: calc(100% - 18px);\r\n}*/\r\n.nsDataGridContainer .nsBodyDataGridCell\r\n{\r\n    cursor : default;\r\n    padding:0px;\r\n    word-break: break-all;\r\n}\r\n.nsDataGridContainer .nsFixedDataGridCell\r\n{\r\n\t/*position: relative;\r\n\tz-index: 1;*/\r\n\tposition: -webkit-sticky !important;\r\n    position: sticky !important;\r\n    z-index: 2;\r\n    background-color: rgb(251, 251, 251);\r\n}\r\n.nsDataGridContainer .nsFixedLeftLastCell\r\n{\r\n\tborder-right: 1px solid !important;\r\n}\r\n.nsDataGridContainer .nsFixedRightFirstCell\r\n{\r\n\tborder-left: 1px solid !important;\r\n}\r\n.nsDataGridContainer .nsFixedDataGridCellAnimate\r\n{\r\n\t-webkit-transition: left 0.2s, right 0.2s;\r\n\t-moz-transition: left 0.2s, right 0.2s;\r\n\t-ms-transition: left 0.2s, right 0.2s;\r\n\t-o-transition: left 0.2s, right 0.2s;\r\n\ttransition: left 0.2s, right 0.2s;\r\n}\r\n.nsDataGridContainer .nsCellChild \r\n{\r\n  \twidth:100%;\r\n  \theight: calc(100% - 0px);\r\n}\r\n.nsDataGridContainer .nsGroupCell \r\n{\r\n  position: relative;\r\n  overflow: hidden;\r\n  min-height: 19px;\r\n}\r\n.nsDataGridContainer .nsMasterDetailGridContainer\r\n{\r\n  padding: 20px;\r\n}\r\n.nsGroupCell > * \r\n{\r\n    display: inline-block;\r\n}\r\n.nsDataGridContainer .nsArrowParent\r\n{\r\n\tposition: absolute;\r\n    top: 5px;\r\n    left:5px;\r\n    cursor:pointer;\r\n}\r\n.nsDataGridContainer .nsGroupCellText\r\n{\r\n\tpadding-left: 2em;\r\n}\r\n.nsResizeHandleActive\r\n{\r\n\t/*cursor: e-resize;*/\r\n}\r\n.nsDataGridContainer .nsColumnResizeIndicator\r\n{\r\n    position: absolute;\r\n    width: 5px;\r\n    height: 100%;\r\n    right: 0;\r\n    top: 0;\r\n    display: block;\r\n    cursor: col-resize;\r\n  \tz-index: 5;\r\n  \tuser-select: none;\r\n}\r\n.nsResizeHandle \r\n{\r\n\tcursor: col-resize;\r\n\twidth: 2px;\r\n\tposition:absolute;\r\n\ttop:0;\r\n\tleft:0;\r\n/* \tbackground-color: transparent!important; */\r\n\tz-index: 1000;\r\n}\r\n.nsDataGridContainer .nsGridArrowFill \r\n{\r\n\twidth:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsGridGroupSVG\r\n{\r\n    width:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsExportIcon\r\n{\r\n \twidth:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsColumnSetting\r\n{\r\n \twidth:16px;\r\n\theight:16px;\r\n}\r\n.nsMoveIcon\r\n{\r\n \twidth:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsNoRecordsFound \r\n{\r\n    text-align: center;\r\n}\r\n.nsDataGridContainer .nsTruncateToFit,.nsDataGridContainer .nsTruncateToFit *\r\n{\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n.nsDataGridContainer .nsAnimateLeftToRight \r\n{\r\n\t  -webkit-animation-name: nsAnimateLeftToRight;\r\n\t  -moz-animation-name: nsAnimateLeftToRight;\r\n\t  -o-animation-name: nsAnimateLeftToRight;\r\n\t  -ms-animation-name: nsAnimateLeftToRight;\r\n\t  animation-name: nsAnimateLeftToRight;\r\n\t  -webkit-animation-duration: 0.2s;\r\n\t  -moz-animation-duration: 0.2s;\r\n\t  -o-animation-duration: 0.2s;\r\n\t  -ms-animation-duration: 0.2s;\r\n\t  animation-duration: 0.2s;\r\n\t  -webkit-animation-iteration-count: infinite;\r\n\t  -moz-animation-iteration-count: infinite;\r\n\t  -o-animation-iteration-count: infinite;\r\n\t  -ms-animation-iteration-count: infinite;\r\n\t  animation-iteration-count: infinite;\r\n\t  -webkit-animation-direction: alternate;\r\n\t  -moz-animation-direction: alternate;\r\n\t  -o-animation-direction: alternate;\r\n\t  -ms-animation-direction: alternate;\r\n\t  animation-direction: alternate;\r\n } \r\n.nsDataGridContainer .nsGridScrollerCauseParent\r\n{\r\n\toverflow-x:hidden;\r\n\toverflow-y:scroll;\r\n\t-webkit-overflow-scrolling: touch;\r\n\twidth:18px;\r\n\tmax-width:18px;\r\n}\r\n.nsDataGridContainer .nsFilterSelect\r\n{\r\n    margin: 4px 4px 0px 4px;\r\n    width: 96%;\r\n}\r\n.nsDataGridContainer .nsSearchTextBoxWrapper\r\n{\r\n\tmargin: 4px;\r\n}\r\n.nsDataGridContainer .nsFilterButtonDiv\r\n{\r\n  padding: 2px;\r\n  text-align: center;\r\n}\r\n.nsDataGridContainer .nsFilterIconSVG\r\n{\r\n    width:16px;\r\n\theight:16px;\r\n}\r\n.nsDataGridContainer .nsFilterIconSVG:hover\r\n{\r\n    fill:red;\r\n\tcursor: hand;\r\n}\r\n\r\n.nsDataGridContainer .nsFilterLineContainer \r\n{\r\n}\r\n\r\n.nsDataGridContainer .nsFilterList\r\n{\r\n\twidth:99%;\r\n    height:180px;\r\n}\r\n\r\n.nsDataGridContainer .nsFilterListRenderer\r\n{\r\n\t-o-text-overflow: ellipsis;\r\n    text-overflow: ellipsis;\r\n    overflow: hidden;\r\n    white-space: nowrap;\r\n}\r\n\r\n.nsDataGridContainer .nsFilterListRendererCheckBox\r\n{\r\n\tposition: relative;\r\n    top: 2px;\r\n    left: 2px;\r\n}\r\n\r\n.nsDataGridContainer .nsFilterListRendererText\r\n{\r\n\tmargin-left: 4px;\r\n}\r\n\r\n.nsDataGridContainer .nsFilterSearchTextBox\r\n{\r\n\twidth:96%;\r\n}\r\n\r\n.nsDataGridContainer .nsGridPagination\r\n{\r\n    margin: auto;\r\n    width: 100%;\r\n    text-align: center;\r\n}\r\n\r\n.nsArrow\r\n{\r\n\theight:15px;\r\n}\r\n\r\n.nsDataGridHeaderDrag\r\n{\r\n\tposition: absolute;\r\n\tz-index: 2;\r\n}\r\n\r\n.nsGridEditorPopUp\r\n{\r\n\tz-index:10000;\r\n\tposition:absolute;\r\n\tbackground:white;\r\n\tpadding:5px;\r\n\tborder:3px solid gray; \r\n\t-moz-border-radius:10px; \r\n\tborder-radius:10px;\r\n}\r\n.nsGridTextAreaEditor .nsGridTextArea\r\n{\r\n\tbackround:white;\r\n\twidth:250px;\r\n\theight:80px;\r\n\tborder:0;\r\n\toutline:0;\r\n}\r\n.nsGridFilterFirstSelect\r\n{\r\n\tmargin: 4px;\r\n\tmargin-left: 0px;\r\n    width: calc(100% - 10%);\r\n}\r\n.nsGridFilterOptOption\r\n{\r\n\tmargin: 4px;\r\n\tmargin-left: 0px;\r\n    width: calc(100% - 10%);\r\n}\r\n.nsGridFilterSecondSelect\r\n{\r\n\tmargin: 4px;\r\n\tmargin-left: 0px;\r\n    width: calc(100% - 10%);\r\n}\r\n @-moz-keyframes nsAnimateLeftToRight \r\n{\r\n\tfrom \r\n\t{\r\n\t\tpadding-left: 6px;    \r\n\t\tpadding-right: 2px;  \r\n\t}  \r\n\tto \r\n\t{    \r\n\t\tpadding-left: 2px;    \r\n\t\tpadding-right: 6px;  \r\n\t}\r\n}\r\n\r\n@-webkit-keyframes nsAnimateLeftToRight \r\n{\r\n\tfrom \r\n\t{\r\n\t\tpadding-left: 6px;\r\n\t\tpadding-right: 2px;  \r\n\t}  \r\n\tto \r\n\t{    \r\n\t\tpadding-left: 2px;    \r\n\t\tpadding-right: 6px;  \r\n\t}\r\n}\r\n\r\n@-o-keyframes nsAnimateLeftToRight \r\n{\r\n\tfrom \r\n\t{\r\n\t\tpadding-left: 6px;\r\n\t\tpadding-right: 2px;  \r\n\t}  \r\n\tto \r\n\t{    \r\n\t\tpadding-left: 2px;    \r\n\t\tpadding-right: 6px;  \r\n\t}\r\n}\r\n\r\n@keyframes nsAnimateLeftToRight \r\n{\r\n\tfrom \r\n\t{\r\n\t\tpadding-left: 6px;\r\n\t\tpadding-right: 2px;  \r\n\t}  \r\n\tto \r\n\t{    \r\n\t\tpadding-left: 2px;    \r\n\t\tpadding-right: 6px;  \r\n\t}\r\n}\r\n\r\n\t/* Force table to not be like tables anymore */\r\n.nsMobileStackGrid table,.nsMobileStackGrid thead,.nsMobileStackGrid tbody,.nsMobileStackGrid th,.nsMobileStackGrid td,.nsMobileStackGrid tr {\r\n\tdisplay: block;\r\n}\r\n\r\n/* Hide table headers (but not display: none;, for accessibility) */\r\n.nsMobileStackGrid thead tr {\r\n\tposition: absolute;\r\n\ttop: -9999px;\r\n\tleft: -9999px;\r\n}\r\n\r\n.nsMobileStackGrid .nsDataGridHeader,.nsMobileStackGrid .nsArrow{\r\n\tdisplay:none;\r\n}\r\n.nsMobileStackGrid .nsDataGridFooter,.nsMobileStackGrid .nsArrow{\r\n\tdisplay:none;\r\n}\r\n\r\n.nsMobileStackGrid .nsDataGridHeaderRenderer{\r\n\tdisplay:none;\r\n}\r\n\r\n.nsMobileStackGrid tr { \r\n\tborder: 1px solid #ccc;\r\n}\r\n\r\n.nsMobileStackGrid td {\r\n\t/* Behave  like a \"row\" */\r\n\tborder: none;\r\n\tborder-bottom: 1px solid #eee;\r\n\tposition: relative;\r\n\tpadding-left: 50%;\r\n\tmin-height: 20px; \r\n\t\r\n}\r\n\r\n.nsMobileStackGrid .nsBodyDataGridCell\r\n{\r\n\ttext-align:center;\r\n\tpadding-left:0px!important;\r\n}\r\n\r\n.nsMobileStackGrid td:before {\r\n\t/* Now like a table header */\r\n\tposition: absolute;\r\n\t/* Top/left values mimic padding */\r\n\t/*top: 6px;*/\r\n\tleft: 6px;\r\n\twidth: 45%;\r\n\tpadding-right: 10px;\r\n\twhite-space: nowrap;\r\n\tvertical-align:middle;\r\n}\r\n\r\n.nsMobileStackGrid td:nth-of-type(n):before {\t\r\n\tfont-weight: bold;\r\n}\r\n\r\n.nsMobileColumnToggleGrid320 th.column-priority-6, .nsMobileColumnToggleGrid320 td.column-priority-6, \r\n.nsMobileColumnToggleGrid320 th.column-priority-5, .nsMobileColumnToggleGrid320 td.column-priority-5, \r\n.nsMobileColumnToggleGrid320 th.column-priority-4, .nsMobileColumnToggleGrid320 td.column-priority-4, \r\n.nsMobileColumnToggleGrid320 th.column-priority-3, .nsMobileColumnToggleGrid320 td.column-priority-3, \r\n.nsMobileColumnToggleGrid320 th.column-priority-2, .nsMobileColumnToggleGrid320 td.column-priority-2 {\r\n    display: none;\r\n}\r\n\r\n.nsMobileColumnToggleGrid480 th.column-priority-6, .nsMobileColumnToggleGrid480 td.column-priority-6, \r\n.nsMobileColumnToggleGrid480 th.column-priority-5, .nsMobileColumnToggleGrid480 td.column-priority-5, \r\n.nsMobileColumnToggleGrid480 th.column-priority-4, .nsMobileColumnToggleGrid480 td.column-priority-4, \r\n.nsMobileColumnToggleGrid480 th.column-priority-3, .nsMobileColumnToggleGrid480 td.column-priority-3 {\r\n    display: none;\r\n}\r\n\r\n.nsMobileColumnToggleGrid640 th.column-priority-6, .nsMobileColumnToggleGrid640 td.column-priority-6, \r\n.nsMobileColumnToggleGrid640 th.column-priority-5, .nsMobileColumnToggleGrid640 td.column-priority-5, \r\n.nsMobileColumnToggleGrid640 th.column-priority-4, .nsMobileColumnToggleGrid640 td.column-priority-4 {\r\n    display: none;\r\n}\r\n\r\n.nsMobileColumnToggleGrid800 th.column-priority-6, .nsMobileColumnToggleGrid800 td.column-priority-6, \r\n.nsMobileColumnToggleGrid800 th.column-priority-5, .nsMobileColumnToggleGrid800 td.column-priority-5 {\r\n    display: none;\r\n}\r\n\r\n.nsMobileColumnToggleGrid960 th.column-priority-6, .nsMobileColumnToggleGrid960 td.column-priority-6 {\r\n    display: none;\r\n}\r\ninput[type=\"search\"]::-webkit-search-cancel-button, input[type=\"search\"]::-webkit-search-decoration {\r\n    -webkit-appearance: searchfield-cancel-button;\r\n}\r\n\r\n.nsGridScrollTipContainer \r\n{\r\n\t  pointer-events: none;\r\n\t  position: absolute;\r\n\t  opacity: 0;\r\n\t  z-index: 1000;\r\n}\r\n.nsGridScrollTipContainer .nsGridScrollTipText \r\n{\r\n\t  border-radius: 5px;\r\n\t  color: white;\r\n\t  float: left;\r\n\t  font-family: sans-serif;\r\n\t  font-size: 12px;\r\n\t  font-weight: bold;\r\n\t  line-height: 48px;\r\n\t  text-align: center;\r\n}\r\n.nsGridScrollTipContainer .nsGridScrollTipTriangle \r\n{\r\n\t  border-bottom: 6px solid transparent;\r\n\t  border-left: 8px solid black;\r\n\t  border-top: 6px solid transparent;\r\n\t  display: inline;\r\n\t  float: left;\r\n\t  height: 0;\r\n\t  margin-top: 18px;\r\n\t  width: 0;\r\n}\r\n\r\n.nsDataGridContainerWhite\r\n{\r\n\tbackground-color: #FFFFFF;\r\n\tborder: 1px solid silver;\r\n}\r\n.nsDataGridContainerWhite .nsDataGridTitleBarTheme\r\n{\r\n   background: #848484; \r\n   color: #ffffff;\r\n   font-size: 12px; \r\n   padding: .3em .2em .2em .3em; \r\n   font-weight: bold;\r\n   border-bottom: 1px solid #848484!important;\r\n}\r\n\r\n.nsDataGridContainerWhite .nsDataGridTableTheme\r\n{  \r\n\tfont-size:13px;\r\n\tbackground-color: #F6F6F6;\r\n    border-color: grey;\r\n}\r\n.nsDataGridContainerWhite .nsDataGridHeaderTheme\r\n{\r\n  border-top : 1px solid #D4C7C7;\r\n  border-right : 1px solid #D4C7C7;\r\n  background-color: #EEEEEE;\r\n  color: black;\r\n}\r\n.nsDataGridHeaderDragWhite.nsDataGridHeaderDrag\r\n{\r\n  border-top : 1px solid #D4C7C7;\r\n  border-right : 1px solid #D4C7C7;\r\n  background-color: #EEEEEE;\r\n  color: black;\r\n}\r\n.nsDataGridContainerWhite .nsDataGridHeaderTheme:hover\r\n{\r\n\tbackground-color: #acacac!important;\t\r\n}\r\n.nsDataGridContainerWhite .nsHeaderBarCorner\r\n{\r\n\tbackground-color: #EEEEEE;\r\n} \r\n.nsDataGridContainerWhite .nsDataGridHeaderRendererTheme\r\n{\r\n\tbackground-color: #EEEEEE;\r\n\tborder-top : 1px solid #D4C7C7;\r\n  \tborder-right : 1px solid #D4C7C7;\r\n}\r\n.nsHeaderTextTheme\r\n{\r\n\tfont-weight: bold;\r\n\tfont-size: 13.5px;\r\n}\r\n/*.nsHeaderTextTheme:hover\r\n{\r\n\tcolor: red;\r\n}*/\r\n.nsDataGridContainerWhite .nsDataGridOddRow\r\n{\r\n    background-color: #FFFFFF;\r\n\tcolor: black;\r\n}\r\n.nsDataGridContainerWhite .nsDataGridEvenRow \r\n{\r\n    background-color: #fbfbfb;\r\n\tcolor: black; \r\n}\r\n.nsDataGridContainerWhite .nsRowHover\r\n{\r\n\tbackground: #CCCCCC;\r\n    text-decoration: none;\r\n    border-radius: 4px;\r\n}\r\n.nsDataGridContainerWhite .nsMenuUse\r\n{\r\n\tfill:black;\r\n}\r\n.nsDataGridContainerWhite .nsMenuUse:hover\r\n{\r\n\tfill: red;\r\n}\r\n.nsMenuArrow\r\n{\r\n\tfill:white;\r\n}\r\n.nsDataGridContainerWhite .nsBodyDataGridCellTheme\r\n{\r\n    border-top : 1px solid #D5D5D5;\r\n    border-right : 1px solid #D5D5D5;\r\n    font-weight:normal;\r\n    vertical-align:middle;\r\n    color:#000000;\r\n}\r\n.nsDataGridContainerWhite .nsDataGridSelection > td\r\n{\r\n    background-color: #b0bed9!important;\r\n}\r\n.nsDataGridContainerWhite .nsGridCellHover \r\n{ \r\n\tbackground-color: #CCCCCC!important; \r\n}\r\n.nsCellFocus\r\n{\r\n\t/*box-shadow: inset 0 0 3px #000;*/\r\n\tbackground: #FAFAFF;\r\n    border: 2px solid #4285F4;\r\n}\r\n.nsDataGridContainerWhite .nsCellFocus\r\n{\r\n\t/*box-shadow: inset 0 0 3px #000;*/\r\n\tbackground: #FAFAFF;\r\n    border: 2px solid #4285F4;\r\n}\r\n.nsDataGridContainerWhite .nsDottedCell\r\n{\r\n    border: 2px dotted red!important;\r\n}\r\n.nsDataGridContainerWhite .nsColumnResizeIndicatorTheme:hover,\r\n.nsDataGridContainerWhite .nsColumnResizeIndicatorTheme.active\r\n{\r\n  \tbackground-color: #1e90ff;\r\n}\r\n.nsResizeHandleWhite\r\n{\r\n/* \tbackground-color: #666; */\r\n\tbackground-color: #2684ff;\r\n}\r\n.nsDataGridContainerWhite .nsGridArrowFillTheme \r\n{\r\n    fill:#000000;\r\n}\r\n.nsDataGridContainerWhite .nsGridGroupIconTheme\r\n{\r\n\tfill:#000000;\r\n}\r\n.nsDataGridContainerWhite .nsExportIconTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerWhite .nsExportIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsDataGridContainerWhite .nsColumnSettingTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerWhite .nsColumnSettingTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsMoveIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsDataGridContainerWhite .nsFilterButtonDivTheme\r\n{\r\n  border-top: 1px solid #d3d3d3;\r\n}\r\n.nsDataGridContainerWhite .nsFilterLineContainerTheme\r\n{\r\n    border-bottom: 1px solid #d3d3d3;\r\n}\r\n.nsGridScrollTipContainer .nsGridScrollTipText \r\n{\r\n\tbackground-color: black;\r\n\ttext-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);\r\n}\r\n.nsGridScrollTipContainer .nsGridScrollTipTriangle \r\n{\r\n\tborder-left: 8px solid black;\r\n}\r\n\r\n.nsDataGridContainerBlack\r\n{\r\n\tbackground-color: #1E1E1E;\r\n\tborder: 1px solid silver;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridTitleBarTheme\r\n{\r\n   background: black; \r\n   color: #ffffff;\r\n   font-size: 12px; \r\n   padding: .3em .2em .2em .3em; \r\n   font-weight: bold;\r\n   border-bottom: 1px solid #848484!important;\r\n}\r\n\r\n.nsDataGridContainerBlack .nsDataGridTableTheme\r\n{  \r\n\tbackground-color: #FFFF00; \r\n    color: #FF00FF;\r\n    font-size: 13px; \r\n    border-color: #565656;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridHeaderTheme\r\n{\r\n  border-top : 1px solid #565656;\r\n  border-right : 1px solid #565656;\r\n  background-color: #565656;\r\n  color: White;\r\n}\r\n.nsDataGridHeaderDragBlack.nsDataGridHeaderDrag\r\n{\r\n  border-top : 1px solid #D4C7C7;\r\n  border-right : 1px solid #D4C7C7;\r\n  background-color: #EEEEEE;\r\n  color: black;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridHeaderTheme:hover\r\n{\r\n\tbackground-color: #EA610D!important;\t\r\n}\r\n.nsDataGridContainerBlack .nsHeaderBarCorner\r\n{\r\n\tbackground-color: #282828;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridHeaderRendererTheme\r\n{\r\n\tbackground-color: #282828;\r\n\tborder-top : 1px solid #565656;\r\n  \tborder-right : 1px solid #565656;\r\n}\r\n.nsHeaderTextTheme\r\n{\r\n\tfont-weight: bold;\r\n\tfont-size: 13.5px;\r\n}\r\n/*.nsHeaderTextTheme:hover\r\n{\r\n\tcolor: red;\r\n}*/\r\n.nsDataGridContainerBlack .nsDataGridOddRow\r\n{\r\n    background-color: #1E1E1E;\r\n\tcolor: white;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridEvenRow \r\n{\r\n    background-color: #282828;\r\n\tcolor: white; \r\n}\r\n.nsDataGridContainerBlack .nsMenuUse\r\n{\r\n\tfill:black;\r\n}\r\n.nsDataGridContainerBlack .nsMenuUse:hover\r\n{\r\n\tfill: red;\r\n}\r\n.nsMenuArrow\r\n{\r\n\tfill:white;\r\n}\r\n.nsDataGridContainerBlack .nsBodyDataGridCellTheme\r\n{\r\n    border-top : 1px solid #565656;\r\n    border-right : 1px solid #565656;\r\n    font-weight:normal;\r\n    vertical-align:middle;\r\n    color:white;\r\n}\r\n.nsDataGridContainerBlack .nsDataGridSelection > td\r\n{\r\n    background-color: #38210B!important;\r\n}\r\n.nsDataGridContainerBlack .nsGridCellHover \r\n{ \r\n\tbackground-color: #464646!important; \r\n}\r\n.nsDataGridContainerBlack .nsCellFocus\r\n{\r\n\t/*box-shadow: inset 0 0 3px #000;*/\r\n\tbackground: #FAFAFF;\r\n    border: 1px solid #4285F4;\r\n}\r\n.nsDataGridContainerBlack .nsDottedCell\r\n{\r\n    border: 2px dotted red!important;\r\n}\r\n.nsResizeHandleBlack\r\n{\r\n\tbackground-color: #2684ff;\r\n}\r\n.nsDataGridContainerBlack .nsGridArrowFillTheme \r\n{\r\n    fill:#FFFFFF;\r\n}\r\n.nsDataGridContainerBlack .nsGridGroupIconTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerBlack .nsExportIconTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerBlack .nsExportIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsMoveIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsDataGridContainerBlack .nsFilterButtonDivTheme\r\n{\r\n  \tborder-top: 1px solid #565656;\r\n}\r\n.nsDataGridContainerBlack .nsFilterLineContainerTheme\r\n{\r\n    border-bottom: 1px solid #d3d3d3;\r\n}\r\n\r\n.nsDataGridContainerBlack .nsFilterIconSVG\r\n{\r\n   fill: #ffffff;\r\n}\r\n\r\n.nsDataGridContainerBlack .nsSortAsc\r\n{\r\n\tborder-bottom: 5px solid white;\r\n}\r\n\r\n.nsDataGridContainerBlack .nsSortDesc\r\n{\r\n\tborder-top: 5px solid white;\r\n}\r\n\r\n.nsDataGridContainerRed\r\n{\r\n\tbackground-color: Red;\r\n\tborder: 1px solid silver;\r\n}\r\n.nsDataGridContainerRed .nsDataGridTitleBarTheme\r\n{\r\n   background: Red; \r\n   color: #ffffff;\r\n   font-size: 12px; \r\n   padding: .3em .2em .2em .3em; \r\n   font-weight: bold;\r\n   border-bottom: 1px solid #848484!important;\r\n }\r\n.nsDataGridContainerRed .nsDataGridTableTheme\r\n{  \r\n\tbackground-color:Red; \r\n    color: #FF00FF;\r\n    font-size: 16px; \r\n    font-weight: bold;\r\n    font-family: \"Segoe UI\",Tahoma,Geneva,Verdana,sans-serif;\r\n    border-color: #565656;\r\n}\r\n.nsDataGridContainerRed .nsDataGridHeaderTheme\r\n{\r\n  border-top : 1px solid #565656;\r\n  border-right : 1px solid #565656;\r\n  background-color: #565656;\r\n  color: White;\r\n}\r\n.nsDataGridHeaderDragRed.nsDataGridHeaderDrag\r\n{\r\n  border-top : 1px solid #D4C7C7;\r\n  border-right : 1px solid #D4C7C7;\r\n  background-color: #EEEEEE;\r\n  color: Red;\r\n}\r\n.nsDataGridContainerRed .nsDataGridHeaderTheme:hover\r\n{\r\n\tbackground-color: #EA610D!important;\t\r\n}\r\n.nsDataGridContainerRed .nsHeaderBarCorner\r\n{\r\n\tbackground-color: #282828;\r\n}\r\n.nsDataGridContainerRed .nsDataGridHeaderRendererTheme\r\n{\r\n\tbackground-color: #282828;\r\n\tborder-top : 1px solid #565656;\r\n  \tborder-right : 1px solid #565656;\r\n}\r\n.nsHeaderTextTheme\r\n{\r\n\tfont-weight: bold;\r\n\tfont-size: 13.5px;\r\n}\r\n/*.nsHeaderTextTheme:hover\r\n{\r\n\tcolor: red;\r\n}*/\r\n.nsDataGridContainerRed .nsDataGridOddRow\r\n{\r\n    background-color:Red;\r\n\tcolor: white;\r\n}\r\n.nsDataGridContainerRed .nsDataGridEvenRow \r\n{\r\n    background-color: #282828;\r\n\tcolor: white; \r\n}\r\n.nsDataGridContainerRed .nsMenuUse\r\n{\r\n\tfill:Red;\r\n}\r\n.nsDataGridContainerRed .nsMenuUse:hover\r\n{\r\n\tfill: red;\r\n}\r\n.nsMenuArrow\r\n{\r\n\tfill:white;\r\n}\r\n.nsDataGridContainerRed .nsBodyDataGridCellTheme\r\n{\r\n    border-top : 1px solid #565656;\r\n    border-right : 1px solid #565656;\r\n    font-weight:normal;\r\n    vertical-align:middle;\r\n    color:white;\r\n}\r\n.nsDataGridContainerRed .nsDataGridSelection > td\r\n{\r\n    background-color: #38210B!important;\r\n}\r\n.nsDataGridContainerRed .nsGridCellHover \r\n{ \r\n\tbackground-color: #464646!important; \r\n}\r\n.nsDataGridContainerRed .nsCellFocus\r\n{\r\n\t/*box-shadow: inset 0 0 3px #000;*/\r\n\tbackground: #FAFAFF;\r\n    border: 1px solid #4285F4;\r\n}\r\n.nsDataGridContainerRed .nsDottedCell\r\n{\r\n    border: 2px dotted red!important;\r\n}\r\n.nsResizeHandleRed\r\n{\r\n\tbackground-color: #2684ff;\r\n}\r\n.nsDataGridContainerRed .nsGridArrowFillTheme \r\n{\r\n    fill:#000000;\r\n}\r\n.nsGridGroupIconTheme\r\n{\r\n\tstroke:#000000;\r\n}\r\n.nsDataGridContainerRed .nsExportIconTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerRed .nsExportIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsMoveIconTheme:hover\r\n{\r\n\tfill:red;\r\n}\r\n.nsDataGridContainerRed .nsFilterButtonDivTheme\r\n{\r\n  \tborder-top: 1px solid #565656;\r\n}\r\n.nsDataGridContainerRed .nsFilterLineContainerTheme\r\n{\r\n    border-bottom: 1px solid #d3d3d3;\r\n}\r\n.nsDataGridContainerBlue\r\n{\r\n\tbackground-color: Blue;\r\n\tborder: 1px solid silver;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridTitleBarTheme\r\n{\r\n   background: Blue; \r\n   color: #ffffff;\r\n   font-size: 12px; \r\n   padding: .3em .2em .2em .3em; \r\n   font-weight: bold;\r\n   border-bottom: 1px solid #848484!important;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridTableTheme\r\n{  \r\n\tbackground-color:Blue; \r\n    color: #FF00FF;\r\n    font-size: 16px; \r\n    font-weight: bold;\r\n    font-family: \"Segoe UI\",Tahoma,Geneva,Verdana,sans-serif;\r\n    border-color: #565656;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridHeaderTheme\r\n{\r\n  border-top : 1px solid #565656;\r\n  border-right : 1px solid #565656;\r\n  background-color: #565656;\r\n  color: White;\r\n}\r\n.nsDataGridHeaderDragBlue.nsDataGridHeaderDrag\r\n{\r\n  border-top : 1px solid #D4C7C7;\r\n  border-right : 1px solid #D4C7C7;\r\n  background-color: #EEEEEE;\r\n  color: Blue;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridHeaderTheme:hover\r\n{\r\n\tbackground-color: #EA610D!important;\t\r\n}\r\n.nsDataGridContainerBlue .nsHeaderBarCorner\r\n{\r\n\tbackground-color: #282828;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridHeaderRendererTheme\r\n{\r\n\tbackground-color: #282828;\r\n\tborder-top : 1px solid #565656;\r\n  \tborder-right : 1px solid #565656;\r\n}\r\n.nsHeaderTextTheme\r\n{\r\n\tfont-weight: bold;\r\n\tfont-size: 13.5px;\r\n}\r\n/*.nsHeaderTextTheme:hover\r\n{\r\n\tcolor: Blue;\r\n}*/\r\n.nsDataGridContainerBlue .nsDataGridOddRow\r\n{\r\n    background-color:Blue;\r\n\tcolor: white;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridEvenRow \r\n{\r\n    background-color: #282828;\r\n\tcolor: white; \r\n}\r\n.nsDataGridContainerBlue .nsMenuUse\r\n{\r\n\tfill:Blue;\r\n}\r\n.nsDataGridContainerBlue .nsMenuUse:hover\r\n{\r\n\tfill: Blue;\r\n}\r\n.nsMenuArrow\r\n{\r\n\tfill:white;\r\n}\r\n.nsDataGridContainerBlue .nsBodyDataGridCellTheme\r\n{\r\n    border-top : 1px solid #565656;\r\n    border-right : 1px solid #565656;\r\n    font-weight:normal;\r\n    vertical-align:middle;\r\n    color:white;\r\n}\r\n.nsDataGridContainerBlue .nsDataGridSelection > td\r\n{\r\n    background-color: #38210B!important;\r\n}\r\n.nsDataGridContainerBlue .nsGridCellHover \r\n{ \r\n\tbackground-color: #464646!important; \r\n}\r\n.nsDataGridContainerBlue .nsCellFocus\r\n{\r\n\t/*box-shadow: inset 0 0 3px #000;*/\r\n\tbackground: #FAFAFF;\r\n    border: 1px solid #4285F4;\r\n}\r\n.nsDataGridContainerBlue .nsDottedCell\r\n{\r\n    border: 2px dotted Blue!important;\r\n}\r\n.nsResizeHandleBlue\r\n{\r\n\tbackground-color: #2684ff;\r\n}\r\n.nsDataGridContainerBlue .nsGridArrowFillTheme \r\n{\r\n    fill:#000000;\r\n}\r\n.nsGridGroupIconTheme\r\n{\r\n\tstroke:#000000;\r\n}\r\n.nsDataGridContainerBlue .nsExportIconTheme\r\n{\r\n\tfill:#FFFFFF;\r\n}\r\n.nsDataGridContainerBlue .nsExportIconTheme:hover\r\n{\r\n\tfill:Blue;\r\n}\r\n.nsMoveIconTheme:hover\r\n{\r\n\tfill:Blue;\r\n}\r\n.nsDataGridContainerBlue .nsFilterButtonDivTheme\r\n{\r\n  \tborder-top: 1px solid #565656;\r\n}\r\n.nsDataGridContainerBlue .nsFilterLineContainerTheme\r\n{\r\n    border-bottom: 1px solid #d3d3d3;\r\n}.nsMenu {\r\n  position: absolute;\r\n  width: 200px;\r\n  padding: 2px;\r\n  margin: 0;\r\n  background-color: #fefefe;\r\n  border: solid thin #1e4691;\r\n  /*background: -webkit-linear-gradient(to bottom, #fff 0%, #e5e5e5 100px, #e5e5e5 100%);\r\n  background: linear-gradient(to bottom, #fff 0%, #e5e5e5 100px, #e5e5e5 100%);*/\r\n  z-index: 999;\r\n  border-radius: 5px;\r\n  box-shadow: 1px 1px 4px rgba(0,0,0,.2);\r\n  opacity: 0;\r\n  -webkit-transform: translate(0, 15px) scale(.95);\r\n  transform: translate(0, 15px) scale(.95);\r\n  transition: transform 0.1s ease-out, opacity 0.1s ease-out;\r\n  pointer-events: none;\r\n}\r\n\r\n.nsMenuItem {\r\n  display: block;\r\n  position: relative;\r\n  margin: 0;\r\n  padding: 0;\r\n  white-space: nowrap;\r\n}\r\n\r\n.nsMenuButton {\r\n  background: none;\r\n  line-height: normal;\r\n  overflow: visible;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  display: block;\r\n  width: 100%;\r\n  color: #444;\r\n  font-family: 'Roboto', sans-serif;\r\n  font-size: 13px;\r\n  text-align: left;\r\n  cursor: pointer;\r\n  border: 1px solid transparent;\r\n  white-space: nowrap;\r\n  padding: 6px 8px;\r\n  border-radius: 3px;\r\n}\r\n .nsMenuButton::-moz-focus-inner, .nsMenuButton::-moz-focus-inner {\r\n border: 0;\r\n padding: 0;\r\n}\r\n\r\n.nsMenuText { margin-left: 25px; }\r\n\r\n.nsMenuButton .nsMenuAlign{\r\n  position: absolute;\r\n  left: 8px;\r\n  top: 50%;\r\n  -webkit-transform: translateY(-50%);\r\n  transform: translateY(-50%);\r\n}\r\n\r\n.nsMenuItem:hover > .nsMenuButton {\r\n  color: #fff;\r\n  /*outline: none;\r\n  background-color: #2E3940;\r\n  background: -webkit-linear-gradient(to bottom, #5D6D79, #2E3940);\r\n  background: linear-gradient(to bottom, #5D6D79, #2E3940);\r\n  border: 1px solid #2E3940;*/\r\n  background-color:#00B2EE;\r\n  border-color:#7D98B8;\r\n  border-left-width:1px;margin-left:-1px;*left:-1px;\r\n}\r\n\r\n.nsMenuItem.nsDisabled {\r\n  opacity: .5;\r\n  pointer-events: none;\r\n}\r\n\r\n.nsMenuItem.nsDisabled .nsMenuButton { cursor: default; }\r\n\r\n.nsMenuSeparator {\r\n  display: block;\r\n  margin: 7px 5px;\r\n  height: 1px;\r\n  border-bottom: 1px solid #fff;\r\n  background-color: #aaa;\r\n}\r\n\r\n.nsMenuItem.nsSubMenu::after {\r\n  content: \"\";\r\n  position: absolute;\r\n  right: 6px;\r\n  top: 50%;\r\n  -webkit-transform: translateY(-50%);\r\n  transform: translateY(-50%);\r\n  border: 5px solid transparent;\r\n  border-left-color: #808080;\r\n}\r\n\r\n.nsMenuItem.nsSubMenu:hover::after \r\n{ \r\n\tborder-left-color: #fff; \r\n}\r\n\r\n.nsMenu .nsMenu,.nsPopUp .nsMenu{\r\n  top: 4px;\r\n  left: 99%;\r\n}\r\n\r\n.nsShowMenu {\r\n  opacity: 1;\r\n  -webkit-transform: translate(0, 0) scale(1);\r\n  transform: translate(0, 0) scale(1);\r\n  pointer-events: auto;\r\n}\r\n\r\n.nsMenuItem:hover > .nsMenu {\r\n  -webkit-transition-delay: 100ms;\r\n  transition-delay: 300ms;\r\n}\r\n\r\n.nsHeader\r\n{\r\n\tbackground-color: blue;\r\n\tpointer-events: none;\r\n\tlist-style-type: none;\r\n\twhite-space: nowrap;\r\n\tborder-radius: 3px;\r\n\tpadding: 5px 7px;\r\n}\r\n\r\n.nsMenuItem.nsHeader .nsMenuButton \r\n{ \r\n\tcolor: white;\r\n\tcursor: default; \r\n\tfont-weight: bold;\r\n}\r\n\r\n.nsSubMenuContainer::before\r\n{\r\n\tcontent: \"\";\r\n\tborder: 4px solid #fefefe;\r\n\tborder-color: transparent #1e4691 transparent transparent;\r\n\tposition: absolute;\r\n\ttop: 12px;\r\n\tleft: -9px;\r\n}\r\n.nsSubMenuContainer::after\r\n{\r\n\tcontent: \"\";\r\n\tborder: 4px solid #fefefe;\r\n\tborder-color: transparent #fefefe transparent transparent;\r\n\tposition: absolute;\r\n\ttop: 12px;\r\n\tleft: -8px;\r\n}\r\n\r\n.nsPaginationContainer\r\n{\r\n  padding: 0;\r\n  margin: 0 0 10px 25px;\r\n  display: inline-block;\r\n  *display: inline;\r\n  *zoom: 1;\r\n  margin-left: 0;\r\n  margin-bottom: 0;\r\n  -webkit-border-radius: 4px;\r\n  -moz-border-radius: 4px;\r\n  border-radius: 4px;\r\n  -webkit-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);\r\n  -moz-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);\r\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);\r\n}\r\n\r\n.nsPaginationContainer > li \r\n{\r\n  display: inline;\r\n}\r\n.nsPaginationContainer> li > a,\r\n.nsPaginationContainer > li > span \r\n{\r\n  float: left;\r\n  padding: 4px 12px;\r\n  line-height: 20px;\r\n  text-decoration: none;\r\n  background-color: #ffffff;\r\n  border: 1px solid #dddddd;\r\n  border-left-width: 0;\r\n}\r\n.nsPaginationContainer > li > a:hover,\r\n.nsPaginationContainer > li > a:focus,\r\n.nsPaginationContainer > .nsPageActive > a,\r\n.nsPaginationContainer > .nsPageActive > span \r\n{\r\n  background-color: #f5f5f5;\r\n}\r\n.nsPaginationContainer > .nsPageActive > a,\r\n.nsPaginationContainer > .nsPageActive > span \r\n{\r\n  color: #999999;\r\n  cursor: default;\r\n}\r\n.nsPaginationContainer > .nsPageDisabled > span,\r\n.nsPaginationContainer > .nsPageDisabled > a,\r\n.nsPaginationContainer > .nsPageDisabled > a:hover,\r\n.nsPaginationContainer > .nsPageDisabled > a:focus \r\n{\r\n  color: #999999;\r\n  background-color: transparent;\r\n  cursor: default;\r\n}\r\n.nsPaginationContainer > li:first-child > a,\r\n.nsPaginationContainer > li:first-child > span \r\n{\r\n  border-left-width: 1px;\r\n  -webkit-border-top-left-radius: 4px;\r\n  -moz-border-radius-topleft: 4px;\r\n  border-top-left-radius: 4px;\r\n  -webkit-border-bottom-left-radius: 4px;\r\n  -moz-border-radius-bottomleft: 4px;\r\n  border-bottom-left-radius: 4px;\r\n}\r\n.nsPaginationContainer > li:last-child > a,\r\n.nsPaginationContainer > li:last-child > span \r\n{\r\n  -webkit-border-top-right-radius: 4px;\r\n  -moz-border-radius-topright: 4px;\r\n  border-top-right-radius: 4px;\r\n  -webkit-border-bottom-right-radius: 4px;\r\n  -moz-border-radius-bottomright: 4px;\r\n  border-bottom-right-radius: 4px;\r\n}\r\n.nsPaginationContainer > li > a:hover,\r\n.nsPaginationContainer > li> a:focus \r\n{\r\n\tcolor: #005580;\r\n\ttext-decoration: none;\r\n}\r\n.nsPaginationContainer > li > a \r\n{\r\n\tcolor: #0088cc;\r\n\ttext-decoration: none;\r\n}.nsVirtualScrollElement\r\n{\r\n\tdisplay: block;\r\n    position: relative;\r\n    overflow: auto;\r\n    transform: translateZ(0);\r\n}\r\n\r\n.nsVirtualScrollContent\r\n{\r\n\toutline: 0;\r\n}\r\n\r\n.nsVirtualScrollContentHorizontal\r\n{\r\n\tposition: absolute;\r\n    top: 0;\r\n    left: 0;\r\n}\r\n.nsVirtualScrollContent .nsVirtualExtraItemVertical\r\n{\r\n  margin-top: 0 !important;\r\n  margin-bottom: 0 !important;\r\n}\r\n.nsVirtualScrollContent .nsVirtualExtraItemHorizontal\r\n{\r\n  margin-left: 0 !important;\r\n  margin-right: 0 !important;\r\n}\r\n.nsVirtualScrollLoader\r\n{\r\n   position: fixed;\r\n   top: 0;\r\n   right: 0;\r\n   bottom: 0;\r\n   left: 0;\r\n   width: 100%;\r\n   height: 100%;\r\n   overflow: hidden;\r\n   -webkit-overflow-scrolling: touch;\r\n   z-index: 1060;\r\n   background-color: rgba(0, 0, 0, .01);\r\n   outline: 0;\r\n}\r\n.nsVirtualScrollLoader .nsVirtualScrollLoaderTextCon\r\n{\r\n  \tposition: absolute;\r\n    left: calc(50% - 75px);\r\n    top: calc(50% - 25px);\r\n    padding-left: 37px;\r\n    padding-top: 15px;\r\n    display: block;\r\n    width: 150px;\r\n    height: 50px;\r\n    color: #CA2420;\r\n    background-color: #D5D5D5;\r\n    border: 1px solid #737373;\r\n    border-radius: 10px;\r\n}\r\n.nsVirtualScrollLoader .nsVirtualScrollLoaderText\r\n{\r\n   margin: 0;\r\n   line-height: 1.42857143;\r\n}.nsListOuterContainer\r\n{\r\n    position: relative;   \r\n    overflow-y: auto;\r\n    width:inherit;\r\n    height:inherit;\r\n}\r\n\r\n.nsListOuterContainer .nsListParentContainer\r\n{\r\n\tposition: absolute; \r\n\theight: 100%; \r\n\twidth: 99%; \r\n\tmargin: 0px; \r\n\tpadding: 0px;\r\n\tbackground-color: #FFFFFF;\r\n\tcolor: #333;\r\n}\r\n\r\n.nsListOuterContainer .nsListContainer\r\n{\r\n\tmin-height: 42px;\r\n    padding-left: 0px;\r\n    \r\n\tdisplay: block;\r\n    list-style-type: disc;\r\n    -webkit-margin-before: 1em;\r\n    -webkit-margin-after: 1em;\r\n    -webkit-margin-start: 0px;\r\n    -webkit-margin-end: 0px;\r\n    -webkit-padding-start: 0px;\r\n    margin:0px;\r\n}\r\n.nsListOuterContainer .nsListItem\r\n{\r\n\tbackground-color: #fff;\r\n    border: 1px solid #f4f4f4;\r\n    border-top-right-radius: 4px;\r\n    border-top-left-radius: 4px;\r\n    display: block;\r\n    margin-bottom: -1px;\r\n}\r\n.nsListOuterContainer.nsListOuterContainerHierarchical .nsListItem\r\n{\r\n\t/*for Virtual Scrolling in Hierarchical List*/\r\n\tmin-height:25px;\r\n}\r\n.nsListItemHover \r\n{  \r\n  background-color: #3875d7;\r\n  background-image: -webkit-gradient(linear, left top, left bottom, color-stop(20%, #3875d7), color-stop(90%, #2a62bc));\r\n  background-image: linear-gradient(#3875d7 20%, #2a62bc 90%);\r\n  color: #fff;\r\n} \r\n.nsListItemAnimated .nsListChild\r\n{\r\n\twidth: 100%; \r\n\tposition: relative; \r\n  \tz-index: 2;\r\n  \ttext-decoration: none;\r\n  \tbox-sizing: border-box;  \r\n  \t-moz-box-sizing: border-box;  \r\n  \t-webkit-box-sizing: border-box; \r\n}\r\n.nsListItemAnimated:hover .nsListChild\r\n{\r\n\tcolor: #FFFFFF;\r\n}\r\n.nsListItemAnimated .nsListChild:after\r\n{\r\n  content: \"\";\r\n  height: 100%; \r\n  left: 0; \r\n  top: 0; \r\n  width: 0px;  \r\n  position: absolute; \r\n  transition: all 0.2s ease 0s; \r\n  -webkit-transition: all 0.2s ease 0s; \r\n  z-index: -1;\r\n}\r\n.nsListItemAnimated .nsListChild:hover:after\r\n{ \r\n\twidth: 100%; \r\n}\r\n.nsListItemAnimated .nsListChild:after\r\n{ \r\n\tbackground: #3498db; \r\n}\r\n.nsListOuterContainer .nsListItemSelected \r\n{\r\n\tbackground-color: #CED2CC;\r\n    color: #000;\r\n}\r\n.nsListOuterContainer .nsListNoRecordsFound \r\n{\r\n    text-align: center;\r\n}\r\n.nsListContainerDroppable\r\n{\r\n\tborder: 1px solid #a0a0a0;\r\n}\r\n.nsListEmpty\r\n{\r\n\tmargin: 0px;\r\n\tpadding: 5px;\r\n}\r\n.nsListEmptyChild\r\n{\r\n\tborder: 1px dashed #a0a0a0;\r\n\tborder-radius: 3px;\r\n\tpadding: 3px;\r\n\tcursor: pointer;\r\n\tfont-size: 10px;\r\n\tbackground-color: white;\r\n}\r\n.nsListOuterContainer .nsListGroupCell \r\n{\r\n  \tposition: relative;\r\n  \toverflow: hidden;\r\n  \tmin-height: 19px;\r\n}\r\n.nsListOuterContainer .nsListGroupCell > * \r\n{\r\n   display: inline-block;\r\n   padding: 3px;\r\n}\r\n.nsListOuterContainer .nsListGroupCellText\r\n{\r\n\tpadding-left: 1.5em;\r\n}\r\n.nsListOuterContainer .nsListArrowParent\r\n{\r\n\tposition: absolute;\r\n    top: 0px;\r\n    left:0px;\r\n}\r\n.nsListOuterContainer .nsListArrow\r\n{\r\n\theight:15px;\r\n}\r\n.nsListOuterContainer .nsListArrowFill \r\n{\r\n\twidth:16px;\r\n\theight:16px;\r\n    fill:#000000;\r\n\t/*stroke:#000000;\r\n\tstroke-width:0.5;*/\r\n} \r\n\r\n.nsListTruncateToFit,.nsListTruncateToFit *\r\n{\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n.nsListDottedRow \r\n{\r\n    position: relative;\r\n    margin: 0;\r\n    padding: 0;\r\n    border: none; \r\n}\r\n/* line 25, /Users/jonasvonandrian/jquery-sortable/source/css/jquery-sortable.css.sass */\r\n.nsListDottedRow:before \r\n{\r\n  \tposition: absolute;\r\n  \tcontent: \"\";\r\n  \twidth: 0;\r\n  \theight: 0;\r\n  \tmargin-top: -5px;\r\n  \tleft: -5px;\r\n  \ttop: -4px;\r\n  \tborder: 5px solid transparent;\r\n  \tborder-left-color: red;\r\n  \tborder-right: none; \r\n}";
styleInject(css_248z$8);

function CreatePortalWithProps(Component, props, containerId, setInstance, getStyleForContainer) {
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        if (getStyleForContainer) {
            const styles = getStyleForContainer();
            Object.keys(styles).forEach(key => {
                (container === null || container === void 0 ? void 0 : container.style)[key] = styles[key];
            });
        }
        // Ensure the container is attached to the DOM
        document.body.appendChild(container);
    }
    const callSetInstance = (instance) => {
        setInstance(instance, container, portal);
    };
    const mergedProps = Object.assign(Object.assign({}, props), { ref: callSetInstance });
    const portal = createPortal(React__default.createElement(Component, Object.assign({}, mergedProps)), container);
    // Instead of rendering here, return the portal to be rendered in the render method
    return portal;
}
function NSReactDynamicComponent({ component: Component, containerId, parentInstance, props = {}, getStyleForContainer, onInstanceCreated, }) {
    let instanceCreated = false;
    const setInstance = (instance, container, portal) => {
        if (instance && onInstanceCreated && !instanceCreated) {
            onInstanceCreated(instance, container, portal);
            instanceCreated = true;
        }
    };
    return CreatePortalWithProps(Component, props, containerId, setInstance, getStyleForContainer);
}

const nsCompUtil$a = require('./generated/js/nsUtil.min.js');
const NSUtil$a = nsCompUtil$a.NSUtil;
const nsCompGrid$1 = require('./generated/js/nsGrid.min.js');
const NSGrid$1 = nsCompGrid$1.NSGrid;
class NSGridReact extends NSBaseReactComponent {
    //private MAX_COMPONENT_CREATION_TIME: number = 1000;
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasGridDataSource = false;
        this.__hasDestroyed = false;
        //private portals: ReactPortal[] = [];
        //private hasPendingPortalUpdate = false;
        this.updateCallbacksOnUpdate = [];
        this.instanceCount = 0;
        this.hasPortalUpdated = false;
        this.state = {
            dynamicComponents: [],
        };
        //DynamicComponentService.addDefaultMethods(this,"NSGridReact",this.waitForInstanceCallback.bind(this),this.batchUpdateCallback.bind(this));
    }
    componentDidMount() {
        if (!this.__hasInitialized) {
            this.__hasDestroyed = false;
            if (!this.__nsGrid) {
                this.__nsUtil = new NSUtil$a();
                this.__arrEvents = [NSGrid$1.GRID_RENDERED,
                    NSGrid$1.ROW_SELECTED,
                    NSGrid$1.ROW_UNSELECTED,
                    NSGrid$1.ROW_CLICKED,
                    NSGrid$1.ROW_DOUBLE_CLICKED,
                    NSGrid$1.ROW_NAVIGATED,
                    NSGrid$1.CELL_SELECTED,
                    NSGrid$1.CELL_UNSELECTED,
                    NSGrid$1.CELL_CLICKED,
                    NSGrid$1.CELL_DOUBLE_CLICKED,
                    NSGrid$1.SORT_CHANGING,
                    NSGrid$1.SORT_CHANGED,
                    NSGrid$1.ADVANCED_FILTER_CLOSING,
                    NSGrid$1.FILTER_CHANGING,
                    NSGrid$1.FILTER_CHANGED,
                    NSGrid$1.FILTER_RESETTED,
                    NSGrid$1.COLUMN_RESIZING,
                    NSGrid$1.COLUMN_RESIZED,
                    NSGrid$1.COLUMN_MOVING,
                    NSGrid$1.COLUMN_MOVED,
                    NSGrid$1.MULTI_SELECTION_EDITORS_TEXT,
                    NSGrid$1.MULTI_SELECTION_EDITORS_TEXTAREA,
                    NSGrid$1.EDITOR_CELL_VALUE_CHANGED];
                if (!this.props) {
                    this.props = {};
                }
                const setting = this.__nsUtil.cloneObject(this.props.setting, true);
                //setting.columns = [];
                //setting.multiLevelGroupColumn = null;
                this.__dataSource = this.props.dataSource || setting.dataSource;
                setting.columns = this.__setColumn(setting.columns || []);
                setting.multiLevelGroupColumn = this.__setColumnObject(setting.multiLevelGroupColumn || {});
                setting.masterDetailSetting = this.__processMasterDetailSetting(setting.masterDetailSetting);
                //setting.eventDispatcher = this.__eventDispatcher.bind(this);
                if (this.__dataSource) {
                    setting.dataSource = this.__dataSource;
                    if (this.__dataSource.length > 0) {
                        this.__hasGridDataSource = true;
                    }
                }
                this.__objCustomComponent = {};
                this.__setting = setting;
                this.__nsGrid = new NSGrid$1(this.__container, this.__setting);
                this.__addEvents();
            }
            this.__hasInitialized = true;
        }
    }
    shouldComponentUpdate(nextProps, nextState) {
        this.processProps(nextProps);
        if (this.hasPortalUpdated) {
            setTimeout(() => {
                this.hasPortalUpdated = false;
            }, 0);
            return true;
        }
        return false;
    }
    processProps(nextProps) {
        const objChanges = {};
        const arrPropKeys = Object.keys(nextProps);
        const arrSettingKeys = Object.keys(this.__setting);
        for (const propKey of arrPropKeys) {
            if (propKey === "setting") {
                const newSetting = nextProps.setting;
                for (const settingKey of arrSettingKeys) {
                    if (!this.__nsUtil.isObjectEqual(this.__setting[settingKey], newSetting[settingKey])) {
                        objChanges[settingKey] = { oldValue: this.__setting[settingKey], newValue: newSetting[settingKey] };
                    }
                }
            }
            else if (!this.__nsUtil.isObjectEqual(this.props[propKey], nextProps[propKey])) {
                objChanges[propKey] = { oldValue: this.props[propKey], newValue: nextProps[propKey] };
            }
        }
        const arrChangeKeys = Object.keys(objChanges);
        for (const changeKey of arrChangeKeys) {
            if (changeKey === "dataSource") {
                this.__dataSource = objChanges[changeKey].newValue;
                if (this.__nsGrid) {
                    this.__objCustomComponent = {};
                    if (this.__dataSource && this.__dataSource.length > 0) {
                        this.__hasGridDataSource = true;
                    }
                    this.__nsGrid.dataSource(this.__dataSource);
                }
            }
            else if (this.__hasGridDataSource) ;
        }
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            if (this.__nsGrid) {
                this.__nsGrid.removeComponent();
                this.__nsGrid = null;
            }
            /*if(this.__objCustomComponent) {
                Object.keys(this.__objCustomComponent).forEach((dataField: string) => {
                    const itemDataField: any[] = this.__objCustomComponent[dataField];
                    itemDataField.forEach((itemIndex: any) => {
                        // Check for renderer component instances and call their destroy methods if available
                        ['renderer', 'groupRenderer', 'headerRenderer', 'toolTipRenderer', 'extraRowHeaderRenderer', 'editor'].forEach(rendererType => {
                            if (itemIndex?.[rendererType]) {
                                const componentInstance = itemIndex[rendererType].instance;
                                if (componentInstance && typeof componentInstance.destroy === 'function') {
                                    componentInstance.destroy();
                                }
                            }
                        });
                    });
                });
            }*/
            this.__objCustomComponent = {};
            this.__arrEvents.forEach(eventName => {
                this.__nsUtil.removeEvent(this.__container, eventName);
            });
            this.__hasDestroyed = true;
            this.__hasInitialized = false;
        }
    }
    render() {
        /*return React.createElement<any>("div",{
            style: this.__getStyleForContainer(),
            ref: (e: HTMLElement) => {
                this.__container = e;
            }
        }, this.portals);*/
        return (React.createElement("div", { style: this.__getStyleForContainer(), ref: (e) => { this.__container = e; } }, this.state.dynamicComponents.map((portal, index) => (React.createElement(React.Fragment, { key: index }, portal)))));
    }
    setHeightOffset(offset) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setHeightOffset(offset);
    }
    ;
    deviceViewChanged(conditionTrue, queryIndex = 0, query = "") {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.deviceViewChanged(conditionTrue, queryIndex, query);
    }
    ;
    setGridState(data) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setGridState(data);
    }
    ;
    getGridState() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getGridState();
    }
    ;
    setColumn(arrColumns) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setColumn(this.__setColumn(arrColumns));
    }
    ;
    dataSource(source, isReset) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.dataSource(source, isReset);
    }
    ;
    setContextMenuSetting(contextMenuSetting) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setContextMenuSetting(contextMenuSetting);
    }
    ;
    getOrignalItem(item) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getOrignalItem(item);
    }
    ;
    addRows(source) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.addRows(source);
    }
    ;
    removeRows(arrIndex) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.removeRows(arrIndex);
    }
    ;
    groupBy(groupByField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.groupBy(groupByField);
    }
    ;
    expandAll() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.expandAll();
    }
    ;
    collapseAll() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.collapseAll();
    }
    ;
    expandCollapseByRow(element, rowIndex) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.expandCollapseByRow(element, rowIndex);
    }
    ;
    getRowInfo(row) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getRowInfo(row);
    }
    ;
    getCellInfo(cell) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getCellInfo(cell);
    }
    ;
    getItemInfo(objItem) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getItemInfo(objItem);
    }
    ;
    getItemInfoByKeyField(keyFieldValue) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getItemInfoByKeyField(keyFieldValue);
    }
    ;
    cascadeValues(event, callBack) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.cascadeValues(event, callBack);
    }
    ;
    setFontSize(fontSize) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setFontSize(fontSize);
    }
    ;
    addColumn(objColumn) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.addColumn(this.__setColumnObject(objColumn));
    }
    ;
    changeDeviceView(conditionTrue) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.changeDeviceView(conditionTrue);
    }
    ;
    hideColumn(column) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.hideColumn(column);
    }
    ;
    showColumn(column) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.showColumn(column);
    }
    ;
    swapColumns(sourceColumn, destinationColumn) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.swapColumns(sourceColumn, destinationColumn);
    }
    ;
    moveColumn(column, toIndex) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.moveColumn(column, toIndex);
    }
    ;
    sortBy(column, isAscending) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.sortBy(column, isAscending);
    }
    ;
    autoResizeColumn(column) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.autoResizeColumn(column);
    }
    ;
    updateRowByIndex(index) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.updateRowByIndex(index);
    }
    ;
    updateRowByKeyField(keyFieldValue) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.updateRowByKeyField(keyFieldValue);
    }
    ;
    updateCellByIndex(index, dataField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.updateCellByIndex(index, dataField);
    }
    ;
    updateCellByKeyField(keyFieldValue, dataField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.updateCellByKeyField(keyFieldValue, dataField);
    }
    ;
    updateItemInDataSource(item) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.updateItemInDataSource(item);
    }
    ;
    getGroupedSource() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getGroupedSource();
    }
    setSelectedItems(arrItems) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setSelectedItems(arrItems);
    }
    ;
    addSelectedItems(arrItems) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.addSelectedItems(arrItems);
    }
    ;
    removeSelectedItems(arrItems) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.removeSelectedItems(arrItems);
    }
    ;
    setSelectedItem(item) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setSelectedItem(item);
    }
    ;
    setSelectedIndexes(arrSelectedIndex) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setSelectedIndexes(arrSelectedIndex);
    }
    ;
    getSelectedIndex() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getSelectedIndex();
    }
    ;
    getSelectedItem() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getSelectedItem();
    }
    ;
    getSelectedIndexes() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getSelectedIndexes();
    }
    ;
    getSelectedItems() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getSelectedItems();
    }
    ;
    deselectAll() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.deselectAll();
    }
    ;
    filter(filter, setting, enableHighlighting = false, recordLimit = -1) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.filter(filter, setting, enableHighlighting, recordLimit);
    }
    ;
    resetFilters() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.resetFilters();
    }
    ;
    getFilteredData() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getFilteredData();
    }
    ;
    highlightText(dataField, text) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.highlightText(dataField, text);
    }
    ;
    unHighlightText() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.unHighlightText();
    }
    ;
    fixFixedHeader() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.fixFixedHeader();
    }
    ;
    scrollToIndex(selectedIndex, animationRequired = false) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.scrollToIndex(selectedIndex, animationRequired);
    }
    ;
    setNoDataMessage(message) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setNoDataMessage(message);
    }
    ;
    renderHeaderExtraRows() {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.renderHeaderExtraRows();
    }
    ;
    //Editor related public functions
    editByIndex(index, dataField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editByIndex(index, dataField);
    }
    ;
    editByKeyField(keyFieldValue, dataField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editByKeyField(keyFieldValue, dataField);
    }
    ;
    editByItem(item, dataField) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editByItem(item, dataField);
    }
    ;
    editStopByIndex(index, dataField, isCancel) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editStopByIndex(index, dataField, isCancel);
    }
    ;
    editStopByKeyField(keyFieldValue, dataField, isCancel) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editStopByKeyField(keyFieldValue, dataField, isCancel);
    }
    ;
    editStopByItem(item, dataField, isCancel) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.editStopByItem(item, dataField, isCancel);
    }
    ;
    getEditorInstances(element, dataField) {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.getEditorInstances(element, dataField);
    }
    ;
    //end of editor related public functions
    setStyle(styleProp, value) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setStyle(styleProp, value);
    }
    ;
    setFocus(isFocus) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setFocus(isFocus);
    }
    ;
    hasFocus() {
        var _a;
        return (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.hasFocus();
    }
    ;
    setTheme(theme) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.setTheme(theme);
    }
    ;
    changeProperty(propertyName, value) {
        var _a;
        (_a = this.__nsGrid) === null || _a === void 0 ? void 0 : _a.changeProperty(propertyName, value);
    }
    ;
    getRendererComponentInstance(columnName, rowIndex) {
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].renderer) {
            return this.__objCustomComponent[columnName][rowIndex].renderer;
        }
        return null;
    }
    ;
    getGroupRendererComponentInstance(columnName, rowIndex) {
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].groupRenderer) {
            return this.__objCustomComponent[columnName][rowIndex].groupRenderer;
        }
        return null;
    }
    ;
    getHeaderRendererComponentInstance(columnName) {
        const rowIndex = 0;
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].headerRenderer) {
            return this.__objCustomComponent[columnName][rowIndex].headerRenderer;
        }
        return null;
    }
    ;
    getToolTipRendererComponentInstance(columnName, rowIndex) {
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].toolTipRenderer) {
            return this.__objCustomComponent[columnName][rowIndex].toolTipRenderer;
        }
        return null;
    }
    ;
    getExtraRowHeaderRendererComponentInstance(columnName, rowIndex) {
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].extraRowHeaderRenderer) {
            return this.__objCustomComponent[columnName][rowIndex].extraRowHeaderRenderer;
        }
        return null;
    }
    ;
    getEditorComponentInstance(columnName, rowIndex) {
        if (this.__objCustomComponent && this.__objCustomComponent[columnName] && this.__objCustomComponent[columnName].length > rowIndex && this.__objCustomComponent[columnName][rowIndex].editor) {
            return this.__objCustomComponent[columnName][rowIndex].editor;
        }
        return null;
    }
    ;
    getDetailComponentInstance(rowIndex) {
        if (this.__masterDetailRendererInstance && this.__masterDetailRendererInstance.length > rowIndex && this.__masterDetailRendererInstance[rowIndex]) {
            return this.__masterDetailRendererInstance[rowIndex].instance;
        }
        return null;
    }
    ;
    getGrid() {
        return this.__nsGrid;
    }
    ;
    __setColumn(arrColumns) {
        if (arrColumns && arrColumns.length > 0) {
            const retValue = [];
            for (const column of arrColumns) {
                retValue.push(this.__setColumnObject(column));
            }
            return retValue;
        }
        return arrColumns;
    }
    ;
    __setColumnObject(objColumn) {
        if (objColumn) {
            if (objColumn.itemRendererComponent) {
                objColumn.itemRenderer = (item, dataField, index, colIndex, row) => {
                    let promise = this.__renderer(objColumn.itemRendererComponent, item, dataField, index, colIndex, row, objColumn.itemRendererComponentProps);
                    const objPromise = new Promise((parResolve, parReject) => {
                        promise.then((element) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if (objColumn.groupRendererComponent) {
                objColumn.groupRenderer = (item, dataField, index, colIndex, row, arrChildren, childrenCount, arrFlatChildren, groupLevel) => {
                    let promise = this.__groupRenderer(objColumn.groupRendererComponent, item, dataField, index, colIndex, row, arrChildren, childrenCount, arrFlatChildren, groupLevel, objColumn.groupRendererComponentProps);
                    const objPromise = new Promise((parResolve, parReject) => {
                        promise.then((element) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if (objColumn.headerRendererComponent) {
                objColumn.headerRenderer = (colItem, colIndex) => {
                    let promise = this.__headerRenderer(objColumn.headerRendererComponent, colItem, colIndex, objColumn.headerRendererComponentProps);
                    const objPromise = new Promise((parResolve, parReject) => {
                        promise.then((element) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if (objColumn.toolTipRendererComponent) {
                objColumn.toolTipRenderer = (item, dataField, index, colIndex, row) => {
                    let promise = this.__toolTipRenderer(objColumn.toolTipRendererComponent, item, dataField, index, colIndex, row, objColumn.toolTipRendererComponentProps);
                    const objPromise = new Promise((parResolve, parReject) => {
                        promise.then((element) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if (objColumn.extraRowHeaderRendererComponent) {
                objColumn.extraRowHeaderRenderer = (dataField, colItem, arrFilteredGroupedSource, rowIndex, colIndex, extraHeaderCell, extraHeaderRow) => {
                    let promise = this.__extraRowHeaderRenderer(objColumn.extraRowHeaderRendererComponent, dataField, colItem, arrFilteredGroupedSource, rowIndex, colIndex, extraHeaderCell, extraHeaderRow, objColumn.extraRowHeaderRendererComponentProps);
                    const objPromise = new Promise((parResolve, parReject) => {
                        promise.then((element) => {
                            parResolve(element);
                        });
                    });
                    return objPromise;
                };
            }
            if (objColumn.editorSetting && objColumn.editorSetting.customEditor) {
                objColumn.editorSetting.customEditor = this.__customEditor(objColumn.editorSetting.customEditor, objColumn);
            }
        }
        return objColumn;
    }
    ;
    __customEditor(customEditorComponent, objColumn) {
        const parentIns = this;
        return class extends NSGridCustomEditor {
            constructor() {
                super(parentIns, customEditorComponent, objColumn);
            }
        };
    }
    __renderer(rendererComponent, item, dataField, index, colIndex, row, props) {
        const objPromise = new Promise((parResolve, parReject) => {
            if (item) {
                let objRef = null;
                const callback = (dynamicCompRef, componentRef, container) => {
                    if (componentRef) {
                        componentRef.setData(item, dataField, index, colIndex, row);
                        const objItem = { instance: componentRef, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].renderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else {
                        const objItem = { instance: null, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].renderer = objItem;
                        this.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, objItem: objItem });
                    }
                };
                const callbackSent = callback;
                const promise = this.__getComponent(rendererComponent, dataField, index, callbackSent, props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else {
                parResolve(null);
            }
        });
        return objPromise;
    }
    ;
    __groupRenderer(rendererComponent, item, dataField, index, colIndex, row, arrChildren, childrenCount, arrFlatChildren, groupLevel, props) {
        const objPromise = new Promise((parResolve, parReject) => {
            if (item) {
                let objRef = null;
                const callback = (dynamicCompRef, componentRef, container) => {
                    if (componentRef) {
                        componentRef.setData(item, dataField, index, colIndex, row, arrChildren, childrenCount, arrFlatChildren, groupLevel);
                        const objItem = { instance: componentRef, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].groupRenderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else {
                        const objItem = { instance: null, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].groupRenderer = objItem;
                        this.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, objItem: objItem });
                    }
                };
                const callbackSent = callback;
                const promise = this.__getComponent(rendererComponent, dataField, index, callbackSent, props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else {
                parResolve(null);
            }
        });
        return objPromise;
    }
    ;
    __headerRenderer(rendererComponent, colItem, colIndex, props) {
        const objPromise = new Promise((parResolve, parReject) => {
            if (colItem) {
                let objRef = null;
                const callback = (dynamicCompRef, componentRef, container) => {
                    if (componentRef) {
                        componentRef.setData(colItem, colIndex);
                        const objItem = { instance: componentRef, componentRef: dynamicCompRef, index: index, colItem: colItem, colIndex: colIndex };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].headerRenderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else {
                        const objItem = { instance: null, componentRef: dynamicCompRef, index: index, colItem: colItem, colIndex: colIndex };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].headerRenderer = objItem;
                        this.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, objItem: objItem });
                    }
                };
                const callbackSent = callback;
                const dataField = colItem.dataField || '';
                const index = 0;
                const promise = this.__getComponent(rendererComponent, dataField, index, callbackSent, props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else {
                parResolve(null);
            }
        });
        return objPromise;
    }
    ;
    __toolTipRenderer(rendererComponent, item, dataField, index, colIndex, row, props) {
        const objPromise = new Promise((parResolve, parReject) => {
            if (item) {
                let objRef = null;
                const callback = (dynamicCompRef, componentRef, container) => {
                    if (componentRef) {
                        componentRef.setData(item, dataField, index, colIndex, row);
                        const objItem = { instance: componentRef, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].toolTipRenderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else {
                        const objItem = { instance: null, componentRef: dynamicCompRef, item: item, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].toolTipRenderer = objItem;
                        this.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, objItem: objItem });
                    }
                };
                const callbackSent = callback;
                const promise = this.__getComponent(rendererComponent, dataField, index, callbackSent, props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else {
                parResolve(null);
            }
        });
        return objPromise;
    }
    ;
    __extraRowHeaderRenderer(rendererComponent, dataField, colItem, filteredDataSource, index, colIndex, extraHeaderCell, extraHeaderRow, props) {
        const objPromise = new Promise((parResolve, parReject) => {
            if (colItem) {
                let objRef = null;
                const callback = (dynamicCompRef, componentRef, container) => {
                    if (componentRef) {
                        componentRef.setData(dataField, colItem, filteredDataSource, index, colIndex, extraHeaderCell, extraHeaderRow);
                        const objItem = { instance: componentRef, componentRef: dynamicCompRef, colItem: colItem, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].extraRowHeaderRenderer = objItem;
                        this.__emitRendererComponentCreated(objItem);
                    }
                    else {
                        const objItem = { instance: null, componentRef: dynamicCompRef, colItem: colItem, index: index, colIndex: colIndex, columnName: dataField };
                        this.__initializeCompInObject(dataField, index);
                        this.__objCustomComponent[dataField][index].extraRowHeaderRenderer = objItem;
                        this.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, objItem: objItem });
                    }
                };
                const callbackSent = callback;
                const promise = this.__getComponent(rendererComponent, dataField, index, callbackSent, props);
                promise.then((objParam) => {
                    objRef = objParam;
                    parResolve(objRef.container);
                });
            }
            else {
                parResolve(null);
            }
        });
        return objPromise;
    }
    ;
    __getComponent(rendererComponent, dataField, index, paramCallback, prop) {
        return new Promise((parResolve, parReject) => {
            if (dataField) {
                this.__initializeCompInObject(dataField, index);
            }
            const params = prop || {};
            const onInstanceCreated = (instance, container, portal) => {
                paramCallback && paramCallback(null, instance, container);
                parResolve({ instance, container, portal });
            };
            const portal = this.createUpdatedPortal(rendererComponent, params, onInstanceCreated);
            this.setState((prevState) => {
                //console.log("Previous State:", prevState);
                this.hasPortalUpdated = true;
                return {
                    dynamicComponents: [...prevState.dynamicComponents, portal],
                };
            });
        });
    }
    createUpdatedPortal(rendererComponent, prop, setInstance) {
        this.instanceCount += 1;
        const portal = NSReactDynamicComponent({
            component: rendererComponent,
            containerId: `ns-grid-react-container-${this.instanceCount}`,
            parentInstance: this,
            props: prop,
            //getStyleForContainer: this.__getStyleForContainer,
            onInstanceCreated: setInstance
        });
        return portal;
    }
    __initializeCompInObject(dataField, index) {
        if (!this.__objCustomComponent[dataField]) {
            this.__objCustomComponent[dataField] = [];
        }
        if (!this.__objCustomComponent[dataField][index]) {
            this.__objCustomComponent[dataField][index] = {};
        }
    }
    __processMasterDetailSetting(masterDetailSetting) {
        if (masterDetailSetting) {
            if (masterDetailSetting.detailRenderer) {
                masterDetailSetting.detailRenderer = this.__customDetailComponent(masterDetailSetting.detailRenderer);
            }
        }
        return masterDetailSetting;
    }
    __customDetailComponent(detailRenderer) {
        const parentIns = this;
        return class extends NSGridCustomDetailRenderer {
            constructor() {
                super(parentIns, detailRenderer);
            }
        };
    }
    __getStyleForContainer() {
        var _a;
        const style = {};
        const containerStyle = (_a = this.props) === null || _a === void 0 ? void 0 : _a.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, ((eventNameParam) => {
                return (event) => {
                    this.__eventListener(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
    __emitRendererComponentCreated(objItem) {
        this.__eventListener(objItem, "rendererComponentCreated");
    }
    ;
    __emitDetailComponentCreated(objItem) {
        this.__eventListener(objItem, "detailComponentCreated");
    }
    ;
}
NSGridReact.GRID_RENDERED = "gridRendered";
NSGridReact.MULTI_SELECTION_EDITORS_TEXT = "TEXT";
NSGridReact.MULTI_SELECTION_EDITORS_TEXTAREA = "TEXTAREA";
NSGridReact.GRID_TYPE_HIERARCHICAL = "hierarchical";
NSGridReact.GRID_TYPE_GROUP = "group";
NSGridReact.GRID_TYPE_NORMAL = "normal";
NSGridReact.GRID_TYPE_MASTER_DETAIL = "masterdetail";
NSGridReact.PAGINATION_TYPE_SCROLL = "scroll";
NSGridReact.PAGINATION_TYPE_PAGES = "pages";
NSGridReact.PAGINATION_MODE_AUTO = "auto";
NSGridReact.PAGINATION_MODE_MANUAL = "manual";
NSGridReact.RESPONSIVE_MODE_STACK = "stack";
NSGridReact.RESPONSIVE_MODE_COLUMN_TOGGLE = "columnToggle";
NSGridReact.ADVANCED_FILTER_TEXT = "text";
NSGridReact.ADVANCED_FILTER_NUMBER = "number";
NSGridReact.ADVANCED_FILTER_LIST = "list";
NSGridReact.MULTICOLUMN_KEY_SHIFT = "shift";
NSGridReact.MULTICOLUMN_KEY_CTRL = "ctrl";
NSGridReact.MULTICOLUMN_KEY_ALT = "alt";
NSGridReact.NAVIGATION_UP = "up";
NSGridReact.NAVIGATION_DOWN = "down";
//Editors
NSGridReact.EDITOR_EDITTYPE_CELL = "cell";
NSGridReact.EDITOR_EDITTYPE_ROW = "row";
NSGridReact.EDITOR_EDITING_SINGLECLICK = "singleClick";
NSGridReact.EDITOR_EDITING_DOUBLECLICK = "doubleClick";
NSGridReact.EDITOR_EDITING_NOCLICK = "noClick";
NSGridReact.EDITOR_TYPE_TEXT = "text";
NSGridReact.EDITOR_TYPE_TEXTAREA = "textArea";
NSGridReact.EDITOR_TYPE_CUSTOM = "custom";
class NSGridCustomDetailRenderer {
    constructor(parentIns, detailRenderer) {
        this.objComponent = null;
        this.componentRef = null;
        this.parentIns = parentIns;
        this.detailRenderer = detailRenderer;
    }
    init(param) {
        return new Promise((parResolve, parReject) => {
            const callback = (dynamicCompRef, localComponentRef, container) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;
                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                    this.objComponent.init(param);
                    const objItem = {
                        instance: this.objComponent,
                        componentRef: dynamicCompRef,
                        param: param
                    };
                    this.parentIns.__masterDetailRendererInstance[param.rowIndex] = objItem;
                    this.parentIns.__emitDetailComponentCreated(objItem);
                    parResolve(dynamicCompRef);
                }
                else {
                    const objItem = {
                        instance: null,
                        componentRef: this.componentRef,
                        param: param
                    };
                    this.parentIns.__masterDetailRendererInstance[param.rowIndex] = objItem;
                    this.parentIns.updateCallbacksOnUpdate.push({
                        callback: callbackSent,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        objItem: objItem
                    });
                }
            };
            const callbackSent = callback.bind(this); // Ensure `this` refers to Renderer instance
            if (!this.parentIns.__masterDetailRendererInstance) {
                this.parentIns.__masterDetailRendererInstance = [];
            }
            this.parentIns.__getComponent(this.detailRenderer, null, -1, callbackSent, param);
        });
    }
    getElement() {
        return this.containerRef;
    }
    elementAdded(params) {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded(params);
        }
    }
    renderEverytime(params) {
        if (this.objComponent && this.objComponent.renderEverytime) {
            return this.objComponent.renderEverytime(params);
        }
        return true;
    }
    destroy() {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }
}
class NSGridCustomEditor {
    constructor(parentIns, customEditorComponent, objColumn) {
        this.objComponent = null;
        this.componentRef = null;
        this.customEditorComponent = customEditorComponent;
        this.objColumn = objColumn;
        this.parentIns = parentIns;
    }
    init(setting) {
        return new Promise((parResolve, parReject) => {
            var _a;
            const callback = (dynamicCompRef, localComponentRef, container) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;
                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                    this.objComponent.init(setting);
                    const objItem = {
                        instance: this.objComponent,
                        componentRef: dynamicCompRef,
                        setting: setting,
                        colItem: this.objColumn,
                        index: setting.rowIndex,
                        colIndex: setting.cellIndex,
                        columnName: this.objColumn.dataField
                    };
                    if (this.objColumn.dataField) {
                        this.parentIns.__initializeCompInObject(this.objColumn.dataField, setting.rowIndex);
                        this.parentIns.__objCustomComponent[this.objColumn.dataField][setting.rowIndex].editor = objItem;
                    }
                    this.parentIns.__emitRendererComponentCreated(objItem);
                    parResolve(dynamicCompRef);
                }
                else {
                    const objItem = {
                        instance: null,
                        componentRef: this.componentRef,
                        setting: setting,
                        colItem: this.objColumn,
                        index: setting.rowIndex,
                        colIndex: setting.cellIndex,
                        columnName: this.objColumn.dataField
                    };
                    if (this.objColumn.dataField) {
                        this.parentIns.__initializeCompInObject(this.objColumn.dataField, setting.rowIndex);
                        this.parentIns.__objCustomComponent[this.objColumn.dataField][setting.rowIndex].editor = objItem;
                    }
                    this.parentIns.updateCallbacksOnUpdate.push({
                        callback: callbackSent,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        objItem: objItem
                    });
                }
            };
            const callbackSent = callback.bind(this);
            const index = setting.rowIndex;
            this.parentIns.__getComponent(this.customEditorComponent, ((_a = this.objColumn) === null || _a === void 0 ? void 0 : _a.dataField) || '', index, callbackSent, setting);
        });
    }
    getElement() {
        return this.containerRef;
    }
    elementAdded() {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded();
        }
    }
    handleKeyDown(event, keyCode) {
        if (this.objComponent && this.objComponent.handleKeyDown) {
            this.objComponent.handleKeyDown(event, keyCode);
        }
    }
    getValue() {
        return this.objComponent.getValue();
    }
    destroy() {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }
    setFocus() {
        if (this.objComponent && this.objComponent.setFocus) {
            this.objComponent.setFocus();
        }
    }
    hasFocus() {
        if ((this === null || this === void 0 ? void 0 : this.objComponent) && this.objComponent.hasFocus) {
            return this.objComponent.hasFocus();
        }
        return null;
    }
    hasValueChanged(currentValue) {
        if (this.objComponent && this.objComponent.hasValueChanged) {
            return this.objComponent.hasValueChanged(currentValue);
        }
        return null;
    }
    validate() {
        if (this.objComponent && this.objComponent.validate) {
            return this.objComponent.validate();
        }
        return null;
    }
    isPopUp() {
        if (this.objComponent && this.objComponent.isPopUp) {
            return this.objComponent.isPopUp();
        }
        return false;
    }
    save() {
        if (this.objComponent && this.objComponent.save) {
            this.objComponent.save();
        }
    }
    cancel() {
        if (this.objComponent && this.objComponent.cancel) {
            this.objComponent.cancel();
        }
    }
    setPopUpWrapper(popUpWrapper) {
        if (this.objComponent && this.objComponent.setPopUpWrapper) {
            this.objComponent.setPopUpWrapper(popUpWrapper);
        }
    }
}

var css_248z$7 = ".nsPanelModalProp\r\n{\r\n    display: none; /* Hidden by default */\r\n    position: fixed; /* Stay in place */\r\n    z-index: 1; /* Sit on top */\r\n    padding-top: 100px; /* Location of the box */\r\n    left: 0;\r\n    top: 0;\r\n    width: 100%; /* Full width */\r\n    height: 100%; /* Full height */\r\n    overflow: auto; /* Enable scroll if needed */\r\n    -webkit-backface-visibility: hidden;\r\n    backface-visibility: hidden;\r\n    background-color: rgba(0,0,0,.4);\r\n    transition: opacity .3s;\r\n}\r\n.nsPanelModalAnimation\r\n{\r\n\topacity: 0;\r\n    -webkit-transition: opacity .15s linear;\r\n    -o-transition: opacity .15s linear;\r\n    transition: opacity .15s linear;\r\n}\r\n.nsPanelModalProp.nsPanelModalOpen\r\n{\r\n\toverflow-x: hidden;\r\n    overflow-y: auto;\r\n}\r\n.nsPanelModalAnimation.nsPanelModalOpen\r\n{\r\n\topacity: 1;\r\n}\r\n.nsPanel \r\n{\r\n    /*margin: 0;*/\r\n    padding: 0;\r\n    width: 100%;\r\n    pointer-events: auto;\r\n    border-radius: .3rem;\r\n}\r\n.nsPanel.nsPanelModalContent \r\n{\r\n    position: relative;\r\n    margin: auto;\r\n    padding: 0;\r\n    width: 40%;\r\n    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);\r\n    z-Index: 100;\r\n}\r\n.nsPanel.nsPanelModalContentDrag\r\n{\r\n\tleft: 20%;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalZoom\r\n{\r\n\t-webkit-animation-name: nsAnimateZoomIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateZoomIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalZoom\r\n{\r\n\t-webkit-animation-name: nsAnimateZoomOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateZoomOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalLeft\r\n{\r\n\t-webkit-animation-name: nsAnimateLeftIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateLeftIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalLeft\r\n{\r\n\t-webkit-animation-name: nsAnimateLeftOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateLeftOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRight\r\n{\r\n\t-webkit-animation-name: nsAnimateRightIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRightIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRight\r\n{\r\n\t-webkit-animation-name: nsAnimateRightOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRightOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalTop\r\n{\r\n\t-webkit-animation-name: nsAnimateTopIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateTopIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalTop\r\n{\r\n\t-webkit-animation-name: nsAnimateTopOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateTopOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalBottom\r\n{\r\n\t-webkit-animation-name: nsAnimateBottomIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBottomIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalBottom\r\n{\r\n\t-webkit-animation-name: nsAnimateBottomOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBottomOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalFlipX\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipXIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipXIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalFlipX\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipXOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipXOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalFlipY\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipYIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipYIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalFlipY\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipYOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipYOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRoll\r\n{\r\n\t-webkit-animation-name: nsAnimateRollIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRollIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRoll\r\n{\r\n\t-webkit-animation-name: nsAnimateRollOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRollOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalBounce\r\n{\r\n\t-webkit-animation-name: nsAnimateBounceIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBounceIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalBounce\r\n{\r\n\t-webkit-animation-name: nsAnimateBounceOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBounceOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRotate\r\n{\r\n\t-webkit-animation-name: nsAnimateRotateIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRotateIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRotate\r\n{\r\n\t-webkit-animation-name: nsAnimateRotateOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRotateOut;\r\n    animation-duration: 0.5s;\r\n}\r\n\r\n.nsPanel.nsPanelOpen.nsPanelWidget\r\n{\r\n\twidth: 45%;\r\n    height: 45%;\r\n    background: #F6F6F6;\r\n}\r\n.nsPanel .nsPanelTitleBar \r\n{\r\n    text-align: left;\r\n    min-height: 20px;\r\n    box-sizing: border-box;\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: horizontal;\r\n    -webkit-box-direction: normal;\r\n    -ms-flex-direction: row;\r\n    flex-direction: row;\r\n    -ms-flex-wrap: nowrap;\r\n    flex-wrap: nowrap;\r\n    -webkit-box-align: center;\r\n    -ms-flex-align: center;\r\n    -ms-grid-row-align: center;\r\n    align-items: center;\r\n}\r\n.nsPanel .nsPanelTitleBarContent \r\n{\r\n    -webkit-box-flex: 1;\r\n    -ms-flex: 1 1 auto;\r\n    flex: 1 1 auto;\r\n    cursor: move;\r\n    overflow: hidden;\r\n}\r\n.nsPanel .nsPanelControlbar \r\n{\r\n    /*display: -webkit-box;\r\n    display: -ms-flexbox;*/\r\n    display: flex;\r\n    -webkit-box-align: center;\r\n    -ms-flex-align: center;\r\n    -ms-grid-row-align: center;\r\n    align-items: center;\r\n    float:right;\r\n}\r\n.nsPanel .nsPanelControlbar .nsPanelControlButton \r\n{\r\n    padding: 0 3px;\r\n    cursor: pointer;\r\n}\r\n/* donot give padding */\r\n.nsPanel .nsPanelBody \r\n{\r\n    overflow: auto;\r\n    height: 91%;\r\n    width:100%;\r\n}\r\n.nsPanel .nsPanelExpColIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelMinMaxIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelFullScreenIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelCloseIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanelMinimizeContainer \r\n{\r\n    bottom: 0;\r\n    left: 0;\r\n    position: fixed;\r\n    width: 100%;\r\n    z-index: 9999;\r\n}\r\n.nsPanelMinimized \r\n{\r\n    /*width: 250px;\r\n    height: 35px;\r\n    overflow: hidden !important;\r\n    padding: 0px !important;\r\n    margin: 0px;\r\n    position: static !important;*/\r\n    height: auto !important;\r\n    left: auto !important;\r\n    opacity: 1;\r\n    top: auto !important;\r\n    width: auto !important;\r\n    position: static !important;\r\n}\r\n.nsPanelMinimized.nsPanelMinimizedright\r\n{\r\n\tfloat: right;\r\n}\r\n.nsPanelMinimized.nsPanelMinimizedleft\r\n{\r\n\tfloat: left;\r\n}\r\n.nsPanelFullScreen \r\n{\r\n\theight: 100%!important;\r\n    width: 100%!important;\r\n    height: 100vh!important;\r\n    width: 100vw!important;\r\n    position: fixed!important; \r\n    top: 0!important; \r\n    left: 0!important; \r\n    bottom: 0!important;\r\n  \tright: 0!important;\r\n  \tmargin: 0;\r\n    z-index:100;\r\n    opacity:1;\r\n}\r\n\r\n/* Add Animation */\r\n@keyframes nsAnimateZoomIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    50% {\r\n        opacity: 1;\r\n    }\r\n}\r\n@keyframes nsAnimateZoomOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    50% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateTopIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,-100%,0);\r\n        transform: translate3d(0,-100%,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateTopOut {\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,100%,0);\r\n        transform: translate3d(0,100%,0);\r\n    }\r\n}\r\n@keyframes nsAnimateBottomIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,100%,0);\r\n        transform: translate3d(0,100%,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateBottomOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,-100%,0);\r\n        transform: translate3d(0,-100%,0);\r\n    }\r\n}\r\n@keyframes nsAnimateLeftIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0);\r\n        transform: translate3d(-100%,0,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateLeftOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0);\r\n        transform: translate3d(100%,0,0);\r\n    }\r\n}\r\n@keyframes nsAnimateRightIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0);\r\n        transform: translate3d(100%,0,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateRightOut {\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0);\r\n        transform: translate3d(-100%,0,0);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipXIn{\r\n    0% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n        opacity: 0;\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n    }\r\n\r\n    60% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,10deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,10deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-5deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-5deg);\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipXOut{\r\n    0% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n\r\n    30% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateFlipYIn{\r\n    0% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n        opacity: 0;\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-20deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-20deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n    }\r\n\r\n    60% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,10deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,10deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-5deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-5deg);\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipYOut{\r\n    0% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n\r\n    30% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-15deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-15deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateRollIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);\r\n        transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateRollOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0) rotate3d(0,0,1,120deg);\r\n        transform: translate3d(100%,0,0) rotate3d(0,0,1,120deg);\r\n    }\r\n}\r\n@keyframes nsAnimateBounceIn {\r\n    0%,100%,20%,40%,60%,80% {\r\n        -webkit-transition-timing-function: cubic-bezier(0.215,.61,.355,1);\r\n        transition-timing-function: cubic-bezier(0.215,.61,.355,1);\r\n    }\r\n\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    20% {\r\n        -webkit-transform: scale3d(1.1,1.1,1.1);\r\n        transform: scale3d(1.1,1.1,1.1);\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: scale3d(.9,.9,.9);\r\n        transform: scale3d(.9,.9,.9);\r\n    }\r\n\r\n    60% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1.03,1.03,1.03);\r\n        transform: scale3d(1.03,1.03,1.03);\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: scale3d(.97,.97,.97);\r\n        transform: scale3d(.97,.97,.97);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1,1,1);\r\n        transform: scale3d(1,1,1);\r\n    }\r\n}\r\n@keyframes nsAnimateBounceOut{\r\n\t20% {\r\n        -webkit-transform: scale3d(.9,.9,.9);\r\n        transform: scale3d(.9,.9,.9);\r\n    }\r\n\r\n    50%,55% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1.1,1.1,1.1);\r\n        transform: scale3d(1.1,1.1,1.1);\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n}\r\n@keyframes nsAnimateRotateIn {\r\n    0% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: rotate3d(0,0,1,-200deg);\r\n        transform: rotate3d(0,0,1,-200deg);\r\n        opacity: 0;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n        opacity: 1;\r\n    }\r\n}\r\n@keyframes nsAnimateRotateOut {\r\n    0% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: rotate3d(0,0,1,200deg);\r\n        transform: rotate3d(0,0,1,200deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n/****************************************White Theme ***************************************/\r\n.nsPanelWhite\r\n{\r\n\tbackground-color: #fefefe;\r\n\t/*border: 1px solid rgba(0,0,0,.2);*/\r\n\tborder: 5px solid #157fcc;\r\n}\r\n.nsPanelModalWhite .nsPanelWhite\r\n{\r\n\tbackground-color: #fff;\r\n    border: 5px solid #157fcc;\r\n}\r\n.nsPanelWhite .nsPanelTitleBar\r\n{\r\n\tbackground-color: #157fcc;\r\n\tfont-weight: bold;\r\n}\r\n.nsPanelWhite .nsPanelTitleBarContent\r\n{\r\n\tcolor: #fefefe;\r\n}\r\n.nsPanelWhite .nsPanelExpColIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n.nsPanelWhite .nsPanelMinMaxIconUse \r\n{\r\n  fill: #F6F6F6;\r\n  color: #848484;\r\n}\r\n.nsPanelWhite .nsPanelCloseIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n.nsPanelWhite .nsPanelFullScreenIcon\r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n/****************************************End of White Theme ***************************************/.nsMessageBox .nsPanelBody\r\n{\r\n\toverflow: hidden;\r\n} \r\n\r\n.nsMessageBox .nsMessageBoxHeader \r\n{\r\n    padding: 15px;\r\n    border-bottom: 1px solid #e5e5e5;\r\n}\r\n.nsMessageBox .nsMessageBoxTitle \r\n{\r\n    margin: 0;\r\n    line-height: 1.42857143;\r\n}\r\n.nsMessageBox .nsMessageBoxContainer\r\n{\r\n\theight:95%;\r\n}\r\n.nsMessageBox .nsMessageBoxBody \r\n{\r\n    position: relative;\r\n    padding: 15px;\r\n    height: 80%;\r\n    overflow: auto;\r\n}\r\n.nsMessageBox .nsMessageBoxFooter \r\n{\r\n    padding: 15px;\r\n    border-top: 1px solid #e5e5e5;\r\n    height: 20%;\r\n}\r\n\r\n.nsMessageBox .nsMessageBoxFooter .nsMessageBoxFooterLeft\r\n{\r\n\twidth: 50%;\r\n\tfloat: left;\r\n\ttext-align: left;\r\n\theight: 100%;\t\r\n}\r\n\r\n.nsMessageBox .nsMessageBoxFooter .nsMessageBoxFooterRight\r\n{\r\n\twidth: 50%;\r\n\tfloat: left;\r\n\ttext-align: right;\t\r\n\theight: 100%;\r\n}\r\n\r\n.nsMessageBox .nsMessageBoxClose \r\n{\r\n\t-webkit-appearance: none;\r\n\tpadding: 0;\r\n    cursor: pointer;\r\n    background: transparent;\r\n    border: 0;\r\n    font-size: 21px;\r\n    font-weight: bold;\r\n    line-height: 1;\r\n    color: #000;\r\n    text-shadow: 0 1px 0 #fff;\r\n    filter: alpha(opacity=20);\r\n    opacity: .2;\r\n}\r\n.nsMessageBox .nsMessageBoxButtonContainer\r\n{\r\n\tmargin: 5px;\r\n\tdisplay: inline-block;\r\n\tposition: relative;\r\n}\r\n.nsPanelMessageBoxWhite\r\n{\r\n\tbackground-color: #fefefe;\r\n}\r\n.nsPanelMessageBoxWhite .nsPanelTitleBar\r\n{\r\n\tbackground-color: #ffffff;\r\n}\r\n.nsPanelMessageBoxWhite .nsPanelTitleBarContent\r\n{\r\n\tcolor: #333;\r\n}\r\n.nsPanelMessageBoxWhite .nsPanelExpColIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n.nsPanelMessageBoxWhite .nsPanelMinMaxIconUse \r\n{\r\n  fill: #F6F6F6;\r\n  color: #848484;\r\n}\r\n/*.nsPanelMessageBoxWhite .nsPanelCloseIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}*/\r\n.nsPanelMessageBoxWhite .nsPanelFullScreenIcon\r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}";
styleInject(css_248z$7);

const nsCompUtil$9 = require('./generated/js/nsUtil.min.js');
const NSUtil$9 = nsCompUtil$9.NSUtil;
const nsCompMessageBox$2 = require('./generated/js/nsMessageBox.min.js');
const NSMessageBox$1 = nsCompMessageBox$2.NSMessageBox;
const NSPanel$2 = nsCompMessageBox$2.NSPanel;
class NSMessageBoxReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
        this.instanceCount = 0;
        this.hasPortalUpdated = false;
        this.state = {
            dynamicComponents: [],
        };
        //DynamicComponentService.addDefaultMethods(this,"NSMessageBoxReact",null,this.batchUpdateCallback.bind(this));
    }
    componentDidMount() {
        if (!this.__objNSPanel) {
            this.__nsUtil = new NSUtil$9();
            this.__arrEvents = [NSPanel$2.DRAG_STARTING,
                NSPanel$2.DRAGGING,
                NSPanel$2.DRAG_END,
                NSPanel$2.RESIZE_STARTING,
                NSPanel$2.RESIZING,
                NSPanel$2.RESIZE_END,
                NSPanel$2.COLLAPSE_STARTING,
                NSPanel$2.COLLAPSE_END,
                NSPanel$2.EXPANSION_STARTING,
                NSPanel$2.EXPANSION_END,
                NSPanel$2.MINIMIZE_STARTING,
                NSPanel$2.MINIMIZE_END,
                NSPanel$2.MAXIMIZE_STARTING,
                NSPanel$2.MAXIMIZE_END,
                NSPanel$2.FULLSCREEN_STARTING,
                NSPanel$2.FULLSCREEN_END,
                NSPanel$2.RESTORE_STARTING,
                NSPanel$2.RESTORE_END,
                NSPanel$2.CLOSED];
            if (!this.props) {
                this.props = {};
            }
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__setting = setting;
            /*if(this.__container)
            {
               this.__objBodyContent = this.__container;
            }
            this.__createComponent();*/
        }
        this.__hasInitialized = true;
        this.__hasDestroyed = false;
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.hasPortalUpdated) {
            setTimeout(() => {
                this.hasPortalUpdated = false;
            }, 0);
            return true;
        }
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            if (this.__objNSPanel) {
                this.__objNSPanel.removeComponent();
                this.__objNSPanel = null;
            }
            /*if(this.__objCustomComponent) {
                const dynamicCompRef: MessageBoxComponentRef = this.__objCustomComponent.componentRef;
                if(dynamicCompRef) {
                    if(typeof dynamicCompRef === 'function'){
                        setTimeout(() => {
                            dynamicCompRef();
                        }, 0);
                    }
                }
            }*/
            const arrCon = document.querySelectorAll(".nsPanelModal");
            if (arrCon && arrCon.length) {
                for (const div of arrCon) {
                    if (div.parentElement) {
                        div.parentElement.removeChild(div);
                    }
                }
            }
            this.__arrEvents.forEach(eventName => {
                this.__nsUtil.removeEvent(this.__container, eventName);
            });
            this.__hasDestroyed = true;
        }
    }
    render() {
        var _a;
        return (React.createElement("div", { style: this.__getStyleForContainer(), ref: (e) => { this.__container = e; } }, this.__objNSPanel && ((_a = this.state.dynamicComponents) === null || _a === void 0 ? void 0 : _a.map((portal, index) => (React.createElement(React.Fragment, { key: index }, portal))))));
    }
    getElement() {
        return this.__container;
    }
    ;
    minimize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.minimize();
        }
    }
    ;
    maximize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.maximize();
        }
    }
    ;
    collapse() {
        if (this.__objNSPanel) {
            this.__objNSPanel.collapse();
        }
    }
    ;
    expand() {
        if (this.__objNSPanel) {
            this.__objNSPanel.expand();
        }
    }
    ;
    fullScreen() {
        if (this.__objNSPanel) {
            this.__objNSPanel.fullScreen();
        }
    }
    ;
    restore() {
        if (this.__objNSPanel) {
            this.__objNSPanel.restore();
        }
    }
    ;
    disableResize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableResize();
        }
    }
    ;
    disableDrag() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableDrag();
        }
    }
    ;
    disableCollapse() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableCollapse();
        }
    }
    ;
    disableMinMax() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableMinMax();
        }
    }
    ;
    disableFullScreen() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableFullScreen();
        }
    }
    ;
    isCollapsed() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isCollapsed();
        }
        return false;
    }
    ;
    isMinimized() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isMinimized();
        }
        return false;
    }
    ;
    isFullScreen() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isFullScreen();
        }
        return false;
    }
    ;
    alert(message, title, callback) {
        this.__createComponent();
        this.__objNSMessageBox.alert(message, title, callback);
        this.__creationHandler();
    }
    ;
    confirm(message, title, confirmCallback, cancelCallback) {
        this.__createComponent();
        this.__objNSMessageBox.confirm(message, title, confirmCallback, cancelCallback);
        this.__creationHandler();
    }
    ;
    custom(setting) {
        this.__createComponent();
        if (!setting) {
            setting = {};
        }
        if (setting.bodyComponent) {
            setting.bodyComponent = this.__customBodyComponent(setting.bodyComponent, (instance) => {
                setting.bodyComponentInstance = instance;
                this.__bodyComponentInstance = instance;
            });
        }
        else if (!setting.bodyContent && !setting.bodyTemplate && !setting.bodyContent) {
            if (this.__container) {
                setting.bodyContent = this.__container;
            }
        }
        this.__objNSMessageBox.custom(setting);
        this.__creationHandler();
    }
    ;
    close() {
        if (this.__objNSMessageBox) {
            //this.__objNSMessageBox.close();
            if (this.__objNSPanel) {
                const divModal = this.__objNSPanel.__divModal;
                divModal.style.display = "none";
                divModal.classList.remove("nsPanelModalOpen");
            }
            if (this.__objCustomComponent && this.__objCustomComponent.componentRef) ;
        }
        if (this.__bodyComponentInstance) {
            if (this.__bodyComponentInstance.componentWillUnmount) {
                this.__bodyComponentInstance.componentWillUnmount.call(this.__bodyComponentInstance);
            }
            this.__bodyComponentInstance = null;
        }
        this.__objNSPanel = null;
    }
    ;
    removeModal() {
        if (this.__objNSMessageBox) {
            this.__objNSMessageBox.removeModal();
            if (this.__objCustomComponent && this.__objCustomComponent.componentRef) ;
        }
        if (this.__bodyComponentInstance) {
            if (this.__bodyComponentInstance.componentWillUnmount) {
                this.__bodyComponentInstance.componentWillUnmount.call(this.__bodyComponentInstance);
            }
            this.__bodyComponentInstance = null;
        }
        this.__objNSPanel = null;
    }
    ;
    changeButtonStyle(btnIdentifier, objStyle) {
        if (this.__objNSMessageBox) {
            this.__objNSMessageBox.changeButtonStyle(btnIdentifier, objStyle);
        }
    }
    getPanel() {
        return this.__objNSPanel;
    }
    ;
    getBodyComponentInstance() {
        return this.__bodyComponentInstance;
    }
    ;
    __createComponent() {
        if (this.__objNSMessageBox) {
            this.__objNSMessageBox = null;
        }
        this.__objNSMessageBox = new NSMessageBox$1(this.__setting);
        this.__addEvents();
    }
    ;
    __creationHandler() {
        this.__objNSPanel = this.__objNSMessageBox.getPanel();
        if (!this.__container) {
            this.__container = this.__objNSPanel.getBaseElement();
        }
    }
    ;
    __customBodyComponent(customEditorComponent, mainCallback) {
        const parentIns = this;
        return class extends CustomBodyComponent {
            constructor() {
                super(parentIns, customEditorComponent, mainCallback);
            }
        };
    }
    ;
    __getComponent(rendererComponent, paramCallback, prop) {
        return new Promise((parResolve, parReject) => {
            let params = {};
            if (prop) {
                params = prop;
            }
            const onInstanceCreated = (instance, container, portal) => {
                paramCallback && paramCallback(null, instance, container);
                parResolve({ instance, container, portal });
            };
            const portal = this.createUpdatedPortal(rendererComponent, params, onInstanceCreated);
            this.setState((prevState) => {
                //console.log("Previous State:", prevState);
                this.hasPortalUpdated = true;
                return {
                    dynamicComponents: [...prevState.dynamicComponents, portal],
                };
            });
        });
    }
    ;
    createUpdatedPortal(rendererComponent, prop, setInstance) {
        this.instanceCount += 1;
        const portal = NSReactDynamicComponent({
            component: rendererComponent,
            containerId: `ns-message-box-react-container-${this.instanceCount}`,
            parentInstance: this,
            props: prop,
            //getStyleForContainer: this.__getStyleForContainer,
            onInstanceCreated: setInstance
        });
        return portal;
    }
    __getStyleForContainer() {
        const style = { height: "100%", display: "none" };
        /*const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }*/
        return style;
    }
    __addEvents() {
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, ((eventNameParam) => {
                return (event) => {
                    this.__eventListener(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
    __emitRendererComponentCreated(objItem) {
        this.__eventListener(objItem, "rendererComponentCreated");
    }
    ;
}
class CustomBodyComponent {
    constructor(parentInstance, customEditorComponent, mainCallback) {
        this.objComponent = null;
        this.componentRef = null;
        this.parentInstance = parentInstance;
        this.customEditorComponent = customEditorComponent;
        this.mainCallback = mainCallback;
    }
    init(data) {
        return new Promise((parResolve, parReject) => {
            const callback = (dynamicCompRef, localComponentRef, container) => {
                this.componentRef = dynamicCompRef;
                this.containerRef = container;
                if (localComponentRef) {
                    this.objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                    if (this.objComponent && this.objComponent.init) {
                        this.mainCallback && this.mainCallback(this.objComponent);
                        this.objComponent.init(data);
                    }
                    this.parentInstance.__objCustomComponent = {
                        instance: this.objComponent,
                        componentRef: this.componentRef,
                        component: this.customEditorComponent,
                        data: data,
                    };
                    this.parentInstance.__emitRendererComponentCreated(this.parentInstance.__objCustomComponent);
                    parResolve(dynamicCompRef);
                }
                else {
                    this.parentInstance.updateCallbacksOnUpdate.push({
                        callback: callback,
                        dynamicCompRef: dynamicCompRef,
                        container: container,
                        data: data
                    });
                }
            };
            this.parentInstance.__getComponent(this.customEditorComponent, callback, data);
        });
    }
    getElement() {
        return this.containerRef;
    }
    elementAdded() {
        if (this.objComponent && this.objComponent.elementAdded) {
            this.objComponent.elementAdded();
        }
    }
    destroy() {
        if (this.objComponent && this.objComponent.destroy) {
            this.objComponent.destroy();
        }
    }
}

var css_248z$6 = ".nsMultiSelectDropdownContainer\r\n{\r\n   position: relative;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabelContainer \r\n{\r\n    width:100%;\r\n    min-height: 26px;\r\n    padding: 0;\r\n    overflow: hidden;\r\n    cursor: pointer;\r\n    text-align: left;\r\n    white-space: nowrap;\r\n    text-decoration: none;\r\n    border: 1px solid #aaa;\r\n    color: #444;\r\n    background-color: #fff;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabel \r\n{\r\n\tposition: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    right: 20px;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n    display: block;\r\n    padding-left: 8px;\r\n    height: 100%;\r\n    padding-top: 2px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabel.nsLabelPlaceHolder \r\n{\r\n\tcolor: #999;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabel.nsLabelNoArrow \r\n{\r\n\twidth:100%;\r\n\tpadding-left: 0px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabelContainer .nsLabelArrow\r\n{\r\n    content: \"\";\r\n    width: 0;\r\n    height: 0;\r\n    position: absolute;\r\n    right: 6px;\r\n    top: 50%;\r\n    margin-top: -3px;\r\n    border-width: 6px 6px 0 6px;\r\n    border-style: solid;\r\n    border-color: grey transparent;\r\n}\r\n.nsMultiSelectDropdownContainer .nsLabelContainer.nsLabelContainerActive .nsLabelArrow\r\n{\r\n\tborder-width: 0 6px 6px 6px;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsHorizontalListContainer\r\n{\r\n    z-index: 1;\r\n    display: inline-block;\r\n    width: 100%;\r\n    cursor: text;\r\n    line-height: 18px;\r\n    color: #303030;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsHorizontalListItemTag\r\n{\r\n     position: relative;\r\n     display: inline-block;\r\n     padding: 4px 24px 4px 8px;\r\n     background: #5e6264;\r\n     color: #fff;\r\n     border-radius: 4px;\r\n     margin: 5px 10px 5px 0;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsHorizontalListItemTag .nsHorizontalListItemText\r\n{\r\n    min-height: 16px;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsHorizontalListItemTag .nsHorizontalListItemClose \r\n{\r\n\tposition: absolute;\r\n    top: 6px;\r\n    right: 4px;\r\n\twidth: 14px;\r\n\theight: 18px;\r\n\tcursor: pointer; \r\n    cursor: hand;\r\n    background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px'%0AviewBox='0 0 172 172'%0Astyle=' fill:%23000000;'%3E%3Cg fill='none' %3E%3Cpath d='M0,172v-172h172v172z' fill='none'%3E%3C/path%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M143.78125,129.93029l-13.8768,13.85096c-2.53246,2.55829 -6.66707,2.55829 -9.22536,0l-34.67909,-34.65324l-34.65324,34.65324c-2.55829,2.55829 -6.71875,2.55829 -9.25121,0l-13.8768,-13.85096c-2.55829,-2.55829 -2.55829,-6.69291 0,-9.2512l34.65324,-34.67909l-34.65324,-34.65324c-2.53245,-2.58413 -2.53245,-6.74459 0,-9.25121l13.8768,-13.8768c2.53246,-2.55829 6.69291,-2.55829 9.25121,0l34.65324,34.67909l34.67909,-34.67909c2.55829,-2.55829 6.71875,-2.55829 9.22536,0l13.8768,13.85096c2.55829,2.55829 2.55829,6.71875 0.02584,9.27704l-34.67908,34.65324l34.65324,34.67909c2.55829,2.55829 2.55829,6.6929 0,9.2512z'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A\");\r\n    background-repeat: no-repeat;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsVerticalListContainer \r\n{\r\n  \tlist-style-type: none;\r\n  \tpadding: 0;\r\n  \tmargin: 0;\r\n  \tcolor: #303030;\r\n  \tmargin-left: -8px\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsVerticalListContainer .nsVerticalListItemTag \r\n{\r\n  \tmargin-top: -1px; /* Prevent double borders */\r\n  \tbackground: #5e6264;\r\n    color: #fff;\r\n    border: 1px solid #ddd;\r\n  \tpadding: 4px 24px 4px 8px;\r\n  \ttext-decoration: none;\r\n  \tdisplay: block;\r\n  \tposition: relative;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsVerticalListItemTag .nsVerticalListItemText\r\n{\r\n\twidth: 100%;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsLabel .nsVerticalListItemTag .nsVerticalListItemClose  \r\n{\r\n  \tposition: absolute;\r\n    top: 6px;\r\n    right: 4px;\r\n\twidth: 14px;\r\n\theight: 18px;\r\n\tcursor: pointer; \r\n    cursor: hand;\r\n    background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px'%0AviewBox='0 0 172 172'%0Astyle=' fill:%23000000;'%3E%3Cg fill='none' %3E%3Cpath d='M0,172v-172h172v172z' fill='none'%3E%3C/path%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M143.78125,129.93029l-13.8768,13.85096c-2.53246,2.55829 -6.66707,2.55829 -9.22536,0l-34.67909,-34.65324l-34.65324,34.65324c-2.55829,2.55829 -6.71875,2.55829 -9.25121,0l-13.8768,-13.85096c-2.55829,-2.55829 -2.55829,-6.69291 0,-9.2512l34.65324,-34.67909l-34.65324,-34.65324c-2.53245,-2.58413 -2.53245,-6.74459 0,-9.25121l13.8768,-13.8768c2.53246,-2.55829 6.69291,-2.55829 9.25121,0l34.65324,34.67909l34.67909,-34.67909c2.55829,-2.55829 6.71875,-2.55829 9.22536,0l13.8768,13.85096c2.55829,2.55829 2.55829,6.71875 0.02584,9.27704l-34.67908,34.65324l34.65324,34.67909c2.55829,2.55829 2.55829,6.6929 0,9.2512z'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A\");\r\n    background-repeat: no-repeat;\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsDropdownContainer \r\n{\r\n    position: absolute;\r\n    left: 0px;\r\n    width:100%;\r\n    overflow: hidden;\r\n    margin-top: -1px;\r\n    padding: 0;\r\n    box-sizing: border-box;\r\n    display: none;\r\n    z-index: 1000;\r\n    background: #fff;\r\n    color: #000;\r\n    border: 1px solid #aaa;\r\n}\r\n.nsMultiSelectDropdownContainer .nsDropdownContainer.nsDropdownContainerBottom\r\n{\r\n\ttop: 100%;\r\n\tbox-shadow: 0 4px 5px rgba(0, 0, 0, .15);\r\n}\r\n.nsMultiSelectDropdownContainer .nsDropdownContainer.nsDropdownContainerTop\r\n{\r\n\tbottom: 100%;\r\n\tbox-shadow: 0 -4px 5px rgba(0, 0, 0, .15);\r\n}\r\n\r\n.nsMultiSelectDropdownContainer .nsDropdownSearchContainer\r\n{\r\n\tdisplay: inline-block;\r\n    margin: 0 auto;\r\n    min-height: 26px;\r\n    padding: 4px;\r\n    position: relative;\r\n    white-space: nowrap;\r\n    width: 100%;\r\n    z-index: 10000;\r\n    box-sizing: border-box;\r\n    border: 1px solid #a9a9a9d4;\r\n}\r\n.nsMultiSelectDropdownContainer .nsDropdownSearch \r\n{\r\n   \twidth: 92%;\r\n    height: auto !important;\r\n    min-height: 24px;\r\n    margin: 0;\r\n    outline: 0;\r\n    font-family: sans-serif;\r\n    font-size: 16px;\r\n    border: 1px solid #aaa;\r\n    border-radius: 0;\r\n    box-shadow: none;\r\n    border: none;\r\n}\r\n.nsMultiSelectDropdownContainer .nsDropdownSearchIcon\r\n{\r\n   \twidth:16px;\r\n   \theight:16px;\r\n   \tdisplay:inline-block;\r\n   \tposition: absolute;\r\n   \tright: 6px;\r\n   \ttop: 25%;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListContainer\r\n{\r\n\toverflow: auto;\r\n    margin: 0px;\r\n    padding: 5px 8px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListItem\r\n{\r\n\tlist-style: none;\r\n    display: list-item;\r\n    background-image: none;\r\n    position: static;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListItemLabelContainer\r\n{\r\n\tfont-weight: normal;\r\n    display: block;\r\n    white-space: nowrap;\r\n    margin-bottom: 5px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListItemLabelContainer.nsListItemDisabled\r\n{\r\n\topacity: .35;\r\n    filter: Alpha(Opacity=35);\r\n}\r\n.nsMultiSelectDropdownContainer .nsListCheckbox \r\n{\r\n\tvertical-align: middle;\r\n    margin: 5px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListLabel \r\n{\r\n}\r\n.nsMultiSelectDropdownContainer .nsListShow\r\n{\r\n\tdisplay: block;\r\n}\r\n.nsMultiSelectDropdownContainer .nsMultiSelectScroller\r\n{\r\n\topacity: 0;\r\n\tposition: absolute;\r\n  \ttop: 0;\r\n  \tleft: 0;\r\n  \twidth: 1px;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListContainerVirtual\r\n{\r\n\tposition: relative;\r\n}\r\n.nsMultiSelectDropdownContainer .nsListItemVirtual\r\n{\r\n\tposition: absolute;\r\n}";
styleInject(css_248z$6);

const nsCompUtil$8 = require('./generated/js/nsUtil.min.js');
const NSUtil$8 = nsCompUtil$8.NSUtil;
const nsCompMultiSelectDropdown$1 = require('./generated/js/nsMultiSelectDropdown.min.js');
const NSMultiSelectDropdown$1 = nsCompMultiSelectDropdown$1.NSMultiSelectDropdown;
class NSMultiselectDropdownReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__objNSMultiSelectDropdown) {
            this.__nsUtil = new NSUtil$8();
            this.__arrEvents = [NSMultiSelectDropdown$1.DROPDOWN_OPEN,
                NSMultiSelectDropdown$1.DROPDOWN_CLOSE,
                NSMultiSelectDropdown$1.DROPDOWN_ITEM_CLICK,
            ];
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__setting = setting;
            if ((!this.__source || this.__source.length === 0) && (this.props.dataSource && this.props.dataSource.length > 0)) {
                this.__source = [...this.props.dataSource];
            }
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        var _a, _b;
        /*for (const propName in nextProps) {
            if (JSON.stringify(nextProps[propName]) !== JSON.stringify(this.props[propName])) {
              console.log(`Prop '${propName}' changed from ${this.props[propName]} to ${nextProps[propName]}`);
            }
        }*/
        if (this.__objNSMultiSelectDropdown) {
            if (JSON.stringify(nextProps.dataSource) !== JSON.stringify(this.props.dataSource)) {
                this.dataSource(nextProps.dataSource);
            }
            if (JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value) || (((_a = nextProps.value) === null || _a === void 0 ? void 0 : _a.length) > 0 && ((_b = this.getSelectedItems()) === null || _b === void 0 ? void 0 : _b.length) === 0)) {
                const selectedItems = this.getSelectedItems();
                if (selectedItems && selectedItems.length > 0 && JSON.stringify(selectedItems) !== JSON.stringify(nextProps.value)) {
                    this.setSelectUnselectItems(selectedItems, false);
                }
                this.setSelectUnselectItems(nextProps.value, true);
            }
        }
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    componentDidUpdate(prevProps) {
        if (this.props.someValue !== prevProps.someValue) {
            console.log('someValue has changed!');
            // Perform any actions needed in response to the prop change.
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    create() {
        if (!this.__objNSMultiSelectDropdown && this.__setting) {
            if (this.__source && this.__source.length > 0) {
                this.__setting["dataSource"] = this.__source;
            }
            this.__objNSMultiSelectDropdown = new NSMultiSelectDropdown$1(this.__container, this.__setting);
            if (this.__arrItems != null && this.__arrItems.length > 0) {
                for (let item of this.__arrItems) {
                    this.setSelectUnselectItems(item.items, item.isSelected);
                }
                this.__arrItems = null;
            }
            if (this.__arrValues != null && this.__arrValues.length > 0) {
                for (let item of this.__arrValues) {
                    this.setSelectUnselectItemsByValue(item.values, item.isSelected);
                }
                this.__arrValues = null;
            }
        }
    }
    ;
    dataSource(source) {
        this.__source = source;
        this.create();
        if (this.__objNSMultiSelectDropdown) {
            this.__objNSMultiSelectDropdown.dataSource(source);
            if (this.props.value && this.props.value.length > 0) {
                this.__objNSMultiSelectDropdown.setSelectUnselectItems(this.props.value, true);
            }
        }
    }
    ;
    getSelectedIndexes() {
        return this.__objNSMultiSelectDropdown.getSelectedIndexes();
    }
    ;
    getSelectedItems() {
        return this.__objNSMultiSelectDropdown.getSelectedItems();
    }
    ;
    setSelectUnselectItemsByValue(arrValue, isSelected) {
        if (this.__objNSMultiSelectDropdown) {
            this.__objNSMultiSelectDropdown.setSelectUnselectItemsByValue(arrValue, isSelected);
        }
        else {
            if (!this.__arrValues) {
                this.__arrValues = [];
            }
            this.__arrValues.push({ values: arrValue, isSelected: isSelected });
        }
    }
    ;
    setSelectUnselectItems(arrItems, isSelected) {
        if (this.__objNSMultiSelectDropdown) {
            this.__objNSMultiSelectDropdown.setSelectUnselectItems(arrItems, isSelected);
        }
        else {
            if (!this.__arrItems) {
                this.__arrItems = [];
            }
            this.__arrItems.push({ items: arrItems, isSelected: isSelected });
        }
    }
    ;
    setStyle(styleProp, value) {
        this.__objNSMultiSelectDropdown.setStyle(styleProp, value);
    }
    ;
    setFocus(isFocus) {
        this.__objNSMultiSelectDropdown.setFocus(isFocus);
    }
    ;
    hasFocus() {
        return this.__objNSMultiSelectDropdown.hasFocus();
    }
    ;
    setTheme(theme) {
        this.__objNSMultiSelectDropdown.setTheme(theme);
    }
    ;
    changeProperty(propertyName, value) {
        this.__objNSMultiSelectDropdown.changeProperty(propertyName, value);
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    console.log(event);
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}
NSMultiselectDropdownReact.LABEL_TYPE_OF_TEXT = NSMultiSelectDropdown$1.LABEL_TYPE_OF_TEXT;
NSMultiselectDropdownReact.LABEL_TYPE_HORIZONTAL_LIST = NSMultiSelectDropdown$1.LABEL_TYPE_HORIZONTAL_LIST;
NSMultiselectDropdownReact.LABEL_TYPE_VERTICAL_LIST = NSMultiSelectDropdown$1.LABEL_TYPE_VERTICAL_LIST;

var css_248z$5 = "/*Concept from https://codepen.io/chriscoyier/pen/CiflJ*/\r\n.nsFloatingLabel \r\n{\r\n\t/*width: 100%;*/\r\n\toverflow: hidden;\r\n\ttext-rendering: optimizeLegibility;\r\n    -webkit-font-smoothing: antialiased;\r\n    -moz-osx-font-smoothing: grayscale;\r\n}\r\n.nsFloatingLabel .nsFloatingLabelConatiner \r\n{\r\n\tposition: relative;\r\n\toverflow: hidden;\r\n}\r\n.nsFloatingLabel .nsFloatingLabelControl\r\n{\r\n\tbackground: none;\r\n\tposition: relative;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tz-index: 1;\r\n\tpadding: 6px 12px;\r\n\toutline: 0;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelActive .nsFloatingLabelLabel\r\n{\r\n\topacity: 1;\r\n    visibility: visible;\r\n\tfont-size: 70%;\r\n\tpadding: 1px 6px;\r\n\tz-index: 2;\r\n}\r\n.nsFloatingLabel .nsFloatingLabelLabel\r\n{\r\n\topacity: 0;\r\n    visibility: hidden;\r\n\tbox-sizing: border-box;\r\n\ttransition: all 0.2s ease-in-out;\r\n\tposition: absolute;\r\n\tpadding: 7px 6px;\r\n\tcursor: pointer;\r\n}\r\n.nsFloatingLabel .nsFloatingLabelTextArea \r\n{\r\n\tdisplay: block;\r\n\tresize: vertical;\r\n}\r\n/**top css starts **/\r\n.nsFloatingLabel.nsFloatingLabelTop\r\n{\r\n\toverflow: visible;/* default value for overflow*/\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop .nsFloatingLabelConatiner \r\n{\r\n\toverflow: visible;/* default value for overflow*/\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop .nsFloatingLabelControl \r\n{\r\n\twidth: calc(100% - 28px);/*12 * 2(padding) + 2 * 2(margin)*/\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopTop .nsFloatingLabelControl \r\n{\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopMiddle .nsFloatingLabelControl \r\n{\r\n  \tpadding: 6px 12px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopBottom .nsFloatingLabelControl \r\n{\r\n\tpadding: 18px 12px 6px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop .nsFloatingLabelLabel \r\n{\r\n\tfont-size: 12px;\r\n    line-height: 1;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopTop .nsFloatingLabelLabel\r\n{\r\n\ttop: -14px;\r\n    left: 0;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopMiddle .nsFloatingLabelLabel:before\r\n{\r\n\tcontent: '';\r\n    display: block;\r\n    position: absolute;\r\n    top: 9px;\r\n    left: 0;\r\n    right: 0;\r\n    height: 2px;/*border size */\r\n    z-index: -1;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopMiddle .nsFloatingLabelLabel \r\n{\r\n\ttop: -9px;\r\n  \tleft: 10px;\r\n    background-color: transparent;\r\n    padding: 3px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelTop.nsFloatingLabelTopBottom .nsFloatingLabelLabel \r\n{\r\n\ttop: 1px;\r\n    left: 10px;\r\n    padding: 6px 3px 3px;\r\n}\r\n\r\n/**top css ends **/\r\n/**Bottom css starts **/\r\n.nsFloatingLabel.nsFloatingLabelBottom .nsFloatingLabelControl \r\n{\r\n\twidth: calc(100% - 16px);/*6 * 2(padding) + 2 * 2(margin)*/\r\n  \tpadding: 12px 6px 12px 6px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelBottom .nsFloatingLabelLabel \r\n{\r\n  \ttop: 0;\r\n  \tbottom: 0;\r\n  \tleft: 0;\r\n  \twidth: calc(100% - 4px);\r\n}\r\n.nsFloatingLabel.nsFloatingLabelBottom.nsFloatingLabelActive .nsFloatingLabelControl\r\n{\r\n  \tpadding: 4px 6px 20px 6px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelBottom.nsFloatingLabelActive .nsFloatingLabelLabel\r\n{\r\n  \ttop: 100%;\r\n  \tmargin: -16px 2px 0px 2px;\r\n}\r\n/**Bottom css ends **/\r\n/**Right css starts **/\r\n.nsFloatingLabel.nsFloatingLabelRight .nsFloatingLabelControl\r\n{\r\n\twidth: calc(100% - 28px);/*12 * 2(padding) + 2 * 4(margin)*/\r\n}\r\n\r\n.nsFloatingLabel.nsFloatingLabelRight .nsFloatingLabelLabel \r\n{\r\n  \ttop: 2px;\r\n  \tright: 100%;\r\n  \twidth: 100%;\r\n  \tmargin-right: -100%;\r\n  \tbottom: 2px;\r\n}\r\n.nsFloatingLabel.nsFloatingLabelRight.nsFloatingLabelActive .nsFloatingLabelLabel\r\n{\r\n  \tright: 0;\r\n  \tmargin-right: 0;\r\n  \twidth: 25%;\r\n  \tpadding-top: 5px;\r\n  \tmargin-right: 2px;\r\n}\r\n/**Right css ends **/\r\n\r\n.nsFloatingLabelWhite .nsFloatingLabelControl \r\n{\r\n\tborder: 2px solid #dfdfdf;\r\n}\r\n.nsFloatingLabelWhite.nsFloatingLabelBottom.nsFloatingLabelActive .nsFloatingLabelLabel,\r\n.nsFloatingLabelWhite.nsFloatingLabelRight.nsFloatingLabelActive .nsFloatingLabelLabel\r\n{\r\n\tbackground: #1976D2;\r\n\tcolor: white;\r\n}\r\n.nsFloatingLabelWhite .nsFloatingLabelLabel\r\n{\r\n\tcolor: #999;\r\n}\r\n.nsFloatingLabelWhite.nsFloatingLabelFocus .nsFloatingLabelControl\r\n{\r\n\tborder-color: #1976D2;\r\n}\r\n.nsFloatingLabelWhite.nsFloatingLabelTop.nsFloatingLabelTopMiddle .nsFloatingLabelLabel:before\r\n{\r\n\tbackground-color: #fff;\r\n}\r\n.nsFloatingLabelWhite.nsFloatingLabelFocus.nsFloatingLabelTop .nsFloatingLabelLabel\r\n{\r\n\tcolor: #1976D2;\r\n}\r\n\r\n.nsFloatingLabelBlack .nsFloatingLabelControl\r\n{\r\n\tborder: 2px solid #dfdfdf;\r\n\tcolor: white;\r\n}\r\n.nsFloatingLabelBlack.nsFloatingLabelBottom.nsFloatingLabelActive .nsFloatingLabelLabel,\r\n.nsFloatingLabelBlack.nsFloatingLabelRight.nsFloatingLabelActive .nsFloatingLabelLabel\r\n{\r\n\tbackground: #1976D2;\r\n\tcolor: white;\r\n}\r\n.nsFloatingLabelBlack .nsFloatingLabelLabel\r\n{\r\n\tcolor: #FFFFFF;\r\n}\r\n.nsFloatingLabelBlack.nsFloatingLabelFocus .nsFloatingLabelControl\r\n{\r\n\tborder-color: #1976D2;\r\n}\r\n.nsFloatingLabelBlack.nsFloatingLabelTop.nsFloatingLabelTopMiddle .nsFloatingLabelLabel:before\r\n{\r\n\tbackground-color: #000000;\r\n}\r\n.nsFloatingLabelBlack.nsFloatingLabelFocus.nsFloatingLabelTop .nsFloatingLabelLabel\r\n{\r\n\tcolor: darkturquoise\r\n}\r\n\r\n.nsFloatingLabelBlack .nsFloatingLabelControl::placeholder\r\n{\r\n  \tcolor: white;\r\n  \topacity: 1; /* Firefox */\r\n}\r\n/* Internet Explorer 10-11 */\r\n.nsFloatingLabelBlack .nsFloatingLabelControl:-ms-input-placeholder\r\n{ \r\n \tcolor: white;\r\n}\r\n/* Microsoft Edge */\r\n.nsFloatingLabelBlack .nsFloatingLabelControl::-ms-input-placeholder\r\n{ \r\n \tcolor: white;\r\n}@font-face {\r\n   font-family: 'NSComponentFont';\r\n   src: url(\"data:application/font-woff;base64,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\") format('woff');\r\n    font-weight: normal;\r\n  \tfont-style: normal;\r\n  font-display: block;\r\n}\r\n.ns-icon {\r\n    display: inline-block;\r\n    font-size: inherit;\r\n    font-family: NSComponentFont;\r\n    line-height: 1;\r\n    font-weight: normal;\r\n    font-style: normal;\r\n    font-variant: normal;\r\n    \r\n    text-rendering: auto;\r\n    -webkit-font-smoothing: antialiased;\r\n    -moz-osx-font-smoothing: grayscale;\r\n}\r\n.ns-navigation-arrow-down:before {\r\n  content: \"\\e92f\";\r\n}\r\n.ns-navigation-arrow-left:before {\r\n  content: \"\\e930\";\r\n}\r\n.ns-navigation-arrow-right:before {\r\n  content: \"\\e931\";\r\n}\r\n.ns-navigation-arrow-up:before {\r\n  content: \"\\e932\";\r\n}\r\n\r\n\r\n.nsNavMainContainerAbsolute\r\n{\r\n\tposition: absolute;\r\n    top: 0;\r\n    left: 0;\r\n}\r\n.nsNavMainContainer \r\n{\r\n\t/* causes issue of scrollbar in applications */\r\n    /*min-height: 100%;*/\r\n    position: absolute;\r\n\ttop: 0;\r\n\tright: 0;\r\n\tleft:0;\r\n\tbottom:0;\r\n\tdisplay: flex;\r\n   \tflex-direction: column;\r\n   \tflex: 0 0 auto;\r\n    width: 230px;\r\n    z-index: 810;\r\n    text-shadow: rgb(255, 255, 255) 0px 0px 5px;\r\n    -webkit-transition: -webkit-transform .3s ease-in-out,width .3s ease-in-out;\r\n    -moz-transition: -moz-transform .3s ease-in-out,width .3s ease-in-out;\r\n    -o-transition: -o-transform .3s ease-in-out,width .3s ease-in-out;\r\n    transition: transform .3s ease-in-out,width .3s ease-in-out;\r\n}\r\n@media (max-width: 767px) \r\n{\r\n    .nsNavMainContainer \r\n    {\r\n        -webkit-transform:translate(-0px, 0);\r\n        -ms-transform: translate(-0px, 0);\r\n        -o-transform: translate(-0px, 0);\r\n        transform: translate(-0px, 0);\r\n    }\r\n    .nsNavCollapsed .nsNavMainContainer \r\n    {\r\n        -webkit-transform:translate(-230px, 0);\r\n        -ms-transform: translate(-230px, 0);\r\n        -o-transform: translate(-230px, 0);\r\n        transform: translate(-230px, 0);\r\n    }\r\n}\r\n.nsNavContainerParent\r\n{\r\n\theight: 100%;\r\n\tflex: 1 1 auto;\r\n\tposition: relative;\r\n\toverflow-x:hidden;\r\n\toverflow-y:auto;\t\r\n}\r\n.nsNavContainer,.nsNavHeader\r\n{\r\n    list-style: none;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n.nsNavContainer>li,.nsNavHeader>li\r\n{\r\n    position: relative;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n.nsNavContainer>li>a,.nsNavHeader>li>a \r\n{\r\n    padding: 12px 5px 12px 15px;\r\n    display: block;\r\n}\r\n.nsNavContainer>li>a>span>.ns-icon,.nsNavContainer>li>a>span>.glyphicon,.nsNavContainer>li>a>span>.ion,\r\n.nsNavHeader>li>a>span>.ns-icon,.nsNavHeader>li>a>span>.glyphicon,.nsNavHeader>li>a>span>.ion \r\n{\r\n    width: 20px;\r\n}\r\n.nsNavHeader li.nsNavTitle \r\n{\r\n    padding: 10px 25px 10px 15px;\r\n    font-size: 12px;\r\n}\r\n.nsNavHeader .nsNavSearchContainer\r\n{\r\n\tpadding: 0px 10px;\r\n\tpadding-bottom: 3px;\r\n}\r\n\r\n.nsNavCollapsed .nsNavSearchContainer\r\n{\r\n\tdisplay: none;\t\r\n}\r\n\r\n/*.nsNavContainer .nsPlaceHolder input, .nsNavContainer .nsPlaceHolder textarea\r\n{\r\n\twidth: calc(100% - 30px);\r\n}\r\n\r\n.nsNavContainer .nsPlaceHolder.nsPlaceHolderBottom label\r\n{\r\n\tleft: 15px;\r\n\twidth: calc(100% - 30px);\r\n}\r\n\r\n.nsNavContainer .nsPlaceHolder.nsPlaceHolderRight label \r\n{\r\n\tright: calc(100% - 30px);\r\n}*/\r\n\r\n.nsNavContainer li>a>.fa-angle-left,.nsNavContainer li>a>.nsNavContainerPullRight>.fa-angle-left \r\n{\r\n    width: auto;\r\n    height: auto;\r\n    padding: 0;\r\n    margin-right: 10px;\r\n    -webkit-transition: transform .5s ease;\r\n    -o-transition: transform .5s ease;\r\n    transition: transform .5s ease;\r\n}\r\n.nsNavContainer li>a>.fa-angle-left \r\n{\r\n    position: absolute;\r\n    top: 50%;\r\n    right: 10px;\r\n    margin-top: -8px;\r\n}\r\n/*.nsNavContainer .nsNavItemOpen>a>.fa-angle-left,.nsNavContainer .nsNavItemOpen>a>.nsNavContainerPullRight>.fa-angle-left \r\n{\r\n    -webkit-transform: rotate(-90deg);\r\n    -ms-transform: rotate(-90deg);\r\n    -o-transform: rotate(-90deg);\r\n    transform: rotate(-90deg);\r\n}*/\r\n.nsNavContainer .nsNavItemActive>.nsNavSubNavContainer \r\n{\r\n    display: block;\r\n}\r\n@media (min-width: 768px) \r\n{\r\n    .nsNavCollapsed .nsNavMainContainer {\r\n        -webkit-transform: translate(0, 0);\r\n        -ms-transform: translate(0, 0);\r\n        -o-transform: translate(0, 0);\r\n        transform: translate(0, 0);\r\n        width: 50px !important;\r\n        z-index: 850;\r\n    }\r\n    .nsNavCollapsed .nsNavContainer>li {\r\n        position: relative;\r\n    }\r\n    .nsNavCollapsed .nsNavContainer>li>a {\r\n        margin-right: 0;\r\n    }\r\n    .nsNavCollapsed .nsNavContainer>li>a>span {\r\n        border-top-right-radius: 4px;\r\n    }\r\n    .nsNavCollapsed .nsNavContainer>li:not(.nsNavItemParent)>a>span {\r\n        border-bottom-right-radius: 4px;\r\n    }\r\n    .nsNavCollapsed .nsNavContainer>li>.nsNavSubNavContainer {\r\n        padding-top: 5px;\r\n        padding-bottom: 5px;\r\n        border-bottom-right-radius: 4px;\r\n    }\r\n}\r\n.nsNavCollapsed .nsNavParentHover>a>span,\r\n.nsNavCollapsed .nsNavParentHover .nsNavSubNavContainer \r\n{\r\n    display: block !important;\r\n    position: absolute;\r\n    width: 180px;\r\n    left: 50px\r\n}\r\n.nsNavCollapsed .nsNavParentHover span \r\n{\r\n    top: 0;\r\n    margin-left: -3px;\r\n    padding: 12px 5px 12px 20px;\r\n    background-color: inherit;\r\n}\r\n.nsNavCollapsed .nsNavParentHover .nsNavContainerPullRight \r\n{\r\n    position: relative !important;\r\n    float: right;\r\n    width: auto !important;\r\n    left: 180px !important;\r\n    top: -22px !important;\r\n    z-index: 900;\r\n}\r\n.nsNavCollapsed .nsNavParentHover .nsNavSubNavContainer\r\n{\r\n\ttop: 44px;\r\n    margin-left: 0;\r\n}\r\n.nsNavContainer,.nsNavMainContainer .user-panel,.nsNavHeader>li.nsNavTitle \r\n{\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n}\r\n.nsNavContainer:hover \r\n{\r\n    overflow: visible;\r\n}\r\n.nsNavContainer li>a \r\n{\r\n    position: relative;\r\n}\r\n.nsNavContainer li>a>.nsNavContainerPullRight \r\n{\r\n    position: absolute;\r\n    right: 10px;\r\n    top: 50%;\r\n    margin-top: -7px;\r\n}\r\n.nsNavContainer .nsNavSubNavContainer \r\n{\r\n    display: none;\r\n    list-style: none;\r\n    padding: 0;\r\n    margin: 0;\r\n    padding-left: 5px;\r\n    position: relative;\r\n}\r\n.nsNavContainer .nsNavSubNavContainerVisible\r\n{\r\n\t display: block;\r\n}\r\n.nsNavSubNavContainer .nsNavSubNavContainer \r\n{\r\n    padding-left: 20px;\r\n}\r\n.nsNavContainer.nsNavContainerIconLeft .nsNavSubNavContainer \r\n{\r\n\t/*32px if we have line on left side*/\r\n\tpadding-left: 20px;\r\n}\r\n/*for left line on left side*/\r\n/*.nsNavContainer.nsNavContainerIconLeft .nsNavSubNavContainer:before {\r\n    content: '';\r\n    height: 100%;\r\n    opacity: 1;\r\n    width: 3px;\r\n    background: black;\r\n    position: absolute;\r\n    left: 20px;\r\n    top: 0;\r\n    width: 1px;\r\n}*/\r\n.nsNavSubNavContainer>li \r\n{\r\n    margin: 0;\r\n}\r\n.nsNavSubNavContainer>li>a \r\n{\r\n    padding: 5px 5px 5px 15px;\r\n    display: block;\r\n    font-size: 14px;\r\n}\r\n.nsNavSubNavContainer>li>a>span>.ns-icon,.nsNavSubNavContainer>li>a>span>.glyphicon,.nsNavSubNavContainer>li>a>span>.ion \r\n{\r\n    width: 20px;\r\n}\r\n.nsNavSubNavContainer>li>a>.nsNavContainerPullRight>.fa-angle-left,.nsNavSubNavContainer>li>a>.nsNavContainerPullRight>.fa-angle-down,.nsNavSubNavContainer>li>a>.fa-angle-left,.nsNavSubNavContainer>li>a>.fa-angle-down \r\n{\r\n    width: auto;\r\n}\r\n.nsNavCollapsed .nsNavNonVisibleIcon \r\n{\r\n    display: none !important;\r\n    -webkit-transform: translateZ(0);\r\n}\r\n.nsNavDynamicContainer\r\n{\r\n\tposition: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    overflow: hidden; \r\n    text-align: center;\r\n    width:250px;\r\n    z-index: 900;\r\n}\r\n.nsNavDynamicContainer>.nsNavDynamicMenuText\r\n{\r\n    padding: 5px 5px 5px 15px;\r\n    display: block;\r\n    font-size: 14px;\r\n    text-decoration: none;\r\n    text-align: left;\r\n    padding-left: 80px;\r\n}\r\n.nsNavDynamicContainer>.nsNavDynamicSubMenuCont\r\n{\r\n\tlist-style: none;\r\n    padding: 0;\r\n    margin: 0;\r\n    padding-left: 5px;\r\n    text-align: left;\r\n}\r\n.nsNavDynamicSubMenuCont a \r\n{\r\n    padding: 5px 5px 5px 15px;\r\n    display: block;\r\n    font-size: 14px;\r\n}\r\n.nsNavDynamicSubMenuCont a \r\n{\r\n    position: relative;\r\n}\r\n.nsNavSelectedMenu > a \r\n{\r\n    font-weight: bold;\r\n}\r\n.nsNavigationItemDisabled\r\n{\r\n\tpointer-events:none; \r\n    opacity:0.4;\r\n}\r\n.nsNavigationItemDisabled > a\r\n{\r\n\tcolor: #777;\r\n}\r\n.nsNavHeaderFooter\r\n{\r\n\tmin-height: 30px;\r\n\tpadding: 5px 10px;\r\n}\r\n\r\n/*************************Themes ******************************************/\r\n.nsNavMainContainerWhite\r\n{\r\n\tbackground-color: #ffffff;\r\n}\r\n.nsNavMainContainerWhite .nsNavMainContainer\r\n{\r\n    color: #333;\r\n}\r\n.nsNavMainContainerWhite .nsNavContainer>li:hover>a, .nsNavMainContainerWhite .nsNavContainer>li.nsNavItemActive>a, .nsNavMainContainerWhite .nsNavContainer>li.nsNavItemOpen>a \r\n{\r\n    color: black;\r\n    background: #ffffff;\r\n}\r\n\r\n.nsNavMainContainerWhite .nsNavHeader>li.nsNavTitle \r\n{\r\n    color: black;\r\n    background: #ffffff;\r\n}\r\n.nsNavMainContainerWhite .nsNavigationItem\r\n{\r\n\tborder-bottom: 1px solid rgb(0 0 0 / 10%);\r\n}\r\n.nsNavMainContainerWhite .nsNavItemParent.nsNavParentSelectedMenu\r\n{\r\n\tborder-right: 5px solid #2bb0d7;\r\n}\r\n.nsNavMainContainerWhite .nsNavigationItem > a \r\n{\r\n    color: #2b444f;\r\n    background: #ffffff;\r\n    text-decoration: none;\r\n}\r\n.nsNavMainContainerWhite .nsNavSelectedMenu > a \r\n{\r\n    color: #CA2420;\r\n    background: #E5E5E5;\r\n    border-left-color: #E5E5E5;\r\n}\r\n.nsNavMainContainerWhite .nsNavDynamicContainer\r\n{\r\n\tbackground: #ffffff;\r\n\tcolor: #2b444f;\r\n}\r\n.nsNavMainContainerWhite .nsNavDynamicSubMenuCont a \r\n{\r\n    color: #2b444f;\r\n    text-decoration: none;\r\n}\r\n.nsNavMainContainerWhite .nsNavDynamicMenuItem.nsNavSelectedMenu>a \r\n{\r\n    color: #CA2420;\r\n}\r\n.nsNavMainContainerWhite .nsNavDynamicContainer>.nsNavDynamicMenuText\r\n{\r\n\tcolor: #4b646f;\r\n\tborder-top: 1px solid #D5D5D5;\r\n    border-right: 1px solid #D5D5D5;\r\n    border-bottom: 1px solid #D5D5D5;\r\n}\r\n.nsNavMainContainerWhite .nsNavDynamicContainer>.nsNavDynamicSubMenuCont\r\n{\r\n\tborder-top: 1px solid #D5D5D5;\r\n    border-right: 1px solid #D5D5D5;\r\n    border-bottom: 1px solid #D5D5D5;\r\n}\r\n.nsNavMainContainerWhite .nsNavHeaderFooter\r\n{\r\n\tbackground-color: #ffffff;\r\n\tborder-top: 1px solid #D5D5D5;\r\n}\r\n\r\n.nsNavMainContainerBlack\r\n{\r\n\tbackground-color: #222d32;\r\n}\r\n.nsNavMainContainerBlack .nsNavMainContainer \r\n{\r\n    color: #333;\r\n}\r\n.nsNavMainContainerBlack .nsNavContainer>li:hover>a, .nsNavMainContainerBlack .nsNavContainer>li.nsNavItemActive>a, .nsNavMainContainerBlack .nsNavContainer>li.nsNavItemOpen>a \r\n{\r\n    color: #fff;\r\n    background: #1e282c;\r\n}\r\n.nsNavMainContainerBlack .nsNavHeader>li.nsNavTitle \r\n{\r\n    color: #fff;\r\n    background: #1a2226;\r\n}\r\n.nsNavMainContainerBlack .nsNavigationItem\r\n{\r\n\tborder-bottom: 1px solid rgb(255 255 255 / 20%);\r\n}\r\n.nsNavMainContainerBlack .nsNavItemParent.nsNavParentSelectedMenu\r\n{\r\n\tborder-right: 5px solid #1ABB9C;\r\n}\r\n.nsNavMainContainerBlack .nsNavigationItem > a \r\n{\r\n    color: #fff;\r\n    background: #1e282c;\r\n    text-decoration: none;\r\n}\r\n.nsNavMainContainerBlack .nsNavSelectedMenu > a \r\n{\r\n    color: #CA2420;\r\n    background: #E5E5E5;\r\n    border-left-color: #E5E5E5;\r\n}\r\n.nsNavMainContainerBlack .nsNavDynamicContainer\r\n{\r\n\tbackground-color:black;\r\n\tcolor:white;\r\n}\r\n.nsNavMainContainerBlack .nsNavDynamicSubMenuCont a \r\n{\r\n    color: #fff;\r\n    background: #1e282c;\r\n    text-decoration: none;\r\n}\r\n.nsNavMainContainerBlack .nsNavDynamicMenuItem.nsNavSelectedMenu>a \r\n{\r\n    color: #CA2420;\r\n}\r\n.nsNavMainContainerBlack .nsNavDynamicContainer>.nsNavDynamicMenuText\r\n{\r\n\tcolor: #fff;\r\n    background: #1e282c;\r\n    border-top: 1px solid #D5D5D5;\r\n    border-right: 1px solid #D5D5D5;\r\n    border-bottom: 1px solid #D5D5D5;\r\n}\r\n.nsNavMainContainerBlack .nsNavDynamicContainer>.nsNavDynamicSubMenuCont\r\n{\r\n\tborder-top: 1px solid #D5D5D5;\r\n    border-right: 1px solid #D5D5D5;\r\n    border-bottom: 1px solid #D5D5D5;\r\n}\r\n.nsNavMainContainerBlack .nsNavHeaderFooter\r\n{\r\n\tbackground-color: #293e40;\r\n\tborder-top: 1px solid #000000;\r\n}";
styleInject(css_248z$5);

const nsCompUtil$7 = require('./generated/js/nsUtil.min.js');
const NSUtil$7 = nsCompUtil$7.NSUtil;
const nsCompNavigation$1 = require('./generated/js/nsNavigation.min.js');
const NSNavigation$1 = nsCompNavigation$1.NSNavigation;
const NSNavigationReactComponent = (props, ref) => {
    var _a;
    let navigate = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        navigate = useNavigate();
    }
    catch (error) {
    }
    const nsNavigationRef = useRef(null);
    const containerRef = useRef(null);
    const nsUtilRef = useRef(new NSUtil$7());
    const dataSourceRef = useRef(props.dataSource || ((_a = props.setting) === null || _a === void 0 ? void 0 : _a.dataSource) || []);
    const settingRef = useRef(nsUtilRef.current.cloneObject(props.setting, true));
    useState(false);
    const [hasDataSource, setHasDataSource] = useState(false);
    const arrEvents = [
        NSNavigation$1.NAVIGATION_OPEN_START,
        NSNavigation$1.NAVIGATION_OPEN_END,
        NSNavigation$1.NAVIGATION_CLOSE_START,
        NSNavigation$1.NAVIGATION_CLOSE_END,
        NSNavigation$1.NAVIGATION_MENU_SELECTED,
        NSNavigation$1.NAVIGATION_MENU_DESELECTED
    ];
    useEffect(() => {
        if (!navigate) {
            console.warn('NSComponentReact:: Navigation cannot be handled by NSComponentReact as the NSComponentReact is not a child of a Router. Either handle navigation programatically or place NSNavigationReact as a child of Router.');
        }
        if (!nsNavigationRef.current) {
            settingRef.current.dataSource = dataSourceRef.current;
            nsNavigationRef.current = new NSNavigation$1(containerRef.current, settingRef.current);
            addEvents();
            addMethods();
        }
        return () => {
        };
    }, []);
    useImperativeHandle(ref, () => ({
        isNavOpen: () => (nsNavigationRef.current ? nsNavigationRef.current.isNavOpen() : false),
        toggleNavigation: () => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.toggleNavigation(); },
        openNavigation: () => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.openNavigation(); },
        closeNavigation: () => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.closeNavigation(); },
        getItemByField: (field, value, source) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.getItemByField(field, value, source); },
        selectMenu: (itemOrElement) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.selectMenu(itemOrElement); },
        setDataSource: (source) => {
            var _a;
            dataSourceRef.current = source;
            setHasDataSource(source.length > 0);
            (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.dataSource(source);
            manageDataSource();
        },
        setStyle: (styleProp, value) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setStyle(styleProp, value); },
        setFocus: (isFocus) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setFocus(isFocus); },
        hasFocus: () => (nsNavigationRef.current ? nsNavigationRef.current.hasFocus() : false),
        setTheme: (theme) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setTheme(theme); },
        getElement: () => containerRef.current
    }));
    const addMethods = () => {
        ReactUtil.getMethods(nsNavigationRef.current, null, addMethod);
    };
    const addMethod = (funcName) => {
        const callback = function () {
            return ReactUtil.callMethod(nsNavigationRef.current, funcName, arguments);
        };
        ReactUtil.addMethod(nsNavigationRef.current, funcName, callback);
    };
    const manageDataSource = () => {
        if (dataSourceRef.current && dataSourceRef.current.length > 0) {
            for (const source of dataSourceRef.current) {
                manageDataSourceItem(source);
            }
        }
    };
    const manageDataSourceItem = (item) => {
        if (item) {
            if (item.childMenus && item.childMenus.length > 0) {
                for (const childMenu of item.childMenus) {
                    manageDataSourceItem(childMenu);
                }
            }
            else {
                item.click = menuClickHandler;
            }
        }
    };
    const menuClickHandler = (event, item, li) => {
        if (item) {
            let navigateAction = true;
            if (item.onClick) {
                navigateAction = item.onClick(event, item, li);
            }
            if (navigate && navigateAction && (item.href || item.link)) {
                let newRoute = item.href || item.link;
                newRoute = (newRoute && newRoute.startsWith('/')) ? newRoute : ('/' + newRoute);
                if (newRoute !== window.location.pathname) {
                    navigate(newRoute);
                }
                else {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }
            else {
                console.log('Navigation is not available');
            }
        }
    };
    const addEvents = () => {
        for (const eventName of arrEvents) {
            nsUtilRef.current.addEvent(containerRef.current, eventName, (event) => {
                eventListener(event, eventName);
            });
        }
    };
    const eventListener = (event, eventName) => {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (props[eventListenerName]) {
            props[eventListenerName](event);
        }
    };
    const getStyleForContainer = () => {
        const style = {};
        const containerStyle = props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    };
    return (React__default.createElement("div", { style: getStyleForContainer(), ref: containerRef }));
};
const NSNavigationReact = forwardRef(NSNavigationReactComponent);

var css_248z$4 = ".nsHorNav {\r\n    display: flex;\r\n}\r\n\r\n.nsHorNav * {\r\n\tlist-style: none;\r\n}\r\n\r\n.nsHorNav.nsHorNavContentCon, .nsHorNav .nsHorNavContentCon, .nsHorNav .nsHorNavItemCon {\r\n    background-color: inherit !important;\r\n}\r\n\r\n.nsHorNav .nsHorNavNonSubNavItemCon {\r\n    position: relative;\r\n    z-index: 1;\r\n}\r\n\r\n.nsHorNav .nsHorNavItem {\r\n\ttext-decoration: none;\r\n\tcolor: inherit;\r\n}\r\n\r\n.nsHorNav .nsHorNavNonSubNavItemCon, .nsHorNav .nsHorNavSubNavCon .nsHorNavSubNavItem {\r\n    font-family: inherit;\r\n    font-size: inherit;\r\n    color: inherit;\r\n    text-align: center;\r\n    padding: 14px 16px;\r\n    text-decoration: none;\r\n    background: transparent;\r\n    border: none;\r\n    transition: background-color 150ms ease-in-out;\r\n    width: max-content;\r\n}\r\n\r\n.nsHorNav .nsHorNavItemDisabled {\r\n\topacity: .5;\r\n  \tpointer-events: none;\r\n}\r\n\r\n.nsHorNav .nsHorNavNonSubNavItemCon .nsHorNavItemIconCon, .nsHorNav .nsHorNavSubNavCon .nsHorNavSubNavItem .nsHorNavItemIconCon {\r\n\tmargin-right: 10px;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon {\r\n  position: relative;\r\n  display: table;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon:not(.nsHorNavSubNavCon-0) .nsHorNavSubNavContent {\r\n  top: 20%;\r\n  left: 100%;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon .nsHorNavSubNavItem {\r\n\tdisplay: flex;\r\n\talign-items: center;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavContent {\r\n  display: none;\r\n  position: absolute;\r\n  left: 0;\r\n  width: 100%;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavContent .nsHorNavNonSubNavItemCon {\r\n  float: left;\r\n  color: inherit;\r\n  text-decoration: none;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon .nsHorNavSubNavContentActive {\r\n  position: absolute;\r\n  display: block;\r\n  width: initial;\r\n  z-index: 10;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon:not(.nsHorNavSubNavCon-0)::after {\r\n\tcontent: '';\r\n    width: 0;\r\n    height: 0;\r\n    border-top: 4px solid transparent;\r\n    border-bottom: 4px solid transparent;\r\n    border-left: 4px solid #000;\r\n    position: absolute;\r\n    top: 0;\r\n    bottom: 0;\r\n    right: 7px;\r\n    margin: auto;\r\n}\r\n\r\n.nsHorNav .nsHorNavSubNavCon.nsHorNavSubNavCon-0::after {\r\n\tcontent: '';\r\n    width: 0;\r\n    height: 0;\r\n    border-left: 5px solid transparent;\r\n    border-right: 5px solid transparent;\r\n    border-top: 5px solid #000;\r\n    position: absolute;\r\n    top: 0;\r\n    bottom: 0;\r\n    right: 1px;\r\n    margin: auto;\r\n}\r\n\r\n/***************Gray Theme ****************/\r\n.nsHorNavGray .nsHorNavNonSubNavItemCon .nsHorNavText:hover {\r\n\tcolor: #03a9f5;\r\n}\r\n\r\n.nsHorNavGray .nsHorNavNonSubNavItemCon:hover, .nsHorNavGray .nsHorNavSubNavItem:hover {\r\n    background-color: #b0c4de !important;\r\n    color: #000;\r\n}\r\n\r\n.nsHorNavGray .nsHorNavSubNavCon:not(.nsHorNavSubNavCon-0)::after {\r\n\tborder-left-color: #000 !important;\r\n}\r\n\r\n.nsHorNavGray .nsHorNavSubNavCon.nsHorNavSubNavCon-0::after {\r\n\tborder-top-color: #000 !important;\r\n}\r\n/****************Gray Theme Ends***************/\r\n\r\n/****************Blue Theme ****************/\r\n.nsHorNavBlue .nsHorNavNonSubNavItemCon .nsHorNavText:hover {\r\n\tcolor: #03a9f5;\r\n}\r\n\r\n.nsHorNavBlue .nsHorNavNonSubNavItemCon:hover, .nsHorNavBlue .nsHorNavSubNavItem:hover {\r\n    background-color: #b0c4de !important; \r\n    color: #000;\r\n}\r\n\r\n.nsHorNavBlue .nsHorNavSubNavCon:not(.nsHorNavSubNavCon-0)::after {\r\n\tborder-left-color: #000 !important;\r\n}\r\n\r\n.nsHorNavBlue .nsHorNavSubNavCon.nsHorNavSubNavCon-0::after {\r\n\tborder-top-color: #000 !important;\r\n}\r\n\r\n/****************Blue Theme Ends***************/\r\n\r\n/****************Black Theme ****************/\r\n.nsHorNavBlack .nsHorNavNonSubNavItemCon .nsHorNavText:hover {\r\n\tcolor: #03a9f5;\r\n}\r\n\r\n.nsHorNavBlack .nsHorNavNonSubNavItemCon:hover, .nsHorNavBlack .nsHorNavSubNavItem:hover {\r\n    background-color: #444 !important;\r\n    color: #fff;\r\n}\r\n\r\n.nsHorNavBlack .nsHorNavSubNavCon:not(.nsHorNavSubNavCon-0)::after {\r\n\tborder-left-color: #fff !important;\r\n}\r\n\r\n.nsHorNavBlack .nsHorNavSubNavCon.nsHorNavSubNavCon-0::after {\r\n\tborder-top-color: #fff !important;\r\n}\r\n\r\n/****************Black Theme Ends***************/\r\n\r\n";
styleInject(css_248z$4);

const nsCompUtil$6 = require('./generated/js/nsUtil.min.js');
const NSUtil$6 = nsCompUtil$6.NSUtil;
const nsCompHorizontalNavigation$1 = require('./generated/js/nsHorizontalNavigation.min.js');
const NSHorizontalNavigation$1 = nsCompHorizontalNavigation$1.NSHorizontalNavigation;
const NSHorizontalNavigationReactComponent = (props, ref) => {
    var _a;
    let navigate = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        navigate = useNavigate();
    }
    catch (error) {
    }
    const nsNavigationRef = useRef(null);
    const containerRef = useRef(null);
    const nsUtilRef = useRef(new NSUtil$6());
    const dataSourceRef = useRef(props.dataSource || ((_a = props.setting) === null || _a === void 0 ? void 0 : _a.dataSource) || []);
    const settingRef = useRef(nsUtilRef.current.cloneObject(props.setting, true));
    useState(false);
    const [hasDataSource, setHasDataSource] = useState(false);
    const arrEvents = [
        NSHorizontalNavigation$1.NAVIGATION_MENU_SELECTED
    ];
    useEffect(() => {
        if (!navigate) {
            console.warn('NSHorizontalNavigationReact:: Navigation cannot be handled by NSHorizontalNavigationReact as the NSHorizontalNavigationReact is not a child of a Router. Either handle navigation programatically or place NSHorizontalNavigationReact as a child of Router.');
        }
        if (!nsNavigationRef.current) {
            settingRef.current.dataSource = dataSourceRef.current;
            nsNavigationRef.current = new NSHorizontalNavigation$1(containerRef.current, settingRef.current);
            addEvents();
            addMethods();
        }
        return () => {
        };
    }, []);
    useImperativeHandle(ref, () => ({
        selectMenu: (itemOrElement) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.selectMenu(itemOrElement); },
        setDataSource: (source) => {
            var _a;
            dataSourceRef.current = source;
            setHasDataSource(source.length > 0);
            (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.dataSource(source);
            manageDataSource();
        },
        setStyle: (styleProp, value) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setStyle(styleProp, value); },
        setFocus: (isFocus) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setFocus(isFocus); },
        hasFocus: () => (nsNavigationRef.current ? nsNavigationRef.current.hasFocus() : false),
        setTheme: (theme) => { var _a; return (_a = nsNavigationRef.current) === null || _a === void 0 ? void 0 : _a.setTheme(theme); },
        getElement: () => containerRef.current
    }));
    const addMethods = () => {
        ReactUtil.getMethods(nsNavigationRef.current, null, addMethod);
    };
    const addMethod = (funcName) => {
        const callback = function () {
            return ReactUtil.callMethod(nsNavigationRef.current, funcName, arguments);
        };
        ReactUtil.addMethod(nsNavigationRef.current, funcName, callback);
    };
    const manageDataSource = () => {
        if (dataSourceRef.current && dataSourceRef.current.length > 0) {
            for (const source of dataSourceRef.current) {
                manageDataSourceItem(source);
            }
        }
    };
    const manageDataSourceItem = (item) => {
        if (item) {
            if (item.childMenus && item.childMenus.length > 0) {
                for (const childMenu of item.childMenus) {
                    manageDataSourceItem(childMenu);
                }
            }
            else {
                item.click = menuClickHandler;
            }
        }
    };
    const menuClickHandler = (event, item) => {
        if (item) {
            let navigateAction = true;
            if (item.onClick) {
                navigateAction = item.onClick(event, item);
            }
            if (navigate && navigateAction && (item.href || item.link)) {
                let newRoute = item.href || item.link;
                newRoute = (newRoute && newRoute.startsWith('/')) ? newRoute : ('/' + newRoute);
                if (newRoute !== window.location.pathname) {
                    navigate(newRoute);
                }
                else {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }
            else {
                console.log('Navigation is not available');
            }
        }
    };
    const addEvents = () => {
        for (const eventName of arrEvents) {
            nsUtilRef.current.addEvent(containerRef.current, eventName, (event) => {
                eventListener(event, eventName);
            });
        }
    };
    const eventListener = (event, eventName) => {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (props[eventListenerName]) {
            props[eventListenerName](event);
        }
    };
    const getStyleForContainer = () => {
        const style = {};
        const containerStyle = props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    };
    return (React__default.createElement("div", { style: getStyleForContainer(), ref: containerRef }));
};
const NSHorizontalNavigationReact = forwardRef(NSHorizontalNavigationReactComponent);

const nsCompUtil$5 = require('./generated/js/nsUtil.min.js');
const NSUtil$5 = nsCompUtil$5.NSUtil;
const nsCompMessageBox$1 = require('./generated/js/nsMessageBox.min.js');
const NSPanel$1 = nsCompMessageBox$1.NSPanel;
class NSPanelReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__objNSPanel) {
            this.__nsUtil = new NSUtil$5();
            this.__arrEvents = [NSPanel$1.DRAG_STARTING,
                NSPanel$1.DRAGGING,
                NSPanel$1.DRAG_END,
                NSPanel$1.RESIZE_STARTING,
                NSPanel$1.RESIZING,
                NSPanel$1.RESIZE_END,
                NSPanel$1.COLLAPSE_STARTING,
                NSPanel$1.COLLAPSE_END,
                NSPanel$1.EXPANSION_STARTING,
                NSPanel$1.EXPANSION_END,
                NSPanel$1.MINIMIZE_STARTING,
                NSPanel$1.MINIMIZE_END,
                NSPanel$1.MAXIMIZE_STARTING,
                NSPanel$1.MAXIMIZE_END,
                NSPanel$1.FULLSCREEN_STARTING,
                NSPanel$1.FULLSCREEN_END,
                NSPanel$1.RESTORE_STARTING,
                NSPanel$1.RESTORE_END,
                NSPanel$1.CLOSED];
            if (!this.props) {
                this.props = {};
            }
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__setting = setting;
            this.__objNSPanel = new NSPanel$1(this.__container, this.__setting);
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            if (this.__objNSPanel) {
                this.__objNSPanel.removeComponent();
                this.__objNSPanel = null;
            }
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    open() {
        /*if(!this.__objNSPanel)
        {
            this.__element = this.elementRef.nativeElement;
            this.__objNSPanel = new NSPanel(this.__element,this.setting);
            this.__creationHandler();
            this.__addEventHandlers();
        }*/
        if (this.__objNSPanel) {
            return this.__objNSPanel.open();
        }
    }
    ;
    close() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.close();
        }
    }
    ;
    removeModal() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.removeModal();
        }
    }
    ;
    getBaseElement() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.getBaseElement();
        }
        return null;
    }
    ;
    getElement() {
        return this.__container;
    }
    ;
    minimize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.minimize();
        }
    }
    ;
    maximize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.maximize();
        }
    }
    ;
    collapse() {
        if (this.__objNSPanel) {
            this.__objNSPanel.collapse();
        }
    }
    ;
    expand() {
        if (this.__objNSPanel) {
            this.__objNSPanel.expand();
        }
    }
    ;
    fullScreen() {
        if (this.__objNSPanel) {
            this.__objNSPanel.fullScreen();
        }
    }
    ;
    restore() {
        if (this.__objNSPanel) {
            this.__objNSPanel.restore();
        }
    }
    ;
    disableResize() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableResize();
        }
    }
    ;
    disableDrag() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableDrag();
        }
    }
    ;
    disableCollapse() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableCollapse();
        }
    }
    ;
    disableMinMax() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableCollapse();
        }
    }
    ;
    disableFullScreen() {
        if (this.__objNSPanel) {
            this.__objNSPanel.disableCollapse();
        }
    }
    ;
    isCollapsed() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isCollapsed();
        }
        return false;
    }
    ;
    isMinimized() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isMinimized();
        }
        return false;
    }
    ;
    isFullScreen() {
        if (this.__objNSPanel) {
            return this.__objNSPanel.isFullScreen();
        }
        return false;
    }
    ;
    __getStyleForContainer() {
        const style = {};
        /*const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }*/
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}

var css_248z$3 = ".nsCarousel\r\n{\r\n    position: relative;\r\n    overflow: hidden;\r\n    list-style: none;\r\n    padding: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    margin-left: auto;\r\n    margin-right: auto;\r\n}\r\n\r\n.nsCarousel .nsCarouselSlideContainer\r\n{\r\n\t/*becuase of this the button disappears */\r\n\t/*position: relative;*/\r\n    width: 100%;\r\n    height: 100%;\r\n    z-index: 1;\r\n    display: flex;\r\n    transition-property: transform;\r\n    box-sizing: content-box;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselSlideContainer\r\n{\r\n\tflex-direction: column;\r\n}\r\n\r\n.nsCarousel .nsCarouselSlide\r\n{\r\n\tdisplay: flex;\r\n\tflex-shrink: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    position: relative;\r\n    transition-property: transform;\r\n    align-items: center;\r\n}\r\n\r\n.nsCarousel .nsCarouselSlide > *\r\n{\r\n\twidth: 100%;\r\n    height: 100%;\r\n}\r\n\r\n.nsCarousel .nsCarouselButtonCon\r\n{\r\n\tposition: absolute;\r\n    text-shadow: 0 1px 2px rgba(0,0,0,.6);\r\n    background-color: rgba(0,0,0,0);\r\n    filter: alpha(opacity=50);\r\n    opacity: .5;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselButtonCon\r\n{\r\n\ttop: 0;\r\n\twidth: 15%;\r\n    max-width: 50px;\r\n    height:100%;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselButtonCon\r\n{\r\n\tleft:0;\r\n\twidth: 100%;\r\n\theight: 15%;\r\n    max-height: 50px;\r\n}\r\n\r\n.nsCarousel .nsCarouselButtonCon.nsCarouselPrevCon\r\n{\r\n\tbackground-image: linear-gradient(to right,rgba(0,0,0,.5) 0,rgba(0,0,0,.0001) 100%);\r\n\tbackground-repeat: repeat-x;\r\n}\r\n\r\n.nsCarousel .nsCarouselButtonCon.nsCarouselNextCon\r\n{\r\n\tbackground-image: linear-gradient(to right,rgba(0,0,0,.0001) 0,rgba(0,0,0,.5) 100%);\r\n\tbackground-repeat: repeat-x;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselPrevCon\r\n{\r\n\tleft: 0;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselNextCon\r\n{\r\n\tright: 0;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselPrevCon\r\n{\r\n\ttop:0;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselNextCon\r\n{\r\n\tbottom:0;\r\n}\r\n\r\n.nsCarousel .nsCarouselButton\r\n{\r\n\tposition: absolute;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselButtonPrev\r\n{\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselButtonNext\r\n{\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselButtonPrev\r\n{\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselButtonNext\r\n{\r\n}\r\n\r\n.nsCarousel .nsCarouselButton.nsCarouselButtonNav\r\n{\r\n    display: inline-block;\r\n    width: 15px;\r\n    height: 15px;\r\n    cursor: pointer;\r\n    z-index: 5;\r\n    border: solid black;\r\n  \tborder-width: 0 3px 3px 0;\r\n    padding: 3px;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselPrev\r\n{\r\n\ttop: 50%;\r\n    left: 50%;\r\n    margin-top: -10px;\r\n    margin-left: -10px;\r\n    transform: rotate(135deg);\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselNext\r\n{\r\n\ttop: 50%;\r\n    right: 50%;\r\n    margin-top: -10px;\r\n    margin-right: -10px;\r\n    transform: rotate(-45deg);\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselPrev\r\n{\r\n\ttop: 50%;\r\n    left: 50%;\r\n    margin-top: -5px;\r\n    margin-left: -10px;\r\n    transform: rotate(-135deg);\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselNext\r\n{\r\n\ttop: 50%;\r\n    right: 50%;\r\n    margin-top: -15px;\r\n    margin-right: -10px;\r\n    transform: rotate(45deg);\r\n}\r\n\r\n.nsCarousel .nsCarouselPageCon\r\n{\r\n\tposition: absolute;\r\n    text-align: center;\r\n    transition: 300ms opacity;\r\n    transform: translate3d(0, 0, 0);\r\n    z-index: 10;\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselPageCon\r\n{\r\n\twidth: 100%;\r\n    bottom: 10px;\r\n    left: 0;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselPageCon\r\n{\r\n\tright: 10px;\r\n    top: 50%;\r\n    transform: translate3d(0px,-50%,0);\r\n}\r\n\r\n.nsCarousel .nsCarouselPage\r\n{\r\n    height: 10px;\r\n    width: 10px;\r\n    border-radius: 50%;\r\n    background-color: #C0C0C0;\r\n    cursor: pointer;\r\n    transition: transform .2s,background-color .5s;\r\n    transform-origin: 50% 50%;\r\n}\r\n\r\n.nsCarousel .nsCarouselPage:hover\r\n{\r\n\ttransform: scale(1.5);\r\n}\r\n\r\n.nsCarousel.nsCarouselHorizontal .nsCarouselPageHorizontal\r\n{\r\n\tdisplay: inline-block;\r\n\tmargin-right: 4px;\r\n}\r\n\r\n.nsCarousel.nsCarouselVertical .nsCarouselPageVertical\r\n{\r\n\tdisplay: block;\r\n\tmargin-top: 4px;\r\n}\r\n\r\n.nsCarousel .nsCarouselPageActive\r\n{\r\n\tbackground-color: #007aff;\r\n}.nsTabNavigator\r\n{\r\n\tmargin: 0;\r\n    padding: 0;\r\n    overflow: hidden;\r\n    position: relative;\r\n}\r\n.nsTabNavigatorParentParent\r\n{\r\n    text-align: left;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    width: 100%;\r\n    padding: 0px;\r\n    display: flex;\r\n}\r\n.nsTabNavigator .nsTabContainer\r\n{\r\n    display: inline-block;\r\n    margin: -2px;\r\n    list-style: none;\r\n    position: relative;\r\n    cursor: pointer;\r\n}\r\n.nsTabNavigator .nsTabContainer.nsTabContainerHidden\r\n{\r\n\tdisplay: none;\r\n}\r\n.nsTabNavigator .nsTabContainer.nsTabContainerDisabled\r\n{\r\n    opacity: 0.5;\r\n    cursor: not-allowed;\r\n    pointer-events: none;\r\n}\r\n.nsTabNavigator .nsTab\r\n{\r\n    display: inline-block;\r\n    padding: 4px 12px;\r\n    text-decoration: none;\r\n    overflow: hidden;\r\n}\r\n\r\n.nsTabNavigatorLeft\r\n{\r\n}\r\n.nsTabNavigatorParent\r\n{\r\n\ttext-align: left;\r\n  \twidth: 100%;\r\n\toverflow: hidden;\r\n}\r\n.nsTabNavigatorRight\r\n{\r\n}\r\n\r\n.nsTabNav \r\n{\r\n\theight:100%;\r\n\twidth:35px;\r\n\tcursor: pointer;\r\n\ttext-align: center;\r\n}\r\n.nsTabLeftArrow\r\n{\r\n}\r\n.nsTabRightArrow\r\n{\r\n}\r\n.nsTabNav.nsTabNavDisabled\r\n{\r\n\topacity: .5;\r\n    pointer-events: none;\r\n    touch-action: none;\r\n    background: inherit;\r\n}\r\n\r\n.nsTabNavigator .nsTabContainer.nsTabWithClose\r\n{\r\n\t\r\n}\r\n.nsTabNavigator .nsTabContainer .nsTabClose\r\n{\r\n\tdisplay: inline-block;\r\n  \tfloat: right;\r\n  \tmargin: 0px;\r\n  \tmargin-right: 3px;\r\n    cursor: pointer;\r\n  \ttext-align: center;\r\n}\r\n.nsTabContentParent\r\n{\r\n    text-align: left;\r\n    padding: 5px 15px;\r\n}\r\n.nsTabContent\r\n{\r\n/* \tpadding: 15px; */\r\n    display: none;\r\n    text-align: left;\r\n}\r\n.nsTabContent.nsTabContentActive\r\n{\r\n\tdisplay: block;\r\n}\r\n.nsTabContent.nsTabContentHidden\r\n{\r\n\tdisplay: none;\r\n}\r\n.nsTabIndicator\r\n{\r\n\tposition: absolute;\r\n    bottom: 0;\r\n    left: 0;\r\n    height: 4px;\r\n    width: 100px;\r\n    background-color: transparent;\r\n    transform-origin: 0 0;\r\n    transition: transform .2s ease-in-out, background-color .2s ease-in-out, -webkit-transform .2s ease-in-out;\r\n}\r\n\r\n.nsTabNavigatorParentParentWhite\r\n{\r\n\tbackground-color: white;\r\n\tborder-bottom: 1px solid #eee;\r\n}\r\n\r\n.nsTabNavigatorWhite .nsTabContainer\r\n{\r\n\tborder: 1px solid #c8c8c8;\r\n    background-color: #f4f4f4;\r\n    transition: background-color 0.2s, box-shadow 0.2s;\r\n}\r\n.nsTabNavigatorWhite .nsTabContainerActive\r\n{\r\n    background-color: #007ad9;\r\n    border: 1px solid #007ad9;\r\n}\r\n.nsTabNavigatorWhite .nsTab\r\n{\r\n    font-size: 14px;\r\n    font-weight: 700;\r\n    color: #333333;\r\n    \r\n}\r\n.nsTabNavigatorWhite .nsTabContainerActive .nsTab\r\n{\r\n\tcolor: #ffffff;\r\n\ttext-shadow: none;\r\n}\r\n.nsTabNavigatorWhite .nsTabContainer .nsTabClose\r\n{\r\n\tfont-size: 20px;\r\n    font-weight: bold;\r\n    color: #333333;\r\n}\r\n.nsTabNavigatorWhite .nsTabContainerActive .nsTabClose\r\n{\r\n\tcolor: #ffffff;\r\n}\r\n.nsTabNavigatorWhite .nsTabContainer .nsTabClose:focus,.nsTabNavigatorWhite .nsTabContainer .nsTabClose:hover\r\n{\r\n\tcolor: #000000;\r\n\ttext-decoration: none;\r\n    cursor: pointer;\r\n    opacity: 0.4;\r\n}\r\n.nsTabContentParentWhite\r\n{\r\n\tbackground-color: white;\r\n    border: 1px solid #eee;\r\n    border-top: 0px;\r\n}\r\n.nsTabContentWhite\r\n{\r\n    background-color: white;\r\n}\r\n.nsTabNavWhite\r\n{\r\n   border: 1px solid #d9d9d9;\r\n   border-bottom: 0;\r\n   border-radius: 4px 4px 0 0;\r\n   background: #f9f9f9;\r\n}\r\n.nsTabIndicatorWhite\r\n{\r\n\tbackground: #e3165b;\r\n}";
styleInject(css_248z$3);

const nsCompUtil$4 = require('./generated/js/nsUtil.min.js');
const NSUtil$4 = nsCompUtil$4.NSUtil;
const nsCompTabNavigator$1 = require('./generated/js/nsTabNavigator.min.js');
const NSTabNavigator$1 = nsCompTabNavigator$1.NSTabNavigator;
class NSTabNavigatorReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__nsTabNavigator) {
            this.__arrEvents = [NSTabNavigator$1.TAB_CHANGE_STARTING,
                NSTabNavigator$1.TAB_CHANGED,
                NSTabNavigator$1.TAB_CHANGE_END];
            this.__nsUtil = new NSUtil$4();
            if (!this.props) {
                this.props = {};
            }
            //const setting:INSTabNavigatorReactSetting =  this.__nsUtil.cloneObject(this.props.setting,true);
            const arrIgnore = ["children"];
            const tempSetting = this.props.setting ? this.props.setting : this.props;
            const setting = this.__nsUtil.cloneObject(tempSetting, true, arrIgnore);
            this.__setting = setting;
            this.__addEvents();
            this.__nsTabNavigator = new NSTabNavigator$1(this.__container, this.__setting);
            this.__addMethods();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        this.processProps(nextProps);
        return false;
    }
    processProps(nextProps) {
        const arrPropKeys = Object.keys(nextProps);
        const arrSettingKeys = Object.keys(this.__setting);
        for (const propKey of arrPropKeys) {
            if (propKey === "setting") {
                const newSetting = nextProps.setting;
                for (const settingKey of arrSettingKeys) {
                    if (!this.__nsUtil.isObjectEqual(this.__setting[settingKey], newSetting[settingKey])) {
                        ({ oldValue: this.__setting[settingKey], newValue: newSetting[settingKey] });
                    }
                }
            }
            else if (!this.__nsUtil.isObjectEqual(this.props[propKey], nextProps[propKey])) {
                ({ oldValue: this.props[propKey], newValue: nextProps[propKey] });
            }
        }
        /*const arrChangeKeys: string[] = Object.keys(objChanges);
        for (const changeKey of arrChangeKeys)
        {
        }*/
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            children: this.props.children,
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    renderAddedComponents() {
        if (this.__nsTabNavigator) {
            this.__nsTabNavigator.renderAddedComponents();
        }
    }
    __addMethods() {
        ReactUtil.getMethods(this.__nsTabNavigator, null, this.__addMethod.bind(this));
    }
    ;
    __addMethod(funcName) {
        let self = this;
        let callback = function () {
            return ReactUtil.callMethod(self.__nsTabNavigator, funcName, arguments);
        };
        ReactUtil.addMethod(this, funcName, callback);
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}

var css_248z$2 = ".nsListOuterContainer\r\n{\r\n    position: relative;   \r\n    overflow-y: auto;\r\n    width:inherit;\r\n    height:inherit;\r\n}\r\n\r\n.nsListOuterContainer .nsListParentContainer\r\n{\r\n\tposition: absolute; \r\n\theight: 100%; \r\n\twidth: 99%; \r\n\tmargin: 0px; \r\n\tpadding: 0px;\r\n\tbackground-color: #FFFFFF;\r\n\tcolor: #333;\r\n}\r\n\r\n.nsListOuterContainer .nsListContainer\r\n{\r\n\tmin-height: 42px;\r\n    padding-left: 0px;\r\n    \r\n\tdisplay: block;\r\n    list-style-type: disc;\r\n    -webkit-margin-before: 1em;\r\n    -webkit-margin-after: 1em;\r\n    -webkit-margin-start: 0px;\r\n    -webkit-margin-end: 0px;\r\n    -webkit-padding-start: 0px;\r\n    margin:0px;\r\n}\r\n.nsListOuterContainer .nsListItem\r\n{\r\n\tbackground-color: #fff;\r\n    border: 1px solid #f4f4f4;\r\n    border-top-right-radius: 4px;\r\n    border-top-left-radius: 4px;\r\n    display: block;\r\n    margin-bottom: -1px;\r\n}\r\n.nsListOuterContainer.nsListOuterContainerHierarchical .nsListItem\r\n{\r\n\t/*for Virtual Scrolling in Hierarchical List*/\r\n\tmin-height:25px;\r\n}\r\n.nsListItemHover \r\n{  \r\n  background-color: #3875d7;\r\n  background-image: -webkit-gradient(linear, left top, left bottom, color-stop(20%, #3875d7), color-stop(90%, #2a62bc));\r\n  background-image: linear-gradient(#3875d7 20%, #2a62bc 90%);\r\n  color: #fff;\r\n} \r\n.nsListItemAnimated .nsListChild\r\n{\r\n\twidth: 100%; \r\n\tposition: relative; \r\n  \tz-index: 2;\r\n  \ttext-decoration: none;\r\n  \tbox-sizing: border-box;  \r\n  \t-moz-box-sizing: border-box;  \r\n  \t-webkit-box-sizing: border-box; \r\n}\r\n.nsListItemAnimated:hover .nsListChild\r\n{\r\n\tcolor: #FFFFFF;\r\n}\r\n.nsListItemAnimated .nsListChild:after\r\n{\r\n  content: \"\";\r\n  height: 100%; \r\n  left: 0; \r\n  top: 0; \r\n  width: 0px;  \r\n  position: absolute; \r\n  transition: all 0.2s ease 0s; \r\n  -webkit-transition: all 0.2s ease 0s; \r\n  z-index: -1;\r\n}\r\n.nsListItemAnimated .nsListChild:hover:after\r\n{ \r\n\twidth: 100%; \r\n}\r\n.nsListItemAnimated .nsListChild:after\r\n{ \r\n\tbackground: #3498db; \r\n}\r\n.nsListOuterContainer .nsListItemSelected \r\n{\r\n\tbackground-color: #CED2CC;\r\n    color: #000;\r\n}\r\n.nsListOuterContainer .nsListNoRecordsFound \r\n{\r\n    text-align: center;\r\n}\r\n.nsListContainerDroppable\r\n{\r\n\tborder: 1px solid #a0a0a0;\r\n}\r\n.nsListEmpty\r\n{\r\n\tmargin: 0px;\r\n\tpadding: 5px;\r\n}\r\n.nsListEmptyChild\r\n{\r\n\tborder: 1px dashed #a0a0a0;\r\n\tborder-radius: 3px;\r\n\tpadding: 3px;\r\n\tcursor: pointer;\r\n\tfont-size: 10px;\r\n\tbackground-color: white;\r\n}\r\n.nsListOuterContainer .nsListGroupCell \r\n{\r\n  \tposition: relative;\r\n  \toverflow: hidden;\r\n  \tmin-height: 19px;\r\n}\r\n.nsListOuterContainer .nsListGroupCell > * \r\n{\r\n   display: inline-block;\r\n   padding: 3px;\r\n}\r\n.nsListOuterContainer .nsListGroupCellText\r\n{\r\n\tpadding-left: 1.5em;\r\n}\r\n.nsListOuterContainer .nsListArrowParent\r\n{\r\n\tposition: absolute;\r\n    top: 0px;\r\n    left:0px;\r\n}\r\n.nsListOuterContainer .nsListArrow\r\n{\r\n\theight:15px;\r\n}\r\n.nsListOuterContainer .nsListArrowFill \r\n{\r\n\twidth:16px;\r\n\theight:16px;\r\n    fill:#000000;\r\n\t/*stroke:#000000;\r\n\tstroke-width:0.5;*/\r\n} \r\n\r\n.nsListTruncateToFit,.nsListTruncateToFit *\r\n{\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n.nsListDottedRow \r\n{\r\n    position: relative;\r\n    margin: 0;\r\n    padding: 0;\r\n    border: none; \r\n}\r\n/* line 25, /Users/jonasvonandrian/jquery-sortable/source/css/jquery-sortable.css.sass */\r\n.nsListDottedRow:before \r\n{\r\n  \tposition: absolute;\r\n  \tcontent: \"\";\r\n  \twidth: 0;\r\n  \theight: 0;\r\n  \tmargin-top: -5px;\r\n  \tleft: -5px;\r\n  \ttop: -4px;\r\n  \tborder: 5px solid transparent;\r\n  \tborder-left-color: red;\r\n  \tborder-right: none; \r\n}.nsTextBoxContainer\r\n{\r\n\tposition: relative;\r\n}\r\n.nsTextBox \r\n{\r\n    outline: 0;\r\n    border-color: #ECECEC;\r\n    border-style: solid;\r\n    border-width: 1px;\r\n    background-color: #ffffff;\r\n    padding-top: 5px;\r\n    padding-bottom: 5px;\r\n    border-radius: 2px;\r\n    /*margin-bottom: 5px;*/\r\n    width: 100%;\r\n}\t\r\n\r\n/*.nsTextBoxList {\r\n    position: absolute;\r\n    top: 100%;\r\n    left: 0;\r\n    min-width: 160px;\r\n    z-index: 1000;\r\n    float: left;\r\n    min-width: 160px;\r\n    padding: 5px 0;\r\n    margin: 2px 0 0;\r\n    font-size: 14px;\r\n    text-align: left;\r\n    list-style: none;\r\n    background-color: #fff;\r\n    -webkit-background-clip: padding-box;\r\n    background-clip: padding-box;\r\n    border: 1px solid #ccc;\r\n    border: 1px solid rgba(0, 0, 0, .15);\r\n    border-radius: 4px;\r\n    -webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, .175);\r\n    box-shadow: 0 6px 12px rgba(0, 0, 0, .175);\r\n}*/\r\n\r\n.nsTextBoxList\r\n{\r\n\tposition: absolute;\r\n    top: 100%;\r\n    left: 0;\r\n    min-width: 160px;\r\n    border-color: #ececec;\r\n    border-width: 1px;\r\n    border-style: solid;\r\n    border-radius: 2px;\r\n    padding: 6px;\r\n    cursor: pointer;\r\n    z-index: 9999;\r\n    margin-top: -6px;\r\n    background-color: #ffffff;\r\n    border-size:1px;\r\n\tborder-style:solid;\r\n}\r\n.nsTextHighlight \r\n{\r\n  color: #FF0000;\r\n  font-weight: bold;\r\n  font-size: 105%;\r\n}\r\n.nsTextBoxMultiSelectContainer\r\n{\r\n    z-index: 1;\r\n    display: inline-block;\r\n    width: 100%;\r\n    padding: 5px 8px 2px;\r\n/*     overflow: hidden; */\r\n    border: 1px solid #d0d0d0;\r\n    -webkit-border-radius: 3px;\r\n    -moz-border-radius: 3px;\r\n    border-radius: 3px;\r\n    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);\r\n    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);\r\n    -webkit-box-sizing: border-box;\r\n    -moz-box-sizing: border-box;\r\n    box-sizing: border-box;\r\n    cursor: text;\r\n    background: #ffffff;\r\n    line-height: 18px;\r\n    color: #303030;\r\n}\r\n.nsTextBoxMultiSelect\r\n{\r\n\twidth: 4px;\r\n    opacity: 1;\r\n    position: relative;\r\n    left: 0px;\r\n   \tmax-width: 100% !important;\r\n    max-height: none !important;\r\n    min-height: 0 !important;\r\n    padding: 0 !important;\r\n    margin: 0 1px !important;\r\n    line-height: inherit !important;\r\n    text-indent: 0 !important;\r\n    background: none !important;\r\n    border: 0 none !important;\r\n    -webkit-box-shadow: none !important;\r\n    box-shadow: none !important;\r\n    -webkit-user-select: auto !important;\r\n    font-size: 13px;\r\n    -webkit-font-smoothing: inherit;\r\n    line-height: 18px;\r\n    color: #303030;\r\n}\r\n.nsTextBoxMultiSelectTag \r\n{\r\n     position: relative;\r\n     display: inline-block;\r\n     padding: .25em 1.5em .25em .5em;\r\n     border: 1px solid #bdbdbd;\r\n     border-radius: .2em;\r\n     margin: 0 .2em .2em 0;\r\n     line-height: 1;\r\n     vertical-align: middle;\r\n }\r\n .nsTextBoxMultiSelectTag:last-child \r\n {\r\n     margin-right: 0;\r\n }\r\n .nsTextBoxMultiSelectTag:hover \r\n {\r\n     background: #efefef;\r\n }\r\n .nsTextBoxMultiSelectTagText\r\n {\r\n     min-height: 1em;\r\n }\r\n .nsTextBoxMultiSelectTagClose \r\n {\r\n     position: absolute;\r\n     top: .25em;\r\n     right: .25em;\r\n     width: 1em;\r\n     height: 1em;\r\n     opacity: 0.3;\r\n     cursor: pointer; \r\n     cursor: hand;\r\n }\r\n .nsTextBoxMultiSelectTagClose:hover \r\n {\r\n     opacity: 1;\r\n }\r\n .nsTextBoxMultiSelectTagClose:before,\r\n .nsTextBoxMultiSelectTagClose:after \r\n {\r\n     content: \"\";\r\n     position: absolute;\r\n     left: .5em;\r\n     width: 2px;\r\n     height: 1em;\r\n     background-color: #333;\r\n }\r\n .nsTextBoxMultiSelectTagClose:before \r\n {\r\n     transform: rotate(45deg);\r\n }\r\n .nsTextBoxMultiSelectTagClose:after \r\n {\r\n     transform: rotate(-45deg);\r\n }\r\n .nsTextBoxTest\r\n {\r\n \tposition:absolute;\r\n\ttop: -99999;\r\n\tleft: -99999;\r\n\twidth: auto;\r\n\tpadding: 0;\r\n\twhiteSpace:pre;\r\n }\r\n  /*temporary removing close button from textBox in autocomplete mode as I am not listening to that event for now  */\r\n .nsTextBoxAutoComplete::-ms-clear\r\n {\r\n \twidth : 0;\r\n \theight: 0;\r\n }";
styleInject(css_248z$2);

const nsCompUtil$3 = require('./generated/js/nsUtil.min.js');
const NSUtil$3 = nsCompUtil$3.NSUtil;
const nsCompTextBox$1 = require('./generated/js/nsTextBox.min.js');
const NSTextBox$1 = nsCompTextBox$1.NSTextBox;
class NSTextBoxReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__nsTextBox) {
            this.__nsUtil = new NSUtil$3();
            this.__arrEvents = [NSTextBox$1.ITEM_SELECTED,
                NSTextBox$1.ITEM_UNSELECTED];
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__dataSource = this.props.dataSource || setting.dataSource;
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    create() {
        this.__nsTextBox = new NSTextBox$1(this.__container, this.__setting);
    }
    ;
    dataSource(source) {
        return this.__nsTextBox.dataSource(source);
    }
    ;
    getTextBox() {
        return this.__nsTextBox.getTextBox();
    }
    ;
    setText(text) {
        this.__nsTextBox.setText(text);
    }
    ;
    getText() {
        return this.__nsTextBox.getText();
    }
    ;
    setSelectedItems(arrItems) {
        this.__nsTextBox.setSelectedItems(arrItems);
    }
    ;
    setSelectedItem(item) {
        this.__nsTextBox.setSelectedItem(item);
    }
    ;
    setSelectedIndexes(arrSelectedIndex) {
        this.__nsTextBox.setSelectedIndexes(arrSelectedIndex);
    }
    ;
    setSelectedIndex(selectedIndex) {
        this.__nsTextBox.setSelectedIndexes(selectedIndex);
    }
    ;
    unSelectItems(arrItems) {
        this.__nsTextBox.unSelectItems(arrItems);
    }
    ;
    unSelectItem(item) {
        this.__nsTextBox.unSelectItem(item);
    }
    ;
    unSelectIndexes(arrSelectedIndex) {
        this.__nsTextBox.unSelectIndexes(arrSelectedIndex);
    }
    ;
    unSelectIndex(selectedIndex) {
        this.__nsTextBox.unSelectIndex(selectedIndex);
    }
    ;
    unSelectAll(fireEvent) {
        this.__nsTextBox.unSelectAll(fireEvent);
    }
    ;
    getSelectedItem() {
        return this.__nsTextBox.getSelectedItem();
    }
    ;
    getSelectedItems() {
        return this.__nsTextBox.getSelectedItems();
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}
NSTextBoxReact.TYPE_AUTOTEXT = NSTextBox$1.TYPE_AUTOTEXT;
NSTextBoxReact.TYPE_AUTOCOMPLETE = NSTextBox$1.TYPE_AUTOCOMPLETE;
NSTextBoxReact.TYPE_EMAIL = NSTextBox$1.TYPE_EMAIL;
NSTextBoxReact.TYPE_NUMBER = NSTextBox$1.TYPE_NUMBER;
NSTextBoxReact.TYPE_PASSWORD = NSTextBox$1.TYPE_PASSWORD;
NSTextBoxReact.TYPE_URL = NSTextBox$1.TYPE_URL;
NSTextBoxReact.DROPDOWN_TYPE_LIST = NSTextBox$1.DROPDOWN_TYPE_LIST;
NSTextBoxReact.DROPDOWN_TYPE_GRID = NSTextBox$1.DROPDOWN_TYPE_GRID;
NSTextBoxReact.FILTER_TYPE_EXACT = "exact";
NSTextBoxReact.FILTER_TYPE_STARTS_WITH = "startsWith";
NSTextBoxReact.FILTER_TYPE_ENDS_WITH = "endsWith";
NSTextBoxReact.FILTER_TYPE_CONTAINS = "contains";

var css_248z$1 = ".nsPanelModalProp\r\n{\r\n    display: none; /* Hidden by default */\r\n    position: fixed; /* Stay in place */\r\n    z-index: 1; /* Sit on top */\r\n    padding-top: 100px; /* Location of the box */\r\n    left: 0;\r\n    top: 0;\r\n    width: 100%; /* Full width */\r\n    height: 100%; /* Full height */\r\n    overflow: auto; /* Enable scroll if needed */\r\n    -webkit-backface-visibility: hidden;\r\n    backface-visibility: hidden;\r\n    background-color: rgba(0,0,0,.4);\r\n    transition: opacity .3s;\r\n}\r\n.nsPanelModalAnimation\r\n{\r\n\topacity: 0;\r\n    -webkit-transition: opacity .15s linear;\r\n    -o-transition: opacity .15s linear;\r\n    transition: opacity .15s linear;\r\n}\r\n.nsPanelModalProp.nsPanelModalOpen\r\n{\r\n\toverflow-x: hidden;\r\n    overflow-y: auto;\r\n}\r\n.nsPanelModalAnimation.nsPanelModalOpen\r\n{\r\n\topacity: 1;\r\n}\r\n.nsPanel \r\n{\r\n    /*margin: 0;*/\r\n    padding: 0;\r\n    width: 100%;\r\n    pointer-events: auto;\r\n    border-radius: .3rem;\r\n}\r\n.nsPanel.nsPanelModalContent \r\n{\r\n    position: relative;\r\n    margin: auto;\r\n    padding: 0;\r\n    width: 40%;\r\n    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);\r\n    z-Index: 100;\r\n}\r\n.nsPanel.nsPanelModalContentDrag\r\n{\r\n\tleft: 20%;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalZoom\r\n{\r\n\t-webkit-animation-name: nsAnimateZoomIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateZoomIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalZoom\r\n{\r\n\t-webkit-animation-name: nsAnimateZoomOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateZoomOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalLeft\r\n{\r\n\t-webkit-animation-name: nsAnimateLeftIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateLeftIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalLeft\r\n{\r\n\t-webkit-animation-name: nsAnimateLeftOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateLeftOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRight\r\n{\r\n\t-webkit-animation-name: nsAnimateRightIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRightIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRight\r\n{\r\n\t-webkit-animation-name: nsAnimateRightOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRightOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalTop\r\n{\r\n\t-webkit-animation-name: nsAnimateTopIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateTopIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalTop\r\n{\r\n\t-webkit-animation-name: nsAnimateTopOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateTopOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalBottom\r\n{\r\n\t-webkit-animation-name: nsAnimateBottomIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBottomIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalBottom\r\n{\r\n\t-webkit-animation-name: nsAnimateBottomOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBottomOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalFlipX\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipXIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipXIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalFlipX\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipXOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipXOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalFlipY\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipYIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipYIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalFlipY\r\n{\r\n\t-webkit-animation-name: nsAnimateFlipYOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateFlipYOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRoll\r\n{\r\n\t-webkit-animation-name: nsAnimateRollIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRollIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRoll\r\n{\r\n\t-webkit-animation-name: nsAnimateRollOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRollOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalBounce\r\n{\r\n\t-webkit-animation-name: nsAnimateBounceIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBounceIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalBounce\r\n{\r\n\t-webkit-animation-name: nsAnimateBounceOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateBounceOut;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelOpen.nsPanelModalRotate\r\n{\r\n\t-webkit-animation-name: nsAnimateRotateIn;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRotateIn;\r\n    animation-duration: 0.5s;\r\n}\r\n.nsPanel.nsPanelModalRotate\r\n{\r\n\t-webkit-animation-name: nsAnimateRotateOut;\r\n    -webkit-animation-duration: 0.5s;\r\n    animation-name: nsAnimateRotateOut;\r\n    animation-duration: 0.5s;\r\n}\r\n\r\n.nsPanel.nsPanelOpen.nsPanelWidget\r\n{\r\n\twidth: 45%;\r\n    height: 45%;\r\n    background: #F6F6F6;\r\n}\r\n.nsPanel .nsPanelTitleBar \r\n{\r\n    text-align: left;\r\n    min-height: 20px;\r\n    box-sizing: border-box;\r\n    display: -webkit-box;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    -webkit-box-orient: horizontal;\r\n    -webkit-box-direction: normal;\r\n    -ms-flex-direction: row;\r\n    flex-direction: row;\r\n    -ms-flex-wrap: nowrap;\r\n    flex-wrap: nowrap;\r\n    -webkit-box-align: center;\r\n    -ms-flex-align: center;\r\n    -ms-grid-row-align: center;\r\n    align-items: center;\r\n}\r\n.nsPanel .nsPanelTitleBarContent \r\n{\r\n    -webkit-box-flex: 1;\r\n    -ms-flex: 1 1 auto;\r\n    flex: 1 1 auto;\r\n    cursor: move;\r\n    overflow: hidden;\r\n}\r\n.nsPanel .nsPanelControlbar \r\n{\r\n    /*display: -webkit-box;\r\n    display: -ms-flexbox;*/\r\n    display: flex;\r\n    -webkit-box-align: center;\r\n    -ms-flex-align: center;\r\n    -ms-grid-row-align: center;\r\n    align-items: center;\r\n    float:right;\r\n}\r\n.nsPanel .nsPanelControlbar .nsPanelControlButton \r\n{\r\n    padding: 0 3px;\r\n    cursor: pointer;\r\n}\r\n/* donot give padding */\r\n.nsPanel .nsPanelBody \r\n{\r\n    overflow: auto;\r\n    height: 91%;\r\n    width:100%;\r\n}\r\n.nsPanel .nsPanelExpColIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelMinMaxIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelFullScreenIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanel .nsPanelCloseIcon\r\n{\r\n\twidth:14px;\r\n\theight:14px;\r\n}\r\n.nsPanelMinimizeContainer \r\n{\r\n    bottom: 0;\r\n    left: 0;\r\n    position: fixed;\r\n    width: 100%;\r\n    z-index: 9999;\r\n}\r\n.nsPanelMinimized \r\n{\r\n    /*width: 250px;\r\n    height: 35px;\r\n    overflow: hidden !important;\r\n    padding: 0px !important;\r\n    margin: 0px;\r\n    position: static !important;*/\r\n    height: auto !important;\r\n    left: auto !important;\r\n    opacity: 1;\r\n    top: auto !important;\r\n    width: auto !important;\r\n    position: static !important;\r\n}\r\n.nsPanelMinimized.nsPanelMinimizedright\r\n{\r\n\tfloat: right;\r\n}\r\n.nsPanelMinimized.nsPanelMinimizedleft\r\n{\r\n\tfloat: left;\r\n}\r\n.nsPanelFullScreen \r\n{\r\n\theight: 100%!important;\r\n    width: 100%!important;\r\n    height: 100vh!important;\r\n    width: 100vw!important;\r\n    position: fixed!important; \r\n    top: 0!important; \r\n    left: 0!important; \r\n    bottom: 0!important;\r\n  \tright: 0!important;\r\n  \tmargin: 0;\r\n    z-index:100;\r\n    opacity:1;\r\n}\r\n\r\n/* Add Animation */\r\n@keyframes nsAnimateZoomIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    50% {\r\n        opacity: 1;\r\n    }\r\n}\r\n@keyframes nsAnimateZoomOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    50% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateTopIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,-100%,0);\r\n        transform: translate3d(0,-100%,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateTopOut {\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,100%,0);\r\n        transform: translate3d(0,100%,0);\r\n    }\r\n}\r\n@keyframes nsAnimateBottomIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,100%,0);\r\n        transform: translate3d(0,100%,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateBottomOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(0,-100%,0);\r\n        transform: translate3d(0,-100%,0);\r\n    }\r\n}\r\n@keyframes nsAnimateLeftIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0);\r\n        transform: translate3d(-100%,0,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateLeftOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0);\r\n        transform: translate3d(100%,0,0);\r\n    }\r\n}\r\n@keyframes nsAnimateRightIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0);\r\n        transform: translate3d(100%,0,0);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateRightOut {\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0);\r\n        transform: translate3d(-100%,0,0);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipXIn{\r\n    0% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n        opacity: 0;\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n    }\r\n\r\n    60% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,10deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,10deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-5deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-5deg);\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipXOut{\r\n    0% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n\r\n    30% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,-20deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        transform: perspective(400px) rotate3d(1,0,0,90deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateFlipYIn{\r\n    0% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n        opacity: 0;\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-20deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-20deg);\r\n        -webkit-transition-timing-function: ease-in;\r\n        transition-timing-function: ease-in;\r\n    }\r\n\r\n    60% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,10deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,10deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-5deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-5deg);\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n}\r\n@keyframes nsAnimateFlipYOut{\r\n    0% {\r\n        -webkit-transform: perspective(400px);\r\n        transform: perspective(400px);\r\n    }\r\n\r\n    30% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,-15deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,-15deg);\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        transform: perspective(400px) rotate3d(0,1,0,90deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n@keyframes nsAnimateRollIn{\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);\r\n        transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n    }\r\n}\r\n@keyframes nsAnimateRollOut{\r\n    0% {\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: translate3d(100%,0,0) rotate3d(0,0,1,120deg);\r\n        transform: translate3d(100%,0,0) rotate3d(0,0,1,120deg);\r\n    }\r\n}\r\n@keyframes nsAnimateBounceIn {\r\n    0%,100%,20%,40%,60%,80% {\r\n        -webkit-transition-timing-function: cubic-bezier(0.215,.61,.355,1);\r\n        transition-timing-function: cubic-bezier(0.215,.61,.355,1);\r\n    }\r\n\r\n    0% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n\r\n    20% {\r\n        -webkit-transform: scale3d(1.1,1.1,1.1);\r\n        transform: scale3d(1.1,1.1,1.1);\r\n    }\r\n\r\n    40% {\r\n        -webkit-transform: scale3d(.9,.9,.9);\r\n        transform: scale3d(.9,.9,.9);\r\n    }\r\n\r\n    60% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1.03,1.03,1.03);\r\n        transform: scale3d(1.03,1.03,1.03);\r\n    }\r\n\r\n    80% {\r\n        -webkit-transform: scale3d(.97,.97,.97);\r\n        transform: scale3d(.97,.97,.97);\r\n    }\r\n\r\n    100% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1,1,1);\r\n        transform: scale3d(1,1,1);\r\n    }\r\n}\r\n@keyframes nsAnimateBounceOut{\r\n\t20% {\r\n        -webkit-transform: scale3d(.9,.9,.9);\r\n        transform: scale3d(.9,.9,.9);\r\n    }\r\n\r\n    50%,55% {\r\n        opacity: 1;\r\n        -webkit-transform: scale3d(1.1,1.1,1.1);\r\n        transform: scale3d(1.1,1.1,1.1);\r\n    }\r\n\r\n    100% {\r\n        opacity: 0;\r\n        -webkit-transform: scale3d(.3,.3,.3);\r\n        transform: scale3d(.3,.3,.3);\r\n    }\r\n}\r\n@keyframes nsAnimateRotateIn {\r\n    0% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: rotate3d(0,0,1,-200deg);\r\n        transform: rotate3d(0,0,1,-200deg);\r\n        opacity: 0;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: none;\r\n        transform: none;\r\n        opacity: 1;\r\n    }\r\n}\r\n@keyframes nsAnimateRotateOut {\r\n    0% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        opacity: 1;\r\n    }\r\n\r\n    100% {\r\n        -webkit-transform-origin: center;\r\n        transform-origin: center;\r\n        -webkit-transform: rotate3d(0,0,1,200deg);\r\n        transform: rotate3d(0,0,1,200deg);\r\n        opacity: 0;\r\n    }\r\n}\r\n/****************************************White Theme ***************************************/\r\n.nsPanelWhite\r\n{\r\n\tbackground-color: #fefefe;\r\n\t/*border: 1px solid rgba(0,0,0,.2);*/\r\n\tborder: 5px solid #157fcc;\r\n}\r\n.nsPanelModalWhite .nsPanelWhite\r\n{\r\n\tbackground-color: #fff;\r\n    border: 5px solid #157fcc;\r\n}\r\n.nsPanelWhite .nsPanelTitleBar\r\n{\r\n\tbackground-color: #157fcc;\r\n\tfont-weight: bold;\r\n}\r\n.nsPanelWhite .nsPanelTitleBarContent\r\n{\r\n\tcolor: #fefefe;\r\n}\r\n.nsPanelWhite .nsPanelExpColIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n.nsPanelWhite .nsPanelMinMaxIconUse \r\n{\r\n  fill: #F6F6F6;\r\n  color: #848484;\r\n}\r\n.nsPanelWhite .nsPanelCloseIconUse \r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n.nsPanelWhite .nsPanelFullScreenIcon\r\n{\r\n  fill: #848484;\r\n  color: #F6F6F6;\r\n}\r\n/****************************************End of White Theme ***************************************/.nsDashboard \r\n{\r\n    padding-right: 15px;\r\n    padding-left: 15px;\r\n    margin-right: auto;\r\n    margin-left: auto;\r\n}\r\n.nsDashboard .nsDashboardPanel\r\n{\r\n\tposition: relative;\r\n    min-height: 1px;\r\n\tmargin-right: 2px;\r\n\tmargin-bottom: 2px;\r\n\tfloat: left;\r\n}";
styleInject(css_248z$1);

const nsCompDashboard$1 = require('./generated/js/nsDashboard.min.js');
const NSDashboard$1 = nsCompDashboard$1.NSDashboard;
nsCompDashboard$1.NSPanel;
const nsCompUtil$2 = require('./generated/js/nsUtil.min.js');
const NSUtil$2 = nsCompUtil$2.NSUtil;
class NSDashboardReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__arrCustomComponent = [];
        this.__arrComponentInstance = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
        this.portals = [];
        this.hasPendingPortalUpdate = false;
        this.updateCallbacksOnUpdate = [];
        DynamicComponentService.addDefaultMethods(this, "NSDashboardReact", null, this.batchUpdateCallback.bind(this));
    }
    componentDidMount() {
        if (!this.__objNSDashboard) {
            this.__nsUtil = new NSUtil$2();
            this.__arrEvents = [NSDashboard$1.PANEL_DRAG_START,
                NSDashboard$1.PANEL_DRAG_ENTER,
                NSDashboard$1.PANEL_DRAG_OVER,
                NSDashboard$1.PANEL_DRAG_LEAVE,
                NSDashboard$1.PANEL_DROP,
                NSDashboard$1.PANEL_DRAG_END];
            if (!this.props) {
                this.props = {};
            }
            const setting = this.__nsUtil.cloneObject(this.props.setting, true);
            this.__setting = setting;
            this.__createComponent();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            if (this.__objNSDashboard) {
                this.__objNSDashboard.removeComponent();
                this.__objNSDashboard = null;
            }
            for (let comp of this.__arrCustomComponent) {
                if (comp && comp.componentRef) {
                    comp.componentRef.destroy();
                }
            }
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            className: this.props.className,
            ref: (e) => {
                this.__container = e;
            }
        }, this.portals);
    }
    getElement() {
        return this.__container;
    }
    ;
    getAllPanel() {
        if (this.__objNSDashboard) {
            return this.__objNSDashboard.getAllPanel();
        }
        return null;
    }
    ;
    getPanel(item) {
        if (this.__objNSDashboard) {
            return this.__objNSDashboard.getPanel(item);
        }
        return null;
    }
    ;
    getAllBodyComponentInstance(index) {
        return this.__arrComponentInstance;
    }
    ;
    getBodyComponentInstance(index) {
        if (index > -1 && index < this.__arrComponentInstance.length) {
            return this.__arrComponentInstance[index];
        }
        return null;
    }
    ;
    batchUpdateCallback() {
        if (this.updateCallbacksOnUpdate.length > 0) {
            for (let item of this.updateCallbacksOnUpdate) {
                if (item && item.dynamicCompRef && item.dynamicCompRef.getComponentInstance()) {
                    item.callback(item.dynamicCompRef, item.dynamicCompRef.getComponentInstance(), item.container);
                }
            }
            this.updateCallbacksOnUpdate = [];
        }
    }
    ;
    __createComponent() {
        if (this.__objNSDashboard) {
            this.__objNSDashboard = null;
        }
        if (this.__setting.arrPanelSetting) {
            let panelSetting = null;
            let index = 0;
            for (panelSetting of this.__setting.arrPanelSetting) {
                this.__initPanel(panelSetting, index);
            }
        }
        this.__setting.container = this.getElement();
        this.__objNSDashboard = new NSDashboard$1(this.__setting);
        this.__addEvents();
    }
    ;
    __initPanel(setting, index) {
        if (setting.contentComponent) {
            setting.contentComponent = this.__customEditor(setting.contentComponent, index, (instance) => {
                setting.bodyComponentInstance = instance;
                this.__arrComponentInstance[index] = instance;
            });
        }
    }
    ;
    __customEditor(customEditorComponent, index, mainCallback) {
        const self = this;
        const __editor = function () {
            let objComponent = null;
            let componentRef = null;
            this.init = function (data) {
                const objPromise = new Promise((parResolve, parReject) => {
                    const callback = (dynamicCompRef, localComponentRef, container) => {
                        componentRef = dynamicCompRef;
                        if (localComponentRef) {
                            objComponent = localComponentRef["component"] ? localComponentRef["component"] : localComponentRef;
                            if (objComponent && objComponent.init) {
                                mainCallback && mainCallback(objComponent);
                                objComponent.init(data);
                            }
                            let item = { instance: objComponent, componentRef: componentRef, component: customEditorComponent, data: data };
                            self.__arrCustomComponent[index] = item;
                            self.__emitRendererComponentCreated(item);
                            parResolve(dynamicCompRef);
                        }
                        else {
                            self.updateCallbacksOnUpdate.push({ callback: callbackSent, dynamicCompRef: dynamicCompRef, container: container, data: data });
                        }
                    };
                    const callbackSent = callback.bind(self);
                    self.__getComponent(customEditorComponent, callbackSent, data);
                });
                return objPromise;
            };
            this.getElement = function () {
                return componentRef.getElement();
            };
            this.elementAdded = function () {
                if (objComponent && objComponent.elementAdded) {
                    objComponent.elementAdded();
                }
            };
            this.fullScreenChanged = function (isFullScreen) {
                if (objComponent && objComponent.fullScreenChanged) {
                    objComponent.fullScreenChanged(isFullScreen);
                }
            };
            this.destroy = function () {
                if (objComponent && objComponent.destroy) {
                    objComponent.destroy();
                }
            };
        };
        return __editor;
    }
    ;
    __getComponent(rendererComponent, paramCallback, prop) {
        let self = this;
        var objPromise = new Promise(function (parResolve, parReject) {
            let params = {};
            if (prop) {
                params = prop;
            }
            const dynamicComponentService = new DynamicComponentService(rendererComponent, self);
            let promise = dynamicComponentService.init(params, "nsMessageBox");
            promise.then(function () {
                //dynamicComponentService.createComponent(callback,prop);
                const objComponent = dynamicComponentService.getComponentInstance();
                const container = dynamicComponentService.getElement();
                let callback = paramCallback;
                callback && callback(dynamicComponentService, objComponent, container);
                parResolve({ ref: dynamicComponentService, instance: objComponent, container: container });
                //return dynamicComponentService; 
            });
        });
        return objPromise;
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
    __emitRendererComponentCreated(objItem) {
        this.__eventListener(objItem, "rendererComponentCreated");
    }
    ;
}

var css_248z = "@font-face {\r\n   font-family: 'NSComponentFont';\r\n   src: url(\"data:application/font-woff;base64,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\") format('woff');\r\n    font-weight: normal;\r\n  \tfont-style: normal;\r\n  font-display: block;\r\n}\r\n\r\n/*@font-face {\r\n  font-family: 'NSComponentFont';\r\n  src:\r\n    url('fonts/NSComponentFont.ttf?lgv4tg') format('truetype'),\r\n    url('fonts/NSComponentFont.woff?lgv4tg') format('woff'),\r\n    url('fonts/NSComponentFont.svg?lgv4tg#NSComponentFont') format('svg');\r\n  font-weight: normal;\r\n  font-style: normal;\r\n  font-display: block;\r\n}*/\r\n.ns-icon {\r\n    display: inline-block;\r\n    font: normal normal normal 14px / 1 NSComponentFont;\r\n    font-size: inherit;\r\n    text-rendering: auto;\r\n    -webkit-font-smoothing: antialiased;\r\n    -moz-osx-font-smoothing: grayscale;\r\n}\r\n\r\n.ns-icon:before \r\n{\r\n    --webkit-backface-visibility:hidden;-webkit-backface-visibility: hidden;\r\n    backface-visibility: hidden\r\n}\r\n\r\n.ns-icon .nseRotate90 \r\n{\r\n    filter: none;\r\n\t-webkit-transform: rotate(90deg);\r\n\t-ms-transform: rotate(90deg);\r\n\ttransform: rotate(90deg);\r\n}\r\n\r\n.ns-editor-align-center:before {\r\n  content: \"\\e900\";\r\n}\r\n.ns-editor-align-justify:before {\r\n  content: \"\\e901\";\r\n}\r\n.ns-editor-align-left:before {\r\n  content: \"\\e902\";\r\n}\r\n.ns-editor-align-right:before {\r\n  content: \"\\e903\";\r\n}\r\n.ns-editor-angle-double-down:before {\r\n  content: \"\\e904\";\r\n}\r\n.ns-editor-angle-double-up:before {\r\n  content: \"\\e905\";\r\n}\r\n.ns-editor-angle-down:before {\r\n  content: \"\\e906\";\r\n}\r\n.ns-editor-angle-up:before {\r\n  content: \"\\e907\";\r\n}\r\n.ns-editor-background-color:before {\r\n  content: \"\\e908\";\r\n}\r\n.ns-editor-bars:before {\r\n  content: \"\\e909\";\r\n}\r\n.ns-editor-bold:before {\r\n  content: \"\\e90a\";\r\n}\r\n.ns-editor-bookmark:before {\r\n  content: \"\\e90b\";\r\n}\r\n.ns-editor-close-bold:before {\r\n  content: \"\\e90c\";\r\n}\r\n.ns-editor-collapse:before {\r\n  content: \"\\e90d\";\r\n}\r\n.ns-editor-collapse-bold:before {\r\n  content: \"\\e90e\";\r\n}\r\n.ns-editor-decrease-indent:before {\r\n  content: \"\\e90f\";\r\n}\r\n.ns-editor-expand:before {\r\n  content: \"\\e910\";\r\n}\r\n.ns-editor-expand-bold:before {\r\n  content: \"\\e911\";\r\n}\r\n.ns-editor-font:before {\r\n  content: \"\\e912\";\r\n}\r\n.ns-editor-font-color:before {\r\n  content: \"\\e913\";\r\n}\r\n.ns-editor-font-size:before {\r\n  content: \"\\e914\";\r\n}\r\n.ns-editor-header:before {\r\n  content: \"\\e915\";\r\n}\r\n.ns-editor-increase-indent:before {\r\n  content: \"\\e916\";\r\n}\r\n.ns-editor-italics:before {\r\n  content: \"\\e917\";\r\n}\r\n.ns-editor-layout:before {\r\n  content: \"\\e918\";\r\n}\r\n.ns-editor-link:before {\r\n  content: \"\\e919\";\r\n}\r\n.ns-editor-minus:before {\r\n  content: \"\\e91a\";\r\n}\r\n.ns-editor-new-doc:before {\r\n  content: \"\\e91b\";\r\n}\r\n.ns-editor-next:before {\r\n  content: \"\\e91c\";\r\n}\r\n.ns-editor-ordered-list:before {\r\n  content: \"\\e91d\";\r\n}\r\n.ns-editor-paragraph:before {\r\n  content: \"\\e91e\";\r\n}\r\n.ns-editor-prev:before {\r\n  content: \"\\e91f\";\r\n}\r\n.ns-editor-preview:before {\r\n  content: \"\\e920\";\r\n}\r\n.ns-editor-print:before {\r\n  content: \"\\e921\";\r\n}\r\n.ns-editor-redo:before {\r\n  content: \"\\e922\";\r\n}\r\n.ns-editor-search:before {\r\n  content: \"\\e923\";\r\n}\r\n.ns-editor-source:before {\r\n  content: \"\\e924\";\r\n}\r\n.ns-editor-square:before {\r\n  content: \"\\e925\";\r\n}\r\n.ns-editor-strikethrough:before {\r\n  content: \"\\e926\";\r\n}\r\n.ns-editor-subscript:before {\r\n  content: \"\\e927\";\r\n}\r\n.ns-editor-superscript:before {\r\n  content: \"\\e928\";\r\n}\r\n.ns-editor-table:before {\r\n  content: \"\\e929\";\r\n}\r\n.ns-editor-trash:before {\r\n  content: \"\\e92a\";\r\n}\r\n.ns-editor-underline:before {\r\n  content: \"\\e92b\";\r\n}\r\n.ns-editor-undo:before {\r\n  content: \"\\e92c\";\r\n}\r\n.ns-editor-unordered-list:before {\r\n  content: \"\\e92d\";\r\n}\r\n.ns-editor-vertical-dots:before {\r\n  content: \"\\e92e\";\r\n}\r\n\r\n\r\n.nsEditor.nsEditorOuterContainer \r\n{\r\n\tborder: 1px solid #c0c0c0;\r\n\toverflow: hidden;\r\n\tposition: relative;\r\n\tbackground: #FFFFFF;\r\n}\r\n\r\n.nsEditor *,\r\n.nsEditorToolBarOveflowDropdown,.nsEditorToolBarOveflowDropdown *\r\n{\r\n    -webkit-box-sizing: border-box;\r\n    box-sizing: border-box;\r\n    outline: none;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarContainer\r\n{\r\n\tposition: relative;\r\n\twidth: 100%;\r\n    margin: 0;\r\n    padding: 0;\r\n    text-align: center;\r\n    color: #222222;\r\n    background: #ffffff;\r\n    font-family: Arial, Helvetica, sans-serif;\r\n    padding: 0 2px;\r\n    border: 0px;\r\n    overflow:hidden;\r\n    display: flex;\r\n    flex-flow: row nowrap;\r\n    align-items: center;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarContainer,\r\n.nsEditor .nsEditorToolBarContainer *,\r\n.nsEditorToolBarOveflowDropdown,.nsEditorToolBarOveflowDropdown *\r\n{\r\n\tborder-collapse: collapse;\r\n    text-align: left;\r\n    white-space: nowrap;\r\n    transition: none;\r\n    word-wrap: break-word;\r\n    z-index: 2;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarContent\r\n{\r\n\tdisplay: flex;\r\n    flex-flow: row wrap;\r\n    align-items: center;\r\n    flex-grow: 1;\r\n    flex-wrap: nowrap;\r\n    margin-right: 5px;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton\r\n{\r\n\t/*position: relative;\r\n\tdisplay: inline-flex;\r\n\twhite-space: nowrap;\r\n\tbackground: transparent;\r\n    color: #222222;\r\n    outline: 0;\r\n    border: 0;\r\n    line-height: 1;\r\n    cursor: pointer;\r\n    text-align: center;\r\n    transition: background 0.2s ease 0s;\r\n    border-radius: 0;\r\n    background-clip: padding-box;\r\n    z-index: 2;\r\n    box-sizing: border-box;\r\n    text-decoration: none;\r\n    -ms-user-select: none;\r\n    user-select: none;\r\n    float: left;\r\n    min-width: 37px;\r\n    min-height: 38px;\r\n    padding:4px;\r\n    justify-content: center;\r\n    width: 100%;*/\r\n    \r\n    position: relative;\r\n    display: inline-flex;\r\n    align-items: center;\r\n    -ms-user-select: none;\r\n    user-select: none;\r\n    background: transparent;\r\n    white-space: nowrap;\r\n    cursor: default;\r\n    vertical-align: middle;\r\n    padding: 2.5px;\r\n    text-align: center;\r\n    min-width: 30px;\r\n    min-height: 30px;\r\n    line-height: 1;\r\n    font-size: inherit;\r\n    border: 1px solid transparent;\r\n    transition: box-shadow .2s ease-in-out,border .2s ease-in-out;\r\n    -webkit-appearance: none;\r\n    margin: 4.5px 4.5px 4.5px 0;\r\n    justify-content: center; \r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton:hover,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton:hover\r\n{\r\n\tbackground: #e6e6e6;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton:focus,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton:focus\r\n{\r\n\toutline: none;\r\n    border: 1px solid #1f89e5;\r\n    box-shadow: 0 0 0 3px #bcdefb,0 0;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton.nsEditorToolBarItemActive,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton.nsEditorToolBarItemActive\r\n{\r\n\tbackground: #d9d9d9;\r\n    box-shadow: inset 0 2px 2px #bfbfbf;\r\n}\r\n\r\n/*.nsEditor .nsEditorToolBarButton.nsEditorToolBarButtonDropdown,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton.nsEditorToolBarButtonDropdown\r\n{\r\n\tmargin-right: 6px\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton .fa,\r\n.nsEditor .nsEditorToolBarButton svg,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton .fa,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton svg,\r\n{\r\n\tpadding-top:9px;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton:hover,\r\n.nsEditor .nsEditorToolBarButton:focus,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton:hover,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton:focus,\r\n{\r\n\tbackground: #d6d6d6 !important;\r\n    color: #222222 !important\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButton.nsEditorToolBarItemActive,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButton.nsEditorToolBarItemActive\r\n{\r\n\tcolor: #1e88e5;\r\n    background: #d6d6d6;\r\n}*/\r\n\r\n.nsEditor .nsEditorToolBarVerticalSeparator,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarVerticalSeparator\r\n{\r\n\tdisplay: inline-block;\r\n\talign-self: stretch;\r\n    width: 1px;\r\n    min-width: 1px;\r\n    background: #c4c4c4;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarHorizontalSeparator,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarHorizontalSeparator\r\n{\r\n   display: block;\t\r\n\twidth: calc(100% - 8px);\r\n    height: 1px;\r\n    margin: 0 4px;\r\n    vertical-align: top;\r\n    float: none;\r\n    clear: both;\r\n    background: #ebebeb;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarOveflowCon\r\n{\r\n    position: relative;\r\n    font-size: inherit;\r\n    margin: 0px 0px;\r\n    display: inline-block;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarOveflowCon .nse-vertical-dots\r\n{\r\n\tfont-size: 24px;\r\n}\r\n\r\n.nsEditorToolBarOveflowDropdown\r\n{\r\n\tposition: absolute;\r\n\ttop: 100%;\r\n    bottom: auto;\r\n    right: 0;\r\n\tz-index: 1001;\r\n\tbackground: #ffffff;\r\n\tmin-width: 100%;\r\n\t/*for IE */\r\n\twidth: auto;\r\n\twhite-space: nowrap;\r\n\t/*end for IE */\r\n/* \twidth: max-content; */\r\n/* \tmax-width: 60vw; */\r\n    border: 1px solid #c4c4c4;\r\n\tdisplay: none;\r\n}\r\n\r\n.nsEditorToolBarOveflowDropdown.nsEditorToolBarOveflowDropdownVisible\r\n{\r\n\tdisplay: inline-block;\r\n}\r\n\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarOveflowDropdownToolbar\r\n{\r\n\tmoz-user-select: none;\r\n    -webkit-user-select: none;\r\n    -ms-user-select: none;\r\n    user-select: none;\r\n    display: flex;\r\n    flex-flow: row nowrap;\r\n    align-items: center;\r\n    background: #fafafa;\r\n    padding: 0 4px;\r\n    border: 0;\r\n    z-index: 1000;\r\n}\r\n\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarOveflowDropdownToolbar .nsEditorToolBarOveflowDropdownContent\r\n{\r\n\t/*display: flex;\r\n    flex-flow: row wrap;\r\n    align-items: center;\r\n    flex-grow: 1;*/\r\n}\r\n\r\n.nsEditorPresent input:focus, \r\n.nsEditorPresent select:focus, \r\n.nsEditorPresent textarea:focus \r\n{\r\n    border: 1px solid #80bdff;\r\n    outline: 0;\r\n    -webkit-box-shadow: 0 0 0 0.2rem #c7deff;\r\n    box-shadow: 0 0 0 0.2rem #c7deff;\r\n    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;\r\n}\r\n\r\n.nsEditor span,.nsEditorBody span\r\n{\r\n    display: inline;\r\n    vertical-align: baseline;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n\r\n.nsEditor a,.nsEditorBody a\r\n{\r\n   color:#004cff;\r\n   text-decoration:none \r\n}\r\n\r\n.nsEditor span[style~=\"color:\"] a,.nsEditorBody span[style~=\"color:\"] a \r\n{\r\n    color: inherit\r\n}\r\n\r\n.nsEditor a:focus,\r\n.nsEditor a:hover,\r\n.nsEditorBody a:focus,\r\n.nsEditorBody a:hover \r\n{\r\n    cursor: pointer;\r\n    color: #0093ff;\r\n    text-decoration: underline\r\n}\r\n\r\n\r\n.nsEditorPresent .nsEditorPrimaryButton\r\n{\r\n\tdisplay: inline-block;\r\n    margin: 0 0 10px!important;\r\n    font-size: 14px;\r\n    font-weight: 400;\r\n    line-height: 22px;\r\n    text-align: center;\r\n    white-space: nowrap;\r\n    vertical-align: middle;\r\n    -ms-touch-action: manipulation;\r\n    touch-action: manipulation;\r\n    border-radius: 4px;\r\n}\r\n\r\n.nsEditorPresent .nsEditorPrimaryButton \r\n{\r\n    color: #000;\r\n    background-color: #c7deff;\r\n    border: 1px solid #80bdff;\r\n    border-radius: 4px\r\n}\r\n\r\n.nsEditorPresent .nsEditorPrimaryButton:active\r\n{\r\n\tcolor: #fff;\r\n    background-color: #3f9dff;\r\n    border-color: #4592ff;\r\n    -webkit-box-shadow: inset 0 3px 5px #4592ff;\r\n    box-shadow: inset 0 3px 5px #4592ff;\r\n}\r\n\r\n.nsEditorPresent .nsEditorPrimaryButton:focus,\r\n.nsEditorPresent .nsEditorPrimaryButton:hover\r\n{\r\n\tcolor: #000;\r\n    background-color: #80bdff;\r\n    border-color: #3f9dff;\r\n    outline: 0 none;\r\n}\r\n\r\n.nsEditor.nsEditorSticky .nsEditorToolBarContainer\r\n{\r\n\tposition: fixed;\r\n    top: 0;\r\n    border: 1px solid #c0c0c0;\r\n    border-left: 0;\r\n    border-bottom: solid #888 1px;\r\n}\r\n\r\n.nsEditorStickyToolbar\r\n{\r\n\tdisplay: none\r\n}\r\n\r\n.nsEditor.nsEditorSticky .nsEditorStickyToolbar\r\n{\r\n\tdisplay: block;\r\n}\r\n\r\n/*.nsEditor .nsEditorToolBarButtonDropdown::after\r\n{\t\r\n\tposition: absolute;\r\n    width: 0;\r\n    height: 0;\r\n    border-left: 4px solid transparent;\r\n    border-right: 4px solid transparent;\r\n    border-top: 4px solid #222222;\r\n    right: 2px;\r\n    top: 17px;\r\n    content: \"\";\r\n}*/\r\n\r\n.nsEditor .fa,\r\n.nsEditor .nsEditorIcon,\r\n.nsEditorToolBarOveflowDropdown .fa,\r\n.nsEditorToolBarOveflowDropdown .nsEditorIcon\r\n{\r\n\tcolor: inherit;\r\n    cursor: inherit;\r\n    width: 20px;\r\n    height: 20px;\r\n    font-size: 14px;\r\n    vertical-align: middle;\r\n}\r\n\r\n.nsEditor .nsEditorIcon.nsEditorIconArrow,\r\n.nsEditorToolBarOveflowDropdown .nsEditorIcon.nsEditorIconArrow\r\n{\r\n    margin-left: 0px;\r\n\twidth: 10px;\r\n\tpointer-events: none;\r\n    z-index: 1;\r\n}\r\n\r\n.nsEditor .nsEditorToolBarButtonDisabled,\r\n.nsEditorToolBarOveflowDropdown .nsEditorToolBarButtonDisabled\r\n{\r\n\topacity: 0.5;\r\n    filter: alpha(opacity=50);\r\n    border: 0px none transparent;\r\n    cursor: auto;\r\n    pointer-events: none;\r\n}\r\n\r\n.nsEditorToolBarDropdown\r\n{\r\n\tdisplay: none;\r\n    position: absolute;\r\n    overflow: auto;\r\n    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);\r\n    z-index: 4;\r\n    list-style-type: none;\r\n    margin: 0;\r\n    padding: 0;\r\n    background: #fff;\r\n}\r\n\r\n.nsEditorToolBarDropdown .nsEditorToolBarDropdownItem\r\n{\r\n\tcolor: inherit;\r\n    padding: 4px 24px;\r\n    text-decoration: none;\r\n    display: block;\r\n    font-size: 15px;\r\n    cursor: pointer;\r\n    white-space: nowrap;\r\n}\r\n\r\n.nsEditorToolBarDropdown .nsEditorToolBarDropdownItem:hover\r\n{\r\n\tbackground-color: #ddd\r\n}\r\n\r\n.nsEditorToolBarDropdown.nsEditorToolBarDropdownShow\r\n{\r\n\tdisplay:block;\r\n}\r\n\r\n.nsEditor .nsEditorTabContainer\r\n{\r\n\twidth: 100%;\r\n\tpadding: 0;\r\n\tbackground-color: #CCC9A8;\r\n    border-top: 1px solid #888;\r\n    text-align: left;\r\n    margin: 0;\r\n    overflow:hidden;\r\n}\r\n.nsEditor .nsEditorBodyContainer\r\n{\r\n    position: relative;\r\n    clear: both;\r\n    overflow: auto;\r\n    border-top: solid #888 1px;\r\n    border-bottom: solid #888 1px;\r\n    /*display: flex;\r\n    flex-direction: column;*/\r\n    height: auto;\r\n    /*height: calc(100% - 60px);/* to show footer */\r\n}\r\n\r\n.nsEditor .nsEditorFooterContainer\r\n{\r\n\tposition: relative;\r\n\twidth: 100%;\r\n    margin: 0;\r\n    padding: 0;\r\n    background-color: #ECE9D8;\r\n    text-align: center;\r\n    border-top: 1px solid #d1d1d1;\r\n    background: #f8f8f8;\r\n    overflow:hidden;\r\n}\r\n\r\n.nsEditor .nsEditorFooterContainer .nsEditorFooterLeftContainer\r\n{\r\n\tfloat: left;\r\n    outline: none;\r\n}\r\n\r\n.nsEditor .nsEditorFooterContainer .nsEditorFooterRightContainer\r\n{\r\n\tfloat: right;\r\n\toutline: none;\r\n\tmargin-right: 10px;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaContainer \r\n{\r\n\tposition: relative;\r\n\tfloat: left;\r\n\tpadding: 0px;\r\n\tmargin: 0px;\r\n\theight: 100%;\r\n\twidth: calc(100% - 1px);\r\n\toverflow-x: auto;\r\n}\r\n\r\n.nsEditor.nsEditorWithLineNumber .nsEditorTextAreaContainer \r\n{\r\n\twidth: calc(100% - 56px);/*(width of line number div + margin right of line number div + 1)*/\r\n}\r\n\r\n.nsEditor.nsEditorWithLineNumber .nsEditorTextAreaGeneric *,\r\n.nsEditorBody.nsEditorBodyWithLineNumber *\r\n{\r\n\tfont-size: 12px;\r\n}\r\n\r\n.nsEditor.nsEditorWithLineNumber .nsEditorTextAreaGeneric .nsEditorLineElement\r\n{\r\n\tmargin:0;\r\n\tfont-size: 12px;\r\n}\r\n\r\n.nsEditor.nsEditorWithLineNumber .nsEditorTextArea .nsEditorLineElement, .nsEditorOuterContainer .nsEditorLineNumberWrapper .nsEditorLineNumber \r\n{\r\n\tfont-family: monospace;\r\n\tline-height: 15px !important;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaContainer .nsEditorTextArea \r\n{\r\n\tposition: relative;\r\n\tpadding: 5px;\r\n\tborder: 0;\r\n}\r\n\r\n.nsEditor.nsEditorWithLineNumber .nsEditorTextAreaContainer .nsEditorTextArea\r\n{\r\n\theight:97%;\r\n\tpadding:0px;\r\n\tpadding-top:5px;\r\n\tpadding-right:5px;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaContainer .nsEditorTextArea:focus\r\n{\r\n\toutline: none;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaGeneric .nsEditorLineElement\r\n{\r\n\tmargin: 0 0 10px;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaContainer .nsEditorTextArea:empty:not(:focus):before \r\n{\r\n  content: attr(data-placeholder);\r\n}\r\n\r\n.nsEditor .nsEditorLineNumberContainer \r\n{\r\n\theight:100%;\r\n\twidth: 50px;\r\n\tmargin-top: 0px;\r\n\tfloat: left;\r\n\toverflow: hidden;\r\n\tborder-right: 1px solid #c0c0c0;\r\n\tmargin-right: 5px;\r\n}\r\n\r\n.nsEditor .nsEditorLineNumberWrapper \r\n{\r\n\tpadding-top: 5px;\r\n\tbackground: #f0f0f0;\r\n    color: #333;\r\n}\r\n\r\n.nsEditor .nsEditorLineNumberWrapper .nsEditorLineNumber \r\n{\r\n\tpadding-right: 8px;\r\n\tpadding-top: 0px;\r\n\ttext-align: right;\r\n\twhite-space: nowrap;\r\n\tfont-size: 12px;\r\n}\r\n\r\n.nsEditor .nsEditorComponentHidden\r\n{\r\n\tdisplay: none !important;\r\n}\r\n\r\n.nsEditor .nsEditorLineNumberWrapper .nsEditorLineNumberSelected \r\n{\r\n\tcolor: red;\r\n}\r\n\r\n.nsEditor .nsEditorTextAreaContainer .nsEditorTextAreaIFrame\r\n{\r\n\twidth: 100%;\r\n\theight: 100%;\r\n    position: relative;\r\n    display: block;\r\n    /*z-index: 2;  (inlinePopUp has issue with z-index) */\r\n    box-sizing: border-box;\r\n    border-width: initial;\r\n    border-style: none;\r\n    border-color: initial;\r\n    border-image: initial;\r\n}\r\n\r\n.nsEditor .nsEditorSourceTextArea\r\n{\r\n\twidth: 100%;\r\n    height: 100%;\r\n\tfont-family: 'Courier New', Monospace;\r\n    font-size: small;\r\n    background-color: #fff;\r\n    white-space: pre-wrap;\r\n    border: none;\r\n    padding: 0;\r\n    margin: 0;\r\n    display: block;\r\n    resize: none;\r\n}\r\n\r\n.nsEditor .nsEditorPlaceholder\r\n{\r\n\tposition: absolute;\r\n    font-size: 16px;\r\n    color: #aaaaaa;\r\n    z-index: 1;\r\n    display: none;\r\n    top: 0;\r\n    left: 0;\r\n    right: 0;\r\n    overflow: hidden;\r\n    line-height: normal;\r\n    text-align: left;\r\n    pointer-events: none;\r\n}\r\n\r\n.nsEditor .nsEditorPlaceholderShow\r\n{\r\n\tdisplay: block;\r\n}\r\n\r\n.nsEditor .nsEditorMediaContainerContainer\r\n{\r\n\tdisplay: block;\r\n    padding: 1px;\r\n    margin: 0 0 10px;\r\n    outline: 1px dashed #e1e1e1;\r\n}\r\n\r\n.nsEditor .nsEditorMediaContainerContainer .nsEditorMediaContainer\r\n{\r\n\tdisplay: block;\r\n    outline: none;\r\n    margin: 0;\r\n    padding: 0;\r\n}\r\n\r\n.nsEditor .nsEditorMediaContainer .nsEditorMediaCaption\r\n{\r\n\tdisplay: block;\r\n    z-index: 2;\r\n\tpadding: 1em .5em;\r\n    margin: 0;\r\n    background-color: #f9f9f9;\r\n    outline: none;\r\n}\r\n\r\n.nsEditor audio, \r\n.nsEditor .nsEditorMediaCaption, \r\n.nsEditor .nsEditorMediaContainer, \r\n.nsEditor img,\r\n.nsEditor video \r\n{\r\n    position: relative;\r\n}\r\n\r\n\r\n\r\n.nsEditorFixedComp\r\n{\r\n\tposition: fixed; \r\n\tleft: 0px; \r\n\ttop: 0px; \r\n\twidth: 0px; \r\n\theight: 0px;\r\n/* \tParent should also have more z-index  */\r\n\tz-index:1000;\r\n}\r\n\r\n.nsEditorPageBreak\r\n{\r\n\tclear: both !important;\r\n    width: 100% !important;\r\n    border-top: #999 1px dotted !important;\r\n    border-bottom: #999 1px dotted !important;\r\n    padding: 0 !important;\r\n    height: 7px !important;\r\n    cursor: default !important;\r\n}\r\n\r\n.nsEditorTextAreaHidden\r\n{\r\n\tdisplay: none !important;\r\n}\r\n\r\n.nsEditorHidden\r\n{\r\n\tposition:absolute;\r\n\tright: 999px;\r\n    top:999px;\r\n}\r\n\r\n.nsEditorPrint\r\n{\r\n\tposition:fixed;\r\n\tleft: -9999px;\r\n    top:0px;\r\n    height: 100%;\r\n    width: 0px;\r\n    overflow: hidden;\r\n    z-index:100000000;\r\n    tabIndex: -1;\r\n}\r\n\r\n/*******Prompt CSS *************/\r\n.nsEditorPromptOvelay {\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    right: 0;\r\n    bottom: 0;\r\n    background-color: rgba(0, 0, 0, 0.50);\r\n    z-index: 999999\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt {\r\n\tposition: relative;\r\n    margin-top: 0;\r\n    margin-bottom: 0;\r\n    margin-left: auto;\r\n    margin-right: auto;\r\n    top: 20%;\r\n    left: 3%;\r\n    background-color: #fff;\r\n    box-shadow: 0 0 20px rgba(0,0,0,.2);\r\n    border-radius: 3px;\r\n    overflow: hidden;\r\n    line-height: 1.2;\r\n}\r\n@media (min-width: 768px) and (max-width: 991px) {\r\n  .nsEditorPromptOvelay .nsEditorPrompt {\r\n    margin: 30px auto;\r\n    width: 70%;\r\n  }\r\n}\r\n@media (min-width: 992px) {\r\n  .nsEditorPromptOvelay .nsEditorPrompt {\r\n    margin: 50px auto;\r\n    width: 600px;\r\n  }\r\n}\r\n\r\n.nsEditorPromptOvelay .nsEditorPrompt header {\r\n    padding: 10px 8px;\r\n    background-color: #f6f7f9;\r\n    border-bottom: 1px solid #e5e5e5;\r\n    min-height: 20px;\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt header h3 {\r\n    font-size: 18px;\r\n    font-weight: 400;\r\n    line-height: 18px;\r\n    margin: 0;\r\n    color: #555;\r\n    display: inline-block;\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt header .fa-close {\r\n    float: right;\r\n    color: #c4c5c7;\r\n    cursor: pointer;\r\n    transition: all .5s ease;\r\n    padding: 0 2px;\r\n    border-radius: 1px    \r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt header .fa-close:hover {\r\n    color: #b9b9b9\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt header .fa-close:active {\r\n    box-shadow: 0 0 5px #673AB7;\r\n    color: #a2a2a2\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt .nsEditorPromptBody {\r\n    padding: 12px 10px;\r\n    overflow-y: auto;\r\n  \tmin-height: 80px;\r\n  \t\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt .nsEditorPromptBody p{\r\n    margin: 0;\r\n    font-size: 17px;\r\n    color: #333\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt footer {\r\n    border-top: 1px solid #e5e5e5;\r\n    padding: 8px 10px\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt footer .controls {\r\n    direction: rtl\r\n}\r\n.nsEditorPromptOvelay .nsEditorPrompt footer .controls .button {\r\n    padding: 5px 15px;\r\n    border-radius: 3px\r\n}\r\n.nsEditorPromptOvelay .nsEditorPromptButton {\r\n  cursor: pointer;\r\n  height: 36px;\r\n  padding: 10px;\r\n  font-size: 16px;\r\n}\r\n.nsEditorPromptOvelay .nsEditorPromptButtonDefault {\r\n    background-color: rgb(248, 248, 248);\r\n    border: 1px solid rgba(204, 204, 204, 0.5);\r\n    color: #5D5D5D;\r\n}\r\n.nsEditorPromptOvelay .nsEditorPromptButtonDanger {\r\n    background-color: #f44336;\r\n    border: 1px solid #d32f2f;\r\n    color: #f5f5f5\r\n}\r\n\r\n/*********End of Prompt CSS *********/.nsTablePicker\r\n{\r\n\t\r\n}\r\n\r\n.nsTablePicker .nsTablePickerTblCon\r\n{\r\n\tmin-width: 100px;\r\n    min-height: 100px;\r\n    display: table;\r\n    box-sizing: border-box;\r\n    border-collapse: collapse;\r\n}\r\n\r\n.nsTablePicker .nsTablePickerTblCon .nsTablePickerTbl\r\n{\r\n\t\r\n}\r\n\r\n.nsTablePicker .nsTableRowContainer\r\n{\r\n\twidth: 100%;\r\n/*     min-height: 25px; */\r\n    display: table-row;\r\n    vertical-align: top;\r\n    box-sizing: inherit;\r\n}\r\n\r\n.nsTablePicker .nsTableRowContainer .nsTableRow\r\n{\r\n\twidth: auto;\r\n    height: auto;\r\n    box-sizing: border-box;\r\n    display: flex;\r\n}\r\n\r\n.nsTablePicker .nsTableCellContainer\r\n{\r\n/* \twidth: 25px; */\r\n/*     height: 25px; */\r\n    box-sizing: inherit;\r\n    display: table-cell;\r\n    vertical-align: top;\r\n    word-break: break-all;\r\n    cursor: pointer;\r\n    padding: 1px;\r\n}\r\n\r\n.nsTablePicker .nsTableCellContainer .nsTableCell\r\n{\r\n\twidth: 100%;\r\n    height: 100%;\r\n    box-sizing: border-box;\r\n}\r\n\r\n.nsTablePicker .nsTablePickerLblCon\r\n{\r\n\twidth:100%;\r\n\theight:23px;\r\n}\r\n\r\n.nsTablePicker .nsTablePickerLblCon .nsTablePickerLbl\r\n{\r\n\theight: 100%;\r\n\ttext-align: center;\r\n\twhite-space: nowrap;\r\n    cursor: auto;\r\n    float: none;\r\n    font-family: Helvetica,Arial,Tahoma,Verdana,Sans-Serif; \r\n    font-size: 12px; \r\n    font-style: normal; \r\n    margin-top: 5px;\r\n}\r\n\r\n.nsTablePickerWhite\r\n{\r\n\tborder: 1px solid rgb(217, 217, 217);\r\n    border-radius: 5px;\r\n    background: rgb(255, 255, 255);\r\n}\r\n\r\n.nsTablePickerWhite .nsTablePickerTblCon\r\n{\r\n\tbackground-color: rgb(255, 255, 255);\r\n    padding: 5px 5px 0;\r\n    display: inline-block;\r\n}\r\n\r\n.nsTablePickerWhite .nsTableCellContainer .nsTableCell\r\n{\r\n\tborder: 1px solid rgb(204, 204, 204);\r\n}\r\n\r\n.nsTablePickerWhite .nsTableCellContainer .nsTableCellSelected\r\n{\r\n\tbackground-color: rgb(221, 238, 255);\r\n}\r\n\r\n.nsTablePickerWhite .nsTableCellContainer .nsTableCellActive\r\n{\r\n\tbackground-color: rgb(221, 238, 255);\r\n}\r\n\r\n.nsTablePickerWhite .nsTablePickerLblCon .nsTablePickerLbl\r\n{\r\n\tcolor: #000000;\r\n}\r\n\r\n.nsTablePickerBlack\r\n{\r\n\tborder: 1px solid rgb(217, 217, 217);\r\n    border-radius: 5px;\r\n    background-color: rgb(56, 62, 76);\r\n}\r\n\r\n.nsTablePickerBlack .nsTablePickerTblCon\r\n{\r\n\tbackground-color: rgb(56, 62, 76);\r\n    padding: 5px;\r\n    display: inline-block;\r\n}\r\n\r\n.nsTablePickerBlack .nsTableCellContainer .nsTableCell\r\n{\r\n\tborder: 1px solid rgb(170, 170, 170);\r\n}\r\n\r\n.nsTablePickerBlack .nsTableCellContainer .nsTableCellSelected\r\n{\r\n\tbackground-color: rgb(170, 170, 170);\r\n}\r\n\r\n.nsTablePickerBlack .nsTableCellContainer .nsTableCellActive\r\n{\r\n\tbackground-color: rgb(238, 238, 238);\r\n}\r\n\r\n.nsTablePickerBlack .nsTablePickerLblCon .nsTablePickerLbl\r\n{\r\n\tcolor: #FFFFFF;\r\n}.nsEditorModal \r\n{\r\n    z-index: 2000;\r\n    position: absolute;\r\n}\r\n\r\n.nsEditorModal * \r\n{\r\n    box-sizing: border-box;\r\n    -webkit-user-drag: none;\r\n    overflow: visible;\r\n}\r\n\r\n.nsEditorModal div\r\n{\r\n    width:auto;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalContainerFullScreen\r\n{\r\n    margin-right: 0;\r\n    margin-bottom: 0;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalBody \r\n{\r\n    position: relative;\r\n    padding: 2px;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalContainerFullScreen .nsEditorModalBody \r\n{\r\n    padding: 0;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalShadow \r\n{\r\n    position: absolute;\r\n    z-index: -1;\r\n    left: 0;\r\n    top: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    background-color: #ffffff;\r\n    border: 1px solid #ccc;\r\n    border: 1px solid rgba(0, 0, 0, 0.2);\r\n    *border-right-width: 2px;\r\n    *border-bottom-width: 2px;\r\n    -webkit-border-radius: 6px;\r\n    -moz-border-radius: 6px;\r\n    border-radius: 6px;\r\n    -webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\r\n    -moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\r\n    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\r\n    -webkit-background-clip: padding-box;\r\n    -moz-background-clip: padding;\r\n    background-clip: padding-box;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalTitlebar\r\n{\r\n    height: 26px;\r\n    border-bottom: 1px solid #e5e5e5;\r\n    background-color: #fff;\r\n    position: relative;\r\n    cursor: move;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalDragHandle \r\n{\r\n    height: 26px;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalCaption \r\n{\r\n\tfloat: left;\r\n    font-weight: bold;\r\n    font-size: 12px;\r\n    line-height: 26px;\r\n    padding-left: 5px;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalCloseButtonContainer \r\n{\r\n    position: absolute !important;\r\n    right: 5px;\r\n    top: 3px;\r\n    border: none;\r\n    padding: 0;\r\n    margin: 0;\r\n    overflow: hidden;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalButton \r\n{\r\n    width: 34px;\r\n    height: 34px;\r\n    border: 0;\r\n    border-radius: 4px;\r\n    margin: 1px!important;\r\n    padding: 0;\r\n    font-size: 12px;\r\n    line-height: 27px\r\n}\r\n\r\n.nsEditorModal .nsEditorModalButton:enabled:active\r\n{\r\n\tbackground-color: #d1d1d1;\r\n    border-color: #c1c1c1;\r\n    -webkit-box-shadow: inset 0 3px 5px #c1c1c1;\r\n    box-shadow: inset 0 3px 5px #c1c1c1;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalButton:enabled:focus,\r\n.nsEditorModal .nsEditorModalButton:enabled:hover\r\n{\r\n\tbackground-color: #e1e1e1;\r\n    border-color: #d1d1d1;\r\n    outline: 0 none;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalCloseButton \r\n{\r\n\twidth: 20px;\r\n    height: 20px;\r\n    float: right;\r\n    font-weight: 700;\r\n    text-shadow: 0 1px 0 #fff;\r\n    -webkit-appearance: none;\r\n    filter: alpha(opacity=100);\r\n    opacity: 1;\r\n    font-size: 14px;\r\n    line-height: 1.5;\r\n    color: #111;\r\n}\r\n\r\n.nsEditorModal button * \r\n{\r\n    pointer-events: none;\r\n    backface-visibility: hidden;\r\n    -webkit-backface-visibility: hidden;\r\n    -moz-backface-visibility: hidden\r\n}\r\n\r\n.nsEditorModal button>svg \r\n{\r\n    width: 16px;\r\n    height: 16px;\r\n    margin: auto;\r\n    fill: currentColor;\r\n    display: block;\r\n    text-align: center;\r\n    float: none;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalCloseButton>svg \r\n{\r\n    width: 10px;\r\n    height: 10px;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalContentContainer \r\n{\r\n    position: relative;\r\n}\r\n\r\n.nsEditorModal .nsEditorModalContentMask \r\n{\r\n\tposition: absolute;\r\n    width: 100%;\r\n    height: 100%;\r\n    cursor: move;\r\n    visibility: hidden;\r\n    display: block;\r\n    opacity: 0;\r\n    filter: alpha(opacity = 0);\r\n}\r\n\r\n.nsEditorModal .nsEditorModalFooter\r\n{\r\n\tbackground-color: white;\r\n    height: 40px;\r\n    border-top: 1px solid #e5e5e5;\r\n}\r\n\r\n.nsEditorModalMask \r\n{\r\n\tposition: absolute;\r\n    opacity: 0.3;\r\n    filter: alpha(opacity = 30);\r\n    background-color: #ccc;\r\n}\r\n\r\n.nsEditorModalDragMask \r\n{\r\n    position: absolute;\r\n    background-color: transparent;\r\n    cursor: move;\r\n}.nsEditorInlinePopup\r\n{\r\n\tposition: absolute;\r\n\twidth: auto;\r\n    overflow: visible;\r\n    z-index: 6;\r\n    border: 1px solid rgba(0,0,0,.25);\r\n    border-radius: 4px;\r\n    text-align: start;\r\n    text-decoration: none;\r\n    text-shadow: none;\r\n    text-transform: none;\r\n    letter-spacing: normal;\r\n    word-break: normal;\r\n    word-spacing: normal;\r\n    word-wrap: normal;\r\n    white-space: normal;\r\n    background-color: #fff;\r\n    -webkit-background-clip: padding-box;\r\n    background-clip: padding-box;\r\n    -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2);\r\n    box-shadow: 0 5px 10px rgba(0,0,0,.2);\r\n    line-break: auto;\r\n    padding: 0;\r\n    font-size: 14px;\r\n    font-style: normal;\r\n    font-weight: bold;\r\n    line-height: 22px;\r\n    -webkit-font-smoothing: antialiased; \r\n    -moz-osx-font-smoothing: grayscale;    \r\n}\r\n\r\n.nsEditorInlinePopup.nsEditorInlinePopupHide\r\n{\r\n\tdisplay: none;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupArrow,\r\n.nsEditorInlinePopup .nsEditorInlinePopupArrow:after \r\n{\r\n    position: absolute;\r\n    display: block;\r\n    width: 0;\r\n    height: 0;\r\n    border: 11px solid transparent;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupArrow.nsEditorInlinePopupArrowUp \r\n{\r\n    top: -11px;\r\n    left: 0px;\r\n    margin-left: 0px;\r\n    border-top-width: 0;\r\n    border-bottom-color: rgba(0,0,0,.25);\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupArrow.nsEditorInlinePopupArrowUp:after \r\n{\r\n    top: 1px;\r\n    margin-left: -11px;\r\n    content: \" \";\r\n    border-top-width: 0;\r\n    border-bottom-color: #fff;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupContentContainer\r\n{\r\n\tdisplay: block;\r\n\tpadding: 5px;\r\n\twhite-space: nowrap;\r\n    line-height: 0;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupContentContainer .nsEditorInlinePopupButton\r\n{\r\n\tposition: relative;\r\n\tdisplay: inline-block;\r\n\tbackground: transparent;\r\n    color: #333;\r\n    -moz-outline: 0;\r\n    outline: none;\r\n    border: 0;\r\n    line-height: 1;\r\n    cursor: pointer;\r\n    text-align: left;\r\n    margin: 4px 8px;\r\n    padding: 0;\r\n    transition: all 0.5s;\r\n    -webkit-transition: all 0.5s;\r\n    -moz-transition: all 0.5s;\r\n    -ms-transition: all 0.5s;\r\n    -o-transition: all 0.5s;\r\n    border-radius: 4px;\r\n    -moz-border-radius: 4px;\r\n    -webkit-border-radius: 4px;\r\n    -moz-background-clip: padding;\r\n    -webkit-background-clip: padding-box;\r\n    background-clip: padding-box;\r\n    z-index: 2;\r\n    -webkit-box-sizing: border-box;\r\n    -moz-box-sizing: border-box;\r\n    box-sizing: border-box;\r\n    text-decoration: none;\r\n    user-select: none;\r\n    -o-user-select: none;\r\n    -moz-user-select: none;\r\n    -khtml-user-select: none;\r\n    -webkit-user-select: none;\r\n    -ms-user-select: none;\r\n    height: 40px;\r\n    text-transform: none;\r\n    overflow: visible;\r\n    font-family: inherit;\r\n    font-size: inherit;\r\n    float: none;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton.nsEditorInlinePopupButtonActive\r\n{\r\n\tbackground: #d6d6d6;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdownContainer\r\n{\r\n\tdisplay: inline-block;\r\n    position: relative;\r\n    font-size: inherit;\r\n    margin-right: 5px;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton.nsEditorInlinePopupButtonDropdown:after\r\n{\r\n\tposition: absolute;\r\n    width: 0;\r\n    height: 0;\r\n    border-left: 4px solid transparent;\r\n    border-right: 4px solid transparent;\r\n    border-top: 4px solid #333;\r\n    right: 2px;\r\n    top: 14px;\r\n    -webkit-transition: all 0.3s;\r\n    -moz-transition: all 0.3s;\r\n    -ms-transition: all 0.3s;\r\n    -o-transition: all 0.3s;\r\n    content: \"\";\r\n}\r\n\r\n/*https://stackoverflow.com/questions/20541306/how-to-write-a-css-hack-for-ie-11*/\r\n@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) \r\n{\r\n   .nsEditorInlinePopup .nsEditorInlinePopupButton.nsEditorInlinePopupButtonDropdown:after\r\n\t{\r\n\t\ttop: 18px;\r\n\t}\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton.nsEditorInlinePopupButtonDropdown.nsEditorInlinePopupButtonOpen:after\r\n{\r\n\tborder-top-color: #333;\r\n\tborder-top: 0;\r\n    border-bottom: 4px solid #222;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupContentContainer .nsEditorInlinePopupButton:active\r\n{\r\n\tcolor: #333;\r\n\tbackground: #d6d6d6;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupContentContainer .nsEditorInlinePopupButton:hover\r\n{\r\n\tbackground: #ebebeb;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton i\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton .fa\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton .fas\r\n{\r\n\tfont-family: \"Font Awesome 5 Free\";\r\n    font-weight: 900;\r\n    -webkit-font-smoothing: antialiased;\r\n    display: inline-block;\r\n    font-style: normal;\r\n    font-variant: normal;\r\n    text-rendering: auto;\r\n    line-height: 1;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton i,\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton svg\r\n{\r\n\tdisplay: block;\r\n    text-align: center;\r\n    float: none;\r\n    margin: 8px 7px;\r\n    width: 24px;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton .nsEditorInlinePopupButtonTooltip\r\n{\r\n\tposition: absolute;\r\n\tleft: 50%;\r\n    top: 0;\r\n    bottom: -5px;\r\n    pointer-events: none;\r\n    visibility: hidden;\r\n    opacity: 0;\r\n    display: block;\r\n    z-index: 1000;\r\n    transform: translateY(100%);\r\n    transition: opacity .2s ease-in-out .2s;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton:hover .nsEditorInlinePopupButtonTooltip \r\n{\r\n    visibility: visible;\r\n    opacity: 1;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButton .nsEditorInlinePopupButtonTooltip .nsEditorInlinePopupButtonTooltipText\r\n{\r\n\tposition: relative;\r\n\tdisplay: inline-block;\r\n\tleft: -50%;\r\n\tborder-collapse: collapse;\r\n\ttext-align: left;\r\n    white-space: nowrap;\r\n    cursor: auto;\r\n    float: none;\r\n    font-size: .9em;\r\n    line-height: 1.5;\r\n    color: #fff;\r\n    padding: 5px 8px;\r\n    background: #333;\r\n    border-radius: 2px;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonTooltipText:after\r\n{\r\n\tposition: absolute;\r\n\twidth: 0;\r\n    height: 0;\r\n\tleft: 50%;\r\n    top: -4px;\r\n    pointer-events: none;\r\n    /* causes submenu to change its position */\r\n    /*content: \"\";*/\r\n    transition: opacity .2s ease-in-out .2s;\r\n    border-style: solid;\r\n    transform: translateX(-50%);\r\n    border-left-color: transparent;\r\n    border-bottom-color: #333;\r\n    border-right-color: transparent;\r\n    border-top-color: transparent;\r\n    border-left-width: 5px;\r\n    border-bottom-width: 5px;\r\n    border-right-width: 5px;\r\n    border-top-width: 0;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupDropdownContainer\r\n{\r\n\tposition: absolute;\r\n\ttop: 100%;\r\n    bottom: auto;\r\n    left: 0;\r\n\tz-index: 1000;\r\n\tborder-radius: 2;\r\n\tborder-top-left-radius: 0;\r\n\tmin-width: 100%;\r\n\t/*box-shadow:0 1px 2px 1px,0 0;*/\r\n\tbackground: #ffffff;\r\n\tborder: 1px solid #c4c4c4;\r\n\tdisplay: none;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdownContainer .nsEditorInlinePopupDropdownContainer.nsEditorInlinePopupDropdownContainerVisible\r\n{\r\n\tdisplay: inline-block;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdown\r\n{\r\n\tdisplay: flex;\r\n    flex-direction: column;\r\n    list-style-type: none;\r\n\tmoz-user-select: none;\r\n    -webkit-user-select: none;\r\n    -ms-user-select: none;\r\n    user-select: none;\r\n    background: #fff;\r\n    border-radius:2px;\r\n    border-top-left-radius: 0;\r\n    margin-bottom: 0px;\r\n    margin-top: 0px;\r\n    padding-left:0px;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdownItem\r\n{\r\n\tdisplay: block;\r\n\tcursor: default;\r\n\tmin-width: 160px;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdownItem:hover\r\n{\r\n\tbackground: #ebebeb;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupButtonDropdownItem .nsEditorInlinePopupButtonDropdownItemContent\r\n{\r\n\tpadding: 0 20px;\r\n    line-height: 200%;\r\n    display: block;\r\n    cursor: pointer;\r\n    white-space: nowrap;\r\n    color: inherit;\r\n    text-decoration: none;\r\n    border-radius: 0;\r\n    -moz-border-radius: 0;\r\n    -webkit-border-radius: 0;\r\n    -moz-background-clip: padding;\r\n    -webkit-background-clip: padding-box;\r\n    background-clip: padding-box;\r\n}\r\n\r\n.nsEditorInlinePopup .nsEditorInlinePopupHorizontalSeparator \r\n{\r\n\tdisplay: block;\t\r\n\twidth: calc(100% - 8px);\r\n    height: 1px;\r\n    margin: 0 4px;\r\n    vertical-align: top;\r\n    float: none;\r\n    clear: both;\r\n    background: #ebebeb;\r\n}\r\n\t.nsEditorFullScreenParent \r\n{\r\n/*     z-index: 100000!important; */\r\n    position: static!important;\r\n    overflow: visible!important\r\n}\r\n\r\nhtml.nsEditorFullScreenParent,body.nsEditorFullScreenParent \r\n{\r\n    height: 0!important;\r\n    width: 0!important;\r\n    overflow: initial!important\r\n}\r\n\r\nhtml.nsEditorFullScreenParent \r\n{\r\n    position: fixed!important\r\n}\r\n\r\n.nsEditorFullScreen \r\n{\r\n    position: absolute;\r\n    top: 0;\r\n    left: 0;\r\n    right: 0;\r\n    bottom: 0;\r\n    z-index: 1000;\r\n    max-width: none!important\r\n}\r\n.nsEditorFullScreen .nsEditorToolBarContainer,.nsEditorFullScreen .nsEditorTabContainer \r\n{\r\n    width: 100%!important\r\n}.nsEditor .nsEditorResizer\r\n{\r\n\tposition: absolute;\r\n\tright:0px;\r\n\twidth: 0;\r\n    height: 0;\r\n    overflow: hidden;\r\n    border-width: 10px 10px 0 0;\r\n    border-color: transparent #bcbcbc transparent transparent;\r\n    border-style: dashed solid dashed dashed;\r\n    font-size: 0;\r\n    vertical-align: bottom;\r\n    margin-top: 6px;\r\n    margin-bottom: 4px;\r\n    cursor: se-resize;\r\n    margin-right: 3px;\r\n}.nsEditorLinkModalContent\r\n{\r\n    width: 500px !important;\r\n    height: 200px;\r\n    max-width: 500px;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentContainer\r\n{\r\n\tposition: relative;\r\n    padding: 15px;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentForm\r\n{\r\n\tmargin-bottom: 10px;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentFormLabel\r\n{\r\n\tdisplay: inline-block;\r\n    max-width: 100%;\r\n    margin-bottom: 5px;\r\n    font-weight: 700;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentFormTextBox\r\n{\r\n\tdisplay: block;\r\n    width: 100%;\r\n    height: 34px;\r\n    font-size: 14px;\r\n    line-height: 22px;\r\n    padding: 0 4px;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentFormLast\r\n{\r\n\tmargin-top: 10px;\r\n    margin-bottom: 0;\r\n}\r\n\r\n.nsEditorLinkModalContent .nsEditorLinkModalContentFormCheckbox\r\n{\r\n\tmargin-left: 0;\r\n    margin-right: 4px;\r\n}\r\n\r\n.nsEditorLinkFooterContainer\r\n{\r\n\tpadding: 10px 15px 0;\r\n    text-align: right;\r\n}.nsEditor .nsEditorTextArea table,.nsEditorBody table\r\n{\r\n    border-collapse: collapse;\r\n    margin-bottom: 10px;\r\n    width:100%;\r\n}\r\n\r\n.nsEditor .nsEditorTextArea table tr,.nsEditorBody table tr \r\n{\r\n    user-select: none;\r\n}\r\n\r\n.nsEditor .nsEditorTextArea table tr td,\r\n.nsEditor .nsEditorTextArea table tr th,\r\n.nsEditorBody table tr td,\r\n.nsEditorBody table tr th\r\n{\r\n    border: 1px solid #ddd;\r\n    vertical-align: middle;\r\n    user-select: text;\r\n    padding: 5px 10px;\r\n}\r\n\r\n.nsEditor .nsEditorTextArea table .nsEditorHiddenRow,\r\n.nsEditorBody table .nsEditorHiddenRow\r\n{\r\n\theight: 0px;\r\n    overflow: hidden;\r\n    line-height: 0;\r\n}\r\n\r\n.nsEditor .nsEditorTextArea table .nsEditorHiddenRow td,\r\n.nsEditorBody table .nsEditorHiddenRow td\r\n{\r\n\theight: 0;\r\n    padding: 0;\r\n    border-top: 0;\r\n    overflow: hidden;\r\n    line-height: 0;\r\n}.nsEditor .nsEditorFooterContainer .nsEditorWordsContainer,\r\n.nsEditor .nsEditorFooterContainer .nsEditorCharsContainer\r\n{\r\n\tpadding: 10px;\r\n\tcolor: #999999;\r\n\tfont-size: 14px;\r\n    font-family: sans-serif;\r\n}\r\n.nsEditor .nsEditorFooterContainer .nsEditorElementPathContainer\r\n{\r\n\tmargin-left: 5px;\r\n\tcolor: #999999;\r\n\tfont-size: 12px;\r\n    font-family: sans-serif;\r\n    white-space: nowrap;\r\n}\r\n.nsEditor .nsEditorFooterContainer .nsEditorElementPathContainer .nsEditorElementPath\r\n{\r\n\tposition: relative;\r\n    margin: 0;\r\n    padding: 0;\r\n    list-style: none;\r\n    display: -ms-flexbox;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: flex-start;\r\n}\r\n.nsEditor .nsEditorFooterContainer .nsEditorElementPathContainer .nsEditorElementPath .nsEditorElementPathItem\r\n{\r\n/* \tmargin-right: 5px; */\r\n}\r\n.nsEditor .nsEditorFooterContainer .nsEditorElementPathContainer .nsEditorElementPath .nsEditorElementPathItem a\r\n{\r\n\ttext-decoration: none;\r\n    cursor: default;\r\n    border-radius: 3px;\r\n    user-select: none;\r\n    display: inline-block;\r\n    vertical-align: baseline;\r\n    text-align: left;\r\n    white-space: nowrap;\r\n    padding: 2px 3px;\r\n    line-height: 10px;\r\n    outline: 0;\r\n    border: 0;\r\n    color: #222;\r\n}\r\n.nsEditor .nsEditorFooterContainer .nsEditorElementPathContainer .nsEditorElementPath .nsEditorElementPathItem a:hover\r\n{\r\n\tbackground-color: hsla(0,0%,88.2%,.99);\r\n    text-decoration: none;\r\n    color: #222;\r\n}.nsEditor .nsElemEditorResizer\r\n{\r\n\tposition: absolute;\r\n    border: 1px solid rgba(3,14,82,.92);\r\n    top: 0;\r\n    left: 0;\r\n    pointer-events: none;\r\n    font-size: 0;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp,\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerSize\r\n{\r\n\tposition: absolute;\r\n    display: inline-block;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerSize\r\n{\r\n\tleft: 50%;\r\n    top: 50%;\r\n    height: 24px;\r\n    width: 70px;\r\n    max-width: 100%;\r\n    margin-left: -35px;\r\n    margin-top: -12px;\r\n    line-height: 24px;\r\n    font-size: 12px;\r\n    text-align: center;\r\n    color: #fff;\r\n    background-color: rgba(0, 0, 0, .35);\r\n    opacity: 0;\r\n    transition: opacity .2s linear;\r\n    overflow: visible;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp\r\n{\r\n\tz-index: 4;\r\n    pointer-events: all;\r\n    border: 1px solid rgba(3,14,82,.92);\r\n    background-color: hsla(0,0%,88.2%,.99);\r\n    width: 10px;\r\n    height: 10px;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp.nsEditorResizerTopLeft\r\n{\r\n\tleft: -5px;\r\n    top: -5px;\r\n    cursor: nw-resize;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp.nsEditorResizerTopRight\r\n{\r\n\tright: -5px;\r\n    top: -5px;\r\n    cursor: ne-resize;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp.nsEditorResizerBottomLeft\r\n{\r\n\tleft: -5px;\r\n    bottom: -5px;\r\n    cursor: sw-resize;\r\n}\r\n\r\n.nsEditor .nsElemEditorResizer .nsEditorResizerComp.nsEditorResizerBottomRight\r\n{\r\n\tright: -5px;\r\n    bottom: -5px;\r\n    cursor: se-resize;\r\n}.nsEditorTableResizeHandler \r\n{\r\n    cursor: col-resize;\r\n    position: absolute;\r\n    z-index: 3;\r\n    padding-left: 5px;\r\n    padding-right: 5px;\r\n    margin-left: -5px;\r\n}\r\n.nsEditorTableResizeHandler:after\r\n{\r\n  content:\"\";\r\n  display:block;\r\n  height:100%;\r\n  width:0;\r\n  border:0;\r\n}\r\n.nsEditorTableResizeHandler.nsEditorTableResizeHandlerMoved\r\n{\r\n  background-color:#b5d6fd;\r\n  z-index:2;\r\n}\r\n.nsEditorTableResizeHandler.nsEditorTableResizeHandlerMoved:after\r\n{\r\n  border-right:1px solid #1e88e5;\r\n}\r\n.nsEditorTextArea .nsEditorSelectedCell,\r\n.nsEditorBody .nsEditorSelectedCell\r\n{\r\n\tborder: 1px double #4592ff !important;\r\n    background-color: #f1f7ff;\r\n}.nsEditorSearchWrapper \r\n{\r\n\tvisibility: hidden;\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tright: 0;\r\n\twidth: 0;\r\n\theight: 0;\r\n\tmin-width: 300px;\r\n}\r\n\r\n.nsEditorSearchWrapper.nsEditorSearchWrapperSticky \r\n{\r\n\tposition: fixed;\r\n}\r\n\r\n.nsEditorSearchWrapper.nsEditorSearchVisible \r\n{\r\n\tvisibility: visible;\r\n}\r\n.nsEditorSearchWrapper .nsEditorSearchContainer \r\n{\r\n\twidth: 325px;\r\n\tmax-width: 100vw;\r\n/* \tdisplay: flex; */\r\n\tposition: absolute;\r\n\tright: 0;\r\n\tbackground-color: rgb(255, 255, 255);\r\n\tborder: 1px solid #d9d9d9;\r\n    border-top: none;\r\n\tpadding: 4px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchContent\r\n{\r\n    display: flex;\r\n    align-items: center;\r\n    flex: 0 0 auto;\r\n    padding-bottom: 5px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchContent .nsEditorSearchInputCountWrapper\r\n{\r\n\tposition: relative;\r\n    display: inline-block;\r\n    width: 220px;\r\n    height: 36px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchContent .nsEditorSearchInputCountOuterContainer\r\n{\r\n\tbackground: rgb(255, 255, 255);\r\n\tmin-width: 20px;\r\n\twidth: 100%;\r\n\tborder: 1px solid rgb(218, 220, 224);\r\n    border-radius: 4px;\r\n    box-sizing: border-box;\r\n    color: rgb(60, 64, 67);\r\n    padding: 1px 8px;\r\n    font-size: 14px;\r\n    height: 36px;\r\n    margin: 0px;\r\n}\r\n\r\n.nsEditorSearchButton .nse\r\n{\r\n\tfont-size: 16px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchInput\r\n{\r\n\tfont-size: 13px;\r\n    height: 25px;\r\n    margin: 0px;\r\n    width: 100%;\r\n    background: transparent !important;\r\n    border: none !important;\r\n    box-shadow: none !important;\r\n    outline: none !important;\r\n    padding: 1px 0px !important;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchCountContainer\r\n{\r\n\tmax-width: 120px;\r\n    overflow: hidden;\r\n    padding: 0px 8px 0px 4px;\r\n    text-align: right;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchCount\r\n{\r\n\tcolor: rgb(204, 204, 204);\r\n    white-space: nowrap;\r\n    display: none;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchCount.nsEditorSearchCountVisible\r\n{\r\n\tdisplay:inline-block;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer\r\n{\r\n\tflex: 1;\r\n\tpadding-left: 0;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\theight: 30px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButton\r\n{\r\n\tbackground-image: none;\r\n    background-color: transparent;\r\n    border-color: transparent;\r\n    margin: 0;\r\n    padding: 1px 0px;\r\n    min-width: 24px;\r\n    height: 100%;\r\n    vertical-align: middle;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButton:hover,\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButton:active\r\n{\r\n\tbox-shadow: none;\r\n    background-color: rgba(0, 0, 0, 0.06);\r\n    background-image: none;\r\n    cursor: pointer;\r\n    border-color: transparent !important;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButton:active\r\n{\r\n\tbackground: rgb(248, 248, 248);\r\n    color: rgb(17, 17, 17);\r\n\tborder: 1px solid rgb(198, 198, 198);\r\n\tborder-style: outset;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButtonNext\r\n{\r\n\tpadding-right:0px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButtonPrevious\r\n{\r\n\tpadding-left:0px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .ns-editor-expand-bold,\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .ns-editor-collapse-bold\r\n{\r\n\tfont-size: 24px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorSearchButtonContainer .nsEditorSearchButtonClose\r\n{\r\n\twidth: 80%;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceContainer\r\n{\r\n\tmargin: 0;\r\n    border: 0;\r\n    vertical-align: baseline;\r\n    line-height: 1;\r\n    height: initial;\r\n    border-radius: 0;\r\n    font-size: inherit;\r\n    font-weight: 400;\r\n    display: none;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceContainer.nsEditorReplaceContainerVisible\r\n{\r\n\tdisplay: block;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceContainer .nsEditorReplaceInput\r\n{\r\n\tfont-size: 13px;\r\n    height: 25px;\r\n    margin: 0px;\r\n    width: 100%;\r\n    background: transparent !important;\r\n    border: 1px solid #b8b8b8;\r\n    box-shadow: none !important;\r\n    outline: none !important;\r\n    padding: 1px 8px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceContainer .nsEditorReplaceButtonWrapper\r\n{\r\n\tmargin: 0;\r\n    padding: 0;\r\n    border: 0;\r\n    vertical-align: baseline;\r\n    line-height: 1;\r\n    height: initial;\r\n    border-radius: 0;\r\n    font-size: inherit;\r\n    font-weight: 400;\r\n    display: flex;\r\n    justify-content: flex-end;\r\n    position: relative;\r\n    padding-top: .5em;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceButtonWrapper .nsEditorReplaceButtonContainer\r\n{\r\n\tdisplay: flex;\r\n\tcursor: pointer;\r\n    padding: 0px 5px;\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceButtonContainer .nsEditorReplaceButton\r\n{\r\n\ttext-decoration: none; \r\n\tdisplay: inline-block;\r\n    border: none; \r\n    padding: 4px 16px;\r\n    font-size: 14px;\r\n    font-style: normal;\r\n    cursor: pointer;\r\n    background-color: #207ab7; \r\n    color: #fff; \r\n    border-radius: 5px; \r\n    box-shadow: 7px 6px 28px 1px rgba(0, 0, 0, 0.24); \r\n    cursor: pointer; \r\n    outline: none; \r\n    line-height: 24px;\r\n    text-align: center;\r\n    text-transform: capitalize;\t\r\n}\r\n\r\n.nsEditorSearchWrapper .nsEditorReplaceButtonContainer .nsEditorReplaceButton:active\r\n{\r\n\ttransform: scale(0.98); \r\n    box-shadow: 3px 2px 22px 1px rgba(0, 0, 0, 0.24); \r\n}";
styleInject(css_248z);

const nsCompUtil$1 = require('./generated/js/nsUtil.min.js');
const NSUtil$1 = nsCompUtil$1.NSUtil;
const nsCompEditor$1 = require('./generated/js/nsEditor.min.js');
const NSEditor$1 = nsCompEditor$1.NSEditor;
class NSEditorReact extends NSBaseReactComponent {
    constructor(props, state) {
        super(props, state);
        this.props = props;
        this.state = state;
        this.__arrEvents = [];
        this.__hasInitialized = false;
        this.__hasDestroyed = false;
    }
    componentDidMount() {
        if (!this.__objEditor) {
            this.__nsUtil = new NSUtil$1();
            this.__arrEvents = [NSEditor$1.EVENT_MAXIMIZED,
                NSEditor$1.EVENT_RESTORED,
            ];
            const setting = this.props.setting; //this.__nsUtil.cloneObject(this.props.setting,true);
            this.__setting = setting;
            this.create();
            this.__addEvents();
        }
        this.__hasInitialized = true;
    }
    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }
    componentWillUnmount() {
        if (this.__hasInitialized) {
            this.__hasDestroyed = true;
        }
    }
    render() {
        return React.createElement("div", {
            style: this.__getStyleForContainer(),
            ref: (e) => {
                this.__container = e;
            }
        });
    }
    getElement() {
        return this.__container;
    }
    ;
    create() {
        this.__objEditor = new NSEditor$1(this.__container, this.__setting);
    }
    ;
    toggleLineNumber() {
        this.__objEditor.toggleLineNumber();
    }
    ;
    setDisabled(isDisabled) {
        this.__objEditor.setDisabled(isDisabled);
    }
    ;
    getDisabled() {
        return this.__objEditor.getDisabled();
    }
    ;
    setText(text) {
        this.__objEditor.setText(text);
    }
    ;
    getText() {
        return this.__objEditor.getText();
    }
    ;
    setHtml(html) {
        this.__objEditor.setHtml(html);
    }
    ;
    getHtml() {
        return this.__objEditor.getHtml();
    }
    ;
    setStyle(styleProp, value) {
        this.__objEditor.setStyle(styleProp, value);
    }
    ;
    setFocus(isFocus) {
        this.__objEditor.setFocus(isFocus);
    }
    ;
    hasFocus() {
        return this.__objEditor.hasFocus();
    }
    ;
    setTheme(theme) {
        this.__objEditor.setTheme(theme);
    }
    ;
    changeProperty(propertyName, value) {
        this.__objEditor.changeProperty(propertyName, value);
    }
    ;
    getNSEditor() {
        return this.__objEditor;
    }
    ;
    __getStyleForContainer() {
        const style = {};
        const containerStyle = this.props.containerStyle;
        if (containerStyle) {
            Object.keys(containerStyle).forEach(key => {
                style[key] = containerStyle[key];
            });
        }
        return style;
    }
    __addEvents() {
        const self = this;
        for (const eventName of this.__arrEvents) {
            this.__nsUtil.addEvent(this.__container, eventName, (function (eventNameParam) {
                return function (event) {
                    console.log(event);
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    self.__eventListener.bind(self)(event, eventNameParam);
                };
            })(eventName));
        }
    }
    __eventListener(event, eventName) {
        const eventListenerName = 'on' + eventName[0].toUpperCase() + eventName.substring(1);
        if (this.props[eventListenerName]) {
            this.props[eventListenerName](event);
        }
    }
}

const nsCompAjax = require('./generated/js/nsAjax.min.js');
const NSAjax = nsCompAjax.NSAjax;
const nsCompConsole = require('./generated/js/nsConsole.min.js');
const NSConsole = nsCompConsole.NSConsole;
const nsCompContainerBase = require('./generated/js/nsContainerBase.min.js');
const NSContainerBase = nsCompContainerBase.NSContainerBase;
const nsCompDashboard = require('./generated/js/nsDashboard.min.js');
const NSDashboard = nsCompDashboard.NSDashboard;
const nsCompDateUtil = require('./generated/js/nsDateUtil.min.js');
const NSDateUtil = nsCompDateUtil.NSDateUtil;
const nsCompDatePicker = require('./generated/js/nsDatePicker.min.js');
const NSCalendar = nsCompDatePicker.NSCalendar;
const NSDatePicker = nsCompDatePicker.NSDatePicker;
const nsCompDividerBox = require('./generated/js/nsDividerBox.min.js');
const NSDividerBox = nsCompDividerBox.NSDividerBox;
/*const nsCompDocxExport = require('./generated/js/nsDocxExport.min.js');
export const NSDocxExport = nsCompDocxExport.NSDocxExport;
export type NSDocxExportType = ReturnType<typeof nsCompDocxExport.NSDocxExport>;*/
const nsCompEditor = require('./generated/js/nsEditor.min.js');
const NSEditor = nsCompEditor.NSEditor;
const nsCompEvent = require('./generated/js/nsEvent.min.js');
const NSEvent = nsCompEvent.NSEvent;
const nsCompExport = require('./generated/js/nsExport.min.js');
const NSExport = nsCompExport.NSExport;
const nsCompGrid = require('./generated/js/nsGrid.min.js');
const NSGrid = nsCompGrid.NSGrid;
const nsCompList = require('./generated/js/nsList.min.js');
const NSList = nsCompList.NSList;
const nsCompMessageBox = require('./generated/js/nsMessageBox.min.js');
const NSMessageBox = nsCompMessageBox.NSMessageBox;
const NSPanel = nsCompMessageBox.NSPanel;
const nsCompMultiSelectDropdown = require('./generated/js/nsMultiSelectDropdown.min.js');
const NSMultiSelectDropdown = nsCompMultiSelectDropdown.NSMultiSelectDropdown;
const nsCompNavigation = require('./generated/js/nsNavigation.min.js');
const NSNavigation = nsCompNavigation.NSNavigation;
const nsCompHorizontalNavigation = require('./generated/js/nsHorizontalNavigation.min.js');
const NSHorizontalNavigation = nsCompHorizontalNavigation.NSHorizontalNavigation;
const nsCompNumericTextBox = require('./generated/js/nsNumericTextBox.min.js');
const NSNumericTextBox = nsCompNumericTextBox.NSNumericTextBox;
const nsCompPagination = require('./generated/js/nsPagination.min.js');
const NSPagination = nsCompPagination.NSPagination;
const nsCompPinTip = require('./generated/js/nsPinTip.min.js');
const NSPinTip = nsCompPinTip.NSPinTip;
//js file is wrong
/*const nsCompProgressBar = require('./generated/js/nsProgressBar.min.js');
export const NSProgressBar = nsCompProgressBar.NSProgressBar;
export type NSProgressBarType = ReturnType<typeof nsCompProgressBar.NSProgressBar>;*/
const nsCompRouter = require('./generated/js/nsRouter.min.js');
const NSRouter = nsCompRouter.NSRouter;
const nsCompScroller = require('./generated/js/nsScroller.min.js');
const NSScroller = nsCompScroller.NSScroller;
const nsCompSVG = require('./generated/js/nsSVG.min.js');
const NSSvg = nsCompSVG.NSSvg;
const NSSvgShapes = nsCompSVG.NSSvgShapes;
const nsCompTableRowMover = require('./generated/js/nsTableRowMover.min.js');
const NSTableRowMover = nsCompTableRowMover.NSTableRowMover;
const nsCompTabNavigator = require('./generated/js/nsTabNavigator.min.js');
const NSTabNavigator = nsCompTabNavigator.NSTabNavigator;
const nsCompTextBox = require('./generated/js/nsTextBox.min.js');
const NSTextBox = nsCompTextBox.NSTextBox;
const nsCompTouchToMouse = require('./generated/js/nsTouchToMouse.min.js');
const NSTouchToMouse = nsCompTouchToMouse.NSTouchToMouse;
const nsCompUtil = require('./generated/js/nsUtil.min.js');
const NSUtil = nsCompUtil.NSUtil;
const nsCompVirtualScroll = require('./generated/js/nsVirtualScroll.min.js');
const NSVirtualScroll = nsCompVirtualScroll.NSVirtualScroll;
const nsCompXlsxExport = require('./generated/js/nsXlsxExport.min.js');
const NSXlsxExport = nsCompXlsxExport.NSXlsxExport;
const nsCompExpressionEvaluator = require('./generated/js/nsExpressionEvaluator.min.js');
const NSExpressionEvaluator = nsCompExpressionEvaluator.NSExpressionEvaluator;

export { DynamicComponentService, NSAjax, NSAjaxReact, NSCalendar, NSCalendarReact, NSConsole, NSContainerBase, NSDashboard, NSDashboardReact, NSDatePicker, NSDatePickerReact, NSDateUtil, NSDividerBox, NSEditor, NSEditorReact, NSEvent, NSExport, NSExpressionEvaluator, NSGrid, NSGridReact, NSHorizontalNavigation, NSHorizontalNavigationReact, NSList, NSMessageBox, NSMessageBoxReact, NSMultiSelectDropdown, NSMultiselectDropdownReact, NSNavigation, NSNavigationReact, NSNumericTextBox, NSPagination, NSPanel, NSPanelReact, NSPinTip, NSRouter, NSScroller, NSSvg, NSSvgShapes, NSTabNavigator, NSTabNavigatorReact, NSTableRowMover, NSTextBox, NSTextBoxReact, NSTouchToMouse, NSUtil, NSVirtualScroll, NSXlsxExport };
//# sourceMappingURL=index.esm.js.map
