jQuery.fn.selectText = function(){
    var doc = document
        , element = this[0]
        , range, selection
    ;
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

var currentTags = {};
var allTags = {};
var seperator = sepTab(1);

function sepTab(times) {
	var retVal = "";
	for (var i = 0; i < times; i++) {
		retVal += "	";
	}
	return retVal;
}

function sepSpace(times) {
	var retVal = "";
	for (var i = 0; i < times; i++) {
		retVal += " ";
	}
	return retVal;
}

function encodeHtml(html) {
	var output = html;
	output = output.replace(/</g, "&lt;");
	output = output.replace(/>/g, "&gt;");
	return output;
}

function initCode() {
	var contents = encodeHtml("<!DOCTYPE html>");
	contents += "<br>" + encodeHtml("<html>");
	
	var headTags = [];
	var bodyTags = [];
	
	$.each(currentTags, function(key, currTag) {
		if (currTag.section == "head") {
			headTags.push(currTag);
		}
		else {
			bodyTags.push(currTag);
		}
	});
	
	contents += "<br>" + seperator + encodeHtml("<head>");
	contents += addTagToDom(headTags);
	contents += "<br>" + seperator + encodeHtml("</head>") + "<br>";
	
	contents += "<br>" + seperator + encodeHtml("<body>");
	contents += addTagToDom(bodyTags);
	contents += "<br>" + seperator + encodeHtml("</body>");
	
	contents += "<br>" + encodeHtml("</html>");
	
	$("#code").html(contents);
	$("#code").removeClass("prettyprinted");
	prettyPrint();	
}

function addTagToDom(tags) {
	var retVal = "";
	
	tags.sort(function(a, b) {
		return a.position - b.position;
	});
	
	for (var i = 0; i < tags.length; i++) {
		retVal += "<br>" + seperator + seperator + encodeHtml(tags[i].html);
	}
	
	return retVal;
}

function initCookie() {
	if ($.cookie("hb_currentTags")) {
		currentTags = JSON.parse($.cookie("hb_currentTags"));
	}
	if ($.cookie("hb_seperator")) {
		seperator = JSON.parse($.cookie("hb_seperator"));
	}
	
	$.each(currentTags, function(key, currTag) {
		$(".tag-checkbox#" + currTag.id).prop("checked", true);
	});
}

$.ajax({
	url: "./data/tags.json",
	type: "GET",
	dataType: "json",
	success: function(data) {
		$("#tag-menu").empty();
		
		$.each(data, function(key, currTagArea) {
			$("#tag-menu").append(
				"<li id='" + currTagArea.id + "' class='collection-item'>" +
					"<span class='title " + currTagArea.color + "-text'>" + currTagArea.title + "</span>" +
					"<form class='tag-form'></form>" +
				"</li>"
			);
			
			$.each(currTagArea.tags, function(key, currTag) {
				allTags[currTag.id] = currTag;
				
				$("#" + currTagArea.id).find(".tag-form").append(
					"<p>" +
						"<input class='tag-checkbox' id='" + currTag.id + "' type='checkbox'>" +
						"<label for='" + currTag.id + "'>" + currTag.title + "</label>" +
					"</p>"
				);
			});
		});
		
		$(".tag-checkbox").change(function() {
			if ($(this).is(":checked")) {
				// wurde aktiviert
				currentTags[$(this).attr("id")] = allTags[$(this).attr("id")];
			}
			else {
				delete currentTags[$(this).attr("id")];
			}
			
			initCode();
		});
		
		initCookie();
		initCode();
	}
});

$(document).ready(function() {
	$("#btn-reset-code").click(function() {
		currentTags = {};
		initCode();
		$.removeCookie("hb_currentTags");
		$.removeCookie("hb_seperator");
		$(".tag-checkbox").prop("checked", false);
	});
	
	$("#btn-save-as-cookie").click(function() {
		$.cookie("hb_currentTags", JSON.stringify(currentTags), {expires: 365});
		$.cookie("hb_seperator", JSON.stringify(seperator), {expires: 365});
		
		var saveCodeBtn = $(this);
		saveCodeBtn.addClass("green");
		saveCodeBtn.find("i").removeClass("mdi-content-save");
		saveCodeBtn.find("i").addClass("mdi-action-done");
	
		setTimeout(function() {
			saveCodeBtn.removeClass("green");
			saveCodeBtn.find("i").removeClass("mdi-action-done");
			saveCodeBtn.find("i").addClass("mdi-content-save");
		}, 3000);		
	});
	
	$("#code").dblclick(function() {
		$(this).selectText();	
	});
	$("#btn-select-code").click(function() {
		$("#code").selectText();	
	});
	
	$("#seperator-dropdown a").click(function() {
		if ($(this).attr("data-value") == "tabs") {
			seperator = sepTab(1);
		}
		else {
			seperator = sepSpace(2);
		}
		initCode();
	});
	
	$(".version").text($("html").data("version"));
});