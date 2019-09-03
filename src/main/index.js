const humanizeString = require('humanize-string')
const { google, youdao, baidu } = require('translation-api')
const { translateLink } = require('../utils/github')
const changeCase = require('change-case')
const getLink = require('../utils/link')

function Translate(documents, connection) {
    this._connection = connection
    this._documents = documents
}

Translate.prototype.setSettings = async function (setting) {
    this._settings = setting
    this._settings.translateServes = setting.translateServes || 'google'
    global.translateProxyUrl = setting.proxy || ''
}

Translate.prototype.servers = function (translateServes) {
    let s = null
    switch (translateServes) {
        case 'youdao':
            s = youdao
            break;
        case 'baidu':
            s = baidu
            break;
        default:
            s = google
    }
    return s
}

Translate.prototype.replaceText = async function (text, format) {
    const res = await this.servers(this._settings.translateServes).translate(humanizeString(text))
    let result = res.result ? res.result[0] : ''
    if (format === 'hump' && res.from === 'zh-CN') {
        result = changeCase.camelCase(result)
    }
    console.log('result: ', result);
    return result
}

Translate.prototype.getText = async function (textDocumentPosition) {
    let block = await this.getSelectionContainPosition(textDocumentPosition)
    const translateServes = this._settings.translateServes
    if (block) {
        const humanize = humanizeString(block.comment)
        let targetLanguageComment = null
        let contents = []
        try {
            targetLanguageComment = await this.servers(translateServes).translate(humanize)
        } catch (e) {
            console.log(e)
        }
        if (targetLanguageComment) {
            contents.push(`${translateLink(translateServes, targetLanguageComment.link)}`)
            contents.push(`${humanize} => `)
            contents.push(`${targetLanguageComment.result}`)
            contents.push(' ')
        } else {
            contents.push(`翻译失败啦！~~~ ${translateLink(translateServes, getLink(translateServes, humanize))}`)
        }
        return {
            contents: contents,
            range: block.range
        }
    }

    return null
}


Translate.prototype.getSelectionContainPosition = async function (textDocumentPosition) {
    let block = await this._connection.sendRequest('selectionContains', textDocumentPosition)
    return block
}

Translate.prototype.getHoverContainPosition = async function (textDocumentPosition) {
    let textDocument = this._documents.get(textDocumentPosition.textDocument.uri);
    if (!textDocument) return null;
    const reg = /\\|\/|\?|\？|\*|\"|\“|\”|\'|\‘|\’|\<|\>|\{|\}|\[|\]|\【|\】|\：|\:|\、|\^|\$|\!|\~|\`|\|/g;
    const model = textDocument.getText().split('\n')
    const line = textDocumentPosition.position.line
    const lineText = model[line].split('').replate
    console.log('lineText: ', lineText.length);
    const character = textDocumentPosition.position.character
    console.log('character: ', character);

    let start = 0
    let end = character
    let startIndex = true

    // while (startIndex) {
    //     if (!reg.test(lineText[start--])){
    //         startIndex = false
    //     }
    // }
    // console.log(start)
    for (let i = character; i < lineText.length; i++) {
        end = i
        if (!reg.test(lineText[i])) break;
    }
    console.log('end: ', end);
    // // for (let i = character + 1; i < lineText.length; i--) {
    // //     start = i
    // //     if (!reg.test(lineText[i])) break;
    // // }

    console.log('line: ', model[line].substring(start, end));

    // let block = await this._connection.sendRequest('hoverContains', textDocumentPosition)
    // return block
}



module.exports = Translate