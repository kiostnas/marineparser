export { GeoSpatial, Degree2Pixel };

export default class GeoSpatial {
	// https://gist.github.com/mathiasbynens/354587
	/*!
	* JavaScript function to calculate the destination point given start point latitude / longitude (numeric degrees), bearing (numeric degrees) and distance (in m).
	*
	* Original scripts by Chris Veness
	* Taken from http://movable-type.co.uk/scripts/latlong-vincenty-direct.html and optimized / cleaned up by Mathias Bynens <http://mathiasbynens.be/>
	* Based on the Vincenty direct formula by T. Vincenty, “Direct and Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations”, Survey Review, vol XXII no 176, 1975 <http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf>
	*/

	static toRad(n) {
		return n * Math.PI / 180;
	}

	static toDeg(n) {
		return n * 180 / Math.PI;
	}

	static destVincenty(lat1, lon1, brng, dist) {
		var a = 6378137,
		b = 6356752.3142,
		f = 1 / 298.257223563, // WGS-84 ellipsiod
		s = dist,
		alpha1 = GeoSpatial.toRad(brng),
		sinAlpha1 = Math.sin(alpha1),
		cosAlpha1 = Math.cos(alpha1),
		tanU1 = (1 - f) * Math.tan(GeoSpatial.toRad(lat1)),
		cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1,
		sigma1 = Math.atan2(tanU1, cosAlpha1),
		sinAlpha = cosU1 * sinAlpha1,
		cosSqAlpha = 1 - sinAlpha * sinAlpha,
		uSq = cosSqAlpha * (a * a - b * b) / (b * b),
		A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
		B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
		sigma = s / (b * A),
		sigmaP = 2 * Math.PI;
		while (Math.abs(sigma - sigmaP) > 1e-12) {
			var cos2SigmaM = Math.cos(2 * sigma1 + sigma),
				sinSigma = Math.sin(sigma),
				cosSigma = Math.cos(sigma),
				deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
			sigmaP = sigma;
			sigma = s / (b * A) + deltaSigma;
		};
		var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1,
			lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp)),
			lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1),
			C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha)),
			L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))),
			revAz = Math.atan2(sinAlpha, -tmp); // final bearing
		return {
			lat: GeoSpatial.toDeg(lat2),
			lng: lon1 + GeoSpatial.toDeg(L)
		};
	}

	static destination(lat, lng, bearing, distanceMeter) {
		// -- You can change this to other function if you want
		return GeoSpatial.destVincenty(lat, lng, bearing, distanceMeter);
	}

	/**
	 * return in km
	 * https://stackoverflow.com/questions/13840516/how-to-find-my-distance-to-a-known-location-in-javascript
	 * @param {*} lon1 
	 * @param {*} lat1 
	 * @param {*} lon2 
	 * @param {*} lat2 
	 */
	static distance(lon1, lat1, lon2, lat2) {
		var R = 6371; // Radius of the earth in km
		var dLat = GeoSpatial.toRad(lat2 - lat1);
		var dLon = GeoSpatial.toRad(lon2 - lon1);
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.cos(GeoSpatial.toRad(lat1)) * Math.cos(GeoSpatial.toRad(lat2)) * 
				Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var d = R * c; // Distance in km
		return d;
	}
}

class Degree2Pixel {
	// Always use [lat, lng], [x, y], can be confusing!! be careful!
	// -- Biggest - 111 km - 0
	// -- Smallest - 1.94 km - 89, 0 to 0

	constructor() {
		this.centerPos = [0, 0];
		this.widthToDegree = 1; // 1 degree is width(500)
		this.heightToDegree = 1; // 1 degree is height(500)
		this.mapSize = [500, 500];
		this.mapPixel = [250, 250];
		this.zoomLevel = 1;

		// -- 1 degree to km, set by calculateUnit
		this.xDistance = 111;
		this.yDistance = 111;

		this.setCenterPos([0, 0]);
		this.setDistance(1);
		this.setMapSize([500, 500]);
	}

