
$(function() {
	event.preventDefault();
    $("#forward").click(function(){
    	changeIndicator('#forwardImg', 'images/forward_green.jpg');
    	askForDataFromNode  ({color:"#ffffff",direction:"forward"});
    	askForDataFromNode  ({tankData:1});
    }); 
    $("#back").click(function(){
           changeIndicator('#backImg', 'images/back_green.jpg');
           askForDataFromNode  ({color:"#ffffff",direction:"back"});
           askForDataFromNode  ({tankData:1});
    });
    $("#left").click(function(){
    	changeIndicator('#leftImg', 'images/left_green.jpg');
    	askForDataFromNode  ({color:"#ffffff",direction:"left"});
        askForDataFromNode  ({tankData:1});
    });
    $("#right").click(function(){
    	changeIndicator('#rightImg', 'images/right_green.jpg');
    	askForDataFromNode ({color:"#ffffff",direction:"right"});
        askForDataFromNode  ({tankData:1});
    });
    $("#stop").click(function(){
		changeIndicator("", "");
        askForDataFromNode ({color:"#ffffff",direction:"stop", stopevent:1});
    });
	$("#slider-vertical2").slider({
  		orientation: "vertical",
  		range: "min",
  		min: 0,
  		max: 255,
  		value: 60,
  		slide: function( event, ui ) {
    		$( "#amount2" ).text( ui.value );
			askForDataFromNode ({engine:ui.value,engineUpDate:"left"});
  		},
		change: function( event, ui ) {
			$( "#amount2" ).text( ui.value );
		}
    });

	$("#slider-vertical3").slider({
  		orientation: "vertical",
  		range: "min",
  		min: 0,
  		max: 255,
  		value: 60,
  		slide: function( event, ui ) {
    		$( "#amount3" ).text( ui.value );
			askForDataFromNode ({engine:ui.value,engineUpDate:"right"});
	    },
		change: function( event, ui ) {
    		$( "#amount3" ).text( ui.value );
		}
	});
});

var idsetPrev = "";
var locationImgPrev = "";

function changeIndicator (idset, locationImg) {
	if (idsetPrev) {
		$(idsetPrev).attr('src',locationImgPrev);
	}	
	idsetPrev = idset;
	locationImgPrev = $(idset).attr('src');
	$(idset).attr('src',locationImg);
}

var xmlhttp;
function loadXMLDoc(url, cfunc) {
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
  		xmlhttp=new XMLHttpRequest();
  	}
	else {   // code for IE6, IE5
  		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  	}
	xmlhttp.onreadystatechange=cfunc;
	xmlhttp.open("GET",url,true);
	xmlhttp.send();
}

function askForDataFromNode(data) {
	var str = $.param(data);
	loadXMLDoc("index.html?" + str ,function() {
  		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
  			processFeedBack($.parseJSON(xmlhttp.responseText)) ;
    	}
  	});
}

function processFeedBack (data) {
	$("#status1").text( data.range);
	$("#status2").text( data.lastCommand );
	if (data.alert) {
		$("#status1,#status2,#status3, #status4").css("color", "#FF6802");
		$("#status3").text( data.alert);
		changeIndicator("","");
		return;
	}	
	else if (data.lastCommand == "stop") {
		$("#status2").text( data.lastCommand );
		$("#status2,#status1").css("color", "#DE6262");
	}
	else {
		console.log("regular or default event");
		$("#status1,#status2,#status3").css("color", "#000000");
		$("#slider-vertical2").slider("value",data.leftEngine);
		$("#slider-vertical3").slider("value", data.rightEngine);
	}
}
