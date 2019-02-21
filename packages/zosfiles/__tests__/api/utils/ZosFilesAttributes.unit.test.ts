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


import { ZosFilesAttributes } from "../../../src/api/utils/ZosFilesAttributes";


describe("ZosFilesAttributes", () => {
    describe("Ignoring", () => {
        it("does not ignore files not mentioned in .zosattributes", () => {
            const testable = new ZosFilesAttributes("");
            expect(testable.fileShouldUploaded("foo.stuff")).toBeTruthy();
        });

        it("does not ignore files marked with an encoding", () => {
            const attributesFileContents = "foo.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeTruthy();
        });

        it("ignores a single file marked with -", () => {
            const attributesFileContents = "foo.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeFalsy();
        });

        it("ignores a file marked with - and not a file marked with an encoding", () => {
            const attributesFileContents = "foo.stuff -\nbar.stuff ISO8859-1 ISO8859-1";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldUploaded("bar.stuff")).toBeTruthy();

        });

        it("ignores files matched by a *", () => {
            const attributesFileContents = "*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldUploaded("bar.stuff")).toBeFalsy();
        });

        it("ignores files matched files when there are multiple patterns", () => {
            const attributesFileContents = "*.stuff -\n*.bin -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeFalsy();
            expect(testable.fileShouldUploaded("bar.bin")).toBeFalsy();
        });

        it("does not ignore files matched by negated patterns", () => {
            const attributesFileContents = "!*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeTruthy();
        });

        it("ignores files according to the most specific pattern", () => {
            const attributesFileContents = "*.stuff -\n!foo.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeTruthy();
            expect(testable.fileShouldUploaded("bar.stuff")).toBeFalsy();
        });

        it("ignores files according to the most specific pattern, regardless of order", () => {
            const attributesFileContents = "!foo.stuff -\n*.stuff -";
            const testable = new ZosFilesAttributes(attributesFileContents);
            expect(testable.fileShouldUploaded("foo.stuff")).toBeTruthy();
            expect(testable.fileShouldUploaded("bar.stuff")).toBeFalsy();
        });
    });
});
