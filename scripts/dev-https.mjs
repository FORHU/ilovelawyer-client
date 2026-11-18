// pnpm dev:https: the dev server over https for every client site at once. One server, one port:
// the host you open picks the tenant (uk-client-local.ilovelawyer.com is the UK site,
// kr-client-local.ilovelawyer.com the Korean one), so switching tenant is changing the address, not
// restarting. Google sign-in accepts these hosts as origins; a plain http host it does not.
//
// Next's own --hostname flag makes a certificate for one name, so this makes one for all of them with
// mkcert (the tool Next uses, with the same local CA, so browsers that trust Next's certificates
// trust this one). It needs Node 22.18+ to read the host list from src/lib/tenant/client-tenant.ts,
// so that list is the one the app itself uses. Each host also needs a line in your hosts file:
//   127.0.0.1  uk-client-local.ilovelawyer.com
//   127.0.0.1  kr-client-local.ilovelawyer.com

import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLIENT_HOSTS } from "../src/lib/tenant/client-tenant.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const certDir = path.join(root, "certificates");
const keyFile = path.join(certDir, "client-local-key.pem");
const certFile = path.join(certDir, "client-local.pem");
const namesFile = path.join(certDir, "client-local.names");
const PORT = process.env.PORT ?? "3004";

// Only the local ones: production and staging hosts are not served from this machine.
const names = ["localhost", "127.0.0.1", "::1", ...CLIENT_HOSTS.filter((h) => h.includes("-client-local.") || h === "client-local.ilovelawyer.com")];

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

/** mkcert on the PATH, or the copy Next downloaded the first time it made a certificate. */
function findMkcert() {
  if (spawnSync("mkcert", ["-version"], { stdio: "ignore" }).status === 0) return "mkcert";
  const dirs = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "mkcert"),
    path.join(os.homedir(), "Library", "Application Support", "mkcert"),
    path.join(os.homedir(), ".local", "share", "mkcert"),
  ].filter(Boolean);
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const found = fs.readdirSync(dir).find((f) => f.startsWith("mkcert-"));
    if (found) return path.join(dir, found);
  }
  return null;
}

const mkcert = findMkcert();
if (!mkcert) fail("mkcert not found. Install it (https://github.com/FiloSottile/mkcert), or run `pnpm exec next dev --experimental-https` once so Next downloads it, then try again.");

const upToDate = fs.existsSync(keyFile) && fs.existsSync(certFile) && fs.existsSync(namesFile) && fs.readFileSync(namesFile, "utf8") === names.join("\n");
if (!upToDate) {
  console.log(`Making a certificate for: ${names.join(", ")}`);
  fs.mkdirSync(certDir, { recursive: true });
  const made = spawnSync(mkcert, ["-key-file", keyFile, "-cert-file", certFile, ...names], { stdio: "inherit" });
  if (made.status !== 0) fail("mkcert could not make the certificate.");
  fs.writeFileSync(namesFile, names.join("\n"));
}

const caRoot = spawnSync(mkcert, ["-CAROOT"], { encoding: "utf8" }).stdout.trim();
const ca = path.join(caRoot, "rootCA.pem");
const next = createRequire(import.meta.url).resolve("next/dist/bin/next");

console.log(`\nServing every client site on port ${PORT}:`);
for (const host of names.filter((h) => h.endsWith(".com"))) console.log(`  https://${host}:${PORT}`);
console.log();

const server = spawn(
  process.execPath,
  [next, "dev", "-p", PORT, "--experimental-https", "--experimental-https-key", keyFile, "--experimental-https-cert", certFile, ...(fs.existsSync(ca) ? ["--experimental-https-ca", ca] : []), ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
