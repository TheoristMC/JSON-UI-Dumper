/**
 * @typedef {{ type: string, name: string, download_url: string }[]} UIFile
 * @typedef {{ commit: { message: string, author: { name: string, date: string } } }[]} MetaData
 * @typedef {Promise<{ limit: number, used: number, remaining: number, reset: number }>} FetchRate
 */

/**
 * Get the git fetch rate
 * @returns {FetchRate}
 */
async function getFetchRate() {
  // Fetch via cloudfare worker
  const response = await fetch(`https://git-proxy.json-ui-dumper.workers.dev/rate_limit`);
  if (!response.ok) {
    throw new Error("Fetch rate limit failed:", response.status);
  }

  return (await response.json()).rate;
}

/**
 * Get the metadata of the latest commit on samples
 * @returns {Promise<{ version: string, authorName: string, date: string }>}
 */
async function getMetadata(path = "commits") {
  // Fetch via cloudfare worker
  const response = await fetch(`https://git-proxy.json-ui-dumper.workers.dev/?path=${path}`);

  if (!response.ok) {
    throw new Error(`Git Metadata Fetch error: ${response.status}`);
  }

  /**
   * @type {MetaData}
   */
  const metadata = await response.json();

  const { author, message } = metadata[0].commit;
  return {
    version: message.replace("v", ""),
    authorName: author.name,
    date: author.date,
  };
}

/**
 * Gets all UI files from bedrock-samples
 * @param {string} path
 * @returns {Promise<{ name: string, contents: string | undefined}[]>}
 */
async function getAllUIFiles(path = "contents/resource_pack/ui") {
  // Fetch via cloudfare worker
  const response = await fetch(`https://git-proxy.json-ui-dumper.workers.dev/?path=${path}`);

  if (!response.ok) {
    throw new Error(`Git File Fetch error: ${response.status}`);
  }

  /**
   * @type {UIFile}
   */
  const files = await response.json();

  const uiFiles = files.filter(
    (file) =>
      file.type === "file" &&
      file.name.toLowerCase().endsWith(".json") &&
      file.download_url
  );

  return Promise.all(
    uiFiles.map(async (file) => {
      const contents = await fetch(file.download_url)
        .then((r) => r.text())
        .catch(() => "");

      return { name: file.name, contents };
    })
  );
}

export { getAllUIFiles, getMetadata, getFetchRate };
