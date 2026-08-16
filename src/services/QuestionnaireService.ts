// src/services/QuestionnaireService.ts
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { parseQuestionnaireXML } from '../utils/xmlParser';
import { QuestionnaireModule } from '../types';

const ANAGRAFICA_FILE = 'anagrafica.xml';
const BERLINO_FILE = 'berlino.xml';

const getIOSPath = (fileName: string) => `${RNFS.MainBundlePath}/${fileName}`;
const getAndroidPath = (fileName: string) => `${RNFS.DocumentDirectoryPath}/${fileName}`;

const readXMLFile = async (fileName: string): Promise<string> => {
  if (Platform.OS === 'ios') {
    return await RNFS.readFile(getIOSPath(fileName), 'utf8');
  } else {
    const destPath = getAndroidPath(fileName);
    const exists = await RNFS.exists(destPath);
    if (!exists) {
      await RNFS.copyFileAssets(fileName, destPath);
    }
    return await RNFS.readFile(destPath, 'utf8');
  }
};

export const QuestionnaireService = {
  loadAnagrafica: async (): Promise<QuestionnaireModule> => {
    const xml = await readXMLFile(ANAGRAFICA_FILE);
    return parseQuestionnaireXML(xml);
  },
  loadBerlino: async (): Promise<QuestionnaireModule> => {
    const xml = await readXMLFile(BERLINO_FILE);
    return parseQuestionnaireXML(xml);
  },
};
