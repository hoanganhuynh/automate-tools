require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const htmlToImage = require('html-to-image');
const date = require('date-time');
const download = require('downloadjs');

const representEl = document.getElementById('represent-element');

// get image information
const widthEl = document.getElementById('width');
const heightEl = document.getElementById('height');
const nameEl = document.getElementById('name');    
const wordEl = document.getElementById('word'); 
const viEl = document.getElementById('vi');
const enEl = document.getElementById('en');
const spellingEl = document.getElementById('spelling');

// assign name field for the first time
nameEl.placeholder = date();

document.getElementById('render-button').addEventListener('click', (event) => {
    // prevent the page reloading
    event.preventDefault();    

    const width = (widthEl.value) ? widthEl.value : '500';
    const height = (heightEl.value) ? heightEl.value : '420';
    const name = (nameEl.value) ? nameEl.value : date();
    const word = wordEl.value; 
    const vi = viEl.value;
    const en = enEl.value;
    const spelling = spellingEl.value;

    // assign image information to represent element
    document.getElementById('word').innerHTML = word;
    document.getElementById('meaning-vi').innerHTML = vi;
    document.getElementById('meaning-en').innerHTML = en;
    document.getElementById('spelling').innerHTML = spelling;

    representEl.style.width = `${width}px`;
    representEl.style.height = `${height}px`;

    htmlToImage.toPng(representEl)
        .then(function(dataURL) {            
            download(dataURL, name, 'image/png');
        })
        .catch(function(err) {            
            console.log(err);
        });
})
},{"date-time":2,"downloadjs":3,"html-to-image":12}],2:[function(require,module,exports){
'use strict';
const timeZone = require('time-zone');

const dateTime = options => {
	options = Object.assign({
		date: new Date(),
		local: true,
		showTimeZone: false,
		showMilliseconds: false
	}, options);

	let {date} = options;

	if (options.local) {
		// Offset the date so it will return the correct value when getting the ISO string
		date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
	}

	let end = '';

	if (options.showTimeZone) {
		end = ' UTC' + (options.local ? timeZone(date) : '');
	}

	if (options.showMilliseconds && date.getUTCMilliseconds() > 0) {
		end = ` ${date.getUTCMilliseconds()}ms${end}`;
	}

	return date
		.toISOString()
		.replace(/T/, ' ')
		.replace(/\..+/, end);
};

module.exports = dateTime;
// TODO: Remove this for the next major release
module.exports.default = dateTime;

},{"time-zone":14}],3:[function(require,module,exports){
//download.js v4.2, by dandavis; 2008-2016. [MIT] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.download = factory();
  }
}(this, function () {

	return function download(data, strFileName, strMimeType) {

		var self = window, // this script is only for browsers anyway...
			defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
			mimeType = strMimeType || defaultMime,
			payload = data,
			url = !strFileName && !strMimeType && payload,
			anchor = document.createElement("a"),
			toString = function(a){return String(a);},
			myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
			fileName = strFileName || "download",
			blob,
			reader;
			myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
	  
		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
			payload=[payload, mimeType];
			mimeType=payload[0];
			payload=payload[1];
		}


		if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
			fileName = url.split("/").pop().split("?")[0];
			anchor.href = url; // assign href prop to temp anchor
		  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
        		var ajax=new XMLHttpRequest();
        		ajax.open( "GET", url, true);
        		ajax.responseType = 'blob';
        		ajax.onload= function(e){ 
				  download(e.target.response, fileName, defaultMime);
				};
        		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
			    return ajax;
			} // end if valid url?
		} // end if url?


		//go ahead and download dataURLs right away
		if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)){
		
			if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
				payload=dataUrlToBlob(payload);
				mimeType=payload.type || defaultMime;
			}else{			
				return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
					navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
					saver(payload) ; // everyone else can save dataURLs un-processed
			}
			
		}else{//not data url, is it a string with special needs?
			if(/([\x80-\xff])/.test(payload)){			  
				var i=0, tempUiArr= new Uint8Array(payload.length), mx=tempUiArr.length;
				for(i;i<mx;++i) tempUiArr[i]= payload.charCodeAt(i);
			 	payload=new myBlob([tempUiArr], {type: mimeType});
			}		  
		}
		blob = payload instanceof myBlob ?
			payload :
			new myBlob([payload], {type: mimeType}) ;


		function dataUrlToBlob(strUrl) {
			var parts= strUrl.split(/[:;,]/),
			type= parts[1],
			decoder= parts[2] == "base64" ? atob : decodeURIComponent,
			binData= decoder( parts.pop() ),
			mx= binData.length,
			i= 0,
			uiArr= new Uint8Array(mx);

			for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

			return new myBlob([uiArr], {type: type});
		 }

		function saver(url, winMode){

			if ('download' in anchor) { //html5 A[download]
				anchor.href = url;
				anchor.setAttribute("download", fileName);
				anchor.className = "download-js-link";
				anchor.innerHTML = "downloading...";
				anchor.style.display = "none";
				document.body.appendChild(anchor);
				setTimeout(function() {
					anchor.click();
					document.body.removeChild(anchor);
					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
				}, 66);
				return true;
			}

			// handle non-a[download] safari as best we can:
			if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
				if(/^data:/.test(url))	url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
				if(!window.open(url)){ // popup blocked, offer direct download:
					if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
				}
				return true;
			}

			//do iframe dataURL download (old ch+FF):
			var f = document.createElement("iframe");
			document.body.appendChild(f);

			if(!winMode && /^data:/.test(url)){ // force a mime that will download:
				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
			}
			f.src=url;
			setTimeout(function(){ document.body.removeChild(f); }, 333);

		}//end saver




		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
			return navigator.msSaveBlob(blob, fileName);
		}

		if(self.URL){ // simple fast and modern way using Blob and URL:
			saver(self.URL.createObjectURL(blob), true);
		}else{
			// handle non-Blob()+non-URL browsers:
			if(typeof blob === "string" || blob.constructor===toString ){
				try{
					return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
				}catch(y){
					return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
				}
			}

			// Blob but not URL support:
			reader=new FileReader();
			reader.onload=function(e){
				saver(this.result);
			};
			reader.readAsDataURL(blob);
		}
		return true;
	}; /* end download() */
}));

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function applyStyleWithOptions(clonedNode, options) {
    var style = clonedNode.style;
    if (options.backgroundColor) {
        style.backgroundColor = options.backgroundColor;
    }
    if (options.width) {
        style.width = options.width + "px";
    }
    if (options.height) {
        style.height = options.height + "px";
    }
    if (options.style) {
        Object.assign(style, options.style);
    }
    return clonedNode;
}
exports.default = applyStyleWithOptions;

},{}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var clonePseudoElements_1 = __importDefault(require("./clonePseudoElements"));
function cloneSingleNode(nativeNode) {
    if (nativeNode instanceof HTMLCanvasElement) {
        return utils_1.createImage(nativeNode.toDataURL());
    }
    if (nativeNode.tagName && nativeNode.tagName.toLowerCase() === 'svg') {
        return Promise.resolve(nativeNode)
            .then(function (svg) { return utils_1.svgToDataURL(svg); })
            .then(utils_1.createImage);
    }
    return Promise.resolve(nativeNode.cloneNode(false));
}
function cloneChildren(nativeNode, clonedNode, filter) {
    var children = utils_1.toArray(nativeNode.childNodes);
    if (children.length === 0) {
        return Promise.resolve(clonedNode);
    }
    // clone children in order
    return children.reduce(function (done, child) { return done
        .then(function () { return cloneNode(child, filter); })
        .then(function (clonedChild) {
        if (clonedChild) {
            clonedNode.appendChild(clonedChild);
        }
    }); }, Promise.resolve())
        .then(function () { return clonedNode; });
}
function cloneCssStyle(nativeNode, clonedNode) {
    var source = window.getComputedStyle(nativeNode);
    var target = clonedNode.style;
    if (source.cssText) {
        target.cssText = source.cssText;
    }
    else {
        utils_1.toArray(source).forEach(function (name) {
            target.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
        });
    }
}
function cloneInputValue(nativeNode, clonedNode) {
    if (nativeNode instanceof HTMLTextAreaElement) {
        clonedNode.innerHTML = nativeNode.value;
    }
    if (nativeNode instanceof HTMLInputElement) {
        clonedNode.setAttribute('value', nativeNode.value);
    }
}
function decorate(nativeNode, clonedNode) {
    if (!(clonedNode instanceof Element)) {
        return clonedNode;
    }
    return Promise.resolve()
        .then(function () { return cloneCssStyle(nativeNode, clonedNode); })
        .then(function () { return clonePseudoElements_1.default(nativeNode, clonedNode); })
        .then(function () { return cloneInputValue(nativeNode, clonedNode); })
        .then(function () { return clonedNode; });
}
function cloneNode(domNode, filter, isRoot) {
    if (!isRoot && filter && !filter(domNode)) {
        return Promise.resolve(null);
    }
    return Promise.resolve(domNode)
        .then(cloneSingleNode)
        .then(function (clonedNode) { return cloneChildren(domNode, clonedNode, filter); })
        .then(function (clonedNode) { return decorate(domNode, clonedNode); });
}
exports.default = cloneNode;

},{"./clonePseudoElements":6,"./utils":13}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function formatCssText(style) {
    var content = style.getPropertyValue('content');
    return style.cssText + " content: " + content + ";";
}
function formatCssProperties(style) {
    return utils_1.toArray(style).map(function (name) {
        var value = style.getPropertyValue(name);
        var priority = style.getPropertyPriority(name);
        return name + ": " + value + (priority ? ' !important' : '') + ";";
    }).join(' ');
}
function getPseudoElementStyle(className, pseudo, style) {
    var selector = "." + className + ":" + pseudo;
    var cssText = style.cssText ? formatCssText(style) : formatCssProperties(style);
    return document.createTextNode(selector + "{" + cssText + "}");
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
    var style = window.getComputedStyle(nativeNode, pseudo);
    var content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    var className = utils_1.uuid();
    var styleElement = document.createElement('style');
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
    clonedNode.className = clonedNode.className + " " + className;
    clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode) {
    [
        ':before',
        ':after',
    ].forEach(function (pseudo) { return clonePseudoElement(nativeNode, clonedNode, pseudo); });
}
exports.default = clonePseudoElements;

},{"./utils":13}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function createSvgDataURL(clonedNode, width, height) {
    var xmlns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(xmlns, 'svg');
    var foreignObject = document.createElementNS(xmlns, 'foreignObject');
    svg.setAttributeNS('', 'width', "" + width);
    svg.setAttributeNS('', 'height', "" + height);
    foreignObject.setAttributeNS('', 'width', '100%');
    foreignObject.setAttributeNS('', 'height', '100%');
    foreignObject.setAttributeNS('', 'x', '0');
    foreignObject.setAttributeNS('', 'y', '0');
    foreignObject.setAttributeNS('', 'externalResourcesRequired', 'true');
    svg.appendChild(foreignObject);
    foreignObject.appendChild(clonedNode);
    return utils_1.svgToDataURL(svg);
}
exports.default = createSvgDataURL;

},{"./utils":13}],8:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var getBlobFromURL_1 = __importDefault(require("./getBlobFromURL"));
var embedResources_1 = __importDefault(require("./embedResources"));
function embedBackground(clonedNode, options) {
    var background = clonedNode.style.getPropertyValue('background');
    if (!background) {
        return Promise.resolve(clonedNode);
    }
    return Promise.resolve(background)
        .then(function (cssString) { return embedResources_1.default(cssString, null, options); })
        .then(function (cssString) {
        clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
        return clonedNode;
    });
}
function embedImageNode(clonedNode, options) {
    if (!(clonedNode instanceof HTMLImageElement) || utils_1.isDataUrl(clonedNode.src)) {
        return Promise.resolve(clonedNode);
    }
    return Promise.resolve(clonedNode.src)
        .then(function (url) { return getBlobFromURL_1.default(url, options); })
        .then(function (data) { return utils_1.toDataURL(data, utils_1.getMimeType(clonedNode.src)); })
        .then(function (dataURL) { return new Promise((function (resolve, reject) {
        clonedNode.onload = resolve;
        clonedNode.onerror = reject;
        clonedNode.src = dataURL;
    })); })
        .then(function () { return clonedNode; }, function () { return clonedNode; });
}
function embedChildren(clonedNode, options) {
    var children = utils_1.toArray(clonedNode.childNodes);
    var deferreds = children.map(function (child) { return embedImages(child, options); });
    return Promise.all(deferreds).then(function () { return clonedNode; });
}
function embedImages(clonedNode, options) {
    if (!(clonedNode instanceof Element)) {
        return Promise.resolve(clonedNode);
    }
    return Promise.resolve(clonedNode)
        .then(function (node) { return embedBackground(node, options); })
        .then(function (node) { return embedImageNode(node, options); })
        .then(function (node) { return embedChildren(node, options); });
}
exports.default = embedImages;

},{"./embedResources":9,"./getBlobFromURL":11,"./utils":13}],9:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var getBlobFromURL_1 = __importDefault(require("./getBlobFromURL"));
var utils_1 = require("./utils");
var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
function resolveUrl(url, baseUrl) {
    // url is absolute already
    if (url.match(/^[a-z]+:\/\//i)) {
        return url;
    }
    // url is absolute already, without protocol
    if (url.match(/^\/\//)) {
        return window.location.protocol + url;
    }
    // dataURI, mailto:, tel:, etc.
    if (url.match(/^[a-z]+:/i)) {
        return url;
    }
    var doc = document.implementation.createHTMLDocument();
    var base = doc.createElement('base');
    var a = doc.createElement('a');
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl) {
        base.href = baseUrl;
    }
    a.href = url;
    return a.href;
}
function escape(url) {
    return url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}
function urlToRegex(url) {
    return new RegExp("(url\\(['\"]?)(" + escape(url) + ")(['\"]?\\))", 'g');
}
function parseURLs(str) {
    var result = [];
    str.replace(URL_REGEX, function (raw, quotation, url) {
        result.push(url);
        return raw;
    });
    return result.filter(function (url) { return !utils_1.isDataUrl(url); });
}
function embed(cssString, resourceURL, baseURL, options) {
    var resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    return Promise.resolve(resolvedURL)
        .then(function (url) { return getBlobFromURL_1.default(url, options); })
        .then(function (data) { return utils_1.toDataURL(data, utils_1.getMimeType(resourceURL)); })
        .then(function (dataURL) { return cssString.replace(urlToRegex(resourceURL), "$1" + dataURL + "$3"); })
        .then(function (content) { return content; }, function () { return resolvedURL; });
}
function shouldEmbed(string) {
    return string.search(URL_REGEX) !== -1;
}
exports.shouldEmbed = shouldEmbed;
function embedResources(cssString, baseUrl, options) {
    if (!shouldEmbed(cssString)) {
        return Promise.resolve(cssString);
    }
    return Promise.resolve(cssString)
        .then(parseURLs)
        .then(function (urls) { return urls.reduce(function (done, url) { return done.then(function (ret) { return embed(ret, url, baseUrl, options); }); }, Promise.resolve(cssString)); });
}
exports.default = embedResources;

},{"./getBlobFromURL":11,"./utils":13}],10:[function(require,module,exports){
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var embedResources_1 = __importStar(require("./embedResources"));
function parseCSS(source) {
    if (source === undefined) {
        return [];
    }
    var cssText = source;
    var css = [];
    var cssKeyframeRegex = '((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})';
    var combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]'
        + '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})'; // to match css & media queries together
    var cssCommentsRegex = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)', 'gi');
    // strip out comments
    cssText = cssText.replace(cssCommentsRegex, '');
    var keyframesRegex = new RegExp(cssKeyframeRegex, 'gi');
    var arr;
    while (true) {
        arr = keyframesRegex.exec(cssText);
        if (arr === null) {
            break;
        }
        css.push(arr[0]);
    }
    cssText = cssText.replace(keyframesRegex, '');
    // unified regex
    var unified = new RegExp(combinedCSSRegex, 'gi');
    while (true) {
        arr = unified.exec(cssText);
        if (arr === null) {
            break;
        }
        css.push(arr[0]);
    }
    return css;
}
function fetchCSS(url, sheet) {
    return fetch(url).then(function (res) {
        return {
            url: url,
            cssText: res.text(),
        };
    }, function (e) {
        console.log('ERROR FETCHING CSS: ', e.toString());
    });
}
function embedFonts(data) {
    return data.cssText.then(function (resolved) {
        var cssText = resolved;
        var fontLocations = cssText.match(/url\([^)]+\)/g) || [];
        var fontLoadedPromises = fontLocations.map(function (location) {
            var url = location.replace(/url\(([^]+)\)/g, '$1');
            if (!url.startsWith('https://')) {
                var source = data.url;
                url = new URL(url, source).href;
            }
            return new Promise(function (resolve, reject) {
                fetch(url)
                    .then(function (res) { return res.blob(); })
                    .then(function (blob) {
                    var reader = new FileReader();
                    reader.addEventListener('load', function (res) {
                        // Side Effect
                        cssText = cssText.replace(location, "url(" + reader.result + ")");
                        resolve([location, reader.result]);
                    });
                    reader.readAsDataURL(blob);
                })
                    .catch(reject);
            });
        });
        return Promise.all(fontLoadedPromises).then(function () { return cssText; });
    });
}
function getCssRules(styleSheets) {
    var ret = [];
    var promises = [];
    // First loop inlines imports
    styleSheets.forEach(function (sheet) {
        if ('cssRules' in sheet) {
            try {
                utils_1.toArray(sheet.cssRules).forEach(function (item) {
                    if (item.type === CSSRule.IMPORT_RULE) {
                        promises.push(fetchCSS(item.href, sheet)
                            .then(embedFonts)
                            .then(function (cssText) {
                            var parsed = parseCSS(cssText);
                            parsed.forEach(function (rule) {
                                sheet.insertRule(rule, sheet.cssRules.length);
                            });
                        })
                            .catch(function (e) {
                            console.log('Error loading remote css', e.toString());
                        }));
                    }
                });
            }
            catch (e) {
                var inline_1 = styleSheets.find(function (a) { return a.href === null; }) || document.styleSheets[0];
                if (sheet.href != null) {
                    promises.push(fetchCSS(sheet.href, inline_1)
                        .then(embedFonts)
                        .then(function (cssText) {
                        var parsed = parseCSS(cssText);
                        parsed.forEach(function (rule) {
                            inline_1.insertRule(rule, sheet.cssRules.length);
                        });
                    })
                        .catch(function (e) {
                        console.log('Error loading remote stylesheet', e.toString());
                    }));
                }
                console.log('Error inlining remote css file', e.toString());
            }
        }
    });
    return Promise
        .all(promises)
        .then(function () {
        // Second loop parses rules
        styleSheets.forEach(function (sheet) {
            if ('cssRules' in sheet) {
                try {
                    utils_1.toArray(sheet.cssRules).forEach(function (item) {
                        ret.push(item);
                    });
                }
                catch (e) {
                    console.log("Error while reading CSS rules from " + sheet.href, e.toString());
                }
            }
        });
        return ret;
    });
}
function getWebFontRules(cssRules) {
    return cssRules
        .filter(function (rule) { return rule.type === CSSRule.FONT_FACE_RULE; })
        .filter(function (rule) { return embedResources_1.shouldEmbed(rule.style.getPropertyValue('src')); });
}
function parseWebFontRules(clonedNode) {
    return new Promise(function (resolve, reject) {
        if (!clonedNode.ownerDocument) {
            reject(new Error('Provided element is not within a Document'));
        }
        resolve(utils_1.toArray(clonedNode.ownerDocument.styleSheets));
    })
        .then(getCssRules)
        .then(getWebFontRules);
}
exports.parseWebFontRules = parseWebFontRules;
function embedWebFonts(clonedNode, options) {
    return parseWebFontRules(clonedNode)
        .then(function (rules) { return Promise.all(rules.map(function (rule) {
        var baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
        return embedResources_1.default(rule.cssText, baseUrl, options);
    })); })
        .then(function (cssStrings) { return cssStrings.join('\n'); })
        .then(function (cssString) {
        var styleNode = document.createElement('style');
        var sytleContent = document.createTextNode(cssString);
        styleNode.appendChild(sytleContent);
        if (clonedNode.firstChild) {
            clonedNode.insertBefore(styleNode, clonedNode.firstChild);
        }
        else {
            clonedNode.appendChild(styleNode);
        }
        return clonedNode;
    });
}
exports.default = embedWebFonts;

},{"./embedResources":9,"./utils":13}],11:[function(require,module,exports){
"use strict";
/* tslint:disable:max-line-length */
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
// KNOWN ISSUE
// -----------
// Can not handle redirect-url, such as when access 'http://something.com/avatar.png'
// will redirect to 'http://something.com/65fc2ffcc8aea7ba65a1d1feda173540'
var TIMEOUT = 30000;
function getBlobFromURL(url, options) {
    // cache bypass so we dont have CORS issues with cached images
    // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
    if (options.cacheBust) {
        url += ((/\?/).test(url) ? '&' : '?') + (new Date()).getTime(); // tslint:disable-line
    }
    var failed = function (reason) {
        var placeholder = '';
        if (options.imagePlaceholder) {
            var split = options.imagePlaceholder.split(/,/);
            if (split && split[1]) {
                placeholder = split[1];
            }
        }
        var msg = "Failed to fetch resource: " + url;
        if (reason) {
            msg = typeof reason === 'string' ? reason : reason.message;
        }
        if (msg) {
            console.error(msg);
        }
        return placeholder;
    };
    var deferred = window.fetch
        // fetch
        ? window.fetch(url)
            .then(function (response) { return response.blob(); })
            .then(function (blob) { return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onloadend = function () { return resolve(reader.result); };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }); })
            .then(utils_1.getDataURLContent)
            .catch(function () { return new Promise(function (resolve, reject) {
            reject();
        }); })
        // xhr
        : new Promise((function (resolve, reject) {
            var req = new XMLHttpRequest();
            var timeout = function () {
                reject(new Error("Timeout of " + TIMEOUT + "ms occured while fetching resource: " + url));
            };
            var done = function () {
                if (req.readyState !== 4) {
                    return;
                }
                if (req.status !== 200) {
                    reject(new Error("Failed to fetch resource: " + url + ", status: " + req.status));
                    return;
                }
                var encoder = new FileReader();
                encoder.onloadend = function () {
                    resolve(utils_1.getDataURLContent(encoder.result));
                };
                encoder.readAsDataURL(req.response);
            };
            req.onreadystatechange = done;
            req.ontimeout = timeout;
            req.responseType = 'blob';
            req.timeout = TIMEOUT;
            req.open('GET', url, true);
            req.send();
        }));
    return deferred.catch(failed);
}
exports.default = getBlobFromURL;

},{"./utils":13}],12:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cloneNode_1 = __importDefault(require("./cloneNode"));
var embedWebFonts_1 = __importDefault(require("./embedWebFonts"));
var embedImages_1 = __importDefault(require("./embedImages"));
var createSvgDataURL_1 = __importDefault(require("./createSvgDataURL"));
var applyStyleWithOptions_1 = __importDefault(require("./applyStyleWithOptions"));
var utils_1 = require("./utils");
function getImageSize(domNode, options) {
    if (options === void 0) { options = {}; }
    var width = options.width || utils_1.getNodeWidth(domNode);
    var height = options.height || utils_1.getNodeHeight(domNode);
    return { width: width, height: height };
}
function toSvgDataURL(domNode, options) {
    if (options === void 0) { options = {}; }
    var _a = getImageSize(domNode, options), width = _a.width, height = _a.height;
    return cloneNode_1.default(domNode, options.filter, true)
        .then(function (clonedNode) { return embedWebFonts_1.default(clonedNode, options); })
        .then(function (clonedNode) { return embedImages_1.default(clonedNode, options); })
        .then(function (clonedNode) { return applyStyleWithOptions_1.default(clonedNode, options); })
        .then(function (clonedNode) { return createSvgDataURL_1.default(clonedNode, width, height); });
}
exports.toSvgDataURL = toSvgDataURL;
function toCanvas(domNode, options) {
    if (options === void 0) { options = {}; }
    return toSvgDataURL(domNode, options)
        .then(utils_1.createImage)
        .then(utils_1.delay(100))
        .then(function (image) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var ratio = utils_1.getPixelRatio();
        var _a = getImageSize(domNode, options), width = _a.width, height = _a.height;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = "" + width;
        canvas.style.height = "" + height;
        context.scale(ratio, ratio);
        if (options.backgroundColor) {
            context.fillStyle = options.backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0);
        return canvas;
    });
}
exports.toCanvas = toCanvas;
function toPixelData(domNode, options) {
    if (options === void 0) { options = {}; }
    var _a = getImageSize(domNode, options), width = _a.width, height = _a.height;
    return toCanvas(domNode, options)
        .then(function (canvas) { return (canvas.getContext('2d').getImageData(0, 0, width, height).data); });
}
exports.toPixelData = toPixelData;
function toPng(domNode, options) {
    if (options === void 0) { options = {}; }
    return toCanvas(domNode, options).then(function (canvas) { return (canvas.toDataURL()); });
}
exports.toPng = toPng;
function toJpeg(domNode, options) {
    if (options === void 0) { options = {}; }
    return toCanvas(domNode, options).then(function (canvas) { return (canvas.toDataURL('image/jpeg', options.quality || 1)); });
}
exports.toJpeg = toJpeg;
function toBlob(domNode, options) {
    if (options === void 0) { options = {}; }
    return toCanvas(domNode, options).then(utils_1.canvasToBlob);
}
exports.toBlob = toBlob;
exports.default = {
    toSvgDataURL: toSvgDataURL,
    toCanvas: toCanvas,
    toPixelData: toPixelData,
    toPng: toPng,
    toJpeg: toJpeg,
    toBlob: toBlob,
};

},{"./applyStyleWithOptions":4,"./cloneNode":5,"./createSvgDataURL":7,"./embedImages":8,"./embedWebFonts":10,"./utils":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WOFF = 'application/font-woff';
var JPEG = 'image/jpeg';
var mimes = {
    woff: WOFF,
    woff2: WOFF,
    ttf: 'application/font-truetype',
    eot: 'application/vnd.ms-fontobject',
    png: 'image/png',
    jpg: JPEG,
    jpeg: JPEG,
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
};
exports.uuid = (function uuid() {
    // generate uuid for className of pseudo elements.
    // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
    var counter = 0;
    // ref: http://stackoverflow.com/a/6248722/2519373
    var randomFourChars = function () {
        return ("0000" + (Math.random() * (Math.pow(36, 4)) << 0).toString(36)).slice(-4);
    };
    return function () {
        counter += 1;
        return "u" + randomFourChars() + counter;
    };
}());
function parseExtension(url) {
    var match = /\.([^./]*?)$/g.exec(url);
    if (match)
        return match[1];
    return '';
}
exports.parseExtension = parseExtension;
function getMimeType(url) {
    var ext = parseExtension(url).toLowerCase();
    return mimes[ext] || '';
}
exports.getMimeType = getMimeType;
function delay(ms) {
    return function (args) { return new Promise((function (resolve) {
        setTimeout(function () {
            resolve(args);
        }, ms);
    })); };
}
exports.delay = delay;
function createImage(url) {
    return new Promise((function (resolve, reject) {
        var image = new Image();
        image.onload = function () {
            resolve(image);
        };
        image.onerror = reject;
        image.crossOrigin = 'anonymous';
        image.src = url;
    }));
}
exports.createImage = createImage;
function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
exports.isDataUrl = isDataUrl;
function toDataURL(content, mimeType) {
    return "data:" + mimeType + ";base64," + content;
}
exports.toDataURL = toDataURL;
function getDataURLContent(dataURL) {
    return dataURL.split(/,/)[1];
}
exports.getDataURLContent = getDataURLContent;
function toBlob(canvas) {
    return new Promise((function (resolve) {
        var binaryString = window.atob(canvas.toDataURL().split(',')[1]);
        var len = binaryString.length;
        var binaryArray = new Uint8Array(len);
        for (var i = 0; i < len; i += 1) {
            binaryArray[i] = binaryString.charCodeAt(i);
        }
        resolve(new Blob([binaryArray], {
            type: 'image/png',
        }));
    }));
}
function canvasToBlob(canvas) {
    if (canvas.toBlob) {
        return new Promise((function (resolve) {
            canvas.toBlob(resolve);
        }));
    }
    return toBlob(canvas);
}
exports.canvasToBlob = canvasToBlob;
function toArray(arrayLike) {
    var arr = [];
    for (var i = 0, l = arrayLike.length; i < l; i += 1) {
        arr.push(arrayLike[i]);
    }
    return arr;
}
exports.toArray = toArray;
function px(node, styleProperty) {
    var value = window.getComputedStyle(node).getPropertyValue(styleProperty);
    return parseFloat(value.replace('px', ''));
}
function getNodeWidth(node) {
    var leftBorder = px(node, 'border-left-width');
    var rightBorder = px(node, 'border-right-width');
    return node.scrollWidth + leftBorder + rightBorder;
}
exports.getNodeWidth = getNodeWidth;
function getNodeHeight(node) {
    var topBorder = px(node, 'border-top-width');
    var bottomBorder = px(node, 'border-bottom-width');
    return node.scrollHeight + topBorder + bottomBorder;
}
exports.getNodeHeight = getNodeHeight;
function getPixelRatio() {
    return (window.devicePixelRatio || 1);
}
exports.getPixelRatio = getPixelRatio;
function svgToDataURL(svg) {
    return Promise.resolve()
        .then(function () { return new XMLSerializer().serializeToString(svg); })
        .then(encodeURIComponent)
        .then(function (html) { return "data:image/svg+xml;charset=utf-8," + html; });
}
exports.svgToDataURL = svgToDataURL;
function getBlobFromImageURL(url) {
    return createImage(url).then(function (image) {
        var width = image.width, height = image.height;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var ratio = getPixelRatio();
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = "" + width;
        canvas.style.height = "" + height;
        context.scale(ratio, ratio);
        context.drawImage(image, 0, 0);
        var dataURL = canvas.toDataURL(getMimeType(url));
        return getDataURLContent(dataURL);
    });
}
exports.getBlobFromImageURL = getBlobFromImageURL;

},{}],14:[function(require,module,exports){
'use strict';
module.exports = date => {
	const offset = (date || new Date()).getTimezoneOffset();
	const absOffset = Math.abs(offset);
	const hours = Math.floor(absOffset / 60);
	const minutes = absOffset % 60;
	const minutesOut = minutes > 0 ? ':' + ('0' + minutes).slice(-2) : '';

	return (offset < 0 ? '+' : '-') + hours + minutesOut;
};

},{}],15:[function(require,module,exports){
var indexOf = function (xs, item) {
    if (xs.indexOf) return xs.indexOf(item);
    else for (var i = 0; i < xs.length; i++) {
        if (xs[i] === item) return i;
    }
    return -1;
};
var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    if (context) {
        forEach(Object_keys(ctx), function (key) {
            context[key] = ctx[key];
        });
    }

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.isContext = function (context) {
    return context instanceof Context;
};

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{}],"JSONPath":[function(require,module,exports){
/*global module, exports, require*/
/*jslint vars:true, evil:true*/
/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 */

(function (require) {'use strict';

// Keep compatibility with old browsers
if (!Array.isArray) {
    Array.isArray = function (vArg) {
        return Object.prototype.toString.call(vArg) === '[object Array]';
    };
}

// Make sure to know if we are in real node or not (the `require` variable
// could actually be require.js, for example.
var isNode = typeof module !== 'undefined' && !!module.exports;

var allowedResultTypes = ['value', 'path', 'parent', 'parentProperty', 'all'];

var vm = isNode ?
    require('vm') : {
        runInNewContext: function (expr, context) {
            return eval(Object.keys(context).reduce(function (s, vr) {
                return 'var ' + vr + '=' + JSON.stringify(context[vr]).replace(/\u2028|\u2029/g, function (m) {
                    // http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
                    return '\\u202' + (m === '\u2028' ? '8' : '9');
                }) + ';' + s;
            }, expr));
        }
    };

function push (arr, elem) {arr = arr.slice(); arr.push(elem); return arr;}
function unshift (elem, arr) {arr = arr.slice(); arr.unshift(elem); return arr;}

function JSONPath (opts, expr, obj, callback) {
    if (!(this instanceof JSONPath)) {
        try {
            return new JSONPath(opts, expr, obj, callback);
        }
        catch (e) {
            if (!e.avoidNew) {
                throw e;
            }
            return e.value;
        }
    }

    opts = opts || {};
    var objArgs = opts.hasOwnProperty('json') && opts.hasOwnProperty('path');
    this.json = opts.json || obj;
    this.path = opts.path || expr;
    this.resultType = (opts.resultType && opts.resultType.toLowerCase()) || 'value';
    this.flatten = opts.flatten || false;
    this.wrap = opts.hasOwnProperty('wrap') ? opts.wrap : true;
    this.sandbox = opts.sandbox || {};
    this.preventEval = opts.preventEval || false;
    this.parent = opts.parent || null;
    this.parentProperty = opts.parentProperty || null;
    this.callback = opts.callback || null;
    this.otherTypeCallback = opts.otherTypeCallback || function () {
        throw "You must supply an otherTypeCallback callback option with the @other() operator.";
    };

    if (opts.autostart !== false) {
        var ret = this.evaluate({
            path: (objArgs ? opts.path : expr),
            json: (objArgs ? opts.json : obj)
        });
        if (!ret || typeof ret !== 'object') {
            throw {avoidNew: true, value: ret, message: "JSONPath should not be called with 'new' (it prevents return of (unwrapped) scalar values)"};
        }
        return ret;
    }
}

// PUBLIC METHODS

JSONPath.prototype.evaluate = function (expr, json, callback, otherTypeCallback) {
    var self = this,
        flatten = this.flatten,
        wrap = this.wrap,
        currParent = this.parent,
        currParentProperty = this.parentProperty;

    this.currResultType = this.resultType;
    this.currPreventEval = this.preventEval;
    this.currSandbox = this.sandbox;
    callback = callback || this.callback;
    this.currOtherTypeCallback = otherTypeCallback || this.otherTypeCallback;

    json = json || this.json;
    expr = expr || this.path;
    if (expr && typeof expr === 'object') {
        if (!expr.path) {
            throw "You must supply a 'path' property when providing an object argument to JSONPath.evaluate().";
        }
        json = expr.hasOwnProperty('json') ? expr.json : json;
        flatten = expr.hasOwnProperty('flatten') ? expr.flatten : flatten;
        this.currResultType = expr.hasOwnProperty('resultType') ? expr.resultType : this.currResultType;
        this.currSandbox = expr.hasOwnProperty('sandbox') ? expr.sandbox : this.currSandbox;
        wrap = expr.hasOwnProperty('wrap') ? expr.wrap : wrap;
        this.currPreventEval = expr.hasOwnProperty('preventEval') ? expr.preventEval : this.currPreventEval;
        callback = expr.hasOwnProperty('callback') ? expr.callback : callback;
        this.currOtherTypeCallback = expr.hasOwnProperty('otherTypeCallback') ? expr.otherTypeCallback : this.currOtherTypeCallback;
        currParent = expr.hasOwnProperty('parent') ? expr.parent : currParent;
        currParentProperty = expr.hasOwnProperty('parentProperty') ? expr.parentProperty : currParentProperty;
        expr = expr.path;
    }
    currParent = currParent || null;
    currParentProperty = currParentProperty || null;

    if (Array.isArray(expr)) {
        expr = JSONPath.toPathString(expr);
    }
    if (!expr || !json || allowedResultTypes.indexOf(this.currResultType) === -1) {
        return;
    }
    this._obj = json;

    var exprList = JSONPath.toPathArray(expr);
    if (exprList[0] === '$' && exprList.length > 1) {exprList.shift();}
    var result = this._trace(exprList, json, ['$'], currParent, currParentProperty, callback);
    result = result.filter(function (ea) { return ea && !ea.isParentSelector; });

    if (!result.length) {return wrap ? [] : undefined;}
    if (result.length === 1 && !wrap && !Array.isArray(result[0].value)) {
        return this._getPreferredOutput(result[0]);
    }
    return result.reduce(function (result, ea) {
        var valOrPath = self._getPreferredOutput(ea);
        if (flatten && Array.isArray(valOrPath)) {
            result = result.concat(valOrPath);
        }
        else {
            result.push(valOrPath);
        }
        return result;
    }, []);
};


// PRIVATE METHODS

JSONPath.prototype._getPreferredOutput = function (ea) {
    var resultType = this.currResultType;
    switch (resultType) {
    case 'all':
        ea.path = JSONPath.toPathString(ea.path);
        return ea;
    case 'value': case 'parent': case 'parentProperty':
        return ea[resultType];
    case 'path':
        return JSONPath.toPathString(ea[resultType]);
    }
};

JSONPath.prototype._handleCallback = function (fullRetObj, callback, type) {
    if (callback) {
        var preferredOutput = this._getPreferredOutput(fullRetObj);
        fullRetObj.path = JSONPath.toPathString(fullRetObj.path);
        callback(preferredOutput, type, fullRetObj);
    }
};

JSONPath.prototype._trace = function (expr, val, path, parent, parentPropName, callback) {
    // No expr to follow? return path and value as the result of this trace branch
    var retObj, self = this;
    if (!expr.length) {
        retObj = {path: path, value: val, parent: parent, parentProperty: parentPropName};
        this._handleCallback(retObj, callback, 'value');
        return retObj;
    }

    var loc = expr[0], x = expr.slice(1);

    // We need to gather the return value of recursive trace calls in order to
    // do the parent sel computation.
    var ret = [];
    function addRet (elems) {ret = ret.concat(elems);}

    if (val && val.hasOwnProperty(loc)) { // simple case--directly follow property
        addRet(this._trace(x, val[loc], push(path, loc), val, loc, callback));
    }
    else if (loc === '*') { // all child properties
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            addRet(self._trace(unshift(m, x), v, p, par, pr, cb));
        });
    }
    else if (loc === '..') { // all descendent parent properties
        addRet(this._trace(x, val, path, parent, parentPropName, callback)); // Check remaining expression with val's immediate children
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            // We don't join m and x here because we only want parents, not scalar values
            if (typeof v[m] === 'object') { // Keep going with recursive descent on val's object children
                addRet(self._trace(unshift(l, x), v[m], push(p, m), v, m, cb));
            }
        });
    }
    else if (loc[0] === '(') { // [(expr)] (dynamic property/index)
        if (this.currPreventEval) {
            throw "Eval [(expr)] prevented in JSONPath expression.";
        }
        // As this will resolve to a property name (but we don't know it yet), property and parent information is relative to the parent of the property to which this expression will resolve
        addRet(this._trace(unshift(this._eval(loc, val, path[path.length - 1], path.slice(0, -1), parent, parentPropName), x), val, path, parent, parentPropName, callback));
    }
    // The parent sel computation is handled in the frame above using the
    // ancestor object of val
    else if (loc === '^') {
        // This is not a final endpoint, so we do not invoke the callback here
        return path.length ? {
            path: path.slice(0, -1),
            expr: x,
            isParentSelector: true
        } : [];
    }
    else if (loc === '~') { // property name
        retObj = {path: push(path, loc), value: parentPropName, parent: parent, parentProperty: null};
        this._handleCallback(retObj, callback, 'property');
        return retObj;
    }
    else if (loc === '$') { // root only
        addRet(this._trace(x, val, path, null, null, callback));
    }
    else if (loc.indexOf('?(') === 0) { // [?(expr)] (filtering)
        if (this.currPreventEval) {
            throw "Eval [?(expr)] prevented in JSONPath expression.";
        }
        this._walk(loc, x, val, path, parent, parentPropName, callback, function (m, l, x, v, p, par, pr, cb) {
            if (self._eval(l.replace(/^\?\((.*?)\)$/, '$1'), v[m], m, p, par, pr)) {
                addRet(self._trace(unshift(m, x), v, p, par, pr, cb));
            }
        });
    }
    else if (loc.indexOf(',') > -1) { // [name1,name2,...]
        var parts, i;
        for (parts = loc.split(','), i = 0; i < parts.length; i++) {
            addRet(this._trace(unshift(parts[i], x), val, path, parent, parentPropName, callback));
        }
    }
    else if (loc[0] === '@') { // value type: @boolean(), etc.
        var addType = false;
        var valueType = loc.slice(1, -2);
        switch (valueType) {
        case 'boolean': case 'string': case 'undefined': case 'function':
            if (typeof val === valueType) {
                addType = true;
            }
            break;
        case 'number':
            if (typeof val === valueType && isFinite(val)) {
                addType = true;
            }
            break;
        case 'nonFinite':
            if (typeof val === 'number' && !isFinite(val)) {
                addType = true;
            }
            break;
        case 'object':
            if (val && typeof val === valueType) {
                addType = true;
            }
            break;
        case 'array':
            if (Array.isArray(val)) {
                addType = true;
            }
            break;
        case 'other':
            addType = this.currOtherTypeCallback(val, path, parent, parentPropName);
            break;
        case 'integer':
            if (val === +val && isFinite(val) && !(val % 1)) {
                addType = true;
            }
            break;
        case 'null':
            if (val === null) {
                addType = true;
            }
            break;
        }
        if (addType) {
            retObj = {path: path, value: val, parent: parent, parentProperty: parentPropName};
            this._handleCallback(retObj, callback, 'value');
            return retObj;
        }
    }
    else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) { // [start:end:step]  Python slice syntax
        addRet(this._slice(loc, x, val, path, parent, parentPropName, callback));
    }

    // We check the resulting values for parent selections. For parent
    // selections we discard the value object and continue the trace with the
    // current val object
    return ret.reduce(function (all, ea) {
        return all.concat(ea.isParentSelector ? self._trace(ea.expr, val, ea.path, parent, parentPropName, callback) : ea);
    }, []);
};

