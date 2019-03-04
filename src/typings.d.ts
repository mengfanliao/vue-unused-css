
interface Selectors {
    path: string; // 文件路径
    selectors: Array<Selector>
}

interface Selector {
    lineNum: number; // 选择器处于多少行
    singleSels: Array<string>;
    selector: string; // selector信息 暂时只支持id, class, tag信息
}

// 文件样式信息
interface StyleInfo {
    path: string; // 文件路径
    codes: Array<Code>; // 样式代码列表 一个vue文件可能有多个style标签，也就有多个style内容。
}

// 样式代码信息
interface Code {
    code: string; // 代码
    startLine: number; // 代码起始行 从0开始
}

interface match  {
    tagName: string;
    attrs: Array<Array<string>>;
    start: number;
    unarySlash?: string;
    end?: number;
}

interface Config {
    dir: string;
    exclude: Array<string>;
    ignoreSelectors: Array<RegExp>;
}