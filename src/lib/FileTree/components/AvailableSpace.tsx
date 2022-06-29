import React from "react";
import { Progress } from "reactstrap";
import { formatFileSize } from "../../Utils/formatters";

interface AvailableSpaceProps {
  initialSpaceUsed?: number;
  spaceUsed: number;
  spaceAvailable?: number;
}

const AvailableSpace: React.FC<AvailableSpaceProps> = ({ initialSpaceUsed, spaceUsed, spaceAvailable }) => {
  const progressColor = (() => {
    if (spaceAvailable) {
      const percentage = (100 / spaceAvailable) * spaceUsed;
      if (percentage >= 90) return "danger";
      if (percentage >= 75) return "warning";
    }
    return "primary";
  })();

  if (!spaceAvailable && !initialSpaceUsed) {
    return null;
  }

  return (
    <React.Fragment>
      <div style={{ marginTop: "10px", paddingRight: "20px" }}>
        {spaceAvailable ? (
          <React.Fragment>
            <Progress value={spaceUsed} max={spaceAvailable} striped color={progressColor} />
            {formatFileSize(spaceUsed)} / {formatFileSize(spaceAvailable)}
          </React.Fragment>
        ) : (
          <React.Fragment>{formatFileSize(spaceUsed)}</React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

export { AvailableSpace };
