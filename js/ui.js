function dragWaypoint(point) {
  console.log("drag waypoint");
  var coord = transform(point.geometry);
  var current = $('#wp-'+point.geometry.id);
  current.find('.addedLat').val(coord.y);
  current.find('.addedLon').val(coord.x);
  updateDistance(current);
}

function updateDistance(wayptBox) {
  var index = $('.wayptBox').index(wayptBox);
  if ($('.wayptBox').length < 2) {
    return;
  }
  if (index == 0) {
    wayptBox.find('.distance').html('');
  }
  if (index > 0) {
    // Update distance to previous
    console.log("Update distance to previous");
    var prev = wayptBox.prev();
    var dist = getDistance(prev, wayptBox);
    wayptBox.find('.distance').html(dist + 'm');
  }
  if (index < $('.wayptBox').length -2) {
    // Update distance to next
    console.log("Update distance to next");
    var next = wayptBox.next();
    var dist = getDistance(wayptBox, next);
    next.find('.distance').html(dist + 'm');
  }
}


function addWaypoint(point) {
  console.log("add waypoint");
  var coord = transform(point.geometry);
  var needDistance = false;
  if ($('.wayptBox').length > 1) {
    needDistance = true;
  }
  var html = 
    '<div id="wp-'+point.geometry.id+'" class="wayptBox">';
  //if (needDistance) {
    html += 
      '<div style="float:left;padding:25px 20px 0 0;">' +
        '<div style="width:40px;" class="distance"></div>' +
      '</div>';
  //}
  html +=
      '<div style="float:left">' +
        '<p><input type="text" class="form-control addedLat" placeholder="Longitude" value="'+coord.y+'" /></p>' +
        '<p><input type="text" class="form-control addedLon" placeholder="Latitude" value="'+coord.x+'" /></p>' +
      '</div>' +
      '<div style="float:left;margin-left:5px">' +
        '<p><input class="btn btn-primary" style="height:35px;width:60px;" type="button" onclick="modifyWayptManual(event)" value="Mod"/></p>' +
        '<p><input class="btn btn-danger" style="height:35px;width:60px;margin-top:-2px" type="button" onclick="deleteWayptManual(event)" value="Del"/></p>' +
      '<div>' +
    '</div>';
    $(html).insertBefore('#manualInput');
  
  if (needDistance) {
    var current = $('#wp-'+point.geometry.id);
    var prev = current.prev();
    //var prevLat = prev.find('.addedLat').val();
    //var prevLon = prev.find('.addedLon').val();
    var dist = getDistance(prev, current);
    console.log(dist);
    $('#wp-'+point.geometry.id).find('.distance').html(dist + 'm');
  }
}

function addWaypointInputEmpty() {
  //console.log(getWaypointInput('manualInput', '',''));
  $('#wayptUi').append($('<div id="manualInput" class="wayptBox" style="margin-left:60px">'+
    '<div style="float:left">' +
      '<p><input type="text" id="latInput" class="form-control" placeholder="Latitude" value="" /></p>' +
      '<p><input type="text" id="lonInput" class="form-control" placeholder="Longitude" value="" /></p>' +
    '</div>' +
    '<div style="float:left;margin-left:5px">' +
      '<input class="btn btn-primary" style="height:80px" type="button" onclick="addWaypointManual(event)" value="Add"/>' +
    '<div>' +
  '</div>'));
}

function addWaypointManual(event) {
  manualpt = new OpenLayers.Feature.Vector(
    backTransform(new OpenLayers.Geometry.Point($('#lonInput').val(),$('#latInput').val()))
  );
  vectorLayer.addFeatures([manualpt]);
  addWaypoint(manualpt);
  $('#lonInput').val('');
  $('#latInput').val('');
}

function modifyWayptManual(event) {
  var button = $(event.target);
  var wayptBox = button.parents('.wayptBox');
  var id = wayptBox.attr('id').substring(3);
  
  var newLat = wayptBox.find('.addedLat').val();
  var newLon = wayptBox.find('.addedLon').val();
  console.log(newLat + ', ' + newLon);
  var newPoint = backTransform(new OpenLayers.Geometry.Point(newLon, newLat));
  console.log(newPoint);
  var feature = getWayptFeatById(id);
  //feature.geometry.move(newPoint.x - feature.geometry.x, newPoint.y - feature.geometry.y);
  feature.geometry.x = newPoint.x;
  feature.geometry.y = newPoint.y;
  feature.geometry.clearBounds();
  feature.layer.drawFeature(feature);
  dragWaypoint(feature);
}

function deleteWayptManual(event) {
  var button = $(event.target);
  var wayptBox = button.parents('.wayptBox');
  var id = wayptBox.attr('id').substring(3);
  var feature = getWayptFeatById(id);
  feature.layer.destroyFeatures([feature]);
  var next = wayptBox.next();
  wayptBox.remove();
  updateDistance(next);
}

function updateCvs(event) {
  console.log("updating Cvs");
  var csv = '';
  for (i in vectorLayer.features) {
    var feature = vectorLayer.features[i];
    console.log(feature.geometry.id);
    var coord = transform(feature.geometry);
    csv += coord.y + ',' + coord.x + "\n";
  }
  $('#csvContent').val(csv);
}

function getDistance(box1,box2) {
  var lat1 = box1.find('.addedLat').val();
  var lon1 = box1.find('.addedLon').val();
  var lat2 = box2.find('.addedLat').val();
  var lon2 = box2.find('.addedLon').val();
  var p1 = new LatLon(lat1,lon1);
  var p2 = new LatLon(lat2,lon2);
  return p1.distanceTo(p2);
}

function getWayptFeatById(id) {
  for (i in vectorLayer.features) {
    var feature = vectorLayer.features[i];
    if (feature.geometry.id == id) {
      return feature;
    }
  }
  return null;
}