JSONPath.prototype._walk = function (loc, expr, val, path, parent, parentPropName, callback, f) {
    var i, n, m;
    if (Array.isArray(val)) {
        for (i = 0, n = val.length; i < n; i++) {
            f(i, loc, expr, val, path, parent, parentPropName, callback);
        }
    }
    else if (typeof val === 'object') {
        for (m in val) {
            if (val.hasOwnProperty(m)) {
                f(m, loc, expr, val, path, parent, parentPropName, callback);
            }
        }
    }
};

JSONPath.prototype._slice = function (loc, expr, val, path, parent, parentPropName, callback) {
    if (!Array.isArray(val)) {return;}
    var i,
        len = val.length, parts = loc.split(':'),
        start = (parts[0] && parseInt(parts[0], 10)) || 0,
        end = (parts[1] && parseInt(parts[1], 10)) || len,
        step = (parts[2] && parseInt(parts[2], 10)) || 1;
    start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
    end    = (end < 0)    ? Math.max(0, end + len) : Math.min(len, end);
    var ret = [];
    for (i = start; i < end; i += step) {
        ret = ret.concat(this._trace(unshift(i, expr), val, path, parent, parentPropName, callback));
    }
    return ret;
};

JSONPath.prototype._eval = function (code, _v, _vname, path, parent, parentPropName) {
    if (!this._obj || !_v) {return false;}
    if (code.indexOf('@parentProperty') > -1) {
        this.currSandbox._$_parentProperty = parentPropName;
        code = code.replace(/@parentProperty/g, '_$_parentProperty');
    }
    if (code.indexOf('@parent') > -1) {
        this.currSandbox._$_parent = parent;
        code = code.replace(/@parent/g, '_$_parent');
    }
    if (code.indexOf('@property') > -1) {
        this.currSandbox._$_property = _vname;
        code = code.replace(/@property/g, '_$_property');
    }
    if (code.indexOf('@path') > -1) {
        this.currSandbox._$_path = JSONPath.toPathString(path.concat([_vname]));
        code = code.replace(/@path/g, '_$_path');
    }
    if (code.indexOf('@') > -1) {
        this.currSandbox._$_v = _v;
        code = code.replace(/@/g, '_$_v');
    }
    try {
        return vm.runInNewContext(code, this.currSandbox);
    }
    catch(e) {
        console.log(e);
        throw new Error('jsonPath: ' + e.message + ': ' + code);
    }
};

