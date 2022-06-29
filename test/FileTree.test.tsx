/* eslint-disable max-lines */
import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FileTree,
  OnAddFolderFn,
  OnDeleteFileFn,
  OnDeleteFolderFn,
  OnEditFolderFn,
  OnFileUploadFn,
  OnListFilesFn,
  OnLoadFolderTreeFn,
} from "../src/lib/FileTree/FileTree";
import { FileItem, Folder } from "../src/lib/FileTree/types";
import { Translations } from "../src/lib/Utils/translations";

describe("<FileTree />", () => {
  const { labelName, labelYes, labelSubmit, labelDelete } = Translations.getTranslations();

  const exampleFolders: Folder[] = [
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

  const exampleInputFiles = [
    new File(["hello world"], "ping.json", {
      type: "application/json",
    }),
    new File(["hello world2"], "ping2.json", {
      type: "application/json",
    }),
  ];

  interface Options {
    onAddFolder?: OnAddFolderFn;
    onDeleteFolder?: OnDeleteFolderFn;
    onEditFolder?: OnEditFolderFn;
    onFileUpload?: OnFileUploadFn;
    onLoadFolderTree?: OnLoadFolderTreeFn;
    onDeleteFile?: OnDeleteFileFn;
    onListFiles?: OnListFilesFn;
  }

  function setup(options: Options, folders = exampleFolders) {
    const onAddFolderMock = jest.fn(async () => true);
    const onDeleteFolderMock = jest.fn(async () => true);
    const onEditFolderMock = jest.fn(async () => true);
    const onDeleteFileMock = jest.fn(async () => true);
    const onFileUploadMock = jest.fn(async () => true);
    const onListFilesMock = jest.fn(async () => exampleFiles);
    const onLoadFolderTreeMock = jest.fn(async () => []);

    const {
      onAddFolder = onAddFolderMock,
      onListFiles = onListFilesMock,
      onDeleteFolder = onDeleteFolderMock,
      onEditFolder = onEditFolderMock,
      onFileUpload = onFileUploadMock,
      onLoadFolderTree = onLoadFolderTreeMock,
      onDeleteFile = onDeleteFileMock,
    } = options;

    const utils = render(
      <FileTree
        folders={folders}
        onAddFolder={onAddFolder}
        onDeleteFolder={onDeleteFolder}
        onEditFolder={onEditFolder}
        onFileUpload={onFileUpload}
        onLoadFolderTree={onLoadFolderTree}
        onListFiles={onListFiles}
        onDeleteFile={onDeleteFile}
      />,
    );
    return { onAddFolder, onListFiles, onDeleteFolder, onEditFolder, onFileUpload, onLoadFolderTree, onDeleteFile, ...utils };
  }

  test("add folder works", async () => {
    const newFolderName = "N";
    const folderSubTree: Folder[] = [
      {
        id: "1.1",
        name: "folder 1.1",
      },
      {
        id: "1.2",
        name: "N",
      },
    ];

    const { getByText, getByLabelText, onAddFolder, onLoadFolderTree } = setup({
      onLoadFolderTree: jest.fn(async () => folderSubTree),
    });

    // Open the root folders so we see the neewly added folder later
    exampleFolders.forEach((x) => {
      getByText(x.name).closest("li")?.querySelector(".fa-angle-right")?.closest("a")?.click();
    });

    // Click the plus button, type the new name and hit the send button
    getByText(exampleFolders[0].name).closest("li")?.querySelector(".fa-plus")?.closest("a")?.click();
    userEvent.type(getByLabelText(labelName), newFolderName);
    userEvent.click(getByText(labelSubmit));

    await waitFor(() => expect(onAddFolder).toHaveBeenNthCalledWith(1, "1", newFolderName));
    await waitFor(() => expect(onLoadFolderTree).toHaveBeenNthCalledWith(1, "1"));
    await waitFor(() => expect(getByText(newFolderName)).toBeTruthy());
  });

  test("edit folder works", async () => {
    const newFolderName = "new folder name";
    const folderSubTree: Folder[] = JSON.parse(JSON.stringify(exampleFolders));
    folderSubTree[0].name = newFolderName;

    const { getByText, getByLabelText, onEditFolder, onLoadFolderTree } = setup({
      onLoadFolderTree: jest.fn(async () => folderSubTree),
    });

    // Click the edit button, type the new name and hit the send button
    getByText(exampleFolders[0].name).closest("li")?.querySelector(".fa-pen-to-square")?.closest("a")?.click();
    const inputField = getByLabelText(labelName);
    expect((inputField as HTMLInputElement).value).toBe(exampleFolders[0].name);
    userEvent.clear(inputField);
    userEvent.type(inputField, newFolderName);
    userEvent.click(getByText(labelSubmit));

    await waitFor(() => expect(onEditFolder).toHaveBeenNthCalledWith(1, "1", newFolderName));
    await waitFor(() => expect(onLoadFolderTree).toHaveBeenNthCalledWith(1, null));
    await waitFor(() => expect(getByText(newFolderName)).toBeTruthy());
  });

  test("delete folder works", async () => {
    let folderSubTree: Folder[] = JSON.parse(JSON.stringify(exampleFolders));
    // eslint-disable-next-line prefer-destructuring
    const folderToDelete = folderSubTree[2];
    folderSubTree = folderSubTree.filter((x) => x.name !== folderToDelete.name);

    const { queryByText, getByText, onDeleteFolder, onLoadFolderTree } = setup({
      onLoadFolderTree: jest.fn(async () => folderSubTree),
    });

    // Click the trash button and than yes in the modal
    getByText(folderToDelete.name).closest("li")?.querySelector(".fa-trash")?.closest("a")?.click();
    userEvent.click(getByText(labelYes));

    await waitFor(() => expect(onDeleteFolder).toHaveBeenNthCalledWith(1, folderToDelete.id));
    await waitFor(() => expect(onLoadFolderTree).toHaveBeenNthCalledWith(1, null));
    await waitFor(() => expect(queryByText(folderToDelete.name)).toBeNull());
  });

  test("upload files by dropping", async () => {
    const { getByText, onFileUpload } = setup({});

    const inputEl = getByText(exampleFolders[2].name).closest("li")?.querySelector("input");
    expect(inputEl).not.toBeNull();

    Object.defineProperty(inputEl, "files", {
      value: exampleInputFiles,
    });

    fireEvent.drop(inputEl as HTMLElement);

    await waitFor(() => expect(onFileUpload).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(onFileUpload).toHaveBeenLastCalledWith(
        "2",
        [
          expect.objectContaining({ file: expect.objectContaining({ path: "ping.json" }), id: expect.any(String) }),
          expect.objectContaining({ file: expect.objectContaining({ path: "ping2.json" }), id: expect.any(String) }),
        ],
        expect.any(Function),
        expect.any(Function),
      ),
    );
  });

  test("upload files by clicking", async () => {
    const { getByText, onFileUpload } = setup({});

    const inputEl = getByText(exampleFolders[2].name).closest("li")?.querySelector("input");
    expect(inputEl).not.toBeNull();

    userEvent.upload(inputEl as HTMLInputElement, exampleInputFiles);

    await waitFor(() => expect(onFileUpload).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(onFileUpload).toHaveBeenLastCalledWith(
        "2",
        [
          expect.objectContaining({ file: expect.objectContaining({ path: "ping.json" }), id: expect.any(String) }),
          expect.objectContaining({ file: expect.objectContaining({ path: "ping2.json" }), id: expect.any(String) }),
        ],
        expect.any(Function),
        expect.any(Function),
      ),
    );
  });

  test("listing files and deleting works", async () => {
    const { getAllByText, getByText, onListFiles, findAllByText, onDeleteFile } = setup({});

    getByText(exampleFolders[0].name).closest("a")?.click();

    await waitFor(() => expect(onListFiles).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onListFiles).toHaveBeenLastCalledWith(exampleFolders[0].id));

    expect(await findAllByText(/file-[0-9]\..*/)).toHaveLength(exampleFiles.length);
    expect(getAllByText((content, element) => element?.tagName.toLowerCase() === "span" && content === "1.0 KB")).toHaveLength(
      exampleFiles.length,
    );

    getByText(exampleFiles[0].name).closest("tr")?.querySelector(".fa-cog")?.closest("button")?.click();
    getByText(labelDelete).click();
    userEvent.click(getByText(labelYes));
    await waitFor(() => expect(onDeleteFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onDeleteFile).toHaveBeenLastCalledWith("file-1"));
    await waitFor(() => expect(onListFiles).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onListFiles).toHaveBeenLastCalledWith(exampleFolders[0].id));

    // make sure the second file doesn't have the delete button because isDeleteable is not set
    expect(getByText(exampleFiles[1].name).closest("tr")?.querySelector(".fa-trash")).toBeNull();
  });

  test("renders correctly", async () => {
    const { container, getByText } = setup({});

    exampleFolders
      .filter((x) => x.parentId === undefined)
      .forEach((x) => {
        getByText(x.name).closest("li")?.querySelector(".fa-angle-right")?.closest("a")?.click();
      });

    expect(container.firstChild).toMatchSnapshot();
  });
});
