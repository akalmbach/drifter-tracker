function Tracker(c) {
  this.listenerGPS = null;
  this.prevGPSMsgTime = new Date();
  this.markers = new Array();
  this.waypointLines = null;
  this.color = c;
}

var ros = new ROSLIB.Ros();
var addr = "localhost:9090";
var connected = false;
var tracker = new Tracker('red');


function callbackGPS(msg) {
  console.log(msg);
}

function toggleConnection() {  
  if (connected) { // Disconnect from ROSBridge server
    if (tracker.listenerGPS != null) {
      tracker.listenerGPS.unsubscribe();
    }
    ros.close();
    console.log("disconnected from ws://" + addr + "/*");
    connected = false;
  }
  else { // Connect to ROSBridge server
    ros.connect('ws://' + addr);

    var topic = $('#ramius_gps_topic').val();
    if (topic.length <= 0) {
      topic = "/ramiusgpsbox/gps/fix";
    }
        
    tracker.listenerGPS = new ROSLIB.Topic({
        ros : ros,
        name : topic,
        messageType : 'sensor_msgs/NavSatFix'
    });
    tracker.listenerGPS.subscribe(callbackGPS);
    
    console.log("connected to ws://" + addr + topic);
    connected = true;
  }
}
