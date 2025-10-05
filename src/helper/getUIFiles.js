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
  return await OctoInit.request("GET /repos/{owner}/{repo}", { owner, repo })
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
    per_page: 1
  });

  return commits.data[0].commit.message;
}

/**
 * Get all files inside a directory of a repo
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<{ name: string, file_contents: string | null }[]>}
 */
async function getFilesInDirectory(owner, repo, path) {
  try {
    /** @type {GetRepoContentResponse} */
    const response = await OctoInit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path }
    );

    const files = Array.isArray(response.data)
      ? response.data
      : [response.data];

    // Filter only UI JSON files
    const uiFiles = files.filter(
      (file) =>
        file.type === "file" && file.name.toLowerCase().endsWith(".json")
    );

    // Return the mapped UI files
    return await Promise.all(
      uiFiles.map(async (file) => {
        /** @type {GetRepoContentResponse} */
        const fileResp = await OctoInit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          { owner, repo, path: file.path }
        );

        // Decode from base64
        const contents = atob(fileResp.data.content);

        return {
          name: file.name,
          file_contents: contents,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
}

export { getFilesInDirectory, getMetadata, getLatestVersion };
