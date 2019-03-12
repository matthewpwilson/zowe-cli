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

import { Logger, Session } from "@brightside/imperative";
import { ClientChannel } from "ssh2";
import { SshSession } from "../SshSession";
const Client = require("ssh2");

// These are needed for authenticationHandler
let authPos = 0;
const authsAllowed = ["none"];

export class Shell {
    public static executeSsh(session: SshSession, command: string, callback: any): void {
        // These are needed for authenticationHandler
        // The order is critical as this is the order of authentication that will be used.
        if(session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") {
            authsAllowed.push("publickey");
        }
        if(session.ISshSession.password != null && session.ISshSession.password !== "undefined") {
            authsAllowed.push("password");
        }
        const conn = new Client();

        conn.on("ready", () => {
            conn.shell((err: any, stream: ClientChannel) => {
                if (err) { throw err; }

                stream.on("close", () => {
                    conn.end();
                });
                // exit multiple times in case of nested shells
                stream.end(command + "\nexit\nexit\nexit\nexit\nexit\nexit\nexit\nexit\n");
                callback(stream);
            });
        });
        conn.connect({
            host: session.ISshSession.hostname,
            port: session.ISshSession.port,
            username: session.ISshSession.user,
            password: session.ISshSession.password,
            privateKey: (session.ISshSession.privateKey != null && session.ISshSession.privateKey !== "undefined") ?
                        require("fs").readFileSync(session.ISshSession.privateKey) : "",
            passphrase: session.ISshSession.keyPassphrase,
            authHandler: Shell.authenticationHandler
        });
        conn.on("error", (err: any) => {
            process.stderr.write(err +
                ". Check Zowe ssh-profile:" +
                "\n\thost: " + session.ISshSession.hostname +
                "\n\tport: " + session.ISshSession.port +
                "\n\tusername: " + session.ISshSession.user +
                "\n\tpassword: " + session.ISshSession.password +
                "\n\tprivateKey: " + session.ISshSession.privateKey +
                "\n\tpassphrase: " + session.ISshSession.keyPassphrase +
                "\n"
            );
        });
    }

    public static executeSshCwd(session: SshSession, command: string, cwd: string, callback: any): void {
        const cwdCommand = `cd ${cwd} && ${command}`;
        this.executeSsh(session, cwdCommand, callback);
    }

    /**
     * Getter for brightside logger
     * @returns {Logger}
     */
    private static get log(): Logger {
        return Logger.getAppLogger();
    }

    private static authenticationHandler(methodsLeft: string[], partialSuccess: boolean, callback: any) {
        partialSuccess = true;
        if (authPos === authsAllowed.length) {
            return false;
        }
        return authsAllowed[authPos++];
    }
}