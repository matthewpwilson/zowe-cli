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


/**
 * Attributes for a set of files
 */
export class ZosFilesAttributes {

    private ignoredFiles: string[];

    constructor(attributesFileContents: string) {
        this.ignoredFiles = [];
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

    private parse(attributesFileContents: string) {
        const lines = attributesFileContents.split("\n");
        lines.forEach((line) => {
            const parts = line.split(/\s+/);
            if (parts[1] === "-") {
                this.ignoredFiles.push(parts[0]);
            }
         });
    }
}
