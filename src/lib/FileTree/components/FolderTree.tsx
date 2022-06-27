import { faAngleDown, faAngleRight, faFolderOpen, faFolder, faUpload, faPlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Dropzone from "react-dropzone";
import { Spinner } from "reactstrap";
import { Folder } from "../types";
import { Translations } from "../../Utils/translations";

interface FolderTreeProps {
  folders: Folder[] | undefined;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onRequestUploadFiles: (folderId: string, acceptedFiles: File[]) => void;
  onRequestAddFolder: (parentFolder: Folder | null) => void;
  onRequestEditFolder: (folder: Folder) => void;
  onRequestDeleteFolder: (folder: Folder) => void;
  selectedFolderId?: string;
  isLoading: boolean;
}

const FolderTree: React.FC<FolderTreeProps> = (props) => {
  const { labelAddFolder } = Translations.getTranslations();

  if (props.isLoading) {
    return (
      <React.Fragment>
        loading...
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <Spinner color="primary" type="grow">
          Loading...
        </Spinner>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="tree">{props.folders && <FolderSubtree {...props} folders={props.folders} parentIdToDisplay={undefined} />}</div>

      <a onClick={() => props.onRequestAddFolder(null)}>
        <FontAwesomeIcon icon={faPlus} /> {labelAddFolder}
      </a>
    </React.Fragment>
  );
};

interface FolderSubtreeProps extends FolderTreeProps {
  parentIdToDisplay?: string;
  folders: Folder[];
}

const FolderSubtree: React.FC<FolderSubtreeProps> = (props) => {
  const {
    folders,
    onToggleFolder,
    onSelectFolder,
    onRequestUploadFiles,
    onRequestAddFolder,
    onRequestEditFolder,
    onRequestDeleteFolder,
    selectedFolderId,
    parentIdToDisplay,
  } = props;

  const foldersToDisplay = folders?.filter((x) => x.parentId == parentIdToDisplay);

  return (
    <ul>
      {foldersToDisplay?.map((x) => (
        <React.Fragment key={x.id}>
          <li>
            <span style={{ display: "inline-block", width: "10px", minWidth: "15px" }}>
              {folders.some((f) => f.parentId == x.id) && (
                <a onClick={() => onToggleFolder(x.id)}>
                  <FontAwesomeIcon icon={x.isOpen ? faAngleDown : faAngleRight} />
                </a>
              )}
            </span>
            <Dropzone
              noClick
              onDrop={async (acceptedFiles) => {
                await onRequestUploadFiles(x.id, acceptedFiles);
              }}
            >
              {({ getRootProps, getInputProps, open }) => (
                <span className="actions-trigger">
                  <a
                    onClick={() => {
                      onSelectFolder(x.id);
                    }}
                  >
                    <span {...getRootProps()}>
                      <input {...getInputProps()} />
                      <span
                        style={{
                          fontWeight: x.id === selectedFolderId ? "bold" : "normal",
                        }}
                      >
                        <span
                          style={{
                            minWidth: "20px",
                            display: "inline-block",
                          }}
                        >
                          <FontAwesomeIcon icon={x.isOpen ? faFolderOpen : faFolder} />
                        </span>
                        {x.name}
                      </span>
                    </span>
                  </a>
                  <span className="actions ml-2">
                    <a className="pl-1" onClick={open}>
                      <FontAwesomeIcon icon={faUpload} />
                    </a>
                    <a className="pl-1" onClick={() => onRequestAddFolder(x)}>
                      <FontAwesomeIcon icon={faPlus} />
                    </a>
                    <a className="pl-1" onClick={() => onRequestEditFolder(x)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </a>
                    <a className="pl-1" onClick={() => onRequestDeleteFolder(x)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </a>
                  </span>
                </span>
              )}
            </Dropzone>
            {!!x.isOpen && <FolderSubtree {...props} parentIdToDisplay={x.id} />}
          </li>
        </React.Fragment>
      ))}
    </ul>
  );
};

export { FolderTree };
