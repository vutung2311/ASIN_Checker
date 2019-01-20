/**
 * ASIN Checker Extension
 * - Popup Script
 * 
 * @Author	chester@corciega.net
 */
$(function () {
	chrome.runtime.sendMessage(null, {
		api: 'GetInputs'
	}, null, function (inputs) {
		console.log(inputs);
		$('#txtGoogleSheetID').val(inputs.googleSheetID);
		$('#txtSheetName').val(inputs.sheetName);
		if (inputs.enableProductSheetScan == true) {
			$('#chkEnableProductSheetScan').attr('checked', 'checked');
			$('#chkEnableProductSheetScan').closest('div.box').addClass('active');
		}
		$('#txtProductSheetID').val(inputs.productSheetID);
		$('#txtProductSheetName').val(inputs.productSheetName);
		$('#txtProductSheetNum').val(inputs.productSheetNum);
		$('#txtProductSheetASINCol').val(inputs.productSheetASINCol);
	});

	$('#chkEnableProductSheetScan').on('click', function () {
		if ($(this).is(':checked')) {
			$(this).closest('div.box').addClass('active');
		} else {
			$(this).closest('div.box').removeClass('active');
		}
	});

	$('#btnSaveConfiguration').on('click', function () {
		var googleSheetID = $('#txtGoogleSheetID').val();
		var sheetName = $('#txtSheetName').val();
		var enableProductSheetScan = $('#chkEnableProductSheetScan').is(':checked');
		var productSheetID = $('#txtProductSheetID').val();
		var productSheetName = $('#txtProductSheetName').val();
		var productSheetNum = $('#txtProductSheetNum').val();
		var productSheetASINCol = $('#txtProductSheetASINCol').val();

		// validations
		var missingFields = [];
		if (googleSheetID.trim() == '') {
			missingFields.push('ASINs data Spreadsheet ID');
		}
		if (sheetName.trim() == '') {
			missingFields.push('ASINs data sheet name');
		}
		if (enableProductSheetScan == true && productSheetID.trim() == '') {
			missingFields.push('Sheets with ASINS to check ID');
		}
		if (enableProductSheetScan == true && productSheetName.trim() == '') {
			missingFields.push('Sheets with ASINS to check name');
		}
		if (enableProductSheetScan == true && productSheetNum.trim() == '') {
			missingFields.push('Sheet GID number');
		}
		if (missingFields.length > 0) {
			var error = "The following required field/s is missing:";
			for (var i = 0; i < missingFields.length; i++) {
				error += "\n" + missingFields[i];
			}

			alert(error);
			return true;
		}

		chrome.runtime.sendMessage(null, {
			api: 'SetInputs',
			googleSheetID: googleSheetID,
			sheetName: sheetName,
			enableProductSheetScan: enableProductSheetScan,
			productSheetID: productSheetID,
			productSheetName: productSheetName,
			productSheetNum: productSheetNum,
			productSheetASINCol: productSheetASINCol
		}, null, function (response) {
			if (response == true) {
				alert('Configuration saved.');
			}
		});
	});
});