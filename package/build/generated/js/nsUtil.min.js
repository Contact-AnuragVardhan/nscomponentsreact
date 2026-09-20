var exportModule = function(root, name, prototype)
{
	if(typeof exports === 'object' && typeof module === 'object')
	{
		module.exports = module.exports || {};
		module.exports[name] = prototype;
	}
	else if(typeof define === "function" && define.amd)
	{
		define(name, [], function () { return prototype; });
	}
	else if(typeof exports === 'object')
	{
		exports[name] = prototype;
	}
	else
	{
		root[name] = prototype;
	}
};

var nsModuleExport = function(root, name, prototype)
{
	exportModule(root, name, prototype);
};

var __nsGlobal = (function () {
	if (typeof globalThis !== "undefined") return globalThis;
	if (typeof self !== "undefined") return self;
	if (typeof window !== "undefined") return window;
	if (typeof global !== "undefined") return global;
	return Function("return this")();
})();

(function(root)
{
	exportModule(root, "nsModuleExport", nsModuleExport);
	exportModule(root, "__nsGlobal", __nsGlobal);
})(__nsGlobal);

/*(function(root,name,prototype)
{
	if(typeof exports === 'object' && typeof module === 'object')
	{
		module.exports[name] = prototype;
	}
	else if (typeof define === "function" && define.amd)
	{
		define(name,[], function () {return prototype;});
	}
	else if(typeof exports === 'object')
	{
		exports[name] = prototype;
	}
	else
	{
		root[name] = prototype;
	}
})(this ?? globalThis,"nsModuleExport",nsModuleExport);*/

