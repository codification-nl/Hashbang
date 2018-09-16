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
		 * @return PDO|null
		 */
		public function getConnection() : ?PDO
		{
			return $this->connection;
		}

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
		 * @param string $name = 'id'
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
		 * @param string $sql
		 * @param array  $params = null
		 * @return PDOStatement|null
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

		/**
		 * @param callable $transaction
		 * @throws ResponseException
		 */
		public function transaction(callable $transaction) : void
		{
			$this->connect();

			if (!$this->connection->beginTransaction())
			{
				throw new ResponseException(Response::ERROR, 'failed to begin transaction');
			}

			try
			{
				call_user_func($transaction);

				if (!$this->connection->commit())
				{
					throw new ResponseException(Response::ERROR, 'failed to commit transaction');
				}
			}
			catch (PDOException $e)
			{
				if (!$this->connection->rollBack())
				{
					throw new ResponseException(Response::ERROR, 'failed to roll back transaction');
				}

				throw new ResponseException(Response::ERROR, PDOAdapter::ERROR_MESSAGE, $e);
			}
		}
	}
}