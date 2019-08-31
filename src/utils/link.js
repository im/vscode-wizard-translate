
module.exports = function (type, text) {
    let link = ''
    switch (type) {
        case 'youdao':
            link = `https://dict.youdao.com/search?q=${encodeURIComponent(text)}&keyfrom=fanyi.smartResult`
            break;
        case 'baidu':
            link = `https://fanyi.baidu.com/#en/zh/${encodeURIComponent(text)}`
            break;
        default:
            link = `https://translate.google.cn/#view=home&op=translate&sl=auto&tl=auto&text=${encodeURIComponent(text)}`
    }
    return link
}