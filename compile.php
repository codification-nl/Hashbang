<?php

print "\033[H\033[J";

print "\033[1;33m";
print "       _                                            _ _           \n";
print "  ___ | | ___ ___ _ _ ___ ___    ___ ___ _____ ___ |_| | ___ ___  \n";
print " / __|| || _ |_ -| | |  _| -_|  / __| _ |     | _ || | || -_|  _| \n";
print " \___||_||___|___|___|_| |___|  \___|___|_|_|_|  _||_|_||___|_|   \n";
print "                                              |_|                 \n";
print "\033[0m";

$files = isset($argv[1]) ? array_slice($argv, 1) : glob("js/*.js");

foreach ($files as $file)
{
	if (strpos($file, '.min.') !== false)
	{
		continue;
	}

	if (!file_exists($file))
	{
		print "\033[0;31mFile {$file} not found!\033[0m\n";
		continue;
	}

	$info = (object)pathinfo($file);

	$old = $file;
	$new = join(DIRECTORY_SEPARATOR, [$info->dirname, "{$info->filename}.min.{$info->extension}"]);

	print "\033[1;30m\033[46m Compiling \033[0m ";
	print "\033[0;34m${old}\033[0m \033[0;33m=>\033[0m \033[1;34m${new}\033[0m \033[0;30m\033[42m  ...  \033[0m\033[7D";

	$curl = curl_init();

	$params = http_build_query([
		'js_code'           => file_get_contents($old),
		'compilation_level' => 'SIMPLE_OPTIMIZATIONS',
		'output_format'     => 'json',
		'output_info'       => 'compiled_code',
		'language'          => 'ECMASCRIPT6_STRICT',
		'language_out'      => 'ECMASCRIPT6_STRICT',
	]);

	curl_setopt_array($curl, [
		CURLOPT_URL            => 'https://closure-compiler.appspot.com/compile',
		CURLOPT_POST           => true,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_POSTFIELDS     => $params,
	]);

	$data = json_decode(curl_exec($curl));

	curl_close($curl);

	if (!isset($data->compiledCode) || empty($data->compiledCode))
	{
		print "\033[1;30m\033[41m Nope! \033[0m\n";
	}
	else
	{
		file_put_contents($new, $data->compiledCode);

		print "\033[1;30m\033[42m Done! \033[0m\n";
	}
}