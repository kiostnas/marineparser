import EndianDataView from '../jsm/EndianDataView.js';

// -- Class order critical
export {SegYDataView, SegY};

class SegYDataView extends EndianDataView {

}

class SegY extends SegYDataView {
	static STRUCT_BINARY_HEADER3200 = new Map([
		['jobIDNum', 'U4'],
		['lineNum', 'U4'],
		['reelNum', 'U4'],
		['tracesPEns', 'U2'], // Number of data traces per ensemble
		['auxTracesPEns', 'U2'], // Number of auxiliary traces per ensemble
		['interval', 'U2'], // Sample interval. us, Hz, meter or feet
		['intervalOrg', 'U2'], // Sample interval of original field recording. same units
		['numSamplePTrace', 'U2'], // Number of samples per data trace
		['numSamplePTraceOrg', 'U2'], // Number of samples per data trace for original field recording.
		['code', 'U2'], // Data sample format code 1 ~ 16. floating point. interger...
		['ensFold', 'U2'], // The expected number of data traces per trace ensemble
		['traceSortingCode', 'U2'], // type of ensemble, -1 ~ 9
		['vertSumCode', 'U2'], // Vertical sum code, 1 = no sum, 2 = two sum
		['sweepFreqStart', 'U2'], // Sweep frequency at start(Hz).
		['sweepFreqEnd', 'U2'], // Sweep frequency at end(Hz).
		['sweepLen', 'U2'], // Sweep length(ms)
		['sweepTypeCode', 'U2'], // Sweep type code 1 ~ 4
		['traceNumSweepChannel', 'U2'], // Trace number of sweep channel
		['sweepTTLenStart', 'U2'], // Sweep Trace taper length in milliseconds at start if tapered
		['sweepTTLenEnd', 'U2'], // Sweep Trace taper length in milliseconds at end
		['taperType', 'U2'], // 1 ~ 3
		['corelTrace', 'U2'], // Correlated data traces 1 = no, 2 = yes
		['binGainRec', 'U2'], // Binary gain recovered 1 = yes, 2 = no
		['ampRecM', 'U2'], // Amplitude recovery method, 1 ~ 4
		['measureSystem', 'U2'], // Measurement system, 1 = Meter, 2 = Feet
		['impulseSigPol', 'U2'], // Impulse signal polarity, 1 = negative number on trace, 2 = positive number on trace
		['vibPolCode', 'U2'], // Vibratory polarity code, 1 ~ 8
		['extNumTracePEns', 'U4'], // Extended number of data traces per ensemble, [tracesPEns]
		['extNumAuxTracePEns', 'U4'], // Extened number of auxiliary traces per ensemble, [auxTracesPEns]
		['extInterval', 'F8'], // Extended sample interval, [interval]
		['extIntervalOrG', 'F8'], // Extended sample interval of original field recording, [intervalOrg]
		['extNumSamplePTraceOrg', 'U4'], // Extended number of samples per data trace in original recording, [numSamplePTraceOrg]
		['extEnsFold', 'U4'], // Extended ensemble fold, [ensFold]
		['constant1234', 'U4'], // Integer constant 0x01020304 for endianess
	]);

	static STRUCT_BINARY_HEADER3500 = new Map([
		['majorRev', 'U1'], // Major SEG-Y format revision number
		['minorRev', 'U1'], // Minor SEG-Y format revision number
		['fixedLenTrace', 'U2'], // Fixed length trace flag
		['numExtTextHDR', 'U2'], // Number of 3200byte, Extended Textual file header records following the binary header
		['numAddTraceHDR', 'U4'], // Maximum number of additional 240 byte trace headers
		['timeCode', 'U2'], // Time basis code, 1 ~ 5
		['numTraceInFile', 'U8'], // Number of traces in this file or stream
		['offsetTrace', 'U8'], // Byte offset of first trace relative to start of file or stream, include initial 3600 bytes
		['numTrailerStanza', 'I4'], // Number of 3200byte date trailer stanza records following the last trace
	]);

