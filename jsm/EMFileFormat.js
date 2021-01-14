import EndianDataView from './EndianDataView.js';
import GeoSpatial from './GeoSpatial.js';
import MPLog from './MPLog.js';

// -- Class order critical
export {EMEndianDataView, EMParamInstall, EMParamRuntime, EMPosition, EMXYZ88, EMAll};

// -- User custom class for post processing
export {EMAllBatch2020};

class EMEndianDataView extends EndianDataView {
	saveDetail(parsedDetail) {
		super.saveDetail(parsedDetail);
		this.parsedDetail.typeTitle = EMAll.getTypeTitle(parsedDetail.type);
	}

	getTimestamp() {
		if(this.parsedDetail.date && this.parsedDetail.time) {
			const date = this.parsedDetail.date;
			const time = this.parsedDetail.time;

			const year = parseInt(date / 10000);
			const month = parseInt(date / 100 % 100);
			const day = parseInt(date % 100);
			const timeS = parseInt(time / 1000);
			const hour = parseInt(timeS / 60 / 60);
			const minute = parseInt(timeS / 60 % 60);
			const second = parseInt(time / 1000 % 60);
			const ms = parseInt(time % 1000);

			// -- second is different from the manual, mine is 1s earlier
			// TODO check Kongsberg reply
	
			const str = `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms}`;
	
			return new Date(str);
		} else {
			return false;
		}
	}
}

class EMParamInstall extends EMEndianDataView {
	static STRUCT_INSTALL = {
		length: 'U4',
		stx: 'U1',
		type: 'U1',
		model: 'U2',
		date: 'U4',
		time: 'U4',
		lineNo: 'U2',
		serial: 'U2',
		serial2ndSonar: 'U2',
	}

	parseDetail() {
		const r = this.parse(EMParamInstall.STRUCT_INSTALL, 0);
		const asciiOffset = this.parseOffset;
		const endAsciiOffset = EMAll.getTailOffset(r.length);
		const t = this.parse(EMAll.STRUCT_TAIL, endAsciiOffset);

		const str = this.toAsciiString(asciiOffset, endAsciiOffset);

		// -- Merge to the r
		r.params = str;
		r.etx = t.etx;
		r.checksum = t.checksum;

		// -- Save to parsedDetail
		this.saveDetail(r);

		return r;
	}
}

class EMParamRuntime extends EMEndianDataView {
	static STRUCT_RUNTIME = {
		length: 'U4',
		stx: 'U1',
		type: 'U1',
		model: 'U2',
		date: 'U4',
		time: 'U4',
		pingCounter: 'U2',
		serial: 'U2',
		operatorStationStatus: 'U1',
		PUStatus: 'U1',
		BSPStatus: 'U1',
		SHTStatus: 'U1', // Sonar head or transceiver status
		mode: 'U1',
		filterID: 'U1',
		minDepth: 'U2', // meter
		maxDepth: 'U2', // meter
		absorbCoef: 'U2', // meter 0.01dB/km
		txPulseLen: 'U2', // micro-seconds
		txBeamWidth: 'U2', // 0.1 degrees
		txPower: 'I1', // transmit power re maximum in dB
		rxBeamWidth: 'U1', // 0.1 degrees
		rxBandwidth: 'U1', // 50Hz
		rxGain: 'U1', // dB
		TVGLawAng: 'U1', // TVG law crossover angle in degrees
		srcSS: 'U1', // Source of sound speed at transducer
		maxPortSwath: 'U2', // Maximum port swath width in m
		beamSpacing: 'U1',
		maxPortCoverage: 'U1', // degrees
		yawPitchStable: 'U1', // Yaw and pitch stabilization mode
		maxSTBDCoverage: 'U1',
		maxSTBDSwath: 'U2', // meter
		txTiltValue: 'I2', // Transmit along tilit in 0.1d
		filterID2: 'U1',
		etx: 'U1',
		checksum: 'U2'
	}

