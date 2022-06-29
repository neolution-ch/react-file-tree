interface FileItem {
  id: string;
  name: string;
  url: string;
  dateModified: Date;
  fileSize: number;
  fileType: string;
  isDeleteable?: boolean;
}

interface FileWithId {
  id: string;
  file: File;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  isOpen?: boolean;
}

type SupportedLangs = "en" | "it";

export { FileItem, FileWithId, SupportedLangs, Folder };