	// -- You gotta add 10 more byte at the end, it is not fully implemented
	static STRUCT_TRACE_HEADER = new Map([
		['traceSeqLine', 'U4'], // Trace sequence number within line
		['traceSeqFile', 'U4'], // Trace sequence number within SEG-Y file
		['orgFieldRecNum', 'U4'], // Original field record number
		['traceNumOrg', 'U4'], // Trace number within the original field record
		['energySrc', 'U4'], // Energy source point number
		['ensNum', 'U4'], // Ensemble number
		['traceNumEns', 'U4'], // Trace number within the ensemble
		['traceIDCode', 'U2'], // -1 ~ 41, ~
		['numVertSum', 'U2'], // Number of vertically summed traces yielding this trace, 1 is one trace, 2 is two summed traces
		['numHoriSum', 'U2'], // Number of horizontally stacked traces yielding this trace
		['dataUse', 'U2'], // Data Use, 1 = Production, 2 = Test
		['distCent', 'U4'], // Distance from center of the source point to the center of the receiver group
		['elevRecv', 'U4'], // Elevation of receiver group
		['surfElev', 'U4'], // Surface elevation at source location
		['srcDepth', 'U4'], // Source depth below surface
		['seisDatumRecv', 'U4'], // Seismic Datum elevation at receiver group
		['seisDatumSrc', 'U4'], // Seismic Datum elevation at source
		['watColHeiSrc', 'U4'], // Water column height at source location
		['watColHeiRecv', 'U4'], // Water column height at receiver group location
		['scalarElev', 'I2'], // Scalar to be applied to all elevations and depths specified in Standrad Trace Header bytes 41-68 to give thre real value
		['scalarCoord', 'I2'], // Scalar to be applied to all coordinates specified in Standard Trace Header bytes 73–88 and to bytes Trace Header 181–188 to give the real value
		['srcCoordX', 'I4'], // Source coordinate X
		['srcCoordY', 'I4'], // Source coordinate Y
		['grpCoordX', 'I4'], // Group coordinate X
		['grpCoordY', 'I4'], // Group coordinate Y
		['coordUnit', 'U2'], // Coordinate unit, 1 = Length(meter or feet), 2 = Seconds of arc(deprecated), 3 = Decimal degrees, 4 = DMS
		['weatherVel', 'U2'], // Weathering velocity, ft/s or m/s
		['subWeatherVel', 'U2'], // Subweathering velocity, ft/s or m/s
		['upSrcMS', 'U2'], // Uphole time at source in milliseconds
		['upGrpMS', 'U2'], // Uphole time at group in milliseconds
		['srcCorrMS', 'U2'], // Source static correction in milliseconds
		['grpCorrMS', 'U2'], // Group static correction in milliseconds
		['totMS', 'U2'], // Total static applied in milliseconds
		['lagAMS', 'U2'], // Lag time A - time in milliseconds between end of 240 byte trace identification header and time break
		['lagBMS', 'U2'], // Lag time A - time in milliseconds between time break and the initiation time of the energy source
		['delayRecMS', 'U2'], // Delay recording time - time in milliseconds between initiation time of energy source and the time when recording of data samples begins
		['muiteStartMS', 'U2'], // Mute time - start time in milliseconds
		['muiteEndMS', 'U2'], // Mute time - end time in milliseconds
		['numSample', 'U2'], // Number of samples in this trace
		['intervalSample', 'U2'], // Sample interval for this trace, Microseconds, Hz, meter / feet
		['gainType', 'U2'], // Gain type of field instruments, 1 = fixed, 2 = binary, 3 = floating point, 4 ~ optional
		['instGain', 'U2'], // Insturment gain constant (dB)
		['instInitGain', 'U2'], // Instrument early or initial gain (dB)
		['correlated', 'U2'], // Correlated 1 = no, 2 = yes
		['sweepFreqS', 'U2'], // Sweep frequency at start Hz
		['sweepFreqE', 'U2'], // Sweep frequency at end Hz
		['sweepLen', 'U2'], // Sweep length in milliseconds
		['sweepType', 'U2'], // Sweep type : 1 = linear, 2 = parabolic, 3 = exponential, 4 = other
		['sweepTraceLenS', 'U2'], // Sweep trace taper length at start in milliseconds
		['sweepTraceLenE', 'U2'], // Sweep trace taper length at end in milliseconds
		['taperType', 'U2'], // Taper type
		['aliasFFreq', 'U2'], // Alias filter frequency Hz
		['aliasFSlope', 'U2'], // Alias filter slope dB/octave
		['notchFFreq', 'U2'], // Notch filter frequency Hz
		['notchFSlope', 'U2'], // Notch filter slope dB/octave
		['lcFreq', 'U2'], // Low cut frequency Hz
		['hcFreq', 'U2'], // High cut frequency Hz
		['lcSlope', 'U2'], // Low cut slope dB/octave
		['hcSlope', 'U2'], // High cut slope dB/octave
		['year', 'U2'], // year data recorded
		['day', 'U2'], // Day of year 1 ~ 366
		['hour', 'U2'], // Hour of day 24h
		['minute', 'U2'], // Minute of hour
		['second', 'U2'], // seconds of minute
		['timeCode', 'U2'], // Time basis code, 1 ~ 5 will overrides the binary header if exist
		['traceWeiFac', 'U2'], // Trace weighting factor
		['geoGNRoll', 'U2'], // Geophone group number of roll switch position one
		['geoGNTrace', 'U2'], // Geophone group number of trace number one within original field record
		['geoGNLTrace', 'U2'], // Geophone group number of last trace within original field record
		['gapSize', 'U2'], // Gap size, total number of groups dropped
		['overTravel', 'U2'], // Over travel associated with taper at beginning or end of line, 1 = down, 2 = up
		['XcoordEns', 'U4'], // X coordinate of ensemble (CDP) position of this trace
		['YcoordEns', 'U4'], // Y coordinate of ensemble (CDP) position of this trace
		['PSinline', 'U4'], // for 3D poststack data, this field should be used for the in-line number
		['PScrossline', 'U4'], // for 3D poststack data, this field should be used for the cross-line number
		['shotpoint', 'U4'], // Shotpoint number
		['scalarShot', 'U2'], // Scalar to be applied to the shotpoint number in Standard Trace Header bytes 197-200 to give the real value
		['traceUnit', 'I2'], // Trace value measurement unit, -1 ~ 9 ~ 256
		['transC', 'U8'], // Transduction constant, 8 byte and... what??
		['transUnit', 'I2'], // Transduction units, -1 ~ 9
		['id', 'U2'], // Device / Trace Identifier
		['scalarTimes', 'U2'], // Scalar to be applied to times specified in Trace header bytes 95-114 to give the true time value in milliseconds
		['srcType', 'I2'], // Source type / Orientation, -1 ~ 9
		['srcEnergyDir', 'U2'], // Source energy direction with respect to the source orientation
		['sourceM1', 'U4'], // Source Measurement 6bytes
		['sourceM2', 'U2'], // Source MEasurement 6bytes
		['srcUnit', 'I2'], // Source measurement unit, -1 ~ 6
	]);

