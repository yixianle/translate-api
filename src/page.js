"use strict";

const queryString = require('querystring')
const url = require('url')
const rp = require('request-promise')
const cheerio = require('cheerio')

const {translateGoogle, userAgent} = require('./config')

// 翻译网页
const getPage = (targetUrl)=>{
  console.log(targetUrl,"---------- translate begin ----------")
  let parameter ={
    sl: 'en',
    tl: 'zh-CN',
    js: 'y',
    prev: '_t',
    hl: 'zh-CN',
    ie: 'UTF-8',
    u: targetUrl,
    'edit-text': '',
    act: 'url' 
  }
  let firstUrl = translateGoogle + queryString.stringify(parameter)
  

  //console.log(firstUrl,"---translate begin ----")
  return rp(firstUrl).then(function (htmlString) {
    let $ = cheerio.load(htmlString)
    let translateUrl = $('body iframe[name="c"]').attr('src')
    return rp(translateUrl)
  }).then(function(htmlString){
    let $ = cheerio.load(htmlString)
    let redirectUrl = $('head meta[http-equiv="refresh"]').attr('content')
    redirectUrl = redirectUrl.match(/(URL)\=(https\:\/\/.*)/)[2]
    let options = {
      uri: redirectUrl,
      encoding: 'UTF-8',
      headers: {
          'User-Agent': userAgent
      }
    }
    return Promise.all([rp(targetUrl), rp(options)])
    //return rp(options)
  }).then(function(htmlStrings){
    console.log("---------- translate end ----------")
    return removeTranslateMark(htmlStrings)
  })
  
}

// 移除翻译添加的元素
const removeTranslateMark = (parm) => {
  let originHtml,translateHtml;
  if(parm.length>1){
    originHtml=parm[0]
    translateHtml=parm[1]
  }
  let $ = cheerio.load(translateHtml)
  let headLength,$head,$body;
  headLength = cheerio.load(originHtml)('head').children().length
  
  $head = $('head').children()
  $head.filter((index,item)=> {
    return index<($head.length-headLength) && item.tagName!=="base" && item.tagName!=="BASE"
  }).remove()
  $('iframe').first().remove()
  $('body').first().nextAll().remove()

  let $notranslate = $('body span.notranslate')
  $notranslate.children('a').each(function(index,item){
    let $item = $(item)
    let href = $item.attr("href")
    href = href && queryString.parse(url.parse(href).query).u
    $item.attr("href",href)
  })
  $notranslate.children('span.google-src-text').remove()
  $notranslate.removeAttr('onmouseover').removeAttr("onmouseout").removeClass("notranslate")
  
  return $.html()
}

module.exports = getPage
