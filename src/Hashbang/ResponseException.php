<?php

namespace Hashbang
{
	use Exception;
	use Throwable;

	/**
	 * Class ResponseException
	 */
	class ResponseException extends Exception
	{
		/**
		 * ResponseException constructor.
		 * @param int            $code
		 * @param string         $message
		 * @param Throwable|null $previous
		 */
		public function __construct(int $code, string $message, Throwable $previous = null)
		{
			parent::__construct($message, $code, $previous);
		}
	}
}