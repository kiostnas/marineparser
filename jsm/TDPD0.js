import EndianDataView from './EndianDataView.js';

export { TDPD0, PD0, PD0Header, PD0Fixed, PD0Variable };

// -- Only one PD0
// -- parsedBrief - header
// -- parsedDetail [fixed, variable, velocity...]
// extending PD0 is only for LittleEndian !!!!
class PD0 extends EndianDataView {
	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.setLittleEndian(true);
	}

	parseBrief() {
		// -- parse header only
		const header = new PD0Header(this.buffer, this.byteOffset, this.byteLength);
		header.parseDetail();

		this.saveBrief(header.parsedDetail);
	}

	parseDetail() {
		// -- parse other lists
		this.parsedDetail = [];

		if (!this.parsedBrief) {
			console.error(`PD0 has no parsedBrief, can not proceed to parse`);
			return false;
		}

		for (let index = 0; index < this.parsedBrief.offsets.length; index++) {
			const item = this.parsedBrief.offsets[index];

			// -- unregistered type, ignored
			if (!item.obj) {
				continue;
			}

			// -- unregistered class, ignored
			if (!item.obj.cls) {
				continue;
			}

			const instance = new item.obj.cls(this.buffer, this.byteOffset + item.offsetRel, item.size);
			instance.setLittleEndian(this.littleEndian);
			instance.parseDetail();
			instance.title = item.obj.title;

			this.parsedDetail.push(instance);
		}
	}

	parseVelocity2D() {
		const fixedInstance = this.getByHID(TDPD0.HID.FIXED);
		const velocityInstance = this.getByHID(TDPD0.HID.VELOCITY);

		const r = velocityInstance.parseVelocity2D(fixedInstance.parsedDetail.coordParsed.type);
		// -- r maybe false
	}

	// -- Returning results, hid is object type TDPD0.HID.CORR
	getByHID(hid) {
		if('object' !== typeof hid) {
			return false;
		}

		if(!this.getDetail()) {
			return false;
		}

		const code = hid.code;

		return this.getDetail().find(item => code === item.getDetail().hID);
	}

	// -- Delegate from variable leader
	getTimestamp() {
		const v = this.getByHID(TDPD0.HID.VARIABLE);
		if(v) {
			return v.getTimestamp();
		}

		return false;
	}
}

class PD0Header extends PD0 {
	static HEADER = new Map([
		['hID', 'U1'], // fixed 7F
		['srcID', 'U1'], // fixed 7F
		['noBytesEns', 'U2'],
		['spare01', 'U1'],
		['noDataTypes', 'U1'],
	]);

	parseDetail() {
		const me = this;

		this.setParseOffset(0);

		// -- Header
		const header = this.parse(PD0Header.HEADER);
		const offsetDataType = [], offsetAbsolute = [];

		for (let i = 0; i < header.noDataTypes; i++) {
			const relativeOffset = this.getUint16(this.parseOffset);
			offsetDataType.push({ offsetRel: relativeOffset });
			this.addParseOffset(2);
		}

		header.offsets = offsetDataType;

		// -- Save obj.size = totalSize - thisObj.offset;
		// -- Save lastObj.size = thisObj.offset - lastObj.offset; -- overwrite
		let lastObj = undefined;
		offsetDataType.forEach((obj) => {
			// -- Calculating header size
			obj.size = header.noBytesEns + 2 - obj.offsetRel;
			if (lastObj) {
				const size = obj.offsetRel - lastObj.offsetRel;
				lastObj.size = size;
			}
			lastObj = obj

			// -- Predefined type check
			const hid = me.getUint16(obj.offsetRel);
			const objHID = TDPD0.JudgetHID(hid);
			if (!objHID) {
				// -- Takes too long
				console.error(`Invalid HID 0x${hid.toString(16)}`);
			}
			obj.obj = objHID;
		});

		this.saveDetail(header);
	}

}


