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
import FileToDataSetHandler from "../../cli/upload/ftds/FileToDataSet.handler";

export enum TransferMode {BINARY, TEXT}

interface IUploadAttributes {
    ignore: boolean;
    localEncoding?: string;
    remoteEncoding?: string;
}

/**
 * Attributes for a set of files
 */
export class ZosFilesAttributes {

    private attributes = new Map<string,IUploadAttributes>();

    constructor(attributesFileContents: string) {
        this.parse(attributesFileContents);
    }

    public fileShouldBeUploaded(path: string): boolean {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null) {
            return true;
        }

        return !attributes.ignore;
    }

    public getFileTransferMode(path: string): TransferMode {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null) {
            return TransferMode.BINARY;
        }

        if (attributes.localEncoding === attributes.remoteEncoding) {
            return TransferMode.BINARY;
        } else {
            return TransferMode.TEXT;
        }
    }

    public getRemoteEncoding(path: string): string {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null) {
            return "binary";
        }

        return attributes.remoteEncoding;
    }

    private parse(attributesFileContents: string) {
        const lines = attributesFileContents.split("\n");
        lines.forEach((line) => {
            const parts = line.split(/\s+/);
            const pattern = parts[0];
            const localEncoding = parts[1];
            const remoteEncoding = parts[2];

            if (localEncoding === "-") {
                this.attributes.set(pattern, {ignore: true});
            } else {
                this.attributes.set(pattern, {ignore: false, localEncoding, remoteEncoding});
            }
         });
    }

    private findLastMatchingAttributes(path: string): IUploadAttributes {
        let result: IUploadAttributes = null;
        this.attributes.forEach((attributes, pattern) => {
            if (minimatch(path,pattern,{matchBase: true })) {
                result = attributes;
            }
        });
        return result;
    }
}
