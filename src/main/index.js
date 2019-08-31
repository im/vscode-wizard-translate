const humanizeString = require('humanize-string')
const { google, youdao, baidu } = require('translation-api')
const getLink = require('../utils/link')
const { translateLink } = require('../utils/github')

function Translate(documents, connection) {
    this._connection = connection
    this._documents = documents
}

Translate.prototype.setSettings = async function (setting) {
    this._settings = setting
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

Translate.prototype.getText = async function (textDocumentPosition) {
    let block = await this.getSelectionContainPosition(textDocumentPosition)
    let translateServes = this._settings.translateServes || 'google'
    global.translateProxyUrl = this._settings.proxy || ''
    if (block) {
        const humanize = humanizeString(block.comment)
        let targetLanguageComment = null
        let contents = []
        try {
            console.log('translateServes: ', translateServes);
            targetLanguageComment = await this.servers(translateServes).translate(humanize)
        } catch (e) {
            console.log(e)
        }
        if (targetLanguageComment) {
            contents.push(`${translateLink(translateServes, targetLanguageComment.link)}`)
            contents.push(`${block.comment} => ${targetLanguageComment.result}`)
            contents.push(' ')
        } else {
            contents.push(`${translateLink(translateServes, getLink(translateServes, humanize))}`)
            contents.push('翻译失败啦！~~~')
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



module.exports = Translate