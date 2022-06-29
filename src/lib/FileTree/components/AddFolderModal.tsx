import React from "react";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";
import { FormikErrors } from "formik";
import { faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Translations } from "../../Utils/translations";
import { FormikWrapper, InputField } from "@neolution-ch/react-formik-ui";
interface AddFolderModalProps {
  onSubmit: (values: T) => void;
  onClose: () => void;
  isOpen: boolean;
  initialValues?: T;
}

type T = {
  name: string;
};

const AddFolderModal: React.FC<AddFolderModalProps> = ({ onSubmit, isOpen, onClose, initialValues = { name: "" } }) => {
  const { labelName, errorRequired, labelSubmit, labelCancel } = Translations.getTranslations();

  return (
    <React.Fragment>
      <Modal isOpen={isOpen} toggle={() => onClose()}>
        <FormikWrapper<T>
          initialValues={initialValues}
          validate={(values) => {
            const errors: FormikErrors<T> = {};

            if (!values.name) errors.name = errorRequired;

            return errors;
          }}
          onSubmit={(values) => onSubmit(values)}
        >
          <ModalBody>
            <InputField<T> name="name" label={labelName} placeholder={labelName} />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">
              <FontAwesomeIcon icon={faPaperPlane} /> {labelSubmit}
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

export { AddFolderModal };
