<?php

namespace Hashbang
{
	use ArrayAccess;
	use InvalidArgumentException;

	/**
	 * Class Route
	 */
	class Route implements ArrayAccess
	{
		private const PATTERN_OPTIONAL = '`\((\/:[a-z]+)\)\?`';
		private const REPLACE_OPTIONAL = '(?:$1)?';

		private const PATTERN_VALUE = '`:[a-z]+`';
		private const REPLACE_VALUE = '([a-zA-Z0-9\\-._]+)';

		/**
		 * @var string
		 */
		private $name;

		/**
		 * @var callable[]
		 */
		private $methods;

		/**
		 * @var string
		 */
		private $pattern;

		/**
		 * @return string
		 */
		public function getName() : string
		{
			return $this->name;
		}

		/**
		 * @return string
		 */
		public function getPattern() : string
		{
			return $this->pattern;
		}

		/**
		 * Route constructor.
		 * @param string     $route
		 * @param callable[] $methods = []
		 */
		public function __construct(string $route, array $methods = [])
		{
			$this->name    = $route;
			$this->methods = $methods;

			$route = preg_replace(Route::PATTERN_OPTIONAL, Route::REPLACE_OPTIONAL, $route);
			$route = preg_replace(Route::PATTERN_VALUE, Route::REPLACE_VALUE, $route);

			$this->pattern = "`^$route$`";
		}

		/**
		 * @param string   $route
		 * @param string[] &$params
		 * @return bool
		 */
		public function match(string $route, array &$params) : bool
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