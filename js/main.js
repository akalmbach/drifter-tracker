// Use proxy to get same origin URLs for tiles that don't support CORS.
OpenLayers.ProxyHost = "proxy.cgi?url=";

var map, cacheWrite, cacheRead1, cacheRead2, drawControls, vectorLayer;

function init() {
    var bingAerial = new OpenLayers.Layer.Bing({
	    key: "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf",
	    type: "AerialWithLabels",
	    name: "Bing Aerial With Labels",
	    eventListeners: {
		    tileloaded: updateStatus
	    }
    });
    var bingRoad = new OpenLayers.Layer.Bing({
	    key: "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf",
	    type: "Road",
	    name: "Bing Road",
	    eventListeners: {
		    tileloaded: updateStatus
	    }
    });
    // For waypoints
    vectorLayer = new OpenLayers.Layer.Vector("Waypoints");
    
    // For lines connecting waypoints
    vectorLayer2 = new OpenLayers.Layer.Vector("Non-interactive");
				
    map = new OpenLayers.Map({
        div: "map",
        //projection: "EPSG:900913",
		projection: new OpenLayers.Projection("EPSG:4326"),
		displayProjection: new OpenLayers.Projection("EPSG:4326"),
        layers: [
            bingAerial,
            bingRoad,
            new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
                eventListeners: {
                    tileloaded: updateStatus,
                    loadend: detect
                }
            }),
            /*new OpenLayers.Layer.ArcGIS93Rest(
                "ESRI Satellite",
                "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?f=image",
                { layers :'show:0' },
                { attribution:"ESRI Satellite", opacity:1, }
            )*/
            vectorLayer,
            vectorLayer2
        ],
		/*controls: [
			new OpenLayers.Control.MousePosition(),
			new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point)
		]*/
    });
	
	for(var key in drawControls) {
		map.addControl(drawControls[key]);
	}
	
	map.addControl(new OpenLayers.Control.MousePosition());
	
	var zoom = map.getZoomForResolution(76.43702827453613);
	map.setCenter(new OpenLayers.LonLat(-59.640643,13.191991).transform(
		new OpenLayers.Projection("EPSG:4326"),
		map.getProjectionObject()
	), 18);

    // try cache before loading from remote resource
    cacheRead1 = new OpenLayers.Control.CacheRead({
        eventListeners: {
            activate: function() {
                cacheRead2.deactivate();
            }
        }
    });
    // try loading from remote resource and fall back to cache
    cacheRead2 = new OpenLayers.Control.CacheRead({
        autoActivate: false,
        fetchEvent: "tileerror",
        eventListeners: {
            activate: function() {
                cacheRead1.deactivate();
            }
        }
    });
    cacheWrite = new OpenLayers.Control.CacheWrite({
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() {
                if (seeding) {
                    stopSeeding();
                }
                //status.innerHTML = '<span style="color:red">Cache full.</span>';
                cacheFull = true;
                $('#writeSwitch').bootstrapSwitch('toggleState');
            }
        }
    });
    var layerSwitcher = new OpenLayers.Control.LayerSwitcher();
    map.addControls([cacheRead1, cacheRead2, cacheWrite, layerSwitcher]);

    
    // add UI and behavior
    var status = document.getElementById("status"),
        hits = document.getElementById("hits"),
        cacheHits = 0,
        seeding = false;
    var read = document.getElementById("read");
    read.checked = true;
    read.onclick = toggleRead;
    var cacheFull = false;
	
    
    //var write = document.getElementById("write");
    //write.checked = false;
    //write.onclick = toggleWrite;
    
    $('#writeSwitch').on('switch-change', function (e, data) {
        toggleWrite();
    });
    
    $('#connectRos').on('switch-change', function (e, data) {
        toggleROS();
    });
    
    document.getElementById("clear").onclick = clearCache;
    var tileloadstart = document.getElementById("tileloadstart");
    tileloadstart.checked = "checked";
    tileloadstart.onclick = setType;
    document.getElementById("tileerror").onclick = setType;
    document.getElementById("seed").onclick = startSeeding;
    
    // detect what the browser supports
    function detect(evt) {
        // detection is only done once, so we remove the listener.
        evt.object.events.unregister("loadend", null, detect);
        var tile = map.baseLayer.grid[0][0];
        try {
            var canvasContext = tile.getCanvasContext();
            if (canvasContext) {
                // will throw an exception if CORS image requests are not supported
                canvasContext.canvas.toDataURL();
            } else {
                status.innerHTML = "Canvas not supported. Try a different browser.";
            }
        } catch(e) {
            // we remove the OSM layer if CORS image requests are not supported.
            map.setBaseLayer(map.layers[1]);
            evt.object.destroy();
            layerSwitcher.destroy();
        }
    }

    // update the number of cache hits and detect missing CORS support
    function updateStatus(evt) {
        if (window.localStorage) {
            if (cacheFull) {
                status.innerHTML = '<span style="color:red">Cache full.</span>';
            }
            else {
                status.innerHTML = localStorage.length + " entries in cache.";
            }
        } else {
            status.innerHTML = "Local storage not supported. Try a different browser.";
        }
        if (evt && evt.tile.url.substr(0, 5) === "data:") {
            cacheHits++;
        }
        hits.innerHTML = cacheHits + " cache hits.";
    }
    
    // turn the cacheRead controls on and off
    function toggleRead() {
        if (!this.checked) {
            cacheRead1.deactivate();
            cacheRead2.deactivate();
        } else {
            setType();
        }
    }
    
    // turn the ros connection on and off
    function toggleROS() {
      console.log("toggle ros");
      toggleConnection();
    }
    
    // turn the cacheWrite control on and off
    function toggleWrite() {
        console.log("toggle write");
        cacheWrite[cacheWrite.active ? "deactivate" : "activate"]();
    }
    
    // clear all tiles from the cache
    function clearCache() {
        OpenLayers.Control.CacheWrite.clearCache();
        cacheFull = false;
        updateStatus();
    }
    
    // activate the cacheRead control that matches the desired fetch strategy
    function setType() {
        if (tileloadstart.checked) {
            cacheRead1.activate();
        } else {
            cacheRead2.activate();
        }
    }
    
    // start seeding the cache
    function startSeeding() {
        var layer = map.baseLayer,
            zoom = map.getZoom();
        seeding = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels-1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        cacheWrite.activate();
        // turn off cache reading
        cacheRead1.deactivate();
        cacheRead2.deactivate();
        
        layer.events.register("loadend", null, seed);
        
        // start seeding
        map.setCenter(seeding.center, zoom);
    }
    
    // seed a zoom level based on the extent at the time startSeeding was called
    function seed() {
        var layer = seeding.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seeding.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        map.zoomIn();
        if (nextZoom === layer.numZoomLevels-1) {
            stopSeeding();
        }
    }
    
    // stop seeding (when done or when cache is full)
    function stopSeeding() {
        // we're done - restore previous settings
        seeding.layer.events.unregister("loadend", null, seed);
        seeding.layer.buffer = seeding.buffer;
        map.setCenter(seeding.center, seeding.zoom);
        if (!seeding.cacheWriteActive) {
            cacheWrite.deactivate();
        }
        if (read.checked) {
            setType();
        }
        seeding = false;
    }	
    
    // Initialize user interface
    //addWaypointInputEmpty();
    //$('#getCsv').popover({html:true, placement:'top', title:'CSV (Latitude, Longitude)', content:'<textarea id="csvContent" style="height:300px;width:400px;"></textarea>'});
    //$('#getCsv').on('shown.bs.popover', updateCvs)
}

function toggleControl(element) {
	for(key in drawControls) {
		var control = drawControls[key];
		if(element.value == key && element.checked) {
			control.activate();
		} else {
			control.deactivate();
		}
	}
}

function transform(point) {
  var newPoint = new OpenLayers.Geometry.Point(point.x, point.y);
  newPoint.transform("EPSG:900913", "EPSG:4326");
  return newPoint;
}

function backTransform(point) {
  var newPoint = new OpenLayers.Geometry.Point(point.x, point.y);
  newPoint.transform("EPSG:4326", "EPSG:900913");
  return newPoint;
}