var NSUtil = (function()
{
	function NSUtil()
	{
		this.__sheetId = "nsStyle";
		this.KEYCODE = {BACKSPACE:8, TAB:9, ENTER:13, SHIFT:16, CTRL:17, ALT:18, ESC:27,SPACE:32,PAGEUP:33,PAGEDOWN:34,LEFT:37,UP:38,RIGHT:39,DOWN:40,INSERT:45,DELETE:46};
		this.ANIMATIONDELAY = 10;
		//for nsMenu and nsPinTip
		this.POS_TOP = "top";
		this.POS_BOTTOM = "bottom";
		this.POS_LEFT = "left";
		this.POS_RIGHT = "right";
		this.POS_TOPLEFT = "top-left";
		this.POS_TOPRIGHT = "top-right";
		this.POS_BOTTOMLEFT = "bottom-left";
		this.POS_BOTTOMRIGHT = "bottom-right";
	};
	
	NSUtil.prototype.getDomVariables = function()
	{
		var retValue = {doc: null,win: null};
		if(typeof document === 'undefined')
		{
			retValue.doc = {
					body: {},
				    addEventListener: function addEventListener() {},
				    removeEventListener: function removeEventListener() {},
				    activeElement: {
				      blur: function blur() {},
				      nodeName: '',
				    },
				    querySelector: function querySelector() {
				      return null;
				    },
				    querySelectorAll: function querySelectorAll() {
				      return [];
				    },
				    getElementById: function getElementById() {
				      return null;
				    },
				    createEvent: function createEvent() {
				      return {
				        initEvent: function initEvent() {},
				      };
				    },
				    createElement: function createElement() {
				      return {
				        children: [],
				        childNodes: [],
				        style: {},
				        setAttribute: function setAttribute() {},
				        getElementsByTagName: function getElementsByTagName() {
				          return [];
				        },
				      };
				    },
				    location: { hash: '' },
			};
		}
		else
		{
			retValue.doc = document;
		}
		if(typeof window === 'undefined')
		{
			retValue.win = 
			{
					document: retValue.doc,
				    navigator: {
				      userAgent: '',
				    },
				    location: {},
				    history: {},
				    CustomEvent: function CustomEvent() {
				      return this;
				    },
				    addEventListener: function addEventListener() {},
				    removeEventListener: function removeEventListener() {},
				    getComputedStyle: function getComputedStyle() {
				      return {
				        getPropertyValue: function getPropertyValue() {
				          return '';
				        },
				      };
				    },
				    Image: function Image() {},
				    Date: function Date() {},
				    screen: {},
				    setTimeout: function setTimeout() {},
				    clearTimeout: function clearTimeout() {},
			};
		}
		else
		{
			retValue.win = window;
		}
		return retValue;
	};
	
	NSUtil.prototype.getSupportedEvents = function ()
	{
		var obj = this.getDomVariables();
		var win = obj.win;
		var doc = obj.doc;
		var retValue = {};
		retValue.touch = (win.Modernizr && win.Modernizr.touch === true) || (!!((win.navigator.maxTouchPoints > 0) || ('ontouchstart' in win) || (win.DocumentTouch && doc instanceof win.DocumentTouch)));
		retValue.pointerEvents = !!win.PointerEvent && ('maxTouchPoints' in win.navigator) && win.navigator.maxTouchPoints > 0;
		retValue.passiveListener = (function checkPassiveListener() {
		        var supportsPassive = false;
		        try {
		          var opts = Object.defineProperty({}, 'passive', {
		            // eslint-disable-next-line
		            get: function get() {
		              supportsPassive = true;
		            },
		          });
		          win.addEventListener('testPassiveListener', null, opts);
		        } catch (e) {
		          // No support
		        }
		        return supportsPassive;
	      }());
		retValue.gestures = 'ongesturestart' in win;
		
		return retValue;
	};
	
	NSUtil.prototype.isMobile = function(win)
	{
		var win = this.getWin(win);
		var userAgent = (win.navigator && win.navigator.userAgent) ? win.navigator.userAgent : null;
		var objOS = {android:{pattern:"Android",flags:"i"} ,blackberry:{pattern:"BlackBerry",flags:"i"} ,ios:{pattern:"iPhone|iPad|iPod",flags:"i"} ,opera:{pattern:"Opera Mini",flags:"i"} ,windows:{pattern:"IEMobile",flags:"i"}};
		var objRet = {};
		if(userAgent)
		{
			var any = false;
			var item = null;
			for(var os in objOS)
			{
				item = objOS[os];
				objRet[os] = userAgent.match(new RegExp(item.pattern,item.flags));
				if(objRet[os])
				{
					any = true;
				}
			}
			objRet["any"] = any;
		}
		else
		{
			for(var os in objOS)
			{
				objRet[os] = false;
			}
			objRet["any"] = false;
		}
		return objRet;
	};
	
	NSUtil.prototype.getElement = function (element,doc)
	{
		if(element)
		{
			if(this.isObject(element))
			{
				return element;
			}
			else if(element.length > 0)
			{
				doc = this.getDoc(doc);
				return doc.getElementById(element);
			}
		}
		
		return null;
	};
	
	NSUtil.prototype.getElementFromHtml = function (html)
	{
		if(html)
		{
			var div = this.createDiv();
			div.innerHTML = html.toString();
			var child = (div.firstChild !== div.lastChild || !div.firstChild) ? div : div.firstChild;
			return child;
		}
		return null;
	};
	
	NSUtil.prototype.getReferenceFromHtml = function(html)
	{
		var comp = this.getElementFromHtml(html);
		if(comp)
		{
			var arrElement = comp.querySelectorAll("[ns-ref],[data-ns-ref]");
			var objRefs = {};
			var ref = comp.getAttribute("ns-ref") || comp.getAttribute("data-ns-ref");
			if(ref)
			{
				objRefs[ref] = comp;
			}
			if(arrElement && arrElement.length)
			{
				for(var count = 0;count < arrElement.length;count++)
				{
					var element = arrElement[count];
					ref = element.getAttribute("ns-ref") || element.getAttribute("data-ns-ref");
					objRefs[ref] = element;
				}
			}
			return {element : comp,refs: objRefs};
		}
		return null;
	};
	
	NSUtil.prototype.getWebComponentElement = function (element)
	{
		if(element && element["__impl4cf1e782hg__"])
		{
			return element["__impl4cf1e782hg__"];
		}
		return element;
	};
	
	NSUtil.prototype.hasAttribute = function (element,attributeName)
	{
		if(element && attributeName && element["hasAttribute"])
		{
			return (element.hasAttribute(attributeName) || element.hasAttribute("data-" + attributeName)); 
		}
		return false;
	};
	
	NSUtil.prototype.getAttribute = function (element,attributeName)
	{
		if(element && attributeName && element["hasAttribute"])
		{
			return (element.hasAttribute(attributeName) ? element.getAttribute(attributeName) : element.getAttribute("data-" + attributeName)); 
		}
		return null;
	};
	
	NSUtil.prototype.removeAttribute = function (element,attributeName)
	{
		if(element && attributeName && element["hasAttribute"])
		{
			return (element.hasAttribute(attributeName) ? element.removeAttribute(attributeName) : element.removeAttribute("data-" + attributeName)); 
		}
		return null;
	};
	
	NSUtil.prototype.createDiv = function (id,styleName,doc)
	{
	    var div = this.createElement("div",id,styleName,doc);
	    return div;
	};
	
	NSUtil.prototype.createElement = function(type,id,styleName,doc)
	{
		doc = this.getDoc(doc);
	    var element = doc.createElement(type);
	    if(id)
	    {
	    	element.setAttribute("id",id);
	    }
	    if(styleName)
	    {
	    	element.className = styleName;   
	    }
	    return element;
	};
	
	//from JQuery
	NSUtil.prototype.isElementVisible = function(element)
	{
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length); 
	};
	
	NSUtil.prototype.setDivVisibility = function (id,isVisible,doc)
	{
		doc = this.getDoc(doc);
	    var div = doc.getElementById(id);
	    if(div)
	    {
	        if(isVisible)
	        {
	            div.style.display = "block";
	        }
	        else
	        {
	            div.style.display = "none";
	        }
	    }
	};
	
	NSUtil.prototype.removeDiv = function (id,doc)
	{
		doc = this.getDoc(doc);
	    var div = doc.getElementById(id);
	    if (div)
	    {
	        var parent = div.parentNode;
	        if(parent)
	        {
	            parent.removeChild(div);
	        }
	    }
	};
	
	/*Utility Methods */
	NSUtil.prototype.getKeys = function (object) 
	{
	    var keys = [];
	    for (var property in object)
	    {
	    	keys.push(property);
	    }
	    return keys;
	};
	
	NSUtil.prototype.getValues = function (object)
	{
		var values = [];
		for (var property in object)
		{
			values.push(object[property]);
		}
		return values;
	};
	
	//from https://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects/16788517#16788517
	//used in frameworks wrapper
	NSUtil.prototype.isObjectEqual = function(origValue, newValue) 
	{
		if (origValue === null || origValue === undefined || newValue === null || newValue === undefined) 
		{ 
			return origValue === newValue; 
		}
		// after this just checking type of one would be enough
		if (origValue.constructor !== newValue.constructor) 
		{ 
			return false; 
		}
		// if they are functions, they should exactly refer to same one (because of closures)
		if (origValue instanceof Function) 
		{ 
			return origValue === newValue; 
		}
		// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
		if (origValue instanceof RegExp) 
		{ 
			return origValue === newValue; 
		}
		if (origValue === newValue || origValue.valueOf() === newValue.valueOf()) 
		{ 
			return true; 
		}
		if (Array.isArray(origValue) && origValue.length !== newValue.length) 
		{ 
			return false; 
		}
		// if they are dates, they must had equal valueOf
		if (origValue instanceof Date) 
		{ 
			return false; 
		}
		// if they are strictly equal, they both need to be object at least
		if (!(origValue instanceof Object)) 
		{ 
			return false; 
		}
		if (!(newValue instanceof Object)) 
		{ 
			return false; 
		}
		// recursive object equality check
		var arrKeys = Object.keys(origValue);
		var arrNewKeys = Object.keys(newValue);
		if (arrKeys.length !== arrNewKeys.length) {
			return false;
		}
		for(var count = 0;count < arrKeys.length;count++)
		{
			var key = arrKeys[count];
			if (arrNewKeys.indexOf(key) === -1) {
				return false;
			}
			if (!this.isObjectEqual(origValue[key], newValue[key])) {
				return false;
			}
		}
		return true;
	};
	
	NSUtil.prototype.getValueByKeys = function(item,keyParam)
	{
		var objReturn = {};
		if(item)
		{
			(function flatObject(item, index)
			 {
				var toString = Object.prototype.toString;
				var suffix = toString.call(item) == "[object Array]" ? "]" : "";
				for(var key in item)
				{
					if(!item.hasOwnProperty(key))continue;
					objReturn[index+key+suffix] = item[key];
					if( toString.call(item[key]) == "[object Array]" )flatObject(item[key],index+key+suffix+"[");
					if( toString.call(item[key]) == "[object Object]" )flatObject(item[key],index+key+suffix+".");   
				}
			 })(item,"");
		}
		return objReturn[keyParam];
	};
	
	//arrIgnoreDeepCopy in case there is a circular reference in Hierarchical structure like in NSNavigation
	NSUtil.prototype.cloneObject = function(objSource,deepCopy,arrIgnoreKeys,arrIgnoreDeepCopy) 
	{
		if(!arrIgnoreKeys)
		{
			arrIgnoreKeys = [];
		}
		if(!arrIgnoreDeepCopy)
		{
			arrIgnoreDeepCopy = [];
		}
		if(!objSource || typeof objSource != "object" || Object.prototype.toString.call(objSource) === "[object Function]")
		{
			// null, undefined, any non-object, or function
			return objSource;	// anything
		}
		if(objSource.nodeType && "cloneNode" in objSource)
		{
			// DOM Node
			return objSource.cloneNode(true); // Node
		}
		if(objSource instanceof Date)
		{
			// Date
			return new Date(objSource.getTime());	// Date
		}
		if(objSource instanceof RegExp)
		{
			// RegExp
			return new RegExp(objSource);   // RegExp
		}
		if(objSource instanceof Array)
		{
			var arrClone = [];
			var length = objSource.length;
		    for (var count = 0; count < length; count++) 
		    {
		        var item = objSource[count];
		        var obj = this.cloneObject(item,deepCopy,arrIgnoreKeys,arrIgnoreDeepCopy);
		        arrClone.push(obj);
		    }
		    return arrClone;
		}
		// we don't clone functions for performance reasons
		//		}else if(d.isFunction(objSource)){
		//			// function
		//			r = function(){ return objSource.apply(this, arguments); };
		// generic objects
		var objClone = {};
		var clonedItem = null;
		for (var key in objSource) 
		{
			var isClone = true;
			for (var count = 0; count < arrIgnoreKeys.length; count++) 
		    {
				if(arrIgnoreKeys[count] == key)
				{
					isClone = false;
					break;
				}
		    }
			if(isClone)
			{
				if(deepCopy)
				{
					var isIgnoreDeepCopy = false;
					for (var ignoreDeepCount = 0; ignoreDeepCount < arrIgnoreDeepCopy.length; ignoreDeepCount++) 
				    {
						if(arrIgnoreDeepCopy[ignoreDeepCount] == key)
						{
							isIgnoreDeepCopy = true;
							break;
						}
				    }
					clonedItem = isIgnoreDeepCopy ? objSource[key] : this.cloneObject(objSource[key],deepCopy,arrIgnoreKeys,arrIgnoreDeepCopy);
				}
				else
				{
					clonedItem = objSource[key];
				}
				objClone[key] = clonedItem;
			}
	    }
		return objClone;
	};
	
	NSUtil.prototype.copyElement = function(sourceElement,destinationElement)
	{
		if(sourceElement)
		{
			if(destinationElement)
			{
				destinationElement.innerHTML = sourceElement.innerHTML;
			}
			else
			{
				destinationElement = sourceElement.cloneNode(true);
			}
			for (var count = 0; count < sourceElement.attributes.length; count++) 
			{
				var attr = sourceElement.attributes.item(count);
				destinationElement.setAttribute(attr.nodeName, attr.nodeValue);
			}
			//destinationElement.style.cssText = sourceElement.style.cssText;
		}
		return destinationElement;
	};
	
	NSUtil.prototype.swapArrayItems = function(arrInput,indFirst,indSecond) 
	{
		if(arrInput && arrInput.length > indFirst && arrInput.length > indSecond)
		{
			var objTemp = arrInput[indFirst];
			arrInput[indFirst] = arrInput[indSecond];
			arrInput[indSecond] = objTemp;
			
			return true;
		}
		return false;
	};
	
	NSUtil.prototype.moveArrayItem = function(arrInput,sourceIndex,destinationIndex) 
	{
		if(arrInput && arrInput.length > destinationIndex && arrInput.length > sourceIndex && destinationIndex > -1 && sourceIndex > -1)
		{
			// Remove the element from the array
			var removedElement = arrInput.splice(sourceIndex, 1)[0];
			// At destinationIndex, remove 0 elements, insert the removedElement
			arrInput.splice(destinationIndex, 0,removedElement);
			return true;
		}
		return false;
	};
	
	NSUtil.prototype.isObject = function (refObject)
	{
		if (typeof refObject === 'object' && refObject !== null) 
		{
		    return true;
		} 
		return false;
	};
	
	NSUtil.prototype.isTextNode = function (element)
	{
		try
		{
			return (element && "nodeType" in element && element.nodeType === Node.TEXT_NODE);
		}
	    catch(err)
	    {
	    	return false;
	    }
	};
	
	NSUtil.prototype.isElement = function (element)
	{
		try
		{
			return (element && "nodeType" in element && element.nodeType === Node.ELEMENT_NODE);
		}
	    catch(err)
	    {
	    	return false;
	    }
	};
	
	NSUtil.prototype.isElementOfType = function (element,tagName)
	{
		if(element && tagName)
	    {
	        if(element.tagName && element.tagName.toLowerCase() === tagName.toLowerCase())
	        {
	        	return true;
	        }
	    }
		return false;
	};
	
	NSUtil.prototype.isArray = function (refArr) 
	{
	    return refArr != null && typeof refArr == "object" &&
	      "splice" in refArr && "join" in refArr;
	};
	
	NSUtil.prototype.isVariable = function (variableName,context) 
	{
		context = this.getWin(context);
		return !this.isUndefined(context[variableName]); 
	};
	
	//after
	NSUtil.prototype.insertAfterElement = function(referenceElement,insertElement) 
	{
		if(referenceElement && insertElement)
		{
			var parentElement = this.getWebComponentElement(referenceElement.parentNode);
			if(parentElement)
			{
				referenceElement = this.getWebComponentElement(referenceElement);
				insertElement = this.getWebComponentElement(insertElement);
				if (parentElement.lastChild === referenceElement) 
				{
					parentElement.appendChild(insertElement);
				}
				else
				{
					parentElement.insertBefore(insertElement,referenceElement.nextSibling);
				}
			}
		}
	};
	
	NSUtil.prototype.insertElementAtIndex = function(parent,element,index)
	{
		if (!index)
		{
			index = 0;
		}
		if (index >= parent.children.length) 
		{
			parent.appendChild(element);
		}
		else 
		{
			parent.insertBefore(element,parent.children[index]);
		}
	};
	
	NSUtil.prototype.swapElements = function(element1,element2)
	{
		if(element1 && element2)
		{
			var parent2 = element2.parentNode;
		    var next2 = element2.nextSibling;
		    // special case for element1 is the next sibling of element2
		    if (next2 === element1) 
		    {
		        // just put element1 before element2
		        parent2.insertBefore(element1, element2);
		    } 
		    else 
		    {
		        // insert element2 right before element1
		        element1.parentNode.insertBefore(element2, element1);
		        // now insert element1 where element2 was
		        if (next2) 
		        {
		            // if there was an element after element2, then insert element1 right before that
		            parent2.insertBefore(element1, next2);
		        } 
		        else 
		        {
		            // otherwise, just append as last child
		            parent2.appendChild(element1);
		        }
		    }
		}
	};
	
	//replace
	NSUtil.prototype.replaceElement = function(element,newElement,copyAttributes,moveContent,doc)
	{
		if(element)
		{
			moveContent = this.isUndefinedOrNull(moveContent) ? true : Boolean.parse(moveContent);
			newElement = this.isString(newElement) ? this.createElement(newElement,null,null,doc) : newElement;
			if(moveContent) 
			{
				while(element.firstChild) 
				{
					newElement.appendChild(element.firstChild);
				}
			}
			if(copyAttributes && element.hasAttributes()) 
			{
				var attrs = element.attributes;
			    for(var count = attrs.length - 1;count >= 0;count--) 
			    {
			    	newElement.setAttribute(attrs[count].name, attrs[count].value);
			    }
			}
			if(element.parentNode) 
			{
				element.parentNode.replaceChild(newElement,element);
			}
		}
		return newElement;
	};
	
	//unwrap
	NSUtil.prototype.insertElementParentsParent = function(element)
	{
		if(element && element.parentNode)
		{
			var parent = element.parentNode;
			while (element.firstChild) 
            {
                parent.insertBefore(element.firstChild,element);
            }
			if(element.parentNode)
			{
				element.parentNode.removeChild(element);
			}
		}
	};
	
	NSUtil.prototype.getFunction = function (functionInstance,context)
	{
		if(functionInstance)
		{
			context = this.getWin(context);
			if (typeof functionInstance === "string" || functionInstance instanceof String)
			{
				if(this.isFunction(functionInstance))
				{
					functionInstance = context[functionInstance];
				}
			}
		}
		return functionInstance;
	};
	
	NSUtil.prototype.callFunction = function (functionName,context) 
	{
		var returnValue = null;
		context = this.getWin(context);
		if (typeof context[functionName] === "function") 
		{
			returnValue = context[functionName]();
		}
		return returnValue;
	};
	
	NSUtil.prototype.callFunctionFromString = function (functionString,replaceParameterFunction,context)
	{
		var returnValue = null;
		if(functionString)
		{
			context = this.getWin(context);
			var functionName = null;
			var arrParameter = null;
			if(functionString.indexOf("(") > -1)
			{
				var param = functionString.split("(");
				if(param && param.length > 0)
				{
					functionName = param[0];
					var parameter = param[1];
					if(parameter && parameter.charAt(parameter.length - 1) === ")")
					{
						parameter = parameter.substring(0,parameter.length - 1);
						var arrParam = parameter.split(",");
						if(arrParam && arrParam.length > 0)
						{
							arrParameter = arrParam;
						}
					}
				}
			}
			else
			{
				functionName = functionString;
			}
			if(this.isFunction(functionName))
			{
				if(!arrParameter || arrParameter.length === 0)
				{
					returnValue = this.callFunction(functionName);
				}
				else
				{
					if(replaceParameterFunction)
					{
						for(var count = 0;count < arrParameter.length;count++)
						{
							 var newValue = replaceParameterFunction(arrParameter[count]);
							 if(!this.isUndefined(newValue))
							 {
								 arrParameter[count] = newValue;
							 }
						}	
					}
					switch (arrParameter.length) 
					{
					    case 1:
					    	returnValue = context[functionName](arrParameter[0]);
					        break;
					    case 2:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1]);
					        break;
					    case 3:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2]);
					        break;
					    case 4:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3]);
					        break;
					    case 5:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4]);
					        break;
					    case 6:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4],arrParameter[5]);
					        break;
					    case 7:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4],arrParameter[5],arrParameter[6]);
					        break;
					    case 8:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4],arrParameter[5],arrParameter[6],arrParameter[7]);
					        break;
					    case 9:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4],arrParameter[5],arrParameter[6],arrParameter[7],arrParameter[8]);
					        break;
					    case 10:
					    	returnValue = context[functionName](arrParameter[0],arrParameter[1],arrParameter[2],arrParameter[3],arrParameter[4],arrParameter[5],arrParameter[6],arrParameter[7],arrParameter[8],arrParameter[9]);
					        break;
					}
				}
			}
		}
		return returnValue;
	};
	
	NSUtil.prototype.callFunctionOfObject = function (obj,functionName,...args) 
	{
		var returnValue = null;
		if(obj) 
		{
			if (typeof obj[functionName] === "function") 
			{
				returnValue = obj[functionName](args);
			}
			else 
			{
	        	console.log(functionName + " does not exist or is not a function.");
	    	}
		}
		return returnValue;
	};
	
	NSUtil.prototype.isElementInDOM = function(node,doc) 
	{
		doc = this.getDoc(doc);
		return (node === doc.body) ? false : doc.body.contains(node);
	};
	
	NSUtil.prototype.isElementInParent = function(node,parent) 
	{
		if(node && parent)
		{
			while (node.parentNode) 
			{
	            if (node.parentNode === parent) 
	            {
	                return true;
	            }
	            node = node.parentNode;
	        }
		}
        return false;
	};
	
	NSUtil.prototype.isElementInOrParent = function(node,parent,onlyContains) 
	{
		if(node && parent)
		{
			onlyContains = Boolean.parse(onlyContains);
			return ((node === parent && !onlyContains) || this.isElementInParent(node,parent));
		}
        return false;
	};
	
	NSUtil.prototype.isElementInView = function(element,parent,doc) 
	{
		doc = this.getDoc(doc);
		var rect = element.getBoundingClientRect();
		var elem = element;
	    var top = rect.top;
	    var height = rect.height;
	    do 
	    {
	        if (elem && elem.parentNode) 
	        {
	            elem = elem.parentNode;
	            rect = elem.getBoundingClientRect();
	            if (!(top <= rect.bottom)) 
	            {
	                return false;
	            }
	            if (top + height <= rect.top) 
	            {
	                return false;
	            }
	        }
	    } 
	    while (elem && elem !== parent && elem.parentNode);
	    var retValue = (top <= ((doc.documentElement && doc.documentElement.clientHeight) || 0));
	    return retValue;
	};
	
	NSUtil.prototype.scrollIntoView = function(element,parent,doc) 
	{
		if(!this.isElementInView(element,parent,doc))
		{
			if (parent.clientHeight !== parent.scrollHeight) 
			{
				parent.scrollTop = element.offsetTop;
	        }
	        if (!this.isElementInView(element, parent, doc)) 
	        {
	        	element.scrollIntoView();
	        }
		}
	};
	
	NSUtil.prototype.isElementVisible = function(element,win) 
	{
		 if(element)
		 {
			 if(!element.offsetParent)
			 {
				 return false;
			 }
			 win = this.getWin(win);
			 var style = win.getComputedStyle(element);
			 if(style.display === "none" || style.visibility  === "hidden")
			 {
				 return false;
			 }
		 }
		 return true;
	};
	
	NSUtil.prototype.isFunction = function(refFunction,context) 
	{
		context = this.getWin(context);
	    if(refFunction && ((typeof refFunction == "function") || (typeof context[refFunction] === "function")))
	    {
	    	return true;
	    }
	    return false;
	};
	
	NSUtil.prototype.isString = function(object) 
	{
	    return typeof object == "string";
	};
	
	NSUtil.prototype.isNumber = function(object) 
	{
		try
		{
			if(typeof object == "number")
		    {
		    	return true;
		    }
		    var regex = /^([+\-])?[0-9]+(\.?)([0-9]+)?(e[0-9]+)?$/;
		    if (!object.match(regex)) 
		    {
	            return false;
	        }
	        value = parseFloat(object);
	        return !isNaN(value) && isFinite(value);
		}
	    catch(error)
	    {
	    	
	    }
	    return false;
	};
	
	NSUtil.prototype.isBoolean = function(object) 
	{
	    return typeof object == "boolean";
	};
	  
	NSUtil.prototype.isUndefined = function(object) 
	{
	    return typeof object == "undefined";
	};
	
	NSUtil.prototype.isUndefinedOrNull = function(object) 
	{
	    return (this.isUndefined(object) || object === null);
	};
	
	NSUtil.prototype.isStringValid = function(objString) 
	{
	    if(!objString || objString === "")
	    {
	    	return false;
	    }
	    return true;
	};
	
	NSUtil.prototype.toCamelCase = function(objString,isFirstLetterCapital) 
	{
		if(this.isString(objString))
		{
			return ((isFirstLetterCapital ? "-" : "") + objString).replace(/-+([^-])/g, function(str, char) 
					{
			    		return char.toUpperCase();
					});
		}
		return objString;
	};
	
	NSUtil.prototype.fromCamelCase = function(objString) 
	{
		if(this.isString(objString))
		{
			return objString.replace(/([A-Z]+)/g, function(match,letter) 
			{
		        return '-' + letter.toLowerCase();
		    });
		}
		return objString;
	};
	
	//"thisIsATest" --> "this-is-a-test"
	NSUtil.prototype.toKebabCase = function(objString) 
	{
		if(this.isString(objString))
		{
			objString.replace(/([A-Z])([A-Z])([a-z])/g, '$1-$2$3')
					 .replace(/([a-z])([A-Z])/g, '$1-$2')
					 .replace(/[\s_]+/g, '-')
					 .toLowerCase();
		}
		return objString;
	};
	
	
	
	/*
	 * 1001 - function validation failure
	 * 1002 - function return Parameter is not valid
	 */
	NSUtil.prototype.throwException = function (exceptionCode,exceptionName,exceptionDetails)
	{
		function nsException() 
		{
			   this.code = exceptionCode;
			   this.name = exceptionName;
			   this.details = exceptionDetails;
			   this.toString = function() 
			   {
			      return "Exception Occured with Code::" +  this.code + " and Details " +  this.name + "::" + this.details;
			   };
		}
	    //alert("Error Occured with details code: " + exceptionCode + ",name: " + exceptionName + ",details: " + exceptionDetails);
	    throw new nsException();
	};
	
	//other values of navigator.appName is "Netscape","Opera"
	//From IE 11 navigator.appName returns "Netscape" instead of "Microsoft Internet Explorer"
	//and From IE 11 it follows standard API.
	NSUtil.prototype.isBrowserIE = function ()
	{
	    if(navigator && ((navigator.appName && navigator.appName == "Microsoft Internet Explorer") || (navigator.userAgent && navigator.userAgent.match(/Trident/))))
	    {
	        return true;
	    }
	    return false;
	};
	
	NSUtil.prototype.getBrowser = function(win)
	{
		win = this.getWin(win);
		var objBrowser = {code:null,name:null,version:null,appName:null,appCodeName:null,platform:null,
						  isChrome:false,isFirefox:false,isOpera:false,isIE:false,isMSIE:false,isSafari:false};
		var userAgent = win.navigator.userAgent;
		if(userAgent.indexOf("Chrome") != -1) 
		{
			objBrowser.code = "chrome";
			objBrowser.name = "Google Chrome";
			objBrowser.isChrome = true;
		} 
		else if(userAgent.indexOf("Firefox") != -1) 
		{
			objBrowser.code = "firefox";
			objBrowser.name = "Mozilla Firefox";
			objBrowser.isFirefox = true;
		} 
		else if(userAgent.indexOf("Opera")!=-1) 
		{
			objBrowser.code = "opera";
			objBrowser.name = "Opera";
			objBrowser.isOpera = true;
		}
		//for IE version 6 to 11
		else if(userAgent.indexOf('MSIE')!=-1 || navigator.userAgent.indexOf('Trident') > -1)
		{
			objBrowser.code = "ie";
			objBrowser.name = "Internet Explorer";
			objBrowser.isIE = true;
			objBrowser.isMSIE = true;
		}
		//for IE 12
		else if(/x64|x32/ig.test(userAgent))
		{
			objBrowser.code = "ie";
			objBrowser.name = "Internet Explorer 12";
			objBrowser.isIE = true;
			objBrowser.isMSIE = false;
		}
		else if (userAgent.indexOf("Safari")!=-1) 
		{
			objBrowser.code = "safari";
			objBrowser.name = "Safari";
			objBrowser.isSafari = true;
		} 
		else 
		{
			objBrowser.code = "-1";
			objBrowser.name = "Unknown Browser";
		}
		objBrowser.version = navigator.appVersion;
		objBrowser.appName = navigator.appName;
		objBrowser.appCodeName = navigator.appCodeName;
		objBrowser.platform = navigator.platform;
		
		return objBrowser;
	};
	
	NSUtil.prototype.findParentBySelector = function (element,parentSelector,doc)
	{
	    if(element && parentSelector)
	    {
	    	var matchesFn = null;
	    	var parent = null;
	    	doc = this.getDoc(doc);
	    	['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(callback) 
	    	{
	            if (typeof doc.body[callback] == 'function') 
	            {
	                matchesFn = callback;
	                return true;
	            }
	            return false;
	        });
	
	        // traverse parents
	        while (element) 
	        {
	            parent = element.parentElement;
	            if (parent && parent[matchesFn](parentSelector)) 
	            {
	                return parent;
	            }
	            element = parent;
	        }
	    }
	    return null;
	};
	
	//navigates to the DOM Heirarchy to find the nearest parent of the specified HTML tag 
	NSUtil.prototype.findParent = function (element,param,querySelector,till)
	{
		var retElement = null;
	    if(element)
	    {
	    	var obj = this.getDomVariables();
	    	till = till ? till : obj.doc.body;
	    	if(param)
	    	{
	    		if(this.isString(param))
	    		{
	    			while(element) 
		    		{
		    			if(element.tagName && element.tagName.toLowerCase() == param.toLowerCase()) 
		    			{
		    				retElement = element;
		    			    break;
		    			}
		    			element = element.parentElement;
		    		}
	    		}
	    		else if(this.isFunction(param))
	    		{
	    			var start = element;
	    			do
		    		{
	    	            if (param(start)) 
	    	            {
	    	                return start;
	    	            }
	    	            if (start == till || !start.parentNode) 
	    	            {
	    	                break;
	    	            }
	    	            start = start.parentNode;
	    	        } 
	    			while (start && start !== till);
	    		}
	    	}
	    	else if(querySelector)
	    	{
	    		while(element) 
	    		{
	    			if(element.matches(querySelector)) 
	    			{
	    				retElement = element;
	    			    break;
	    			}
	    			element = element.parentElement;
	    		}
	    	}
	    }
	    return retElement;
	};
	
	//up
	NSUtil.prototype.findParentByCallback = function(element,callback,root)
	{
		if (!element || !this.isElementInOrParent(element,root)) 
		{
            return null;
        }
		var start = element;
        do 
        {
            if (callback && callback(start)) 
            {
                return start;
            }
            if (start === root || !start.parentNode) 
            {
                break;
            }
            start = start.parentNode;
        } 
        while(start && start !== root);
        return null;
	};
	
	NSUtil.prototype.findChild = function (element,childTag)
	{
	    if(element && childTag && element.getElementsByTagName(childTag).length > 0)
	    {
	        return element.getElementsByTagName(childTag)[0];
	    }  
	    return null;
	};
		
	//prev
	NSUtil.prototype.findPrevNode = function(node,callback,root,withChild) 
	{
		withChild = this.isUndefinedOrNull(withChild) ? true : Boolean.parse(withChild);
        return this.findNode(node,callback,root,false,"previousSibling",withChild ? "lastChild" : null);
    };
    
    //next
    NSUtil.prototype.findNextNode = function(node,callback,root,withChild) 
    {
    	withChild = this.isUndefinedOrNull(withChild) ? true : Boolean.parse(withChild);
        return this.findNode(node,callback,root,null,null,withChild ? "firstChild" : "");
    };
	
	//find
	NSUtil.prototype.findNode = function(node,callback,root,recursive,siblingProperty,childProperty) 
	{
		recursive = Boolean.parse(recursive);
		siblingProperty = this.isUndefinedOrNull(siblingProperty) ? "nextSibling" : siblingProperty;
		childProperty = this.isUndefinedOrNull(childProperty) ? "firstChild" : childProperty;
        if (recursive && callback(node)) 
        {
            return node;
        }
        var start = node;
        var next = null;
        do 
        {
            next = start[siblingProperty];
            if (callback(next)) 
            {
                return next ? next : null;
            }
            if (childProperty && next && next[childProperty]) 
            {
                var nextOne = this.findNode(next[childProperty],callback,next,true,siblingProperty,childProperty);
                if (nextOne) 
                {
                    return nextOne;
                }
            }
            if(!next) 
            {
                next = start.parentNode;
            }
            start = next;
        } 
        while (start && start !== root);
        return null;
    };
    
   //findWithCurrent
	NSUtil.prototype.findNodeWithCurrent = function(node,callback,root,siblingProperty,childProperty) 
	{
		siblingProperty = this.isUndefinedOrNull(siblingProperty) ? "nextSibling" : siblingProperty;
		childProperty = this.isUndefinedOrNull(childProperty) ? "firstChild" : childProperty;
        var next = node;
        do 
        {
        	if (callback(next)) 
            {
                return next || null;
            }
            if (childProperty && next && next[childProperty]) 
            {
                var nextOne = this.findNodeWithCurrent(next[childProperty],callback,next,siblingProperty,childProperty);
                if (nextOne) 
                {
                    return nextOne;
                }
            }
            while (next && !next[siblingProperty] && next != root) 
            {
				next = next.parentNode;
			}
			if (next && next[siblingProperty] && next != root) 
			{
				next = next[siblingProperty];
			}
        } 
        while (next && next != root);
        return null;
    };
    
    //each
    //It goes through all the children of the node calling a callback function
    NSUtil.prototype.loopAllChildren = function (element,callback) 
    {
        var node = element.firstChild;
        if (node) 
        {
            while (node) 
            {
                var next = this.findNextNode(node,Boolean,element);
                var value = callback(node);
                if(value == false) 
                {
                    return false;
                }
                // in case node is removed inside callback
                if(node.parentNode) 
                {
                	value = this.loopAllChildren(node,callback);
                    if(!value)
                    {
                    	return false;
                    }
                }
                node = next;
            }
        }
        return true;
    };
        
	NSUtil.prototype.getZIndex = function (element,doc) 
	{
		doc = this.getDoc(doc);
	    var zIndex = doc.defaultView.getComputedStyle(element).getPropertyValue("z-index");
	    if(element.tagName !== "BODY" && element.tagName !== "HTML" && isNaN(zIndex)) 
	    {
	    	return this.getZIndex(element.parentNode);
	    }
	    else 
	    {
	    	return zIndex; 
	    }
	};
	
	NSUtil.prototype.getStyleValue = function(element,styleProperty,getOrignalValue,getOnlyNumber,win)
	{
		win = this.getWin(win);
		var propertyValue = null;
		if(element && styleProperty && this.isElement(element))
		{
			element = this.getElement(element);
			getOrignalValue = this.isUndefined(getOrignalValue) ? true : getOrignalValue;
			var getValue = function(styleProp)
			{
				var retValue = null;
				if(element.style && element.style[styleProp])
			    {
					retValue = element.style[styleProp];
			    }
				else if(win.getComputedStyle)
				{
					retValue = win.getComputedStyle(element, null).getPropertyValue(styleProp);
				}
				return retValue;
			};
			if(styleProperty === "display")
			{
				propertyValue = getValue(styleProperty);
			}
			else
			{
				var displayValue = null;
				var setStyleValue = false;
				if(getOrignalValue)
				{
					displayValue = getValue("display");
					if(element.style.display)
					{
						setStyleValue = true;
					}
					element.style.display = "none";
				}
				propertyValue = getValue(styleProperty);
				if(getOrignalValue)
				{
					element.style.display = (displayValue && setStyleValue) ? displayValue: "";
				}
			}
			if(getOnlyNumber && !this.isUndefinedOrNull(propertyValue))
			{
				var numberFieldsReg = /^left|top|bottom|right|width|min|max|height|margin|padding|font-size/i;
				if (numberFieldsReg.test(styleProperty) && /^[\-+]?[0-9.]+px$/.test(propertyValue.toString())) 
				{
					propertyValue = parseInt(propertyValue.toString(), 10);
					propertyValue = this.isNumber(propertyValue) ? +propertyValue : propertyValue;
				}
			}
		 }
		 return propertyValue;
	};
	
	NSUtil.prototype.getControlValue = function(control)
	{
		if(control)
		{
			 if(control.tagName == "INPUT") 
			 {
	            if(control.type == "text") 
	            {
	            	return control.value;
	            }
	            if(control.type == "checkbox") 
	            {
	            	return control.checked;
	            }
	            if(control.type == "radio") 
	            {
	            	return control.checked;
	            }
	         }  
	         if(control.tagName == "SELECT") 
	         {
	        	 return control.value;
	         }
	         if(control.tagName == "TEXTAREA") 
	         {
	        	 return control.value;
	         }
		}
		return null;
	};
	
	NSUtil.prototype.setControlValue = function(control,value)
	{
		var retValue = null;
		if(control)
		{
			 if(control.tagName == "INPUT") 
			 {
	            if(control.type == "text") 
	            {
	            	retValue = value;
	            	control.value = value;
	            }
	            if(control.type == "checkbox") 
	            {
	            	retValue = Boolean.parse(value);
	            	control.checked = retValue;
	            }
	            if(control.type == "radio") 
	            {
	            	retValue = Boolean.parse(value);
	            	control.checked = retValue;
	            }
	         }  
	         if(control.tagName == "SELECT") 
	         {
	        	 retValue = value;
	        	 control.value = value;
	         }
		}
		return retValue;
	};
	
	//returns the top y coordinate of the given div used while listening to scrolling events(vertical scrolling)
	NSUtil.prototype.scrollTop = function (div)
	{
		 if(div)
		 {
		    return (div.scrollHeight - div.clientHeight);
		 }
		 return -1;
	};
	
	//returns the top x coordinate of the given div used while listening to scrolling events(horizontal scrolling)
	NSUtil.prototype.scrollLeft = function (div)
	{
		 if(div)
		 {
			 return (div.scrollWidth - div.clientWidth);
		 }
		 return -1;
	};
	
	//adds Style class to an element's styles list 
	NSUtil.prototype.addStyleClass = function (element,styleClass)
	{
	    if(element && styleClass && styleClass.length > 0)
	    {
	    	var arrStyleClass = styleClass.split(" ");
	        if(element.classList)
	        {
	        	for(var count = 0;count < arrStyleClass.length;count++)
	        	{
	        		if(!this.hasStyleClass(element,arrStyleClass[count]))
	                {
	                	element.classList.add(arrStyleClass[count]);
	                }
	        	}
	        }
	        else
	        {
	        	for(var count = 0;count < arrStyleClass.length;count++)
	        	{
		            if(!this.hasStyleClass(element,arrStyleClass[count]))
		            {
		            	if(element.className instanceof SVGAnimatedString)
		    			{
		            		if(element.getAttribute("class"))
		            		{
		            			element.setAttribute("class", element.getAttribute("class") + " " + arrStyleClass[count]);
		            		}
		            		else
		            		{
		            			element.setAttribute("class",arrStyleClass[count]);
		            		}
		    			}
		            	else
		            	{
		            		element.className += " " + arrStyleClass[count];
		            	}
		            }
	        	}
	        }
	    }
	};
	
	//returns true if a Style class is present in element's styles list
	NSUtil.prototype.hasStyleClass = function (element,styleClass)
	{
	    if(element && styleClass && styleClass.length > 0)
	    {
	    	try
	    	{
	    		if(!element.classList)
	            {
	    			if(element.className instanceof SVGAnimatedString)
	    			{
	    				return new RegExp('(\\s|^)' + styleClass + '(\\s|$)').test(element.getAttribute('class'));
	    			}
	    			else
	    			{
	    				return (element.className.indexOf(" " + styleClass) > -1);
	    			}
	            }
	            else if(element.classList.contains)
	            {
	            	return element.classList.contains(styleClass);
	            }
	    	}
	    	catch(error)
	    	{
	    		
	    	}
	        
	    }
	    return false;
	};
	
	//removes Style class from an element's styles list
	NSUtil.prototype.removeStyleClass = function(element,styleClass)
	{
	    if(element && styleClass && styleClass.length > 0)
	    {
	    	var arrStyleClass = styleClass.split(" ");
	    	if(element.classList)
	        {
		    	for(var count = 0;count < arrStyleClass.length;count++)
		    	{
		        	element.classList.remove(arrStyleClass[count]);
		        }
	    	}
	        else if(element.className)
	        {
	        	for(var count = 0;count < arrStyleClass.length;count++)
	        	{
		        	if(element.className instanceof SVGAnimatedString)
					{
		        		var removedClass = element.getAttribute('class').replace(new RegExp('(\\s|^)' + arrStyleClass[count] + '(\\s|$)', 'g'), '$2');
		        		if (this.hasStyleClass(arrStyleClass[count])) 
		        		{
		        		   this.setAttribute('class', removedClass);
		        		}
					}
		        	else
		        	{
		        		element.className = element.className.replace(arrStyleClass[count],"");
		        	}
	        	}
	        }
	    }
	};
	
	NSUtil.prototype.toggleStyleClass = function(element,styleClass)
	{
	    if(element && styleClass && styleClass.length > 0)
	    {
	   	 	this.hasStyleClass(element,styleClass) ? this.removeStyleClass(element,styleClass) : this.addStyleClass(element,styleClass); 
	    }
	};
	
	//change Style class from an element's styles list
	NSUtil.prototype.changeStyleClass = function (element,oldStyleClass,newStyleClass)
	{
	    if(element && oldStyleClass && oldStyleClass.length > 0 && newStyleClass && newStyleClass.length > 0)
	    {
	        if(element.classList)
	        {
	        	element.classList.remove(oldStyleClass);
	            if(!element.classList.contains(newStyleClass))
	            {
	                element.classList.add(newStyleClass);
	            }
	        }
	        else
	        {
	        	if(element.className instanceof SVGAnimatedString)
				{
	        		this.removeStyleClass(element,oldStyleClass);
	        		this.addStyleClass(element,newStyleClass);
				}
	        	else if(element.className)
	        	{
	        		element.className = element.className.replace(oldStyleClass,newStyleClass);
	        	}
	        }
	    }
	};
	
	NSUtil.prototype.css = function (element,key,value)
	{
		var self = this;
		var setStyle = function(prop)
		{
			var regexNumberProp = /^left|top|bottom|right|width|min|max|height|margin|padding|fontSize/i;
			var tempValue = styles[prop];
			if(tempValue !== undefined && tempValue !== null && regexNumberProp.test(prop) && self.isNumber(tempValue))
			{
				tempValue = tempValue + "px";
			}
			element.style[prop] = tempValue;
		};
		var styles;
	    if (this.isUndefined(value)) 
	    {
	        if (this.isString(key)) 
	        {
	            return element.style[key];
	        }
	        styles = key;
	    } 
	    else 
	    {
	        styles = {};
	        styles[key] = value;
	    }
	    for(var style in styles)
	    {
	    	setStyle(style);
	    }
	};
	
	NSUtil.prototype.addEvent = function(arrElement,eventType,listener,option)
	{
		if(arrElement)
		{
			if(!Array.isArray(arrElement))
			{
				arrElement = [arrElement];
			}
			var arrEventType = eventType.split(" ");
			var type = null;
			var element = null;
			for(var count = 0;count < arrEventType.length;count++)
			{
				type = arrEventType[count];
				if(type)
				{
					for(var eleCount = 0;eleCount < arrElement.length;eleCount++)
					{
						element = arrElement[eleCount];
						if(element)
						{
							if(!element.__nsEventListeners) 
							{
							    element.__nsEventListeners = {};
							}
							if(!element.__nsEventListeners[type]) 
							{
							    element.__nsEventListeners[type] = [];
							}
							(element.addEventListener) ? element.addEventListener(type,listener,option) : element.attachEvent("on" + type, listener);;
							element.__nsEventListeners[type].push({listener: listener,option: option});
						}
					}
				}
			}
		}
	};
	
	NSUtil.prototype.removeEvent = function(arrElement,eventType,listener,option)
	{
		if(arrElement)
		{
			function removeEvent(paramElement,paramType,paramListener,paramOption)
			{
				(paramElement.removeEventListener) ? paramElement.removeEventListener(paramType,paramListener,paramOption) : paramElement.detachEvent("on" + paramType, paramListener);
			};
			if(!Array.isArray(arrElement))
			{
				arrElement = [arrElement];
			}
			var arrEventType = eventType.split(" ");
			var type = null;
			var element = null;
			var item = null;
			for(var count = 0;count < arrEventType.length;count++)
			{
				type = arrEventType[count];
				if(type)
				{
					for(var eleCount = 0;eleCount < arrElement.length;eleCount++)
					{
						element = arrElement[eleCount];
						if(element)
						{
							if(listener == "all")
							{
								for(var lstCount = 0;lstCount < element.__nsEventListeners[type].length;lstCount++)
								{
									item = element.__nsEventListeners[type][lstCount];
									removeEvent(element,type,item.listener,item.option);
									element.__nsEventListeners[type].splice(lstCount,1);
								}
							}
							else
							{
								removeEvent(element,type,listener,option);
								if(element.__nsEventListeners && element.__nsEventListeners[type] && element.__nsEventListeners[type].length)
								{
									for(var lstCount = 0;lstCount < element.__nsEventListeners[type].length;lstCount++)
									{
										item = element.__nsEventListeners[type][lstCount];
										if(item.listener == listener)
										{
											element.__nsEventListeners[type].splice(lstCount,1);
										}
									}
								}
							}
						}
					}
				}
			}
		}
	};
	
	NSUtil.prototype.dispatchEvent = function(element,eventType,data,param,bubbles,cancelable,doc)
	{
		 var cancelled = false;
		 var event = null;
		 doc = this.getDoc(doc);
		 if(this.isUndefined(bubbles) || bubbles === null)
		 {
			 bubbles = true;
		 }
		 if(this.isUndefined(cancelable) || cancelable === null)
		 {
			 cancelable = false;
		 }
		 if (doc.createEvent) 
		 {
		    event = doc.createEvent("HTMLEvents",{ "detail": data});
		    event.initEvent(eventType, bubbles, cancelable);
		    try
			{
				var tempEvent = doc.createEvent("HTMLEvents");
				tempEvent.initEvent("nsPing", false, false);
				element.dispatchEvent(tempEvent);
			}
			catch(error)
			{
				event = event["__impl4cf1e782hg__"];
			}
		 } 
		 else 
		 {
		    event = doc.createEventObject();
		    event.eventType = eventType;
		    event.cancelBubble = !bubbles;
		    event.cancelable = cancelable;
		    try
			{
		    	var tempEvent = doc.createEventObject();
		    	tempEvent.eventType = "nsPing";
		    	tempEvent.cancelBubble = true;
		    	tempEvent.cancelable = false;
		    	element.fireEvent("on" + tempEvent.eventType, tempEvent);
			}
			catch(error)
			{
				event = event["__impl4cf1e782hg__"];
			}
		 }
		 event.eventName = eventType;
		 event.detail = data;
		 if(param)
		 {
			 for (var key in param) 
			 {
				 if(param.hasOwnProperty(key)) 
				 {
					 event[key] = param[key];
				 } 
			 }   
		 }
		 if(doc.createEvent) 
		 {
			cancelled = !element.dispatchEvent(event);
		 } 
		 else 
		 {
			cancelled = element.fireEvent("on" + event.eventType, event);
		 }
		 return cancelled;
	};
	
	//equivalent to jquery trigger
	NSUtil.prototype.triggerEvent = function(element,eventType,doc)
	{
		doc = this.getDoc(doc);
		// modern browsers, IE9+
		if ("createEvent" in doc) 
		{
	        var event = doc.createEvent("HTMLEvents");
	        event.initEvent(eventType, false, true);
	        element.dispatchEvent(event);
	    } 
		else 
		{
	        // IE 8
	        var event = doc.createEventObject();
	        event.eventType = eventType;
	        element.fireEvent("on" + event.eventType,event);
	    }
	};
	
	//https://stackoverflow.com/questions/11974262/how-to-clone-or-re-dispatch-dom-events
	NSUtil.prototype.redispatchEvent = function(element,originalEvent,doc)
	{
		var eventCopy = null;
		if (typeof Event === "function") 
		{
		    eventCopy = new originalEvent.constructor(originalEvent.type, originalEvent);
		} 
		else 
		{
		    // Internet Explorer
			doc = this.getDoc(doc);
			var arrEvents = ["MouseEvent","DragEvent","WheelEvent","PointerEvent","TouchEvent","TextEvent","CompositionEvent","KeyboardEvent","InputEvent","UIEvent","FocusEvent","Event"];
			var strFunc = originalEvent.constructor.toString();
			var eventType = null;
			for(var count = 0;count < arrEvents.length;count++)
			{
				if(strFunc.indexOf(arrEvents[count]) > -1)
				{
					eventType = arrEvents[count];
					break;
				}
			}
		    if(eventType)
			{
				eventCopy = doc.createEvent(eventType);
				if (originalEvent.getModifierState)
				  var modifiersList = allModifiers.filter(
					originalEvent.getModifierState,
					originalEvent
				  ).join(" ");
				
				if (eventType === "MouseEvent") 
				{
					eventCopy.initMouseEvent(originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
							  originalEvent.view, originalEvent.detail, originalEvent.screenX, originalEvent.screenY,
							  originalEvent.clientX, originalEvent.clientY, originalEvent.ctrlKey,
							  originalEvent.altKey, originalEvent.shiftKey, originalEvent.metaKey,
							  originalEvent.button, originalEvent.relatedTarget
							);
				}
				else if (eventType === "DragEvent")
				{ 
					eventCopy.initDragEvent(
					  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
					  originalEvent.view, originalEvent.detail, originalEvent.screenX, originalEvent.screenY,
					  originalEvent.clientX, originalEvent.clientY, originalEvent.ctrlKey,
					  originalEvent.altKey, originalEvent.shiftKey, originalEvent.metaKey,
					  originalEvent.button, originalEvent.relatedTarget, originalEvent.dataTransfer
					);
				}
				else if (eventType === "WheelEvent") eventCopy.initWheelEvent(
				  originalEvent.detail, originalEvent.screenX, originalEvent.screenY,
				  originalEvent.clientX, originalEvent.clientY, originalEvent.button,
				  originalEvent.relatedTarget, modifiersList,
				  originalEvent.deltaX, originalEvent.deltaY, originalEvent.deltaZ, originalEvent.deltaMode
				);
				else if (eventType === "PointerEvent") eventCopy.initPointerEvent(
				  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
				  originalEvent.view, originalEvent.detail, originalEvent.screenX, originalEvent.screenY,
				  originalEvent.clientX, originalEvent.clientY, originalEvent.ctrlKey,
				  originalEvent.altKey, originalEvent.shiftKey, originalEvent.metaKey,
				  originalEvent.button, originalEvent.relatedTarget,
				  originalEvent.offsetX, originalEvent.offsetY, originalEvent.width, originalEvent.height,
				  originalEvent.pressure, originalEvent.rotation,
				  originalEvent.tiltX, originalEvent.tiltY,
				  originalEvent.pointerId, originalEvent.pointerType,
				  originalEvent.timeStamp, originalEvent.isPrimary
				);
				else if (eventType === "TouchEvent") eventCopy.initTouchEvent(
				  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
				  originalEvent.view, originalEvent.detail, originalEvent.screenX, originalEvent.screenY,
				  originalEvent.clientX, originalEvent.clientY, originalEvent.ctrlKey,
				  originalEvent.altKey, originalEvent.shiftKey, originalEvent.metaKey,
				  originalEvent.touches, originalEvent.targetTouches, originalEvent.changedTouches,
				  originalEvent.scale, originalEvent.rotation
				);
				else if (eventType === "TextEvent") eventCopy.initTextEvent(
				  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
				  originalEvent.view,
				  originalEvent.data, originalEvent.inputMethod, originalEvent.locale
				);
				else if (eventType === "CompositionEvent") eventCopy.initTextEvent(
				  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
				  originalEvent.view,
				  originalEvent.data, originalEvent.inputMethod, originalEvent.locale
				);
				else if (eventType === "KeyboardEvent") eventCopy.initKeyboardEvent(
				  originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
				  originalEvent.view, originalEvent.char, originalEvent.key,
				  originalEvent.location, modifiersList, originalEvent.repeat
				);
				else if (eventType === "InputEvent" || eventType === "UIEvent")
				  eventCopy.initUIEvent(
					originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
					originalEvent.view, originalEvent.detail
				  );
				else if (eventType === "FocusEvent") eventCopy.initFocusEvent(
					originalEvent.type, originalEvent.bubbles, originalEvent.cancelable,
					originalEvent.view, originalEvent.detail, originalEvent.relatedTarget
				);
				else if(eventType === "Event")
				{
					eventCopy.initEvent(originalEvent.type, originalEvent.bubbles, originalEvent.cancelable);
				}
			}
		}
		element.dispatchEvent(eventCopy);
	};
	
	NSUtil.prototype.getDoc = function(doc)
	{
		doc = doc || document;
		return doc;
	};
	
	NSUtil.prototype.getWin = function(win)
	{
		win = win || window;
		return win;
	};
	
	//returns event for all kind of browser
	NSUtil.prototype.getEvent = function (event,win)
	{
		win = this.getWin(win);
		if (this.isUndefinedOrNull(event))
		{
			event = win.event;
		}
		if(event)
		{
			var touchEvent = null;
			if (event.targetTouches && event.targetTouches.length > 0) 
			{
				touchEvent = event.targetTouches[0];
		    } 
			else if (event.originalEvent && event.originalEvent.targetTouches && event.originalEvent.targetTouches.length > 0) 
			{
				touchEvent = event.originalEvent.targetTouches[0];
		    }
			else if(event["type"] && event.type.match(/^touch/) && event.changedTouches && event.changedTouches.length)
			{
				touchEvent = event.changedTouches[0];
			}
			if(event instanceof Event)
			{
				if(touchEvent)
				{
					var arrProp = ['clientX', 'clientY', 'pageX', 'pageY'];
					for(var count = 0;count < arrProp.length;count++)
					{
						var prop = arrProp[count];
						event[prop] = touchEvent[prop];
					}
					if (!event.touchEvent) 
					{
			            event.touchEvent = touchEvent;
			        }
				}
			}
		}
		return event;
	};
	
	//returns target for all kind of browser
	NSUtil.prototype.getTarget = function (event,doc)
	{
		event = this.getEvent(event);
		doc = this.getDoc(doc);
		var target = event.target ? event.target : event.srcElement;
		if(target && target instanceof SVGElement && event.currentTarget != doc)
		{
			target = event.currentTarget;
		}
		return target;
	};
	
	//preventDefault for all kind of browser
	NSUtil.prototype.preventDefault = function(event)
	{
		event = this.getEvent(event);
		if(event.preventDefault) 
		{
		   event.preventDefault();
		}
		else
		{
		   event.returnValue = false;
		}
	};
	
	NSUtil.prototype.preventDefaultForScrollKeys = function(event)
	{
		// left: 37, up: 38, right: 39, down: 40,
		var objKeys = {37: 1, 38: 1, 39: 1, 40: 1};
		event = this.getEvent(event);
		if (objKeys[event.keyCode]) 
		{
	        this.util.preventDefault(event);
	        return false;
	    }
	};
	
	//reference: http://www.broofa.com/Tools/Math.uuid.js
	NSUtil.prototype.getUniqueId = function () 
	{
	    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
	    var uuid = new Array(36);
	    var rnd=0;
	    var r;
	    
	    for (var count = 0; count < 36; count++) 
	    {
	      if (count==14) 
	      {
	        uuid[count] = '4';
	      } 
	      else 
	      {
	        if (rnd <= 0x02) 
	        {
	        	rnd = 0x2000000 + (Math.random()*0x1000000) | 0;
	        }
	        r = rnd & 0xf;
	        rnd = rnd >> 4;
	        uuid[count] = chars[(count == 19) ? (r & 0x3) | 0x8 : r];
	      }
	    }
	    return uuid.join('');
	 };
	 
	 NSUtil.prototype.addCSSClassInDOM = function(arrClassName,arrCSSText,checkExisting,doc)
	 {
		 doc = this.getDoc(doc);
		 if(doc.styleSheets && arrClassName && arrCSSText && arrCSSText.length === arrCSSText.length)
		 {
			 checkExisting = this.isUndefined(checkExisting) ? true : checkExisting;
			 var arrStyleSheet = doc.styleSheets;
			//var styleSheet = null;
			//var media = null; 
			//var styleSheetLength = arrStyleSheet.length;
			/* 1. search for media == "screen" */
			/*while(styleSheetLength > -1)
			{ 
				--styleSheetLength;
				// dont take into account the disabled stylesheets 
				if(arrStyleSheet[styleSheetLength].disabled) 
				{
					continue; 
				}
				media = arrStyleSheet[styleSheetLength].media;
				if(typeof media == "object")
				{
					media = media.mediaText;
				}
				if(media == "" || media=='all' || media.indexOf("screen") != -1)
				{
					styleSheet = arrStyleSheet[styleSheetLength];
					styleSheetLength = -1;   // indication that media=="screen" was found (if not, then styleSheetLength==0)
					break;
				}
			}*/
			var styleSheet = null;
			var styleSheetElement = doc.getElementById(this.__sheetId);
			/* if not found, create one */
			//if(styleSheetLength != -1)
			if(styleSheetElement)
			{
				styleSheet = styleSheetElement.sheet;
			}
			else
			{
				var head = doc.head || doc.getElementsByTagName('head')[0];
				styleSheetElement = doc.createElement("style");
				styleSheetElement.setAttribute("id",this.__sheetId);
				styleSheetElement.setAttribute("type","text/css");
				head.appendChild(styleSheetElement);
				styleSheet = doc.styleSheets[arrStyleSheet.length - 1]; /* take the new stylesheet to add the className and the style */
			}
			var existingCSSClassList = null;
			var classLength = arrCSSText.length; 
			var className = null;
			var cssText = null;
			/* 3. add the className and style */
			switch (typeof styleSheet.media) 
			{
				case "string":
					existingCSSClassList = styleSheet.rules;
					for(var count = 0;count < classLength;count++)
					{
						className = arrClassName[count];
						cssText = arrCSSText[count];
						if(!checkExisting || !this.modifyExistingClass(existingCSSClassList, className, cssText))
						{
							styleSheet.addRule(className, cssText);
						}
					}
					break;
				case "object":
					existingCSSClassList = styleSheet.cssRules;
					for(var count = 0;count < classLength;count++)
					{
						className = arrClassName[count];
						cssText = arrCSSText[count];
						if(!checkExisting || !this.modifyExistingClass(existingCSSClassList, className, cssText))
						{
							styleSheet.insertRule(className + "{" + cssText + "}", styleSheet.cssRules.length);
						}
					}
					break;
			}
		 }
	 };
	 NSUtil.prototype.removeCSSClassInDOM = function(arrClassName,doc)
	 {
		 doc = this.getDoc(doc);
		 if(doc.styleSheets && arrClassName)
		 {
			var styleSheet = null;
			var styleSheetElement = doc.getElementById(this.__sheetId);
			if(styleSheetElement)
			{
				styleSheet = styleSheetElement.sheet;
			}
			var existingCSSClassList = null;
			var classLength = arrClassName.length; 
			var className = null;
			if(styleSheet && styleSheet.media)
			{
				/* 3. add the className and style */
				switch (typeof styleSheet.media) 
				{
					case "string":
						existingCSSClassList = styleSheet.rules;
						for(var count = 0;count < classLength;count++)
						{
							className = arrClassName[count];
							if(this.removeExistingClass(styleSheet,existingCSSClassList, className))
							{
								return true;
							}
						}
						break;
					case "object":
						existingCSSClassList = styleSheet.cssRules;
						for(var count = 0;count < classLength;count++)
						{
							className = arrClassName[count];
							if(this.removeExistingClass(styleSheet,existingCSSClassList, className))
							{
								return true;
							}
						}
						break;
				}
			 }
		 }
	 };
	 /*
	  * If Class exists then modifies the content with new one and return true
	  * If Class does not exist it returns false
	  */
	 NSUtil.prototype.modifyExistingClass = function(existingCSSClassList,className,cssText)
	 {
		 if(existingCSSClassList && existingCSSClassList.length > 0)
		 {
			 var length = existingCSSClassList.length;
			 var cssClass = null;
			 for(var count = 0; count < length; count++) 
			 {
				cssClass = existingCSSClassList[count];
				if(cssClass.selectorText && cssClass.selectorText.toLowerCase() == className.toLowerCase()) 
				{
					cssClass.style.cssText = cssText;
					return true;
				}
			 }
		 }
		 return false;
	};
	
	NSUtil.prototype.removeExistingClass = function(styleSheet,existingCSSClassList,className)
	{
		 if(styleSheet && existingCSSClassList && existingCSSClassList.length > 0)
		 {
			 var length = existingCSSClassList.length;
			 var cssClass = null;
			 for(var count = 0; count < length; count++) 
			 {
				cssClass = existingCSSClassList[count];
				if(cssClass.selectorText && cssClass.selectorText.toLowerCase() == className.toLowerCase()) 
				{
					var isRemoved = false;
					if("deleteRule" in styleSheet) 
					{ 
						styleSheet.deleteRule(count); 
						isRemoved = true;
					}
				    else if("removeRule" in styleSheet) 
				    { 
				    	styleSheet.removeRule(count); 
				    	isRemoved = true;
				    }
					if(isRemoved)
					{
						return true;
					}
				}
			 }
		 }
		 return false;
	};
	 
	 NSUtil.prototype.addPseudoStyleFromExistingStyle = function(control,className,property,cssClassName,checkClassCallBack)
	 {
	 	var styleProperties = this.getCSSClass(cssClassName);
	 	if(checkClassCallBack)
	 	{
	 		styleProperties = checkClassCallBack(styleProperties);
	 	}
	 	var _head = doc.head || doc.getElementsByTagName('head')[0];
	 	var _sheet = doc.getElementById(this.__sheetId) || doc.createElement('style');
	 	_sheet.id = this.__sheetId;
	 	control.className +=  " " + className; 
	 	_sheet.innerHTML += "\n." + className + ":" + property + "{" +styleProperties + "}";
	 	_head.appendChild(_sheet);
	 };
	
	 NSUtil.prototype.getCSSClass = function(cssClassName,doc)
	 {
		doc = this.getDoc(doc);
	    if(!doc.styleSheets) 
	 	{
	 		return "";
	 	}
	 	var regEx = null;
	 	var styleSheets = doc.styleSheets;
	 	var counter = styleSheets.length;
	 	var result = [];
	    if(typeof cssClassName == "string") 
	 	{
	 		regEx = RegExp('\\b' + cssClassName + '\\b','i');
	 	}
	    while(counter)
	 	{
	     	var currentSheet = styleSheets[--counter];
	     	var cssRules = (currentSheet.rules) ? currentSheet.rules: currentSheet.cssRules;
	 		var cssRulesLength = cssRules.length;
	     	for(var count = 0 ; count < cssRulesLength; count++)
	 		{
	     		var tempClassDetails = cssRules[count].selectorText ? [cssRules[count].selectorText, cssRules[count].style.cssText]: [cssRules[count]+''];
	     		if(regEx.test(tempClassDetails[0])) 
	 			{
	 				result[result.length]= tempClassDetails;
	 			}
	     	}
	     }
	 	if(result && result.length === 1 && result[0] && result[0].length > 1)
	 	{
	 		return result[0][1];
	 	}
	     return result.join('\n\n');
	 };
	 
	 NSUtil.prototype.addStylesToHead = function(styleTagId, arrStyle) {
		 if(arrStyle && arrStyle.length) {
			 var style = document.createElement("style");
			 if(styleTagId) {
				 style.setAttribute("id",styleTagId);
			 }
			 style.textContent = arrStyle.join("\n");
			 document.head.appendChild(style);
			 return style;
		 }
		 return null;
	};
	 
	 NSUtil.prototype.convertCSSPropToJS = function(cssClassProp)
	 {
		 if(cssClassProp)
		 {
			 var arrIndex = this.indexesOf(cssClassProp,"-");
			 if(arrIndex && arrIndex.length > 0)
			 {
				 for(var count = 0;count < arrIndex.length; count++)
				 {
					 var index = arrIndex[count] + 1;
					 cssClassProp = cssClassProp.substring(0,index) + cssClassProp[index].toUpperCase() + cssClassProp.slice(index + 1);
				 }
				 cssClassProp = cssClassProp.replaceAll("-","");
			 }
		 }
		 return cssClassProp;
	 };
	 
	//CSS Property "transition","-o-transition","-ms-transition","-moz-transition","webkit-transition"
	 //Javascript Equivalent "transition","OTransition","msTransition","MozTransition","WebkitTransition"
	 NSUtil.prototype.getSupportedCSSPropertyName = function(arrPropertyNames,doc)
	 {
		 if(arrPropertyNames && arrPropertyNames.length > 0)
		 {
			 doc = this.getDoc(doc);
			 var root = doc.documentElement;
			 for (var count=0; count < arrPropertyNames.length; count++)
		 	 {
			 	 //if property exists on element (value will be string, empty string if not set)
				 if(arrPropertyNames[count] in root.style)
		 		 { 
					 return arrPropertyNames[count];
		 		 }
		 	 }
		 }
		 return null;
	 };
	 
	 NSUtil.prototype.throwNSError = function(componentName,message)
	 {
	 	throw new Error("Error in " + componentName + " with details::" + message);
	 };
	 
	 NSUtil.prototype.warning = function(componentName,message)
	 {
	 	console.warn("Warning in " + componentName + " with details::" + message);
	 };

	 NSUtil.prototype.info = function(componentName,message)
	 {
	 	console.info("Info in " + componentName + " with details::" + message);
	 };

	 NSUtil.prototype.debug = function(componentName,message)
	 {
	 	console.debug("Debugging Message in " + componentName + " with details::" + message);
	 };
	 
	 //gets the offset of the element 
	 //equivalent offset() of jquery
	 NSUtil.prototype.getOffSet = function(element, offset) 
	 {
		 if(!offset)
		 {
			 offset = {left : 0, top : 0};
		 }
		 if(element)
	     {
			offset.left += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			offset.top += (element.offsetTop - element.scrollTop + element.clientTop);
		    offset = this.getOffSet(element.offsetParent, offset);
	     }
		 return offset;
	 };
	 
	 NSUtil.prototype.setOffSet = function(element, offset) 
	 {
		 if(element && offset)
	     {
			var calculatePosition = false;
			var position = this.getStyleValue(element,"position",true);
			if (position === "static") 
			{
				element.style.position = "relative";
			}
			var currentOffset = this.getOffSet(element);
			var curCSSTop = element.style.top;
			var curCSSLeft =  element.style.left;
			var curTop,curLeft;
			calculatePosition = (position === "absolute" || position === "fixed" ) && (curCSSTop + curCSSLeft).indexOf( "auto" ) > -1;
			if (calculatePosition) 
			{
				var curPosition = this.getPosition(element);
				curTop = curPosition.top;
				curLeft = curPosition.left;
			} 
			else 
			{
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}
			if (offset.top != null) 
			{
				element.style.top = ((offset.top - currentOffset.top) + curTop) + "px";
			}
			if (offset.left != null) 
			{
				element.style.left = ((offset.left - currentOffset.left ) + curLeft) + "px";
			}
	     }
		 return offset;
	 };
	 
	//equivalent position() of jquery
	 NSUtil.prototype.getPosition = function(element,isElementScrollable,doc) 
	 {
		 if(isElementScrollable)
		 {
			 doc = this.getDoc(doc);
			 var self = this;
			 var offsetParent = function(node) 
			 {
				var offsetParent = node.offsetParent || doc.documentElement;
				while (offsetParent && offsetParent.tagName != "html" && self.getStyleValue(offsetParent,"position",false) === "static") 
				{
					offsetParent = offsetParent.offsetParent;
				}
				return offsetParent || doc.documentElement;
			 };
			 var offsetParent,offset,parentOffset = { top: 0, left: 0 };
			 // fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
			 if (this.getStyleValue(element,"position",false) === "fixed" ) 
			 {
				// we assume that getBoundingClientRect is available when computed position is fixed
				offset = element.getBoundingClientRect();
			 } 
			 else 
			 {
				offsetParent = offsetParent(element);
				// Get correct offsets
				offset = element.getBoundingClientRect();
				if(offsetParent.tagName != "html") 
				{
					parentOffset = offsetParent.getBoundingClientRect();
				}
	
				// Add offsetParent borders
				parentOffset.top  += this.getDimensionAsNumber(this.getStyleValue(offsetParent,"borderTopWidth",false));
				parentOffset.left += this.getDimensionAsNumber(this.getStyleValue(offsetParent,"borderLeftWidth",false));
			 }
			 // Subtract parent offsets and element margins
			 // note: when an element has margin: auto the offsetLeft and marginLeft
			 // are the same in Safari causing offset.left to incorrectly be 0
			 return {
				top:  offset.top  - parentOffset.top - this.getDimensionAsNumber(this.getStyleValue((element,"marginTop",false))),
				left: offset.left - parentOffset.left - this.getDimensionAsNumber(this.getStyleValue((element,"marginLeft",false)))
			 };
		 }
		 else
		 {
			 var offset = {left : 0, top : 0};
			 if(element)
		     {
				 offset = {left : element.offsetLeft, top : element.offsetTop};
		     }
			 return offset;
		 }
	 };
	 
	 NSUtil.prototype.getOffSetForElementRectangle = function(rectElement,doc,win) 
	 {
		  doc = this.getDoc(doc);
		  win = this.getWin(win);
		  var body = doc.body || doc.getElementsByTagName('body')[0];
		  var docElement = doc.documentElement || body.parentNode;
		  var clientTop  = docElement.clientTop  || body.clientTop  || 0;
		  var clientLeft = docElement.clientLeft || body.clientLeft || 0;
		  var scrollTop  = win.pageYOffset || docElement.scrollTop;
		  var scrollLeft = win.pageXOffset || docElement.scrollLeft;
		  
		  var top = rectElement.top  + scrollTop  - clientTop;
		  var left = rectElement.left + scrollLeft - clientLeft;
	
		  return {top:top,left:left};
	 };
	 
	 NSUtil.prototype.getOffSetByRect = function(element,doc) 
	 {
		 doc = this.getDoc(doc);
		 var rect = element.getBoundingClientRect();
		 var top = rect.top + doc.body.scrollTop;
		 var left = rect.left + doc.body.scrollLeft;
		 return {top:top,left:left};
	 };
	 
	 NSUtil.prototype.getDPI = function(doc)
	 {
		doc = this.getDoc(doc);
	 	var dpi = {width:0,height:0};
		var divDPI = this.createDiv(null,"nsGetDPI");
	    doc.body.appendChild(divDPI);
	    dpi.width = divDPI.offsetWidth;
	    dpi.height = divDPI.offsetHeight;
	    doc.body.removeChild(divDPI);
	 	
	 	return dpi;
	 };
	 
	//gives dimension for the visible part i.e. body or viewport
	 NSUtil.prototype.getBodyDimension = function(doc,win) 
	 {
		 doc = this.getDoc(doc);
		 win = this.getWin(win);
		 var objReturn = {};
		 objReturn.width = win.innerWidth || doc.documentElement.clientWidth || doc.body.offsetWidth;
		 objReturn.height = win.innerHeight || doc.documentElement.clientHeight || doc.body.offsetHeight;
		 return objReturn;
	 };
	 
	//gives dimension for the whole document i.e. with scroll bars
	 NSUtil.prototype.getDocumentDimension = function(doc) 
	 {
		 var objReturn = {};
		 doc = this.getDoc(doc);
		 objReturn.width = Math.max(
				 	doc.body.scrollWidth, doc.documentElement.scrollWidth,
				 	doc.body.offsetWidth, doc.documentElement.offsetWidth,
				 	doc.body.clientWidth, doc.documentElement.clientWidth
			    );
		 objReturn.height = Math.max(
				 	doc.body.scrollHeight, doc.documentElement.scrollHeight,
				 	doc.body.offsetHeight, doc.documentElement.offsetHeight,
				 	doc.body.clientHeight, doc.documentElement.clientHeight
			    );
		 return objReturn;
	 };
	 
	 //equivalent to jquery outerHeight
	 NSUtil.prototype.getOuterHeight = function(element,win)
	 {
		 var height = -1;
		 if(element)
		 {
			 win = this.getWin(win);
			 height = element.offsetHeight;
			 var style = win.getComputedStyle(element);
			 height += parseInt(style.marginTop) + parseInt(style.marginBottom);
		 }
		 return height;
	 };
	 //equivalent to jquery outerWidth
	 NSUtil.prototype.getOuterWidth = function(element,win)
	 {
		 var width = -1;
		 if(element)
		 {
			 win = this.getWin(win);
			 width = element.offsetWidth;
			 var style = win.getComputedStyle(element);
			 width += parseInt(style.marginLeft) + parseInt(style.marginRight);
		 }
		 return width;
	 };
	 
	 NSUtil.prototype.getInnerWidth = function(element, win) 
	 {
		 win = this.getWin(win);
		 var computedStyle = win.getComputedStyle(element);
		 var elementWidth = element.clientWidth;
		 elementWidth -= parseFloat(computedStyle.paddingLeft || "0") + parseFloat(computedStyle.paddingRight || "0");
		 return elementWidth;
	 };
	 
	 //returns measured width of text
	 NSUtil.prototype.getWidthOfText = function(text,fontSize,fontName,doc)
	 {	
		doc = this.getDoc(doc);
	 	var canvas = doc.createElement("canvas");
	 	var context = canvas.getContext("2d");
	 	var fontArgs = context.font.split(" ");
	 	if(fontSize)
	 	{
	 		fontArgs[0] = fontSize;
	 	}
	 	if(fontName)
	 	{
	 		fontArgs[1] = fontName;
	 	}
	 	context.font = fontArgs[0] + " " + fontArgs[1];        
	 	var width = context.measureText(text).width;
	 	return width;
	 };
	 
	 NSUtil.prototype.getMaxZIndex = function (element,doc) 
	 {
		 doc = this.getDoc(doc);
	     var currentzIndex = -1;
	     var maxZIndex = 0;
	     var checkZIndex = function(currElement)
	     {
	     	currentzIndex = doc.defaultView.getComputedStyle(currElement,null).getPropertyValue("z-index");
	     	currentzIndex = parseInt(currentzIndex, 10);
	     	maxZIndex = (currentzIndex) ? Math.max(maxZIndex, currentzIndex) : maxZIndex;
	     };
	     if(element)
	     {
	     	var currentElement = element;
	         while(currentElement)
	         {
	         	checkZIndex(currentElement);
	             currentElement = currentElement.offsetParent;
	         }
	     }
	     else
	     {
	     	var arrElements = doc.getElementsByTagName("*");
	         var length = arrElements.length;
	         for (var count = 0; count < length; count++) 
	         {
	         	checkZIndex(arrElements[count]);
	         }
	     }
	     return maxZIndex;
	 };
	
	 
	//function for scrollbar click detection
	 //pass event.clientX for mouse events
	 NSUtil.prototype.clickedOnScrollbar = function(element,mouseX)
	 {
		 if(element)
		 {
			 return (this.getOuterWidth(element) <= mouseX);
		 }
		 return false;
	 };
	 
	 //concept from https://tylercipriani.com/2014/07/12/crossbrowser-javascript-scrollbar-detection.html
	 NSUtil.prototype.hasScrollbar = function(element,axis,doc,win)
	 {
		 doc = this.getDoc(doc);
		 win = this.getWin(win);
		 if(!element)
		 {
			 element = doc.documentElement || doc.body;
		 }
	     var overflowStyle = null;
	     var overflowYStyle = null;
	 
		 if (typeof element.currentStyle !== 'undefined') 
		 {
		     overflowStyle = element.currentStyle.overflow;
		     overflowYStyle = element.currentStyle.overflowY;
		 }
		 overflowStyle = overflowStyle || win.getComputedStyle(element, "").overflow;
		 overflowYStyle = overflowYStyle || win.getComputedStyle(element, "").overflowY;
		
		 if (axis === 'x') 
		 {
		     var contentOverflows = element.scrollWidth > element.clientWidth,
		         overflowShown = /^(visible|auto)$/.test(overflowStyle), 
		         alwaysShowScroll = overflowStyle === 'scroll';
		     return (contentOverflows && overflowShown) || (alwaysShowScroll);
		 }
		 else if (axis === 'y') 
		 {
		     var contentOverflows = element.scrollHeight > element.clientHeight,
		         overflowShown = /^(visible|auto)$/.test(overflowYStyle), 
		         alwaysShowScroll = overflowYStyle === 'scroll';
		     return (contentOverflows && overflowShown) || (alwaysShowScroll);
		 }
		 else 
		 {
		     var contentOverflows = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
		         overflowShown    = /^(visible|auto)$/.test(overflowStyle) || /^(visible|auto)$/.test(overflowYStyle),
		         alwaysShowScroll = overflowStyle === 'scroll' || overflowYStyle === 'scroll';
		     
		     return (contentOverflows && overflowShown) || (alwaysShowScroll);
		 }
	 };
	 
	 NSUtil.prototype.isChildInParent = function(parent,child)
	 {
		 if(parent && child)
		 {
			 var contains = (parent === child || (parent.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_CONTAINED_BY));
			 return (contains > 0);
		 }
		 return false;
	 };
	 
	 //gives position where event has occured(like mouseClick) 
	 NSUtil.prototype.getEventPosition = function(event,parentWithScroll,doc) 
	 {
		  event = this.getEvent(event);
		  doc = this.getDoc(doc);
		  var left = 0;
		  var top = 0;
		  if (event.pageX || event.pageY) 
		  { 
			  left = event.pageX;
			  top = event.pageY;
		  }
		  else 
		  { 
			  left = event.clientX + doc.body.scrollLeft + doc.documentElement.scrollLeft; 
			  top = event.clientY + doc.body.scrollTop + doc.documentElement.scrollTop; 
		  }
		  if(parentWithScroll)
		  {
			  left += parentWithScroll.scrollLeft;
			  top += parentWithScroll.scrollTop;
		  }
		  return {left: left, top: top};
	 };
	 
	 NSUtil.prototype.getMouseOffset = function(event,element)
	 {
		 event = this.getEvent(event);
	     var elementPosition = this.getCumulativeOffset(element);
	     var mousePosition = this.getEventPosition(event);
	     return {x:(mousePosition.left - elementPosition.x), y:(mousePosition.top - elementPosition.y)};
	 };
	 
	 NSUtil.prototype.getMaxScrollPosition = function(element) 
	 {
		 var offset = {left : 0, top : 0};
		 if(element)
	     {
			 var maxX = element.scrollWidth - element.clientWidth;
	         var maxY = element.scrollHeight - element.clientHeight;
			 offset = {left : maxX, top : maxY};
	     }
		 return offset;
	 };
	 
	 
	 NSUtil.prototype.addTemplateInContainer = function(container,templateID) 
	 {
		 if(container && templateID)
		 {
			 var templateClone = this.getTemplate(templateID);
			 if(templateClone)
			 {
				 container.appendChild(templateClone);
			 }
		 }
	 };
	 
	 NSUtil.prototype.getTemplate = function(templateID,doc) 
	 {
		 var templateClone = null;
		 if(templateID)
		 {
			 doc = this.getDoc(doc);
			 if(typeof templateID === "string")
			 {
				 var template = doc.getElementById(templateID);
				 if(template)
				 {
					 if(this.supportsTemplate())
					 {
						 templateClone = template.content.children[0]; //doc.importNode(template.content, true); 
					 }
					 else
					 {
						 templateClone = template.cloneNode(true);
						 template.style.display = "none";
					 }
				 }
			 }
			 else
			 {
				 templateClone = templateID.cloneNode(true);
			 }
		 }
		 return templateClone;
	 };
	 
	 NSUtil.prototype.supportsTemplate = function(doc) 
	 {
		 doc = this.getDoc(doc);
		 return ("content" in doc.createElement('template'));
	 };
	 
	 NSUtil.prototype.getTemplateFromURL = function(url,callback,errorCallback,win) 
	 {
		 if(url)
		 {
			win = this.getWin(win);
			var xmlhttp;
			if (win.XMLHttpRequest)
			{// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			}
			else
			{// code for IE6, IE5
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.onreadystatechange=function()
			{
			  if(xmlhttp.readyState === 4)
			  {
				  if (xmlhttp.status === 200) 
				  {  
					  if(callback)
					  {
						  callback(xmlhttp.responseText);
					  }
			      } 
				  else 
				  {
					  console.debug("Error loading Template from URL:: " + url);
					  if(errorCallback)
					  {
						 errorCallback(xmlhttp.statusText);
					  }
			      }  
			  }
			};
			xmlhttp.open("GET",url,true);
			xmlhttp.send();
		 }
	 };
	 
	 NSUtil.prototype.supportsImports = function(doc) 
	 {
		 doc = this.getDoc(doc);
		 return ("import" in doc.createElement('link'));
	 };
	 
	 NSUtil.prototype.removeAllChildren = function(element) 
	 {
		if(element)
		{
			var node = element;
		    while (element.hasChildNodes()) 
		    {              
	
		        if (node.hasChildNodes()) 
		        {                
		            node = node.lastChild;                 
		        }
		        else 
		        {                                     
		            node = node.parentNode;                
		            node.removeChild(node.lastChild);      
		        }
		    }
		}
	 };
	 
	 NSUtil.prototype.getScrollBarWidth = function(element,doc)
	 {
		doc = this.getDoc(doc);
	 	var scrollBarWidth = 0;
	 	if(element)
	 	{
	 		scrollBarWidth = element.offsetWidth - element.clientWidth;
	 	}
	 	else
	 	{
	 		var divScroll = this.createDiv(null,"nsGetScrollBar");
	 		var divScrollChild = this.createDiv(null);
	 		divScroll.appendChild(divScrollChild);
	        doc.body.appendChild(divScroll);
	        var oldWidth = divScrollChild.getBoundingClientRect().width;
	        divScrollChild.style.height = "99px";
	        var newWidth = divScrollChild.getBoundingClientRect().width;
	        scrollBarWidth = oldWidth - newWidth;
	        doc.body.removeChild(divScroll);
	 	}
	 	return scrollBarWidth;
	 };
	 
	 NSUtil.prototype.getKeyUnicode = function(event) 
	 {
		 event = this.getEvent(event);
	     var unicode=event.keyCode ? event.keyCode : event.charCode;
	     return unicode;
	 };
	 
	 NSUtil.prototype.getNumber = function(objNumber) 
	 {
		 objNumber = Number(objNumber);
		 if(isNaN(objNumber))
		 {
			 objNumber = 0;
		 }
		 return objNumber;
	 };
	
	 NSUtil.prototype.getDimensionAsNumber = function(element,dimension)
	 {
	 	var retValue = 0;
	 	var dimensionUnit = this.getDimensionUnit(dimension);
		if(dimensionUnit === 1 && element && element.parentNode)
		{
			dimension = dimension.substring(0,dimension.length - 1);
			retValue = (dimension / 100) * element.parentNode.offsetHeight;
		}
		else if(dimensionUnit === 2)
		{
			retValue = dimension.substring(0,dimension.length - 2);
		}
		else
		{
			retValue = dimension;
		}
	 	if(retValue === "" || isNaN(retValue))
	 	{
	 		retValue = 0;
	 	}
	 	return parseInt(retValue);
	 };
	 
	 /*returns 0 if dimension has no unit
	  returns 1 if dimension is in %
	  returns 2 if dimension is in px 
	  returns -1 if dimension is not valid */ 
	 NSUtil.prototype.getDimensionUnit = function(dimensionValue)
	 {
	 	var retValue = -1;
	 	if(!this.isUndefined(dimensionValue) && dimensionValue != null )
	 	{
	 		retValue = 0;
	 		if(dimensionValue.toString().substring(dimensionValue.toString().length - 1) == "%")
	 		{
	 			retValue = 1;
	 		}
	 		else if(dimensionValue.toString().substring(dimensionValue.toString().length - 2) == "px")
	 		{
	 			retValue = 2;
	 		}
	 	}
	 	return retValue;
	 };
	 
	 NSUtil.prototype.getCumulativeOffset = function(element,tillElement)
	 {
	     var x = 0;
	     var y = 0;
	     var prevElement = null;
	     var currentElement = (element.offsetHeight > 0) ? element : element.firstChild;
	     while(currentElement && (!tillElement || (tillElement != prevElement)))
	     {
	         x += currentElement.offsetLeft;
	         y += currentElement.offsetTop;
	         prevElement = currentElement;
	         currentElement = currentElement.offsetParent;
	     }
	     return { x: x, y: y };
	 };
	 
	 NSUtil.prototype.round = function(num, decimalPlaces) 
	 {
	     return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
	 };
	  
	 NSUtil.prototype.makeElementUnselectable = function(element,makeChildrenUnselectable)
	 {
		 if(element)
		 {
			 if (element.nodeType == 1) 
		     {
				 element.setAttribute("unselectable", "on");
		     }
			 if(makeChildrenUnselectable)
			 {
				 var childElement = element.firstChild;
			     while (childElement) 
			     {
			    	 this.makeElementUnselectable(childElement,makeChildrenUnselectable);
			         childElement = childElement.nextSibling;
			     }
			 }
		 }
	 };
	 
	 NSUtil.prototype.makeBodyUnselectable = function(doc)
	 {
		 doc = this.getDoc(doc);
		 this.addStyleClass(doc.body,"nsUnselectable");
	 };
	 
	 NSUtil.prototype.makeBodySelectable = function(doc)
	 {
		 doc = this.getDoc(doc);
		 this.removeStyleClass(doc.body,"nsUnselectable");
	 };
	 
	
	NSUtil.prototype.startsWith = function(sourceString,searchString,caseSensitive) 
	{
		if(!sourceString || !searchString)
		{
			return false;
		}
		if(caseSensitive)
		{
			return sourceString.length >= searchString.length && sourceString.substring(0, searchString.length) === searchString;
		}
		return sourceString.length >= searchString.length && sourceString.substring(0, searchString.length).toLowerCase() === searchString.toLowerCase();
	};
	
	NSUtil.prototype.endsWith = function(sourceString,searchString,caseSensitive) 
	{
		if(!sourceString || !searchString)
		{
			return false;
		}
		if(caseSensitive)
		{
			return sourceString.length >= searchString.length && sourceString.substring(sourceString.length - searchString.length,sourceString.length) === searchString;
		}
		return sourceString.length >= searchString.length && sourceString.substring(sourceString.length - searchString.length,sourceString.length).toLowerCase() === searchString.toLowerCase();
	};
	
	NSUtil.prototype.contains = function(sourceString,searchString,startIndex,caseSensitive) 
	{
		if(!sourceString || !searchString)
		{
			return false;
		}
		if(isNaN(startIndex))
		{
			startIndex = 0;
		}
		if(caseSensitive)
		{
			return sourceString.length >= searchString.length && ''.indexOf.call(sourceString, searchString, startIndex) !== -1;
		}
		return sourceString.length >= searchString.length && ''.indexOf.call(sourceString.toLowerCase(), searchString.toLowerCase(), startIndex) !== -1;
	};
	
	NSUtil.prototype.indexesOf = function(sourceString,charToFind) 
	{
		var match = "";
	    var arrIndexes = [] ;
		if(sourceString && charToFind)
		{
			var regex = new RegExp(charToFind,"g");
			while (match = regex.exec(sourceString)) 
			{
				arrIndexes.push(match.index);
		    }
		}
		return arrIndexes;
	};
	
	NSUtil.prototype.checkRegexValue = function(strRegex,value) 
	{
		try
		{
			var regex = new RegExp(strRegex,"g");
		    return regex.test(value);
		}
	    catch(error)
	    {
	    	console.log("Invalid Regex with details::" + error.message);
	    }
	    return false;
	};
	
	NSUtil.prototype.isValueNull = function(value) 
	{
		if(value === null || this.isUndefined(value))
		{
			return true;
		}
		var nullValues = ["null"];
		var len = nullValues.length;
		for (var count = 0;count < len; count++)
		{
		    if (value === nullValues[count]) 
		    {
		    	return true;
		    }
		}
		return false;
	};
	
	//call when you want to wait for all the changes to complete
	NSUtil.prototype.debounce = function(callback,timeout) 
	{
		var timerID; 
	    var debounceHandler = function() 
	    {
	    	//shallow copy
	    	var args = [];
            for (var count = 0;count < arguments.length; count++) 
            {
                args[count] = arguments[count];
            }
	        if (!timeout) 
	        {
	        	callback.apply(null,args);
            }
	        else
	        {
	        	clearTimeout(timerID);
		        timerID = setTimeout(function(){callback.apply(null, args)}, timeout);
	        }
	    };
	    return debounceHandler;
	};
	
	//call when you want a function after certain interval
	NSUtil.prototype.throttle  = function(callback,timeout) 
	{
		var throttleTimeout = null;
		var storedEvent = null;
		var throttleHandler = function(event)
		{
			storedEvent = event;
			var shouldHandleEvent = !throttleTimeout;
		    if(shouldHandleEvent) 
		    {
		    	var func = function()
		    	{
		    		throttleTimeout = null;
		    		if(storedEvent) 
		    		{
		    			throttleHandler(storedEvent);
		    		}
		    	};
		    	callback(storedEvent);
		    	storedEvent = null;
		    	throttleTimeout = setTimeout(func,timeout);
		    }
		};
		return throttleHandler;
	};
	
	NSUtil.prototype.highlightText = function(container,searchText,styleClass,doc) 
	{
		doc = this.getDoc(doc);
		function innerHighlight(node,text,styleClass) 
		{
			  var skip = 0;
			  if (node.nodeType == 3) 
			  {
				   var position = node.data.toUpperCase().indexOf(text);
				   position -= (node.data.substr(0, position).toUpperCase().length - node.data.substr(0, position).length);
				   if (position >= 0) 
				   {
						var spannode = doc.createElement("span");
						spannode.className = styleClass;
						var middlebit = node.splitText(position);
						var endbit = middlebit.splitText(text.length);
						var middleclone = middlebit.cloneNode(true);
						spannode.appendChild(middleclone);
						middlebit.parentNode.replaceChild(spannode, middlebit);
						skip = 1;
				   }
			  }
			  else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) 
			  {
				   for (var count = 0; count < node.childNodes.length; ++count) 
				   {
						count += innerHighlight(node.childNodes[count], text,styleClass);
				   }
			  }
			  return skip;
		}
		if(container && searchText)
		{
			if(!styleClass)
			{
				styleClass = "nsTextHighlight";
			}
			var util = new NSUtil();
			if(util.isArray(searchText))
			{
				 for (var count = 0; count < searchText.length; count++) 
				 {
					 innerHighlight(container,searchText[count].toUpperCase(),styleClass);
				 }
			}
			else
			{
				innerHighlight(container,searchText.toUpperCase(),styleClass);
			}
			
		}
	};
	
	NSUtil.prototype.unHighlightText = function(container,styleClass) 
	{
		if(container)
		{
			if(!styleClass)
			{
				styleClass = "nsTextHighlight";
			}
			var arrHighlight = container.querySelectorAll("span." + styleClass); 
			if(arrHighlight && arrHighlight.length > 0)
			{
				var elementHighlight = null;
				var length = arrHighlight.length;
				for(var count = 0;count < length;count++)
				{
					elementHighlight = arrHighlight[count];
					if(elementHighlight)
					{
						elementHighlight.parentNode.replaceChild(elementHighlight.firstChild, elementHighlight);
					}
				}
			}
		}
	};
	
	 var falseExpression = /^(?:f(?:alse)?|no?|0+)$/i;
	 Boolean.parse = function(value) 
	 { 
	    return !falseExpression.test(value) && !!value;
	 };
	
	//Defining the indexOf function (before you call it!) if it doesn't exist taken from MDN (for Internet Explorer 8 and below)
	if (!Array.prototype.indexOf)
	{
	   Array.prototype.indexOf = function (searchElement /*, fromIndex */ )
	   {
	     'use strict';
	     if (this == null)
	     {
	       throw new TypeError();
	     }
	     var n, k, t = Object(this),
	         len = t.length >>> 0;
	     if (len === 0)
	     {
	       return -1;
	     }
	     n = 0;
	     if (arguments.length > 1) 
	     {
	       n = Number(arguments[1]);
	       if (n != n)
	       { // shortcut for verifying if it's NaN
	         n = 0;
	       }
	       else if (n != 0 && n != Infinity && n != -Infinity)
	       {
	         n = (n > 0 || -1) * Math.floor(Math.abs(n));
	       }
	     }
	     if (n >= len)
	     {
	       return -1;
	     }
	     for (k = n >= 0 ? n : Math.max(len - Math.abs(n), 0); k < len; k++)
	     {
	       if (k in t && t[k] === searchElement)
	       {
	         return k;
	       }
	     }
	     return -1;
	   };
	}
	
	//JavaScript Array filter
	if (!Array.prototype.filter) 
	{
	    Array.prototype.filter = function(fun /*, thisp*/) 
	    {
	        var len = this.length >>> 0;
	        if (typeof fun != "function") 
	        {
	            throw new TypeError();
	        }
	        var res = [];
	        var thisp = arguments[1];
	        for (var count = 0; count < len; count++) 
	        {
	            if (count in this) 
	            {
	                var val = this[count]; // in case fun mutates this
	                if (fun.call(thisp, val, count, this)) 
	                {
	                    res.push(val);
	                }
	            }
	        }
	
	        return res;
	    };
	}
	
	if (!String.prototype.replaceAll) 
	{
		String.prototype.replaceAll = function(character,replaceChar)
		{
		    var word = this.valueOf();
		    while(word.indexOf(character) != -1)
		    {
		    	word = word.replace(character,replaceChar);
		    }
		    return word;
		};
	}
	
	if (!HTMLTableRowElement.prototype.update) 
	{
		HTMLTableRowElement.prototype.update = function()
		{
			var util = new NSUtil();
			var grid = util.findParent(this,"ns-grid");
			if(grid)
			{
				grid.updateRow(parseInt(this.getAttribute("index")));
			}
		};
	}
	
	//From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
	if (!Object.keys) 
	{
	  Object.keys = (function() {
	    'use strict';
	    var hasOwnProperty = Object.prototype.hasOwnProperty,
	        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
	        dontEnums = [
	          'toString',
	          'toLocaleString',
	          'valueOf',
	          'hasOwnProperty',
	          'isPrototypeOf',
	          'propertyIsEnumerable',
	          'constructor'
	        ],
	        dontEnumsLength = dontEnums.length;
	
	    return function(obj) {
	      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
	        throw new TypeError('Object.keys called on non-object');
	      }
	
	      var result = [];
	
	      for (var prop in obj) {
	        if (hasOwnProperty.call(obj, prop)) {
	          result.push(prop);
	        }
	      }
	
	      if (hasDontEnumBug) {
	        for (var i = 0; i < dontEnumsLength; i++) {
	          if (hasOwnProperty.call(obj, dontEnums[i])) {
	            result.push(dontEnums[i]);
	          }
	        }
	      }
	      return result;
	    };
	  }());
	}
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	if (!Array.prototype.find) 
	{
		  Array.prototype.find = function(predicate) 
		  {
		    if (this === null) {
		      throw new TypeError('Array.prototype.find called on null or undefined');
		    }
		    if (typeof predicate !== 'function') {
		      throw new TypeError('predicate must be a function');
		    }
		    var list = Object(this);
		    var length = list.length >>> 0;
		    var thisArg = arguments[1];
		    var value;
		
		    for (var i = 0; i < length; i++) {
		      value = list[i];
		      if (predicate.call(thisArg, value, i, list)) {
		        return value;
		      }
		    }
		    return undefined;
		  };
	}
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
	if (!Array.prototype.findIndex) 
	{
		  Array.prototype.findIndex = function(predicate) {
		    if (this === null) {
		      throw new TypeError('Array.prototype.findIndex called on null or undefined');
		    }
		    if (typeof predicate !== 'function') {
		      throw new TypeError('predicate must be a function');
		    }
		    var list = Object(this);
		    var length = list.length >>> 0;
		    var thisArg = arguments[1];
		    var value;
	
		    for (var i = 0; i < length; i++) {
		      value = list[i];
		      if (predicate.call(thisArg, value, i, list)) {
		        return i;
		      }
		    }
		    return -1;
		  };
	}
	
	if (!Array.from) 
	{
	    Array.from = function (object) 
	    {
	        return [].slice.call(object);
	    };
	}
	
	if (!String.prototype.format) 
	{
		String.prototype.format = function()
		{
		   var content = this;
		   for (var i=0; i < arguments.length; i++)
		   {
		        var replacement = '{' + (i + 1) + '}';
		        content = content.replace(replacement, arguments[i]);  
		   }
		   return content;
		};
	};
	
	
	NSUtil.prototype.defaultRenderer = function(doc)
	{
		this.util = new NSUtil();
		doc = this.util.getDoc(doc);
		this.divItemRenderer = null;
		
		this.getRenderer = function()
		{
			if(!this.divItemRenderer)
			{
				this.__createComponents();
			}
			return this.divItemRenderer;
		};
		
		this.setData = function(renderer,item,labelField)
		{
			if(renderer)
			{
				if(item && item[labelField])
				{
					renderer.rendererBody.rendererLabel.innerHTML = item[labelField];
				}
				else
				{
					this.clearData(renderer);
				}
			}
			
		};
		
		this.clearData = function(renderer)
		{
			if(renderer)
			{
				renderer.rendererBody.rendererLabel.innerHTML = "";
			}
		};
		
		this.__createComponents = function()
		{
			this.divItemRenderer = this.util.createDiv(null,"nsListRenderer"); 
			//this.divItemRenderer.style.height = 20 + "px";
			this.divItemRenderer.style.padding = 1 + "px";
			this.divItemRenderer.setAttribute("accessor-name","rendererBody"); 
			var lblItemRenderer = doc.createElement("LABEL");
			lblItemRenderer.setAttribute("accessor-name","rendererLabel");
			this.divItemRenderer.appendChild(lblItemRenderer);
		};
	};
	
	NSUtil.prototype.fadeIn = function(element,displayType,callback,win)
	{
		if(element)
		{
			win = this.getWin(win);
			var util = this;
			element.style.opacity = 0;
			element.style.display = displayType || "block";
			(function fade() 
			 {
			    var value = parseFloat(element.style.opacity);
			    if (!((value += .1) > 1)) 
			    {
			    	element.style.opacity = value;
			    	util.getRequestAnimationFrame.bind(win)(fade.bind(util));
			    }
			    else
			    {
			    	if(callback)
			      	{
			    		callback(element);
			      	}
			    }
			 })();
		}
	};
	
	NSUtil.prototype.fadeOut = function(element,callback,win)
	{
		if(element)
		{
			var util = this;
			win = this.getWin(win);
			element.style.opacity = 1;
			(function fade() 
			{
			    if((element.style.opacity -= .1) < 0) 
			    {
			      element.style.display = "none";
			      if(callback)
			      {
			    	  callback(element);
			      }
			    } 
			    else 
			    {
			    	util.getRequestAnimationFrame.bind(win)(fade.bind(util));
			    }
			})();
		}
	};
	
	NSUtil.prototype.addAnimatedLineOnHover = function(element,config)
	{
		if(element)
		{
			if(!config)
			{
				config = {};
			}
			var setting = {
					lineWidth : (config.lineWidth) ? config.lineWidth : element.offsetWidth,
					lineHeight : (config.lineHeight) ? config.lineHeight : 5,
					lineColor : (config.lineColor) ? config.lineColor : "black",
					offsetX : (config.offsetX) ? config.offsetX : 0,
					offsetY : (config.offsetY) ? config.offsetY : 0,
			};
			var offset = this.getCumulativeOffset(element);
			var id = element.getAttribute("id");
			if(!id)
			{
				id = this.getUniqueId();
			}
			var styleName = "ns" + id + "line";
			this.addCSSClassInDOM(["." + styleName + ":after"],["content: '';position: absolute;height: " + setting.lineHeight + "px;width: 0%;left: " + (offset.x + setting.offsetX) + "px;" +
															 "top: " + (offset.y + element.offsetHeight + setting.offsetY) + "px;" +
															 "background-color: " + setting.lineColor + ";-webkit-transition: width 200ms ease-in;transition: width 200ms ease-in;"]);
			this.addCSSClassInDOM(["." + styleName + ":hover:after"],["width:" + setting.lineWidth + "px;"]);
			this.addStyleClass(element,styleName);
		}
	};
	
	NSUtil.prototype.getTextBetweenSymbol = function(strText,startSymbol,endSymbol)
	{
		var arrReturn = null;
		if(strText)
		{
			if(!startSymbol)
			{
				startSymbol = "{{";
			}
			if(!endSymbol)
			{
				endSymbol = "}}";
			}
			var regexString = "\\" + startSymbol + "([^" + endSymbol + "]+)\\" + endSymbol;
			var regex = new RegExp(regexString,"g");
			var arrMatches = strText.match(regex);
			if(arrMatches && arrMatches.length > 0)
			{
				arrReturn = [];
				var length = arrMatches.length;
				var subStrLength = startSymbol.length;
				for (var count = 0; count < length; count++) 
				{
				    var match = arrMatches[count];
				    arrReturn.push(match.substring(subStrLength,match.length - subStrLength));
				}
			}
		}
		return arrReturn;
	};
	
	NSUtil.prototype.isBinary = function(str) 
	{
		var isBuffer = (typeof Buffer == 'undefined')? false : Buffer.isBuffer(str);
		for (var count = 0;count < 24;count++) 
		{
			var charCode = isBuffer ? str[count] : str.charCodeAt(count);
			if (charCode === 65533 || charCode <= 8) 
			{
				return true;
			}
		}
		return false;
	};
	
	NSUtil.prototype.resolveFunctionOrPromise = function(obj,callback)
	{
		if(obj)
		{
			//if(Object.prototype.toString.call(obj) === "[object Promise]")
			if (obj instanceof Promise && typeof obj.then === 'function')
			{
				obj.then(function(objRef){
					callback.apply(null,[objRef]);
                });
			}
			else
			{
				callback.apply(null,[obj]);
			}
		}
		else
		{
			callback();
		}
	};
	
	//from https://github.com/sindresorhus/is-svg/blob/master/index.js
	NSUtil.prototype.isSVGString = function(str) 
	{
		if(str)
		{
			var cleanEntities = function(svg)
			{
				var entityRegex = /\s*<!Entity\s+\S*\s*(?:"|')[^"]+(?:"|')\s*>/img;
				return svg.replace(entityRegex, '');
			};
			var commentRegex = /<!--([\s\S]*?)-->/g;
			var regex = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!doctype svg[^>]*\s*(?:\[?(?:\s*<![^>]*>\s*)*\]?)*[^>]*>\s*)?(?:<svg[^>]*>[^]*<\/svg>|<svg[^/>]*\/\s*>)\s*$/i;
			var isSvg = Boolean(str) && !this.isBinary(str) && regex.test(cleanEntities(str.toString()).replace(commentRegex,""));
			return isSvg;
		}
		return false;
	};
	
	NSUtil.prototype.isBase64String = function(str) 
	{
		if(str)
		{
			var regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
			return !!str.match(regex);
		}
		return false;
	};
	
	NSUtil.prototype.convertSvgToBase64 = function(svgText,callback,doc) 
	{
	   if(svgText)
	   {
		   doc = this.getDoc(doc);
		   var svg = null;
		   if(svgText instanceof SVGElement) 
		   {
			   svg = svgText;
		   }
		   else
		   {
			   var span = doc.createElement("span");
			   span.innerHTML = svgText;
			   doc.body.appendChild(span);
			   svg = span.children[0];
			   doc.body.removeChild(span);
		   }
		   var canvas = doc.createElement("canvas");
		   canvas.width = svg.getBoundingClientRect().width;
	       canvas.height = svg.getBoundingClientRect().height;
	       doc.body.appendChild(canvas);
	       var svgXml = (new XMLSerializer()).serializeToString(svg);
	       var ctx = canvas.getContext('2d');
	       var img = new Image();
	       img.onload = function() 
	       {
	            ctx.drawImage(img, 0, 0);
	       };
	       img.src = 'data:image/svg+xml;base64,' + btoa(svgXml);
	       var base64 = img.src;
	       //to handle the callback inside onload of img
	       if(callback)
	       {
	    	   callback(base64);
	       }
	       doc.body.removeChild(canvas);
		   return base64;
	   }
	   return null;
	};
	
	NSUtil.prototype.convertImageToBase64 = function(src,forceCloneImg,crossOrigin,doc) 
	{
		if(src)
		{
		   doc = this.getDoc(doc);
		   var img = null;
		   var origImg = null;
		   var isAdded = false;
		   var dataURL = null;
		   if(this.isElement(src) && this.isElementOfType(src,"img") && !forceCloneImg) 
		   {
			   img = src;
		   }
		   else
		   {
			   if(this.isElement(src) && this.isElementOfType(src,"img") && forceCloneImg) 
			   {
				   origImg = src;
				   crossOrigin = (this.isUndefinedOrNull(crossOrigin) && origImg.hasAttribute("crossOrigin")) ? origImg.getAttribute("crossOrigin") : null;
				   src = origImg.getAttribute("src");
			   }
			   img = doc.createElement("img");
			   this.css(img,{position: "absolute",left: "-9999px",top: "-9999px"});
			   img.setAttribute("src", src);
			   if(crossOrigin)
			   {
				   img.setAttribute("crossOrigin",crossOrigin);
			   }
			   doc.body.appendChild(img);
			   isAdded = true;
		   }
		   var self = this;
		   var objPromise = new Promise(function(resolve,reject)
		   {
			   var callCallback = function()
			   {
				   var canvas = doc.createElement("canvas");
				   canvas.width = (origImg && origImg.width) ? origImg.width : img.width;
			       canvas.height = (origImg && origImg.height) ? origImg.height :img.height;
			       doc.body.appendChild(canvas);
			       var ctx = canvas.getContext('2d');
			       ctx.clearRect(0, 0, canvas.width, canvas.height);
			       ctx.drawImage(img, 0, 0);
			       var hasError = false;
			       var errorDetails = null;
			       //mainly for Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
			       try
			       {
			    	   dataURL = canvas.toDataURL();
			       }
			       catch(error)
			       {
			    	   hasError = true;
			    	   errorDetails = error;
			       }
				   doc.body.removeChild(canvas);
				   if(dataURL != "data:," || hasError)
				   {
				       if(isAdded)
				       {
				    	   if(img && img.parentNode)
					       {
				    		   img.parentNode.removeChild(img);
					       }
				       }
				       resolve({base64:dataURL,param:src,hasError: hasError,errorDetails: errorDetails});
				   }
			   };
			   img.onload = function() 
		       {
				   callCallback();
		       };
		       callCallback();
		   });
		   return objPromise;
		}
		return null;	
	};
	
	//Converts rgba text representation of color in hex
	NSUtil.prototype.colorToHex = function (color)
	{
		if (color === 'rgba(0, 0, 0, 0)' || color == '') 
		{
			return null;
		}
		if (!color) 
		{
			return '#000000';
		}
		if (color.substr(0, 1) === '#') 
		{
			return color;
		}
		var digits = /([\s\n\t\r]*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color) || /([\s\n\t\r]*?)rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(color);
		if (!digits) 
		{
			return '#000000';
		}
		var red = parseInt(digits[2],10);
		var green = parseInt(digits[3],10);
		var blue = parseInt(digits[4],10);
		var rgb = blue | (green << 8) | (red << 16);
		var hex = rgb.toString(16).toUpperCase();
		while (hex.length < 6) 
		{
			hex = '0' + hex;
		}
		return digits[1] + '#' + hex;
	};
	
	NSUtil.prototype.groupCollection = function(dataSource,setting)
	{
		this.__dataSource = dataSource;
		this.__util = new NSUtil();
		this.__childField = null;
		this.__parentLevelIndicatorField = null;
		this.__isSingleLevel = true;
		this.__groupField = null;
		this.__childrenCountField = null;
		if(setting)
		{
			this.__childField = setting["childField"];
			this.__parentLevelIndicatorField = setting["parentLevelIndicatorField"];
			this.__isSingleLevel = setting["isSingleLevel"];
			this.__groupField = setting["groupField"];
			this.__childrenCountField = setting["childrenCountField"];
		}
		if(!this.__childField)
		{
			this.__childField = "children";
		}
		if(!this.__parentLevelIndicatorField)
		{
			this.__parentLevelIndicatorField = "ns-IsParent";
		}
		if(this.__util.isUndefined(this.__isSingleLevel))
		{
			this.__isSingleLevel = true;
		}
		if(!this.__groupField)
		{
			this.__groupField = "nsGroup";
		}
		if(!this.__childrenCountField)
		{
			this.__childrenCountField = "nsChildrenCountField";
		}
		this.groupBy = function(arrGroupField)
		{
			var arrResult = this.__dataSource;
	  	    if(arrGroupField && arrGroupField.length > 0)
	  	    {
	  	    	if(this.__isSingleLevel)
	  	    	{
	  	    		arrResult = this.__groupByFieldOnSingleLevel(this.__dataSource,arrGroupField);
	  	    	}
	  	    	else
	  	    	{
	  	    		arrResult = this.__groupByFieldOnMultiLevel(this.__dataSource,arrGroupField);
	  	    	}
	  	    	
	  	    }
	  	    return arrResult;
		};
		
		this.__groupByFieldOnSingleLevel = function(list,arrGroupField)
		{
			var groups = {};
			if(list)
			{
				for (var count = 0; count < list.length; count++) 
		  	    {
		  	    	var item = list[count];
		  	    	var arrItems = this.__getGroupItemValues(item,arrGroupField);
		  	        var group = JSON.stringify(arrItems);
		  	        if (group in groups) 
		  	        {
		  	            groups[group][this.__childField].push(item); 
		  	        } 
		  	        else 
		  	        {
		  	        	var objEmpty = this.__createEmptyItem(list[count]);
		  	        	objEmpty[this.__parentLevelIndicatorField] = true;
		  	        	for(var fieldCount = 0;fieldCount < arrGroupField.length;fieldCount++)
		  	    		{
		  	        		var fieldName = arrGroupField[fieldCount];
		  	        		objEmpty[fieldName] = item[fieldName];
		  	    		}
		  	        	objEmpty[this.__childField] = [];
		  	        	objEmpty[this.__childField].push(item); 
		  	            groups[group] = objEmpty;
		  	        }
		  	    }
			}
	  	    return this.__arrayFromObject(groups);
		};
		
		this.__getGroupItemValues = function(item,arrGroupField)
		{
			var arrResult = [];
			if(item && arrGroupField && arrGroupField.length > 0)
	    	{
	    		for(var count = 0;count < arrGroupField.length;count++)
	    		{
	    			var fieldValue = item[arrGroupField[count]];
	    			if(!this.__util.isUndefined(fieldValue) && fieldValue != null)
	    			{
	    				arrResult.push(fieldValue);
	    			}
	    		}
	    	}
			return arrResult;
		};
		
		this.__groupByFieldOnMultiLevel = function(list,arrGroupField)
		{
			var arrSource = list;
			for(var fieldCount = 0;fieldCount < arrGroupField.length;fieldCount++)
	  		{
	      		var fieldName = arrGroupField[fieldCount];
	      		arrSource = this.__groupByField(arrSource,fieldName);
	  		}
			return arrSource;
		};
		
		this.__groupByField = function(source,field)
		{
			var arrReturn = [];
			if(source && field)
			{
				var groups = {};
				for (var count = 0; count < source.length; count++) 
		  	    {
					var item = source[count];
					if(item.hasOwnProperty(this.__childField) && item[this.__childField].length > 0)
					{
						var arrChildren = this.__groupByField(item[this.__childField],field);
						if(arrChildren && arrChildren.length > 0)
						{
							item[this.__childField] = arrChildren;
						}
						arrReturn.push(item);
					}
					else
					{
						var group = item[field];
						if (group in groups) 
			  	        {
			  	            groups[group][this.__childField].push(item); 
			  	            groups[group][this.__childrenCountField] += 1;
			  	        } 
			  	        else 
			  	        {
			  	        	var objEmpty = this.__createEmptyItem(item);
			  	        	objEmpty[this.__parentLevelIndicatorField] = true;
			  	        	objEmpty[field] = item[field];
			  	        	objEmpty[this.__groupField] = item[field];
			  	        	objEmpty[this.__childField] = [];
			  	        	objEmpty[this.__childField].push(item);
			  	        	objEmpty[this.__childrenCountField] = 1;
			  	            groups[group] = objEmpty;
			  	        }
					}
		  	    }
				if(groups)
				{
					var arrChild = this.__arrayFromObject(groups);
					if(arrChild && arrChild.length > 0)
					{
						for (var childCount = 0; childCount < arrChild.length; childCount++) 
				  	    {
							arrReturn.push(arrChild[childCount]);
				  	    }
					}
				}
			}
			return arrReturn;
		};
		
		this.__arrayFromObject = function(objArr)
		{
			var arr = [];
			if(objArr)
			{
				for (var count in objArr) 
		  	    {
		  	        arr.push(objArr[count]);
		  	    }
			}
	  	    return arr;
		};
		
		this.__createEmptyItem = function(objSource)
	  	{
	  		var objCopy = {};
	  		if (objSource instanceof Object) 
	  		{
	  	        for (var attr in objSource) 
	  	        {
	  	            if (objSource.hasOwnProperty(attr))
	  	            {
	  	            	objCopy[attr] = null;
	  	            }
	  	        }
	  	    }
	  		return objCopy;
	  	};
	};
	
	/** Explaination http://javascript.info/tutorial/animation of animation .. not the code **/
	NSUtil.prototype.animation = function(element,arrOptions,win)
	{
		this.__element = element;
		this.__arrOptions = arrOptions;
		this.__util = new NSUtil();
		this.win = this.__util.getWin(win);
		
		this.__duration = 0;
		this.__currentOption = null;
		this.__currentStart = 0;
		this.__currentEnd = 0;
		
		this.animate = function()
		{
			if(this.__element)
			{
				this.__run();
			}
			else
			{
				this.__util.warning("NSAnimation","The element is not valid");
			}
		};
		
		this.__run = function() 
		{
		    var current = new Date();
		    var remaining = this.__currentEnd - current;
		    if(remaining < this.__util.ANIMATIONDELAY) 
		    {
			      if(this.__currentOption) 
			      {
			    	  this.__step(1);  //1 = progress is at 100%
			    	  if(this.__currentOption.animationCompleteHandler)
			    	  {
			    		  this.__currentOption.animationCompleteHandler(this.__currentOption);
			    	  }
			      }
			      this.__currentOption = this.__arrOptions.shift();  //get the next item
			      if(this.__currentOption) 
			      {
			    	  if(this.__currentOption["style"])
			    	  {
			    		  this.__currentStart = this.__util.getDimensionAsNumber(this.__element,this.__element.style[this.__currentOption.style]);
			    	  }
			    	  else
			    	  {
			    		  this.__currentStart = this.__element[this.__currentOption.property];
			    	  }
			    	  this.__duration = this.__currentOption.time;
			    	  this.__currentEnd = new Date(current.getTime() + this.__duration);
			    	  this.__step(0);  //0 = progress is at 0%
			      }
			      else 
			      {
			    	  return;
			      }
		    }
		    else 
		    {
			      var progress = remaining / this.__duration;
			      var delta = this.__delta(progress);
			      this.__step(delta);
		    }
		    this.__util.getRequestAnimationFrame.bind(this.win)(this.__run.bind(this));
		};
		
		this.__delta = function(progress)
		{
			return (1 - Math.pow(progress, 3));  //easing formula
		};
		
		this.__step = function(progress) 
		{
			var newValue = progress * (this.__currentOption.target - this.__currentStart) + this.__currentStart;
			if(this.__currentOption["style"])
	  	  	{
				this.__element.style[this.__currentOption.style] = newValue + "px";
				//this.__element.style[this.__currentOption.style] = (progress * this.__currentOption.target) + "px";
	  	  	}
			else
			{
				this.__element[this.__currentOption.property] = newValue;
			}
		};
	};
	
	NSUtil.prototype.getSearchTextBox = function(textInput)
	{
		var divWrapper = null;
		if(textInput)
		{
			var id = textInput.getAttribute("id");
			var parent = textInput.parentNode;
			divWrapper = this.createDiv(id + "searchWrapper","nsSearchTextBoxWrapper");
			this.addStyleClass(textInput,"nsSearchInput");
			var divSearchWrapper = this.createDiv(id + "searchIconWrapper","nsSearchIconWrapper");
			var divSearchParent = this.createDiv(id + "searchIconParent","nsSearchIconParent");
			var objSVG = new NSSvg();
			var searchID = new NSSvgShapes().__SEARCH_ICON_ID;
			var svg = objSVG.addSVG(divSearchParent,id + "searchsvg","nsSearchIcon",null,null,null,null,null,null,false);
			objSVG.addUse(svg,id + "use",null,"#" + searchID);
			divSearchWrapper.appendChild(divSearchParent);
			divWrapper.appendChild(divSearchWrapper);
			if(parent)
			{
				parent.replaceChild(divWrapper,textInput);
			}
			divWrapper.appendChild(textInput);
		}
		return divWrapper;
	};
	
	NSUtil.prototype.transition = function(element,transitionEndCallback)
	{
		this.__element = element;
		this.__transitionEndCallback = transitionEndCallback;
		this.__transitions = {
	      'transition':'transitionend',
	      'OTransition':'oTransitionEnd',
	      'MozTransition':'transitionend',
	      'WebkitTransition':'webkitTransitionEnd'
	    };
		this.__util = new NSUtil();
		this.getTransitionEvent = function()
		{
			if(this.__element)
			{
				for(var trans in this.__transitions)
				{
			        if(this.__element.style[trans] !== undefined)
			        {
			            return this.__transitions[trans];
			        }
			    }
			}
			return null;
		};
		this.callEndCallBack = function()
		{
			var transitionEvent = this.getTransitionEvent();
			if(transitionEvent && this.__transitionEndCallback)
			{
				this.__util.addEvent(this.__element,transitionEvent,this.__transitionEndCallback);
			}
		};
		this.callEndCallBack();
	};
	
	NSUtil.prototype.getRequestAnimationFrame = (function()
	{
		  return  window.requestAnimationFrame       ||
		          window.webkitRequestAnimationFrame ||
		          window.mozRequestAnimationFrame    ||
		          window.oRequestAnimationFrame      ||
		          function(callback)
		          {
		              window.setTimeout(callback,1000 / 60);
		          };
	})();
	
	NSUtil.prototype.getCancelAnimationFrame = (function() 
	{
	    return window.cancelAnimationFrame           	||
		       window.webkitCancelRequestAnimationFrame ||
		       window.mozCancelRequestAnimationFrame    ||
		       window.oCancelRequestAnimationFrame      ||
		       window.msCancelRequestAnimationFrame     ||
		       clearTimeout;
	})();
	
	NSUtil.prototype.fitStringToElement = function(element,doc)
	{
		if(element)
		{
			doc = this.getDoc(doc);
			var str = element.innerHTML;
			var width = element.getBoundingClientRect().width;
			function escTag(string)
			{ 
				return string.replace("<","&lt;").replace(">","&gt;");
			}
			//Create a span element that will be used to get the width
			var span = doc.createElement("span");
			//Allow a classname to be set to get the right font-size.
			if (element.className) 
			{
				span.className = element.className;
			}
			span.style.display = 'inline';
			span.style.visibility = 'hidden';
			span.style.padding = '0px';
			doc.body.appendChild(span);
	
			var result = escTag(str); // default to the whole string
			span.innerHTML = result;
			// Check if the string will fit in the allowed width. NOTE: if the width
			// can't be determined (offsetWidth==0) the whole string will be returned.
			if (span.offsetWidth > width) 
			{
				var posStart = 0, posMid, posEnd = str.length, posLength;
				// Calculate (posEnd - posStart) integer division by 2 and
				// assign it to posLength. Repeat until posLength is zero.
				while (posLength = (posEnd - posStart) >> 1) 
				{
				  posMid = posStart + posLength;
				  //Get the string from the beginning up to posMid;
				  span.innerHTML = escTag(str.substring(0,posMid)) + '&hellip;';
	
				  // Check if the current width is too wide (set new end)
				  // or too narrow (set new start)
				  if(span.offsetWidth > width) 
				  {
					posEnd = posMid; 
				  }
				  else 
				  {
					posStart=posMid;
				  }
				}
	
				result = '<abbr title="' + str.replace("\"","&quot;") + '">' + escTag(str.substring(0,posStart)) +'&hellip;<\/abbr>';
			}
			doc.body.removeChild(span);
			return result;
		}
		return null;
	};
	
	NSUtil.prototype.slideUp = function(element,duration,callback,heightSubstracter)
	{
		if(element)
		{
			duration = duration || 20;
			heightSubstracter = heightSubstracter || 10;
			var rect = element.getBoundingClientRect();
			var height = rect.height;
			var counter = height;
			var subtractor = height / heightSubstracter;
			//element.style.overflow = "hidden";
			var interval = setInterval(function () {
				 counter -= subtractor;
				 if(counter > 0) 
				 {
					 element.style.height = counter + "px";
				 }
				 else
				 {
					 element.style.height = null;
			    	 clearInterval(interval);
			    	 if(callback)
			    	 {
			    		  callback(element);
			    	 }
				 }
			},duration);
		}
	};
	
	NSUtil.prototype.slideDown = function(element,duration,callback,heightAdder)
	{
		if(element)
		{
			duration = duration || 20;
			heightAdder = heightAdder || 10;
			var counter = 0;
			var height = this.getHiddenElementHeight(element);
			var adder = height / heightAdder;
			element.style.height = "0px";    
			element.style.display = "";
			var interval = setInterval(function () {            
		      counter += adder;
		      if(counter < height) 
		      {
		    	  element.style.height = counter + "px";
		      } 
		      else 
		      {
		    	  element.style.height = null;
		    	  clearInterval(interval);
		    	  if(callback)
		    	  {
		    		  callback(element);
		    	  }
		      }
		    }, duration); 
		}
	};
	
	NSUtil.prototype.slideDownTransition = function(element,duration,callback) {
		if(element)
		{
			if(this.isUndefinedOrNull(duration)) {
				duration = 500;
			}
			var display = element.style.display;
			element.style.display = 'block';
			var origHeight = element.style.height;
			var height = element.offsetHeight;
			var overflow = element.style.overflow;
			var transition = element.style.transition;
		    element.style.height = '0px';
		    element.style.overflow = 'hidden';
		    element.style.transition = "height " + (duration / 1000) + "s ease-in-out";
			function handleTransitionEnd(event) {
				if (event.target === element || event.currentTarget === element) {
					element.removeEventListener('transitionend', handleTransitionEnd);
					//element.style.display = display;
					element.style.height = origHeight;
					element.style.overflow = overflow;
					element.style.transition = transition;
					callback && callback(element);
			    }
			}
		        
			element.addEventListener('transitionend', handleTransitionEnd);
			setTimeout(function() {
		         element.style.height = height + "px";
		    }, 0);
		}
	}
	
	NSUtil.prototype.slideUpTransition = function(element, duration, callback) {
	    if(element)
		{
	    	if(this.isUndefinedOrNull(duration)) {
				duration = 500;
			}
			var display = element.style.display;
			var height = element.style.height;
			var overflow = element.style.overflow;
			var transition = element.style.transition;
			
			element.style.height = element.offsetHeight + 'px';
			element.style.transition = "height " + (duration / 1000) + "s ease-in-out";
			
			setTimeout(function() {
				element.style.height = '0px';
				element.style.overflow = 'hidden';
			}, 0);

			function handleTransitionEnd(event) {
				if (event.target === element || event.currentTarget === element) {
					element.removeEventListener('transitionend', handleTransitionEnd);
					element.style.display = 'none';
					element.style.height = height;
					element.style.overflow = overflow;
					element.style.transition = transition;
					
					callback && callback(element);
				}
			}

			element.addEventListener('transitionend', handleTransitionEnd);
		}
	}
	
	//will work only if element parent is not hidden
	NSUtil.prototype.getHiddenElementHeight = function(element,win)
	{
		if(element)
		{
			win = this.getWin(win);
			var style = win.getComputedStyle(element);
			var maxHeight = style.maxHeight.replace('px', '').replace('%', '');
			if(style.display !== 'none' && maxHeight !== '0') 
			{
				var rect = element.getBoundingClientRect();
				return rect.height;
			}
			var id = "nsTemp-"+ Math.floor(Math.random() * 99999);
			var clonedElement = element.cloneNode(true);
			clonedElement.setAttribute("id",id);
			clonedElement.style.position = "absolute";
			clonedElement.style.height = "auto";
			clonedElement.style.width = "1000px";
			clonedElement.style.left = "-10000em";
			clonedElement.style.display = "";
			element.parentElement.appendChild(clonedElement);
			var rect = clonedElement.getBoundingClientRect();
			var height = rect.height;
			clonedElement.parentElement.removeChild(clonedElement);
		}
		return 0;
	};
	
	NSUtil.prototype.addRemoteFileToElement = function(element,filePath,win)
	{
		if(element && filePath)
		{
			win = this.getWin(win);
			var xmlhttp;
			if (win.XMLHttpRequest)
			{// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp=new XMLHttpRequest();
			}
			else
			{// code for IE6, IE5
				xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.onreadystatechange=function()
			{
			  if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
			  {
				  element.innerHTML = xmlhttp.responseText;
			  }
			};
			xmlhttp.open("GET",filePath,true);
			xmlhttp.send();
		}
	};
	
	NSUtil.prototype.stringifyOnce = function(obj, replacer, indent)
	{
		var printedObjects = [];
	    var printedObjectKeys = [];
	    function printOnceReplacer(key, value)
	    {
	        var printedObjIndex = false;
	        printedObjects.forEach(function(obj, index)
	        {
	            if(obj===value)
	            {
	                printedObjIndex = index;
	            }
	        });
	        if(value && printedObjIndex && typeof(value)=="object")
	        {
	        	var name = (value.constructor && value.constructor.name) ? value.constructor.name : printedObjectKeys[printedObjIndex];
	            return "(see " + name.toLowerCase() + " with key " + printedObjectKeys[printedObjIndex] + ")";
	        }
	        else
	        {
	            var qualifiedKey = key || "(empty key)";
	            printedObjects.push(value);
	            printedObjectKeys.push(qualifiedKey);
	            if(replacer)
	            {
	                return replacer(key, value);
	            }
	            else
	            {
	                return value;
	            }
	        }
	    }
	    return JSON.stringify(obj, printOnceReplacer, indent);
	};
	
	NSUtil.prototype.caretPosition = function(element,position,doc)
	{
		if(!element)
		{
			return null;
		}
		doc = this.getDoc(doc);
		var start = 0, end = 0;
		if (typeof element.selectionStart == "number" && typeof element.selectionEnd == "number") 
		{
			if(!this.isUndefinedOrNull(position))
			{
				element.focus();
				element.setSelectionRange(position,position);
			}
	        start = element.selectionStart;
	        end = element.selectionEnd;
	    }
		else if(element.createTextRange)
		{
			var range = null;
			if(!this.isUndefinedOrNull(position))
			{
				range = elem.createTextRange();
	            range.move('character',position);
	            range.select();
			}
			range = doc.selection.createRange();
			if (range && range.parentElement() == element) 
			{
				var len = element.value.length;
				var normalizedValue = element.value.replace(/\r\n/g, "\n");
				var textInputRange = element.createTextRange();
	            textInputRange.moveToBookmark(range.getBookmark());
	            var endRange = element.createTextRange();
	            endRange.collapse(false);
	            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) 
	            {
	                start = end = len;
	            } 
	            else 
	            {
	                start = -textInputRange.moveStart("character", -len);
	                start += normalizedValue.slice(0, start).split("\n").length - 1;

	                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) 
	                {
	                    end = len;
	                } 
	                else 
	                {
	                    end = -textInputRange.moveEnd("character", -len);
	                    end += normalizedValue.slice(0, end).split("\n").length - 1;
	                }
	            }
			}
		}
		else
		{
			if(!this.isUndefinedOrNull(position))
			{
				element.focus();
			}
		}
		return {start: start,end: end};
	};
	
	NSUtil.prototype.copyObjectWithNullValues = function(item) {
		if(item) {
			const retItem = {};
			for (var key of Object.keys(item)) {
				retItem[key] = null;
			}
			return retItem;
		}
		return item;
	}
	
	NSUtil.prototype.loader = function(parentContainer,isOverlayRequired,doc,win)
	{
		this.parentContainer = parentContainer;
		this.isOverlayRequired = isOverlayRequired;
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.win = this.util.getWin(win);
		this.divOverlay = null;
		this.divLoaderContainerParent = null;
		this.canvasLoader = null;
		this.loaderContext= null;
		this.idPrefix = null;
		this.loaderLines = 16;
		this.canvasWidth = 100;
		this.canvasHeight = 100;
		this.animationStart = null;
		this.orignalParentPosition = null;
		this.documentResizeRef = null;
		this.timeout = null;
		this.isVisible = false;
		
		this.createComponents = function()
		{
			if(!this.documentResizeRef)
			{
				this.documentResizeRef = this.documentResizeListener.bind(this);
				this.util.addEvent(this.win,"resize",this.documentResizeRef);
			}
			this.idPrefix = this.parentContainer.id ? this.parentContainer.id : this.util.getUniqueId();
			if(this.util.isUndefined(this.isOverlayRequired))
			{
				this.isOverlayRequired = true;
			}
			if(this.isOverlayRequired)
			{
				this.orignalParentPosition = this.parentContainer.style.position;
				this.parentContainer.style.position = "relative";
				this.divOverlay = this.util.createDiv("divOverlay","nsLoaderOverlay");
				this.divOverlay.style.height = this.parentContainer.offsetHeight + "px";
				this.divOverlay.style.width = this.parentContainer.offsetWidth + "px";
				this.parentContainer.appendChild(this.divOverlay);
			}
			this.divLoaderContainerParent = this.util.createDiv(this.idPrefix + "divLoaderContainerParent","nsLoaderContainerParent"); 
			this.parentContainer.appendChild(this.divLoaderContainerParent);
			var divLoaderContainer = this.util.createDiv(this.idPrefix + "divLoaderContainer","nsLoaderContainer"); 
			this.divLoaderContainerParent.appendChild(divLoaderContainer);
			this.canvasLoader = this.doc.createElement("canvas");
			this.canvasLoader.id = this.idPrefix + "canvas";
			this.canvasLoader.width = this.canvasWidth;
			this.canvasLoader.height = this.canvasHeight;
			this.canvasLoader.style.background = "#FFFFFF";
			this.canvasLoader.style.position = "absolute";
			divLoaderContainer.appendChild(this.canvasLoader);
			this.loaderContext= this.canvasLoader.getContext("2d");
			
			var divLoadingLabel = this.util.createDiv(this.idPrefix + "divLoadingLabel","nsLoaderText"); 
			divLoadingLabel.appendChild(this.doc.createTextNode("Loading"));
			divLoaderContainer.appendChild(divLoadingLabel);
			
			this.centerElement(this.divLoaderContainerParent);
			var canvasLeft = (((divLoaderContainer.offsetWidth - this.canvasWidth) / 2) - 5);
			var canvasTop = Math.max((((divLoaderContainer.offsetHeight - this.canvasHeight) / 2)),0);
			this.canvasLoader.style.left = canvasLeft + "px";
			this.canvasLoader.style.top = canvasTop + "px";
			this.centerElement(divLoadingLabel);
			divLoadingLabel.style.top = (canvasTop + this.canvasHeight) + "px";
			this.animationStart = new Date();
			this.win.setInterval(this.draw.bind(this), 1000 / 30);
		};
		
		this.centerElement = function(component)
		{
			if(component)
			{
				var parent = component.parentNode;
				component.style.left = ((parent.offsetWidth - component.offsetWidth) / 2) + "px";
				component.style.top = ((parent.offsetHeight - component.offsetHeight) / 2) + "px";
			}
		};
		
		this.draw = function() 
		{
		    var rotation = parseInt(((new Date() - this.animationStart) / 1000) * this.loaderLines) / this.loaderLines;
		    this.loaderContext.save();
		    this.loaderContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		    this.loaderContext.translate(this.canvasWidth / 2, this.canvasHeight / 2);
		    this.loaderContext.rotate(Math.PI * 2 * rotation);
		    for (var count = 0; count < this.loaderLines; count++) {
		 
		    	this.loaderContext.beginPath();
		    	this.loaderContext.rotate(Math.PI * 2 / this.loaderLines);
		    	this.loaderContext.moveTo(this.canvasWidth / 10, 0);
		    	this.loaderContext.lineTo(this.canvasWidth / 4, 0);
		    	this.loaderContext.lineWidth = this.canvasWidth / 30;
		    	this.loaderContext.strokeStyle = "rgba(0,0,0," + count / this.loaderLines + ")";
		    	this.loaderContext.stroke();
		    }
		    this.loaderContext.restore();
		};
		
		this.documentResizeListener = function(event)
		{
			clearTimeout(this.timeout);
			var self = this;
			this.timeout = setTimeout(function () {
					self.resizeHandler.bind(self)();
			    }, 500);
			
		};
		
		this.resizeHandler = function()
		{
			if(this.isVisible)
			{
				this.hide();
				this.show();
			}
		};
		
		this.show = function()
		{
			if(!this.divLoaderContainerParent)
			{
				this.createComponents();
			}
			this.divLoaderContainerParent.style.display = "inline-block";
			if(this.isOverlayRequired)
			{
				this.divOverlay.style.display = "inline-block";
				this.parentContainer.style.position = "relative";
			}
			this.isVisible = true;
		};
		
		this.hide = function()
		{
			if(this.divLoaderContainerParent)
			{
				this.divLoaderContainerParent.parentNode.removeChild(this.divLoaderContainerParent);
				this.divLoaderContainerParent = null;
				//this.divLoaderContainerParent.style.display = "none";
			}
			if(this.divOverlay)
			{
				//this.divOverlay.style.display = "none";
				this.divOverlay.parentNode.removeChild(this.divOverlay);
				this.divOverlay = null;
				this.parentContainer.style.position = this.orignalParentPosition;
			}
			if(this.documentResizeRef)
			{
				this.util.removeEvent(this.win,"resize",this.documentResizeRef);
				this.documentResizeRef = null;
			}
			this.isVisible = false;
		};
	};
	
	NSUtil.prototype.nsDragResizeElements = function(setting,doc,win)
	{
		this.DRAG_STARTING = "dragStaring";
		this.DRAGGING = "dragging";
		this.DRAG_END = "dragEnd";
		this.RESIZE_STARTING = "resizeStaring";
		this.RESIZING = "resizing";
		this.RESIZE_END = "resizeEnd";
		
		this.__ELEMENT_OFFSET = 4;
		
		this.__setting = setting;
		
		//Drag Variables
		this.__dragSetting = {x:0,y:0,isDragging:false};
		
		//Resize Variables
		this.__resizeSetting = {isResizing:false};
		this.__resizeDirection = {top:false,right:false,bottom:false,left:false};
		this.__dragEdge = {right:null,bottm:null};
		this.__elementRect = null;
		this.__lastElementDimension = null;
		this.__posX = null;
		this.__posY = null;
		this.__tempEvent = null;
	
		//Common Variables
		this.__divHidden = null;
		this.__rePaint = false;
		this.__isStopMoveOnClick = false;
		this.__disableDrag = false;
		this.__disableResize = false;
		
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.win = this.util.getWin(win);
		
		this.__documentMouseMoveRef = null;
		this.__documentMouseUpRef = null;
		this.__documentTouchMoveRef = null;
		this.__documentTouchEndRef = null;
		this.__containerClickRef = null;
		this.__elementMouseDownRef = null;
		this.__elementTouchStartRef = null;
		
		this.__initialize = function() 
		{
			this.__config = {
					element: this.__setting["element"] || null,
					enableDrag: Boolean.parse(this.__setting["enableDrag"]),
					enableResize: Boolean.parse(this.__setting["enableResize"]),
					enableMoveOnClick: Boolean.parse(this.__setting["enableMoveOnClick"]),
					minWidth: this.util.getDimensionAsNumber(this.__setting["element"],this.__setting["minWidth"]),
					minHeight: this.util.getDimensionAsNumber(this.__setting["element"],this.__setting["minHeight"]),
					createGhostElementCallback: this.__setting["createGhostElementCallback"] || this.__createHiddenDiv.bind(this),
					enableDragContainment:Boolean.parse(this.__setting["enableDragContainment"]),
					container: this.__setting["container"] || this.doc.documentElement,
					excludeElement: this.__setting["excludeElement"] || []
			};
			if(this.__config.element)
			{
				if(this.__config.enableDrag)
				{
					this.__divHidden = this.__config.createGhostElementCallback(this.__config.element);
					this.util.addStyleClass(this.__divHidden,"nsDragGhost");
					this.__initializeHiddenDiv();
				}
				this.__addEvent();
				if(this.__config.enableDrag)
				{
					this.__initializeDrag();
				}
				if(this.__config.enableResize)
				{
					this.__initializeResize();
				}
				if(this.__config.enableMoveOnClick)
				{
					this.__initializeMoveOnClick();
				}
				this.__animateAction();
			}
		};
		
		this.stopMoveOnClick = function()
		{
			this.__isStopMoveOnClick = true;
		};
		
		this.disableDrag = function(value)
		{
			this.__disableDrag = Boolean.parse(value);
		};
		
		this.disableResize = function(value)
		{
			this.__disableResize = Boolean.parse(value);
		};
		
		this.destroy = function()
		{
			if(this.__elementMouseDownRef)
			{
				this.util.removeEvent(this.__config.element,"mousedown",this.__elementMouseDownRef);
				this.__elementMouseDownRef = null;
			}
			if(this.__elementTouchStartRef)
			{
				this.util.removeEvent(this.__config.element,"touchstart",this.__elementTouchStartRef);
				this.__elementTouchStartRef = null;
			}
			if(this.__documentMouseMoveRef)
			{
				this.util.removeEvent(this.__config.container,"mousemove",this.__documentMouseMoveRef);
				this.__documentMouseMoveRef = null;
			}
			if(this.__documentMouseUpRef)
			{
				this.util.removeEvent(this.__config.container,"mouseup",this.__documentMouseUpRef);
				this.__documentMouseUpRef = null;
			}
			if(this.__documentTouchMoveRef)
			{
				this.util.removeEvent(this.__config.container,"touchmove",this.__documentTouchMoveRef);
				this.__documentTouchMoveRef = null;
			}
			if(this.__documentTouchEndRef)
			{
				this.util.removeEvent(this.__config.container,"touchend",this.__documentTouchEndRef);
				this.__documentTouchEndRef = null;
			}
			if(this.__containerClickRef)
			{
				this.util.removeEvent(this.__config.container,"click",this.__containerClickRef);
				this.__containerClickRef = null;
			}
			if(this.__divHidden)
			{
				this.__divHidden.parentNode.removeChild(this.__divHidden);
				this.__divHidden = null;
			}
		};
		
		this.__addEvent = function()
		{
			if(!this.__elementMouseDownRef)
			{
				this.__elementMouseDownRef = this.__elementMouseDownHandler.bind(this);
				this.util.addEvent(this.__config.element,"mousedown",this.__elementMouseDownRef);
			}
			if(!this.__elementTouchStartRef)
			{
				this.__elementTouchStartRef = this.__elementTouchStartHandler.bind(this);
				this.util.addEvent(this.__config.element,"touchstart",this.__elementTouchStartRef);
			}
			if(!this.__documentMouseMoveRef)
			{
				this.__documentMouseMoveRef = this.__documentMouseMoveHandler.bind(this);
				this.util.addEvent(this.__config.container,"mousemove",this.__documentMouseMoveRef);
			}
			if(!this.__documentMouseUpRef)
			{
				this.__documentMouseUpRef = this.__documentMouseUpHandler.bind(this);
				this.util.addEvent(this.__config.container,"mouseup",this.__documentMouseUpRef);
			}
			if(!this.__documentTouchMoveRef)
			{
				this.__documentTouchMoveRef = this.__documentTouchMoveHandler.bind(this);
				this.util.addEvent(this.__config.container,"touchmove",this.__documentTouchMoveRef);
			}
			if(!this.__documentTouchEndRef)
			{
				this.__documentTouchEndRef = this.__documentTouchEndHandler.bind(this);
				this.util.addEvent(this.__config.container,"touchend",this.__documentTouchEndRef);
			}
		};
		
		this.__elementMouseDownHandler = function(event)
		{
			event = this.util.getEvent(event);
			this.__downActionHandler(event);
			//this.util.preventDefault(event); 
			event.stopImmediatePropagation();
		};
		
		this.__elementTouchStartHandler = function(event)
		{
			 event = this.util.getEvent(event);
			 this.__downActionHandler(event.touches[0]);
			 //this.util.preventDefault(event);
			 event.stopImmediatePropagation();
		};
		
		this.__documentMouseMoveHandler = function(event)
		{
			event = this.util.getEvent(event);
			this.__moveActionHandler(event);
			//this.util.preventDefault(event); 
			//event.stopImmediatePropagation();
		};
		
		this.__documentMouseUpHandler = function(event)
		{
			event = this.util.getEvent(event);
			this.__upActionHandler(event);
			//this.util.preventDefault(event); 
			//event.stopPropagation();
			//event.stopImmediatePropagation();
		};
		
		this.__documentTouchMoveHandler = function(event)
		{
			event = this.util.getEvent(event);
			this.__moveActionHandler(event.touches[0]);
			//this.util.preventDefault(event); 
			//event.stopImmediatePropagation();
		};
		
		this.__documentTouchEndHandler = function(event)
		{
			event = this.util.getEvent(event);
			if (event.touches.length === 0) 
			{
				this.__upActionHandler(event.changedTouches[0]);
			}
			//this.util.preventDefault(event); 
			//event.stopImmediatePropagation();
		};
		
		this.__downActionHandler = function(event)
		{
			if(this.__isTargetValid(event.target))
			{
				this.__setResizeVariables(event);
				var isResizing = this.__isResizeValid();
				var isDragging = !isResizing && this.__isDragValid();
				if(isResizing && !this.__disableResize)
				{
					this.__startResize(event);
				}
				else if(isDragging && !this.__disableDrag)
				{
					this.__startDrag(event);
				}
			}
		};
		
		this.__moveActionHandler = function(event)
		{
			this.__setResizeVariables(event);
			this.__tempEvent = event;
			this.__rePaint = true;
			if(this.__resizeSetting.isResizing) 
			{
				this.__actionResize(event);
			}
			else if(this.__dragSetting.isDragging)
			{
				this.__actionDrag(event);
			}
		};
		
		this.__upActionHandler = function(event)
		{ 
			this.__setResizeVariables(event);
			if(this.__resizeSetting.isResizing)
			{
				this.__endResize(event);
				//this.stopMoveOnClick();
			}
			else if(this.__dragSetting.isDragging)
			{
				this.__endDrag(event);
				this.stopMoveOnClick();
			}
		};
		
		this.__isTargetValid = function(target)
		{
			if(target && this.__config.excludeElement && this.__config.excludeElement.length > 0)
			{
				for(var count = 0;count < this.__config.excludeElement.length;count++)
				{
					if(this.__config.excludeElement[count] ==  target)
					{
						return false;
					}
				}
			}
			return true;
		};
		/*********************************Resize Methods Starts*********************************/
		this.__initializeResize = function()
		{
		};
		
		this.__resizeElement = function()
		{
		};
		
		this.__startResize = function(event)
		{
			this.util.dispatchEvent(this.__config.element,this.RESIZE_STARTING,null,null);
			this.__resizeSetting = {
				    posX: this.__posX,
				    posY: this.__posY,
				    clientX: event.clientX,
				    clientY: event.clientY,
				    elementWidth: this.__elementRect.width,
				    elementHeight: this.__elementRect.height,
				    isResizing: true,
				    isResizeTop: this.__resizeDirection.top,
				    isResizeLeft: this.__resizeDirection.left,
				    isResizeRight: this.__resizeDirection.right,
				    isResizeBottom: this.__resizeDirection.bottom
			 };
		};
		
		this.__actionResize = function(event)
		{
			if(this.__resizeSetting.isResizeRight) 
		    {
		    	this.__config.element.style.width = Math.max(this.__posX, this.__config.minWidth) + "px";
		    }
		    if(this.__resizeSetting.isResizeBottom) 
		    {
		    	this.__config.element.style.height = Math.max(this.__posY, this.__config.minHeight) + "px";
		    }
		    if(this.__resizeSetting.isResizeLeft) 
		    {
			     var currentWidth = Math.max(this.__resizeSetting.clientX - this.__tempEvent.clientX  + this.__resizeSetting.elementWidth, this.__config.minWidth);
			     if (currentWidth > this.__config.minWidth) 
			     {
			    	 this.__config.element.style.width = currentWidth + "px";
			    	 this.__config.element.style.left = this.__tempEvent.clientX + "px";	
			     }
		    }
		    if (this.__resizeSetting.isResizeTop) 
		    {
		    	var currentHeight = Math.max(this.__resizeSetting.clientY - this.__tempEvent.clientY  + this.__resizeSetting.elementHeight, this.__config.minHeight);
			    if(currentHeight > this.__config.minHeight) 
			    {
			    	this.__config.element.style.height = currentHeight + "px";
			    	this.__config.element.style.top = this.__tempEvent.clientY + "px";	
			    }
		    }
		    this.__updateHiddenDivDimension();
		    var elementRect = this.__config.element.getBoundingClientRect();
		    this.util.dispatchEvent(this.__config.element,this.RESIZING,elementRect,{dimension:elementRect});
		};
		
		this.__endResize = function(event)
		{
			this.__resizeSetting = {isResizing:false};
			this.util.dispatchEvent(this.__config.element,this.RESIZE_END,null,null);
		};
		
		this.__setResizeVariables = function(event)
		{
			  this.__elementRect = this.__config.element.getBoundingClientRect();
			  this.__posX = event.clientX - this.__elementRect.left;
			  this.__posY = event.clientY - this.__elementRect.top;
	
			  this.__resizeDirection.top = this.__posY < this.__ELEMENT_OFFSET;
			  this.__resizeDirection.left = this.__posX < this.__ELEMENT_OFFSET;
			  this.__resizeDirection.right = this.__posX >= this.__elementRect.width - this.__ELEMENT_OFFSET;
			  this.__resizeDirection.bottom = this.__posY >= this.__elementRect.height - this.__ELEMENT_OFFSET;
			  
			  this.__dragEdge.right = this.win.innerWidth - this.__ELEMENT_OFFSET;
			  this.__dragEdge.bottom = this.win.innerHeight - this.__ELEMENT_OFFSET;
		};
		
		this.__isResizeValid = function()
		{
			if(this.__config.enableResize)
			{
				var retValue =  this.__resizeDirection.right || this.__resizeDirection.bottom || this.__resizeDirection.top || this.__resizeDirection.left;
				return retValue;
			}
			return false;
		};
			
		/*********************************Resize Methods Ends*********************************/
			
		/*********************************Drag Methods Starts*********************************/
		this.__initializeDrag = function()
		{
			var container = this.__config.container;
			var isContainerBody = false;
			if(container.tagName === "BODY" || container.tagName === "HTML")
			{
				isContainerBody = true;
			}
			var setPosition = function(element,rectElement)
			{
				var style = getComputedStyle(element);
				if(isContainerBody && style.position !== "absolute")
				{
					element.style.position = "absolute";
				}
				else if (style.position !== "relative" && style.position !== "absolute" ) 
				{
					element.style.position = "relative";
				}
				if(rectElement)
				{
					if(rectElement.width > 0)
					{
						element.style.width = rectElement.width + "px";
					}
					if(rectElement.height > 0)
					{
						element.style.height = rectElement.height + "px";
					}
				}
			};
			var element = this.__config.element;
			var rectElement = element.getBoundingClientRect();
			setPosition(element,rectElement);
			var rectHiddenElement = this.__divHidden.getBoundingClientRect();
			if(rectHiddenElement.width <= 0 || rectHiddenElement.height <= 0)
			{
				rectHiddenElement = rectElement;
			}
			setPosition(this.__divHidden,rectHiddenElement);
		};
		
		this.__dragElement = function()
		{
		};
	
		this.__startDrag = function(event)
		{
			var target = this.util.getTarget(event);
			var cancelled = this.util.dispatchEvent(this.__config.element,this.DRAG_STARTING,target,null,true,true);
			if(!cancelled)
			{
				this.__dragSetting.isDragging = true;
				var rectElement = this.__config.element.getBoundingClientRect();
				this.__dragSetting.posX = event.clientX;
				this.__dragSetting.posY = event.clientY;
				this.__dragSetting.elementTop = rectElement.top;
				this.__dragSetting.elementLeft = rectElement.left;
				this.__dragSetting.elementWidth = rectElement.width;
				this.__dragSetting.elementHeight = rectElement.height;
				this.__dragSetting.diffX = this.__dragSetting.posX - this.__dragSetting.elementLeft;
				this.__dragSetting.diffY = this.__dragSetting.posY - this.__dragSetting.elementTop;
				this.__dragSetting.containerWidth = 0;
				this.__dragSetting.containerHeight = 0;
				if(this.__config.enableDragContainment)
				{
					var containerRect = this.__config.container.getBoundingClientRect();
					this.__dragSetting.containerWidth = containerRect.width;
					this.__dragSetting.containerHeight = containerRect.height;
				}
			}
		};
		
		this.__actionDrag = function(event)
		{
			this.__setHiddenDivVisiblity(true);
			var posX = event.clientX;
	        var posY = event.clientY;
	        var newX = posX - this.__dragSetting.diffX;
	        var newY = posY - this.__dragSetting.diffY;
	        var newPosition = this.__getRestrictedPosition(newX,newY);
	        this.__divHidden.style.top = newPosition.y + "px";
			this.__divHidden.style.left = newPosition.x  + "px";
			this.util.dispatchEvent(this.__config.element,this.DRAGGING,newPosition,{position:newPosition});
		};
		
		this.__endDrag = function(event)
		{
			this.__dragSetting.isDragging = false;
			this.__config.element.style.top = this.__divHidden.style.top;
			this.__config.element.style.left = this.__divHidden.style.left;
			this.__setHiddenDivVisiblity(false);
			this.__dragSetting = {x:0,y:0,isDragging:false};
			this.util.dispatchEvent(this.__config.element,this.DRAG_END,null,null);
		};
		
		this.__getRestrictedPosition = function(newX,newY)
		{
			if(this.__config.enableDragContainment)
			{
				//newX = (newX < 0) ? 0 : newX;
				//newY = (newY < 0) ? 0 : newY;
				if((newX + this.__dragSetting.elementWidth) > this.__dragSetting.containerWidth)
				{
					newX = this.__dragSetting.containerWidth - this.__dragSetting.elementWidth;
				}
				if((newY + this.__dragSetting.elementHeight) > this.__dragSetting.containerHeight)
				{
					newY = this.__dragSetting.containerHeight - this.__dragSetting.elementHeight;
				}
			}
			return {x:newX,y:newY};
		};
		
		this.__isDragValid = function()
		{
			if(this.__config.enableDrag)
			{
				var retValue = this.__posX > 0 && this.__posX < this.__elementRect.width && this.__posY > 0 && this.__posY < this.__elementRect.height && this.__posY < 30;
				return retValue;
			}
			return false;
		};
		/*********************************Drag Methods Ends*********************************/
		/*********************************Move On Click Method Starts***********************/
		this.__initializeMoveOnClick = function()
		{
			this.util.addStyleClass(this.__config.element,"nsMoveOnClick");
			this.__containerClickRef = this.__containerClickHandler.bind(this);
			this.util.addEvent(this.__config.container,"click",this.__containerClickRef);
			this.util.addEvent(this.__config.element,"click",this.__elementClickHandler.bind(this));
		};
		
		this.__elementClickHandler = function(event)
		{
			event = this.util.getEvent(event);
			this.util.preventDefault(event); 
			event.stopPropagation();
			event.stopImmediatePropagation();
		};
		
		this.__containerClickHandler = function(event)
		{
			if(!this.__isStopMoveOnClick)
			{
				event = this.util.getEvent(event);
				var element = this.__config.element;
				var parentPosition = this.__getElementPosition(event.currentTarget);
				var newX = event.clientX - parentPosition.x - (element.clientWidth / 2);
				var newY = event.clientY - parentPosition.y - (element.clientHeight / 2);
				var rectElement = this.__config.element.getBoundingClientRect();
				var containerRect = this.__config.container.getBoundingClientRect();
				var elementWidth = rectElement.width;
				var elementHeight = rectElement.height;
				var containerWidth = containerRect.width;
				var containerHeight = containerRect.height;
				newX = (newX < 0) ? 0 : newX;
				newY = (newY < 0) ? 0 : newY;
				if((newX + elementWidth) > containerWidth)
				{
					newX = containerWidth - elementWidth;
				}
				if((newY + elementHeight) > containerHeight)
				{
					newY = containerHeight - elementHeight;
				}
				element.style.left = newX + "px";
				element.style.top = newY + "px";
				this.util.preventDefault(event); 
				event.stopPropagation();
				event.stopImmediatePropagation();
			}
			this.__isStopMoveOnClick = false;
		};
		
		this.__getElementPosition = function(element) 
		{
			var position = {x:0,y:0};
			while(element) 
			{
			   if(element.tagName === "BODY" || element.tagName === "HTML") 
			   {
			      var xScroll = element.scrollLeft || this.doc.documentElement.scrollLeft;
			      var yScroll = element.scrollTop || this.doc.documentElement.scrollTop;
			      position.x += (element.offsetLeft - xScroll + element.clientLeft);
			      position.y += (element.offsetTop - yScroll + element.clientTop);
			   } 
			   else 
			   {
				  position.x += (element.offsetLeft - element.scrollLeft + element.clientLeft);
				  position.y += (element.offsetTop - element.scrollTop + element.clientTop);
			   }
			   element = element.offsetParent;
			}
			return position;
		};
		/*********************************Move On Click Method Ends***************************/
		/*********************************Common Methods Starts*********************************/
		this.__animateAction = function()
		{
			this.util.getRequestAnimationFrame.bind(this.win)(this.__animateAction.bind(this));
			if(this.__rePaint)
			{
				this.__rePaint = false;
				if(this.__resizeSetting && this.__resizeSetting.isResizing) 
				{
					this.__resizeElement();
					return;
				}
				if(this.__dragSetting && this.__dragSetting.isDragging) 
				{
					this.__dragElement();
					return;
				}
				this.__setElementCursor();
			}
		};
		
		this.__setElementCursor = function() 
		{
			if(this.__config.enableResize && this.__resizeDirection.right && this.__resizeDirection.bottom || this.__resizeDirection.left && this.__resizeDirection.top) 
			{
				 this.__config.element.style.cursor = "nwse-resize";
			} 
			else if(this.__config.enableResize && this.__resizeDirection.right && this.__resizeDirection.top || this.__resizeDirection.bottom && this.__resizeDirection.left) 
			{
				 this.__config.element.style.cursor = "nesw-resize";
			} 
			else if(this.__config.enableResize && (this.__resizeDirection.right || this.__resizeDirection.left)) 
			{
				 this.__config.element.style.cursor = "ew-resize";
			} 
			else if(this.__config.enableResize && (this.__resizeDirection.bottom || this.__resizeDirection.top)) 
			{
				 this.__config.element.style.cursor = "ns-resize";
			} 
			else if(this.__isDragValid()) 
			{
				 this.__config.element.style.cursor = "move";
			} 
			else 
			{
				 this.__config.element.style.cursor = "default";
			}
		};
		
		this.__setHiddenDivVisiblity = function(isVisible) 
		{
			this.__divHidden.style.display = (isVisible ? "" : "none");
			this.__config.element.style.display = (isVisible ? "none" : "");
		};
		
		this.__updateHiddenDivDimension = function() 
		{
			this.__updateElementDimension(this.__divHidden, this.__elementRect.left,this.__elementRect.top, this.__elementRect.width, this.__elementRect.height);
		};
		
		this.__updateElementDimension = function(element,posX,posY,width,height) 
		{
			var updateDimension = function(property,value)
			{
				(element && value !== -1) ? (element.style[property] = value + "px") : null;
			};
			updateDimension("left",posX);
			updateDimension("top",posY);
			updateDimension("width",width);
			updateDimension("height",height);
		};
		
		this.__createHiddenDiv = function(element)
		{
			var divHidden = this.util.createDiv(element.id + "Hidden", "nsGhostElement");
			divHidden.style.width = this.util.getStyleValue(element,"width");
			divHidden.style.height = this.util.getStyleValue(element,"height");
			
			return divHidden;
		};
		
		this.__initializeHiddenDiv = function()
		{
			if(!this.__divHidden)
			{
				this.util.throwException(1002,"Dragging Util","Function should return Ghost Element");
			}
			this.__divHidden.setAttribute("id",this.__config.element.id + "Hidden");
			var self = this;
			var setDimension = function(property)
			{
				if(!self.__config.element.style[property])
				{
					var propertyValue = self.util.getStyleValue(self.__config.element,property);
					if(propertyValue !== "auto")
					{
						self.__divHidden.style[property] = propertyValue;
					}
				}
			};
			setDimension("width");
			setDimension("height");
			this.__divHidden.style.pointerEvents = "none";
			var element = this.__config.element;
			var parentNode = element.parentNode;
			try
			{
				parentNode.appendChild(this.__divHidden);
			}
			catch(error)
			{
				this.__divHidden = this.util.getWebComponentElement(this.__divHidden);
				parentNode.appendChild(this.__divHidden);
			}
			
			this.__setHiddenDivVisiblity(false);
		};
		/*********************************Common Methods Ends*********************************/
		this.__initialize();
	};
	
	//Idea from http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
	NSUtil.prototype.nsScrollEnableDisable = function(parent,orignalScrollHandler,enablerCallback)
	{
		this.__parent = parent;
		this.__orignalScrollHandler = orignalScrollHandler;
		this.__enablerCallback = enablerCallback;
		 // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
	    // left: 37, up: 38, right: 39, down: 40
		this.__scrollEventKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
		this.__lastScrollPos = [0,0];
		
		this.util = new NSUtil();
		this.disabled = false; 
		
		this.__parentMouseWheelRef = null;
		this.__parentMouseScrollRef = null;
		this.__parentTouchMoveRef = null;
		this.__parentScrollRef = null;
		this.__documentKeyDownRef = null;
		
		this.disable = function() 
		{
			this.__lastScrollPos = [this.__parent.scrollLeft,this.__parent.scrollTop];
			this.disabled = true;
			if(this.__orignalScrollHandler)
			{
				this.util.removeEvent(this.__parent,"scroll",this.__orignalScrollHandler);
			}
			if(!this.__parentMouseWheelRef)
			{
				this.__parentMouseWheelRef = this.__handleWheel.bind(this);
				this.util.addEvent(this.__parent,"mousewheel",this.__parentMouseWheelRef);
			}
			if(!this.__parentMouseScrollRef)
			{
				this.__parentMouseScrollRef = this.__handleWheel.bind(this);
				this.util.addEvent(this.__parent,"DOMMouseScroll",this.__parentMouseScrollRef);
			}
			if(!this.__parentTouchMoveRef)
			{
				this.__parentTouchMoveRef = this.__handleWheel.bind(this);
				this.util.addEvent(this.__parent,"touchmove",this.__parentTouchMoveRef);
			}
			if(!this.__parentScrollRef)
			{
				this.__parentScrollRef = this.__handleScrollbar.bind(this);
				this.util.addEvent(this.__parent,"scroll",this.__parentScrollRef);
			}
			if(!this.__documentKeyDownRef)
			{
				this.__documentKeyDownRef = this.__handleKeydown.bind(this);
				this.util.addEvent(this.doc,"keydown",this.__documentKeyDownRef);
			}
	    };
	    
	    this.enable = function() 
		{
	    	this.disabled = false;
	    	if(this.__orignalScrollHandler)
			{
				this.util.addEvent(this.__parent,"scroll",this.__orignalScrollHandler);
			}
			if(this.__parentMouseWheelRef)
			{
				this.util.removeEvent(this.__parent,"mousewheel",this.__parentMouseWheelRef);
				this.__parentMouseWheelRef = null;
			}
			if(this.__parentMouseScrollRef)
			{
				this.util.removeEvent(this.__parent,"DOMMouseScroll",this.__parentMouseScrollRef);
				this.__parentMouseScrollRef = null;
			}
			if(this.__parentTouchMoveRef)
			{
				this.util.removeEvent(this.__parent,"touchmove",this.__parentTouchMoveRef);
				this.__parentTouchMoveRef = null;
			}
			if(this.__parentScrollRef)
			{
				this.util.removeEvent(this.__parent,"scroll",this.__parentScrollRef);
				this.__parentScrollRef = null;
			}
			if(this.__documentKeyDownRef)
			{
				this.util.removeEvent(this.doc,"keydown",this.__documentKeyDownRef);
				this.__documentKeyDownRef = null;
			}
	    };
		
		this.__handleWheel = function(event) 
		{
			event = this.util.getEvent(event);
	        event.preventDefault();
	    };
		
		this.__handleScrollbar = function(event) 
		{
			event = this.util.getEvent(event);
	        this.__parent.scrollLeft = this.__lastScrollPos[0];
	        this.__parent.scrollTop = this.__lastScrollPos[1];
	        if(this.__enablerCallback && this.__enablerCallback(event))
	        {
	        	this.enable();
	        }
	    };
		
		this.__handleKeydown = function(event) 
		{
			event = this.util.getEvent(event);
	        for (var count = 0; count < this.__scrollEventKeys.length; count++) 
			{
	            if (event.keyCode === this.__scrollEventKeys[count]) 
				{
	                event.preventDefault();
	                return;
	            }
	        }
	    };
	};
	
	//Idea from http://stackoverflow.com/questions/10344498/best-way-to-iterate-over-an-array-without-blocking-the-ui
	NSUtil.prototype.processArrayAsync = function(array,callBack,maxTimePerChunk,completeHandler,context,win) 
	{
		this.__array = array;
		this.__callBack = callBack;
		this.__maxTimePerChunk = maxTimePerChunk || 50;
		this.__completeHandler = completeHandler;
	    this.__index = 0;
	    
	    this.util = new NSUtil();
	    this.win = this.util.getWin(win);
	    this.__context = context || this.win;
	    this.__requestId = null;
	    this.__hasPaused = false;
	    this.__hasCompleted = false;
	    
	    this.start = function(startIndex)
	    {
	    	this.__index = startIndex || 0;
	    	this.__hasPaused = false;
	    	this.__process();
	    };
	    
	    this.stop = function()
	    {
	    	this.__hasPaused = true;
	    	if(this.__requestId)
	    	{
	    		this.win.cancelAnimationFrame(this.__requestId);
	    		//this.util.getCancelAnimationFrame.bind(this.win)(this.__requestId);
	    		this.__requestId = null;
	    	}
	    };
	    
	    this.resume = function()
	    {
	    	this.__hasPaused = false;
	    	if(!this.__hasCompleted)
	    	{
	    		this.__process();
	    	}
	    };
	    
	    this.__process = function() 
	    {
	    	if(!this.__hasPaused)
	    	{
	    		var startTime = this.__getCurrentTime();
	            while(this.__index < this.__array.length && (this.__getCurrentTime() - startTime) <= this.__maxTimePerChunk) 
	            {
	            	this.__callBack.bind(this.__context)(this.__array[this.__index], this.__index, this.__array);
	                ++this.__index;
	            }
	            if(this.__index < this.__array.length) 
	            {
	                // set Timeout for async iteration
	            	this.__requestId = this.util.getRequestAnimationFrame.bind(this.win)(this.__process.bind(this));
	            }
	            else if(this.__completeHandler)
	            {
	            	this.__completeHandler.bind(this.__context)();
	            	this.__hasCompleted = true;
	            }
	    	}
	    };
	    
	    this.__getCurrentTime = function()
	    {
	        return new Date().getTime();
	    };
	};
	
	NSUtil.prototype.image = function(doc)
	{
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.getMoveIcon = function(toolTip)
		{
			return this.__createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoZJREFUeNpsU81rE0EUf7uzu2lNVJL6Eb0IBWusepqcKm3wEFkvxqDgQbwUtYeeg5cccwj4F7QKChEPipRcdMGDiaAoJAexLYViwYsfbU1JYkx3Zz98b8220Wbg7ez7vXm/mffmN9Kh1G2QGQOmMDiRyYEkSaCoKjDGdAAooOUdxzFsIcDzPPhSvgeO7YDrOLBRmQdlJHULVE0DNRSCvqFjUuHqhWP8+etvhR5m0CeengVhmiAsywdl2Dt03K1wZSrO220XaCaf8AFrQel32s0mrDcaWfovrq3Vc9OTvHj/Tb0Xzh6JxQwNyxtIgPXpqqJk94fDM+1Oh6CaEF4QTiIOGJ/DdQtBObsEmGxbll/rkCyDPDwMzW4XhHD88EH0NcRxDUeX4/qdnsi0s8Aas+kEp8Zg82pMkmpDigKbjSbQTD7hFL94/jin9ZRHBNLo3Wrt+uUkbzQsiEZVMPGKfv76DaawodnahkhY86+PNnXxs77ZgVOjMahWVuufi1NJRZhWvvT0beHGtQn++Nm7en+DzqXO8vfVxX+wsYnT/JWxWEe95P0eILsvkkdPKn4PUEBJmunILab5992PLVU++skoNmOniT7JX2Fkt5GM1EjqbMohXzQmqo7KwCQ6zYKiabu30PpQAnZ0HKSRMcMRwnBddw4ZOO4GLRYKFFdDhrrteTMMdWB9/QTdH8sIp0EKmNT4GWDjGZAPJ3TcrbBv+ibfwtwDqBvzYck/truxYjjLZRDflwLt7JUmEoAymdPV7INa5IXn0Uw+4f8PIqATMLQIWpQ0E/RFTmQ4nLx0B1Zfzrsr5eAmbLQW2hYpHwkcqfegNBJhzwY9sGC4aCZaF81CAvePAAMAcwtApJX/Wo0AAAAASUVORK5CYII=',toolTip);
		};
		
		this.getLeftIcon = function(toolTip)
		{
			return this.__createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAe9JREFUeNqkUz1oE2EYfu7uuyRKLCFt6g+4VNQWWod+mQRRR1En0UFOHKoNCMKNju4SEQsOzsFNcRGl4CS42AzaKhKcsqhk0Etj7u+773y/6+USbOLSF5574b33eX+e906L4xh7MaYeC/c/IFcowMznEzDTBGPMoldnqEFtkPy708mIqvHHe0s7BcaYJYSwRwPu9vbYRH1XJI4tEYb2jYtHOHko9LvdxE9cYZQcBoF9+9oJ7jgRQt+HFAJSyv9rkO6UkGvXF3mr9QelkpkUINsYR6T8Jrkay8i+b9+5yfnmppMmSFw6e4yrIynBBsdS3jQ1PH/zeTiBIt+9dZpvbTlZh1+Oh/Z3F33XRUj7R1GUxA3DwMx0EYHnDUUMPe9Rfe1tc26uiL6M8aXno+UH6O7PIShPIapMQx6sQMxW4JbL+MkKCKhwNgGN2FD7Pnz82j63coF/aoc4ekDHtxfrzUniaZrW/FfEBomI9Scv7fnVq7zdBwIqajBWpeTd99d3vgBNCaQSzMOLyJ+6ApSPWxSzD61a/MfThupSjVuvxk2A3sazYYGBGbML0OcvW9rMyeRLFO8eVGXnKyacMiug5ikSplLs05dXzqNQWpbv6/URjpK+m6JH3GhQQI2QI+RTmBO0EwQ/RUBcqe31d/4rwAB0lPTXqN6HzgAAAABJRU5ErkJggg==',toolTip);
		};
		
		this.getRightIcon = function(toolTip)
		{
			return this.__createImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAfBJREFUeNqkUz1s00AU/hwSh1SEhiFCYuhCVSExgHRiYKjEVCEyMMGAsjCxZunesWM7dIgEA8JISPyoUhFDFoZOSE2GgtrSIAYWSEPb1HUS23c+8+7iuE5/JKQ+6fOdz/e+970fG2EY4jyWVo9b819hGEZ8WCgW4z2dV2lZFUJYgnNwz9PwXRebc3cGBMfN6XSQy+eHryyCMuv43dRpBCpSz7b1qlB+cI3RWkEYlv+LQFkgBLxuV8s9OAhQLk0w7vsnSHQKVMhqQuYRSRBouK5AqyXwpHSdvfywUYkKb8UEFIU9fXybOY6A+jbszGAP7O/7RBKg2eR4dH+KvV5ej0k0gaqobXO0214c3acUDnt99Pp9cKqDUqLsx68LuHd3gtU+b1eOCOiSaaZQKJjgMsSOy7EnJcSYCZnLwKbojic1weTVMXz81KhTexeSKdSXqrUzh2X84Qxr9SQmx1P48q6mnTPZrJUs4jMp5QlHlSd1Y203fRGFK8DPV28HzqZpjXShW3+D00bamCrpNU9DuvvcGsjea1rO+nvw39+AxRCGckyO8ciQFG8gPT27ptX8/b4gt1asYGdzRGE6MVCXCJcj5NShbG9B/NnYhttpyMYL5XmTYEdw1KgMFSgJJiEbIXNGPQXBi+CTrzTO+zv/E2AA3Y8Nbp4Kn1sAAAAASUVORK5CYII=',toolTip);
		};
		
		this.__createImage = function(source,toolTip)
		{
			if(source)
			{
				var img = this.doc.createElement('img');
				img.setAttribute("src",source);
				if(toolTip)
				{
					img.setAttribute("title",toolTip);
				}
		        return img;
			}
			return null;
		};
	};
	
	NSUtil.prototype.localStorage = function(win)
	{
		this.util = new NSUtil();
		this.win = this.util.getWin(win);
		this.STORAGE_PREFIX = "nsStorage";
		this.setData = function(key,data) 
		{
		    if (this.isAPISupported() && key) 
		    {
		    	var calcKey = this.__getKey(key);
		    	var item = data;
		    	this.removeData(calcKey);
		    	if(item && !this.util.isString(item) && this.__isJSONSupported())
		    	{
		    		item = JSON.stringify(item);
		    	}
		    	localStorage.setItem(calcKey,item);
		    	return true;
		    }
		    return false;
		};
		
		this.getData = function(key) 
		{
			if (this.isAPISupported() && key) 
			{
				var item = localStorage.getItem(this.__getKey(key));
			    if (item) 
			    {
			    	if(this.__isJSONSupported())
			    	{
			    		return JSON.parse(item);
			    	}
			    	else
			    	{
			    		return item;
			    	}
			    	
			    }
		    }
		    return null;
		};
		
		this.removeData = function(key) 
		{
			if (this.isAPISupported() && key) 
			{
				localStorage.removeItem(this.__getKey(key));
				return true;
		    }
			return false;
		};
		
		this.removeAll = function()
		{
			if (this.isAPISupported()) 
			{
				var callBack = function(key)
				{
					this.removeData(key);
				};
				this.__manipulateAllKeys(callBack.bind(this));
			}
		};
		
		this.isAPISupported = function()
		{
			if (!this.win.localStorage || !this.win.JSON) 
			{
		        return false;
		    }
			 return true;
		};
		
		this.__isJSONSupported = function()
		{
			if (!this.win.JSON) 
			{
		        return false;
		    }
			 return true;
		};
		
		this.__manipulateAllKeys = function(callBack) 
		{
			if(callBack)
			{
				var keyRegex = new RegExp("^" + this.STORAGE_PREFIX + "(.*)");
				for (var count = localStorage.length-1; count >= 0 ; --count) 
				{
				      var key = localStorage.key(count);
				      key = key && key.match(keyRegex);
				      key = key && key[1];
				      if (key && key.indexOf(this.STORAGE_PREFIX) < 0) 
				      {
				    	  callBack(key);
				      }
				}
			}
		};
		
		this.__getKey = function(key)
		{
			return (this.STORAGE_PREFIX + key);
		};
	};
	
	NSUtil.prototype.replaceHTMLFromObject = function(config,doc)
	{
		this.__config = config;
		this.__setting = {};
		
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.__regex = "([\\w\\.\\^]+)";
		this.__regexString = null;
		
		this.__initialize = function()
		{
			if(!this.__config)
			{
				this.__config = {};
			}
			this.__setting = 
			{
				startSeparatorTag : (this.__config.startSeparatorTag) ? this.__config.startSeparatorTag : "{{",
				endSeparatorTag : (this.__config.endSeparatorTag) ? this.__config.endSeparatorTag : "}}"
			};
			this.__regexString = this.__setting.startSeparatorTag + this.__regex + this.__setting.endSeparatorTag;
		};
		
		this.replace = function(template,data,parent,isPureHTML) 
		{
			var retHTML = "";
			if(template && data)
			{
				isPureHTML = Boolean.parse(isPureHTML);
				var innerHTML = "";
				if(isPureHTML)
				{
					innerHTML = template;
				}
				else if(this.util.isString(template))
				{
					var element = this.doc.querySelector("#" + template);
					if(element)
					{
						innerHTML = element.innerHTML;
					}
				}
				else if(this.util.isElement(template))
				{
					template = template.innerHTML;
				}
				else
				{
					innerHTML = template;
				}
				var length = data.length;
				for (var count = 0;count < length; count++) 
				{
					retHTML += this.__replaceWithItem(data[count],innerHTML);
			    }
				if(parent)
				{
					if(this.util.isString(parent))
					{
						var element = this.doc.querySelector("#" + parent);
						if(element)
						{
							parent = element;
						}
					}
					if(parent)
					{
						parent.innerHTML += retHTML;
					}
				}
			}
			return retHTML;
		};
		
		this.__replaceWithItem = function(item,htmlText)
		{
			var html = null;
	        for (prop in item) 
	        {
	            var regex = new RegExp(this.__setting.startSeparatorTag + prop + this.__setting.endSeparatorTag,"g");
	            html = (html || htmlText).replace(regex, item[prop]);
	        }
	        return html;
		};
		
		this.__initialize();
	};
	
	NSUtil.prototype.nsPopUp = function(config,doc,win)
	{
		this.__config = config;
		this.__setting = {};
		this.__popUp = null;
		this.__documentClickHandlerRef = null;
		this.__lastZIndex = null;
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.win = this.util.getWin(win);
		
		this.create = function (dataSource) 
		{ 
			this.__createElement();
			return this.__popUp;
		};
	
		this.remove = function() 
		{
			if(this.__popUp)
			{
				this.__popUp.parentNode.removeChild(this.__popUp);
				this.__popUp = null;
				if(this.__documentClickHandlerRef)
				{
					this.util.removeEvent(this.doc,"click",this.__documentClickHandlerRef);
					this.__documentClickHandlerRef = null;
				}
			}
		};
	
		this.show = function() 
		{
			if(this.__popUp)
			{
				this.util.addStyleClass(this.__popUp,"nsShowPopUp");
				if(this.__setting.setZIndex)
				{
					var zIndex = this.util.getMaxZIndex();
					if(zIndex > 0)
					{
						if(this.__popUp.style.zIndex)
						{
							this.__lastZIndex = this.__popUp.style.zIndex;
						}
						this.__popUp.style.zIndex = zIndex + 1;
					}
				}
			}
		};
	
		this.hide = function() 
		{
			if(this.__popUp)
			{
				this.util.removeStyleClass(this.__popUp,"nsShowPopUp");
				if(this.__lastZIndex)
				{
					this.__popUp.style.zIndex = this.__lastZIndex;
					this.__lastZIndex = null;
				}
				else
				{
					this.__popUp.style.zIndex = "";
				}
			}
		};
		
		this.placePopUp = function(event,isAbsolute)
		{
			if(this.__popUp)
			{
				var position = this.__setting["position"];
				position = this.__getSuggestedPosition(event,position);
				var offset = this.__getOffset(event,position,isAbsolute);
				this.__popUp.style.top = offset.top + "px";
				this.__popUp.style.left = offset.left + "px";
			}
		};
		
		this.hideOtherNSPopUp = function()
		{
			var arrMenus = this.doc.querySelectorAll(".nsPopUp");
			if(arrMenus && arrMenus.length > 0)
			{
				var menu = null;
				for(var count = 0;count < arrMenus.length;count++)
				{
					menu = arrMenus[count];
					this.util.removeStyleClass(menu,"nsShowPopUp");
				}
			}
		};
		
		this.getPopUp = function()
		{
			return this.__popUp;
		};
		
		this.isOpen = function()
		{
			if(this.__popUp)
			{
				return this.util.hasStyleClass(this.__popUp,"nsShowPopUp");
			}
			return false;
		};
		
		this.__initialize = function()
		{
			if(!this.__config)
			{
				this.__config = {};
			}
			this.__setting = 
			{
				id: this.__config["id"] || null,
				type: this.__config["type"] || "div",
				parent: this.__config["parent"] || this.doc.body,
				width: this.__config["width"] || -1,
				position: this.__config["position"] || this.util.POS_BOTTOMRIGHT,
				closeOnOutsideClick: Boolean.parse(this.__config["closeOnOutsideClick"]),
				hideOrRemoveOnOutsideClick: this.__config["hideOrRemoveOnOutsideClick"] || "remove",
				title: this.__config["title"],
				setZIndex: this.util.isUndefinedOrNull(this.__config["setZIndex"]) ? true : Boolean.parse(this.__config["setZIndex"]),
				closeRequired: Boolean.parse(this.__config["closeRequired"]),
				closeHtml: this.__config["closeHtml"],
			};
		};
		
		this.__createElement = function() 
		{
			if(this.__popUp)
			{
				this.remove();
			}
			this.__popUp = this.doc.createElement(this.__setting["type"]); 
			if(this.__setting["id"])
			{
				this.__popUp.setAttribute("id",this.__setting["id"]);
			}
			this.util.addStyleClass(this.__popUp,"nsPopUp");
			if(this.__setting.width)
			{
				if(this.util.isNumber(this.__setting.width) && parseInt(this.__setting.width) > -1)
				{
					this.__popUp.style.width = this.__setting.width + "px";
				}
				else //for width as auto
				{
					this.__popUp.style.width = this.__setting.width;
				}
			}
			if(this.__setting["title"] || this.__setting["closeRequired"])
			{
				this.__popUp.style.minHeight = "50px";
				var divHead = this.util.createDiv(null,"nsPopUpHeader");
				var divHeadContainer = this.util.createDiv(null,"nsPopUpHeaderContainer");
				var divTitleContainer = this.util.createDiv(null,"nsPopUpTitleContainer");
				if(this.__setting["title"])
				{
					var divTitle = this.util.createDiv(null,"nsPopUpTitle");
					divTitle.innerHTML = this.__setting["title"];
					divTitleContainer.appendChild(divTitle);
				}
				divHeadContainer.appendChild(divTitleContainer);
				var divCloseContainer = this.util.createDiv(null,"nsPopUpCloseContainer");
				if(this.__setting["closeRequired"])
				{
					var btnTitle = this.util.createElement("button",null,"nsPopUpBtnClose");
					divCloseContainer.appendChild(btnTitle);
					btnTitle.innerHTML = this.__setting["closeHtml"] || "<span class=\"nsPopUpClose\"></span>";
					var self = this;
					this.util.addEvent(btnTitle,"click",function(event){
						self.__closeHandler.call(self,event);
					});
				}
				divHeadContainer.appendChild(divCloseContainer);
				divHead.appendChild(divHeadContainer);
				this.__popUp.appendChild(divHead);
			}
			if(this.__setting["closeOnOutsideClick"])
			{
				this.util.addEvent(this.__popUp,"click",this.__popUpClickHandler.bind(this));
				if(!this.__documentClickHandlerRef)
				{
					this.__documentClickHandlerRef = this.__documentClickHandler.bind(this);
					this.util.addEvent(this.doc,"click",this.__documentClickHandlerRef);
				}
			}
			this.__setting["parent"].appendChild(this.__popUp);
		};
		
		this.__popUpClickHandler = function(event)
		{
			event.stopPropagation();
		};
		
		this.__documentClickHandler = function(event)
		{
			this.__closeHandler(event);
		};
		
		this.__closeHandler = function(event)
		{
			if(this.__setting.hideOrRemoveOnOutsideClick == "remove")
			{
				this.remove();
			}
			else
			{
				this.hide();
			}
		};
	
		this.__getOffset = function(event,position,isAbsolute)
		{
			  var rectPopUp = this.__popUp.getBoundingClientRect();
			  var item = {top: 0,left:0};
			  if(rectPopUp)
			  {
				  var popUpWidth = rectPopUp.width;
				  var popUpHeight = rectPopUp.height;
				  var offset = null;
				  if(this.util.isElement(event))
				  {
					  if(isAbsolute) {
						  var coords = this.__getAbsoluteOffset(event);
					      offset = {
				            top: coords.top + event.offsetHeight,
				            left: coords.left
					      };
					  }
					  else {
						  var rects = event.getClientRects();
					  	  offset = {top:rects[0].top + event.offsetHeight,left:rects[0].left};
					  }
				  }
				  else
				  {
					  offset = this.util.getEventPosition(event);
				  }
				  switch(position) 
				  {
					case this.util.POS_TOP:
						item.top = offset.top - popUpHeight;
						item.left = offset.left - popUpWidth / 2;
						break;
					case this.util.POS_BOTTOM:
						item.top = offset.top;
						item.left = offset.left - popUpWidth / 2;
						break;
					case this.util.POS_LEFT:
						item.top =  offset.top - popUpHeight / 2;
						item.left = offset.left - popUpWidth;
						break;
					case this.util.POS_RIGHT:
						item.top =  offset.top - popUpHeight / 2,
						item.left = offset.left;
						break;
					case this.util.POS_TOPLEFT:
						item.top = offset.top - popUpHeight;
						item.left = offset.left - popUpWidth;
						break;
					case this.util.POS_TOPRIGHT:
						item.top =  offset.top - popUpHeight;
						item.left = offset.left;
						break;
					case this.util.POS_BOTTOMLEFT:
						item.top =  offset.top;
						item.left = offset.left - popUpWidth;
						break;
					case this.util.POS_BOTTOMRIGHT:
						item.top =  offset.top;
						item.left = offset.left;
						break;
				  }
			  }
			  return item;
		};
	
		this.__getSuggestedPosition = function(event,position)
		{
			  var popUpWidth = this.__popUp.clientWidth;
			  var popUpHeight = this.__popUp.clientHeight;
			  var offset = {};
			  if(this.util.isElement(event))
			  {
				  var coords = this.__getAbsoluteOffset(event);
				  offset = {
			        top: coords.top + event.offsetHeight,
			        left: coords.left
				  };
			  }
			  else
			  {
				  event = this.util.getEvent(event);
				  offset = this.util.getEventPosition(event);
			  }
			  var top = this.win.scrollY;
			  var left = this.win.scrollX;
			  var totalWidth = this.win.innerWidth;
			  var totalHeight = this.win.innerHeight;
			
			  var objPosition = {};
			  objPosition[this.util.POS_TOP] = true;
			  objPosition[this.util.POS_BOTTOM] = true;
			  objPosition[this.util.POS_LEFT] = true;
			  objPosition[this.util.POS_RIGHT] = true;
			  if (offset.top < top) 
			  {
				  objPosition[this.util.POS_TOP] = false;
			  }
			  if (offset.top + popUpHeight > top + totalHeight) 
			  {
				  objPosition[this.util.POS_BOTTOM] = false;
			  }
			  if (offset.left < left)
			  {
				  objPosition[this.util.POS_LEFT] = false;
			  }
			  if (offset.left + popUpWidth > left + totalWidth) 
			  {
				  objPosition[this.util.POS_RIGHT] = false;
			  }
			
			  var positions = position.split("-");
			  //below loop tries to give favourable position like bottom-right so if position has bottom and right both true it returns that position
			  for (var count = 0; count < positions.length; count++) 
			  {
				if (!objPosition[positions[count]]) 
				{
					break;
				}   
				if (count === positions.length - 1) 
				{
				  return position;
				}
			  }
			  //below loop tries to give one favourable position like in bottom-right if bottom is true or right is true it gets returned
			  for (var count = 0; count < positions.length; count++) 
			  {
				if (objPosition[positions[count]]) 
				{
					return positions[count];
				}
			  }
			  if (objPosition[position]) 
			  {
				  return position;
			  }
			  for(var tmpPosition in objPosition)
			  {
				  if (objPosition[tmpPosition]) 
				  {
					  return tmpPosition;
				  }
			  }
		};
		this.__getAbsoluteOffset = function(elem) {
		    var x = 0, y = 0;
		    while (elem) {
		        x += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
		        y += (elem.offsetTop - elem.scrollTop + elem.clientTop);
		        elem = elem.offsetParent;
		    }
		    return { top: y, left: x };
		};
		this.__initialize();
	};
	
	NSUtil.prototype.nsToolTipInElement = function(doc)
	{
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.__nsToolTip = null;
		this.__nsToolTipContent = null;
		this.__documentClickHandlerRef = null;
		
		this.addToolTip = function(element,toolTipHTML)
		{
			element = this.util.getElement(element);
			if(element && toolTipHTML && toolTipHTML.length > 0)
			{
				this.__createToolTip();
				this.util.addStyleClass(element,"nsElementTooltip");
				element.setAttribute("nsToolTip",toolTipHTML);
				this.util.addEvent(element,"mouseover",this.__elementMouseOverHandler.bind(this));
				this.util.addEvent(element,"mouseout",this.__elementMouseOutHandler.bind(this));
			}
		};
		
		this.__createToolTip = function()
		{
			if(!this.__nsToolTip)
			{
				var id = "nsElementToolTip" + this.util.getUniqueId();
				this.__nsToolTip = this.util.createElement("span",id + "ElementTooltipContainer", "nsElementTooltipContainer");
				var arrow = this.util.createElement("span",id + "ElementTooltipArrow", "nsElementTooltipTipArrow");
				this.__nsToolTip.appendChild(arrow);
				this.__nsToolTipContent = this.util.createElement("span",id + "ElementTooltipContent", "nsElementTooltipContent");
				this.__nsToolTip.appendChild(this.__nsToolTipContent);
				this.doc.body.appendChild(this.__nsToolTip);
				if(!this.__documentClickHandlerRef)
				{
					this.__documentClickHandlerRef = this.__documentClickHandler.bind(this);
					this.util.addEvent(this.doc,"click",this.__documentClickHandlerRef);
				}
			}
		};
		
		this.__elementMouseOverHandler = function(event)
		{
			event = this.util.getEvent(event);
			var target = this.util.getTarget(event);
			if(!this.util.hasStyleClass(target, "nsElementTooltip"))
			{
				target = this.util.findParentBySelector(target,".nsElementTooltip");
			}
			if(target)
			{
				var toolTipHTML = target.getAttribute("nsToolTip");
				//var parentWithScroll = 
				this.__nsToolTipContent.innerHTML = toolTipHTML;
				var offset = this.util.getEventPosition(event);
				this.__nsToolTip.style.left = offset.left + "px";
				this.__nsToolTip.style.top = offset.top + "px";
				this.util.addStyleClass(this.__nsToolTip,"nsElementTooltipContainerVisible");
			}
		};
		
		this.__elementMouseOutHandler = function(event)
		{
			this.util.removeStyleClass(this.__nsToolTip,"nsElementTooltipContainerVisible");
		};
		
		this.__documentClickHandler = function(event)
		{
			this.__elementMouseOutHandler();
		};
	};
	
	NSUtil.prototype.nsCSSAnimationHelper = function()
	{
		this.util = new NSUtil();
		this.__prefixes = ["webkit", "moz", "MS", "o", ""];
		
		this.addStartEvent = function(element,callback)
		{
			this.__addEvent(element,"AnimationStart",callback);
		};
		
		this.addIterationEvent = function(element,callback)
		{
			this.__addEvent(element,"AnimationIteration",callback);
		};
		
		this.addEndEvent = function(element,callback)
		{
			this.__addEvent(element,"AnimationEnd",callback);
		};
		
		this.removeStartEvent = function(element,callback)
		{
			this.__removeEvent(element,"AnimationStart",callback);
		};
		
		this.removeIterationEvent = function(element,callback)
		{
			this.__removeEvent(element,"AnimationIteration",callback);
		};
		
		this.removeEndEvent = function(element,callback)
		{
			this.__removeEvent(element,"AnimationEnd",callback);
		};
		
		this.__addEvent = function(element,type,callback) 
		{
		    for (var count = 0; count < this.__prefixes.length; count++) 
		    {
		        if (!this.__prefixes[count])
		        {
		        	type = type.toLowerCase();
		        }
		        var eventType = this.__prefixes[count] + type;
		        this.util.addEvent(element,eventType,callback);
		    }
		};
		
		this.__removeEvent = function(element,type,callback) 
		{
		    for (var count = 0; count < this.__prefixes.length; count++) 
		    {
		        if (!this.__prefixes[count])
		        {
		        	type = type.toLowerCase();
		        }
		        var eventType = this.__prefixes[count] + type;
		        this.util.removeEvent(element,eventType,callback);
		    }
		};
	};
	
	NSUtil.prototype.nsResizeListener = function(doc,win)
	{
		this.util = new NSUtil();
		this.doc = this.util.getDoc(doc);
		this.win = this.util.getWin(win);
		this.__windowResizeRef = null;
		
		this.addResizeListener = function(element,callback) 
		{
			if(this.__isResizeObserverSupported())
			{
				this.__addResizeObserver(element,callback);
			}
			else if(this.__isMutationSupported()) 
			{
				this.__addMutationObserver(element,callback);
			}
			else
			{
				this.__addResizeListener(element,callback);
			}
	    };
	    //below method will not work as we have to store the reference and then detach it
	    this.removeResizeListener = function(element,callback) 
	    {
	    	if(this.__isResizeObserverSupported())
			{
	    		this.__removeResizeObserver(element,callback);
			}
	    	else if(this.__isMutationSupported())
	    	{
	    		if(this.__windowResizeRef)
				{
	    			this.util.removeEvent(this.win,"resize",this.__windowResizeRef);
	    			this.__windowResizeRef = null;
				}
	    	}
	    	else
	    	{
	    		element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(callback), 1);
	            if (!element.__resizeListeners__.length) 
	            {
	                if (attachEvent) 
	                {
	                	element.detachEvent('onresize', this.__resizeListener.bind(this));
	                }
	                else 
	                {
	                    element.__resizeTrigger__.contentDocument.defaultView.removeEventListener('resize', this.__resizeListener.bind(this));
	                    element.__resizeTrigger__ = !element.removeChild(element.__resizeTrigger__);
	                }
	            }
	    	}
	    };
	    
	    this.__addResizeObserver = function(element,callback)
	    {
	    	//For performance reason creating 1 instance of ResizeObserver
			if(!NSUtil.__resizeObserverInstance)
			{
				NSUtil.__resizeObserverInstance = new ResizeObserver(function(entries)
				{
					for (var count = 0;count < entries.length; count++) 
					{
						var entry = entries[count];
						var callbacks = NSUtil.__resizeObserverCallbacks.get(entry.target);
						if (callbacks) 
						{
							callbacks.forEach(function logSetElements(key,value,set) 
							{
								value(entry,entry.target);
								  //console.log(key);
								  //console.log(value);
								  //console.log(set);
							});
							for (var innerCount = 0;innerCount < callbacks.length; innerCount++) 
							{
								callbacks[innerCount](entry,entry.target);
							}
						}
					}
				});
			}
			if (!NSUtil.__resizeObserverCallbacks) 
			{
				NSUtil.__resizeObserverCallbacks = new Map();
			}
			var callbacks = NSUtil.__resizeObserverCallbacks.get(element);
			if (!callbacks) 
			{
				callbacks = new Set();
				NSUtil.__resizeObserverCallbacks.set(element,callbacks);
			}
			callbacks.add(callback);
			NSUtil.__resizeObserverInstance.observe(element);
	    };
	    
	    this.__addMutationObserver = function(element,callback)
	    {
	    	var self = this;
			function getParameter(ele) 
			{
				if(ele)
				{
					return [ele.style.width,ele.style.height,ele.clientWidth,ele.clientHeight].join('');
				}
				else
				{
					var win = self.win;
					return [win.innerWidth,win.innerHeight].join('');
				}
			    
			}
			var resizeCallback = function(event)
			{
				var current = getParameter(element);
				var currentWin = getParameter();
				if (current !== last || currentWin !== lastWin) 
				{
					last = current;
					lastWin = currentWin;
					callback(event,element);
					return true;
				}
				return false;
			};
			var last = getParameter(element);
			var lastWin = getParameter();
			var observer = new MutationObserver(function (mutations) 
			{
				for (var count = 0; count < mutations.length; count++) 
				{
				    var mutation = mutations[count];
				    if (mutation.attributeName !== "style")
				    {
				    	continue;
				    }
				    if(resizeCallback())
				    {
				    	  break;
				    }
			    }
			});
			observer.observe(element,{
			    attributes: true,
			    childList: false,
			    characterData: false
			});
			if(!this.__windowResizeRef)
			{
				this.__windowResizeRef = resizeCallback.bind(this);
				this.util.addEvent(this.win,"resize",this.__windowResizeRef);
			}
	    };
	    
	    this.__addResizeListener = function(element,callback)
	    {
	    	if (!element.__resizeListeners__) 
	        {
	            element.__resizeListeners__ = [];
	            if (this.doc.attachEvent) 
	            {
	                element.__resizeTrigger__ = element;
	                element.attachEvent('onresize', this.__resizeListener.bind(this));
	            } 
	            else 
	            {
	                if (getComputedStyle(element).position === 'static') 
	                {
	                	element.style.position = 'relative';
	                }
	                var obj = element.__resizeTrigger__ = this.doc.createElement('object');
	                this.util.addStyleClass(obj,"nsResizeDetector");
	                obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
	                obj.__resizeElement__ = element;
	                obj.onload = this.__objectLoad.bind(this);
	                obj.type = 'text/html';
	                var isIE = navigator.userAgent.match(/Trident/);//this.util.isBrowserIE();
	                if(isIE) 
	                {
	                	element.appendChild(obj);
	                }
	                obj.data = 'about:blank';
	                if(!isIE) 
	                {
	                	element.appendChild(obj);
	                }
	            }
	        }
	        element.__resizeListeners__.push(callback);
	    };
	    
	    //if callback is null then delete and unobserver the element else just delete the callback
	    this.__removeResizeObserver = function(element,callback) 
	    {
			var callbacks = NSUtil.__resizeObserverCallbacks.get(element);
			if (callbacks) 
			{
				callback && callbacks.delete(callback);
				if (!callback || !callbacks.size) 
				{
					NSUtil.__resizeObserverCallbacks.delete(element);
					NSUtil.__resizeObserverInstance.unobserve(element);
				}
			}
			if (NSUtil.__resizeObserverCallbacks && !NSUtil.__resizeObserverCallbacks.size) 
			{
				NSUtil.__resizeObserverCallbacks = null;
				NSUtil.__resizeObserverInstance = null;
			}
	    };
	    
	    this.__resizeListener = function(event) 
	    {
	    	var requestAnimation = function()
	    	{
	    		 var trigger = win.__resizeTrigger__;
	             trigger.__resizeListeners__.forEach(function (callback) 
	             {
	                 callback(event,trigger);
	             });
	    	};
	    	var win = this.util.getTarget(event);
	        if (win.__resizeRAF__) 
	        {
	        	this.util.getCancelAnimationFrame.bind(this.win)(win.__resizeRAF__);
	        }
	        win.__resizeRAF__ = this.util.getRequestAnimationFrame.bind(this.win)(requestAnimation.bind(this));
	    };
	
	    this.__objectLoad = function(event) 
	    {
	    	var target = this.util.getTarget(event);
	    	target.contentDocument.defaultView.__resizeTrigger__ = target.__resizeElement__;
	    	target.contentDocument.defaultView.addEventListener('resize', this.__resizeListener.bind(this));
	    };
	    
	    this.__isMutationSupported = function()
	    {
	    	return ("MutationObserver" in this.win);
	    };
	    
	    this.__isResizeObserverSupported = function()
	    {
	    	return ("ResizeObserver" in this.win);
	    };
	};
	
	//if renderer component is refreshed using updateRowByIndex,updateRowByKeyField,updateCellByIndex,updateCellByKeyField 
    //then React throws error in removeChild as Grid is internally deleting all cell element while reRendering data
	NSUtil.prototype.overrideRemoveChild = function()
	{
		if(!Element.prototype.__removeChild) 
		{
			Document.prototype.__removeChild = Document.prototype.removeChild;
			Element.prototype.__removeChild = Element.prototype.removeChild;
			
			Document.prototype.removeChild = Element.prototype.removeChild = function removeChild(child) 
			{
				if(child && child.parentNode) 
				{
					if(child.parentNode == this)
					{
						this.__removeChild(child);
					}
					else
					{
						child.parentNode.__removeChild(child);
					}
				}
			};
		}
	};
	
	if (!String.prototype.startsWith) 
	{
		  String.prototype.startsWith = function(searchString, position) 
		  {
		    position = position || 0;
		    return this.indexOf(searchString, position) === position;
		  };
	}
	
	if (!Element.prototype.matches) 
	{
	    Element.prototype.matches = Element.prototype.msMatchesSelector;
	}
	
	(function(doc, proto) 
	{
	  try 
	  { // check if browser supports :scope natively
	    doc.querySelector(':scope body');
	  } 
	  catch (err) 
	  { // polyfill native methods if it doesn't
	    ['querySelector', 'querySelectorAll'].forEach(function(method) 
	    {
	      var nativ = proto[method];
	      proto[method] = function(selectors) 
	      {
	        if (/(^|,)\s*:scope/.test(selectors)) { // only if selectors contains :scope
	          var id = this.id; // remember current element id
	          this.id = 'ID_' + Date.now(); // assign new unique id
	          selectors = selectors.replace(/((^|,)\s*):scope/g, '$1#' + this.id); // replace :scope with #ID
	          var result = doc[method](selectors);
	          this.id = id; // restore previous id
	          return result;
	        } else {
	          return nativ.call(this, selectors); // use native code for other selectors
	        }
	      };
	    });
	  }
	})(__nsGlobal.doc, Element.prototype);
	
	return NSUtil;
})();
nsModuleExport(__nsGlobal,"NSUtil",NSUtil);