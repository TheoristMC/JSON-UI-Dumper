/**
 * @typedef {{ type: string, name: string, download_url: string }[]} UIFile
 * @typedef {Record<string, { version: string, date: string, type: string }>} UIVersion
 * @typedef {Promise<{ limit: number, used: number, remaining: number, reset: number }>} FetchRate
 */

const params = new URLSearchParams(window.location.search);
let paramType = params.get("version");

if (paramType === "stable") paramType = "main";
else if (paramType === "preview") paramType = "preview";
else paramType = "main";

/**
 * Get the git fetch rate
 * @returns {FetchRate}
 */
async function getFetchRate() {
  // Fetch via cloudfare worker
  const response = await fetch(
    `https://git-proxy.json-ui-dumper.workers.dev/rate_limit`,
  );
  if (!response.ok) {
    throw new Error("Fetch rate limit failed:", response.status);
  }

  return (await response.json()).rate;
}

/**
 * Gets the latest version.
 * @returns {Promise<UIVersion>}
 */
async function getVersion() {
  // Fetch via cloudfare worker
  const response = await fetch(
    `https://git-proxy.json-ui-dumper.workers.dev/?path=contents/version.json?ref=${paramType}`,
  );

  if (!response.ok) {
    throw new Error(`Git Version Fetch Error: ${response.status}`);
  }

  let ver = await response.json();
  ver = atob(ver.content);
  ver = JSON.parse(ver);

  return ver;
}

/**
 * Gets all UI files from bedrock-samples
 * @param {string} path
 * @returns {Promise<{ name: string, contents: string | undefined}[]>}
 */
async function getAllUIFiles(path = "contents/resource_pack/ui") {
  // Fetch via cloudfare worker
  const response = await fetch(
    `https://git-proxy.json-ui-dumper.workers.dev/?path=${path}?ref=${paramType}`,
  );

  if (!response.ok) {
    throw new Error(`Git File Fetch error: ${response.status}`);
  }

  /**
   * @type {UIFile}
   */
  const files = await response.json();

  if (!response.status === 200) return;

  const uiFiles = files.filter(
    (file) =>
      file.type === "file" &&
      file.name.toLowerCase().endsWith(".json") &&
      file.download_url,
  );

  return Promise.all(
    uiFiles.map(async (file) => {
      const contents = await fetch(file.download_url)
        .then((r) => r.text())
        .catch(() => "");

      return { name: file.name, contents };
    }),
  );
}

export { getAllUIFiles, getVersion, getFetchRate, paramType };
