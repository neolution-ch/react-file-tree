import React from "react";
import { Progress, Table } from "reactstrap";
import { formatFileSize } from "../../Utils/formatters";
import { Translations } from "../../Utils/translations";

interface ProgressState {
  id: string;
  fileName: string;
  progress: number;
  fileSize: number;
}

interface FileProgressBarsProps {
  progressStates: ProgressState[];
}

const FileProgressBars: React.FC<FileProgressBarsProps> = ({ progressStates }) => {
  if (progressStates.length <= 0) return null;

  const { labelName, labelSize, labelProgress } = Translations.getTranslations();

  return (
    <React.Fragment>
      <Table>
        <thead>
          <tr>
            <th>{labelName}</th>
            <th>{labelSize}</th>
            <th>{labelProgress}</th>
          </tr>
        </thead>
        <tbody>
          {progressStates?.map((x, i) => (
            <tr key={i}>
              <td>{x.fileName}</td>
              <td>{formatFileSize(x.fileSize)}</td>
              <td>
                <Progress value={x.progress} animated>
                  {`${(Math.round(x.progress * 100) / 100).toFixed(2)}%`}
                </Progress>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </React.Fragment>
  );
};

export { FileProgressBars, ProgressState };
