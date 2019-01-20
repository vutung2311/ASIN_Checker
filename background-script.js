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
], function () {
	console.log('Settings is saved in local storage');
});

