import { SupportedLangs } from "../FileTree/types";

export interface ITranslations {
  errorRequired: string;
  textDeleteConfirmFile: string;
  textdeleteConfirmFolder: string;
  textDropZone: string;
  labelName: string;
  labelDateModified: string;
  labelSize: string;
  labelProgress: string;
  labelSubmit: string;
  labelYes: string;
  labelCancel: string;
  labelAddFolder: string;
  labelDelete: string;
  labelDownload: string;
  warningSizeExceeded: string;
}

const defaultTranslations: Record<SupportedLangs, ITranslations> = {
  en: {
    errorRequired: "Input is mandatory",
    textDeleteConfirmFile: "Are you sure you want to permanently delete this file?",
    textdeleteConfirmFolder: "Are you sure you want to delete this folder? All subfolders (including their files) will also be deleted.",
    textDropZone: "Drag n drop some files here, or click to select files",
    labelName: "Name",
    labelDateModified: "Date Modified",
    labelSize: "File Size",
    labelProgress: "Progress",
    labelYes: "Yes",
    labelCancel: "Cancel",
    labelSubmit: "Send",
    labelAddFolder: "Add folder",
    labelDelete: "Delete",
    labelDownload: "Download",
    warningSizeExceeded: "The file size limit has exceeded.",
  },
  it: {
    errorRequired: "L'inserimento è obbligatorio",
    textDeleteConfirmFile: "Sei sicuro di voler eliminare definitivamente questo file?",
    textdeleteConfirmFolder:
      "Sei sicuro di voler cancellare questa cartella? Anche tutte le sottocartelle (compresi i loro file) saranno cancellate.",
    textDropZone: "Trascina qui alcuni file, o clicca per selezionare i file",
    labelName: "Nome",
    labelDateModified: "Data modificata",
    labelSize: "Dimensione del file",
    labelProgress: "Progresso",
    labelYes: "Si",
    labelCancel: "Cancella",
    labelSubmit: "Invia",
    labelAddFolder: "aggiungi nuovo",
    labelDelete: "cancellare",
    labelDownload: "scaricare",
    warningSizeExceeded: "Il limite di dimensione del file è stato superato.",
  },
  de: {
    errorRequired: "Angabe zwingend",
    textDeleteConfirmFile: "Soll der Eintrag endgültig gelöscht werden?",
    textdeleteConfirmFolder: "Soll dieser Ordner endgültig gelöscht werden? Alle Unterordner und alle zugehörigen Dateien werden gelöscht.",
    textDropZone: "Dateien per Drag & Drop hierher ziehen oder klicken, um Dateien auszuwählen",
    labelName: "Name",
    labelDateModified: "Änderungsdatum",
    labelSize: "Dateigrösse",
    labelProgress: "Fortschritt",
    labelYes: "Ja",
    labelCancel: "Abbruch",
    labelSubmit: "Absenden",
    labelAddFolder: "Ordner hinzufügen",
    labelDelete: "Löschen",
    labelDownload: "Download",
    warningSizeExceeded: "Die Dateigrössenbeschränkung wurde überschritten.",
  },
  fr: {
    errorRequired: "Obligatoire",
    textDeleteConfirmFile: "Êtes-vous sûr de vouloir supprimer définitivement ce fichier ?",
    textdeleteConfirmFolder: "Êtes-vous sûr de vouloir supprimer ce dossier ? Tous les sous-dossiers (y compris leurs fichiers) seront également supprimés.",
    textDropZone: "Faites glisser et déposez quelques fichiers ici, ou cliquez pour sélectionner des fichiers",
    labelName: "Nom",
    labelDateModified: "Date modifiée",
    labelSize: "Taille du fichier",
    labelProgress: "Progrès",
    labelYes: "Oui",
    labelCancel: "Cancel",
    labelSubmit: "Annuler",
    labelAddFolder: "Ajouter le dossier",
    labelDelete: "Supprimer",
    labelDownload: "Télécharger",
    warningSizeExceeded: "La limite de taille de fichier a dépassé.",
  },
};

class Translations {
  static translations: ITranslations = defaultTranslations.en;

  static getTranslations(): ITranslations {
    return Translations.translations;
  }

  static setTranslations(lang: SupportedLangs): void {
    Translations.translations = defaultTranslations[lang];
  }

  static setCustomTranslations(translations: ITranslations): void {
    Translations.translations = translations;
  }
}

export { Translations };
