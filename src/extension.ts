'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import CssNodeProvider from './unusedCss';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    let provider = new CssNodeProvider();
    console.log('Congratulations, your extension "vue-unused-css" is now active!');
    vscode.window.registerTreeDataProvider('cssSelector', provider);
    let treeView = vscode.window.createTreeView('cssSelector', {
        treeDataProvider: provider
    });

    let subscriptions:any = [];

    treeView.onDidChangeSelection( provider.handleSelect, provider, subscriptions);

    vscode.commands.registerCommand('cssSelector.refresh', provider.search.bind(provider));
    // context.subscriptions.push();
}

// this method is called when your extension is deactivated
export function deactivate() {
}