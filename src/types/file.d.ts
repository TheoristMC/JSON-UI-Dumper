interface File<T> {
  name: string;
  content: T;
}

interface BadFile {
  name: string;
  content: { badError: string };
}

export { File, BadFile };
