
import * as minimatch from "minimatch";


/**
 * Attributes for a set of files
 */
export class ZosFilesAttributes {

    private ignoredFiles: string[];

    constructor (attributesFileContents: string) {
        this.ignoredFiles = [];
        this.parse(attributesFileContents);
    }

    public fileShouldUploaded(path: string): boolean {
        let upload = true;

        this.ignoredFiles.forEach((pattern) => {
            if (pattern.startsWith("!")) {
                pattern = pattern.substring(1);
                if (minimatch(path,pattern)) {
                    upload = true;
                }
            } else {
                if (minimatch(path,pattern)) {
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
