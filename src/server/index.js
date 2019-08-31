const { TextDocuments, createConnection, ProposedFeatures, DidChangeConfigurationNotification } = require('vscode-languageserver')
const Translate = require('../main')
let connection = createConnection(ProposedFeatures.all)
let documents = new TextDocuments()
let translate = null 
let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false

connection.onInitialize((params) => {
    let capabilities = params.capabilities
    translate = new Translate(documents, connection)
    hasConfigurationCapability =
        capabilities.workspace && !!capabilities.workspace.configuration
	hasWorkspaceFolderCapability =
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
    return {
		capabilities: {
			hoverProvider: true,
			textDocumentSync: documents.syncKind
		} 
	}
})

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		)
    }
    
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.')
		})
	}

	let setting = await connection.workspace.getConfiguration('wizardTranslate')
	translate.setSettings(setting)
})

connection.onDidChangeConfiguration(async () => {
    let setting = await connection.workspace.getConfiguration('wizardTranslate')
    translate.setSettings(setting)
})


connection.onHover(async (textDocumentPosition) => {
    let hover = await translate.getText(textDocumentPosition)
	return hover
})

documents.listen(connection)
connection.listen()