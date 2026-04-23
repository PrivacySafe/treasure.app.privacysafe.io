/*
 Copyright (C) 2026 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { SingleProc } from '../shared/processes/single.ts';
import { randomStr } from '../shared/utils/random-str.ts';
import { GROUPS_FILE_NAME } from '../shared/constants.ts';
import type { TreasureGroup, TreasureRecord } from '../@types/common.types.ts';
import type { TreasureFileSrv } from './srv.types.ts';

export async function treasureFileSrv(fs: web3n.files.WritableFS): Promise<TreasureFileSrv> {
  const fileProc = new SingleProc();

  async function saveFile(data: TreasureRecord | TreasureGroup[], fileName?: string): Promise<string> {
    // console.log('💾 SAVE_FILE => ', fileName, JSON.stringify(data));
    if (!data) {
      w3n.log('error', 'There is no data to save to the file');
      throw new Error('There is no data to save to the file');
    }

    const itemId =
      !(data as TreasureRecord).id || (data as TreasureRecord).id === 'new'
        ? randomStr(20)
        : (data as TreasureRecord).id;
    const fileNameUsed = fileName || itemId;

    try {
      await fileProc.startOrChain(async () => {
        const savedData = Array.isArray(data)
          ? data
          : {
              ...data,
              id: itemId,
            };

        await fs.writeJSONFile(fileNameUsed, savedData);
      });
      return fileNameUsed;
    } catch (err) {
      w3n.log('error', `Error saving the file ${fileNameUsed}. `, err);
      throw new Error(`Error saving the file ${fileNameUsed}.`);
    }
  }

  async function updateFile(data: TreasureRecord | TreasureGroup[], fileName?: string): Promise<void> {
    if (!(data as TreasureRecord).id && !fileName) {
      w3n.log('error', 'The filename argument is missing');
      throw new Error('The filename argument is missing');
    }

    const fileNameUsed = fileName || (data as TreasureRecord).id || GROUPS_FILE_NAME;
    await fileProc.startOrChain(async () => fs.writeJSONFile(fileNameUsed, data));
  }

  async function getFile<T>(
    fileName: string,
  ): Promise<(T extends TreasureRecord ? TreasureRecord : TreasureGroup[]) | null> {
    try {
      // @ts-ignore
      return fileProc.startOrChain(
        async () =>
          await fs
            .readJSONFile<T extends TreasureRecord ? TreasureRecord : TreasureGroup[]>(fileName)
            .catch(err => {
              if ((err as web3n.files.FileException).notFound) {
                if (fileName === GROUPS_FILE_NAME) {
                  return [];
                }

                return null;
              }

              throw err;
            }),
      );
    } catch (err) {
      w3n.log('error', `Error getting file ${fileName}. `, err);
      throw new Error(`Error getting file ${fileName}`);
    }
  }

  async function deleteFile(fileName: string): Promise<void> {
    try {
      const doesFileExist = await fs.checkFilePresence(fileName);
      // console.log('🧽 DELETE_FILE => ', fileName, doesFileExist);
      if (doesFileExist) {
        await fileProc.startOrChain(async () => await fs.deleteFile(fileName));
      }
    } catch (err) {
      w3n.log('error', `Error deleting file ${fileName}. `, err);
      throw new Error(`Error deleting file ${fileName}`);
    }
  }

  async function deleteFiles(currentRecordFileNames: string[]): Promise<void> {
    const promiseToPerformWorks = currentRecordFileNames.map(fileName => deleteFile(fileName));
    await Promise.allSettled(promiseToPerformWorks);
  }

  return {
    saveFile,
    updateFile,
    getFile,
    deleteFile,
    deleteFiles,
  };
}
