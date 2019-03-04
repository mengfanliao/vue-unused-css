export const isPlainTextElement = makeMap('script,style,textarea', true)
export const no = () => false;
export function makeMap (str: string, expectsLowerCase = true) {
    const map = Object.create(null);
    const list = str.split(',');
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? (val: string) => map[val.toLowerCase()]
      : (val: string) => map[val];
}

export const isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
);

export const isHtmlTag = makeMap(
    'a,abbr,acronym,address,applet,area,article,aside,audio,b,base,basefont,bdi,bdo,' +
    'big,blockquote,body,br,button,canvas,caption,center,cite,code,col,colgroup,datalist,' +
    'dd,del,details,dfn,dialog,dir,div,dl,dt,em,embed,fieldset,figcaption,figure,font,footer,' +
    'form,frame,frameset,h1,h2,h3,h4,h5,h6,head,header,hr,html,i,iframe,img,input,ins,kbd,keygen,' +
    'label,legend,li,link,main,map,mark,menu,menuitem,meta,meter,nav,noframes,noscript,object,' +
    'ol,optgroup,option,output,p,param,picture,pre,progress,q,rp,rt,ruby,s,samp,script,section,' +
    'select,small,source,span,strike,strong,style,sub,summary,sup,table,tbody,td,textarea,tfoot,th,'
    + 'thead,time,title,tr,track,tt,u,ul,var,video,wbr'
);

export const isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
)

export const canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
);


// export function isTextTag(el) {
//     return el.tag === 'script' || el.tag === 'style'
// }

export function cached(fn: Function) {
    const cache = Object.create(null);
    return (function cachedFn (str: string) {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    })
}
  
  /**
   * Camelize a hyphen-delimited string.
   */
const camelizeRE = /-(\w)/g;
export const camelize = cached((str: string) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
});



// export function makeAttrsMap (attrs: Array) {
//     const map = {}
//     for (let i = 0, l = attrs.length; i < l; i++) {
//       if (
//         process.env.NODE_ENV !== 'production' &&
//         map[attrs[i].name] && !isIE && !isEdge
//       ) {
//         warn('duplicate attribute: ' + attrs[i].name)
//       }
//       map[attrs[i].name] = attrs[i].value
//     }
//     return map
// }

// export function createASTElement (tag, attrs, parent) {
//     return {
//         type: 1,
//         tag,
//         attrsList: attrs,
//         attrsMap: makeAttrsMap(attrs),
//         parent,
//         children: []
//     }
// }


