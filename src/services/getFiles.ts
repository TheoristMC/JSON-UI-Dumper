import JSON5 from "json5";

const API_URL: string = import.meta.env.APP_API_URL;

interface File<T> {
  name: string;
  content: T;
}

interface FetchedFile {
  type: "file" | "dir";
  download_url: string;
  name: string;
}

class Files {
  static async getUI(sha: string): Promise<File<string>[]> {
    try {
      const files = await fetch(
        `${API_URL}/?path=contents/resource_pack/ui?ref=${sha}`,
      );
      if (!files.ok) throw new Error(`Cannot fetch UI files: ${files.status}`);

      // Content actually has dirs on them and we will eventually need
      // to support those too. Not now though... maybe later?
      const content: FetchedFile[] = await files.json();

      const filteredContent = content.filter(
        ({ name, type }) => name.endsWith(".json") && type === "file",
      );

      return Promise.all(
        filteredContent.map(async (file) => {
          try {
            const fileResponse = await fetch(file.download_url);
            if (!fileResponse.ok) {
              throw new Error(
                `Cannot fetch '${file.name}' file: ${fileResponse.status}`,
              );
            }

            const fileContent = await fileResponse.text();

            return { name: file.name, content: fileContent } as File<string>;
          } catch (err) {
            throw new Error(`Cannot fetch '${file.name}' file: ${err}`);
          }
        }),
      );
    } catch (err) {
      throw new Error(`Cannot UI files: ${err}`);
    }
  }

  static parsedFiles(files: File<string>[]): File<Record<string, string>>[] {
    return files.map((v) => {
      const parsedContent = JSON5.parse(v.content);
      return { name: v.name, content: parsedContent };
    });
  }
}

export default Files;
