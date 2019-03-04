/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */
import {
    // makeMap,
    // isUnaryTag,
    isHtmlTag,
} from './utils';
const acorn = require('acorn')

// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being pased as HTML comment when inlined in page
const comment = /^<!\--/
const conditionalComment = /^<!\[/

let IS_REGEX_CAPTURING_BROKEN = false

const decodingMap: {[key: string]: string} = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}
const encodedAttr = /&(?:lt|gt|quot|amp);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g


// #5992
// const isIgnoreNewlineTag = makeMap('pre,textarea', true)

function decodeAttr (value: string, shouldDecodeNewlines: boolean) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, (match: string) => decodingMap[match]);
}
export default function parseHTML (html: string) {
  let selectorsList = [];
  let index = 0;

  while (html) {
    // Make sure we're not in a plaintext content element like script/style
    let textEnd = html.indexOf('<')
    if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
            const commentEnd = html.indexOf('-->')

            if (commentEnd >= 0) {
            advance(commentEnd + 3)
            continue
            }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
            const conditionalEnd = html.indexOf(']>')

            if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
            }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
            advance(doctypeMatch[0].length)
            continue
        }

        // End tag:
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
            advance(endTagMatch[0].length);
            continue;
        }

        // Start tag:
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
            let classList = handleStartTag(startTagMatch);
            if (classList && classList.length > 0) {
            selectorsList.push(classList);
            }
            continue;
        }
    }

    let rest, next;
    if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
        ) {
            // < in plain text, be forgiving and treat it as text
            next = rest.indexOf('<', 1);
            if (next < 0) break;
            textEnd += next;
            rest = html.slice(textEnd);
        }
        advance(textEnd);
    }

    if (textEnd < 0) {
        html = '';
    }
  }

  return selectorsList;

    function advance (n: number) {
        index += n
        html = html.substring(n)
    }

    function parseStartTag () {
        const start = html.match(startTagOpen);
        if (start) {
            const match: match = {
                tagName: start[1],
                attrs: [],
                start: index
            };
            advance(start[0].length);
            let end, attr;
            while (
                !(end = html.match(startTagClose)) &&
                (attr = html.match(attribute))) {
                advance(attr[0].length);
                match.attrs.push(attr);
            }
            if (end) {
                match.unarySlash = end[1];
                advance(end[0].length);
                match.end = index;
                return match;
            }
        }
    }

    function handleStartTag (match: match) {
        const tagName = match.tagName;
        // const unarySlash = match.unarySlash;

        // const unary = isUnaryTag(tagName) || !!unarySlash;
        const l = match.attrs.length
        const attrs = new Array(l)
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i]
            // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
            if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
            if (args[3] === '') { delete args[3] }
            if (args[4] === '') { delete args[4] }
            if (args[5] === '') { delete args[5] }
            }
            const value = args[3] || args[4] || args[5] || ''
            const shouldDecodeNewlines = true;
            attrs[i] = {
                name: args[1],
                value: decodeAttr(value, shouldDecodeNewlines)
            }
        }

        let selectors:Array<string> = [];
        if (isHtmlTag(tagName)) {
            selectors.push(tagName);
        }
        attrs.forEach(v => {
            if (!v.value) return;
            if (v.name === 'id') {
                selectors.push('#' + v.value);
            } else if (v.name === 'class') {
                let classList = v.value.split(' ')
                    .map((className:string) => '.' + className);
                selectors = selectors.concat(classList);
            } else if (v.name === ':class') {
                let classList = (parseClassList(v.value) || [])
                    .map((className:string) => '.' + className);
                console.log('classList', JSON.stringify(classList));
                selectors = selectors.concat(classList);
            }
        });

        return selectors;

    }
    function parseClassList(str: string) {
        let classList:Array<string> = [];
        try {
            let res = acorn.parse('c = ' + str, {
                ecmaVersion: 9
            });
            let right = res.body[0].expression.right;
            if (right.type === 'ObjectExpression') {
                right.properties.forEach((v: any) => {
                    if (v.type === 'Property') {
                        if (v.key.type === 'Identifier') {
                            classList.push(v.key.name);
                        } else if (v.key.type === 'Literal') {
                            classList.push(v.key.value);
                        }
                    }
                });
            } else if (right.type === 'ConditionalExpression') {
                if (right.consequent.type === 'Literal') {
                    classList.push(right.consequent.value + '');
                }
                if (right.alternate.type === 'Literal') {
                    classList.push(right.alternate.value + '');
                }
            }
        } catch (e) {

        }
        return classList;
    }
}

  