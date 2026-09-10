const PROD_ORIGINS = ["https://theoristmc.github.io"];
const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8000",
  "http://localhost:5173",
];

const environment = Deno.env.get("ENVIRONMENT");
const kv = await Deno.openKv(
  environment === "development" ? "./server/db/dev-kv.sqlite3" : undefined,
);

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("X-Forwarded-For");
  return forwarded ? forwarded.split(",")[0].trim() : "";
}

function resolveAllowOrigin(origin: string | null, isDev: boolean): string {
  const allowed = isDev ? [...PROD_ORIGINS, ...DEV_ORIGINS] : PROD_ORIGINS;
  return origin && allowed.includes(origin) ? origin : PROD_ORIGINS[0];
}

/**
 * Prevents people from accessing files outside of the base URL.
 */
function resolveSafeURL(base: string, path: string): string | null {
  const resolve = new URL(path, base);
  if (!resolve.href.startsWith(base)) return null;
  return resolve.href;
}

async function isRateLimited(ip: string): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60_000);
  const key = ["rate-limit", ip, bucket];

  const entry = await kv.get<number>(key);
  const count = entry.value ?? 0;

  if (count >= 15) return true;

  await kv.set(key, count + 1, { expireIn: 60_000 });
  return false;
}

async function tryCache(
  path: string,
  eTag: string | null,
  body: string,
): Promise<void> {
  // Deno KV has a 64KB limit per value (lameee)
  if (!eTag || body.length >= 65536) return;
  try {
    const res = await kv
      .atomic()
      .set(["etag", path], eTag)
      .set(["cached-data", path], body)
      .commit();
    if (!res.ok) console.error("Atomic cache write failed");
  } catch (err) {
    console.error("Cache write failed, skipping cache:", err);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const allowOrigin = resolveAllowOrigin(origin, environment === "development");

  try {
    // Ignore non-GET request methods
    if (req.method !== "GET") return new Response(null, { status: 405 });

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN)
      return new Response("Missing GITHUB_TOKEN", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": allowOrigin },
      });

    const url = new URL(req.url);
    const apiUrl = "https://api.github.com/repos/Mojang/bedrock-samples/";
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "Deno-Deploy",
      "Access-Control-Allow-Origin": allowOrigin,
    };

    if (url.pathname === "/rate") {
      const rate = await fetch("https://api.github.com/rate_limit", {
        headers: fetchHeaders,
      });

      return new Response(rate.body, {
        status: rate.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowOrigin,
        },
      });
    }

    if (url.pathname === "/versions") {
      let version = url.searchParams.get("version");
      version =
        version === "stable"
          ? "main"
          : version === "preview"
            ? "preview"
            : "main";

      // Perhaps increase the page count here later on in the development
      // but as of now, the fewer, the less latency.
      const commits = await fetch(apiUrl + `commits?sha=${version}`, {
        headers: fetchHeaders,
      });

      if (!commits.ok) {
        return new Response(commits.statusText, { status: commits.status });
      }

      const content: { sha: string; commit: { message: string } }[] =
        await commits.json();

      return new Response(
        JSON.stringify(
          content.map((v) => ({
            sha: v.sha,
            text: v.commit.message,
          })),
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": allowOrigin,
          },
        },
      );
    }

    const path = url.searchParams.get("path");
    if (!path) {
      return new Response("Missing ?path parameter", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowOrigin },
      });
    }

    const safeUrl = resolveSafeURL(apiUrl, path);
    if (!safeUrl)
      return new Response("Invalid path", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": allowOrigin },
      });

    const eTagEntry = await kv.get<string>(["etag", path]);
    const headers = { ...fetchHeaders };
    if (eTagEntry.value) headers["If-None-Match"] = eTagEntry.value;

    const ip = getClientIp(req);
    if (await isRateLimited(ip)) {
      return new Response("Too many request!", {
        status: 429,
        headers: { "Access-Control-Allow-Origin": allowOrigin },
      });
    }

    const apiResponse = await fetch(safeUrl, { headers });

    // Don't cache during development.
    const cacheControl =
      environment === "development" ? "no-store" : "max-age=900";

    // If there was no change, pass back the cached value
    if (apiResponse.status === 304) {
      const cached = await kv.get<string>(["cached-data", path]);

      if (cached.value) {
        return new Response(cached.value, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": allowOrigin,
            "Cache-Control": cacheControl,
            "X-Cache-Status": "ETag Not Modified",
          },
        });
      }

      // If we're hitting 304 but there is no cached value,
      // refetch instead of returning an empty body.
      const freshResponse = await fetch(safeUrl, { headers: fetchHeaders });
      const freshBody = await freshResponse.text();
      const freshETag = freshResponse.headers.get("ETag");

      await tryCache(path, freshETag, freshBody);

      return new Response(freshBody, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowOrigin,
          "Cache-Control": cacheControl,
          "X-Cache-Status": "Cache Miss On 304 - Refetched",
        },
      });
    }

    const body = await apiResponse.text();
    const eTag = apiResponse.headers.get("ETag");

    await tryCache(path, eTag, body);

    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowOrigin,
        "Cache-Control": cacheControl,
        "X-Cache-Status": "Fetched Fresh",
      },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(`Internal error: ${String(err)}`, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": allowOrigin },
    });
  }
});
