# H5 Local Service Scripts

These scripts manage the museum H5 Vite development server for local integration.

## Commands

```bash
cd /Users/wujiajia/CursorProject/04/sanxingdui-guide/h5

cp .env.example .env
# Fill AI keys in .env.

npm run local-api
scripts/start.sh
scripts/status.sh
scripts/stop.sh
scripts/restart.sh
```

Equivalent npm shortcuts:

```bash
npm run h5:start
npm run h5:status
npm run h5:stop
npm run h5:restart
```

Local Ask Guide API:

```bash
npm run local-api
```

## Runtime

- URL: `http://127.0.0.1:5175/tools/museum/`
- PID file: `.runtime/museum-h5.pid`
- Log file: `.runtime/museum-h5.log`
- Host: `127.0.0.1`
- Port: `5175`
- Local Ask Guide API: `http://127.0.0.1:8787/api/v1/museum/ask-guide`

## Notes

- Run `npm install` before `scripts/start.sh`.
- Copy `.env.example` to `.env` before running `npm run local-api`.
- The script starts Vite directly from `node_modules/.bin/vite`.
- The app uses Vite base path `/tools/museum/`, matching the nginx route.
- Vite dev server proxies `/api` to `127.0.0.1:8787`, so the H5 page can call `/api/v1/museum/ask-guide` without exposing model keys in browser code.
