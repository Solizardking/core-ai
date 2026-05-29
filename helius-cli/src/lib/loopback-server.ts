import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export interface LoopbackResult {
  port: number;
  awaitCallback: (expectedState: string, timeoutMs: number) => Promise<string>;
  close: () => void;
}

const SUCCESS_PAGE =
  "<!doctype html><html><body style=\"font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 80px auto; text-align: center;\">" +
  "<h1>Logged in</h1><p>You can close this tab and return to your terminal.</p></body></html>";

const ERROR_PAGE = (msg: string) =>
  "<!doctype html><html><body style=\"font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 80px auto; text-align: center;\">" +
  `<h1>Login failed</h1><p>${msg}</p><p>Return to your terminal for details.</p></body></html>`;

/**
 * Starts an HTTP server bound to 127.0.0.1 on a random port (RFC 8252 §7.3).
 * Resolves when the browser hits `/oauth/callback` with a `code` and matching `state`.
 *
 * The returned `awaitCallback` rejects on:
 *   - `OAUTH_ERROR:<error>` if the callback URL includes an `error` param
 *   - `NO_CODE` if neither code nor error is present
 *   - `STATE_MISMATCH` if the returned state doesn't match the expected value
 *   - `TIMEOUT` if no callback arrives within the timeout
 */
export async function startLoopback(): Promise<LoopbackResult> {
  const server: Server = createServer();
  let resolveCb!: (value: string) => void;
  let rejectCb!: (err: Error) => void;
  const cbPromise = new Promise<string>((res, rej) => {
    resolveCb = res;
    rejectCb = rej;
  });

  server.on("request", (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/oauth/callback") {
      res.writeHead(404).end();
      return;
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(ERROR_PAGE(error));
      rejectCb(new Error(`OAUTH_ERROR:${error}`));
      return;
    }
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(ERROR_PAGE("missing authorization code"));
      rejectCb(new Error("NO_CODE"));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(SUCCESS_PAGE);
    resolveCb(`${code}|${state ?? ""}`);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;

  return {
    port,
    awaitCallback: async (expectedState, timeoutMs) => {
      let timeoutHandle: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<string>((_, rej) => {
        timeoutHandle = setTimeout(() => rej(new Error("TIMEOUT")), timeoutMs);
      });
      try {
        const result = await Promise.race([cbPromise, timeoutPromise]);
        const [code, state] = result.split("|");
        if (state !== expectedState) throw new Error("STATE_MISMATCH");
        return code;
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }
    },
    close: () => server.close(),
  };
}
