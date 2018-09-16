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
		 * @var string
		 */
		private $name;

		/**
		 * @var int
		 */
		private $lifetime;

		/**
		 * @var bool
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

			$this->name     = $name;
			$this->lifetime = $lifetime;
			$this->secure   = $secure;
			$this->path     = $path;
			$this->domain   = $domain;
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
		 * @param string $name = 'token'
		 * @param int    $lifetime = 0
		 * @return bool
		 */
		public function sendToken(string $name = 'token', int $lifetime = 0) : bool
		{
			return $this->sendCookie($name, $this->getToken(), $lifetime);
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
		 * @return bool
		 */
		public function destroy() : bool
		{
			if (!$this->sendCookie($this->name, null, -$this->lifetime, true))
			{
				return false;
			}

			session_unset();

			return session_destroy();
		}

		/**
		 * @param string      $name
		 * @param string|null $value = null
		 * @param int         $lifetime = 0
		 * @param bool        $httpOnly = false
		 * @return bool
		 */
		private function sendCookie(string $name, string $value = null, int $lifetime = 0, bool $httpOnly = false) : bool
		{
			if ($lifetime !== 0)
			{
				$lifetime += time();
			}

			return setcookie(
				$name,
				$value ?? '',
				$lifetime,
				$this->path,
				$this->domain,
				$this->secure,
				$httpOnly
			);
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