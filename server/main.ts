import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL"),
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN"),
  automaticDeserialization: false,
});

const allowedOrigin = "https://theoristmc.github.io";
const environment = Deno.env.get("ENVIRONMENT");

/**
 * Prevents people from accessing files outside of the base URL.
 */
function resolveSafeURL(base: string, path: string): string | null {
  const resolve = new URL(path, base);
  if (!resolve.href.startsWith(base)) return null;
  return resolve.href;
}

/**
 * Checks if the origin/referer is allowed to make a request.
 */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    return origin === allowedOrigin;
  }

  if (referer) {
    return referer.startsWith(allowedOrigin + "/") || referer === allowedOrigin;
  }

  return false;
}

/**
 * Tries to cache a value to the database with an hour of TTL.
 */
async function tryCache(
  path: string,
  eTag: string | null,
  body: string,
): Promise<void> {
  if (!eTag || body.length >= 1_000_000) return;
  try {
    const pipeline = redis.pipeline();
    pipeline.set(`etag:${path}`, eTag, { ex: 3600 });
    pipeline.set(`cached-data:${path}`, body, { ex: 3600 });

    const response = await pipeline.exec();
    if (!response) console.error("Unexpected error. Cache write failed.");
  } catch (err) {
    console.error("Cache write failed, skipping cache:", err);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  if (!originAllowed(req) && environment !== "development") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    // Ignore non-GET request methods
    if (req.method !== "GET") return new Response(null, { status: 405 });

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN)
      return new Response("Missing GITHUB_TOKEN", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": origin },
      });

    const url = new URL(req.url);
    const apiUrl = "https://api.github.com/repos/Mojang/bedrock-samples/";
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "Deno-Deploy",
      "Access-Control-Allow-Origin": origin,
    };

    if (url.pathname === "/rate") {
      const rate = await fetch("https://api.github.com/rate_limit", {
        headers: fetchHeaders,
      });

      return new Response(rate.body, {
        status: rate.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
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
            "Access-Control-Allow-Origin": origin,
          },
        },
      );
    }

    const path = url.searchParams.get("path");
    if (!path) {
      return new Response("Missing ?path parameter", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": origin },
      });
    }

    const safeUrl = resolveSafeURL(apiUrl, path);
    if (!safeUrl)
      return new Response("Invalid path", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": origin },
      });

    const eTagEntry = await redis.get<string>(`etag:${path}`);
    const headers = { ...fetchHeaders };
    if (eTagEntry) {
      const quoted = eTagEntry.startsWith('"') ? eTagEntry : `"${eTagEntry}"`;
      headers["If-None-Match"] = quoted;
    }

    const apiResponse = await fetch(safeUrl, { headers });

    // Don't cache during development.
    const cacheControl =
      environment === "development" ? "no-store" : "max-age=900";

    // If there was no change, pass back the cached value
    if (apiResponse.status === 304) {
      const cached = await redis.get<string>(`cached-data:${path}`);

      if (cached) {
        return new Response(cached, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
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
          "Access-Control-Allow-Origin": origin,
          "Cache-Control": cacheControl,
          "X-Cache-Status": "Refetched",
        },
      });
    }

    const body = await apiResponse.text();
    const eTag = apiResponse.headers.get("ETag");

    await tryCache(path, eTag, body);

    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
        "Cache-Control": cacheControl,
        "X-Cache-Status": "Fetched Fresh",
      },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(`Internal error: ${String(err)}`, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": origin },
    });
  }
});