// PUBLIC CLASS PROPERTIES AND METHODS

// Could store the cache object itself
JSONPath.cache = {};

JSONPath.toPathString = function (pathArr) {
    var i, n, x = pathArr, p = '$';
    for (i = 1, n = x.length; i < n; i++) {
        p += (/~|@.*\(\)/).test(x[i]) ? x[i] : ((/^[0-9*]+$/).test(x[i]) ? ('[' + x[i] + ']') : ("['" + x[i] + "']"));
    }
    return p;
};

JSONPath.toPathArray = function (expr) {
    var cache = JSONPath.cache;
    if (cache[expr]) {return cache[expr];}
    var subx = [];
    var normalized = expr
                    // Properties
                    .replace(/@(?:null|boolean|number|string|array|object|integer|undefined|nonFinite|function|other)\(\)/g, ';$&;')
                    .replace(/~/g, ';~;')
                    // Parenthetical evaluations (filtering and otherwise), directly within brackets or single quotes
                    .replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {return '[#' + (subx.push($1) - 1) + ']';})
                    // Escape periods within properties
                    .replace(/\['([^'\]]*)'\]/g, function ($0, prop) {
                        return "['" + prop.replace(/\./g, '%@%') + "']";
                    })
                    // Split by property boundaries
                    .replace(/'?\.'?(?![^\[]*\])|\['?/g, ';')
                    // Reinsert periods within properties
                    .replace(/%@%/g, '.')
                    // Parent
                    .replace(/(?:;)?(\^+)(?:;)?/g, function ($0, ups) {return ';' + ups.split('').join(';') + ';';})
                    // Descendents
                    .replace(/;;;|;;/g, ';..;')
                    // Remove trailing
                    .replace(/;$|'?\]|'$/g, '');
    var exprList = normalized.split(';').map(function (expr) {
        var match = expr.match(/#([0-9]+)/);
        return !match || !match[1] ? expr : subx[match[1]];
    });
    cache[expr] = exprList;
    return cache[expr];
};

// For backward compatibility (deprecated)
JSONPath.eval = function (obj, expr, opts) {
    return JSONPath(opts, expr, obj);
};

if (typeof define === 'function' && define.amd) {
    define(function() {return JSONPath;});
}
else if (typeof module === 'undefined') {
    self.jsonPath = { // Deprecated
        eval: JSONPath.eval
    };
    self.JSONPath = JSONPath;
}
else {
    module.exports = JSONPath;
}

}(typeof require === 'undefined' ? null : require));

},{"vm":15}]},{},[1]);
