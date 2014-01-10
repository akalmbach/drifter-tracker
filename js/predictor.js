function Tracker(c, sc) {
  this.listenerGPS = null;
  this.listenerSample = null;
  this.prevGPSMsgTime = new Date();
  this.markers = new Array();
  this.samples = new Array();
  this.waypointLines = null;
  this.color = c;
  this.sampleColor = sc;
}

var ros = new ROSLIB.Ros();
var addr = "localhost:9090";
var connected = false;
var tracker = new Tracker('red', 'gold');

var msgps = 0.5;


function callbackSample(msg) {
   
  var lat = msg.latitude;
  var lon = msg.longitude;

  console.log('recv sample (' + lon.toString() + ',' + lat.toString() + ')');

  var maxFeatures = parseInt($('#sample_length').val());
  console.log(maxFeatures + '/' + tracker.samples.length);
  
  if (maxFeatures > 0) {
    while (tracker.samples.length >= maxFeatures) {
      var removedFeature = tracker.samples.shift();
      removedFeature.layer.destroyFeatures([removedFeature]);
    }
  }
  
  manualpt = new OpenLayers.Feature.Vector(
    backTransform(new OpenLayers.Geometry.Point(lon,lat))
  );
  manualpt.style = OpenLayers.Util.applyDefaults({fillColor: tracker.sampleColor, fillOpacity: 1, strokeWidth: 0.1, pointRadius: 2},
    OpenLayers.Feature.Vector.style["default"]
  ); 
  vectorLayer.addFeatures([manualpt]);
  tracker.samples.push(manualpt);
  
}

function callbackGPS(msg) { 
  var GPSMsgTime = new Date();

  if ((GPSMsgTime - tracker.prevGPSMsgTime) < 1000/msgps) {
    return;
  }

  // remove samples first
  while (tracker.samples.length > 0) {
    var removedFeature = tracker.samples.shift();
    removedFeature.layer.destroyFeatures([removedFeature]);
  }
  
  tracker.prevGPSMsgTime = GPSMsgTime;
  var lat = msg.latitude;
  var lon = msg.longitude;
  var time = msg.header.stamp.secs + msg.header.stamp.nsecs/1e9;
  var str = time.toString() + ' @ (' + lat.toString() + ',' + lon.toString() + ')';

  console.log('recv gps ' + tracker.color + ' (' + lon.toString() + ',' + lat.toString() + ') @ ' + time.toString());

  var maxFeatures = parseInt($('#path_length').val());
  
  if (maxFeatures > 0) {
    while (tracker.markers.length >= maxFeatures) {
      var removedFeature = tracker.markers.shift();
      removedFeature.layer.destroyFeatures([removedFeature]);
    }
  }
  
  manualpt = new OpenLayers.Feature.Vector(
    backTransform(new OpenLayers.Geometry.Point(lon,lat))
  );
  manualpt.style = OpenLayers.Util.applyDefaults({fillColor: tracker.color, fillOpacity: 0.75, strokeColor: "black"},
    OpenLayers.Feature.Vector.style["default"]
  ); 
  vectorLayer.addFeatures([manualpt]);
  tracker.markers.push(manualpt);
  
}


function toggleConnection() {  
  if (connected) { // Disconnect from ROSBridge server
    if (tracker.listenerGPS != null) {
      tracker.listenerGPS.unsubscribe();
    }
    if (tracker.listenerSample != null) {
      tracker.listenerSample.unsubscribe();
    }

    ros.close();
    console.log("disconnected from ws://" + addr + "/*");
    connected = false;
  }
  else { // Connect to ROSBridge server
    ros.connect('ws://' + addr);

    var gpsTopic = $('#gps_topic').val();
    if (gpsTopic.length <= 0) {
      gpsTopic = "/gps/fix";
    }
        
    tracker.listenerGPS = new ROSLIB.Topic({
        ros : ros,
        name : gpsTopic,
        messageType : 'sensor_msgs/NavSatFix'
    });
    tracker.listenerGPS.subscribe(callbackGPS);
    console.log("connected to ws://" + addr + gpsTopic);
    
    var sampleTopic = $('#sample_topic').val();
    if (sampleTopic.length <= 0) {
      sampleTopic = "/sample/fix";
    }
        
    tracker.listenerSample = new ROSLIB.Topic({
        ros : ros,
        name : sampleTopic,
        messageType : 'sensor_msgs/NavSatFix'
    });
    tracker.listenerSample.subscribe(callbackSample);
    
        
    console.log("connected to ws://" + addr + sampleTopic);
    connected = true;
  }
}
