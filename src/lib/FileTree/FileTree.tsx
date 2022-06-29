/* eslint-disable max-lines */
import React, { useRef, useState } from "react";
import { Col, Row } from "reactstrap";
import { v4 as uuidv4 } from "uuid";
import { AddFolderModal } from "./components/AddFolderModal";
import { FileItem, FileWithId, SupportedLangs, Folder } from "./types";
import { FolderContent } from "./components/FolderContent";
import { FolderTree } from "./components/FolderTree";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { FileProgressBars, ProgressState } from "./components/FileProgressBars";
import { ITranslations, Translations } from "../Utils/translations";
import { AvailableSpace } from "./components/AvailableSpace";
import "./css/style.css";

export type OnAddFolderFn = (parentId: string | null, name: string) => Promise<string>;
export type OnEditFolderFn = (folderId: string, name: string) => Promise<boolean>;
export type OnDeleteFolderFn = (folderId: string) => Promise<boolean>;
export type OnListFilesFn = (folderId: string) => Promise<FileItem[]>;
export type OnDeleteFileFn = (fileId: string) => Promise<boolean>;
export type OnFileUploadFn = (
  folderId: string,
  acceptedFiles: FileWithId[],
  onProgressUpdate: (id: string, progress: number) => void,
  onUpdateSpaceUsed: (x: number) => void,
) => Promise<boolean>;

interface FileTreeProps {
  /** Function called when files are uploaded (via drop or click) */
  onFileUpload: OnFileUploadFn;
  /** Function called when a new folder is added */
  onAddFolder: OnAddFolderFn;
  /** Function called when a folder is edited */
  onEditFolder: OnEditFolderFn;
  /** Function called when a folder is deleted */
  onDeleteFolder: OnDeleteFolderFn;
  /** Function called when files are listed */
  onListFiles: OnListFilesFn;
  /** Function called when we need to delete a file */
  onDeleteFile: OnDeleteFileFn;
  /** The language to be used for the labels. If your lang is not supported you can use the customTranslations prop. */
  language?: SupportedLangs;
  /** Custom translations (defaults to english ones) */
  customTranslations?: ITranslations;
  /** The initial space used in bytes. Will be updated when files are uploaded (via the onUpdateSpaceUsed callback) */
  initialSpaceUsed?: number;
  /** The space available in bytes */
  spaceAvailable?: number;
  /** The initial folder structure */
  initialFolders: Folder[];
}

/**
 * File Tree component. Renders a file tree with clickable actions.
 */
