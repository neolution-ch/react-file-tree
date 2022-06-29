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

export type OnAddFolderFn = (parentId: string | null, name: string) => Promise<boolean>;
export type OnEditFolderFn = (folderId: string, name: string) => Promise<boolean>;
export type OnDeleteFolderFn = (folderId: string) => Promise<boolean>;
export type OnListFilesFn = (folderId: string) => Promise<FileItem[]>;
export type OnLoadFolderTreeFn = (parentFolderId: string | null) => Promise<Folder[]>;
export type OnDeleteFileFn = (parentFolderId: string | null) => Promise<boolean>;
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
  /** Function called when we need to refresh parts of the tree */
  onLoadFolderTree: OnLoadFolderTreeFn;
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
  folders: Folder[];
}

/**
 * File Tree component. Renders a file tree with clickable actions.
 * Does not care about ordering, this is expected to be delivered in the right sort order.
 */
const FileTree: React.FC<FileTreeProps> = ({
  onFileUpload,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onLoadFolderTree,
  onListFiles,
  onDeleteFile,
  customTranslations,
  language,
  spaceAvailable,
  initialSpaceUsed,
  folders,
}) => {
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  // we json stringify and parse it to a get a true copy of the array so we never modify the original array...
  const [folderState, setFolderState] = useState(JSON.parse(JSON.stringify(folders)) as Folder[]);
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

  const calculatePathIds = (folder: Folder, allFolders: Folder[]) => {
    const pathIds = [];
    let start: Folder | undefined = folder;
    while (start) {
      pathIds.push(start.id);
      start = allFolders.find((x) => x.id === start?.parentId);
    }

    return pathIds;
  };

  const refreshSubTreeAsync = async (folderId: string | null) => {
    const copy = [...folderState];

    const newSubTree = await onLoadFolderTree(folderId);

    if (folderId != null) {
      copy.forEach((x) => {
        const pathIds = calculatePathIds(x, copy);

        if (pathIds.includes(folderId)) {
          // the folder is not found anymore in the new sub tree, so we remove it
          if (x.id !== folderId && newSubTree.findIndex((f) => f.id === x.id) === -1) {
            copy.splice(copy.indexOf(x), 1);
          }
        }
      });
    }

    // add new folders
    newSubTree.forEach((x) => {
      if (copy.findIndex((f) => f.id === x.id) === -1) {
        copy.push(x);
      }

      const existingEntry = copy.find((f) => f.id === x.id);

      if (existingEntry) {
        existingEntry.name = x.name;
        // copy the open flag. If there are no subfolders anymore, set it to false
        existingEntry.isOpen = copy.some((f) => f.parentId == existingEntry.id) ? x.isOpen : false;
      }
    });

    setFolderState(copy);
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

        await refreshSubTreeAsync(parentFolderId);
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

        await refreshSubTreeAsync(folder.parentId ?? null);

        // remove selected folder if it was deleted
        if (folder.id == selectedFolderId) setSelectedFolderId(undefined);

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
        await refreshSubTreeAsync(folder.parentId ?? null);
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
