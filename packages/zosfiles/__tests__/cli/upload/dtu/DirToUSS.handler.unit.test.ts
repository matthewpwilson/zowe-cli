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

import { Upload } from "../../../../src/api/methods/upload";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import * as fs from "fs";
import { ZosFilesAttributes } from "../../../../src/api";

describe("Upload dir-to-uss handler", () => {

    describe("process method", () => {
        let fakeSession: any = null;
        const inputDir = "/somedir/test_dir";
        const USSDir = "USS_dir";
        let handler: any;

        // Vars populated by the mocked function
        let error: any;
        let apiMessage = "";
        let jsonObj: any;
        let logMessage = "";

        const DEFAULT_PARAMETERS = {
            arguments: {
                $0: "fake",
                _: ["fake"],
                inputDir,
                USSDir,
                // binary: boolean,
                // recursive: boolean,
                // asciiFiles: "a,b,c",
                // binaryFiles: "a,b,c",
                ...UNIT_TEST_ZOSMF_PROF_OPTS
            },
            response: {
                data: {
                    setMessage: jest.fn((setMsgArgs) => {
                        apiMessage = setMsgArgs;
                    }),
                    setObj: jest.fn((setObjArgs) => {
                        jsonObj = setObjArgs;
                    })
                },
                console: {
                    log: jest.fn((logArgs) => {
                        logMessage += "\n" + logArgs;
                    })
                },
                progress: {
                    startBar: jest.fn((parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                }
            },
            profiles: {
                get: jest.fn((args) => {
                    return {
                        host: "fake",
                        port: "fake",
                        user: "fake",
                        password: "fake",
                        auth: "fake",
                        rejectUnauthorized: "fake",
                    };
                })
            }
        };

        beforeEach(() => {

            // Mock the submit JCL function
            Upload.dirToUSSDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: false,
                    commandResponse: "uploaded",
                    apiResponse: [
                        {success: true, from: inputDir, to: USSDir},
                        {success: false, from: "testfrom", to: "testto"},
                        {success: undefined, from: "dummy", to: "nowhere"}
                    ]
                };
            });

            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/dtu/DirToUSSDir.handler");
            handler = new handlerReq.default();
        });

        it("should upload a directory to a USS directory if requested", async () => {

            await testHanlderWorksWithDefaultParameters();
            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect(Upload.dirToUSSDir).toHaveBeenCalledWith(fakeSession, inputDir, USSDir, undefined, undefined, null);
        });
        it("should pass attributes when a .zosattributes file is present", async () => {
            jest.spyOn(fs,"existsSync").mockReturnValue(true);
            const attributesContents = "foo.stuff -";
            jest.spyOn(fs,"readFileSync").mockReturnValueOnce(Buffer.from(attributesContents));

            await testHanlderWorksWithDefaultParameters();
            expect(Upload.dirToUSSDir).toHaveBeenCalledTimes(1);
            expect(Upload.dirToUSSDir).toHaveBeenCalledWith(fakeSession, inputDir, USSDir, undefined,
                                                            undefined, undefined, expect.any(ZosFilesAttributes));
        });

        it("should give an error if --attributes specifies a non-existent file", async () => {
            jest.spyOn(fs,"existsSync").mockReturnValue(false);
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            params.arguments.attributes = "non-existent-file";

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(params);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.message).toBe("Attributes file non-existent-file does not exist");
        });

        async function testHanlderWorksWithDefaultParameters() {
            const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process(params);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(params.profiles.get).toHaveBeenCalledWith("zosmf", false);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        }
    });
});

