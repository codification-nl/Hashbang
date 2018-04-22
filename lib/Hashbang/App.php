<?php

namespace Hashbang
{
	/**
	 * Class App
	 */
	class App
	{
		/**
		 * @var Router
		 */
		private $router;

		/**
		 * @var Logger
		 */
		private $logger = null;

		/**
		 * @return Router
		 */
		public function getRouter() : Router
		{
			return $this->router;
		}

		/**
		 * App constructor.
		 */
		public function __construct()
		{
			$this->router = new Router();
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function get(string $route, callable $action) : Route
		{
			return $this->map([Request::GET], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function post(string $route, callable $action) : Route
		{
			return $this->map([Request::POST], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function put(string $route, callable $action) : Route
		{
			return $this->map([Request::PUT], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function patch(string $route, callable $action) : Route
		{
			return $this->map([Request::PATCH], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function delete(string $route, callable $action) : Route
		{
			return $this->map([Request::DELETE], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function options(string $route, callable $action) : Route
		{
			return $this->map([Request::OPTIONS], $route, $action);
		}

		/**
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function any(string $route, callable $action) : Route
		{
			return $this->map([
				Request::GET,
				Request::POST,
				Request::PUT,
				Request::PATCH,
				Request::DELETE,
				Request::OPTIONS,
			], $route, $action);
		}

		/**
		 * @param string[] $methods
		 * @param string   $route
		 * @param callable $action
		 * @return Route
		 */
		public function map(array $methods, string $route, callable $action) : Route
		{
			return $this->router->map($methods, $route, $action);
		}

		/**
		 * @return void
		 */
		public function run() : void
		{
			$response = $this->router->match();

			if ($this->logger !== null &&
			    $this->logger->level() <= $response->getCode())
			{
				$this->logger->log($response);
			}

			$response->sendHeaders();

			echo $response;
		}

		public static function isLocalhost()
		{
			$whitelist = [
				'127.0.0.1',
				'::1',
			];

			return in_array($_SERVER['REMOTE_ADDR'], $whitelist);
		}

		/**
		 * @param Logger $logger
		 */
		public function setLogger(Logger $logger) : void
		{
			$this->logger = $logger;
		}
	}
}