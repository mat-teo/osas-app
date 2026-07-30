// src/constants/index.ts
import RNFS from 'react-native-fs';

export const API_BASE_URL = 'http://172.20.10.2:8888/osas_api/';
export const XML_PATH_IOS = `${RNFS.MainBundlePath}/questionario.xml`;
export const XML_DEST_PATH = `${RNFS.DocumentDirectoryPath}/questionario.xml`;
export const READONLY_FIELDS = ['nome', 'cognome', 'codice_fiscale', 'data_nascita', 'sesso'];

export const API_ENDPOINTS = {
  SAVE_QUESTIONARIO: `${API_BASE_URL}save_questionario.php`,
} as const;