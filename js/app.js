	
	var map;
	var mapUser;
	var rep = "";
	var user = "";
	var token = "";
	var jsonCnt = "";
	var hotels = [];
	var bodies = [];
	var apiKey = "AIzaSyAKg0vtCZDoEE7zahL0oGEZD7JDp2XK1xg";
	var userAvailableTags = [];
	var repoAvailableTags = [];
	var init = false;

	var makeApiCall = function(id){
		console.log("pedimos cosas a g+ " + id);
		gapi.client.load('plus', 'v1', function(){
			var request = gapi.client.plus.people.get({
				'userId': id
			});

			request.execute(function(resp){
				var h = $("#usersSelecteds").html();
				h += "<div class='col-md-6'>" + resp.displayName + "<img class= 'img-circle img-responsive img-center' src='"+ resp.image.url +"'></img><div>";
				$("#usersSelecteds").html(h);
			});
		});
	};

	var getUser = function(id){
		console.log(id);
		makeApiCall(id);
    };

	var removeHotel = function(){
		$("li button.glyphicon").click(function(){
			$(this).parent("li").remove();
		});
	};

	var addHotel = function(h){
		if(h != undefined){
			var html = $("#hotelsSelected").html();
			$("#hotelsSelected").html( html + "<li>" + h + "<button class='glyphicon glyphicon-remove'></button></li>");
			removeHotel();
		};
	};

	var getCollections = function(){
		var github =  new Github({token:token,auth: "oauth"});
		var repo = github.getRepo(user, rep);
		var gitAPI = "https://api.github.com/repos/" + user + "/" + rep + "/contents/collection.json"
		$.getJSON(gitAPI)
		.done(function(data){
			console.log("success");
			var content = atob(data.content);
			jsonCnt = JSON.parse(content);
			var collections = [];
			$.each(jsonCnt, function(key,val){
				collections.push("<ul id='" + key + "' class='collection'>" + key + ":"+ val + "</ul>");
			});
			$("#collections").html(collections);
		}).fail(function(){
			console.log("cannot get resource");
		});
	};

	var delAllMarkers = function(){

	    $.each(mapUser._layers, function (ml) {
	        console.log(mapUser._layers_)
	        if (mapUser._layers[ml]._latlng) {
	            mapUser.removeLayer(this);
	        }
	    });
	};

	var getMapCollection = function(aHotels){
		delAllMarkers();
		$.each(aHotels,function(key,val){
			console.log(key + "-" + val);
			var location = getLocation(hotels,val);
			getMap(location,val,mapUser,false);
		});

	};

	var collectionSelected = function(){
		$(".collection").click(function(){
			hs = $("#"+this.id).html().split(":")[1].split(",");
			getMapCollection(hs);
		});
	};

	var safeNew = function(name,hotels){
		var github =  new Github({token:token,auth: "oauth"});
		var repo = github.getRepo(user, rep);
		console.log(jsonCnt);
		jsonCnt[name] = hotels;
		console.log(jsonCnt);
		console.log(JSON.stringify(jsonCnt));
		repo.write('master', "collection.json", JSON.stringify(jsonCnt), 'collection hotels json', function(err){console.log(err);});
		html = $("#collections").html();
		$("#collections").html(html + "<ul id='" + name + "' class='collection'>" + name + ":" + hotels + "</ul>");
	};

	var safeId = function(id,hotel){
		console.log(id);
		console.log(hotel);
		var github =  new Github({token:token,auth: "oauth"});
		var repo = github.getRepo(user, rep);
		var hl = jsonId[hotel];
		console.log(hl);
		if(hl.indexOf(id) === -1){
			hl.push(id);
			jsonId[hotel] = hl;
			console.log(hl);
			repo.write('master', "ids.json", JSON.stringify(jsonId), 'ids google+ hotels json', function(err){console.log(err);});
		};
	};

	var addHtl = function(){
		$("#addUser").click(function(){
			var id = $("#idG").val();
			var h = $("#hotelSel").html();
			if(id != ""){
				console.log("aqui guardamos");
				safeId(id,h);
				getUserHotels();
			}else{
				alert("empty input");
			};
		});
	};

	var addCollection = function(){
		$("#publish").click(function(){
			var htls = $("#hotelsSelected").html().split("<li>");
			htls.shift();
			htls = htls.join("");
			htls = htls.split('<button class="glyphicon glyphicon-remove"></button></li>');
			htls.pop();
			var cName = $("#collectionName").val();
			if(cName != "" && htls.length != 0){
				console.log("añadir");
				console.log(htls);
				console.log(cName);
				safeNew(cName,htls);
			}else{
				alert("empty input");
			};
		});
	};

	var getLocation = function(arrayHotels,nameH){
		var lat;
		var lon;
		$.each(arrayHotels, function(key,val){
			if(val.name === nameH){
				lat = val.lat;
				lon = val.lon;
			};
		});
		var location = [];
		location.push(lat);
		location.push(lon);
		return location;
	};

	var getPhotos = function(arrayHotels,nameH){
		var html = "<div class='carousel-inner' role='listbox'>";
		var first = true;
		var error = false;
		$.each(arrayHotels, function(key,val){
			if(val.name === nameH){
				if(val.photos === null){
					error = true;
					return true;
				};
				$.each(val.photos.media,function(key,val){
					if(val === null){
						error = true;
						return true;
					};
					if(first){
						first = false;
						html += "<div class='item active'><img src='" + val.url + "'></img></div>";
					}else{
						html += "<div class='item'><img src='" + val.url + "'></img></div>";
					};
				});
			};
		});
		if(error){
			$("#carrousel").html("<div class='item active'><img src=''></img></div>");
			return;
		};
		html += '<a class="left carousel-control" href="#carrousel" role="button" data-slide="prev">'
        html += '<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>'
        html += '<span class="sr-only">Previous</span></a>'  
        html +='<a class="right carousel-control" href="#carrousel" role="button" data-slide="next">'
        html +='<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>'
        html +='<span class="sr-only">Next</span></a>'
        html += "</div>";
		$("#carrousel").html(html);
	};

	var getInformation = function(){
		$(".names").click(function(data){
			$("#infor").html(bodies);
			$("#hotelSel").html($(this).html().split("<p>")[0]);
			name = "#" + $($(this).html().split("<p>")[0].replace(/ /gi,"-")).selector;
			$("#hotel-selected").html($(this).html().split("<p>")[0]);
			var location = getLocation(hotels,$(this).html().split("<p>")[0]);
			$("#hotelsMapSelected").html($("#hotelsMapSelected").html() + "<li>" + $(this).html().split("<p>")[0] + "</li>");
			$(name).removeAttr("hidden");
			getMap(location,name,map,true);
			getPhotos(hotels,$(this).html().split("<p>")[0]);
		});
	};

	var replaceInformation = function(name){
		$("#infor").html(bodies);
		$("#hotel-selected").html(name);
		$("#hotelSel").html(name);
		var location = getLocation(hotels,name);
		getPhotos(hotels,name);
		name = "#" + name.replace(/ /gi,"-");
		$(name).removeAttr("hidden");
	};

	/* --get jason-- */
	var main = function(){
		$.getJSON("alojamiento.json")
		.done(function(data){
			var names = [];
			var hotel;
			var menu = [];
			names.push("<div>");
    		console.log( "success" );
			$.each( data.serviceList.service, function( key, val ) {
				hotel = new Object();
				hotel.name = val.basicData.name;
				hotel.photos = val.multimedia;
				hotel.lat = val.geoData.latitude;
				hotel.lon = val.geoData.longitude;
				hotel.body = val.basicData.name.replace(/ /gi,"-");
				hotels.push(hotel);
				menu.push("<div class='draggable'>"+ val.basicData.name +"</div>");
				names.push("<div class='names'>" + val.basicData.name + "<p></p>"+ "</div>");
				bodies.push("<div id="+ val.basicData.name.replace(/ /gi,"-") +" hidden='hidden' class='h'>" + val.basicData.body + "</div>");
			});
			$("<div>",{
				html:menu.join(""),
				class:"drag-container",
			}).appendTo("#hotelsMenu"); 
			$("#hotelsSelected").droppable({
				over: function(event,ui){
					$(this).addClass("ui-state-highlight");
				},
				out: function(event,ui){
					$(this).removeClass("ui-state-highlight");
				},
				drop: function(event,ui){
					$(this).removeClass("ui-state-highlight");
					addHotel(ui.draggable.html());
				},
			});
			$( ".draggable" ).draggable({stack: "#hotelsSelected",revert:true});
			$("#scroll").html(names);
			getCollections();
			addHotel();
			removeHotel();
			addCollection();
			addHtl();
			getInformation();
			getUserHotels();
  		}).fail(function() {
    		alert("sorry cannot donwload page, please try another time");
  		});
	};

	/* --users id google +--*/
	var hotelSelected = function(){
		$(".hotel").click(function(){
			var hs = $(this).html().split(":")[1].split(",");
			console.log(hs);
			$.each(hs,function(key,val){
				getUser(val);
			});
		});
	};

	var getUserHotels = function(){
		var github =  new Github({token:token,auth: "oauth"});
		var repo = github.getRepo(user, rep);
		console.log("vamo a calmano");
		var gitAPI = "https://api.github.com/repos/" + user + "/" + rep + "/contents/ids.json"
		$.getJSON(gitAPI)
		.done(function(data){
			console.log("success");
			var content = atob(data.content);
			jsonId = JSON.parse(content);
			var hotels = [];
			$.each(jsonId, function(key,val){
				hotels.push("<ul id='" + key + " ids' class='hotel'>" + key + ":"+ val + "</ul>");
			});
			console.log($("#ghotels").html());
			$("#usersDown").html(hotels.join(""));
		}).fail(function(){
			console.log("cannot get resource");
		});
	};

	/* --map generate--*/
	var delMark = function(){
		var tempMarker = this;
		name = tempMarker._popup._content.split("<br>")[0].replace(/-/gi," ").replace(/#/gi,"");
		var html = $("#hotelsMapSelected").html();
		html = html.split("<li>");
		var index = html.indexOf(name+"</li>");
		html.splice(index,1);
		html.splice(0,1);
		$.each(html,function(key,val){
			html[key] = "<li>" + val;
		});
		html = "hoteles seleccionados en el mapa:" + html.join("");
		replaceInformation(name);
	    $(".marker-delete-button:visible").click(function () {
	        map.removeLayer(tempMarker);
	        $("#hotelsMapSelected").html(html);
	    });
	    
	};

	var getMap = function(location,name,m,bool){
		if(location[0] === undefined || location[1] === undefined){
			return;
		};
	    if(bool){
	    	marker = L.marker(location).addTo(m)
	    	.bindPopup(name + "<br><input type='button' value='Delete this marker' class='marker-delete-button'/>")
	    	.openPopup();
	    	m.setView(location, 15);
	    	marker.on("popupopen", delMark);
	    }else{
	    	marker = L.marker(location).addTo(m)
	    	.bindPopup(name)
	    	.openPopup();
	    	m.setView(location, 15);
	    }
	};

	var addAutocomple = function(id,tags){
		$("#" + id).autocomplete({
			source:tags,
			messages: {
	        noResults: '',
	        results: function() {}
   		}
		}).autocomplete("widget").addClass("autocomplete");
	};

	var initializeTags = function(tags){
		if(tags === null){
			tags = [];
		}else{
			tags = tags.split(",");
		};
	};

	/* --index toons--*/

$(document).ready(function(){
	alert("practica final");
	userAvailableTags = localStorage.getItem("gitUser");
	repoAvailableTags = localStorage.getItem("gitRepo");
	if(userAvailableTags === null){
			userAvailableTags = [];
	}else{
		userAvailableTags = userAvailableTags.split(",");
	};
	if(repoAvailableTags === null){
		repoAvailableTags = [];
	}else{
		repoAvailableTags = repoAvailableTags.split(",");
	};

	addAutocomple("ghb",userAvailableTags);
	addAutocomple("rp",repoAvailableTags);
	gapi.client.setApiKey(apiKey);
	map = L.map('map').setView([40.4175, -3.708], 11);
  	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  	}).addTo(map);

  	mapUser = L.map('map-user').setView([40.4175, -3.708], 11);
  	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  	}).addTo(mapUser);

  	$("#addMapToCollection").click(function(){
		var hm = $("#hotelsMapSelected").html().split("<li>");
		hm.splice(0,1);
		hm = hm.join("").split("</li>");
		console.log(hm);
		var html = $("#hotelsSelected").html() 
		html += "<li>" + hm.join("<button class='glyphicon glyphicon-remove'></button><li>");
		html = html.substring(0,(html.length-4));
		$("#hotelsSelected").html(html);
		removeHotel();
	});
	$("#deleteSelected").click(function(){
		console.log("borrar");
		$("#hotelsSelected").html("hoteles seleccionados:");
	});

	$("#reload-hotels").click(function(){
		console.log("aqui cargo el JSON");
		//main();
	});

	$("#mn").click(function(){
		$("#main").removeAttr("hidden");
		$("#user").attr("hidden","hidden");
		$("#gestion").attr("hidden","hidden");
		$("#ghotels").attr("hidden","hidden");
	});

	$("#gst").click(function(){
		$("#gestion").removeAttr("hidden");
		$("#user").attr("hidden","hidden");
		$("#main").removeAttr("hidden");
		$("#ghotels").attr("hidden","hidden");
	});

	$("#usr").click(function(){
		$("#user").removeAttr("hidden");
		$("#main").attr("hidden","hidden");
		$("#gestion").attr("hidden","hidden");
		$("#ghotels").attr("hidden","hidden");
		collectionSelected();
	});

	$("#gplus").click(function(){
		console.log("google+");
		$("#ghotels").removeAttr("hidden");
		$("#user").attr("hidden","hidden");
		$("#gestion").attr("hidden","hidden");
		$("#main").attr("hidden","hidden");
		hotelSelected();
	});

	$("#sg").click(function(){
		$("#sing-in").attr("hidden","hidden");
		$("#main").removeAttr("hidden");
		token = $("#tk").val();
		rep = $("#rp").val();
		user = $("#ghb").val();
		if(userAvailableTags.indexOf(user) === -1){
			userAvailableTags.push(user);
		};
		if(repoAvailableTags.indexOf(rep) === -1){
			repoAvailableTags.push(rep);
		};
		localStorage.setItem("gitUser",userAvailableTags);
		localStorage.setItem("gitRepo",repoAvailableTags);
		if(init === false){
			init = true;
			main();
		};
	});
	
	$("#so").click(function(){
		$("#sing-in").removeAttr("hidden");
		$("#main").attr("hidden","hidden");
		$("#gestion").attr("hidden","hidden");
		$("#ghotels").attr("hidden","hidden");
		$("#user").attr("hidden","hidden");
	});
	
});