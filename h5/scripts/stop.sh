#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

pid="$(pid_from_file || true)"
if is_pid_running "${pid}"; then
  kill "${pid}"
  for _ in {1..20}; do
    if ! is_pid_running "${pid}"; then
      break
    fi
    sleep 0.2
  done
  if is_pid_running "${pid}"; then
    kill -TERM "${pid}" >/dev/null 2>&1 || true
  fi
  rm -f "${PID_FILE}"
  echo "museum H5 stopped (pid ${pid})"
  exit 0
fi

listener="$(port_pid)"
if [[ -n "${listener}" ]]; then
  kill "${listener}"
  rm -f "${PID_FILE}"
  echo "museum H5 listener stopped (pid ${listener})"
  exit 0
fi

rm -f "${PID_FILE}"
echo "museum H5 is not running"
