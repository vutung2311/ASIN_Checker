/**
 * ASIN Checker Extension
 * - Background Script
 * 
 * @Author	chester@corciega.net
 */
var googleSheetID;
var sheetName = "Sheet1";
var enableProductSheetScan = false;
var productSheetID;
var productSheetName = "Sheet1";
var productSheetNum = 0;
var productSheetASINCol = 1;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	switch (message.api) {
		case 'SetInputs':
			googleSheetID = message.googleSheetID;
			sheetName = message.sheetName;
			enableProductSheetScan = message.enableProductSheetScan;
			productSheetID = message.productSheetID;
			productSheetName = message.productSheetName;
			productSheetNum = message.productSheetNum;
			productSheetASINCol = message.productSheetASINCol;

			sendResponse(true);
			break;

		case 'GetInputs':
			chrome.storage.local.get({
				'googleSheetID': googleSheetID,
				'sheetName': sheetName,
				'enableProductSheetScan': enableProductSheetScan,
				'productSheetID': productSheetID,
				'productSheetName': productSheetName,
				'productSheetNum': productSheetNum,
				'productSheetASINCol': productSheetASINCol
			}, function () {
				console.log('Saved settings to local storage');
			});

			sendResponse({
				googleSheetID: googleSheetID,
				sheetName: sheetName,
				enableProductSheetScan: enableProductSheetScan,
				productSheetID: productSheetID,
				productSheetName: productSheetName,
				productSheetNum: productSheetNum,
				productSheetASINCol: productSheetASINCol
			});
			break;
	}
});

chrome.storage.local.get([
	'googleSheetID',
	'sheetName',
	'enableProductSheetScan',
	'productSheetID',
	'productSheetName',
	'productSheetNum',
	'productSheetASINCol'
], function (result) {
	googleSheetID = result.googleSheetID;
	sheetName = result.sheetName;
	enableProductSheetScan = result.enableProductSheetScan;
	productSheetID = result.productSheetID;
	productSheetName = result.productSheetName;
	productSheetNum = result.productSheetNum;
	productSheetASINCol = result.productSheetASINCol;
	console.log('Restored settings from local storage');
});

