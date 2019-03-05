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

interface IUploadAttributes {
    ignore: boolean;
    localEncoding?: string;
    remoteEncoding?: string;
}

/**
 * Attributes for a set of files relating to how they will be uploaded to USS
 */
export class ZosFilesAttributes {

    private static MAX_EXPECTED_FIELDS = 3;
    private static MIN_EXPECTED_FIELDS = 2;

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
            return "ISO8859-1";
        }

        return attributes.remoteEncoding;
    }

    private parse(attributesFileContents: string) {
        const lines = attributesFileContents.split("\n");
        let lineNumber = 0;
        lines.forEach((line) => {
            lineNumber++;
            const parts = line.trim().split(/\s+/);
            const pattern = parts[0];
            const localEncoding = parts[1];
            const remoteEncoding = parts[2];

            if (parts.length > ZosFilesAttributes.MAX_EXPECTED_FIELDS || parts.length < ZosFilesAttributes.MIN_EXPECTED_FIELDS) {
                throw new Error("Syntax error on line " + lineNumber + " - expected <pattern> <local encoding> <remote encoding>.");
            }

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