var sys     = require("sys"),  
var my_http = require("http");  
var path    = require("path"),  
var url     = require("url"),  
var filesys = require("fs");  
var eventsA = require("events");
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var webPort = 8084;
var robotData = new roverDataInit();
var comPort = "/dev/tty.usbserial-A900fwHn";


var sp = new SerialPort(
		robotData.getCommPort(), 
		{ parser: serialport.parsers.readline(), baudrate: 9600,},
		{},
		messagesError);
  

sp.on("open", function (error) {
	if ( error ) {
    	console.log('failed to open: '+error);
    	process.exit(1);
  	}
  	else {
    	console.log ("connection %s is open and ready", comPort)
  	}
  	sp.write(0x80, function (error) {
  			if (error) {
  				console.log("Serial Write Init write failed %s", error);
    			process.exit(1);
  			}
  	});
    sp.write('123456\r', function (error) {
    		if (error) {
    			console.log ("Serial write test 123456 failed to write %s", error);
    			process.exit(1);
    		}
    		else {
    			console.log ("communitcates between base and robot are ready.");
    		}    
    });
 
}); 


// create the webservice listener on the webport 
// for local testing localhost:webport/index.html
my_http.createServer(function(request,response) {  
// parsing paths requested helps give html response

	var my_path = url.parse(request.url).pathname;  
	var full_path = path.join(process.cwd(),my_path);  
	
	path.exists(full_path,function(exists) {  
	  	if(!exists) {  
	  		response.writeHeader(404, {"Content-Type": "text/plain"});    
	    	response.write("404 Not Found\n");    
	    	response.end();  
	  	}  
	  	else {             		
	    	filesys.readFile(full_path,  function(err, file) {    
	    	 	console.log("reading file %s", full_path);
	      		if(err) {    
	        		response.writeHeader(500, {"Content-Type": "text/plain"});    
	        		response.write("please select a project\n");    
	        		response.write("The is the base directory for all.\n");    
	        		response.end();    
	      		}    
	      		else {  
					var _get = url.parse(request.url, true).query; 
	        		response.writeHeader(200);    
					if (_get.roverData  && !_get.direction) {
						console.log("\n");	
						var sendToBrowser = JSON.stringify(robotData);
						console.log(sendToBrowser)
						response.write (sendToBrowser);
					}						
					else if (_get.engineUpDate) {
						if (_get.engineUpDate == "left") {
							robotData.setEngineLeft(_get.engine);
						}
						else if (_get.engineUpDate == "power"){
							robotData.setEngineImpulse(_get.engine);	
						}
						else {
							robotData.setEngineRight(_get.engine);
						}
						var sendToBrowser = JSON.stringify(robotData);
						response.write (sendToBrowser);
					}
					else if (!_get.stopevent  && _get.direction && !_get.roverData) {
						//console.log("direction request");
						robotData.setLastCommand(_get.direction);
						var sendToBrowser = JSON.stringify(robotData);
						response.write (sendToBrowser);
					}
					else if (_get.stopevent == 1) {
						//console.log("stop event");
						robotData.setLastCommand("stop")
						var sendToBrowser = JSON.stringify(robotData );
						response.write (sendToBrowser);
					}
					else {
						response.write(file);
					}
					response.end();  
	   		}            
	    });  
	  }  
	});  

	sp.on('data', function (arduinoData) {

 		//console.log("\n\n\n----\ntest serial from Arduino \n------ \n\n\n")
		if (arduinoData.length < 2) {
			return;
		}
    	var ArduinoString = arduinoData.toString();
		var re = /(ALERT|Rover|data|radar|ready6cmd)/i;
		var match = re.exec(ArduinoString);
		
		//console.log ("data recieved ->" + ArduinoString + "<- aaa ");
		//console.log ("data recieved ->" + arduinoData + "<- aaa ");
		
		if (match) {
			//console.log ("data recieved ->" + ArduinoString + "<- aaa ");
			matchResults = match[0].toLowerCase();
			if (matchResults == "alert") {
				var splitResults = ArduinoString.split(",");
				//console.log("Alert  data " + splitResults.length +  "  " + data);
				robotData.setAlert(splitResults[1]);
				robotData.setRange(splitResults[2]);
			}
			else if (matchResults == "rover") {
				var splitResults = ArduinoString.split(",");
				console.log("rover data " + splitResults.length +  "  " + ArduinoString);
				robotData.setRoverInfo(ArduinoString);
				robotData.setLastCommand(splitResults[1]);
				robotData.setRange(splitResults[5]);
				robotData.setEngineLeft(splitResults[2]);
				robotData.setEngineRight(splitResults[3]);
				robotData.setEngineImpulse(splitResults[4]);
				robotData.setAlert("");
			}
			else if (matchResults == "radar") {
				robotData.setRadarData(ArduinoString);
			}
			else if (matchResults == "data") {
				robotData.setRoverData(ArduinoString);
			}
			else if (matchResults == "ready4cmd") {
				console.log ("data recieved ->" + match + "<- aaa n");
				robotData.setReady4Command(true);
			}
			else {
				//console.log("->unmatched data ", match[0], data);
			}
		}
		match = "";

  	});
 

 	request.on('end', function () { 
		var _get = url.parse(request.url, true).query; 		
		var sendToArduino = "";	

		if (_get.direction) {			
			sendToArduino = new String (  _get.direction).toLowerCase() ;
			robotData.setLastCommand(sendToArduino);
			robotData.setReady4Command(false);
		}	
		else if (_get.engineUpDate) {
			var engineSend = "engine" + _get.engineUpDate  + ":" + _get.engine + "\r";
			sendToArduino = new String (engineSend).toLowerCase() ;
		}
		else if (_get.roverData) {
			//console.log("roverData xxxxxxxxxxx");
			sendToArduino =  new String ("roverData").toLowerCase() + "\r";
		}
		else if (_get.radarData) {
			//console.log("radardata xxxxxxxxxxx");
			sendToArduino =  new String ("radardata").toLowerCase() + "\r";
			console.log(sendToArduino);
		}
		else {
			//console.log ("aaaa no data");
			return;
		}

		//console.log ("sending ... we hope.  ->> " + sendToArduino + "<--- ");
		sendToArduino = sendToArduino + "\r";
		sp.write(sendToArduino , function(err, results) {
			if (err) {
				console.log("we have an issue writing data to the rover %s", err);
				//REWRITE set a message for feedback to user of error
			}
			sp.drain(function(err, result){
				if (err) {
					console.log("we have an issue draining the buffer on write %s", err);
					// REWRITE again send message to user throw web
				} else {
				console.log (result);
				}
			});
		});
    }); 
}).listen(webPort);  
sys.puts("Server Running on " + webPort);




