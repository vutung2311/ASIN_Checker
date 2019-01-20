/**
 * ASIN Checker Extension
 * - Content Script
 * 
 * @Author	chester@corciega.net
 */
var StorefrontChecker = (function () {
	function StorefrontChecker() {
		console.log('StorefrontChecker Class is instantiated.')
		this.task = null;
	}

	StorefrontChecker.prototype.hasItemList = function () {
		var itemList = $('#atfResults li.s-result-item');
		if (itemList.length > 0) {
			return true;
		}
		return false;
	};

	StorefrontChecker.prototype.init = function () {
		var itemList = $('#atfResults li.s-result-item');
		if (itemList.length > 0) {
			this.injectToItem(itemList);
		} else {
			if (this.task != null) {
				clearInterval(this.task);
			}
		}
	};

	StorefrontChecker.prototype.injectToItem = function (itemList) {
		var reloadASINDB = true;
		var asins = [];

		itemList.each(function () {
			var $this = $(this);
			if (!$this.hasClass('asin-checker-extension')) {
				$this.addClass('asin-checker-extension');
				var asin = $this.attr('data-asin');
				var itemTitleLink = $('a.s-access-detail-page', $this);
				itemTitleLink.before('<div class="a-row a-spacing-mini ACE-loader" data-asin="' + asin + '" style="background-color:yellow; color:red; font-weight:bold; font-size:12px; padding:3px 7px; text-align:left;">Checking ASIN ' + asin + '...</div>')
				asins.push(asin);
			}
		});

		if (typeof checkAsin === 'function' && asins.length > 0) {
			checkAsin(asins[0], function (notice) {
				if (notice.indexOf('not found') > -1) {
					$('div.ACE-loader[data-asin="' + asins[0] + '"]')
						.css({
							'background-color': '#d4edda',
							'color': '#000'
						})
						.empty().html(notice);
				} else {
					$('div.ACE-loader[data-asin="' + asins[0] + '"]').empty().html(notice);
				}

				// load the rest
				for (var i = 1; i < asins.length; i++) {
					checkAsin(asins[i], function (notice) {
						if (notice.indexOf('not found') > -1) {
							$('div.ACE-loader[data-asin="' + asins[i] + '"]')
								.css({
									'background-color': '#d4edda',
									'color': '#000'
								})
								.empty().html(notice);
						} else {
							$('div.ACE-loader[data-asin="' + asins[i] + '"]').empty().html(notice);
						}
					}, false, false, true, asins[i] + ' not found in your sheet');
				}
			}, true, false, true, asins[0] + ' not found in your sheet');
		}
	};

	return StorefrontChecker;
})();

var storefrontChecker = new StorefrontChecker();