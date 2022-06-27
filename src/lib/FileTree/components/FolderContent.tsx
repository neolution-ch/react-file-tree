/* eslint-disable max-lines */
import React, { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonGroup,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from "reactstrap";
import { faPlus, faEdit, faTrash, faFolder, faCog, faAngleDown, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropzone from "react-dropzone";
import { FileIconFormatter, formatDatetime, formatFileSize } from "../../Utils/formatters";
import { FileItem, FlatFolder } from "../types";
import { Translations } from "../../Utils/translations";
import { OnListFilesFn } from "../FileTree";

interface FolderContentProps {
  folders: FlatFolder[];
  selectedFolderId?: string;
  onSelectFolder: (folderId: string) => void;
  onRequestUploadFiles: (folderId: string, acceptedFiles: File[]) => void;
  onRequestAddFolder: (parentFolder: FlatFolder) => void;
  onRequestEditFolder: (folder: FlatFolder) => void;
  onRequestDeleteFolder: (folder: FlatFolder) => void;
  onRequestDeleteFile: (fileId: string) => void;
  sizeExceeded: boolean;
  onListFiles: OnListFilesFn;
}

const FolderContent: React.FC<FolderContentProps> = ({
  folders,
  selectedFolderId,
  onRequestAddFolder,
  onRequestDeleteFolder,
  onRequestEditFolder,
  onRequestUploadFiles,
  onSelectFolder,
  onRequestDeleteFile,
  onListFiles,
  sizeExceeded = true,
}) => {
  const { textDropZone, labelDateModified, labelName, warningSizeExceeded } = Translations.getTranslations();

  const [files, setFiles] = useState<FileItem[]>();
  const [breadCrumbs, setBreadCrumbs] = useState<FlatFolder[]>([]);

  useEffect(() => {
    if (selectedFolderId) onListFiles(selectedFolderId).then((files) => setFiles(files));
  }, [selectedFolderId]);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);

  const getBreadCrumbs = (): FlatFolder[] => {
    if (!selectedFolder) return [];

    const result: FlatFolder[] = [];
    let start: FlatFolder | undefined = selectedFolder;

    while (start) {
      result.push(start);
      start = folders.find((folder) => folder.id === start?.parentId);
    }

    return result.reverse();
  };

  useEffect(() => {
    setBreadCrumbs(getBreadCrumbs());
  }, [selectedFolderId]);

  return (
    <React.Fragment>
      {selectedFolder && (
        <React.Fragment>
          <Row>
            <Col lg={5}>
              <h2 style={{ display: "inline-block" }}>{selectedFolder.name}</h2>
            </Col>
            <Col className="ml-auto">
              <div className="text-right">
                <ButtonGroup>
                  <Button
                    color="primary"
                    onClick={() => {
                      onRequestAddFolder(selectedFolder);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      onRequestEditFolder(selectedFolder);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      onRequestDeleteFolder(selectedFolder);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </ButtonGroup>
              </div>
            </Col>
          </Row>
          <Row>
            <Col xxl={12}>
              <Breadcrumb>
                {breadCrumbs.length >= 2 && (
                  <React.Fragment>
                    {breadCrumbs.map((x, i) => (
                      <BreadcrumbItem active={i === breadCrumbs.length - 1} key={x.id}>
                        <a onClick={() => onSelectFolder(x.id)}>{x.name}</a>
                      </BreadcrumbItem>
                    ))}
                  </React.Fragment>
                )}
              </Breadcrumb>
            </Col>
          </Row>
          {sizeExceeded ? (
            <Alert color="danger">{warningSizeExceeded}</Alert>
          ) : (
            <Dropzone
              onDrop={async (acceptedFiles) => {
                onRequestUploadFiles(selectedFolder.id, acceptedFiles);
              }}
            >
              {({ getRootProps, getInputProps, isDragActive }) => (
                <Col
                  lg={12}
                  style={{
                    padding: "20px",
                    borderWidth: 2,
                    borderRadius: 2,
                    borderColor: isDragActive ? "blue" : "#eeeeee",
                    borderStyle: "dashed",
                    backgroundColor: "#fafafa",
                    color: "#bdbdbd",
                    outline: "none",
                    transition: "border .24s ease-in-out",
                  }}
                >
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>{textDropZone}</p>
                  </div>
                </Col>
              )}
            </Dropzone>
          )}

          {folders.some((x) => x.parentId === selectedFolderId) && (
            <table className="mb-0 table table-hover">
              <thead>
                <tr>
                  <th className="align-middle bt-0">{labelName}</th>
                  <th className="align-middle bt-0">{labelDateModified}</th>
                  <th className="align-middle bt-0 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {folders
                  .filter((x) => x.parentId === selectedFolderId)
                  .map((x) => (
                    <tr key={x.id}>
                      <td className="align-middle">
                        <div className="media">
                          <div className="media-left media-middle">
                            <FontAwesomeIcon icon={faFolder} size="3x" className="mr-3" />
                          </div>
                          <div className="media-body">
                            <div className="text-inverse">
                              <a onClick={() => onSelectFolder(x.id)}>{x.name}</a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle" />
                      <td className="align-middle text-right" />
                    </tr>
                  ))}
                {files?.map((x) => (
                  <tr key={x.id}>
                    <td className="align-middle">
                      <div className="media">
                        <div className="media-left media-middle">
                          <FileIconFormatter fileType={x.fileType} />
                        </div>
                        <div className="media-body">
                          <div className="text-inverse">
                            <a target="_blank" rel="noreferrer" href={x.url}>
                              {x.name}
                            </a>
                          </div>
                          <span>{formatFileSize(x.fileSize)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">{formatDatetime(x.dateModified)}</td>
                    <td className="align-middle text-right">
                      <UncontrolledDropdown>
                        <DropdownToggle tag="button" className="btn btn-link">
                          <FontAwesomeIcon icon={faCog} className="mr-2" />
                          <FontAwesomeIcon icon={faAngleDown} />
                        </DropdownToggle>
                        <DropdownMenu right>
                          <a target="_blank" rel="noreferrer" href={x.url}>
                            <DropdownItem>
                              <FontAwesomeIcon icon={faDownload} className="mr-2" />
                              Download
                            </DropdownItem>
                          </a>
                          {x.isDeleteable && (
                            <DropdownItem onClick={() => onRequestDeleteFile(x.id)}>
                              <FontAwesomeIcon icon={faTrash} className="mr-2" />
                              Delete
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export { FolderContent };