class PD0Fixed extends PD0 {
	static FIXED_LEADER = new Map([
		['hID', 'U2'], // -- Should be 0
		['fwVer', 'U1'],
		['fwRev', 'U1'],
		['sysCfg', 'U2'],
		['flagSim', 'U1'], // Real / Sim flag
		['lagLen', 'U1'], // Lag length
		['noBeams', 'U1'], // Number of beams
		['noCells', 'U1'], // [WN] number of cells
		['pingsPEns', 'U2'], // [WP] Pings per ensemble 
		['dptCellLen', 'U2'], // [WS] Depth cell length
		['blankTrans', 'U2'], // [WF] Blank After transmit
		['profMode', 'U1'], // [WM] Profiling mode
		['lowCorrThresh', 'U1'], // [WC] Low corr thresh
		['noCodeReps', 'U1'], // No. Code Reps
		['PGMin', 'U1'], // [WG] %GD Minimum
		['EVMax', 'U2'], // [WE] Error Velocity Maximum
		['TPPm', 'U1'], // TPP Minutes
		['TPPs', 'U1'], // TPP Seconds
		['TPPHund', 'U1'], // [TP] TPP Hundredths
		['coordTransf', 'U1'], // [EX] Coordinate transform
		['hdtAli', 'U2'], // [EA] Heading Alignment, degree
		['hdtBias', 'U2'], // [EB] Heading Bias, degree
		['sensorSrc', 'U1'], // [EZ] Sensor Source
		['sensorsAvail', 'U1'], // Sensors Available
		['bin1Dist', 'U2'], // Bin 1 Distance
		['xmitPulseLen', 'U2'], // [WT] XMIT pulse length based on
		['WPRefAvg', 'U2'], // [WL] (starting cell) WP Ref layer average (ending cell)
		['falseTgtThresh', 'U1'], // [WA] False target thresh
		['spare02', 'U1'], // Spare
		['transLagDist', 'U2'], // Transmit lag distance
		['cpuSerial', 'U8'], // 43 ~ 50 byte
		['sysBandwidth', 'U2'], // [WB] System bandwidth
		['sysPwr', 'U1'], // [CQ] System power
		['spare03', 'U1'], // Spare
		['insSerial', 'U4'], // 55 ~ 58 byte
		['beamAngle', 'U1'], // Beam angle
	]);

	static SYSTEM = [
		[0, '75kHz'],
		[0b001, '150kHz'],
		[0b010, '300kHz'],
		[0b011, '600kHz'],
		[0b100, '1200kHz'],
		[0b101, '2400kHz'],
		[0b110, '38kHz'], // -- not on the manual but my file says its 6
	];

	static COORD = [
		[0b00000, 'No transformation'],
		[0b01000, 'Instrument coordinates'],
		[0b10000, 'Ship coordinates'],
		[0b11000, 'Earth coordinate'],
	];

	static SENSOR_SRC = [
		[0b01000000, 'Calculates EC (Speed of sound) from ED, ES, ET'],
		[0b00100000, 'Uses ED from depth sensor'],
		[0b00010000, 'Uses EH from transducer heading sensor'],
		[0b00001000, 'Uses EP from transducer pitch sensor'],
		[0b00000100, 'Uses ER from transducer roll sensor'],
		[0b00000010, 'Uses ES (Salinity) from transducer conductivity sensor'],
		[0b00000001, 'Uses ET from transducer temperature sensor'],
	];

	static ParseCoordTransform(byte) {
		const type = byte & 0b00011000;
		const tilt = byte & 0b0100;
		const beam3 = byte & 0b10;
		const binMapping = byte & 0b01;

		const typeObj = PD0Fixed.COORD.find(o => o[0] === type);
		const typeParsed = typeObj ? typeObj[1] : PD0.UNHANDLED_STR + ` value : ${type}`;
		const tiltBool = 0 < tilt;
		const tiltStr = tiltBool ? 'Tilt pitch roll used' : 'Tilt pitch roll not used';
		const beam3Bool = 0 < beam3;
		const beam3Str = beam3Bool ? '3-Beam solution used' : '3-Beam solution not used';
		const binMappingBool = 0 < binMapping;
		const binMappingStr = binMappingBool ? 'Bin mapping used' : 'Bin mapping not used';

		const r = {
			type: type,
			typeStr: typeParsed,
			tilt: tiltBool,
			tiltStr: tiltStr,
			beam3: beam3Bool,
			beam3Str: beam3Str,
			binMapping: binMappingBool,
			binMappingStr: binMappingStr
		};

		return r;
	}

