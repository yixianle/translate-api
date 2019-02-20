"use strict";

const querystring = require('querystring')

const rp = require('request-promise')
const safeEval = require('safe-eval')

const languages = require('./languages')
const token = require('./token')

const getText = (text, opts)=>{
	opts = opts || {};
	
	let e;
	[opts.from, opts.to].forEach(function (lang) {
		if (lang && !languages.isSupported(lang)) {
			e = new Error();
			e.code = 400;
			e.message = 'The language \'' + lang + '\' is not supported';
		}
	});
	if (e) {
		return new Promise(function (resolve, reject) {
			reject(e);
		});
	}

	opts.from = opts.from || 'auto';
	opts.to = opts.to || 'en';

	opts.from = languages.getCode(opts.from);
	opts.to = languages.getCode(opts.to);

	return token.get(text).then((token) => {
		//console.log(token)
		let url = 'https://translate.google.com/translate_a/single';
		let data = {
			client: 't',
			sl: opts.from,
			tl: opts.to,
			hl: opts.to,
			dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
			ie: 'UTF-8',
			oe: 'UTF-8',
			otf: 1,
			ssel: 0,
			tsel: 0,
			kc: 7
		};
		data[token.name] = token.value;
		
		let fromData = { q:text }
		url += '?' + querystring.stringify(data);
		return rp.post(url, {
			form: fromData,
			encoding: 'UTF-8'
		})
	})
	.then(res=>{
		// console.log(res.length)

		let result = {
			text: '',
			from: {
				language: {
					didYouMean: false,
					iso: ''
				},
				text: {
					autoCorrected: false,
					value: '',
					didYouMean: false
				}
			},
			raw: ''
		};

		if (opts.raw) {
			result.raw = res;
		}

		let body = safeEval(res);
		body[0].forEach(function (obj) {
			if (obj[0] !== null) {
				result.text += obj[0];
			}
		});

		if (body[2] === body[8][0][0]) {
			result.from.language.iso = body[2];
		} else {
			result.from.language.didYouMean = true;
			result.from.language.iso = body[8][0][0];
		}

		if (body[5] && body[5][0] && body[5][0][0]) {
			let str = body[5][0][0];
			str = str.replace(/<b><i>/g, '[');
			str = str.replace(/<\/i><\/b>/g, ']');

			result.from.text.value = str;

			if (body[5][0][5] === 1) {
					result.from.text.autoCorrected = true;
			} else {
					result.from.text.didYouMean = true;
			}
		}

		return result;
	})
	.catch(function (err) {
		//console.log(err)
		let e;
		e = new Error();
		if (err.statusCode !== undefined && err.statusCode !== 200) {
				e.code = 'BAD_REQUEST';
		} else {
				e.code = 'BAD_NETWORK';
		}
		throw e;
	});
}

module.exports = getText
