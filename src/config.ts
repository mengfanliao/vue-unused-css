
import {workspace} from 'vscode';
const config = workspace.getConfiguration('vue-unused-css');
const data: Config = {
    dir: config.get('include') || '',
    exclude: config.get('exclude') || [],
    ignoreSelectors: (<Array<string>>config.get('ignore-selectors') || []).map(v => {
        return new RegExp(v);
    })
};
export default data;