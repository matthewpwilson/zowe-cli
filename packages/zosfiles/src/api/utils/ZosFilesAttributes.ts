/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/


import * as minimatch from "minimatch";

export enum TransferMode {BINARY, TEXT}

/**
 * Attributes for a set of files
 */
export class ZosFilesAttributes {

    private ignoredFiles: string[] = [];
    private binaryFiles = new Map<string,TransferMode>();
    

    constructor(attributesFileContents: string) {
        this.parse(attributesFileContents);
    }

    public fileShouldBeUploaded(path: string): boolean {
        let upload = true;

        this.ignoredFiles.forEach((pattern) => {
            if (pattern.startsWith("!")) {
                pattern = pattern.substring(1);
                if (minimatch(path,pattern,{matchBase: true })) {
                    upload = true;
                }
            } else {
                if (minimatch(path,pattern,{matchBase: true })) {
                    upload = false;
                }
            }
        });
        return upload;
    }

    public getFileTransferMode(path: string): TransferMode {
        let result = TransferMode.TEXT;
        this.binaryFiles.forEach((mode, pattern) => {
            if (minimatch(path,pattern,{matchBase: true })) {
               result = mode;
            }
        });
        return result;
    }

    public getRemoteEncoding(path: string): string {
        return "";
    }

    private parse(attributesFileContents: string) {
        const lines = attributesFileContents.split("\n");
        lines.forEach((line) => {
            const parts = line.split(/\s+/);
            const pattern = parts[0];
            const localEncoding = parts[1];
            const remoteEncoding = parts[2];

            if (localEncoding === "-") {
                this.ignoredFiles.push(pattern);
            }
            if (localEncoding === remoteEncoding) {
                this.binaryFiles.set(pattern,TransferMode.BINARY);
            } else {
                this.binaryFiles.set(pattern,TransferMode.TEXT);
            }
         });
    }
}
