#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${APP_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/museum-h5.pid"
LOG_FILE="${RUNTIME_DIR}/museum-h5.log"
HOST="127.0.0.1"
PORT="5175"
URL="http://${HOST}:${PORT}/tools/museum/"

ensure_runtime_dir() {
  mkdir -p "${RUNTIME_DIR}"
}

pid_from_file() {
  if [[ -f "${PID_FILE}" ]]; then
    tr -d '[:space:]' < "${PID_FILE}"
  fi
}

is_pid_running() {
  local pid="${1:-}"
  [[ -n "${pid}" ]] && kill -0 "${pid}" >/dev/null 2>&1
}

port_pid() {
  lsof -tiTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

print_status() {
  local pid
  local listener
  pid="$(pid_from_file || true)"
  listener="$(port_pid)"

  if is_pid_running "${pid}"; then
    echo "museum H5 is running (pid ${pid})"
    echo "url: ${URL}"
    echo "log: ${LOG_FILE}"
    return 0
  fi

  if [[ -n "${listener}" ]]; then
    echo "museum H5 pid file is not active, but port ${PORT} is occupied by pid ${listener}"
    echo "url: ${URL}"
    return 0
  fi

  echo "museum H5 is stopped"
  return 3
}