const FileTree: React.FC<FileTreeProps> = ({
  onFileUpload,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onListFiles,
  onDeleteFile,
  customTranslations,
  language,
  spaceAvailable,
  initialSpaceUsed,
  initialFolders,
}) => {
  const sortFolders = (folders: Folder[]) => folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  // we json stringify and parse it to a get a true copy of the array so we never modify the original array...
  const [folderState, setFolderState] = useState(sortFolders(JSON.parse(JSON.stringify(initialFolders)) as Folder[]));
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const [files, setFiles] = useState<FileItem[]>();
  const [progressSates, setProgressStates] = useState<ProgressState[]>([]);
  const [isFolderTreeLoading, setIsFolderTreeLoading] = useState(false);
  const [spaceUsed, setSpaceUsed] = useState(Math.min(initialSpaceUsed ?? 0, spaceAvailable ?? Number.MAX_SAFE_INTEGER));

  const editFolderName = useRef("");
  const deleteActionRef = useRef<() => Promise<void>>();
  const editDeleteActionRef = useRef<(name: string) => Promise<void>>();
  const deleteIsFolder = useRef(false);
  const translationsSet = useRef(false);

  if (!translationsSet.current) {
    if (language) Translations.setTranslations(language);
    if (customTranslations) Translations.setCustomTranslations(customTranslations);

    translationsSet.current = true;
  }

  const closeFoldersWithoutSubFolders = (state: Folder[]) => {
    state.forEach((x) => {
      if (!state.some((f) => f.parentId == x.id)) {
        x.isOpen = false;
      }
    });
  };

  const deleteFolderFromState = (folderId: string) => {
    setFolderState((prev) => {
      const copy = [...prev];
      copy.splice(
        copy.findIndex((x) => x.id == folderId),
        1,
      );

      closeFoldersWithoutSubFolders(copy);

      return copy;
    });

    // remove selected folder if it was deleted
    if (folderId == selectedFolderId) setSelectedFolderId(undefined);
  };

  const onToggleFolder = (folderId: string) => {
    setFolderState((prev) => {
      const copy = [...prev];

      var folder = copy.find((x) => x.id === folderId);

      if (folder) folder.isOpen = !folder.isOpen;

      return copy;
    });
  };

  const onSelectFolderAsync = async (folderId: string) => {
    setFolderState((prev) => {
      const copy = [...prev];

      var folder = copy.find((x) => x.id === folderId);

      if (folder) {
        var parentFolder = copy.find((x) => x.id === folder?.parentId);
        if (parentFolder) parentFolder.isOpen = true;
        setSelectedFolderId(folderId);

        onListFiles(folderId).then((files) => {
          setFiles(files);
        });
      }

      return copy;
    });
  };

  const onRequestAddFolder = (parentFolder: Folder | null) => {
    setIsAddFolderModalOpen(true);

    editDeleteActionRef.current = async (name: string) => {
      const parentFolderId = parentFolder == null ? null : parentFolder.id;
      const result = await onAddFolder(parentFolderId, name);
      if (result) {
        setIsFolderTreeLoading(true);
        setIsAddFolderModalOpen(false);

        setFolderState((prev) => {
          const copy = [...prev];

          copy.push({
            id: result,
            name: name,
            parentId: parentFolderId ?? undefined,
          });

          return sortFolders(copy);
        });

        setIsFolderTreeLoading(false);
      }
    };
  };

  const onRequestDeleteFolder = (folder: Folder) => {
    setIsDeleteConfirmModalOpen(true);
    deleteIsFolder.current = true;

    deleteActionRef.current = async () => {
      const result = await onDeleteFolder(folder.id);
      if (result) {
        setIsFolderTreeLoading(true);
        setIsDeleteConfirmModalOpen(false);

        deleteFolderFromState(folder.id);

        setIsFolderTreeLoading(false);
      }
    };
  };

  const onRequestDeleteFile = (fileId: string) => {
    setIsDeleteConfirmModalOpen(true);
    deleteIsFolder.current = false;

    deleteActionRef.current = async () => {
      const result = await onDeleteFile(fileId);
      if (result) {
        setIsDeleteConfirmModalOpen(false);
        if (selectedFolderId) await onSelectFolderAsync(selectedFolderId);
      }
    };
  };

  const onProgressUpdate = (id: string, progress: number) => {
    setProgressStates((prev) => {
      const clone = [...prev];

      const elementIndex = clone.findIndex((x) => x.id === id);

      if (progress === 100) {
        clone.splice(elementIndex);
      } else {
        var element = clone[elementIndex];
        if (element) element.progress = progress;
      }

      return clone;
    });
  };

  const onProgressStart = (file: FileWithId) => {
    setProgressStates((prev) => {
      const clone = [...prev];

      clone.push({
        fileName: file.file.name,
        id: file.id,
        progress: 0,
        fileSize: file.file.size,
      });

      return clone;
    });
  };

  const onUpdateSpaceUsed = (x: number) => setSpaceUsed(spaceUsed + x);

  const onRequestUploadFilesAsync = async (folderId: string, acceptedFiles: File[]) => {
    const filesWithId: FileWithId[] = acceptedFiles.map((x) => ({
      id: uuidv4(),
      file: x,
    }));

    filesWithId.forEach((x) => onProgressStart(x));

    await onFileUpload(folderId, filesWithId, onProgressUpdate, onUpdateSpaceUsed);

    // refresh the selected folder if files have been uploaded to it
    if (folderId == selectedFolderId) await onSelectFolderAsync(folderId);
  };

  const onRequestEditFolder = (folder: Folder) => {
    editFolderName.current = folder.name;
    setIsAddFolderModalOpen(true);

    editDeleteActionRef.current = async (newName: string) => {
      const result = await onEditFolder(folder.id, newName);
      if (result) {
        setIsFolderTreeLoading(true);
        setIsAddFolderModalOpen(false);

        setFolderState((prev) => {
          const copy = [...prev];
          const existingFolder = copy.find((x) => x.id === folder.id);
          if (existingFolder) existingFolder.name = newName;

          return sortFolders(copy);
        });

        setIsFolderTreeLoading(false);
      }
    };
  };

  return (
    <React.Fragment>
      <Row className="neo-folder-tree-container">
        <Col lg={3}>
          <FolderTree
            isLoading={isFolderTreeLoading}
            folders={folderState}
            onToggleFolder={onToggleFolder}
            onSelectFolder={onSelectFolderAsync}
            selectedFolderId={selectedFolderId}
            onRequestAddFolder={(parentFolder) => onRequestAddFolder(parentFolder)}
            onRequestEditFolder={(folder) => onRequestEditFolder(folder)}
            onRequestDeleteFolder={(folder) => onRequestDeleteFolder(folder)}
            onRequestUploadFiles={onRequestUploadFilesAsync}
          />

          <AvailableSpace spaceAvailable={spaceAvailable} initialSpaceUsed={initialSpaceUsed} spaceUsed={spaceUsed} />
        </Col>
        <Col lg={9}>
          <FileProgressBars progressStates={progressSates} />
          <FolderContent
            sizeExceeded={spaceUsed >= (spaceAvailable ?? Number.MAX_SAFE_INTEGER)}
            onSelectFolder={onSelectFolderAsync}
            folders={folderState}
            files={files}
            selectedFolderId={selectedFolderId}
            onRequestAddFolder={(parentFolder) => onRequestAddFolder(parentFolder)}
            onRequestEditFolder={(folder) => onRequestEditFolder(folder)}
            onRequestDeleteFolder={(folder) => onRequestDeleteFolder(folder)}
            onRequestDeleteFile={(fileId) => onRequestDeleteFile(fileId)}
            onRequestUploadFiles={onRequestUploadFilesAsync}
          />
        </Col>
      </Row>

      <AddFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={() => setIsAddFolderModalOpen(false)}
        initialValues={{
          name: editFolderName.current,
        }}
        onSubmit={async (values) => {
          if (editDeleteActionRef.current) await editDeleteActionRef.current(values.name);
        }}
      />

      <DeleteConfirmModal
        isFolder={deleteIsFolder.current}
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        onSubmit={async () => {
          if (deleteActionRef.current) await deleteActionRef.current();
        }}
      />
    </React.Fragment>
  );
};

export { FileTree, FileTreeProps, FileItem, Folder };
