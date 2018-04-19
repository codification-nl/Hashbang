<?php

namespace Hashbang
{
	/**
	 * Interface Logger
	 */
	interface Logger
	{
		/**
		 * @return int
		 */
		public function level() : int;

		/**
		 * @param Response $response
		 * @return void
		 */
		public function log(Response $response) : void;
	}
}