//////////////////////
//
//  Functions 
//
function roverDataInit() {
	this.lastCommand = "starting";
	this.status = true;
	this.heart = false;
	this.range = 33;
	this.comm = "/dev/tty.usbserial-A900fwHn";
	this.alert = "";
	this.roverMessage = "";
	this.roverData = "";
	this.leftEngine = 255;
	this.rightEngine = 255;
	this.engineImpulse = 100;
	this.radarData = "";
	this.Ready4Command = "ready";


	this.setReady4Command=function(bool){
		if (bool == true) {
     	this.Ready4Command = "ready";
    }
    else {
     	this.Ready4Command = "busy";
    }
  }
	this.getReady4Command = function(){
     		return this.Ready4Command;
  }    


	this.setLastCommand=function(strValue){
     		this.lastCommand=strValue;
  }
	this.getLastCommand = function(){
     		return this.lastCommand;
  }    

  this.setRadarData=function(strValue){
    //console.log("reading roverdata" + strValue);
    this.radarData=strValue;
  }
	this.getRadarData = function(){
		//console.log("getting radar data");
    return this.radarData;
  }    

	
	this.setHeartBeat = function  (strValue) {
		this.Status = signal;	
	}
	this.getHeartBeat = function() {
		return this.Status;
  }	

	this.setRange=function(strValue) {
		this.range = strValue;
	}

	this.getRange=function(strValue) {
     		return this.range;
	}

	this.setAlert=function(strValue) {
		this.alert = strValue;
	}	
	this.getAlert=function(strValue) {
     		return this.alert;
	}

	this.setRoverInfo=function(strValue) {
		this.roverMessage = strValue;
	}	
	this.getRoverInfo=function(strValue) {
     		return this.roverMessage;
	}

	this.setRoverData=function(strValue) {
		this.roverData = strValue;
	};	
	this.getRoverData=function(strValue) {
     		return this.roverData;
	
	}

	this.setEngineLeft=function(strValue) {
		this.leftEngine= strValue;
	}	
	this.getEngineLeft=function(strValue) {
 	    	return this.leftEngine;
	}
	this.setEngineRight=function(strValue) {
		this.rightEngine = strValue;
	}	
	this.getEngineRight=function(strValue) {
     		return this.rightEngine;
	}

	this.setEngineImpulse = function(strValue) {
		this.engineImpulse = strValue;
	}	
	this.getEngineImpulse = function(strValue) {
     		return this.engineImpulse;
	}

	this.setCommPort = function(strValue) {
		console.log("setting comm port" + strValue);
		this.comm = strValue;
	}	
	this.getCommPort = function(strValue) {
     		return this.comm;
	}
	console.log ("done init");			
	
}           

// REWRITE
// I think at the time this was ment to be attached or extend serialport but its useless
function messagesError (error) {
	console.log ("\nThere was an error with Serial Port %s", error);
	console.log ("Exiting...");
	process.exit(1);
}





////////////////////////////////
//
// Junk or notes not sure which
//

/* serialport.list(function (err, ports) {
   var FTDIFlag = false;
   ports.forEach(function(port) {
   if (ports.manufacturer == "FTDI") {
  		FTDIFlag = true;
  		robotData.setCommPort(ports.comName);
  		console.log(ports.comName + "-----");
  		return;
  	}
  	
  	if (FTDIFlag == false && ports.vendorId == '0x2341') {
  		robotData.setCommPort(ports.comName);
  		//console.log(port.comName);

  	}
  	//console.log(port);
  	//console.log(port.comName);
  	//console.log(port.vendorId);
  });
  
	var test = robotData.getCommPort();
		console.log("test --->");
	console.log(test);
 
});
*/
// this try is not catching the error and I am still working on the error event 


