import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Translations } from "../../Utils/translations";
import { FormikWrapper } from "@neolution-ch/react-formik-ui";

interface DeleteConfirmModalProps {
  onSubmit: () => void;
  onClose: () => void;
  isOpen: boolean;
  isFolder: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onSubmit, isOpen, onClose, isFolder }) => {
  const { textDeleteConfirmFile, textdeleteConfirmFolder, labelYes, labelCancel } = Translations.getTranslations();

  return (
    <React.Fragment>
      <Modal isOpen={isOpen} toggle={() => onClose()}>
        <FormikWrapper initialValues={{}} onSubmit={() => onSubmit()}>
          <ModalHeader>
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </ModalHeader>
          <ModalBody>{isFolder ? textdeleteConfirmFolder : textDeleteConfirmFile}</ModalBody>
          <ModalFooter>
            <Button type="submit" color="success">
              <FontAwesomeIcon icon={faCheck} /> {labelYes}
            </Button>
            <Button type="button" color="danger" onClick={() => onClose()}>
              <FontAwesomeIcon icon={faTimes} /> {labelCancel}
            </Button>
          </ModalFooter>
        </FormikWrapper>
      </Modal>
    </React.Fragment>
  );
};

export { DeleteConfirmModal };
