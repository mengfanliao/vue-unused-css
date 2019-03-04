import * as vscode from 'vscode';
import * as fs from 'fs';
import config from './config';
const parser = require('postcss-scss');
import { isValidPath, isNotInWhiteList } from './utils';


export default class CssSelectorSearcher {
    private styleStartTag: RegExp = /^\s*<style.*>.*$/;
    private styleEndTag: RegExp = /^\s*<\/style.*>.*$/;
    public selectors: Array<Selectors> = [];

    searchCss() {
        console.log('============= start search================\n' + Date.now());
        return vscode.workspace.findFiles(config.dir + '/**/*.{scss,css,vue}', '**/node_modules/**', 500)
            .then(res => {
                res = res.filter(v => isValidPath(v));
                let psArr = res.map(file => {
                    let ps;
                    if (file.path.endsWith('vue')) {
                        // vue file, need to resolve css
                        ps = this.getCssFromVueFile(file);
                    } else {
                        // css file
                        ps = this.getCssFromCssFile(file);
                    }
                    return ps.then(res => {
                        return this.parseCss(res).then(selector => {
                            this.selectors.push(selector);
                            return Promise.resolve(1);
                        });
                    });
                });
                return Promise.all(psArr).then(v => {
                    console.log('============= end search================\n' + Date.now());
                }, () => {
                });
            });
    }

    getCssFromCssFile(file: vscode.Uri): Thenable<StyleInfo> {
        return new Promise((resolve, reject) => {
            fs.readFile(file.path, 'utf8', (err, data) => {
                if (!err && data) {
                    resolve({
                        path: file.path,
                        codes: [
                            {
                                code: data,
                                startLine: 0
                            }
                        ]
                    });
                }
                reject();
            });
        });
    }

    // 从vue文件中读取css部分
    getCssFromVueFile(file: vscode.Uri):Thenable<StyleInfo> {
        return new Promise((resolve, reject) => {
            let curStyleObj: StyleInfo = {
                path: file.path,
                codes: []
            };
            vscode.workspace.openTextDocument(file).then(document => {
                let content = '';
                let isInStyle = false;
                let startLine = -1;
                for(let i = 0; i < document.lineCount; i++) {
                    let text = document.lineAt(i).text;
                    if (isInStyle) {
                        // 当前内容是在style标签里面
                        if (this.styleEndTag.test(text)) {
                            curStyleObj.codes.push({
                                code: content,
                                startLine
                            });
                            content = '';
                            isInStyle = false;
                        } else {
                            content += document.lineAt(i).text + '\n';
                        }
                    } else if (this.styleStartTag.test(text)){
                        // 当前行是style标签开始部分
                        isInStyle = true;
                        startLine = i + 1;
                    }
                }
                if (curStyleObj.codes.length > 0) {
                    resolve(curStyleObj);
                } else {
                    reject();
                }
            }, () => {
                reject();
            });
        });
    }

    /* 
        将code转化为selector列表，以文件的方式进行聚合
    */ 
    parseCss(style: StyleInfo): Thenable<Selectors> {
        return new Promise((resolve, reject) => {
            if (style.path && style.codes.length > 0) {
                // 有效style
                let selectors:Array<Selector> = [];
                style.codes.forEach(v => {
                    if (v.code) {
                        // style code解析
                        let res = this.getSelectorArr(v);
                        if (res && res.length > 0) {
                            // 按lineNum排序
                            res.sort((a, b) => {
                                return Number(a.lineNum > b.lineNum);
                            });
                            selectors = selectors.concat(res || []);
                            
                        }
                    }
                });
                if (selectors.length > 0) {
                    resolve({
                        path: style.path,
                        selectors
                    });
                } else {
                    reject();
                }
            } else {
                reject();
            }
        });
    }

    getSelectorArr(code: Code): Array<Selector> {
        let arr: Array<Selector> = [];
        let res = parser.parse(code.code);
        let nodes = [res];
        while(nodes.length > 0) {
            let node = nodes.shift();
            if (node.nodes) {
                nodes = nodes.concat(node.nodes);
            }
            if (node.type === 'rule') {
                // rule类型
                
                let startLine = code.startLine + node.source.start.line;
                // 多行选择器切分成单行
                let lineCodes:Array<string> = node.selector.split('\n');
                lineCodes.forEach((lineCode, index) => {
                    let selectorArr = this.splitSelector(lineCode, startLine + index);
                    arr = arr.concat(selectorArr);
                });
            }
        }
        return arr;
    }

    splitSelector(line: string, lineNum: number): Array<Selector> {
        let arr: Array<Selector> = [];
        let selectorArr = line.split(',');
        selectorArr.forEach(sel => {
            if (!sel) { return; }
            // 移除伪类和伪元素选择器
            sel = sel.replace(/:+[a-zA-Z-]+(\([^)]+\))?/g, '');
            // 移除属性选择器
            sel = sel.replace(/\[[^\]]*\]/g, '');
            // 移除& + ~ >等修饰符
            sel = sel.replace(/[&+~>*]/g, ' ');
            sel = sel.trim();
            if (!sel) { return; }
            // 将选择器分割开来
            let selUnits = sel.split(/ +/);
            selUnits.forEach(unit => {
                if (/^[.a-zA-Z0-9#_-]+$/.test(unit)) {
                    let res = (unit.match(/(\.|#)?[a-zA-Z0-9_-]+/g) || [])
                        .filter(v => v && isNotInWhiteList(v));
                    if (res.length > 0) {
                        arr.push({
                            lineNum,
                            selector: unit,
                            singleSels: res
                        });
                    }
                } else {
                    // 例如app#{$hello}语法
                    console.error('无法解析', unit, sel);
                }
            });
        });

        return arr;
    }
}