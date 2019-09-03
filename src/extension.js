const { env, Position, window, workspace, commands } = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient')
const path = require('path');
const { translateServerSelect } = require('./configuration');
let client = null

async function activate(context) {

    let serverModule = context.asAbsolutePath(path.join('src', 'server', 'index.js'))

    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

    let serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    }
    let userLanguage = env.language // 获取本地语言

    let clientOptions = {
        revealOutputChannelOn: 4,
        initializationOptions: {
            appRoot: env.appRoot, userLanguage
        },
        documentSelector: ['*'],
        synchronize: {
        }
    }

    client = new LanguageClient(
        'TranslateServer',
        'Translate Server',
        serverOptions,
        clientOptions
    );

    client.start();

    await client.onReady();

    client.onRequest('selectionContains', (textDocumentPosition) => {
        let editor = window.activeTextEditor;
        //有活动editor，并且打开文档与请求文档一致时处理请求
        if (editor && editor.document.uri.toString() === textDocumentPosition.textDocument.uri) {
            //类型转换
            let position = new Position(textDocumentPosition.position.line, textDocumentPosition.position.character);
            let selection = editor.selections.find((selection) => {
                return !selection.isEmpty && selection.contains(position);
            });
            if (selection) {
                return {
                    range: selection,
                    comment: editor.document.getText(selection)
                };
            }
        }
        return null
    });
    client.onRequest('hoverContains', (textDocumentPosition) => {
        let editor = window.activeTextEditor;
        //有活动editor，并且打开文档与请求文档一致时处理请求
        if (editor && editor.document.uri.toString() === textDocumentPosition.textDocument.uri) {
            //类型转换
            let position = new Position(textDocumentPosition.position.line, textDocumentPosition.position.character);
            let selection = editor.selections.find((selection) => {
                console.log('selection: ', selection.contains(position));
                return !selection.isEmpty && selection.contains(position);
            });
            console.log('selection: ', selection);
            // console.log('editor', editor.document.getText(selection));
            // if (selection) {
            //     return {
            //         range: selection,
            //         comment: editor.document.getText(selection)
            //     };
            // }
        }
        return null
    });

    context.subscriptions.push(commands.registerCommand('wizardTranslate.select', translateServerSelect));


    context.subscriptions.push(commands.registerCommand('wizardTranslate.selectReplace', translateSelectReplace));

    context.subscriptions.push(commands.registerCommand('wizardTranslate.selectReplaceFormat', translateSelectReplaceFormat));


}
exports.activate = activate;

function deactivate() {
    if (!client) {
        return undefined
    }
    return client.stop()
}

module.exports = {
    activate,
    deactivate
}

async function translateSelection(text, selection, format) {
    let translation = await client.sendRequest('translate', text, format);
    return { translation, selection };
}


async function translateSelectReplace(format) {
    let editor = window.activeTextEditor;
    if (!(editor && editor.document &&
        editor.selections.some(selection => !selection.isEmpty))) {
        return client.outputChannel.append(`No selection！\n`);
    }

    let translates =  editor.selections.filter(selection => !selection.isEmpty)
    let trans =  translates.map(selection => {
        let text = editor.document.getText(selection);
        return translateSelection(text, selection, format);
    });
    
    let decoration = window.createTextEditorDecorationType({
        color: '#FF2D00',
        backgroundColor: "transparent"
    });

    editor.setDecorations(decoration, editor.selections);

    let beginTime = Date.now();
    try {
        let results = await Promise.all(trans);
        //最少提示1秒钟
        setTimeout(() => {
            decoration.dispose();
        }, 1000 - (Date.now() - beginTime));
        editor.edit(builder => {
            results.forEach(item => {
                item.translation && builder.replace(item.selection, item.translation);
            });
        });
    } catch (e) {
        decoration.dispose();
        client.outputChannel.append(e);
    }
}

async function translateSelectReplaceFormat() {
    let format = 'hump'
    let editor = window.activeTextEditor;
    if (!(editor && editor.document &&
        editor.selections.some(selection => !selection.isEmpty))) {
        return client.outputChannel.append(`No selection！\n`);
    }

    let translates =  editor.selections.filter(selection => !selection.isEmpty)
    let trans =  translates.map(selection => {
        let text = editor.document.getText(selection);
        return translateSelection(text, selection, format);
    });
    
    let decoration = window.createTextEditorDecorationType({
        color: '#FF2D00',
        backgroundColor: "transparent"
    });

    editor.setDecorations(decoration, editor.selections);

    let beginTime = Date.now();
    try {
        let results = await Promise.all(trans);
        //最少提示1秒钟
        setTimeout(() => {
            decoration.dispose();
        }, 1000 - (Date.now() - beginTime));
        editor.edit(builder => {
            results.forEach(item => {
                item.translation && builder.replace(item.selection, item.translation);
            });
        });
    } catch (e) {
        decoration.dispose();
        client.outputChannel.append(e);
    }
}
