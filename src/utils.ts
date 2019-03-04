import * as vscode from 'vscode';
import * as path from 'path';
import config from './config';
export function isValidPath(file: vscode.Uri) {
    let basePath = path.relative(vscode.workspace.rootPath || '', file.path);
    let valid = true;
    if (config.exclude && config.exclude.length) {
        config.exclude.forEach((v: string) => {
            if (basePath.indexOf(v) !== -1) {
                valid = false;
            }
        });
    }
    return valid;
}

export function isNotInWhiteList(sel: string): boolean {
    return config.ignoreSelectors.every(v => {
        return ! v.test(sel);
    });
}