<?php

namespace Hashbang
{
	/**
	 * Class Session
	 * @property int user
	 */
	class Session
	{
		/**
		 * Session constructor.
		 * @param bool   $secure = true
		 * @param string $name = 'session'
		 * @param int    $lifetime = 604800
		 */
		public function __construct(bool $secure = true, string $name = 'session', int $lifetime = 604800)
		{
			if (session_status() === PHP_SESSION_ACTIVE)
			{
				return;
			}

			session_start([
				'name'                   => $name,
				'gc_maxlifetime'         => $lifetime,
				'cookie_lifetime'        => $lifetime,
				'cookie_secure'          => $secure,
				'cookie_httponly'        => true,
				'use_strict_mode'        => true,
				'sid_length'             => 32,
				'sid_bits_per_character' => 6,
			]);
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