# Hashbang

It's just really easy

## Installation

Use [Composer](https://getcomposer.org/)

```json
{
	"require": {
		"codification-nl/hashbang": "dev-master"
	},
	"repositories": [
		{
			"type": "vcs",
			"url": "https://github.com/codification-nl/Hashbang"
		}
	]
}
```

## Usage

### `api.php`

```php
<?php

require __DIR__ . '/vendor/autoload.php';

$app = new \Hashbang\App();

$app->get('hello(/:test)?', function ($data, $test = 'world')
	{
		return \Hashbang\Response::ok([
			'result' => $test,
		]);
	});

$app->run();
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