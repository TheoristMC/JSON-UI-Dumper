import { Octokit } from "octokit";

/**
 * @typedef {import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]} GetRepoContentResponse
 * @typedef {import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}"]["response"]} GetRepoResponse
 * @typedef {import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]} GetRepoCommitResponse
 */

const OctoInit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN,
});

/**
 * Get the repository's metadata
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<GetRepoResponse>}
 */
async function getMetadata(owner, repo) {
  return await OctoInit.request("GET /repos/{owner}/{repo}", { owner, repo });
}

/**
 * Gets the latest update version
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<string>}
 */
async function getLatestVersion(owner, repo) {
  const repoMeta = await getMetadata(owner, repo);
  const branch = repoMeta.data.default_branch;

  /**
   * @type {GetRepoCommitResponse}
   */
  const commits = await OctoInit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    sha: branch,
    per_page: 1,
  });

  return commits.data[0].commit.message;
}

/**
 * Delay helper
 * @param {number} ms milliseconds
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a file from GitHub with automatic retry on 429
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {number} retries number of retries left
 */
async function fetchFileWithRetry(owner, repo, path, retries = 5) {
  try {
    /**
     * @type {GetRepoContentResponse}
     */
    const response = await OctoInit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path }
    );
    return response.data;
  } catch (err) {
    if (err.status === 429 && retries > 0) {
      const waitTime = 2 ** (5 - retries) * 1000; // exponential backoff: 1s, 2s, 4s... to avoid rate limiting

      console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s...`); // [REMOVE] this after new commit

      await delay(waitTime);
      return fetchFileWithRetry(owner, repo, path, retries - 1);
    }

    throw err;
  }
}

/**
 * Get all JSON files inside a directory of a repo
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<{ name: string, file_contents: string | null }[]>}
 */
async function getFilesInDirectory(owner, repo, path) {
  try {
    const response = await fetchFileWithRetry(owner, repo, path);
    const files = Array.isArray(response) ? response : [response];

    // Filter only JSON files
    const uiFiles = files.filter(
      (file) =>
        file.type === "file" &&
        file.name.toLowerCase().endsWith(".json") &&
        file.download_url // must exist
    );

    // Use download_url (saves an API call per file!)
    const results = await Promise.all(
      uiFiles.map(async (file) => {
        const contents = await fetch(file.download_url).then((res) =>
          res.text()
        );
        return { name: file.name, file_contents: contents };
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
}

export { getFilesInDirectory, getMetadata, getLatestVersion };
