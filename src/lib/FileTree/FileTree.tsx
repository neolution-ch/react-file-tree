/* eslint-disable max-lines */
import React, { useRef, useState } from "react";
import { Col, Row } from "reactstrap";
import { v4 as uuidv4 } from "uuid";
import { AddFolderModal } from "./components/AddFolderModal";
import { FileItem, FileWithId, SupportedLangs, FlatFolder } from "./types";
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
export type OnLoadFolderTreeFn = (parentFolderId: string | null) => Promise<FlatFolder[]>;
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

  flatFolders: FlatFolder[];
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
  flatFolders,
}) => {
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [flatFolderState, setFlatFolderState] = useState(flatFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
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

  const refreshSubTreeAsync = async (folderId: string | null) => {
    console.log(`Refreshing folder with id ${folderId}`);

    const copy = [...flatFolderState];

    const newSubTree = await onLoadFolderTree(folderId);
    console.log(`New Subtree is ${newSubTree}`);
    console.log(newSubTree);

    copy.forEach((x) => {
      const pathIds = [];
      if (folderId != null) {
        let start: FlatFolder | undefined = x;
        while (start) {
          pathIds.push(start.id);
          start = copy.find((folder) => folder.id === start?.parentId);
        }
      }

      if (folderId == null || pathIds.includes(folderId)) {
        // the folder is not found anymore in the new sub tree, so we remove it
        if (newSubTree.findIndex((f) => f.id === x.id) === -1) {
          copy.splice(copy.indexOf(x), 1);
        }
      }
    });

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

    setFlatFolderState(copy);
  };

  const onToggleFolder = (folderId: string) => {
    setFlatFolderState((prev) => {
      const copy = [...prev];

      var folder = copy.find((x) => x.id === folderId);

      if (folder) folder.isOpen = !folder.isOpen;

      return copy;
    });
  };

  const onSelectFolderAsync = async (folderId: string) => {
    setFlatFolderState((prev) => {
      const copy = [...prev];

      var folder = copy.find((x) => x.id === folderId);

      if (folder) {
        var parentFolder = copy.find((x) => x.id === folder?.parentId);
        if (parentFolder) parentFolder.isOpen = true;
        setSelectedFolderId(folderId);
      }

      return copy;
    });
  };

  const onRequestAddFolder = (parentFolder: FlatFolder | null) => {
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

  const onRequestDeleteFolder = (folder: FlatFolder) => {
    setIsDeleteConfirmModalOpen(true);
    deleteIsFolder.current = true;

    deleteActionRef.current = async () => {
      const result = await onDeleteFolder(folder.id);
      if (result) {
        setIsFolderTreeLoading(true);
        setIsDeleteConfirmModalOpen(false);

        if (folder.parentId) await refreshSubTreeAsync(folder.parentId);

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
        clone[elementIndex].progress = progress;
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

  const onRequestEditFolder = (folder: FlatFolder) => {
    editFolderName.current = folder.name;
    setIsAddFolderModalOpen(true);

    editDeleteActionRef.current = async (newName: string) => {
      const result = await onEditFolder(folder.id, newName);
      if (result) {
        setIsFolderTreeLoading(true);
        setIsAddFolderModalOpen(false);
        if (folder.parentId) await refreshSubTreeAsync(folder.parentId);
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
            folders={flatFolderState}
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
            folders={flatFolderState}
            onListFiles={onListFiles}
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

export { FileTree, FileTreeProps, FileItem, FlatFolder };
