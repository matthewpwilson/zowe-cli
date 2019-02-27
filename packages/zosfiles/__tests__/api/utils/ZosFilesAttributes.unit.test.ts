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


import { ZosFilesAttributes, TransferMode } from "../../../src/api/utils/ZosFilesAttributes";


describe("ZosFilesAttributes", () => {
    describe("Ignoring", () => {
        it("does not ignore files not mentioned in .zosattributes", () => {
            const testable = new ZosFilesAttributes("");
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
        });

        it("does not ignore files marked with an encoding", () => {
            const attributesFileContents = "foo.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
        });

        it("ignores a single file marked with -", () => {
            const attributesFileContents = "foo.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
        });

        it("ignores a file marked with - and not a file marked with an encoding", () => {
            const attributesFileContents = "foo.stuff -\nbar.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeTruthy();

        });

        it("ignores files matched by a *", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeFalsy();
        });

        it("ignores files within directories matched by a *", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("/a/nestted/path/to/foo.stuff")).toBeFalsy();
        });

        it("ignores files matched files when there are multiple patterns", () => {
            const attributesFileContents = "*.stuff -\n*.bin -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldBeUploaded("bar.bin")).toBeFalsy();
        });

        it("ignores files according to the last matching pattern", () => {
            const attributesFileContents = "*.stuff -\n"  +
                                           "foo.stuff binary binary";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldBeUploaded("foo.stuff")).toBeTruthy();
            expect(testable.fileShouldBeUploaded("bar.stuff")).toBeFalsy();
        });

    });
    describe("Transfer mode", () => {
        it("gives binary transfer for a single file specifying binary", () => {
            const testable = new ZosFilesAttributes("foo.binary binary binary");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("gives binary transfer when the same local and remote encodings are used", () => {
            const testable = new ZosFilesAttributes("foo.binary ISO8859-1 ISO8859-1");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("gives text transfer when different local and remote encodings are used", () => {
            const testable = new ZosFilesAttributes("foo.text ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.text")).toBe(TransferMode.TEXT);
        });

        it("gives binary transfer with a paterrn", () => {
            const testable = new ZosFilesAttributes("*.binary ISO8859-1 ISO8859-1");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
        });

        it("let last pattern determine transfer mode", () => {
            const testable = new ZosFilesAttributes("*.binary ISO8859-1 ISO8859-1\n" +
                                                    "not.binary ISO8859-1 EBCDIC");
            expect(testable.getFileTransferMode("foo.binary")).toBe(TransferMode.BINARY);
            expect(testable.getFileTransferMode("not.binary")).toBe(TransferMode.TEXT);
        });
    });

    describe.skip("Remote encoding", () => {
        it("shuld return the remote encoding", () => {
            const testable = new ZosFilesAttributes("*.ascii ISO8859-1 ISO8859-1");
            expect(testable.getRemoteEncoding("foo.ascii")).toBe("ISO8859-1");
        });
    });
});