	// -- TODO Later on
	static STRUCT_RUNTIME_DESC = {
		type: "0x52 'R'untime parameter",
		pingCounter: '0 ~ 65535',
		serial: '100 ~',

	}

	parseDetail() {
		const r = this.parse(EMParamRuntime.STRUCT_RUNTIME, 0);

		// -- Save to parsedDetail
		this.saveDetail(r);

		return r;
	}
}

class EMPosition extends EMEndianDataView {
	static STRUCT_POSITION = {
		length: 'U4',
		stx: 'U1',
		type: 'U1',
		model: 'U2',
		date: 'U4',
		time: 'U4',
		positionCounter: 'U2',
		serial: 'U2',
		lat: 'I4',
		lng: 'I4',
		measurePosFixQ: 'U2',
		speed: 'U2',
		course: 'U2',
		heading: 'U2',
		posSysDesc: 'U1',
		numInput: 'U1'
	}

	parseDetail() {
		const r = this.parse(EMPosition.STRUCT_POSITION, 0);
		const asciiOffset = this.parseOffset;
		const endAsciiOffset = EMAll.getTailOffset(r.length);
		const t = this.parse(EMAll.STRUCT_TAIL, endAsciiOffset);

		const str = this.toAsciiString(asciiOffset, endAsciiOffset);

		// -- Merge to the r
		r.positionInput = str;
		r.etx = t.etx;
		r.checksum = t.checksum;

		// -- Save to parsedDetail
		this.saveDetail(r);

		return r;
	}

	getLatLng() {
		return {
			lat: this.parsedDetail.lat / 20000000,
			lng: this.parsedDetail.lng / 10000000
		}
	}

