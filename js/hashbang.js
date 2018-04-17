// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language ECMASCRIPT6_STRICT
// @language_out ECMASCRIPT6_STRICT
// @output_file_name hashbang.min.js
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

	if (Math.clamp === undefined) {
		Math.define("clamp", (x, a, b) => Math.min(Math.max(+x, +a), +b));
	}

	/**
	 * Class Event
	 * @memberOf HB
	 */
	class Event {

		/**
		 * Event constructor.
		 * @param {string} type
		 * @param {EventCallback} callback
		 */
		constructor(type, callback) {
			/**
			 * @public
			 * @readonly
			 * @member {string} type
			 * @memberOf HB.Event#
			 */
			this.define("type", type);

			/**
			 * @public
			 * @function callback
			 * @param {...*} params
			 * @memberOf HB.Event#
			 */
			this.define("callback", callback);
		}
	}

	/**
	 * @callback EventCallback
	 * @param {...*} params
	 */

	/**
	 * Class EventTarget
	 * @memberOf HB
	 */
	class EventTarget {

		/**
		 * EventTarget constructor.
		 */
		constructor() {
			/**
			 * @private
			 * @readonly
			 * @member {HB.Event[]} _events
			 * @memberOf HB.EventTarget#
			 */
			this.define("_events", []);
		}

		/**
		 * @public
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
		 * @public
		 * @param {string} type
		 * @param {EventCallback} callback
		 */
		on(type, callback) {
			this._events.push(new Event(type, callback));
		}
	}

	/**
	 * Class Timer
	 * @extends HB.EventTarget
	 * @memberOf HB
	 */
	class Timer extends EventTarget {

		/**
		 * Timer constructor.
		 */
		constructor() {
			super();

			/**
			 * @private
			 * @member {?number} _id
			 * @memberOf HB.Timer#
			 * @default null
			 */
			this.define("_id", null, true);
		}

		/**
		 * @public
		 * @param {number} seconds
		 * @fires HB.Timer~started
		 * @fires HB.Timer~ended
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
		 * @public
		 * @fires HB.Timer~stopped
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

	/**
	 * @public
	 * @memberOf HB.Timer~
	 * @event started
	 */

	/**
	 * @public
	 * @memberOf HB.Timer~
	 * @event ended
	 */

	/**
	 * @public
	 * @memberOf HB.Timer~
	 * @event stopped
	 */

	/**
	 * Class Template
	 * @memberOf HB
	 */
	class Template {

		/**
		 * Template constructor.
		 * @param {HTMLTemplateElement} element
		 */
		constructor(element) {
			let source = element.innerHTML;

			source = source.replace(/\s{2,}/g, "");
			source = source.replace(/{{(.*?)}}/g, "',$1,'");
			source = source.split("{%").join("');");
			source = source.split("%}").join("a.push('");
			source = `const a=[];a.push('${source}');return a.join('');`;

			/**
			 * @private
			 * @readonly
			 * @member {Function} _source
			 * @memberOf HB.Template#
			 */
			this.define("_source", new Function(source));

			/**
			 * @private
			 * @readonly
			 * @member {Range} _range
			 * @memberOf HB.Template#
			 */
			this.define("_range", document.createRange());
		}

		/**
		 * @public
		 * @param {?Object} [data]
		 * @returns {DocumentFragment}
		 */
		render(data) {
			return this._range.createContextualFragment(this._source.call(data));
		}
	}

	/**
	 * @private
	 * @class Route
	 */
	class Route {

		/**
		 * Route constructor.
		 * @param {string} handle
		 * @param {RouteCallback} callback
		 * @param {boolean} [last = false]
		 */
		constructor(handle, callback, last) {
			const regExp = /\((\/:[a-z]+)\)\?/g;

			if (regExp.test(handle)) {
				handle = handle.replace(regExp, "(?:$1)?");
			}

			/**
			 * @public
			 * @readonly
			 * @member {string} handle
			 * @memberOf Route#
			 */
			this.define("handle", handle);

			/**
			 * @public
			 * @readonly
			 * @member {RegExp} pattern
			 * @memberOf Route#
			 */
			this.define("pattern", new RegExp(this.handle.replace(/:[a-z]+/g, "([a-zA-Z0-9\\-._~!$$&'()*,;=:@+%]+)")));

			/**
			 * @public
			 * @function callback
			 * @param {...string} params
			 * @memberOf Route#
			 */
			this.define("callback", callback);

			/**
			 * @public
			 * @readonly
			 * @member {boolean} last
			 * @memberOf Route#
			 * @default false
			 */
			this.define("last", last || false);
		}
	}

	/**
	 * @callback RouteCallback
	 * @param {...string} params
	 */

	/**
	 * Class Router
	 * @extends Array
	 * @memberOf HB
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
		 * @public
		 * @param {string} handle
		 * @param {RouteCallback} callback
		 * @param {boolean} [last = false]
		 */
		map(handle, callback, last) {
			super.push(new Route(handle, callback, last));
		}

		/**
		 * @public
		 */
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

				console.info("Router: %s", route.handle, matches);

				route.callback(...matches);

				if (route.last) {
					break;
				}
			}
		}

		/**
		 * @public
		 * @param {string} x
		 * @returns {string}
		 */
		static encode(x) {
			return x.replace(/ /g, "+");
		}

		/**
		 * @public
		 * @param {string} x
		 * @returns {string}
		 */
		static decode(x) {
			return window.decodeURIComponent(x.replace(/\+/g, " "));
		}
	}

	/**
	 * Class Client
	 * @extends HB.EventTarget
	 * @memberOf HB
	 */
	class Client extends EventTarget {

		/**
		 * @public
		 * @type {boolean}
		 */
		get ready() {
			return this._ready;
		}

		/**
		 * @public
		 * @type {number}
		 */
		get timeout() {
			return this._xhr.timeout / 1000;
		}

		/**
		 * @public
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
			 * @member {Element[]} _targets
			 * @memberOf HB.Client#
			 */
			this.define("_targets", []);

			/**
			 * @private
			 * @readonly
			 * @member {string} _accept
			 * @memberOf HB.Client#
			 * @default "application/json"
			 */
			this.define("_accept", accept);

			/**
			 * @private
			 * @member {boolean} _ready
			 * @memberOf HB.Client#
			 * @default true
			 */
			this.define("_ready", true, true);

			/**
			 * @private
			 * @readonly
			 * @member {XMLHttpRequest} _xhr
			 * @memberOf HB.Client#
			 */
			this.define("_xhr", new XMLHttpRequest());

			this._xhr.responseType = type;

			this._xhr.addEventListener("timeout", () => {
				this._ready = true;
				this._targets.forEach(x => x.removeAttribute("loading"));
				this.dispatch("timeout", this._targets);
			}, false);

			this._xhr.addEventListener("load", () => this._load(), false);
			this._xhr.addEventListener("error", () => this._error(), false);

			this._xhr.addEventListener("progress", e => {
				this.dispatch("progress", e.loaded, e.total);
			}, false);
		}

		/**
		 * @private
		 * @fires HB.Client~loaded
		 * @fires HB.Client~error
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
		}

		/**
		 * @private
		 * @fires HB.Client~error
		 */
		_error() {
			this._ready = true;
			this._targets.forEach(x => x.removeAttribute("loading"));

			this.dispatch("error", {
				code: 523,
				message: "Disconnected"
			}, this._targets);
		}

		/**
		 * @public
		 * @param {string} method
		 * @param {string} url
		 * @param {?Object} [params = null]
		 * @param {?Element[]} [targets = null]
		 * @fires HB.Client~timeout
		 * @fires HB.Client~loaded
		 * @fires HB.Client~error
		 * @fires HB.Client~progress
		 */
		request(method, url, params, targets) {
			params  = params || null;
			targets = targets || null;

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

			if (targets !== null) {
				this._targets.push(...targets);
			}

			this._targets.forEach(x => x.addAttribute("loading"));

			this._xhr.send(method !== "GET" ? params : null);

			this._ready = false;
		}

		/**
		 * @public
		 * @param {string} x
		 * @returns {string}
		 */
		static encode(x) {
			return window.encodeURIComponent(x);
		}

		/**
		 * @public
		 * @param {string} x
		 * @returns {string}
		 */
		static decode(x) {
			return window.decodeURIComponent(x);
		}

		/**
		 * @public
		 * @param {Object} p
		 * @returns {string}
		 */
		static query(p) {
			return Object.keys(p).map(i => `${i}=${Client.encode(p[i])}`).join("&");
		}
	}

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @callback TimeoutHandler
	 * @param {?Element[]} targets
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @callback DataHandler
	 * @param {?Object} data
	 * @param {?Element[]} targets
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @callback ProgressHandler
	 * @param {number} loaded - Number of bytes transferred
	 * @param {number} total - Total number of bytes
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @event timeout
	 * @type {HB.Client~TimeoutHandler}
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @event loaded
	 * @type {HB.Client~DataHandler}
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @event error
	 * @type {HB.Client~DataHandler}
	 */

	/**
	 * @public
	 * @memberOf HB.Client~
	 * @event progress
	 * @type {HB.Client~ProgressHandler}
	 */

	/**
	 * Class Showable
	 * @extends HB.EventTarget
	 * @abstract
	 * @memberOf HB
	 */
	class Showable extends EventTarget {

		/**
		 * @public
		 * @type {boolean}
		 */
		get open() { return this.element.hasAttribute("open"); }

		/**
		 * @public
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
			 * @public
			 * @readonly
			 * @member {Element} element
			 * @memberOf HB.Showable#
			 */
			this.define("element", element);
		}

		/**
		 * @public
		 */
		show() {
			this.open = true;
		}

		/**
		 * @public
		 */
		close() {
			this.open = false;
		}
	}

	/** @namespace HB */
	window.define("HB", {});

	window.HB.define("uuid", () => {
		const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

		return uuid.replace(/[xy]/g, function (i) {
			let r = (Math.random() * 16) | 0;

			if (i === "y") {
				r = (r & 3) | 8;
			}

			return r.toString(16);
		});
	});

	window.HB.define("Event", Event);
	window.HB.define("EventTarget", EventTarget);
	window.HB.define("Timer", Timer);
	window.HB.define("Template", Template);
	window.HB.define("Router", Router);
	window.HB.define("Client", Client);
	window.HB.define("Showable", Showable);
})(this);