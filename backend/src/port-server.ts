import net from "net";
import fs from "fs/promises";
import os from "os";
import path from "path";

export interface FindPortOptions {
    host?: string; // Default 127.0.0.1
    portStart?: number; // Default 3500
    portEnd?: number; // Default 3600
}

/**
 * Scans the given port range and returns the first available port.
 * Does not start any server
 */
export async function findFreePort(
    options: FindPortOptions = {}
): Promise<{ port: number; host: string }> {
    const host = options.host ?? "127.0.0.1";
    const portStart = options.portStart ?? 3500;
    const portEnd = options.portEnd ?? 3600;

    if (portStart > portEnd) {
        throw new Error("portStart must be <= portEnd");
    }

    function checkPort(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const tester = net
                .createServer()
                .once("error", () => resolve(false))
                .once("listening", () => {
                    tester.close();
                    resolve(true);
                })
                .listen(port, host);
        });
    }

    for (let port = portStart; port <= portEnd; port++) {
        const available = await checkPort(port);
        if (available) {
            let filePath: string | undefined = undefined;

            return { port, host };
        }
    }

    throw new Error(`No free port found in range ${portStart}-${portEnd}`);
}
