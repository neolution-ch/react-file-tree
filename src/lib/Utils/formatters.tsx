import React from "react";
import {
  faFile,
  faFileArchive,
  faFileAudio,
  faFileExcel,
  faFileImage,
  faFilePdf,
  faFilePowerpoint,
  faFileVideo,
  faFileWord,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function formatFileSize(bytes: number, si = true, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si ? ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    // eslint-disable-next-line no-param-reassign
    bytes /= thresh;
    u += 1;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return `${bytes.toFixed(dp)} ${units[u]}`;
}

function formatDatetime(date: Date, format = "dd.MM.yyyy HH:mm:ss") {
  const padStart = (value: number): string => value.toString().padStart(2, "0");
  const typedDate = typeof date === "string" ? new Date(date) : date;

  return format
    .replace(/yyyy/g, padStart(typedDate.getFullYear()))
    .replace(/dd/g, padStart(typedDate.getDate()))
    .replace(/MM/g, padStart(typedDate.getMonth() + 1))
    .replace(/HH/g, padStart(typedDate.getHours()))
    .replace(/mm/g, padStart(typedDate.getMinutes()))
    .replace(/ss/g, padStart(typedDate.getSeconds()));
}

type SupportedFileTypes =
  | ".xls"
  | ".xlsx"
  | ".doc"
  | ".docx"
  | ".pdf"
  | ".zip"
  | ".rar"
  | ".png"
  | ".jpeg"
  | ".mov"
  | ".mp4"
  | ".ppt"
  | ".pptx"
  | ".mp3";

const fileTypeLut: Record<SupportedFileTypes, IconDefinition> = {
  ".xls": faFileExcel,
  ".xlsx": faFileExcel,
  ".doc": faFileWord,
  ".docx": faFileWord,
  ".png": faFileImage,
  ".jpeg": faFileImage,
  ".mov": faFileVideo,
  ".mp4": faFileVideo,
  ".mp3": faFileAudio,
  ".pdf": faFilePdf,
  ".ppt": faFilePowerpoint,
  ".pptx": faFilePowerpoint,
  ".rar": faFileArchive,
  ".zip": faFileArchive,
};

interface FileIconFormatterProps {
  fileType: string;
}

const FileIconFormatter: React.FC<FileIconFormatterProps> = ({ fileType }) => (
  <FontAwesomeIcon className="mr-3" size="3x" icon={fileTypeLut[fileType] ?? faFile} />
);

export { formatFileSize, formatDatetime, FileIconFormatter };
