const PROD_ORIGINS = ["https://theoristmc.github.io"];
const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8000",
  "http://localhost:5173",
];

const kv = await Deno.openKv();
const environment = Deno.env.get("ENVIRONMENT");

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

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const allowOrigin = resolveAllowOrigin(origin, environment === "development");

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

    const commits = await fetch(apiUrl + `commits?sha=${version}`, {
      headers: fetchHeaders,
    });

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

  // If there was no change, pass back the cached value
  if (apiResponse.status === 304) {
    const cached = await kv.get<string>(["cached-data", path]);
    console.log("Returned a cached value");
    return new Response(cached.value ?? "", {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowOrigin,
        "Cache-Control": "max-age=900",
        "X-Cache-Status": "ETag Not Modified",
      },
    });
  }

  const body = await apiResponse.text();
  const eTag = apiResponse.headers.get("ETag");
  if (eTag) {
    await kv.set(["etag", path], eTag);
    await kv.set(["cached-data", path], body);
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
      "Cache-Control": "max-age=900",
      "X-Cache-Status": "Fetched Fresh",
    },
  });
});
