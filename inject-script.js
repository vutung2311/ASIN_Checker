/**
 * ASIN Checker Extension
 * - Inject Content Script
 *
 * @Author	chester@corciega.net
 */
// Client ID and API key from the Developer Console
var CLIENT_ID = '182665490182-fh7oelnmpratvjrkbrki2mirrsuaaj97.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// load after 3 seconds
keepTrying(1000, 100, handleClientLoad);

/**
 * Retry function for handling loading of Google API client
 */

function keepTrying(retryInterval, maxTries, callback) {
	console.log(maxTries + " retries left");
	if (maxTries == 0) {
		console.log("All retries ran out.")
		return;
	}
	if (typeof callback != 'function') {
		return;
	}

	if (callback()) {
		return;
	} else {
		setTimeout(function () {
			keepTrying(retryInterval, maxTries - 1, callback);
		}, retryInterval);
	}
}

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
	displayNotice("Waiting Google API client readiness.")
	if (typeof gapi == 'object' &&
		typeof gapi.load == 'function') {
		displayNotice("Google API client loaded.", true)
		gapi.load('client:auth2', initClient);
		return true;
	}
	return false;
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
	console.log('initClient() is called.');
	gapi.client.init({
		discoveryDocs: DISCOVERY_DOCS,
		clientId: CLIENT_ID,
		scope: SCOPES
	}).then(function () {
		console.log('Checking if user has already signed in to Google.');
		var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
		if (!isSignedIn) {
			console.log('You are not signed-in on Google.');
			displayNotice('Unable to access Google Spreadsheets.', true);
			if (confirm('Would you like to authorize AsinCheckerExtension to access Google Sheets?')) {
				gapi.auth2.getAuthInstance().signIn();
			}
		}
		setTimeout(function () {
			var hideNotice = true;

			storefrontChecker.task = setInterval(function () {
				storefrontChecker.init();
			}, 2000);
		}, 500);

		if (currentASIN != undefined && currentASIN != null && currentASIN != '') {
			displayNotice('Scanning ASIN=' + currentASIN + ' on your Spreadsheet ...');
			checkAsin(currentASIN, function (notice) {
				displayNotice(notice);
			}, true, false, true, currentASIN + ' is not found in your sheet');

			if (enableProductSheetScan) {
				insertColumnNextToASIN(productSheetID, productSheetNum, productSheetASINCol);
			}
		}
	});
}

var ASINDatabase;
function checkAsin(searchASIN, callback, reloadDatabase, disableHTML, blankIfNotFound, notFoundText) {
	console.log('Searching ASIN=' + searchASIN);
	var findAsin = function (asinDB) {
		if (asinDB.values.length > 0) {
			var usedDateArr = [];
			var asinArr = [];
			var colHeaders = [];
			var isFound = false;
			var notices = [];
			var noticeIndx = 0;

			for (var i = 0; i < asinDB.values.length; i++) {
				var row = asinDB.values[i];

				for (var j = 0; j < row.length; j++) {
					var celVal = row[j];

					if (i == 0) {
						colHeaders[j] = celVal;
						continue;
					}
					var isDate = new Date(celVal).toString() != 'Invalid Date' ? true : false;
					if (isDate == true) {
						usedDateArr[j] = celVal;
					}

					asinArr[j] = getAsin(celVal);
					if (usedDateArr[j] != undefined && asinArr[j] != '' && asinArr[j] == searchASIN) {
						var notice = asinArr[j] + ' was used on <u>' + usedDateArr[j] + '</u> found on <u> ' + colHeaders[j] + '</u>.';
						if (disableHTML != undefined && disableHTML == true) {
							notice = usedDateArr[j] + ' - ' + colHeaders[j];
						}

						notices[noticeIndx] = notice;
						noticeIndx++;
					}
				}
			}

			if (notices.length > 0) {
				var notice = '';
				for (var n = 0; n < notices.length; n++) {
					notice += notice == '' ? notices[n] : (disableHTML == true ? "\n" : '<br>') + notices[n];
				}

				callback(notice);
				return true;
			}

			console.log('Unable to find ASIN=' + searchASIN);
			if (blankIfNotFound != undefined && blankIfNotFound == true) {
				callback(notFoundText);
				return true;
			}

			callback('Unable to find ASIN=' + searchASIN + ' on Spreadsheet', true);
		} else {
			console.log('No ASIN used data found.');
			if (blankIfNotFound != undefined && blankIfNotFound == true) {
				callback(notFoundText);
				return true;
			}

			callback('No ASIN used data found.', true);
		}
	};

	if (reloadDatabase == undefined || reloadDatabase == true) {
		console.log('Scanning ASIN Database SheetId=' + googleSheetsID);
		gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: googleSheetsID,
			range: sheetName + "!A1:J"
		}).then(function (response) {
			ASINDatabase = response.result;
			findAsin(ASINDatabase);
		}, function (response) {
			console.log('Error: ' + response.result.error.message);
			callback('Error: ' + response.result.error.message, true);
		});
	} else if (reloadDatabase == false && ASINDatabase != undefined) {
		findAsin(ASINDatabase);
	}
}

