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

var trackers = {
  ramius: new Tracker('red'),
  drifter: new Tracker('gold'),
  laptop: new Tracker('magenta')
}

var msgps = 0.5;


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

function callbackRamiusGPS(msg) {
  plotGPS(trackers['ramius'], msg);
}

function callbackDrifterGPS(msg) {
  plotGPS(trackers['drifter'], msg);
}

function callbackLaptopGPS(msg) {
  plotGPS(trackers['laptop'], msg);
}

function toggleConnection() {  
  if (connected) { // Disconnect from ROSBridge server
    for (var tracker in trackers) {
      if (trackers[tracker].listenerGPS != null) {
        trackers[tracker].listenerGPS.unsubscribe();
      }
    }
    ros.close();
    console.log("disconnected from ws://" + addr + "/*");
    connected = false;
  }
  else { // Connect to ROSBridge server
    ros.connect('ws://' + addr);

    for (var tracker in trackers) {
      var topic = $('#' + tracker + '_gps_topic').val();
      if (topic.length <= 0) {
        topic = tracker + "/gps/fix";
      }
          
      trackers[tracker].listenerGPS = new ROSLIB.Topic({
          ros : ros,
          name : topic,
          messageType : 'sensor_msgs/NavSatFix'
      });
      if (tracker == 'ramius') {
        trackers[tracker].listenerGPS.subscribe(callbackRamiusGPS);
      }
      if (tracker == 'drifter') {
        trackers[tracker].listenerGPS.subscribe(callbackDrifterGPS);
      }
      if (tracker == 'laptop') {
        trackers[tracker].listenerGPS.subscribe(callbackLaptopGPS);
      }
    }
    console.log("connected to ws://" + addr + topic);
    connected = true;
  }
}
