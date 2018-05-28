<?php

namespace Hashbang
{
	use Exception;
	use UnexpectedValueException;

	/**
	 * Class Session
	 * @property int    user
	 * @property string token
	 */
	class Session
	{
		/**
		 * @var int
		 */
		private $secure;

		/**
		 * @var string
		 */
		private $path;

		/**
		 * @var string
		 */
		private $domain;

		/**
		 * Session constructor.
		 * @param bool   $secure = true
		 * @param string $name = 'session'
		 * @param int    $lifetime = 604800
		 * @param string $path = '/'
		 * @param string $domain = ''
		 */
		public function __construct(bool $secure = true, string $name = 'session', int $lifetime = 604800, string $path = '/', string $domain = '')
		{
			if (session_status() === PHP_SESSION_ACTIVE)
			{
				return;
			}

			$options = [
				'name'                   => $name,
				'gc_maxlifetime'         => $lifetime,
				'cookie_lifetime'        => $lifetime,
				'cookie_path'            => $path,
				'cookie_domain'          => $domain,
				'cookie_secure'          => $secure,
				'cookie_httponly'        => true,
				'use_strict_mode'        => true,
				'sid_length'             => 32,
				'sid_bits_per_character' => 6,
			];

			if (!session_start($options))
			{
				throw new UnexpectedValueException();
			}

			$this->secure = $secure;
			$this->path   = $path;
			$this->domain = $domain;
		}

		/**
		 * @return string|null
		 */
		public function getToken() : ?string
		{
			if (!isset($this->token))
			{
				try
				{
					$this->token = hash_hmac('sha256', session_id(), random_bytes(32));
				}
				catch (Exception $e)
				{
					return null;
				}
			}

			return $this->token;
		}

		/**
		 * @param string $name = 'name'
		 * @return bool
		 */
		public function sendToken(string $name = 'token') : bool
		{
			return setcookie($name, $this->getToken(), 0, $this->path, $this->domain, $this->secure);
		}

		/**
		 * @param string $token
		 * @return bool
		 */
		public function verifyToken(string $token) : bool
		{
			if (!isset($this->token))
			{
				return false;
			}

			return hash_equals($this->token, $token);
		}

		/**
		 * @param string $key
		 * @param mixed  $value
		 * @return void
		 */
		public function __set(string $key, $value) : void
		{
			$_SESSION[$key] = $value;
		}

		/**
		 * @param string $key
		 * @return mixed
		 */
		public function __get(string $key)
		{
			return $_SESSION[$key] ?? null;
		}

		/**
		 * @param string $key
		 * @return bool
		 */
		public function __isset(string $key) : bool
		{
			return isset($_SESSION[$key]);
		}

		/**
		 * @param string $key
		 * @return void
		 */
		public function __unset(string $key) : void
		{
			unset($_SESSION[$key]);
		}
	}
}