	static ParseSysConfig(word) {
		const lo = (word & 0xFF);
		const hi = (word & 0xFF00) >> 8;
		
		// -- Low
		const system = lo & 0b00000111;
		const conBeamPat = lo & 0b1000;
		const sensorCfg = lo & 0b110000;
		const xdcr = lo & 0b1000000;
		const beamFace = lo & 0b10000000;

		const systemObj = PD0Fixed.SYSTEM.find(o => o[0] === system);
		const systemStr = systemObj ? systemObj[1] : PD0.UNHANDLED_STR + ` value : ${system.toString(2)}`;
		const conBeamPatStr = 0 < conBeamPat ? 'CONVEX BEAM PAT' : 'CONCAVE BEAM PAT';
		let sensorCfgStr = PD0.UNHANDLED_STR;

		if(0b000000 === sensorCfg) {
			sensorCfgStr = 'Sensor Config 1';
		} else if(0b010000 === sensorCfg) {
			sensorCfgStr = 'Sensor Config 2';
		} else if(0b100000 === sensorCfg) {
			sensorCfgStr = 'Sensor Config 3';
		}

		const xdcrStr = 0 < xdcr ? 'XDCR HD Attached' : 'XDCR HD Not Attached';
		const beamFaceStr = 0 < beamFace ? 'Up Facing beam' : 'Down Facing beam';

		// -- High
		const beamAngle = hi & 0b11;
		const janus = hi & 0b11110000;

		let beamAngleStr = PD0.UNHANDLED_STR + ` value : ${beamAngle.toString(2)}`;
		let janusStr = PD0.UNHANDLED_STR + ` value : ${janus.toString(2)}`;

		if(0b00 === beamAngle) {
			beamAngleStr = '15E Beam Angle';
		} else if(0b01 === beamAngle) {
			beamAngleStr = '20E Beam Angle';
		} else if(0b10 === beamAngle) {
			beamAngleStr = '30E Beam Angle';
		} else if(0b11 === beamAngle) {
			beamAngleStr = 'Other Beam Angle';
		}

		if(0b01000000 === janus) {
			janusStr = '4-Beam JANUS Config';
		} else if(0b01010000 === janus) {
			janusStr = '5-Beam JANUS Config DEMOD';
		} else if(0b11110000 === janus) {
			janusStr = '5-Beam JANUS Config 2 DEMOD'; // I dont know whats DEMOD means
		}

		const r = {
			systemStr: systemStr,
			conBeamStr: conBeamPatStr,
			sensorCfgStr: sensorCfgStr,
			xdcrStr: xdcrStr,
			beamFaceStr: beamFaceStr,
			beamAngleStr: beamAngleStr,
			janusStr: janusStr
		};

		return r;
	}

	static ParseSensorSrc(byte) {
		const sensorSrcParsed = [];
		PD0Fixed.SENSOR_SRC.forEach((item) => {
			if(0 < (item[0] & byte)) {
				sensorSrcParsed.push(item[1]);
			}
		});

		return sensorSrcParsed;
	}

	parseDetail() {
		const r = this.parse(PD0Fixed.FIXED_LEADER, 0);
		if(TDPD0.HID.FIXED.code !== r.hID) {
			console.error(`Invalid HID ${r.hID.toString(16)}`);
			return;
		}

		const sysCfgParsed = PD0Fixed.ParseSysConfig(r.sysCfg);
		r.sysCfgParsed = sysCfgParsed;

		const coordParsed = PD0Fixed.ParseCoordTransform(r.coordTransf);
		r.coordParsed = coordParsed;

		const sensorSrcParsed = PD0Fixed.ParseSensorSrc(r.sensorSrc);
		r.sensorSrcParsed = sensorSrcParsed;

		// -- Scale
		r.hdtAli = r.hdtAli * 0.01; // -- Degree
		r.hdtBias = r.hdtBias * 0.01; // -- Degree


		this.saveDetail(r);
	}
}

