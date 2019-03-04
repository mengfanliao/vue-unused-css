import * as vscode from 'vscode';
import config from './config';
import parseHTML from './parser/html-parser';
import { isValidPath } from './utils';
import * as fs from 'fs';


export default class HtmlSelectorSearcher {
    public selectorsList: Array<Array<string>> = [];

    searchVue() {
        return vscode.workspace.findFiles(config.dir + '/**/*.vue', '**/node_modules/**', 500)
            .then(res => {
                res = res.filter(v => isValidPath(v));
                let psArr = res.map(file => {
                    return this.getHtmlContent(file).then(content => {
                        if (content) {
                            try {
                                let res = parseHTML(content);
                                if (res && res.length > 0) {
                                    // console.log(file.path, res);
                                    this.selectorsList = this.selectorsList.concat(res);
                                }
                            } catch(e) {
                            }
                        }
                    });
                });
                return Promise.all(psArr).then(v => {
                    this.selectorsList = this.removeSameSelector(this.selectorsList);
                    this.selectorsList.push(['html', 'body']);
                    // console.log(this.selectorsList);
                });
            });
    }

    getHtmlContent(file: vscode.Uri): Thenable<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(file.path, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    let templateStart = data.indexOf('<template>');
                    let templateEnd = data.lastIndexOf('</template>');
                    if (templateStart >= 0 && templateEnd >= 0) {
                        let content = data.slice(templateStart + 10, templateEnd).trim();
                        resolve(content);
                    } else {
                        resolve();
                    }
                }
            });
        });
        
    }

    // 简单的移除相同的selector。
    removeSameSelector(arr: Array<Array<string>>): Array<Array<string>> {
        let obj:any = {};
        let newArr: Array<Array<string>> = [];
        arr.forEach(v => {
            let key = v.sort().join('');
            if (! obj[key]) {
                newArr.push(v);
                obj[key] = true;
            }
        });
        return newArr;
    }

}