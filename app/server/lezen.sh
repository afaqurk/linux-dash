#!/bin/bash

ECHO=$(type -P echo)
SED=$(type -P sed)
GREP=$(type -P grep)
TR=$(type -P tr)
AWK=$(type -P awk)
CAT=$(type -P cat)
HEAD=$(type -P head)
CUT=$(type -P cut)
PS=$(type -P ps)

_parseAndPrint() {
  while read data; do
#  $ECHO -n "$data" | $SED -r "s/\"/\\\\\"/g" | $TR -d "\n"; 
$ECHO -n "$data" | $SED -r 's/\\//g' | $TR -d "\n";
  done;
}

arp_cache() {
  local arpCommand=$(type -P arp)

  result=$($arpCommand | $AWK 'BEGIN {print "["} NR>1 \
              {print "{ \"addr\": \"" $1 "\", " \
                    "\"hw_type\": \"" $2 "\", " \
                    "\"hw_addr.\": \"" $3 "\", " \
                    "\"mask\": \"" $5 "\" }, " \
                    } \
            END {print "]"}' \
        | $SED 'N;$s/},/}/;P;D')

  if [ -z "$result" ]; then
    $ECHO {}
  else
    $ECHO $result | _parseAndPrint
  fi
}

bandwidth() {

  $CAT /proc/net/dev \
  | $AWK 'BEGIN {print "["} NR>2 {print "{ \"interface\": \"" $1 "\"," \
            " \"tx\": " $2 "," \
            " \"rx\": " $10 " }," } END {print "]"}' \
  | $SED 'N;$s/,\n/\n/;P;D' \
  | _parseAndPrint
}

common_applications() {
  result=$(whereis php node mysql mongo vim python ruby java apache2 nginx openssl vsftpd make \
  | $AWK -F: '{if(length($2)==0) { installed="false"; } else { installed="true"; } \
        print \
        "{ \
          \"binary\": \""$1"\", \
          \"location\": \""$2"\", \
          \"installed\": "installed" \
        },"}')

  $ECHO "[" ${result%?} "]" | _parseAndPrint
}

cpu_info() {
  local lscpuCommand=$(type -P lscpu)

  result=$($lscpuCommand \
      | $AWK -F: '{print "\""$1"\": \""$2"\"," }  '\
      )

  $ECHO "{" ${result%?} "}" | _parseAndPrint
}

cpu_intensive_processes() {

  result=$($PS axo pid,user,pcpu,rss,vsz,comm --sort -pcpu,-rss,-vsz \
        | $HEAD -n 15 \
        | $AWK 'BEGIN{OFS=":"} NR>1 {print "{ \"pid\": " $1 \
                ", \"user\": \"" $2 "\"" \
                ", \"cpu%\": " $3 \
                ", \"rss\": " $4 \
                ", \"vsz\": " $5 \
                ", \"cmd\": \"" $6 "\"" "},"\
              }')

  $ECHO "[" ${result%?} "]" | _parseAndPrint
}