// -- PD0Variable should be 65bytes but example files are 60bytes, just disable rtcDate at the end
class PD0Variable extends PD0 {
	static VARIABLE_LEADER = new Map([
		['hID', 'U2'], // Varialbe leader id
		['noEns', 'U2'], // Ensemble number
		['tsYear', 'U1'],
		['tsMonth', 'U1'],
		['tsDay', 'U1'],
		['tsHour', 'U1'],
		['tsMin', 'U1'],
		['tsSec', 'U1'],
		['tsHundredths', 'U1'],
		['ensMSB', 'U1'], // Ensemble # MSB
		['bitResult', 'U2'], // Bit Result
		['soundSpeed', 'U2'], // [EC] Speed of sound
		['dptTrans', 'U2'], // [ED] Depth of transducer
		['hdt', 'U2'], // [EH] Heading
		['pitch', 'I2'], // [EP] Pitch
		['roll', 'I2'], // [ER] Roll
		['salinity', 'U2'], // [ES] Salinity
		['temp', 'I2'], // [ET] Temperature
		['mptMin', 'U1'], // MPT Minutes
		['mptSec', 'U1'], // MPT Seconds
		['mptHundredths', 'U1'], // MPT Hundredths
		['stdHdt', 'U1'], // heading standard deviation(accuracy)
		['stdPitch', 'U1'],
		['stdRoll', 'U1'],
		['adc0', 'U1'], // ADC Channel 0
		['adc1', 'U1'],
		['adc2', 'U1'],
		['adc3', 'U1'],
		['adc4', 'U1'],
		['adc5', 'U1'],
		['adc6', 'U1'],
		['adc7', 'U1'],
		['errStatus', 'U4'], // [CY] error status word
		['spare01', 'U2'],
		['pressure', 'U4'], // Pressure - deca-pascal
		['pressureVar', 'U4'], // Pressure sensor variance - deca-pascal
		['spare02', 'U1'],
		['rtcCentury', 'U1'], // read this as real date
		['rtcYear', 'U1'],
		// ['rtcMonth', 'U1'],
		// ['rtcDay', 'U1'],
		// ['rtcHour', 'U1'],
		// ['rtcMin', 'U1'],
		// ['rtcSec', 'U1'],
		// ['rtcHundredth', 'U1']
	]);

	static BIT_RESULT_HI = [
		[0b00010000, 'DEMOD 1 Error'],
		[0b00001000, 'DEMOD 0 Error'],
		[0b00000010, 'Timing card Error'],
	];

	// -- From low to hi
	static ERROR_STATUS1 = [
		[0b00000001, 'Bus error exception'],
		[0b00000010, 'Address error exception'],
		[0b00000100, 'Illegal Instruction exception'],
		[0b00001000, 'Zero Divide exception'],
		[0b00010000, 'Emulator exception'],
		[0b00100000, 'Unassigned exception'],
		[0b01000000, 'Watchdog restart occured'],
		[0b10000000, 'Batter saver power'],
	];

	static ERROR_STATUS2 = [
		[0b00000001, 'Pinging'],
		[0b01000000, 'Cold wakeup occurred'],
		[0b10000000, 'Unknown wakeup occurred'],
	];

	static ERROR_STATUS3 = [
		[0b00000001, 'Clock read error occurred'],
		[0b00000010, 'Unexpected alarm'],
		[0b00000100, 'Clock jump forward'],
		[0b00001000, 'Clock jump backward'],
	];

	static ERROR_STATUS4 = [
		[0b00001000, 'Power fail - unrecorded'],
		[0b00010000, 'spurious level 4 intr - DSP'],
		[0b00100000, 'spurious level 5 intr - UART'],
		[0b01000000, 'spurious level 6 intr - CLOCK'],
		[0b10000000, 'Level 7 interrupt occurred'],
	];

