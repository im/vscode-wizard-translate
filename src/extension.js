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

    const disposable = context.subscriptions.push(commands.registerCommand('wizardTranslate.select', translateServerSelect));
    context.subscriptions.push(disposable);
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
