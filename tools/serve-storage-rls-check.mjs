import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 4173);
const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "supabase-storage-rls-read-check.html");

if (!existsSync(pagePath)) {
  console.error(`Missing ${pagePath}`);
  process.exit(1);
}

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${port}`);
  if (url.pathname !== "/" && url.pathname !== "/supabase-storage-rls-read-check.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  createReadStream(pagePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Mewri Storage RLS read check is local-only at http://127.0.0.1:${port}/`);
  console.log("Use only the staging Project URL and public anon key. Never use the service_role key.");
});
