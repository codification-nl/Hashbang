<?php

namespace Hashbang
{
	use PDO;
	use PDOException;
	use PDOStatement;

	/**
	 * Class PDOAdapter
	 */
	class PDOAdapter
	{
		public const ERROR_MESSAGE = 'database error';

		/**
		 * @var PDO|null
		 */
		private $connection = null;

		/**
		 * @var string
		 */
		private $dsn;

		/**
		 * @var string
		 */
		private $user;

		/**
		 * @var string
		 */
		private $password;

		/**
		 * PDOAdapter constructor.
		 * @param string $dsn
		 * @param string $user
		 * @param string $password
		 */
		public function __construct(string $dsn, string $user, string $password)
		{
			$this->dsn      = $dsn;
			$this->user     = $user;
			$this->password = $password;
		}

		/**
		 * @return void
		 * @throws ResponseException
		 */
		public function connect() : void
		{
			if ($this->connection !== null)
			{
				return;
			}

			try
			{
				$this->connection = new PDO($this->dsn, $this->user, $this->password, [
					PDO::ATTR_EMULATE_PREPARES => false,
					PDO::ATTR_ERRMODE          => PDO::ERRMODE_EXCEPTION,
				]);
			}
			catch (PDOException $e)
			{
				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}

		/**
		 * @param string $sql
		 * @return int|null
		 * @throws ResponseException
		 */
		public function exec(string $sql) : ?int
		{
			$this->connect();

			try
			{
				$result = $this->connection->exec($sql);

				if ($result === false)
				{
					return null;
				}

				return $result;
			}
			catch (PDOException $e)
			{
				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}

		/**
		 * @param string $sql
		 * @return PDOStatement|null
		 * @throws ResponseException
		 */
		public function query(string $sql) : ?PDOStatement
		{
			$this->connect();

			try
			{
				return $this->connection->query($sql) ?: null;
			}
			catch (PDOException $e)
			{
				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}

		/**
		 * @param string $sql
		 * @return PDOStatement
		 * @throws ResponseException
		 */
		public function prepare(string $sql) : PDOStatement
		{
			$this->connect();

			try
			{
				return $this->connection->prepare($sql);
			}
			catch (PDOException $e)
			{
				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}

		/**
		 * @param string $name
		 * @return int
		 * @throws ResponseException
		 */
		public function lastInsertId(string $name = 'id') : int
		{
			$this->connect();

			try
			{
				return $this->connection->lastInsertId($name);
			}
			catch (PDOException $e)
			{
				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}

		/**
		 * @param string     $sql
		 * @param array|null $params
		 * @return null|PDOStatement
		 * @throws ResponseException
		 */
		public function run(string $sql, array $params = null) : ?PDOStatement
		{
			$st = $this->prepare($sql);

			if (!$st->execute($params))
			{
				return null;
			}

			return $st;
		}
	}
}