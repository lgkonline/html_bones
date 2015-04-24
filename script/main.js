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

var globalData;

function getTagsDataById(id, gettingValue) {
	var section;
	var position;
	
	$.each(globalData, function(areaKey, areaValue) {
		$.each(areaValue.tags, function(key, value) {
			// tags array
			if (value.id === id) {
				// Treffer
				section = value.section;
				position = value.position;
			}	
		});
	});	
	
	if (gettingValue === "section") {
		return section;
	}
	
	if (gettingValue === "position") {
		return position;
	}
}

function encodeHtml(html) {
	var output = html;
	output = output.replace(/</g, "&lt;");
	output = output.replace(/>/g, "&gt;");
	return output;
}

function decodeHtml(html) {
	var output = html;
	output = output.replace(/&lt;/g, "<");
	output = output.replace(/&gt;/g, ">");
	return output;
}

function insertDataIdInHtml(html, id) {
	if (html.indexOf("script") > -1) {
		var htmlSplitted = html.split(">");
		
		for (var i = 0; i < htmlSplitted.length; i++) {
			var otherSplitted = htmlSplitted[i].split(" ");
			for (var j = 0; j < otherSplitted.length; j++) {
				if (otherSplitted[j].indexOf("type") > -1) {
					otherSplitted[j] = "data-" + otherSplitted[j];	
				}
			}
			if (i === 0) {
				otherSplitted.push("type=\"application/json\"");
			}
			htmlSplitted[i] = otherSplitted.join(" ");
		}
		
		html = htmlSplitted.join(">");
	}
	
	var newHtml;
	$("#temp").html(html);
	$("#temp").children().each(function() {
		$(this).attr("data-id", id);
		newHtml = $(this)[0].outerHTML;
	});
    $("#temp").empty();
	return newHtml;
}

function removeDataIdInHtml(html) {
    var newHtml;
    $("#temp").html(html);
    $("#temp").find("script").each(function() {
		$(this).attr("type", $(this).attr("data-type"));
		$(this).removeAttr("data-type");
    });
    $("#temp").find("*[data-id]").each(function() {
        $(this).removeAttr("data-id");
        newHtml = $(this)[0].outerHTML;
    });
    $("#temp").empty();
    return newHtml;   
}

function findPreviousTagsElement(id, section) {
	var position = getTagsDataById(id, "position");
	var elementsInThisSection = new Array();
	
	$("#code-dom").contents().find(section).children().each(function() {
		var thisId = $(this).data("id");
		var thisPosition = getTagsDataById(thisId, "position");
		
		var infoAboutThis = {
			id: thisId,
			position: thisPosition
		};
		
		elementsInThisSection.push(infoAboutThis);
	});
	
	var withSmallerPosition = new Array();
	for (var i = 0; i < elementsInThisSection.length; i++) {
		if (elementsInThisSection[i].position < position) {
			withSmallerPosition.push(elementsInThisSection[i]);
		}
	}
	
	var highestPosition = 0;
	var previousElement;
	for (var i = 0; i < withSmallerPosition.length; i++) {
		if (elementsInThisSection[i].position > highestPosition) {
			highestPosition = elementsInThisSection[i].position;
			previousElement = elementsInThisSection[i];
		}
	}
	
	if (typeof previousElement !== "undefined") {
		return previousElement.id;	
	}
	else {
		return false;	
	}
}

