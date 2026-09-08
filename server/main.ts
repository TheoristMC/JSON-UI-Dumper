const allowedOrigins = ["https://theoristmc.github.io"];
const kv = await Deno.openKv();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("X-Forwarded-For");
  return forwarded ? forwarded.split(",")[0].trim() : "";
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

  const isAllowed = allowedOrigins.some(
    (allowed) => origin && origin.startsWith(allowed),
  );
  if (!isAllowed) return new Response("Forbidden", { status: 403 });

  // Ignore non-GET request methods
  if (req.method !== "GET") return new Response(null, { status: 405 });

  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
  if (!GITHUB_TOKEN)
    return new Response("Missing GITHUB_TOKEN", { status: 500 });

  const url = new URL(req.url);
  const apiUrl = "https://api.github.com/repos/Mojang/bedrock-samples/";
  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "User-Agent": "Deno-Deploy",
  };

  if (url.pathname === "/rate") {
    const rate = await fetch("https://api.github.com/rate_limit", {
      headers: fetchHeaders,
    });

    return new Response(rate.body, {
      status: rate.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin ?? "",
      },
    });
  }

  if (url.pathname === "/versions") {
    const preview = await fetch(apiUrl + "commits?sha=preview", {
      headers: fetchHeaders,
    });
    const main = await fetch(apiUrl + "commits?sha=main", {
      headers: fetchHeaders,
    });

    const previewContent = await preview.json();
    const stableContent = await main.json();

    return new Response(
      JSON.stringify(
        [...stableContent, ...previewContent].map((content) => ({
          sha: content.sha,
          text: content.commit.message,
        })),
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin ?? "",
        },
      },
    );
  }

  const path = url.searchParams.get("path");
  if (!path) {
    return new Response("Missing ?path parameter", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": origin ?? "" },
    });
  }

  const safeUrl = resolveSafeURL(apiUrl, path);
  if (!safeUrl) return new Response("Invalid path", { status: 400 });

  const eTagEntry = await kv.get<string>(["etag", path]);
  const headers = { ...fetchHeaders };
  if (eTagEntry.value) headers["If-None-Match"] = eTagEntry.value;

  const ip = getClientIp(req);
  if (await isRateLimited(ip)) {
    return new Response("Too many request!", {
      status: 429,
      headers: { "Access-Control-Allow-Origin": origin ?? "" },
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
        "Access-Control-Allow-Origin": origin ?? "",
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
      "Access-Control-Allow-Origin": origin ?? "",
      "Cache-Control": "max-age=900",
      "X-Cache-Status": "Fetched Fresh",
    },
  });
});
