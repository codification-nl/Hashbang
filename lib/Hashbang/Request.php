<?php

namespace Hashbang
{
	use stdClass;

	/**
	 * Class Request
	 */
	class Request
	{
		public const GET     = 'GET';
		public const POST    = 'POST';
		public const PUT     = 'PUT';
		public const PATCH   = 'PATCH';
		public const DELETE  = 'DELETE';
		public const OPTIONS = 'OPTIONS';

		/**
		 * @return string
		 */
		public static function getUri() : string
		{
			return $_SERVER['REQUEST_URI'];
		}

		/**
		 * @return string
		 */
		public static function getMethod() : string
		{
			return $_SERVER['REQUEST_METHOD'];
		}

		/**
		 * @return string|null
		 */
		public static function getRoute() : ?string
		{
			return $_GET['route'] ?? null;
		}

		public static function getToken() : ?string
		{
			return $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
		}

		/**
		 * @return stdClass|null
		 * @throws ResponseException
		 */
		public static function getBody() : ?stdClass
		{
			if (Request::getMethod() === Request::GET)
			{
				return (object)$_GET;
			}

			$input = file_get_contents('php://input');

			if ($input === false)
			{
				return null;
			}

			if (empty($input))
			{
				return new stdClass();
			}

			$data = json_decode($input);

			if ($data === null)
			{
				throw new ResponseException(Response::ERROR, 'malformed request body');
			}

			return $data;
		}
	}
}