$.ajax({
	url: "./data/tags.json",
	dataType: "json",
	success: function(data) {
		globalData = data;
		$.each(data, function(key, value) {
			var cardId = value.id;
			
			$("#tag-menu").append(
				"<li id='" + cardId + "' class='collection-item'>" +
					"<span class='title " + value.color + "-text'>" + value.title + "</span>" +
					"<form class='tag-form'></form>" +
				"</li>"
			);	
			
			$.each(value.tags, function(key, value) {
				// HTML wird auseinander und wieder zusammengesetzt um data-id zu setzen
				var html = encodeHtml(insertDataIdInHtml(value.html, value.id));
				
				$("#" + cardId + " .tag-form").append(
					"<p>" +
						"<input class='tag-checkbox' id='" + value.id + "' type='checkbox' data-html='" + html + "'>" +
						"<label for='" + value.id + "'>" + value.title + "</label>" +
					"</p>"
				);			
			});		
		});
			
		$(".tag-checkbox").change(function() {
			var html = $(this).data("html");
			var id = $(this).attr("id");

			if ($(this).is(":checked")) {
				var section = getTagsDataById(id, "section");
				var elementBeforeThis = findPreviousTagsElement(id, section);
				
				if (elementBeforeThis !== false) {
					$("#code-dom").contents().find(section).find("*[data-id='" + elementBeforeThis + "']").after(html);
				}
				else {
					$("#code-dom").contents().find(section).prepend(html);
				}
				
				reInitCode();
			}
			else {
				$("#code-dom").contents().find("*[data-id='" + id + "']").remove();
				reInitCode();
			}
		});	
		
		if ($.cookie("html_bones")) {
			var ids = $.cookie("html_bones_ids").split(",");
			for (var i = 0; i < ids.length; i++) {
				$("#" + ids[i]).prop("checked", true);
			}
		}		
	}
});

function initCode(contents) {
	$("#code").html(contents);
	$("#code").removeClass("prettyprinted");
	prettyPrint();	
}

function reInitCode() {
	var dom = $("#code-dom").contents().find("html");
	var outputHtml = "";
	
	dom.children().each(function() {
		var topHtmlTag = $(this).context.localName; // head or body
		
		outputHtml += "<br>	" + encodeHtml("<" + topHtmlTag + ">");
		$(this).children().each(function() {
			var id = $(this).data("id");
			var html = removeDataIdInHtml($(this)[0].outerHTML);
			outputHtml += "<br>		" + encodeHtml(html);
		});
		outputHtml += "<br>	" + encodeHtml("</" + topHtmlTag + ">");
		
		if (topHtmlTag === "head") {
			outputHtml += "<br>";
		}
	});
	
	var contents = encodeHtml("<!DOCTYPE html>") + 
		"<br>" + encodeHtml("<html>") + 
		outputHtml +
		"<br>" + encodeHtml("</html>");
	
	initCode(contents);
}

$(document).ready(function() {
	if ($.cookie("html_bones")) {
		var head = $.cookie("html_bones_head");
		var body = $.cookie("html_bones_body");
		$("#code-dom").contents().find("head").html(head);
		$("#code-dom").contents().find("body").html(body);
		reInitCode();
	}
	else {
		initCode(encodeHtml($("#code-dom").html()));
	}
	
	$(".toggle-sidebar").sideNav();
	
	$("#code").dblclick(function() {
		$(this).selectText();	
	});
	
	$("#btn-reset-code").click(function() {
		$.removeCookie("html_bones");
		$.removeCookie("html_bones_head");
		$.removeCookie("html_bones_body");
		$.removeCookie("html_bones_ids");
		
		$("#code-dom").contents().find("head").empty();
		$("#code-dom").contents().find("body").empty();
		$(".tag-checkbox").prop("checked", false);
		reInitCode();
	});
	
	$("#btn-select-code").click(function() {
		$("#code").selectText();	
	});
	
	$("#btn-save-as-cookie").click(function() {
		var cookieHead = $("#code-dom").contents().find("head").html();
		var cookieBody = $("#code-dom").contents().find("body").html();
		var ids = new Array();
		
		$("#code-dom").contents().find("head, body").children().each(function() {	
			ids.push($(this).data("id"));
		});
		
		$.cookie("html_bones", "set", {expires: 365});	
		$.cookie("html_bones_head", cookieHead, {expires: 365});	
		$.cookie("html_bones_body", cookieBody, {expires: 365});	
		$.cookie("html_bones_ids", ids, {expires: 365});	
		
		if ($.cookie("html_bones")) {
			var saveCodeBtn = $(this);
			saveCodeBtn.addClass("green");
			saveCodeBtn.find("i").removeClass("mdi-content-save");
			saveCodeBtn.find("i").addClass("mdi-action-done");
		
			setTimeout(function() {
				saveCodeBtn.removeClass("green");
				saveCodeBtn.find("i").removeClass("mdi-action-done");
				saveCodeBtn.find("i").addClass("mdi-content-save");
			}, 3000);
		}
	});
	
	$(".version").text($("html").data("version"));
});