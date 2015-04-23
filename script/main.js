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

$.ajax({
	url: "./data/tags.json",
	dataType: "json",
	success: function(data) {
		$.each(data, function(key, value) {
			var cardId = value.id;
			
			$("#tag-menu").append(
				"<li id='" + cardId + "' class='collection-item'>" +
					"<span class='title " + value.color + "-text'>" + value.title + "</span>" +
					"<form class='tag-form'></form>" +
				"</li>"
			);	
			
			$.each(value.tags, function(key, value) {
				var html = encodeHtml(value.html);
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
				$("#code-dom").contents().find("head").append(html);
				reInitCode();
			}
			else {
				$("#code-dom").contents().find("*[data-id='" + id + "'").remove();
				reInitCode();
			}
		});			
	}
});
//prettyPrint();

function initCode(contents) {
	$("#code").html(contents);
	$("#code").removeClass("prettyprinted");
	prettyPrint();	
}

function reInitCode() {
	var dom = $("#code-dom").contents().find("html");
	var outputHtml = "";
	
	dom.children().each(function() {
		// inner head/body
		console.log($(this));
		outputHtml += "<br>	" + encodeHtml("<" + $(this).context.localName + ">");
		$(this).children().each(function() {
			outputHtml += "<br>		" + encodeHtml($(this).outerHTML());
		});
		outputHtml += "<br>	" + encodeHtml("</" + $(this).context.localName + ">");
		
		if ($(this).context.localName === "head") {
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
	$(".toggle-sidebar").sideNav();
	
	$("#btn-select-code").click(function() {
		$("#code").selectText();	
	});
	
	$("#code").dblclick(function() {
		$(this).selectText();	
	});
	
	$(".version").text($("html").data("version"));
	
	initCode(encodeHtml($("#code-dom").html()));
});

