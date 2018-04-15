<?php

namespace Hashbang
{
	use ArrayAccess;
	use InvalidArgumentException;
	use Throwable;

	/**
	 * Class Router
	 * @implements ArrayAccess
	 */
	class Router implements ArrayAccess
	{
		/**
		 * @var Route[]
		 */
		private $routes = [];

		/**
		 * @var Logger
		 */
		private $logger = null;

		/**
		 * @param string   $method
		 * @param string   $route
		 * @param callable $callback
		 * @return void
		 */
		public function add(string $method, string $route, callable $callback) : void
		{
			if (!isset($this[$route]))
			{
				$this[$route] = new Route($route);
			}

			$this[$route][$method] = $callback;
		}

		/**
		 * @param string   $route
		 * @param string[] &$params
		 * @return Route|null
		 */
		private function preg_match(string $route, array &$params) : ?Route
		{
			foreach ($this->routes as $result)
			{
				if ($result->preg_match($route, $params))
				{
					return $result;
				}
			}

			return null;
		}

		/**
		 * @return Response
		 */
		public function match() : Response
		{
			$route = Request::getRoute();

			if ($route === null)
			{
				return Response::badRequest();
			}

			$params = [];
			$result = $this->preg_match($route, $params);

			if ($result === null)
			{
				return Response::notFound();
			}

			/** @var Response|null $response */
			$response = null;

			try
			{
				array_unshift($params, Request::getBody());

				$response = $result->invoke(Request::getMethod(), $params);
			}
			catch (ResponseException $e)
			{
				$response = new Response($e->getCode(), $e->getMessage(), $e->getPrevious());
			}
			catch (Throwable $e)
			{
				$response = Response::error($e);
			}
			finally
			{
				if ($this->logger !== null &&
				    $this->logger->level() <= $response->getCode())
				{
					$this->logger->log($response);
				}
			}

			return $response;
		}

		/**
		 * @param Logger|null $logger
		 * @return void
		 */
		public function setLogger(Logger $logger = null) : void
		{
			$this->logger = $logger;
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetexists.php
		 * @param string $route
		 * @return bool
		 */
		public function offsetExists($route) : bool
		{
			return isset($this->routes[$route]);
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetget.php
		 * @param string $route
		 * @return Route|null
		 */
		public function offsetGet($route) : ?Route
		{
			return $this->routes[$route] ?? null;
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetset.php
		 * @param string $route
		 * @param Route  $result
		 * @return void
		 */
		public function offsetSet($route, $result) : void
		{
			if (!($result instanceof Route))
			{
				throw new InvalidArgumentException();
			}

			$this->routes[$route] = $result;
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetunset.php
		 * @param string $route
		 * @return void
		 */
		public function offsetUnset($route) : void
		{
			unset($this->routes[$route]);
		}
	}
}