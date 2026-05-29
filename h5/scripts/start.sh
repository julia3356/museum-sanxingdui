#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

ensure_runtime_dir

pid="$(pid_from_file || true)"
if is_pid_running "${pid}"; then
  echo "museum H5 already running (pid ${pid})"
  echo "url: ${URL}"
  exit 0
fi

listener="$(port_pid)"
if [[ -n "${listener}" ]]; then
  echo "port ${PORT} is already occupied by pid ${listener}"
  echo "stop that process first, or use scripts/status.sh to inspect"
  exit 1
fi

cd "${APP_DIR}"
if [[ ! -d node_modules ]]; then
  echo "node_modules not found; run npm install first"
  exit 1
fi
if [[ ! -x "${APP_DIR}/node_modules/.bin/vite" ]]; then
  echo "vite binary not found; run npm install first"
  exit 1
fi

: > "${LOG_FILE}"
nohup "${APP_DIR}/node_modules/.bin/vite" \
  --host "${HOST}" \
  --port "${PORT}" \
  --strictPort \
  >> "${LOG_FILE}" 2>&1 < /dev/null &
new_pid="$!"
echo "${new_pid}" > "${PID_FILE}"
disown "${new_pid}" 2>/dev/null || true

for _ in {1..30}; do
  if is_pid_running "${new_pid}" && [[ "$(port_pid)" == "${new_pid}" || -n "$(port_pid)" ]]; then
    break
  fi
  sleep 0.2
done

if is_pid_running "${new_pid}" && [[ -n "$(port_pid)" ]]; then
  echo "museum H5 started (pid ${new_pid})"
  echo "url: ${URL}"
  echo "log: ${LOG_FILE}"
else
  echo "museum H5 failed to start"
  echo "log: ${LOG_FILE}"
  exit 1
fi