	getPositionStr() {
		const pos = this.getLatLng();
		return `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
	}
}

class EMXYZ88 extends EMEndianDataView {
	static STRUCT_XYZ_HEAD = {
		length: 'U4',
		stx: 'U1',
		type: 'U1',
		model: 'U2',
		date: 'U4',
		time: 'U4',
		pingCounter: 'U2',
		serial: 'U2',
		heading: 'U2',
		ss: 'U2',
		txTRDepth: 'F4', // meter
		numBeams: 'U2',
		numValid: 'U2',
		freq: 'F4', // Hz, Sampling frequency
		info: 'U1', // Scanning info
		spare01: 'U1',
		spare02: 'U1',
		spare03: 'U1',
	}

	static STRUCT_XYZ_BODY = {
		z: 'F4', // Depth
		y: 'F4', // Acrosstrack, STBD Port
		x: 'F4', // Alongtrack, Stern Ahead
		windowLen: 'U2',
		QFac: 'U1',
		angAdj: 'I1',
		dInfo: 'U1', // Detection information
		cInfo: 'I1', // real time Cleaning information
		reflectivity: 'I2', // 0.1dB
	}

	static STRUCT_XYZ_TAIL = {
		spare04: 'U1',
		etx: 'U1',
		checksum: 'U2'
	}

	parseDetail() {
		const r = this.parse(EMXYZ88.STRUCT_XYZ_HEAD, 0);
		r.body = [];
		for(let idx = 0; idx < r.numBeams; idx++) {
			const b = this.parse(EMXYZ88.STRUCT_XYZ_BODY);
			r.body.push(b);
		}
		
		const t = this.parse(EMXYZ88.STRUCT_XYZ_TAIL);

		// -- Merge to the r
		// -- no need to merge spare04
		r.etx = t.etx;
		r.checksum = t.checksum;

		// -- Save to parsedDetail
		this.saveDetail(r);

		return r;
	}

	parseWithPosition() {
		const pos = this.referencedPos;
		
		if(!pos) {
			return false;
		}

		const xyzResult = [];
		this.parsedDetail.body.forEach((item) => {
			const xyz = this.calcPosWithXYZ(item);
			xyzResult.push(xyz);
		});

		return xyzResult;
	}

	// -- Calculate each body, return lat, lng, z
	calcPosWithXYZ(bodyObj) {
		const pos = this.referencedPos;
		
		if(!pos) {
			return false;
		}

		const latLng = pos.getLatLng();
		const heading = this.parsedDetail.heading / 100;
		const pos1 = GeoSpatial.destination(latLng.lat, latLng.lng, heading, bodyObj.x);
		const pos2 = GeoSpatial.destination(pos1.lat, pos1.lng, heading + 90, bodyObj.y);

		pos2.z = bodyObj.z + this.parsedDetail.txTRDepth;

		return pos2;
	}
}

// -- Old xyz with em2000, em3000, em 3002, em1002, em300, em120
class EMDepthDatagram extends EMEndianDataView {
	static STRUCT_DD_HEAD = {
		length: 'U4',
		stx: 'U1',
		type: 'U1',
		model: 'U2',
		date: 'U4',
		time: 'U4',
		pingCounter: 'U2',
		serial: 'U2',
		heading: 'U2',
		ss: 'U2',
		txTRDepth: 'U2', // cm : 14000 ~ 16000
		maxNumBeams: 'U1', // maximum number of beams possible, 48 ~
		numValid: 'U1', // 1 ~ 254
		zRes: 'U1', // z Resolution in cm 1 ~ 254
		xyRes: 'U1', // x and y resolution in cm 1 ~ 254
		freq: 'U2', // Sampling rate in Hz 300 ~ 30000 or Depth diff between sonar heads in EM3000(S2)
	}

	static STRUCT_DD_BODY = {
		z: 'U2', // Depth, Unsigned 2 bytes for EM120, EM300, others Signed 2 bytes
		y: 'I2', // Acrosstrack, STBD Port
		x: 'I2', // Alongtrack, Stern Ahead
		beamDeprAng: 'I2', // Beam depression angle in 0.01, -11000 ~ 11000
		beamAzimAng: 'U2', // Beam azimuth angle in 0.01, 0 ~ 56999
		range: 'U2', // one way travle time, 0 ~ 65534
		QFac: 'U1',
		len: 'U1', // length of detection window (samples/4) 1 ~ 254
		reflectivity: 'I1', // 0.5dB, -20dB = 216
		beamNum: 'U1' // Beam number 1 ~ 254
	}

	static STRUCT_DD_TAIL = {
		depthOffsetM: 'I1', // transducer depth offset multiplier, -1 ~ +17
		etx: 'U1',
		checksum: 'U2'
	}

	parseDetail() {
		const r = this.parse(EMDepthDatagram.STRUCT_DD_HEAD, 0);
		r.body = [];
		 // -- manual says no info about looping
		for(let idx = 0; idx < r.numValid; idx++) {
			const b = this.parse(EMDepthDatagram.STRUCT_DD_BODY);
			r.body.push(b);
		}
		
		const t = this.parse(EMDepthDatagram.STRUCT_DD_TAIL);

		// -- Merge to the r
		// -- no need to merge spare04
		r.etx = t.etx;
		r.checksum = t.checksum;

		// -- Save to parsedDetail
		this.saveDetail(r);

		return r;
	}

	parseWithPosition() {
		const pos = this.referencedPos;
		
		if(!pos) {
			return false;
		}

		const xyzResult = [];
		this.parsedDetail.body.forEach((item) => {
			const xyz = this.calcPosWithXYZ(item);
			xyzResult.push(xyz);
		});

		return xyzResult;
	}

	// -- Calculate each body, return lat, lng, z
	calcPosWithXYZ(bodyObj) {
		const pos = this.referencedPos;
		
		if(!pos) {
			return false;
		}

		const latLng = pos.getLatLng();
		const heading = this.parsedDetail.heading / 100;
		const pos1 = GeoSpatial.destination(latLng.lat, latLng.lng, heading, bodyObj.x / 100);
		const pos2 = GeoSpatial.destination(pos1.lat, pos1.lng, heading + 90, bodyObj.y / 100);

		pos2.z = (bodyObj.z / 100) + this.parsedDetail.txTRDepth;

		return pos2;
	}
}


/**
 * Rule for abbrevation
 * Transmit : TX
 * Receive : RX
 * Transducer : TR
 * Sound Speed : ss
 * Factor : fac
 * Describe, Description : desc
 * quality : Q
 * latitude : lat
 * longitude : lng
 * Position : pos
 * number, numbers : num
 * StarBoard: STBD
 * Identify, Identifier : ID
 * Angle : ang
 * First : 1st
 * Second : 2nd
 * Length : len
 * Adjust Adjustment : adj
 **/

class EMAll extends EMEndianDataView {
	static BYTE_LENGTH = 4;
	static DATAGRAM_TYPES = {
		0x49: {title: 'Install Start', cls: EMParamInstall},
		0x69: {title: 'Install Stop', cls: EMParamInstall},
		0x70: {title: 'Install Remote', cls: EMParamInstall},
		0x52: {title: 'Runtime',  cls: EMParamRuntime},
		0x58: {title: 'XYZ88',  cls: EMXYZ88},
		0x4B: {title: 'Central Beams', cls: null},
		0x46: {title: 'Raw range and Beam angle', cls: null},
		0x66: {title: 'Raw range and Beam angle F', cls: null},
		0x4e: {title: 'Raw range and angle 78', cls: null},
		0x53: {title: 'Seabed image', cls: null},
		0x59: {title: 'Seabed image 89', cls: null},
		0x6B: {title: 'Water column', cls: null},
		0x4f: {title: 'Quality factor 79', cls: null},
		0x41: {title: 'Attitude', cls: null},
		0x6E: {title: 'Network attitude velocity', cls: null},
		0x43: {title: 'Clock', cls: null},
		0x68: {title: 'Depth or height', cls: null},
		0x48: {title: 'Heading', cls: null},
		0x50: {title: 'Position', cls: EMPosition},
		0x45: {title: 'Single beam echo sounder depth', cls: null},
		0x54: {title: 'Tide', cls: null},
		0x47: {title: 'Surface sound speed', cls: null},
		0x55: {title: 'Sound speed profile', cls: null},
		0x57: {title: 'Kongberg Maritime SSP output', cls: null},
		0x4A: {title: 'Mechanical transducer tilt', cls: null},
		0x33: {title: 'Extra parameters 3', cls: null},
		0x30: {title: 'PU ID output', cls: null},
		0x31: {title: 'PU Status output', cls: null},
		0x42: {title: 'PU BIST result output', cls: null},
		0x44: {title: 'Depth datagram', cls: EMDepthDatagram} // -- Onnuri data got no XYZ88 but this
	};

	// -- General Tail
	static STRUCT_TAIL = {
		etx: 'U1',
		checksum: 'U2'
	}

	static BYTE_STRUCT_TAIL = 3;

	static getTailOffset(sectionLength) {
		return sectionLength + EMAll.BYTE_LENGTH - EMAll.BYTE_STRUCT_TAIL;
	}

	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.setLittleEndian(true);

		this.parseOffset = 0;
		this.parsedObj = undefined;
	}

	static getTypeTitle(uint8) {
		const t = EMAll.getType(uint8);
		if(t) {
			return t.title;
		}

		return false;
	}

	static getType(uint8) {
		if(EMAll.DATAGRAM_TYPES.hasOwnProperty(uint8)) {
			return EMAll.DATAGRAM_TYPES[uint8];
		}

		return false;
	}

	parseBrief(startOffset) {
		const map = {
			length: 'U4',
			stx: 'U1',
			type: 'U1'
		};

		const r = this.parse(map, startOffset);
		r.typeTitle = EMAll.getTypeTitle(r.type);

		this.saveBrief(r);

		return r;
	}

	batchSplitDataGrams() {
		let offset = 0, i = 0;

		const typesCount = {
			invalid: {}
		};

		while(offset < this.byteLength) {
			const r = this.parseBrief(offset);
			const t = EMAll.getType(r.type);

			// -- Count for types
			if(false === r.typeTitle) {
				if(!typesCount['invalid'][r.type]) {
					typesCount['invalid'][r.type] = 0;
				}

				typesCount['invalid'][r.type]++;
			} else {
				if(typesCount[r.typeTitle]) {
					typesCount[r.typeTitle]++;
				} else {
					typesCount[r.typeTitle] = 1;
				}
			}

			offset = offset + r.length + EMAll.BYTE_LENGTH;

			i++;
		}

		return {
			type: typesCount,
			count: i
		}
	}
}

// -- Custom class for each user, this is just example
class EMAllBatch2020 extends EMAll {
	batchSplitDataGrams() {
		let offset = 0;

		let i = 0;
		const list = [];
		const typesCount = {
			invalid: {}
		};

		// -- XYZ, Position
		this.listXYZ = [];
		this.listDD = []; // -- Old format
		this.listPosition = [];

		while(offset < this.byteLength) {
			const r = this.parseBrief(offset);
			const t = EMAll.getType(r.type);

			// -- Count for types
			if(false === r.typeTitle) {
				if(!typesCount['invalid'][r.type]) {
					typesCount['invalid'][r.type] = 0;
				}

				typesCount['invalid'][r.type]++;
			} else {
				if(typesCount[r.typeTitle]) {
					typesCount[r.typeTitle]++;
				} else {
					typesCount[r.typeTitle] = 1;
				}
			}

			if(t.cls) {
				const instance = new t.cls(this.buffer, offset, r.length + EMAll.BYTE_LENGTH);
				instance.setLittleEndian(this.littleEndian);
				const detail = instance.parseDetail();

				// -- XYZ
				if(0x58 === detail.type) {
					this.listXYZ.push(instance);
				} else if(0x44 === detail.type) {
					this.listDD.push(instance);
				} else if(0x50 === detail.type) {
					this.listPosition.push(instance);
				}
			}

			// console.log(r);
			offset = offset + r.length + EMAll.BYTE_LENGTH;

			// console.log(`offset ${offset}`);
			i++;
		}

		return typesCount;
	}

	findNearestPosition(date, time) {
		let closestAbs = 999999999;
		let closestItem = null;
		for(let i = 0; i < this.listPosition.length; i++) {
			const pos = this.listPosition[i];
			if(pos.parsedDetail.date !== date) {
				continue;
			}

			const abs = Math.abs(time - pos.parsedDetail.time);
			if(abs < closestAbs) {
				closestAbs = abs;
				closestItem = pos;
			}
		}

		return closestItem;
	}

	// -- this.listXYZ -> item.referencedPos = EMPosition (closest time)
	referenceXYZWithPosition() {
		const src = this.getXYZSource();

		src.forEach((xyz, key) => {
			const pos = this.findNearestPosition(xyz.parsedDetail.date, xyz.parsedDetail.time);
			xyz.referencedPos = pos;
		});
	}


	getMinMaxXYZ() {
		let minLat = 360, maxLat = -360;
		let minLng = 360, maxLng = -360;
		let minZ = 100000, maxZ = -1;

		// -- Loop over
		const src = this.getXYZSource();
		src.forEach((item) => {
			item.xyz.forEach((xyz) => {
				// xyz.lat
				// xyz.lng
				// xyz.z
				if(xyz.lat < minLat) {
					minLat = xyz.lat;
				}
				if(xyz.lat > maxLat) {
					maxLat = xyz.lat;
				}
				if(xyz.lng < minLng) {
					minLng = xyz.lng;
				}
				if(xyz.lng > maxLng) {
					maxLng = xyz.lng;
				}
				if(xyz.z < minZ) {
					minZ = xyz.z;
				}
				if(xyz.z > maxZ) {
					maxZ = xyz.z;
				}
			})
		});

		return {
			lat: {min: minLat, max: maxLat},
			lng: {min: minLng, max: maxLng},
			z: {min: minZ, max: maxZ}
		}
	}

	// -- min max and xyz(lat, lng, z) list
	getShrinkXYZ() {
		let minLat = 360, maxLat = -360;
		let minLng = 360, maxLng = -360;
		let minZ = 100000, maxZ = -1;

		const list = [];

		// -- Loop over
		const src = this.getXYZSource();
		src.forEach((item) => {
			const line = [];
			item.xyz.forEach((xyz) => {
				// xyz.lat
				// xyz.lng
				// xyz.z
				if(xyz.lat < minLat) {
					minLat = xyz.lat;
				}
				if(xyz.lat > maxLat) {
					maxLat = xyz.lat;
				}
				if(xyz.lng < minLng) {
					minLng = xyz.lng;
				}
				if(xyz.lng > maxLng) {
					maxLng = xyz.lng;
				}
				if(xyz.z < minZ) {
					minZ = xyz.z;
				}
				if(xyz.z > maxZ) {
					maxZ = xyz.z;
				}
				line.push([xyz.lat, xyz.lng, xyz.z]);
			})
			list.push(line);
		});

		return {
			lat: {min: minLat, max: maxLat},
			lng: {min: minLng, max: maxLng},
			z: {min: minZ, max: maxZ},
			xyz: list
		}
	}
	
	getXYZSource() {
		const src = this.listXYZ.length > 0 ? this.listXYZ : this.listDD;
		return src;
	}

	// -- TODO Later on
	static binSearch(arr, val) {
		let start = 0;
		let end = arr.length - 1;

		while (start <= end) {
			let mid = Math.floor((start + end) / 2);

			if (arr[mid] === val) {
				return mid;
			}

			if (val < arr[mid]) {
				end = mid - 1;
			} else {
				start = mid + 1;
			}
		}
		
		// -- closest
		return end; // -- end === start
	}
	
	// -- Batch works
	// -- this can be changed or removed
	// -- reference it and make your own code
	batch20200607() {
		console.log(new Date());
		const types = this.batchSplitDataGrams();
		console.log('Count Types')
		console.log(types);
		console.log(new Date());
		this.referenceXYZWithPosition();
		console.log(new Date());
		this.getXYZSource().forEach((item) => {
			item.xyz = item.parseWithPosition();
		});
		console.log(new Date());

		console.log(this.getXYZSource());

		const minMax = this.getMinMaxXYZ();

		console.log(minMax);

		return minMax;
	}

	batch20201109() {
		const ts = new MPLog();
		ts.now('start');
		const types = this.batchSplitDataGrams();
		ts.now('batch split');
		this.referenceXYZWithPosition();
		ts.now('reference XYZ');
		this.getXYZSource().forEach((item) => {
			item.xyz = item.parseWithPosition();
		});
		ts.now('parse with position xyz');

		const minMax = this.getMinMaxXYZ();

		ts.now('minmax');

		console.log(types);
		ts.outconsole();

		const result = {
			types: types,
			minmax: minMax
		}

		return result;
	}

	batch20210114() {
		const ts = new MPLog();
		ts.now('start');
		const types = this.batchSplitDataGrams();
		ts.now('batch split');
		this.referenceXYZWithPosition();
		ts.now('reference XYZ');
		this.getXYZSource().forEach((item) => {
			item.xyz = item.parseWithPosition();
		});
		ts.now('parse with position xyz');

		const shrink = this.getShrinkXYZ();
		const minMax = {
			lat: [shrink.lat.min, shrink.lat.max],
			lng: [shrink.lng.min, shrink.lng.max],
			z: [shrink.z.min, shrink.z.max],
		};

		ts.now('minmax');

		console.log(types);
		ts.outconsole();

		const result = {
			types: types,
			minMax: minMax,
			xyz: shrink.xyz
		}

		return result;
	}
}

// export {EMParamInstall, EMParamRuntime, EMPosition, EMXYZ88, EMAll};
// export class EMParamInstall;