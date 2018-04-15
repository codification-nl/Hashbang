<?php

namespace Hashbang
{
	use ArrayAccess;
	use InvalidArgumentException;

	/**
	 * Class Route
	 * @implements ArrayAccess
	 * @ac
	 */
	class Route implements ArrayAccess
	{
		private const OPTIONAL = '`\((\/:[a-z]+)\)\?`';
		private const PATTERN  = '`:[a-z]+`';

		/**
		 * @var callable[]
		 */
		private $methods = [];

		/**
		 * @var string
		 */
		private $pattern;

		/**
		 * Route constructor.
		 * @param string $route
		 */
		public function __construct(string $route)
		{
			$route = preg_replace(Route::OPTIONAL, '(?:$1)?', $route);
			$route = preg_replace(Route::PATTERN, '([a-zA-Z0-9\\-._]+)', $route);

			$this->pattern = "`$route`";
		}

		/**
		 * @param string   $route
		 * @param string[] &$params
		 * @return bool
		 */
		public function preg_match(string $route, array &$params) : bool
		{
			if (preg_match($this->pattern, $route, $params) !== 1)
			{
				return false;
			}

			array_shift($params);

			return true;
		}

		/**
		 * @param string $method
		 * @param array  $params
		 * @return Response
		 * @throws ResponseException
		 */
		public function invoke(string $method, array $params) : Response
		{
			if (!isset($this[$method]))
			{
				throw new ResponseException(Response::METHOD_NOT_ALLOWED, 'invalid method');
			}

			return call_user_func_array($this[$method], $params);
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetexists.php
		 * @param string $method
		 * @return bool
		 */
		public function offsetExists($method) : bool
		{
			return isset($this->methods[$method]);
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetget.php
		 * @param string $method
		 * @return callable|null
		 */
		public function offsetGet($method) : ?callable
		{
			return $this->methods[$method] ?? null;
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetset.php
		 * @param string   $method
		 * @param callable $callback
		 * @return void
		 */
		public function offsetSet($method, $callback) : void
		{
			if (!is_callable($callback))
			{
				throw new InvalidArgumentException();
			}

			$this->methods[$method] = $callback;
		}

		/**
		 * @link https://php.net/manual/arrayaccess.offsetunset.php
		 * @param string $method
		 * @return void
		 */
		public function offsetUnset($method) : void
		{
			unset($this->methods[$method]);
		}
	}
}