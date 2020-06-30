<?php
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Pragma: no-cache");

	$shell_file = dirname(__FILE__) . '/linux_json_api.sh';
	$module = escapeshellcmd($_GET['module']);

	echo stripcslashes(shell_exec( $shell_file . " " . $module ));
