# translate-api
A Node.js module for working with the Google Translation.
Automatically handles bulk translations that exceed the Google Translation API query limit.

## DEMO
http://translate.witbag.cn/

<img alt="google translate" src="https://raw.githubusercontent.com/yixianle/google-translate/master/public/demo.gif">

## Npm Module

### Install
```
  $ npm install translate-api --save
```

## Example

```javascript
  const translate = require('translate-api');

  let transUrl = 'https://nodejs.org/en/';
  translate.getPage(transUrl).then(function(htmlStr){
    console.log(htmlStr.length)
  });

  let transText = 'hello world!';
  translate.getText(transText,{to: 'zh-CN'}).then(function(text){
    console.log(text)
  });

```