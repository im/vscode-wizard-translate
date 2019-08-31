function getGithubImage (name) {
    return `https://raw.githubusercontent.com/im/vscode-wizard-translate/master/images/${name}`
}

function translateLink (type, link) {
    return `[![${type}](https://raw.githubusercontent.com/im/vscode-wizard-translate/master/images/${type}.png) [${type.toLocaleUpperCase()}]](${link})`
}

function githubNameText () {
    return `[![](https://raw.githubusercontent.com/im/vscode-wizard-translate/master/images/header.png) 糖小米](https://github.com/im)`
}

module.exports =  {
    getGithubImage,
    translateLink,
    githubNameText
}