function insertColumnNextToASIN() {
	console.log('Inserting column next to ASIN column.');
	try {
		var batchUpdateRequest = {
			requests: [{
				"insertDimension": {
					"range": {
						"sheetId": productSheetNum,
						"dimension": "COLUMNS",
						"startIndex": productSheetASINCol,
						"endIndex": productSheetASINCol + 1
					},
					"inheritFromBefore": true
				}
			}]
		};

		var displayError = setTimeout(function () {
			alert('Unable to create new column next to ASIN.');
		}, 5000);

		gapi.client.sheets.spreadsheets.batchUpdate({
			spreadsheetId: productSheetID,
			resource: batchUpdateRequest
		}).then((response) => {
			clearTimeout(displayError);
			var result = response.result;

			// scan product spreadsheet
			scanProductSpreadsheet();
		});
	} catch (e) {
		alert(e);
	}
}

function scanProductSpreadsheet() {
	var startRow = 2;
	var ASINColumn = toColumnName(productSheetASINCol);
	var resultColumn = toColumnName(productSheetASINCol + 1);

	console.log('Scanning Product Spreadsheet id=' + productSheetID + ' sheetName=' + productSheetName + ' ASINColumn=' + productSheetASINCol);
	gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: productSheetID,
		range: productSheetName + "!" + ASINColumn + startRow + ":" + ASINColumn
	}).then(function (response) {
		var range = response.result;
		if (range.values.length <= 0) {
			return;
		}
		var data = [];

		for (var i = 0; i < range.values.length; i++) {
			var row = range.values[i];

			for (var j = 0; j < row.length; j++) {
				var celVal = row[j];
				var asin = getAsin(celVal);
				if (asin != undefined && asin != '') {
					checkAsin(asin, function (notice) {
						if (notice != '') {
							data.push({
								range: productSheetName + "!" + resultColumn + (startRow + i),
								values: [[notice]]
							});
						}
					}, false, true, true, 'Not found in your sheet');
				}
			}
		}

		if (data.length <= 0) {
			return;
		}

		console.log('data=' + data);
		console.log('Updating product spreadsheet.');
		var body = {
			data: data,
			valueInputOption: 'RAW'
		};
		gapi.client.sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: productSheetID,
			resource: body
		}).then((response) => {
			var result = response.result;
			console.log(result);
		});
	});
}

/**
 * Gets the ASIN value
 */
function getAsin(celVal) {
	if (celVal == undefined || celVal == null || celVal == '') {
		return '';
	}

	celVal = celVal.trim();
	var asin = '';

	if (celVal.length == 10) {
		return celVal.toUpperCase();
	}
	celVal = celVal.toUpperCase();
	if (celVal.indexOf('AMZN.COM') > 0) {
		asin = celVal.substring(celVal.indexOf('AMZN.COM') + 9, celVal.indexOf('AMZN.COM') + 19);
	}

	if (celVal.indexOf('AMAZON.COM') > 0 && celVal.indexOf('/DP') > 0) {
		var regex = RegExp("HTTPS://WWW.AMAZON.COM/([\\w-]+/)?(DP|GP/PRODUCT)/(\\w+/)?(\\w{10})");
		var match = celVal.match(regex);
		if (match) {
			asin = match[4];
		}
	}

	return asin;
}

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
/**
 * Takes a positive integer and returns the corresponding column name.
 * @param {number} num  The positive integer to convert to a column name.
 * @return {string}  The column name.
 * http://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
 */
function toColumnName(num) {
	for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
		ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
	}
	return ret;
}