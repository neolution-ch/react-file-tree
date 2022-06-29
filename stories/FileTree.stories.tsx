/* eslint-disable max-lines */
import React from "react";
import { Story, Meta } from "@storybook/react";
import { FileItem, FileTree, FileTreeProps, Folder } from "../src/lib/FileTree/FileTree";

export default {
  title: "Examples/File Tree",
  component: FileTree,
} as Meta;

const Template: Story<FileTreeProps> = (args) => (
  <React.Fragment>
    <FileTree {...args} />
  </React.Fragment>
);

let folders: Folder[] = [
  {
    id: "1",
    name: "folder 1",
  },
  {
    id: "1.1",
    name: "folder 1.1",
    parentId: "1",
  },
  {
    id: "1.2",
    name: "folder 1.2",
    parentId: "1",
  },
  {
    id: "2",
    name: "folder 2",
  },
  {
    id: "2.1",
    name: "folder 2.1",
    parentId: "2",
  },
];

const exampleFiles: FileItem[] = [
  {
    dateModified: new Date(),
    fileSize: 1000,
    fileType: ".jpg",
    name: "file-1.jpg",
    url: "file-1.jpg",
    id: "file-1",
    isDeleteable: true,
  },
  {
    dateModified: new Date(),
    fileSize: 1000,
    fileType: ".jpg",
    name: "file-2.jpg",
    url: "file-2.jpg",
    id: "file-2",
  },
];

function makeid(length = 10) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const FileTreeTemplate = Template.bind({});
FileTreeTemplate.args = {
  initialFolders: folders,
  onFileUpload: async (_folderId, acceptedFiles, onProgressUpdate) =>
    new Promise<boolean>((resolve) => {
      acceptedFiles.forEach((f) => {
        exampleFiles.push({
          dateModified: new Date(),
          fileSize: 100,
          fileType: ".pdf",
          id: f.id,
          name: f.file.name,
          url: "https://google.ch",
        });
        onProgressUpdate(f.id, 100);
      });

      resolve(true);
    }),
  onAddFolder: async () => makeid(),
  onEditFolder: async () => true,
  onDeleteFile: async (fileId) => {
    exampleFiles.splice(
      exampleFiles.findIndex((x) => x.id == fileId),
      1,
    );
    return true;
  },
  onDeleteFolder: async () => true,
  onListFiles: async () => exampleFiles,
} as FileTreeProps;
FileTreeTemplate.decorators = [
  (StoryComponent: any) => (
    <React.Fragment>
      <p>This is a static example</p>
      <StoryComponent />
    </React.Fragment>
  ),
];