cpu_temp() {
  local ID=*
  [ -f /etc/os-release  ] && source /etc/os-release
  case "$ID" in
    "raspbian")
      cpu=$(</sys/class/thermal/thermal_zone0/temp)
      echo "$((cpu/1000))" | _parseAndPrint
    ;;
    *)
      if type -P sensors 2>/dev/null; then
        returnString=`sensors`
        #amd
        if [[ "${returnString/"k10"}" != "${returnString}" ]] ; then
          $ECHO ${returnString##*k10} | $CUT -d ' ' -f 6 | $CUT -c 2- | $CUT -c 1-4
        #intel
        elif [[ "${returnString/"core"}" != "${returnString}" ]] ; then
          fromcore=${returnString##*"coretemp"}
          $ECHO ${fromcore##*Physical}  | $CUT -d ' ' -f 3 | $CUT -c 2-5 | _parseAndPrint
        fi
      else
        $ECHO "[]" | _parseAndPrint
      fi
    ;;
  esac
}

# by Paul Colby (http://colby.id.au), no rights reserved ;)
cpu_utilization() {

  PREV_TOTAL=0
  PREV_IDLE=0
  iteration=0

  while [[ iteration -lt 2 ]]; do
    # Get the total CPU statistics, discarding the 'cpu ' prefix.
    CPU=(`$SED -n 's/^cpu\s//p' /proc/stat`)
    IDLE=${CPU[3]} # Just the idle CPU time.

    # Calculate the total CPU time.
    TOTAL=0
    for VALUE in "${CPU[@]}"; do
      let "TOTAL=$TOTAL+$VALUE"
    done

    # Calculate the CPU usage since we last checked.
    let "DIFF_IDLE=$IDLE-$PREV_IDLE"
    let "DIFF_TOTAL=$TOTAL-$PREV_TOTAL"
    let "DIFF_USAGE=(1000*($DIFF_TOTAL-$DIFF_IDLE)/$DIFF_TOTAL+5)/10"
    #echo -en "\rCPU: $DIFF_USAGE%  \b\b"

    # Remember the total and idle CPU times for the next check.
    PREV_TOTAL="$TOTAL"
    PREV_IDLE="$IDLE"

    # Wait before checking again.
    sleep 1
    iteration="$iteration+1"
  done
  $ECHO -en "$DIFF_USAGE"
}

cron_history() {

  local cronLog='/var/log/syslog'
  local numberOfLines='50'

  # Month, Day, Time, Hostname, tag, user,

  result=$($GREP -m $numberOfLines CRON $cronLog \
    | $AWK '{ s = ""; for (i = 6; i <= NF; i++) s = s $i " "; \
        print "{\"time\" : \"" $1" "$2" "$3 "\"," \
            "\"user\" : \"" $6 "\"," \
            "\"message\" : \"" $5" "gensub("\"", "\\\\\"", "g", s) "\"" \
          "},"
        }'
    )

  $ECHO [${result%?}] | _parseAndPrint
}

current_ram() {

  local memInfoFile="/proc/meminfo"

  # References:
  #   Calculations: http://zcentric.com/2012/05/29/mapping-procmeminfo-to-output-of-free-command/
  #   Fields: https://www.kernel.org/doc/Documentation/filesystems/proc.txt

  memInfo=$($CAT $memInfoFile | $GREP 'MemTotal\|MemFree\|Buffers\|Cached')

  $ECHO $memInfo | $AWK '{print "{ \"total\": " ($2/1024) ", \"used\": " ( ($2-($5+$8+$11))/1024 ) ", \"available\": " (($5+$8+$11)/1024) " }"  }' | _parseAndPrint
}

disk_partitions() {
  local dfCommand=$(type -P df)

  result=$($dfCommand -Ph | $AWK 'NR>1 {print "{\"file_system\": \"" $1 "\", \"size\": \"" $2 "\", \"used\": \"" $3 "\", \"avail\": \"" $4 "\", \"used%\": \"" $5 "\", \"mounted\": \"" $6 "\"},"}')

  $ECHO [ ${result%?} ] | _parseAndPrint
}

docker_processes() {

  local result=""
  local dockerCommand=$(type -P docker)
  local containers="$($dockerCommand ps | $AWK '{if(NR>1) print $NF}')"

  for i in $containers; do
  result="$result $($dockerCommand top $i axo pid,user,pcpu,pmem,comm --sort -pcpu,-pmem \
        | $HEAD -n 15 \
        | $AWK -v cnt="$i" 'BEGIN{OFS=":"} NR>1 {print "{ \"cname\": \"" cnt \
                "\", \"pid\": " $1 \
                ", \"user\": \"" $2 "\"" \
                ", \"cpu%\": " $3 \
                ", \"mem%\": " $4 \
                ", \"cmd\": \"" $5 "\"" "},"\
              }')"
  done

  $ECHO "[" ${result%?} "]" | _parseAndPrint
}

download_transfer_rate() {

	local files=(/sys/class/net/*)
	local pos=$(( ${#files[*]} - 1 ))
	local last=${files[$pos]}

	local json_output="{"

	for interface in "${files[@]}"
	do
		basename=$(basename "$interface")

		# find the number of bytes transfered for this interface
		in1=$($CAT /sys/class/net/"$basename"/statistics/rx_bytes)

		# wait a second
		sleep 1

		# check same interface again
		in2=$($CAT /sys/class/net/"$basename"/statistics/rx_bytes)

		# get the difference (transfer rate)
		in_bytes=$((in2 - in1))

		# convert transfer rate to KB
		in_kbytes=$((in_bytes / 1024))

		# convert transfer rate to KB
		json_output="$json_output \"$basename\": $in_kbytes"

		# if it is not the last line
		if [[ ! $interface == $last ]]
		then
			# add a comma to the line (JSON formatting)
			json_output="$json_output,"
		fi
	done

	# close the JSON object & print to screen
	$ECHO "$json_output}" | _parseAndPrint
}

general_info() {
  local lsbRelease=$(type -P lsb_release)
  local uName=$(type -P uname)
  local hostName=$(type -P hostname)

  function displaytime {
    local T=$1
    local D=$((T/60/60/24))
    local H=$((T/60/60%24))
    local M=$((T/60%60))
    local S=$((T%60))
    [[ $D > 0 ]] && printf '%d days ' $D
    [[ $H > 0 ]] && printf '%d hours ' $H
    [[ $M > 0 ]] && printf '%d minutes ' $M
    [[ $D > 0 || $H > 0 || $M > 0 ]] && printf 'and '
    printf '%d seconds\n' $S
  }

  local lsbRelease=$($lsbRelease -ds | $SED -e 's/^"//'  -e 's/"$//')
  local uname=$($uName -r | $SED -e 's/^"//'  -e 's/"$//')
  local os=$($ECHO $lsbRelease $uname)
  local hostname=$($hostName)
  local uptime_seconds=$($CAT /proc/uptime | awk '{print $1}')
  local server_time=$(date)

  $ECHO "{ \"OS\": \"$os\", \"Hostname\": \"$hostname\", \"Uptime\": \" $(displaytime ${uptime_seconds%.*}) \", \"Server Time\": \"$server_time\" }" | _parseAndPrint
}

io_stats() {

  result=$($CAT /proc/diskstats | $AWK \
          '{ if($4==0 && $8==0 && $12==0 && $13==0) next } \
          {print "{ \"device\": \"" $3 "\", \"reads\": \""$4"\", \"writes\": \"" $8 "\", \"in_prog.\": \"" $12 "\", \"time\": \"" $13 "\"},"}'
      )

  $ECHO [ ${result%?} ] | _parseAndPrint
}

ip_addresses() {

  local ifconfigCmd=$(type -P ifconfig)
  local digCmd=$(type -P dig)

  externalIp=$($digCmd +short myip.opendns.com @resolver1.opendns.com)

  $ECHO -n "["

  for item in $($ifconfigCmd | $GREP -oP "^[a-zA-Z0-9:]*(?=:)")
  do
      $ECHO -n "{\"interface\" : \""$item"\", \"ip\" : \"$( $ifconfigCmd $item | $GREP "inet" | $AWK '{match($0,"inet (addr:)?([0-9.]*)",a)}END{ if (NR != 0){print a[2]; exit}{print "none"}}')\"}, "
  done

  $ECHO "{ \"interface\": \"external\", \"ip\": \"$externalIp\" } ]" | _parseAndPrint
}

load_avg() {

  local numberOfCores=$($GREP -c 'processor' /proc/cpuinfo)

  if [ $numberOfCores -eq 0 ]; then
    numberOfCores=1
  fi

  result=$($CAT /proc/loadavg | $AWK '{print "{ \"1_min_avg\": " ($1*100)/'$numberOfCores' ", \"5_min_avg\": " ($2*100)/'$numberOfCores' ", \"15_min_avg\": " ($3*100)/'$numberOfCores' "}," }')

  $ECHO ${result%?} | _parseAndPrint
}

logged_in_users() {
  local whoCommand=$(type -P w)

  result=$(COLUMNS=300 $whoCommand -h | $AWK '{print "{\"user\": \"" $1 "\", \"from\": \"" $3 "\", \"when\": \"" $4 "\"},"}')

  $ECHO [ ${result%?} ] | _parseAndPrint
}

memcached() {
  local ncCommand=$(type -P nc)

  $ECHO "stats" \
    | $ncCommand -w 1 127.0.0.1 11211 \
    | $GREP 'bytes' \
    | $AWK 'BEGIN {print "{"} {print "\"" $2 "\": " $3 } END {print "}"}' \
    | $TR '\r' ',' \
    | $SED 'N;$s/,\n/\n/;P;D' \
    | _parseAndPrint
}

memory_info() {

  $CAT /proc/meminfo \
    | $AWK -F: 'BEGIN {print "{"} {print "\"" $1 "\": \"" $2 "\"" } END {print "}"}' \
    | $SED 'N;$s/,\n/\n/;P;D' \
    | _parseAndPrint
}

network_connections() {

  local netstatCmd=$(type -P netstat)
  local sortCmd=$(type -P sort)
  local uniqCmd=$(type -P uniq)

  $netstatCmd -ntu \
  | $AWK 'NR>2 {print $5}' \
  | $sortCmd \
  | $uniqCmd -c \
  | $AWK 'BEGIN {print "["} {print "{ \"connections\": " $1 ", \"address\": \"" $2 "\" }," } END {print "]"}' \
  | $SED 'N;$s/},/}/;P;D' \
  | _parseAndPrint
}

number_of_cpu_cores() {

  local numberOfCPUCores=$($GREP -c 'model name' /proc/cpuinfo)

  if [ -z $numberOfCPUCores ]; then
    echo "cannot be found";
  fi
}

# http://askubuntu.com/questions/413367/ping-multiple-ips-using-bash
ping() {

	# get absolute path to config file
    local SCRIPTPATH=$(dirname $(readlink -f $0))
	local CONFIG_PATH=$SCRIPTPATH"/config/ping_hosts"

    local pingCmd=$(type -P ping)
    local numOfLinesInConfig=$($SED -n '$=' $CONFIG_PATH)
	local result='['

	$CAT $CONFIG_PATH \
	|  while read output
		do
		   	singlePing=$($pingCmd -qc 2 $output \
		    | $AWK -F/ 'BEGIN { endLine="}," } /^rtt/ { if ('$numOfLinesInConfig'==1){endLine="}"} print "{" "\"host\": \"'$output'\", \"ping\": " $5 " " endLine }' \
		    )
		    numOfLinesInConfig=$(($numOfLinesInConfig-1))
		    result=$result$singlePing
			if [ $numOfLinesInConfig -eq 0 ]
				then
					$ECHO $result"]"
			fi
		done \
	| $SED 's/\},]/}]/g' \
  | _parseAndPrint
}

pm2_stats() {

	#get data
	local data="$(pm2 list)"
    local tailCommand=$(type -P tail)

	#only process data if variable has a length
	#this should handle cases where pm2 is not installed
	if [ -n "$data" ]; then

		#start processing data on line 4
		#don't process last 2 lines
		json=$( $ECHO "$data" | $tailCommand -n +4 | $HEAD -n +2 \
		| $AWK 	'{print "{"}\
			{print "\"appName\":\"" $2 "\","} \
			{print "\"id\":\"" $4 "\","} \
			{print "\"mode\":\"" $6 "\","} \
			{print "\"pid\":\"" $8 "\","}\
			{print "\"status\":\"" $10 "\","}\
			{print "\"restart\":\"" $12 "\","}\
			{print "\"uptime\":\"" $14 "\","}\
			{print "\"memory\":\"" $16 $17 "\","}\
			{print "\"watching\":\"" $19 "\""}\
			{print "},"}')
		#make sure to remove last comma and print in array
		$ECHO "[" ${json%?} "]" | _parseAndPrint
	else
		#no data found
		$ECHO "[]" | _parseAndPrint
	fi
}

ram_intensive_processes() {

  local psCommand=$(type -P ps)

  result=$($psCommand axo pid,user,pmem,rss,vsz,comm --sort -pmem,-rss,-vsz \
        | $HEAD -n 15 \
        | $AWK 'NR>1 {print "{ \"pid\": " $1 \
                      ", \"user\": \"" $2 \
                      "\", \"mem%\": " $3 \
                      ", \"rss\": " $4 \
                      ", \"vsz\": " $5 \
                      ", \"cmd\": \"" $6 \
                      "\"},"}')

  $ECHO [ ${result%?} ] | _parseAndPrint
}

recent_account_logins() {

  local lastLogCommand=$(type -p lastlog)

  result=$($lastLogCommand -t 365 \
        | $AWK 'NR>1 {\
          print "{ \
            \"user\": \"" $1 "\", \
            \"ip\": \"" $3 "\","" \
            \"date\": \"" $5" "$6" "$7" "$8" "$9 "\"},"
          }'
      )
  $ECHO [ ${result%?} ] | _parseAndPrint
}

redis() {

  ########### Enter Your Redis Password  HERE #########
  local redisPassword=''
  ########### Enter Your Redis Password  HERE #########

  local redisCommand=$(type -P redis-cli);

  if [ -n "$redisPassword" ]; then
    redisCommand="$redisCommand -a $redisPassword"
  fi

  result=$($redisCommand INFO \
        | $GREP 'redis_version\|connected_clients\|connected_slaves\|used_memory_human\|total_connections_received\|total_commands_processed' \
        | $AWK -F: '{print "\"" $1 "\":" "\"" $2 }' \
        | $TR '\r' '"' | $TR '\n' ','
      )
  $ECHO { ${result%?} } | _parseAndPrint
}

scheduled_crons() {

    ######
    # Credit: http://stackoverflow.com/questions/134906/how-do-i-list-all-cron-jobs-for-all-users#answer-137173
    ######

    local egrepCmd=$(type -P egrep)
    local crontabCmd=$(type -P crontab)

    # System-wide crontab file and cron job directory. Change these for your system.
    CRONTAB='/etc/crontab'
    CRONDIR='/etc/cron.d'

    # Single tab character. Annoyingly necessary.
    tab=$($ECHO -en "\t")

    # Given a stream of crontab lines, exclude non-cron job lines, replace
    # whitespace characters with a single space, and remove any spaces from the
    # beginning of each line.
    function clean_cron_lines() {
        while read line ; do
            $ECHO "${line}" |
                $egrepCmd --invert-match '^($|\s*#|\s*[[:alnum:]_]+=)' |
                $SED --regexp-extended "s/\s+/ /g" |
                $SED --regexp-extended "s/^ //"
        done;
    }

    # Given a stream of cleaned crontab lines, $echoCmd any that don't include the
    # run-parts command, and for those that do, show each job file in the run-parts
    # directory as if it were scheduled explicitly.
    function lookup_run_parts() {
        while read line ; do
            match=$($ECHO "${line}" | $egrepCmd -o 'run-parts (-{1,2}\S+ )*\S+')

            if [[ -z "${match}" ]] ; then
                $echoCmd "${line}"
            else
                cron_fields=$($ECHO "${line}" | $CUT -f1-6 -d' ')
                cron_job_dir=$($ECHO  "${match}" | $AWK '{print $NF}')

                if [[ -d "${cron_job_dir}" ]] ; then
                    for cron_job_file in "${cron_job_dir}"/* ; do  # */ <not a comment>
                        [[ -f "${cron_job_file}" ]] && $ECHO "${cron_fields} ${cron_job_file}"
                    done
                fi
            fi
        done;
    }

    # Temporary file for crontab lines.
    temp=$(mktemp) || exit 1

    # Add all of the jobs from the system-wide crontab file.
    $CAT "${CRONTAB}" | clean_cron_lines | lookup_run_parts >"${temp}"

    # Add all of the jobs from the system-wide cron directory.
    $CAT "${CRONDIR}"/* | clean_cron_lines >>"${temp}"  # */ <not a comment>

    # Add each user's crontab (if it exists). Insert the user's name between the
    # five time fields and the command.
    while read user ; do
        $crontabCmd -l -u "${user}" 2>/dev/null |
            clean_cron_lines |
            $SED --regexp-extended "s/^((\S+ +){5})(.+)$/\1${user} \3/" >>"${temp}"
    done < <($CUT --fields=1 --delimiter=: /etc/passwd)

    # Output the collected crontab lines.

    ## Changes: Parses output into JSON

    $CAT "${temp}" \
        | $AWK 'BEGIN {print "["} \
                    {print "{ \"min\": \"" $1 \
                    "\", \"hrs\": \"" $2 "\", " \
                    " \"day\": \"" $3 "\", " \
                    " \"month\": \"" $4 "\", " \
                    " \"wkday\": \"" $5 "\", " \
                    " \"user\": \"" $6 "\", " \
                    " \"CMD\": \""} \
                        {for(i=7;i<=NF;++i) printf("%s ", gensub("\"", "\\\\\"", "g", $i) ) } \
                    {print "\" " \
                    "}," } \
                END {print "]"}' \
        | $SED 'N;$s/,\n//;P;D' \
        | _parseAndPrint

    rm --force "${temp}"
}

swap() {

  local wcCmd=$(which wc)

  local swapLineCount=$($CAT /proc/swaps | $wcCmd -l)

  if [ "$swapLineCount" -gt 1 ]; then

    result=$($CAT /proc/swaps \
        | $AWK 'NR>1 {print "{ \"filename\": \"" $1"\", \"type\": \""$2"\", \"size\": \""$3"\", \"used\": \""$4"\", \"priority\": \""$5"\"}," }'
      )

    $ECHO [ ${result%?} ] | _parseAndPrint

  else
    $ECHO [] | _parseAndPrint
  fi
}

upload_transfer_rate() {

	local files=(/sys/class/net/*)
	local pos=$(( ${#files[*]} - 1 ))
	local last=${files[$pos]}

	local json_output="{"

	for interface in "${files[@]}"
	do
		basename=$(basename "$interface")

		# find the number of bytes transfered for this interface
		out1=$($CAT /sys/class/net/"$basename"/statistics/tx_bytes)

		# wait a second
		sleep 1

		# check same interface again
		out2=$($CAT /sys/class/net/"$basename"/statistics/tx_bytes)

		# get the difference (transfer rate)
		out_bytes=$((out2 - out1))

		# convert transfer rate to KB
		out_kbytes=$((out_bytes / 1024))

		# convert transfer rate to KB
		json_output="$json_output \"$basename\": $out_kbytes"

		# if it is not the last line
		if [[ ! $interface == $last ]]
		then
			# add a comma to the line (JSON formatting)
			json_output="$json_output,"
		fi
	done

	# close the JSON object & print to screen
	$ECHO "$json_output}" | _parseAndPrint
}

user_accounts() {
  result=$($AWK -F: '{ \
          if ($3<=499){userType="system";} \
          else {userType="user";} \
          print "{ \"type\": \"" userType "\"" ", \"user\": \"" $1 "\", \"home\": \"" $6 "\" }," }' < /etc/passwd
      )

  length=$($ECHO ${#result})

  if [ $length -eq 0 ]; then
    result=$(getent passwd | $AWK -F: '{ if ($3<=499){userType="system";} else {userType="user";} print "{ \"type\": \"" userType "\"" ", \"user\": \"" $1 "\", \"home\": \"" $6 "\" }," }')
  fi

  $ECHO [ ${result%?} ] | _parseAndPrint
}

fnCalled="$1"

# Check if the function call is indeed a function.
if [ -n "$(type -t $fnCalled)" ] && [ "$(type -t $fnCalled)" = function ]; then
    ${fnCalled}
else
    echo '{\"success\":false,\"status\":\"Invalid module\"}'
fi

