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

function getWayptFeatById(id) {
  for (i in vectorLayer.features) {
    var feature = vectorLayer.features[i];
    if (feature.geometry.id == id) {
      return feature;
    }
  }
  return null;
}