	setCenterPos(pos) {
		if(2 !== pos.length) {
			console.error(`Invalid pos, should be 2 length array`);
			return;
		}

		if(90 < pos[0] || -90 > pos[0]) {
			console.error(`Latitude should be with in -90 ~ 90`);
			return;
		}

		if(180 < pos[1] || -180 > pos[1]) {
			console.error(`Longitude should be with in -180 ~ 180`);
			return;
		}

		// -- 1 degree to km
		const xdis = GeoSpatial.distance(pos[1], pos[0], pos[1] + 1, pos[0]);
		const ydis = GeoSpatial.distance(pos[1], pos[0], pos[1], pos[0] + 1);

		this.xDistance = xdis;
		this.yDistance = ydis;

		this.centerPos = pos;

		this.calculateUnit();
	}

	setMapSize(sizes) {
		if(2 !== sizes.length) {
			console.error(`Map size should be 2 length array, width, height`);
			return;
		}

		if(0 >= sizes[0] || 0 >= sizes[1]) {
			console.error(`Invalid size, should be bigger than zero!`);
			return;
		}

		this.mapSize = sizes;
		this.mapPixel = [sizes[0] / 2, sizes[1] / 2];

		this.calculateUnit();
	}

	// -- Do not call from outside, just use zoom
	setDistance(degree) {
		this.heightToDegree = degree;
		this.widthToDegree = degree / (this.yDistance / this.xDistance); // keep ratio
		// 111 to 1.9

		this.calculateUnit();
	}

	calculateUnit() {
		// -- Unit, 1pixel to distance
		const xUnit = this.mapSize[0] / this.widthToDegree;
		const yUnit = this.mapSize[1] / this.heightToDegree;

		this.xUnit = xUnit;
		this.yUnit = yUnit;
	}

	/**
	 * from a to b, a is the base
	 * positive : a b order
	 * negative : b a order
	 * a : 90, b : 89, -1
	 * a : 179, b : -179, 2
	 * a : -179, b : 179, -2
	 * a : -179, b : -178, 1
	 **/
	static DiffX(a, b) {
		let r = 0;

		r = b - a;

		if(0 > a && b > 0) {
			r = (180 + a) + (180 - b);
			r = r * -1;
		} else if(0 < a && b < 0) {
			r = (180 - a) + (180 + b);
		}

		return r;
	}

	/**
	 * from a to b, a is base
	 * positibe : b is below a
	 * negative : b is above a
	 **/
	static diffY(a, b) {
		return (b - a) * -1;
	}

	// return [x, y], argument [lat, lng]
	getPixel(pos) {
		return [this.getPixelLng(pos[1]), this.getPixelLat(pos[0])];
	}

	getPixelLat(lat) {
		const dy = Degree2Pixel.diffY(this.centerPos[0], lat);
		return ~~(this.mapPixel[1] + dy * this.yUnit);
	}

	getPixelLng(lng) {
		const dx = Degree2Pixel.DiffX(this.centerPos[1], lng);
		return ~~(this.mapPixel[0] + dx * this.xUnit);
	}

	getInfo() {
		const list = [];
		list.push(`Size of box : w * h - ${this.mapSize[0]} * ${this.mapSize[1]} pixel`);
		list.push(`Width / Height to 1 Degree at [${this.centerPos[0]}, ${this.centerPos[1]}] : ${this.xDistance} / ${this.yDistance}`);
		list.push(`ZoomLevel : ${this.zoomLevel}`);
		return list;
	}

	calculateZoomDistance() {
		this.setDistance(Math.pow(10, (this.zoomLevel / 10)));
	}

	zoom(value) {
		if(isNaN(value)) {
			return;
		}

		this.zoomLevel = value;
		this.calculateZoomDistance();
	}

	zoomOut() {
		this.zoomLevel = this.zoomLevel + 1;
		this.calculateZoomDistance();
	}

	zoomIn() {
		this.zoomLevel = this.zoomLevel - 1;
		this.calculateZoomDistance();
	}
}

/**
 * const d2pZoom = new Degree2Pixel();
 * d2pZoom.zoom(-10);
 * d2pZoom.setCenterPos([38, 128]]);
 * d2pZoom.setMapSize([400, 400]);
 * 
 * const xy = d2pZoom.getPixel([39, 129]);
 */