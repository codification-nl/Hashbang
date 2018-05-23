<?php

namespace Hashbang
{
	use JsonSerializable;
	use stdClass;
	use Throwable;

	/**
	 * Class Response
	 */
	class Response implements JsonSerializable
	{
		public const JSON = 'application/json';

		public const OK                  = 200;
		public const CREATED             = 201;
		public const ACCEPTED            = 202;
		public const NO_CONTENT          = 204;
		public const SEE_OTHER           = 303;
		public const NOT_MODIFIED        = 304;
		public const BAD_REQUEST         = 400;
		public const UNAUTHORIZED        = 401;
		public const FORBIDDEN           = 403;
		public const NOT_FOUND           = 404;
		public const METHOD_NOT_ALLOWED  = 405;
		public const TOO_MANY_REQUESTS   = 429;
		public const ERROR               = 500;
		public const BAD_GATEWAY         = 502;
		public const SERVICE_UNAVAILABLE = 503;

		/**
		 * @var int
		 */
		protected $code;

		/**
		 * @var string
		 */
		protected $message;

		/**
		 * @var array
		 */
		protected $data = null;

		/**
		 * @var array
		 */
		protected $headers = [];

		/**
		 * @return int
		 */
		public function getCode() : int
		{
			return $this->code;
		}

		/**
		 * @return string
		 */
		public function getMessage() : string
		{
			return $this->message;
		}

		/**
		 * @return array|null
		 */
		public function getData() : ?array
		{
			return $this->data;
		}

		/**
		 * Response constructor.
		 * @param int    $code
		 * @param string $message
		 * @param mixed  $data = null
		 */
		public function __construct(int $code, string $message, $data = null)
		{
			$this->code    = $code;
			$this->message = $message;

			if ($data instanceof Throwable)
			{
				$this->data = [
					'error' => Response::formatError($data),
				];
			}
			else
			{
				$this->data = $data;
			}

			$this->headers['Cache-Control'] = 'no-store';
			$this->headers['Content-Type']  = Response::JSON;
		}

		/**
		 * @param Throwable $e
		 * @return stdClass
		 */
		public static function formatError(Throwable $e) : stdClass
		{
			return (object)[
				'code'    => $e->getCode(),
				'message' => $e->getMessage(),
				'file'    => $e->getFile(),
				'line'    => $e->getLine(),
			];
		}

		/**
		 * @return void
		 */
		public function sendHeaders() : void
		{
			http_response_code($this->code);

			array_walk($this->headers, function ($value, $key)
				{
					header("$key: $value");
				});
		}

		/**
		 * @return string
		 */
		public function __toString() : string
		{
			return json_encode($this) . PHP_EOL;
		}

		/**
		 * @link https://php.net/manual/jsonserializable.jsonserialize.php
		 * @return array
		 */
		public function jsonSerialize() : array
		{
			$result = [
				'code'    => $this->code,
				'message' => $this->message,
			];

			if ($this->data !== null)
			{
				$result += $this->data;
			}

			return $result;
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function ok($data = null) : Response
		{
			return new Response(Response::OK, 'ok', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function created($data = null) : Response
		{
			return new Response(Response::CREATED, 'created', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function accepted($data = null) : Response
		{
			return new Response(Response::ACCEPTED, 'accepted', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function noContent($data = null) : Response
		{
			return new Response(Response::NO_CONTENT, 'no content', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function seeOther($data = null) : Response
		{
			return new Response(Response::SEE_OTHER, 'see other', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function notModified($data = null) : Response
		{
			return new Response(Response::NOT_MODIFIED, 'not modified', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function badRequest($data = null) : Response
		{
			return new Response(Response::BAD_REQUEST, 'bad request', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function unauthorized($data = null) : Response
		{
			return new Response(Response::UNAUTHORIZED, 'unauthorized', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function forbidden($data = null) : Response
		{
			return new Response(Response::FORBIDDEN, 'forbidden', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function notFound($data = null) : Response
		{
			return new Response(Response::NOT_FOUND, 'not found', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function methodNotAllowed($data = null) : Response
		{
			return new Response(Response::METHOD_NOT_ALLOWED, 'method not allowed', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function tooManyRequests($data = null) : Response
		{
			return new Response(Response::TOO_MANY_REQUESTS, 'too many requests', $data);
		}

		/**
		 * @param mixed $data = null
		 * @return Response
		 */
		public static function error($data = null) : Response
		{
			return new Response(Response::ERROR, 'internal server error', $data);
		}
	}
}