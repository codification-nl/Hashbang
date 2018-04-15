# Hashbang

It's just really easy

## Installation

Use [Composer](https://getcomposer.org/)

```json
{
	"require": {
		"codification-nl/hashbang": "~3.0.0"
	}
}
```

## Usage

### `api.php`

```php
<?php

require_once 'vendor/autoload.php';

$router = new \Hashbang\Router();

$router->add('GET', 'hello(/:test)?', function ($data, $test = 'world')
	{
		return \Hashbang\Response::ok([
			'result' => $test,
		]);
	});

$response = $router->match();

$response->sendHeaders();

echo $response;
```

### `.htaccess`

```apache_conf
RewriteEngine On
RewriteBase /

RewriteRule ^api/(.*)$ api.php?route=$1 [QSA,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule ^(.+)$ #!/$1 [R=303,NE]
```