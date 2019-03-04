import * as vscode from 'vscode';
import * as path from 'path';
import CssSelectorSearcher from './cssSelector';
import HtmlSelectorSearcher from './htmlSelector';

export default class CssNodeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> 
        = new vscode.EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> 
        = this._onDidChangeTreeData.event;
    private cssSearcher = new CssSelectorSearcher();
    private htmlSearcher = new HtmlSelectorSearcher();

    constructor() {
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
    }
    
    async handleSelect(element:any) {
        if (element.selection && element.selection[0]) {
            let treeItem = element.selection[0];
            if (treeItem.type === 'selector') {
                try {
                    await vscode.commands.executeCommand('vscode.open', 
                        vscode.Uri.file(path.join(vscode.workspace.rootPath || '', treeItem.path)));
                    if (treeItem.selectors.lineNum) {
                        let lineNum = treeItem.selectors.lineNum;
                        await vscode.commands.executeCommand('revealLine', {
                            at: 'top',
                            lineNumber: lineNum >=5 ? lineNum - 5 : 0
                        });
                        await vscode.commands.executeCommand('cursorMove', 
                        {
                            to: 'viewPortTop',
                            by: 'line',
                            value: lineNum >= 5 ? 5 : lineNum
                        });
                    }
                } catch(e) {

                }

            }
        }
        console.log(element);
    }

    getChildren(element?: TreeItem): any {
        if (element) {
            if (element.type === 'path') {
                let items = (element.selectors as Selectors).selectors.map(v => {
                    return new TreeItem('selector', v.selector, v, element.label);
                });
                return Promise.resolve(items);
            } else {
                return Promise.resolve([]);
            }
        } else {
            return this.search().then(() => {
                return new Promise((resolve, reject) => {
                    this.cssSearcher.selectors = this.cssSearcher
                        .selectors.filter(v => {
                            return v.selectors && v.selectors.length > 0;
                        });
                    let data = this.cssSearcher.selectors.map(v => {
                            return new TreeItem('path', 
                                path.relative(vscode.workspace.rootPath || '', v.path), v);
                        });
                    resolve(data);
                });
            });
        }
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
    }

    search() {
        return Promise.all([this.cssSearcher.searchCss(), this.htmlSearcher.searchVue()])
            .then(() => {
                console.log('========== search end ============');
                console.log(this.cssSearcher.selectors);
                console.log(this.htmlSearcher.selectorsList);
                let selObj:any = {};
                let selectorList = this.htmlSearcher.selectorsList.filter(v => {
                    v.forEach(sel => {
                        selObj[sel] = true;
                    });
                    return v.length > 1;
                });
                this.cssSearcher.selectors.forEach(fileCss => {
                    let selectors = fileCss.selectors.filter(selector => {
                        let inHtml = true;
                        let singleSels = selector.singleSels;
                        if (selector.singleSels.length === 1 && selObj[selector.selector]) {
                            inHtml = true;
                        } else {
                            inHtml = selectorList.some(sel => {
                                let contain = true;
                                singleSels.forEach( v => {
                                    contain = contain && sel.indexOf(v) !== -1;
                                });
                                return contain;
                            });

                        }
                        return !inHtml;
                    });
                    fileCss.selectors = selectors || [];
                    console.log(selectors);
                });
            });
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly type: string, // path or selector
        public readonly label: string,
        public readonly selectors: Selectors|Selector,
        public readonly path?: string
    ) {
        super(
            label,
            type === 'selector' ?
                vscode.TreeItemCollapsibleState.None :
                vscode.TreeItemCollapsibleState.Collapsed
        );
    }
}