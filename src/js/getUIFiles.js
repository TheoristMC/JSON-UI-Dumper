/**
 * @typedef {{ type: string, name: string, download_url: string }[]} UIFile
 * @typedef {{ commit: { message: string, author: { name: string, date: string } } }[]} MetaData
 */

/**
 * Get the metadata of the latest commit on samples
 * @returns {Promise<{ version: string, authorName: string, date: string }>}
 */
async function getMetadata() {
  const response = await fetch(
    `https://api.github.com/repos/Mojang/bedrock-samples/commits`
  );

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
 * Delay helper
 * @param {number} ms milliseconds
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a UI file from the samples with automatic retry on 429
 * @param {string} path
 * @param {number} retries number of retries left
 */
async function fetchUIFile(path, retries = 5) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/Mojang/bedrock-samples/contents/${path}`
    );
    return response;
  } catch (err) {
    if (err.status === 429 && retries > 0) {
      const waitTime = 2 ** (5 - retries) * 1000; // exponential backoff: 1s, 2s, 4s... to avoid rate limiting

      console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);

      await delay(waitTime);
      return fetchUIFile(path, retries - 1);
    }

    throw err;
  }
}

/**
 * Gets all UI files from bedrock-samples
 * @param {string} path
 * @returns {Promise<{ file_name: string, file_contents: string | undefined}>}
 */
async function getAllUIFiles(path = "resource_pack/ui") {
  const response = await fetchUIFile(path);

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

export { getAllUIFiles, getMetadata };
