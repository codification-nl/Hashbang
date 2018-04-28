// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language ECMASCRIPT6_STRICT
// @language_out NO_TRANSPILE
// @output_file_name hashbang.min.js
// @use_types_for_optimization true
// ==/ClosureCompiler==

(window => {
	"use strict";

	const document = window.document;
	const location = window.location;

	Object.defineProperty(Object.prototype, "define", {
		value: function (property, value, writable) {
			const descripties = ["configurable", "enumerable", "value", "writable", "get", "set"];

			if (value === null || Object.keys(value).every(i => !descripties.includes(i))) {
				value = {
					value: value,
					writable: writable || false,
					enumerable: !property.startsWith("_")
				};
			}

			Object.defineProperty(this, property, value);
		}
	});

	const helpers = {
		$: { value: function (a) { return this.querySelector(a); } },
		$$: { value: function (a) { return [...this.querySelectorAll(a)]; } },
		addAttribute: {
			value: function (a) {
				this.setAttribute(a, "");
			}
		},
		clearChildren: {
			value: function () {
				let child;

				while ((child = this.firstChild) !== null) {
					this.removeChild(child);
				}
			}
		},
		findParentElement: {
			value: function (parent) {
				let element = this;

				while (element !== null && element !== document.documentElement) {
					if (element === parent) {
						return true;
					}

					element = element.parentElement;
				}

				return false;
			}
		}
	};

	Object.defineProperties(Element.prototype, helpers);
	Object.defineProperties(Document.prototype, helpers);
	Object.defineProperties(DocumentFragment.prototype, helpers);

	Object.defineProperties(Array.prototype, {
		clear: {
			value: function () {
				while (this.length) {
					this.shift();
				}
			}
		},
		select: {
			value: function (callback) {
				return this.reduce((result, i) => result.concat(callback(i)), []);
			}
		}
	});

	if (!("clamp" in Math)) {
		Math.define("clamp", (x, a, b) => Math.min(Math.max(+x, +a), +b));
	}

	/** @namespace HB */
	const hb = {};

	/**
	 * @function hb.uuid
	 * @returns {string}
	 */
	hb.define("uuid", () => {
		const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

		return uuid.replace(/[xy]/g, function (i) {
			let r = (Math.random() * 16) | 0;

			if (i === "y") {
				r = (r & 3) | 8;
			}

			return r.toString(16);
		});
	});

	/**
	 * @class Event
	 */
	class Event {

		/**
		 * Event constructor.
		 * @param {string} type
		 * @param {Event~Callback} callback
		 */
		constructor(type, callback) {
			/**
			 * @readonly
			 * @member {string} Event#type
			 */
			this.define("type", type);

			/**
			 * @readonly
			 * @member {Event~Callback} Event#callback
			 */
			this.define("callback", callback);
		}
	}

	/**
	 * @callback Event~Callback
	 * @param {...*} params
	 */

	/**
	 * @class hb.EventDispatcher
	 */
	class EventDispatcher {

		/**
		 * EventDispatcher constructor.
		 */
		constructor() {
			/**
			 * @private
			 * @readonly
			 * @member {Array.<Event>} hb.EventDispatcher#_events
			 */
			this.define("_events", []);
		}

		/**
		 * @param {string} type
		 * @param {...*} params
		 */
		dispatch(type, ...params) {
			this._events.forEach(event => {
				if (event.type === type) {
					event.callback(...params);
				}
			});
		}

		/**
		 * @param {string} type
		 * @param {Event~Callback} callback
		 */
		on(type, callback) {
			this._events.push(new Event(type, callback));
		}
	}

	/**
	 * @class Route
	 */
	class Route {

		/**
		 * Route constructor.
		 * @param {string} route
		 * @param {Route~Callback} callback
		 * @param {boolean} [last = false]
		 */
		constructor(route, callback, last) {
			const patternOpt = /\((\/:[a-z]+)\)\?/g;
			const replaceOpt = "(?:$1)?";

			const patternVal = /:[a-z]+/g;
			const replaceVal = "([a-zA-Z0-9\\-._~!$$&'()*,;=:@+%]+)";

			/**
			 * @readonly
			 * @member {string} Route#name
			 */
			this.define("name", route);

			/**
			 * @readonly
			 * @member {Route~Callback} Route#callback
			 */
			this.define("callback", callback);

			route = route.replace(patternOpt, replaceOpt);
			route = route.replace(patternVal, replaceVal);

			/**
			 * @readonly
			 * @member {RegExp} Route#pattern
			 */
			this.define("pattern", new RegExp(route));

			/**
			 * @readonly
			 * @member {boolean} Route#last
			 * @default false
			 */
			this.define("last", last || false);
		}
	}

	/**
	 * @callback Route~Callback
	 * @param {...string} params
	 */

	/**
	 * @class hb.Router
	 * @extends Array
	 */
	class Router extends Array {

		/**
		 * Router constructor.
		 */
		constructor() {
			super();

			window.addEventListener("hashchange", () => this.match(), false);
		}

		/**
		 * @param {string} route
		 * @param {Route~Callback} callback
		 * @param {boolean} [last = false]
		 */
		map(route, callback, last) {
			super.push(new Route(route, callback, last));
		}

		match() {
			const hash = `/${location.hash.substr(3)}`;

			for (let i = 0; i < this.length; i++) {
				/** @type {Route} */
				const route = this[i];

				let matches = hash.match(route.pattern);

				if (matches === null) {
					continue;
				}

				matches.shift();

				matches = matches.map(Router.decode);

				console.info("Router: %s", route.name, matches);

				route.callback(...matches);

				if (route.last) {
					break;
				}
			}
		}

		/**
		 * @param {string} x
		 * @returns {string}
		 */
		static encode(x) {
			return x.replace(/ /g, "+");
		}

		/**
		 * @param {string} x
		 * @returns {string}
		 */
		static decode(x) {
			return window.decodeURIComponent(x.replace(/\+/g, " "));
		}
	}

	/**
	 * @class hb.Client
	 * @extends hb.EventDispatcher
	 */
	class Client extends EventDispatcher {

		/**
		 * @type {boolean}
		 */
		get ready() {
			return this._ready;
		}

		/**
		 * @type {number}
		 */
		get timeout() {
			return this._xhr.timeout / 1000;
		}

		/**
		 * @type {number}
		 */
		set timeout(value) {
			this._xhr.timeout = value * 1000;
		}

		/**
		 * Router constructor.
		 * @param {XMLHttpRequestResponseType} [type = "json"]
		 * @param {string} [accept = "application/json"]
		 */
		constructor(type, accept) {
			super();

			type   = type || "json";
			accept = accept || "application/json";

			/**
			 * @private
			 * @readonly
			 * @member {Array.<Element>} hb.Client#_targets
			 */
			this.define("_targets", []);

			/**
			 * @private
			 * @readonly
			 * @member {string} hb.Client#_accept
			 * @default "application/json"
			 */
			this.define("_accept", accept);

			/**
			 * @private
			 * @member {boolean} hb.Client#_ready
			 * @default true
			 */
			this.define("_ready", true, true);

			/**
			 * @private
			 * @readonly
			 * @member {XMLHttpRequest} hb.Client#_xhr
			 */
			this.define("_xhr", new XMLHttpRequest());

			this._xhr.responseType = type;

			this._xhr.addEventListener("timeout", () => this._timeout(), false);
			this._xhr.addEventListener("load", () => this._load(), false);
			this._xhr.addEventListener("error", () => this._error(), false);

			this._xhr.addEventListener("progress", event => {
				this.dispatch("progress", event.loaded, event.total);
			}, false);
		}

		/**
		 * @private
		 * @fires hb.Client~timeout
		 * @fires hb.Client~ready
		 */
		_timeout() {
			this._ready = true;

			this._targets.forEach(x => x.removeAttribute("loading"));

			this.dispatch("timeout", this._targets);
			this.dispatch("ready", this._targets);
		}

		/**
		 * @private
		 * @fires hb.Client~loaded
		 * @fires hb.Client~error
		 * @fires hb.Client~ready
		 */
		_load() {
			this._ready = true;

			this._targets.forEach(x => x.removeAttribute("loading"));

			if (this._xhr.status < 400) {
				this.dispatch("loaded", this._xhr.response, this._targets);
			} else {
				this.dispatch("error", this._xhr.response || {
					code: this._xhr.status,
					message: this._xhr.statusText
				}, this._targets);
			}

			this.dispatch("ready", this._targets);
		}

		/**
		 * @private
		 * @fires hb.Client~error
		 * @fires hb.Client~ready
		 */
		_error() {
			this._ready = true;

			this._targets.forEach(x => x.removeAttribute("loading"));

			this.dispatch("error", {
				code: 523,
				message: "Disconnected"
			}, this._targets);

			this.dispatch("ready", this._targets);
		}

		/**
		 * @param {string} method
		 * @param {string} url
		 * @param {?Object} [params = null]
		 * @param {...Element} [targets]
		 * @fires hb.Client~timeout
		 * @fires hb.Client~loaded
		 * @fires hb.Client~error
		 * @fires hb.Client~progress
		 * @fires hb.Client~ready
		 */
		request(method, url, params, ...targets) {
			params = params || null;

			console.info("Client: %s %s", method, url, params);

			this._targets.forEach(x => x.removeAttribute("loading"));
			this._targets.clear();

			this._xhr.abort();

			if (method === "GET" && params !== null) {
				url += `?${Client.query(params)}`;
			}

			this._xhr.open(method, url, true);

			this._xhr.setRequestHeader("Accept", this._accept);

			if (method !== "GET" && params !== null) {
				params = JSON.stringify(params);

				this._xhr.setRequestHeader("Content-Type", "application/json");
			}

			this._targets.push(...targets);
			this._targets.forEach(x => x.addAttribute("loading"));

			this._xhr.send(method !== "GET" ? params : null);

			this._ready = false;
		}

		/**
		 * @param {string} x
		 * @returns {string}
		 */
		static encode(x) {
			return window.encodeURIComponent(x);
		}

		/**
		 * @param {string} x
		 * @returns {string}
		 */
		static decode(x) {
			return window.decodeURIComponent(x);
		}

		/**
		 * @param {Object} p
		 * @returns {string}
		 */
		static query(p) {
			return Object.keys(p).map(i => `${i}=${Client.encode(p[i])}`).join("&");
		}
	}

	/**
	 * @callback hb.Client~EventHandler
	 * @param {?Array.<Element>} targets
	 */

	/**
	 * @callback hb.Client~DataHandler
	 * @param {?Object} data
	 * @param {?Array.<Element>} targets
	 */

	/**
	 * @callback hb.Client~ProgressHandler
	 * @param {number} loaded - Number of bytes transferred
	 * @param {number} total - Total number of bytes
	 */

	/**
	 * @event hb.Client~timeout
	 * @type {hb.Client~EventHandler}
	 */

	/**
	 * @event hb.Client~loaded
	 * @type {hb.Client~DataHandler}
	 */

	/**
	 * @event hb.Client~error
	 * @type {hb.Client~DataHandler}
	 */

	/**
	 * @event hb.Client~progress
	 * @type {hb.Client~ProgressHandler}
	 */

	/**
	 * @event hb.Client~ready
	 * @type {hb.Client~EventHandler}
	 */

	/** @type {RegExp} @memberOf hb.Template~ */ const patternControl     = /{%\s*.+?\s*%}/;
	/** @type {RegExp} @memberOf hb.Template~ */ const patternFor         = /{%\s*for\s+(.+?)\s+in\s+(.+?)\s*%}/;
	/** @type {RegExp} @memberOf hb.Template~ */ const patternMarkers     = /{{\s*(.+?)(?:\|(.+?))?\s*}}/g;
	/** @type {RegExp} @memberOf hb.Template~ */ const patternFnSignature = /(.+?)\((.*?)\)/;
	/** @type {RegExp} @memberOf hb.Template~ */ const patternTokens      = /{(\d+)}/g;
	/** @type {RegExp} @memberOf hb.Template~ */ const patternFnParams    = /\s*,\s*/;

	/**
	 * @class hb.Template
	 */
	class Template {

		/**
		 * @type {number}
		 */
		static get NONE() {
			return -1;
		}

		/**
		 * @type {number}
		 */
		static get MARKER() {
			return 0;
		}

		/**
		 * @type {number}
		 */
		static get FOR() {
			return 1;
		}

		/**
		 * @private
		 * @type {string}
		 */
		get _current() {
			return `{${this._.length}}`;
		}

		/**
		 * Template constructor.
		 * @param {HTMLTemplateElement} element
		 */
		constructor(element) {

			/**
			 * @private
			 * @readonly
			 * @member {Array.<Object>} hb.Template#_
			 */
			this.define("_", []);

			/**
			 * @private
			 * @readonly
			 * @member {string} hb.Template#_source
			 */
			this.define("_source", this._parse(element.innerHTML));

			/**
			 * @private
			 * @readonly
			 * @member {Object} hb.Template#_fn
			 */
			this.define("_fn", {});

			/**
			 * @private
			 * @readonly
			 * @member {Range} hb.Template#_range
			 */
			this.define("_range", document.createRange());
		}

		/**
		 * @param {string} name
		 * @param {Function} fn
		 */
		fn(name, fn) {
			this._fn.define(name, fn);
		}

		/**
		 * @private
		 * @param {string} source
		 * @returns {string}
		 */
		_parseMarkers(source) {
			return source.replace(patternMarkers, (_, $, fn) => {
				const token = this._current;

				this._.push({
					$: $,
					fn: fn || null,
					type: Template.MARKER
				});

				return token;
			});
		}

		/**
		 * @private
		 * @param {string} source
		 * @param {number} [cursor = 0]
		 * @param {number} [begin]
		 * @param {Array.<string>} [matches]
		 * @returns {string}
		 */
		_parseControls(source, cursor, begin, matches) {
			cursor = cursor || 0;

			let from = cursor;

			let control;

			while ((control = source.slice(cursor).match(patternControl)) !== null) {
				control = control[0];

				cursor = source.indexOf(control, cursor);

				let token = this._current;
				let end   = cursor + control.length;

				switch (control) {
					case "{% endfor %}": {
						this._.push({
							$: source.slice(from, cursor),
							var: matches[1],
							in: matches[2],
							type: Template.FOR
						});

						return source.substr(0, begin) + token + source.substr(end);
					}
				}

				let m;

				if ((m = control.match(patternFor)) !== null) {
					source = this._parseControls(source, end, cursor, m);
				}

				cursor += token.length;
			}

			return source;
		}

		/**
		 * @private
		 * @param {string} source
		 * @returns {string}
		 */
		_parse(source) {
			source = source.replace(/\s{2,}/g, "");

			source = this._parseMarkers(source);
			source = this._parseControls(source);

			return source;
		}

		/**
		 * @private
		 * @param {string} $
		 * @param {Object} data
		 * @returns {*}
		 */
		static _reduce($, data) {
			let result = data;

			const parts = $.split(".");

			for (let i = 0; i < parts.length; i++) {
				result = result[parts[i]];

				if (!result) {
					return "";
				}
			}

			return result;
		}

		/**
		 * @private
		 * @param {Object} token
		 * @param {Object} data
		 * @returns {string}
		 */
		_processMarker(token, data) {
			let $  = Template._reduce(token.$, data);
			let fn = token.fn;

			if (fn === null) {
				return $;
			}

			let signature = fn.match(patternFnSignature);

			if (signature !== null) {
				fn = signature[1];
			}

			fn = this._fn[fn];

			if (fn && fn instanceof Function) {
				const params = [$];

				if (signature !== null) {
					params.push(...signature[2].split(patternFnParams));
				}

				$ = fn(...params);
			}

			return $;
		}

		/**
		 * @private
		 * @param {string} source
		 * @param {Object} data
		 * @returns {string}
		 */
		_process(source, data) {
			return source.replace(patternTokens, (_, index) => {
				const token = this._[index | 0];

				let result = "";

				switch (token.type) {
					case Template.MARKER:
						return this._processMarker(token, data);

					case Template.FOR:
						const $$ = Template._reduce(token.in, data);

						for (let i in $$) {
							if ($$.hasOwnProperty(i)) {
								result += this._process(token.$, { [token.var]: $$[i] });
							}
						}

						break;
				}

				return result;
			});
		}

		/**
		 * @param {?Object} [data]
		 * @returns {DocumentFragment}
		 */
		render(data) {
			return this._range.createContextualFragment(this._process(this._source, data));
		}
	}

	/**
	 * @class hb.Timer
	 * @extends hb.EventDispatcher
	 */
	class Timer extends EventDispatcher {

		/**
		 * Timer constructor.
		 */
		constructor() {
			super();

			/**
			 * @private
			 * @member {?number} hb.Timer#_id
			 * @default null
			 */
			this.define("_id", null, true);
		}

		/**
		 * @param {number} seconds
		 * @fires hb.Timer~started
		 * @fires hb.Timer~ended
		 */
		start(seconds) {
			this.stop();

			this.dispatch("started");

			this._id = window.setTimeout(() => {
				this.dispatch("ended");
				this._id = null;
			}, seconds * 1000);
		}

		/**
		 * @fires hb.Timer~stopped
		 */
		stop() {
			if (this._id === null) {
				return;
			}

			window.clearTimeout(this._id);

			this.dispatch("stopped");

			this._id = null;
		}
	}

	/** @event hb.Timer~started */

	/** @event hb.Timer~ended */

	/** @event hb.Timer~stopped */

	/**
	 * @class hb.Showable
	 * @extends hb.EventDispatcher
	 * @abstract
	 */
	class Showable extends EventDispatcher {

		/**
		 * @type {boolean}
		 */
		get open() { return this.element.hasAttribute("open"); }

		/**
		 * @type {boolean}
		 */
		set open(value) {
			if (value) {
				this.element.addAttribute("open");
			} else {
				this.element.removeAttribute("open");
			}
		}

		/**
		 * Showable constructor.
		 * @param {Element} element
		 */
		constructor(element) {
			super();

			/**
			 * @readonly
			 * @member {Element} hb.Showable#element
			 */
			this.define("element", element);
		}

		show() {
			this.open = true;
		}

		close() {
			this.open = false;
		}
	}

	hb.define("EventDispatcher", EventDispatcher);
	hb.define("Timer", Timer);
	hb.define("Template", Template);
	hb.define("Router", Router);
	hb.define("Client", Client);
	hb.define("Showable", Showable);

	window.define("hb", hb);
})(window);