	static ParseBitResult(word) {
		const byte = word >> 8;
		const bitResultParsed = [];
		PD0Variable.BIT_RESULT_HI.forEach((item) => {
			if(0 < (item[0] & byte)) {
				bitResultParsed.push(item[1]);
			}
		});

		return bitResultParsed;
	}

	static ParseErrorStatus(dword) {
		const b1 = (dword & 0x000000FF);
		const b2 = (dword & 0x0000FF00) >> 8;
		const b3 = (dword & 0x00FF0000) >> 16;
		const b4 = (dword & 0xFF000000) >> 24;

		const errorStatusParsed = [];

		PD0Variable.ERROR_STATUS1.forEach((item) => {
			if(0 < (item[0] & b1)) {
				errorStatusParsed.push(item[1]);
			}
		});

		PD0Variable.ERROR_STATUS2.forEach((item) => {
			if(0 < (item[0] & b2)) {
				errorStatusParsed.push(item[1]);
			}
		});

		PD0Variable.ERROR_STATUS3.forEach((item) => {
			if(0 < (item[0] & b3)) {
				errorStatusParsed.push(item[1]);
			}
		});

		PD0Variable.ERROR_STATUS4.forEach((item) => {
			if(0 < (item[0] & b4)) {
				errorStatusParsed.push(item[1]);
			}
		});

		return errorStatusParsed;
	}

	static ParseDate(year, month, day, h, m, s, hundredS) {
		// -- OS38 only have 60bytes of variable leader, which means y2k bug still in it
		// -- I just used my method to judge 1900 or 2000
		if(year > 80) {
			year = year + 1900;
		} else {
			year = year + 2000;
		}

		month = month - 1;

		const ms = hundredS / 10;

		return new Date(year, month, day, h, m, s, ms);
	}

	parseDetail() {
		// -- Weired files, variable leader length is only just 60
		if(this.byteLength < this.calcLengthStruct(PD0Variable.VARIABLE_LEADER)) {
			console.error(`Invalid length of PD0Variable, ${this.byteLength} < ${this.calcLengthStruct(PD0Variable.VARIABLE_LEADER)}`);
			return;
		}
		const r = this.parse(PD0Variable.VARIABLE_LEADER, 0);
		if(TDPD0.HID.VARIABLE.code !== r.hID) {
			console.error(`Invalid HID ${r.hID.toString(16)}`);
			return;
		}

		r.bitResultParsed = PD0Variable.ParseBitResult(r.bitResult);
		r.hdt = r.hdt * 0.01;
		r.pitch = r.pitch * 0.01;
		r.roll = r.roll * 0.01;
		r.temp = r.temp * 0.01;

		r.stdPitch = r.stdPitch * 0.1;
		r.stdRoll = r.stdRoll * 0.1;
		r.errStatusParsed = PD0Variable.ParseErrorStatus(r.errStatusParsed);

		this.saveDetail(r);

		r.tsStr = this.getTimestamp();
	}

	// -- RTC Date to date type
	getTimestamp() {
		if(!this.parsedDetail) {
			return false;
		}

		const t = this.parsedDetail;

		const date = PD0Variable.ParseDate(t.tsYear, t.tsMonth, t.tsDay, t.tsHour, t.tsMin, t.tsSec, t.tsHundredths);
		return date;
	}
}

class PD0Velocity extends PD0 {
	static SIZE_VELOCITY = 8;

	static ParseVelocity2D(coordType, cell) {
		// -- no, raw
		if(PD0Fixed.COORD[0][0] === coordType) {
			'not Supported'; // TODO later on
			return false;
		} else if(PD0Fixed.COORD[3][0] === coordType) {
			// -- Earth coord Type
			const md = PD0Velocity.XYMagDir(cell[1], cell[0]);

			return {
				magnitude: md[0],
				direction: md[1],
				e: cell[0],
				n: cell[1],
				sur: cell[2],
				err: cell[3]
			}
		} else {
			'not Supported';
			return false;
		}
	}

