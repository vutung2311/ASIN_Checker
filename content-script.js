/**
 * ASIN Checker Extension
 * - Content Script
 *
 * @Copyright 2017
 */
var AsinCheckerExt = {};

AsinCheckerExt.getAsin = function () {
	var url = $(location).attr("href");
	var regex = RegExp("https://www.amazon.com/([\\w-]+/)?(dp|gp/product)/(\\w+/)?(\\w{10})");
	m = url.match(regex);
	if (m) {
		return m[4];
	}

	return $('input#ASIN').val();
}

AsinCheckerExt.initialize = function () {
	chrome.runtime.sendMessage(null, {
		api: 'GetInputs'
	}, null, function (inputs) {
		var googleSheetsID = inputs.googleSheetID;
		var sheetName = inputs.sheetName;
		var enableProductSheetScan = inputs.enableProductSheetScan;
		var productSheetID = inputs.productSheetID;
		var productSheetName = inputs.productSheetName;
		var productSheetNum = inputs.productSheetNum;
		var productSheetASINCol = inputs.productSheetASINCol;

		if (googleSheetsID == undefined || googleSheetsID == null || googleSheetsID == '') {
			console.log('No Google Sheets ID set.');
			displayNotice('No Google Sheets ID set.');
			return true;
		}

		var currentAsin = AsinCheckerExt.getAsin();
		if ((currentAsin != undefined && currentAsin != null && currentAsin != '') ||
			storefrontChecker.hasItemList() == true) {
			if (currentAsin != undefined && currentAsin != null && currentAsin != '') {
				AsinCheckerExt.injectContentScripts({
					asin: currentAsin,
					googleSheetsID: googleSheetsID,
					sheetName: sheetName,
					enableProductSheetScan: enableProductSheetScan,
					productSheetID: productSheetID,
					productSheetName: productSheetName,
					productSheetNum: productSheetNum,
					productSheetASINCol: productSheetASINCol
				});

				chrome.runtime.sendMessage(null, {
					api: 'SetInputs',
					googleSheetID: inputs.googleSheetID,
					sheetName: inputs.sheetName,
					enableProductSheetScan: false, // set this to false
					productSheetID: inputs.productSheetID,
					productSheetName: inputs.productSheetName,
					productSheetNum: inputs.productSheetNum,
					productSheetASINCol: inputs.productSheetASINCol
				}, null, function () {
					return true;
				});
			} else if (storefrontChecker.hasItemList() == true) {
				AsinCheckerExt.injectContentScripts({
					asin: '',
					googleSheetsID: googleSheetsID,
					sheetName: sheetName,
					enableProductSheetScan: null,
					productSheetID: null,
					productSheetName: null,
					productSheetNum: 0,
					productSheetASINCol: 0
				});
			}
		} else {
			console.log('No main ASIN detected on this page.');
			$('#AsinCheckerExtension-Notice').slideUp('fast');
		}
	});
}

AsinCheckerExt.injectContentScripts = function (data) {
	var head = document.getElementsByTagName('head')[0];

	// Loads the Google API
	var script = document.createElement('script');
	script.id = 'googleapi';
	script.type = 'text/javascript';
	script.async = true
	script.src = "https://apis.google.com/js/client.js";
	head.appendChild(script);

	var extensionId = chrome.runtime.id;

	script = document.createElement('script');
	script.type = 'text/javascript';
	script.text = 'var googleSheetsID = "' + data.googleSheetsID + '"; var sheetName = "' + data.sheetName + '"; var currentASIN = "' + data.asin + '"; var enableProductSheetScan = ' +
		data.enableProductSheetScan + '; var productSheetID = "' + data.productSheetID + '"; var productSheetName = "' + data.productSheetName + '"; var productSheetNum = parseInt(' +
		data.productSheetNum + '); var productSheetASINCol = parseInt(' + data.productSheetASINCol + ');';
	head.appendChild(script);

	// Loads the JQuery
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.defer = true
	script.src = 'chrome-extension://' + extensionId + '/jquery-3.3.1.min.js';
	head.appendChild(script);

	// Loads inject-script.js
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.defer = true
	script.src = 'chrome-extension://' + extensionId + '/inject-script.js';
	head.appendChild(script);

	// Loads storefront-checker.js
	script = document.createElement('script');
	script.type = 'text/javascript';
	script.defer = true
	script.src = 'chrome-extension://' + extensionId + '/storefront-checker.js';
	head.appendChild(script);
};

$(function () {
	var message = 'Loaded ASIN Checker Extension ...';
	var noticeElem = '<div id="AsinCheckerExtension-Notice" style="background-color:yellow; color:red; font-weight:bold; font-size:12px; width:486px; padding:2px 7px; text-align:left; position:fixed; top:0; right:0; z-index:9000">' + message + '</div>';
	$('body').append(noticeElem);

	AsinCheckerExt.initialize();
});

function displayNotice(message, autoclose) {
	if (typeof $ === 'undefined') {
		return
	}
	noticeElem = $('#AsinCheckerExtension-Notice');
	noticeElem.empty().html(message)
	if (typeof autoclose === 'undefined') {
		noticeElem.addClass('active')
		return;
	}

	noticeElem.removeClass('active')
	setTimeout(function () {
		if (!$('#AsinCheckerExtension-Notice').hasClass('active')) {
			$('#AsinCheckerExtension-Notice').slideUp('fast');
		}
	}, 10000);
}