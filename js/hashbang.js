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
	 * Event
	 */
	class Event {

		constructor(type, callback) {
			this.define("type", type);
			this.define("callback", callback);
		}
	}

	/**
	 * EventTarget
	 */
	class EventTarget {

		constructor() {
			this.define("_events", []);
		}

		dispatch(type, ...params) {
			this._events.forEach(event => {
				if (event.type === type) {
					event.callback(...params);
				}
			});
		}

		on(type, callback) {
			this._events.push(new Event(type, callback));
		}
	}

	/**
	 * Timer
	 */
	class Timer extends EventTarget {

		constructor() {
			super();
			this.define("_id", null, true);
		}

		start(seconds) {
			this.stop();

			this.dispatch("started");

			this._id = window.setTimeout(() => {
				this.dispatch("ended");
				this._id = null;
			}, seconds * 1000);
		}

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
	 * Template
	 */
	class Template {

		constructor(element) {
			let source = element.innerHTML;

			source = source.replace(/\s{2,}/g, "");
			source = source.replace(/{{(.*?)}}/g, "',$1,'");
			source = source.split("{%").join("');");
			source = source.split("%}").join("a.push('");
			source = `const a=[];a.push('${source}');return a.join('');`;

			this.define("_source", new Function(source));
			this.define("_range", document.createRange());
		}

		render(data) {
			return this._range.createContextualFragment(this._source.call(data));
		}
	}

	/**
	 * Route
	 */
	class Route {

		constructor(handle, callback, last) {
			const regExp = /\((\/:[a-z]+)\)\?/g;

			if (regExp.test(handle)) {
				handle = handle.replace(regExp, "(?:$1)?");
			}

			this.define("handle", handle);
			this.define("regExp", new RegExp(this.handle.replace(/:[a-z]+/g, "([a-zA-Z0-9\\-._~!$$&'()*,;=:@+%]+)")));
			this.define("callback", callback);
			this.define("last", last || false);
		}
	}

	/**
	 * Router
	 */
	class Router extends Array {

		constructor() {
			super();

			window.addEventListener("hashchange", () => this.match(), false);
		}

		map(handle, callback, last) {
			super.push(new Route(handle, callback, last));
		}

		match() {
			const hash = `/${location.hash.substr(3)}`;

			for (let i = 0; i < this.length; i++) {
				const route = this[i];
				let matches = hash.match(route.regExp);

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

		static encode(x) {
			return x.replace(/ /g, "+");
		}

		static decode(x) {
			return window.decodeURIComponent(x.replace(/\+/g, " "));
		}
	}

	/**
	 * Client
	 */
	class Client extends EventTarget {

		get ready() { return this._ready; }

		get timeout() { return this._xhr.timeout / 1000; }
		set timeout(value) { this._xhr.timeout = value * 1000; }

		constructor(type, accept) {
			super();

			type   = type || "json";
			accept = accept || "application/json";

			this.define("_targets", []);
			this.define("_accept", accept);
			this.define("_ready", true, true);
			this.define("_xhr", new XMLHttpRequest());

			this._xhr.responseType = type;

			this._xhr.addEventListener("timeout", () => {
				this._ready = true;
				this._targets.forEach(x => x.removeAttribute("loading"));

				this.dispatch("timeout", this._targets);
			}, false);

			this._xhr.addEventListener("load", () => {
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
			}, false);

			this._xhr.addEventListener("error", () => {
				this._ready = true;
				this._targets.forEach(x => x.removeAttribute("loading"));

				this.dispatch("error", {
					code: 523,
					message: "Disconnected"
				}, this._targets);
			}, false);

			this._xhr.addEventListener("progress", e => {
				this.dispatch("progress", e.loaded, e.total);
			}, false);
		}

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

		static encode(x) {
			return window.encodeURIComponent(x);
		}

		static decode(x) {
			return window.decodeURIComponent(x);
		}

		static query(p) {
			return Object.keys(p).map(i => `${i}=${Client.encode(p[i])}`).join("&");
		}
	}

	/**
	 * Showable
	 */
	class Showable extends EventTarget {

		get open() { return this.element.hasAttribute("open"); }
		set open(value) {
			if (value) {
				this.element.addAttribute("open");
			} else {
				this.element.removeAttribute("open");
			}
		}

		constructor(element) {
			super();

			this.define("element", element);
		}

		show() {
			this.open = true;
		}

		close() {
			this.open = false;
		}
	}

	window.define("HB", {});

	window.HB.define("uuid", function () {
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