	// -- binHeader.code, usually 5 with normal Floating point
	static SAMPLE_FORMAT_CODE = {
		IBM_FP_4: 1,
		TWO_COMPLEMENT_INT_4: 2,
		TWO_COMPLEMENT_INT_2: 3,
		FIXED_POINT_GAIN_4: 4,
		IEEE_FP_4: 5,
		IEEE_FP_8: 6,
		TWO_COMPLEMENT_INT_3: 7,
		TWO_COMPLEMENT_INT_1: 8,
		TWO_COMPLEMENT_INT_8: 9,
		UINT_4: 10,
		UINT_2: 11,
		UINT_8: 12,
		UINT_3: 15,
		UINT_1: 16
	};

	static DATE_TIME_CODE = {
		1: 'Local',
		2: 'GMT',
		3: 'Other',
		4: 'UTC',
		5: 'GPS'
	};

	/**
	 * Convert Seconds of arc to degree
	 */
	static SOA2Degree(sec) {
		const degree = sec / 3600;
		return degree;
	}

	
	parseDetail() {
		this.setLittleEndian(false);
		const h1 = this.parse(SegY.STRUCT_BINARY_HEADER3200, 3200);
		const h2 = this.parse(SegY.STRUCT_BINARY_HEADER3500, 3500);

		// -- Merge to h1
		Object.keys(h2).forEach((k, v) => h1[k] = v);
		this.saveBrief(h1);

		this.setParseOffset(3600);

		// -- No way that I can check the number of traces in the file
		const listTrace = [];

		if(SegY.SAMPLE_FORMAT_CODE.IBM_FP_4 !== h1.code
			&& SegY.SAMPLE_FORMAT_CODE.IEEE_FP_4 !== h1.code) {
			alert(`Only 32bit floating point implemented, please report`);
		} else {
			this.setLittleEndian(false);
			while(this.parseOffset < this.byteLength) {
				const trace = this.parseTraceOne();
				listTrace.push(trace);
			}
			
			return {
				binHeader: h1,
				traces: listTrace
			};
		}
	}

