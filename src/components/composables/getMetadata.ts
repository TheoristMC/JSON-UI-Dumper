const API_URL: string = import.meta.env.APP_API_URL;

interface VersionItem {
  sha: string;
  text: string;
}

interface Rate {
  remaining: number;
}

class Metadata {
  /**
   * Returns the remaining fetching rate for the API.
   */
  static async getRate(): Promise<number> {
    try {
      const rate = await fetch(`${API_URL}/rate`);
      if (!rate.ok)
        throw new Error(`Cannot fetch remaining rate: ${rate.status}`);

      const content: Rate = await rate.json().then((v) => v.rate);

      return content.remaining;
    } catch (err) {
      throw new Error(`Cannot fetch rate: ${err}`);
    }
  }

  /**
   * Returns the available versions based on the Mojang samples.
   */
  static async getVersions(version: string): Promise<VersionItem[]> {
    try {
      const versions = await fetch(`${API_URL}/versions?version=${version}`);
      if (!versions.ok)
        throw new Error(`Cannot fetch available versions: ${versions.status}`);

      const content: VersionItem[] = await versions.json();

      const filteredContent = content.filter(({ text }) =>
        text.match(/^v?\d+(\.\d+)*(-preview)?$/),
      );

      return filteredContent;
    } catch (err) {
      throw new Error(`Cannot fetch versions: ${err}`);
    }
  }
}

export default Metadata;
export type { VersionItem };
