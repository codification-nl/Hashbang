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
		 * @param string $name
		 * @param int    $lifetime
		 */
		public function __construct(string $name = 'session', int $lifetime = 604800)
		{
			if (session_status() === PHP_SESSION_ACTIVE)
			{
				return;
			}

			/** @noinspection SpellCheckingInspection */
			session_start([
				'name'                   => $name,
				'gc_maxlifetime'         => $lifetime,
				'cookie_lifetime'        => $lifetime,
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