	parseTraceOne() {
		const traceHeader = this.parse(SegY.STRUCT_TRACE_HEADER);
		const parsedHeader = {};

		// -- Date
		const date = new Date();
		date.setUTCFullYear(traceHeader.year);
		date.setUTCMonth(0);
		date.setUTCDate(traceHeader.day);
		date.setUTCHours(traceHeader.hour);
		date.setUTCMinutes(traceHeader.minute);
		date.setUTCSeconds(traceHeader.second);
		date.setUTCMilliseconds(0);

		parsedHeader.date = date;
		parsedHeader.dateBase = SegY.DATE_TIME_CODE[traceHeader.timeCode];

		// -- Coordinates
		if(2 === traceHeader.coordUnit) {
			// -- 2 is seconds of arc which is deprecated but they are using
			// it says divide it with 3600 but thats not I guess
			const lng = traceHeader.srcCoordX / (3600 * 1000);
			const lat = traceHeader.srcCoordY / (3600 * 1000);
			parsedHeader.srcPos = [lat, lng];
			// parsedHeader.srcPosStr = 'seconds of arc, lat, lng';
		}

		this.addParseOffset(10);
		const traceData = [];

		for(let i = 0; i < traceHeader.numSample; i++) {
			// -- consider it is code 5 IEEE 32bit floating point
			// TODO check the code

			const v = this.getFloat32(this.parseOffset);
			traceData.push(v);
			this.parseOffset = this.parseOffset + 4;
		}
		return {
			header: traceHeader,
			parsedHeader: parsedHeader,
			data: traceData
		}
	}


	getPrettyPrintBinHeader() {
		const brief = this.getBrief();
		if(!brief) {
			return 'Not yet parsed, or invalid';
		}

		const list = [
			`Major: ${brief.majorRev}, Minor: ${brief.minorRev}`,
			`Data format code: ${brief.code} - ${this.getCodeStr(brief.code)}`,
			`Sample per trace: ${brief.numSamplePTrace}`,
			`Interval: ${brief.interval}us`,
		];

		return list.join('\n');
	}

	// -- code 1 ~ 16
	getCodeStr(code) {
		let result = '';
		Object.keys(SegY.SAMPLE_FORMAT_CODE).forEach((k) => {
			const v = SegY.SAMPLE_FORMAT_CODE[k];
			if(v === code) {
				result = k;
			}
		});

		return result;
	}
}

