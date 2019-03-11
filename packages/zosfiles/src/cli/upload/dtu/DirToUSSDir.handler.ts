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

import { AbstractSession, IHandlerParameters, TextUtils, ImperativeError } from "@brightside/imperative";
import { Upload } from "../../../api/methods/upload";
import { IZosFilesResponse, ZosFilesAttributes } from "../../../api";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import * as path from "path";
import * as fs from "fs";
import { IUploadMap } from "../../../api/methods/upload/doc/IUploadMap";

/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */

export default class DirToUSSDirHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters,
                                    session: AbstractSession): Promise<IZosFilesResponse> {

        let inputDir: string;

        // resolving to full path if passed path is not absolute
        if (path.isAbsolute(commandParameters.arguments.inputDir)) {
            inputDir = commandParameters.arguments.inputDir;
        } else {
            inputDir = path.resolve(commandParameters.arguments.inputDir);
        }

        let response;
        const attributesFile = this.findAttributesFile(commandParameters, inputDir);

        if (attributesFile) {
            response  = await this.uploadWithAttributesFile
                 (attributesFile, response, session, inputDir, commandParameters);
        } else {
            const filesMap: IUploadMap = this.buildFilesMap(commandParameters);

            response = await Upload.dirToUSSDir(session, inputDir, commandParameters.arguments.USSDir,
                commandParameters.arguments.binary, commandParameters.arguments.recursive, filesMap);
        }

        const formatMessage = TextUtils.prettyJson(response.apiResponse);
        commandParameters.response.console.log(formatMessage);
        return response;
    }

    private findAttributesFile(commandParameters: IHandlerParameters, inputDir: string) {
        let attributesFile;
        if (commandParameters.arguments.attributes) {
            if (!fs.existsSync(commandParameters.arguments.attributes)) {
                throw new ImperativeError({ msg: "Attributes file " + commandParameters.arguments.attributes + " does not exist" });
            }
            attributesFile = commandParameters.arguments.attributes;
        }
        else {
            const localAttributesFile = path.join(inputDir, ".zosattributes");
            if (fs.existsSync(localAttributesFile)) {
                attributesFile = localAttributesFile;
            }
        }
        return attributesFile;
    }

    private async uploadWithAttributesFile(attributesFile: any,
                                           response: any,
                                           session: AbstractSession,
                                           inputDir: string,
                                           commandParameters: IHandlerParameters) {
        let attributesFileContents;
        try {
            attributesFileContents = fs.readFileSync(attributesFile).toString();
        }
        catch (err) {
            throw new ImperativeError({ msg: "Could not read attributes file " + attributesFile + ": " + err.message });
        }
        let attributes;
        try {
            attributes = new ZosFilesAttributes(attributesFileContents);
        }
        catch (err) {
            throw new ImperativeError({ msg: "Error parsing " + attributesFile + ": " + err.message });
        }
        response = await Upload.dirToUSSDir(session,
            inputDir, commandParameters.arguments.USSDir,
            commandParameters.arguments.binary,
            commandParameters.arguments.recursive,
            undefined, attributes);
        return response;
    }


    private buildFilesMap(commandParameters: IHandlerParameters) {
        let filesMap: IUploadMap = null;

        // checking if binary-files or ascii-files are used, and update filesMap argument
        if (commandParameters.arguments.binaryFiles) {
            filesMap = {
                binary: true,
                fileNames: commandParameters.arguments.binaryFiles.split(",").map((fileName: string) => fileName.trim()),
            };
        }
        if (commandParameters.arguments.asciiFiles) {
            filesMap = {
                binary: false,
                fileNames: commandParameters.arguments.asciiFiles.split(",").map((fileName: string) => fileName.trim()),
            };
        }
        return filesMap;
    }
}