	// -- magnitude : mm/s, direction : 0 ~ 359 degree
	static XYMagDir(e, n) {
		const magnitude = Math.sqrt((e * e) + (n * n));
		const d = Math.atan2(n, e) * (180 / Math.PI); // -180 ~ 180, rotate the coordination
		const direction = (360 - d + 90) % 360

		return [magnitude, direction];
	}

	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);

		if(TDPD0.HID.VELOCITY.code !== hID) {
			console.error(`Invalid HID for Velocity(${TDPD0.HID.VELOCITY.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const listCells = [];
		const count = (this.byteLength - 2) / PD0Velocity.SIZE_VELOCITY;
		for(let i = 0; i < count; i++) {
			// -- Millimeters per seconds - mm/s
			const cell = this.parseArray('I2', 4);

			listCells.push(cell);
		}

		const detail = {
			hID: hID,
			cells: listCells
		};

		this.saveDetail(detail);
	}

	// -- Should called with fixed leader coordination type value
	parseVelocity2D(coordType) {
		const md = [];
		if(PD0Fixed.COORD[3][0] === coordType) {
			// -- Earth coord Type
			if(this.parsedDetail) {
				this.parsedDetail.cells.forEach((item) => {
					if(TDPD0.INVALID_VALUE !== item[0]
						&& TDPD0.INVALID_VALUE !== item[1]
						&& TDPD0.INVALID_VALUE !== item[2]
						&& TDPD0.INVALID_VALUE !== item[3]
						) {
					md.push(PD0Velocity.XYMagDir(item[0], item[1]));
						} else {
							md.push([TDPD0.INVALID_VALUE, TDPD0.INVALID_VALUE]);
						}
				});
				this.parsedDetail.md = md;
			}
		} else {
			'not Supported';
			return false;
		}
	}
}

class PD0Corr extends PD0 {
	static SIZE_CORR = 4;

	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);

		if(TDPD0.HID.CORR.code !== hID) {
			console.error(`Invalid HID for Corr(${TDPD0.HID.CORR.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const listCells = [];
		const count = (this.byteLength - 2) / PD0Corr.SIZE_CORR;
		for(let i = 0; i < count; i++) {
			// -- Cell Value 0 ~ 255
			// 0 : bad
			// 255 : perfect correlation - solid target
			const cell = this.parseArray('U1', 4);
			listCells.push(cell);
		}

		const detail = {
			hID: hID,
			cells: listCells
		};

		this.saveDetail(detail);
	}
}

class PD0Intensity extends PD0 {
	static SIZE_INTENSITY = 4;

	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);

		if(TDPD0.HID.INTENSITY.code !== hID) {
			console.error(`Invalid HID for Intensity(${TDPD0.HID.INTENSITY.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const listCells = [];
		const count = (this.byteLength - 2) / PD0Intensity.SIZE_INTENSITY;
		for(let i = 0; i < count; i++) {
			// -- Cell Value 0 ~ 100 percent
			const cell = this.parseArray('U1', 4);
			listCells.push(cell);
		}

		const detail = {
			hID: hID,
			cells: listCells
		};

		this.saveDetail(detail);
	}
}

class PD0PercentGood extends PD0 {
	static SIZE_PG = 4;

	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);

		if(TDPD0.HID.PG.code !== hID) {
			console.error(`Invalid HID for Percent Good(${TDPD0.HID.PG.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const listCells = [];
		const count = (this.byteLength - 2) / PD0PercentGood.SIZE_PG;
		for(let i = 0; i < count; i++) {
			// -- Cell Value 0 ~ 100 percent
			const cell = this.parseArray('U1', 4);
			listCells.push(cell);
		}

		const detail = {
			hID: hID,
			cells: listCells
		};

		this.saveDetail(detail);
	}
}

class PD0Status extends PD0 {
	static SIZE_STATUS = 4;

	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);

		if(TDPD0.HID.STATUS.code !== hID) {
			console.error(`Invalid HID for Status(${TDPD0.HID.STATUS.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const listCells = [];
		const count = (this.byteLength - 2) / PD0Status.SIZE_STATUS;
		for(let i = 0; i < count; i++) {
			// -- Cell Value 0 ~ 1
			// 0 : Measurement was good
			// 1 : Measurement was bad
			const cell = this.parseArray('U1', 4);
			listCells.push(cell);
		}

		const detail = {
			hID: hID,
			cells: listCells
		};

		this.saveDetail(detail);
	}
}

class PD0BottomTrack extends PD0 {
	static BT_DATA = new Map([
		['hID', 'U2'], // 0x0600
		['pingsPEns', 'U2'], // [BP] BT Pings per ensemble
		['delayReacq', 'U2'], // [BD] BT Delay before re-acquire
		['corrMagMin', 'U1'], // [BC] BT Corr mag min
		['evalAmpMin', 'U1'], // [BA] BT Eval amp min
		['pgMin', 'U1'], // [BG] BT Percent good min
		['mode', 'U1'], // [BM] BT Mode
		['errVelMax', 'U2'], // [BE] BT Err Vel. Max
		['reserved', 'U4'], // Reserved 4 bytes
	]);

	// order
	// RANGE(2), VEL(2), CORR, EVAL AMP, PG, REF Layer(2) * 3, REF LAYER VEL(2)
	// REF CORR, REF INT, REF PG, BT MAX DEPTH, RSSI AMP, GAIN

	// -- Ref layer min / near far
	static BT_LAYER_WORD = new Map([
		['min', 'U2'],
		['near', 'U2'],
		['far', 'U2'],
	]);

	parseDetail() {
		const r = this.parse(PD0BottomTrack.BT_DATA, 0);

		if(TDPD0.HID.BT.code !== r.hID) {
			console.error(`Invalid HID for BottomTrack(${TDPD0.HID.BT.code.toString(16)}) != ${hID.toString(16)}`);
			return false;
		}

		const range = this.parseArray('U2', 4);
		const vel = this.parseArray('U2', 4);
		const corr = this.parseArray('U1', 4);
		const evalAmp = this.parseArray('U1', 4);
		const pg = this.parseArray('U1', 4);
		const refLayer = this.parseArray('U1', 4);
		const refLayerVel = this.parseArray('U2', 4);
		const refCorr = this.parseArray('U1', 4);
		const refInt = this.parseArray('U1', 4);
		const refPG = this.parseArray('U1', 4);
		const maxDepth = this.getUint16(this.parseOffset);
		this.addParseOffset(2);
		let rssiAmp = this.parseArray('U1', 4);
		let msbRange = this.parseArray('U1', 4);

		// -- Scaling
		const rssiAmpDb = rssiAmp.map(i => i * 0.45); // -- dB
		msbRange = msbRange.map(i => i * 65536); // -- cm

		r.range = range;
		r.vel = vel;
		r.corr = corr;
		r.evalAmp = evalAmp;
		r.pg = pg;
		r.refLayer = refLayer;
		r.refLayerVel = refLayerVel;
		r.refCorr = refCorr;
		r.refInt = refInt;
		r.refPG = refPG;
		r.maxDepth = maxDepth;
		r.rssiAmp = rssiAmp;
		r.rssiAmpDb = rssiAmpDb;
		r.msbRange = msbRange;
		
		this.saveDetail(r);
	}
}

class PD0AmbientSoundProfile extends PD0 {
	parseDetail() {
		const hID = this.getUint16(0);
		this.addParseOffset(2);
		const rssi = this.parseArray('U1', 4);

		if(TDPD0.HID.ASP.code !== hID) {
			console.error(`Invalid HID for Ambient Sound Profile(${TDPD0.HID.PG.code.toString(16)}) != ${hID.toString(16)}`);
			return;
		}

		const r = {
			hID: hID,
			rssi: rssi
		};

		this.saveDetail(r);
	}
}

export default class TDPD0 extends EndianDataView {
	static HEADER_HID = 0x7F7F;

	static UNHANDLED_STR = 'Unhandled string';
	static INVALID_VALUE = -32768;

	static HID = {
		'FIXED': { code: 0x0000, title: 'Fixed Leader', cls: PD0Fixed },
		'VARIABLE': { code: 0x0080, title: 'Variable Leader', cls: PD0Variable },
		'VELOCITY': { code: 0x0100, title: 'Veolocity Data', cls: PD0Velocity },
		'CORR': { code: 0x0200, title: 'Correlation magnitude Data', cls: PD0Corr },
		'INTENSITY': { code: 0x0300, title: 'Echo intensity Data', cls: PD0Intensity },
		'PG': { code: 0x0400, title: 'Percent good Data', cls: PD0PercentGood },
		'STATUS': { code: 0x0500, title: 'Status Data', cls: PD0Status },
		'BT': { code: 0x0600, title: 'Bottom Track Data', cls: PD0BottomTrack },
		'ASP': { code: 0x020C, title: 'Ambient Sound Profile', cls: PD0AmbientSoundProfile },
		'MICROCAT': {code: 0x0800, title: 'MicroCAT Data'},
		'UNKNOWN2000': {code: 0x2000, title: 'Unknown type 0x2000'},
		'UNKNOWN3000': {code: 0x3000, title: 'Unknown type 0x3000'},
		'UNKNOWN30E8': {code: 0x30e8, title: 'Unknown type 0x30E8'},
		'UNKNOWN30D8': {code: 0x30d8, title: 'Unknown type 0x03D8'}, // found HI-18-12 OS38
	}

	static JudgetHID(uint16) {
		for (const [k, item] of Object.entries(TDPD0.HID)) {
			if (item.code === uint16) {
				return item;
			}
		}
	}

	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.setLittleEndian(true);

		this.parseOffset = 0;
	}

	// -- Splitting PD0 only, no header parsed
	parseBrief(startOffset) {
		const me = this;
		this.setParseOffset(startOffset);

		const length = this.buffer.byteLength;

		const listPD0 = [];
		const listPD0Offset = [0];

		// -- calculate all pd0 unit
		while (this.parseOffset < length) {
			if (!this.test7F(this.parseOffset)) {
				return false;
			}

			const size = this.parsePD0Size(this.parseOffset);
			this.addParseOffset(size);

			listPD0Offset.push(this.parseOffset);
		}

		// -- Create PD0 object
		let lastOffset = 0;
		listPD0Offset.forEach((offset) => {
			if (lastOffset < offset) {
				const pd0 = new PD0(me.buffer, lastOffset, offset - lastOffset);
				listPD0.push(pd0);
			}

			lastOffset = offset;
		});

		this.saveBrief(listPD0);
	}

	test7F(offset) {
		// -- Check the Start 2 bytes
		const hID = this.getUint16(offset);

		if (TDPD0.HEADER_HID !== hID) {
			console.error(`Invalid Head ID, 0x${hID.toString(16)} != 0x${TDPD0.HEADER_HID.toString(16)}`);
			return false;
		}

		return true;
	}

	parsePD0Size(startOffset) {
		const offsetSize = startOffset + 2;
		const size = this.getUint16(offsetSize);
		const sizeDP0 = size + 2;
		return sizeDP0;
	}

	batch20210527() {
		// -- list of pd0, which is just splitted as ensemble size
		this.parseBrief(0);

		// -- pd0 parse header
		console.time();

		for (let index = 0; index < this.parsedBrief.length; index++) {
		// for (let index = 0; index < 5; index++) {
			const pd0 = this.parsedBrief[index];
			pd0.parseBrief();

			pd0.parseDetail();

			// -- parse Magnitude / Direction at velocity instance
			pd0.parseVelocity2D();
		}

		console.timeEnd();
	}

	debug20210601() {
		// this.parseBrief(0);

		const brief = this.getBrief();

		for (let index = 0; index < 50; index++) {
			// for (let index = 0; index < 5; index++) {
			const pd0 = brief[index];

			const ts = pd0.getTimestamp();
			console.log(ts);

			// const md = pd0.getByHID(TDPD0.HID.VELOCITY).parsedDetail.cells[10];
			// console.log(md);
		}

	}
}