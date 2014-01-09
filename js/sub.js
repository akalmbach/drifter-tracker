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
var msgps = 10;


function plotGPS(tracker, msg) {
  var GPSMsgTime = new Date();

  if ((GPSMsgTime - tracker.prevGPSMsgTime) < 1000/msgps) {
    return;
  }
  
  tracker.prevGPSMsgTime = GPSMsgTime;
  var lat = msg.latitude;
  var lon = msg.longitude;
  var time = msg.header.stamp.secs + msg.header.stamp.nsecs/1e9;
  var str = time.toString() + ' @ (' + lat.toString() + ',' + lon.toString() + ')';

  console.log('recv gps ' + tracker.color + ' (' + lat.toString() + ',' + lon.toString() + ') @ ' + time.toString());

  var maxNumMarkers = parseInt($('#path_length').val());
  if (maxNumMarkers > 0) {
    while (tracker.markers.length >= maxNumMarkers) {
      var removedMarker = tracker.markers.shift();
      removedMarker.setMap(null);
    }
  }
  
  manualpt = new OpenLayers.Feature.Vector(
    backTransform(new OpenLayers.Geometry.Point(lon,lat))
  );
  manualpt.style = OpenLayers.Util.applyDefaults({fillColor: tracker.color, strokeColor: "black"},
    OpenLayers.Feature.Vector.style["default"]
  ); 
  vectorLayer.addFeatures([manualpt]);
  
}

function callbackGPS(msg) {
  //console.log(msg);
  plotGPS(tracker, msg);
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
