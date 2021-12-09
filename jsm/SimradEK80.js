import {EndianDataView} from './EndianDataView.js';

// ##export="SimradEK80Raw:SR.SimradEK80Raw"
// ##export="SimradEK80RawBatch2020:SR.SimradEK80RawBatch2020"
export {SimradEK80Raw, SimradEK80RawBatch2020};

class SimradEK80EndianView extends EndianDataView {
	// -- filetime starts from 1601 Jan 1 with 100 nano seconds
	static parseDateTime(filetime) {
		const unixTimeBase = 116444736000000000n;
		return new Date(Number((filetime - unixTimeBase) / 10000n));
	}

	parseBrief(startOffset) {
		const map = new Map([
			['length', 'U4'],
		]);

		// -- Get the length at first
		const s = this.parse(map, startOffset);

		// -- Read 4 byte ascii as title
		const title = this.toAsciiString(this.parseOffset, this.parseOffset + 4);
		s.title = title;

		const dateTime = this.getBigInt64(this.parseOffset + 4);
		s.dateTime = dateTime;
		s.date = SimradEK80EndianView.parseDateTime(dateTime);

		this.addParseOffset(s.length);

		const e = this.parse(map, this.parseOffset);

		if(e.length !== s.length) {
			console.error(`Start and end length is different at ${startOffset}`);
		}

		this.saveBrief(s);

		return s;
	}

	getLengthBody() {
		return this.getBrief().length - SimradEK80Raw.BYTE_BRIEF + SimradEK80Raw.BYTE_LENGTH_END;
	}
}

// -- Class for XML0
class SimradEK80XML0 extends SimradEK80EndianView {
	parseDetail() {
		const brief = this.getBrief();
		if(!brief) {
			return `Can not parse detail if no brief`;
		}

		this.setParseOffset(SimradEK80Raw.BYTE_BRIEF);
		const xml = this.toAsciiString(this.parseOffset, this.parseOffset + this.getLengthBody());
		const detail = {
			xmlStr: xml
		};

		this.saveDetail(detail);

		// -- Do some with DOM XML
		//new DOMParser()
	}
}

// -- Class for RAW3
class SimradEK80Raw3 extends SimradEK80EndianView {
	static BYTE_CHANNEL_ID = 128;
	static STRUCT_RAW3 = new Map([
		['dataTypeValue', 'U2'],
		['spare', 'U2'],
		['offset', 'I4'],
		['count', 'I4'],
	]);
	

	static BIT_DATA_TYPE = {
		POWER: 1,
		ANGLE: 1 << 1,
		COMPLEX_FLOAT16 : 1 << 2,
		COMPLEX_FLOAT32 : 1 << 3,
		NUMBER_COMPLEX : 7 << 8
	};

	// -- Parse the header, data is not parsed at this time, call getValues()
	// -- parseOffset should remain still
	parseDetail() {
		const brief = this.getBrief();
		if(!brief) {
			return `Can not parse detail if no brief`;
		}

		if(this.getDetail()) {
			return;
		}

		this.setParseOffset(SimradEK80Raw.BYTE_BRIEF);

		const channelId = this.toAsciiString(this.parseOffset, this.parseOffset + SimradEK80Raw3.BYTE_CHANNEL_ID);
		this.addParseOffset(SimradEK80Raw3.BYTE_CHANNEL_ID);

		const struct = this.parse(SimradEK80Raw3.STRUCT_RAW3, this.parseOffset);
		struct.channelId = channelId.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\u0000*$/, '');

		const power = struct.dataTypeValue & SimradEK80Raw3.BIT_DATA_TYPE.POWER;
		const angle = struct.dataTypeValue & SimradEK80Raw3.BIT_DATA_TYPE.ANGLE;
		const f16 = struct.dataTypeValue & SimradEK80Raw3.BIT_DATA_TYPE.COMPLEX_FLOAT16;
		const f32 = struct.dataTypeValue & SimradEK80Raw3.BIT_DATA_TYPE.COMPLEX_FLOAT32;
		const number = (struct.dataTypeValue & SimradEK80Raw3.BIT_DATA_TYPE.NUMBER_COMPLEX) >> 8;
		struct.dataType = {
			power: power ? true : false,
			angle: angle ? true : false,
			f16: f16 ? true : false,
			f32: f32 ? true : false,
			number: number
		}

		this.saveDetail(struct);
	}

	// -- Just get it and erase it from the memory
	// -- parseOffset does not change
	getValues() {
		const struct = this.getDetail();
		if(!struct) {
			console.error(`Can not get value if no detail`);
			return false;
		}

		if(struct.dataType.f16) {
			console.error(`Float 16 type is not supported`);
		} else if(struct.dataType.f32) {
			const samples = [];
			const offsetStart = this.parseOffset + struct.offset;
			for(let i = 0; i < struct.count * (struct.dataType.number * 2); i++) {
				const s = this.getFloat32(offsetStart + (i * 4));
				samples.push(s);
			}

			return samples;
		}

		return false;
	}
}

// -- File '.raw'
class SimradEK80Raw extends SimradEK80EndianView {
	static BYTE_LENGTH_START = 4;
	static BYTE_LENGTH_END = 4;
	static BYTE_LENGTH = SimradEK80Raw.BYTE_LENGTH_START + SimradEK80Raw.BYTE_LENGTH_END;

	static BYTE_DATE = 8;
	static BYTE_TITLE = 4; // -- RAW3, XML0... string
	static BYTE_BRIEF = SimradEK80Raw.BYTE_LENGTH_START + SimradEK80Raw.BYTE_TITLE + SimradEK80Raw.BYTE_DATE;

	static TYPE_RAW3 = 'RAW3';
	static TYPE_XML0 = 'XML0';
	static TYPE_NME0 = 'NME0';
	static TYPE_MRU0 = 'MRU0';
	static TYPE_FIL1 = 'FIL1';

	static mapCls = {
		XML0: {title: 'XML', cls: SimradEK80XML0},
		RAW3: {title: 'Raw', cls: SimradEK80Raw3},
		NME0: {title: 'NMEA'},
		MRU0: {title: 'MRU'},
		FIL1: {title: 'Filter'},
	}

	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.setLittleEndian(true);

		this.parseOffset = 0;
	}

	batchSplitDataGrams() {
		let offset = 0, i = 0;

		const typesCount = {
			invalid: {},
			channelIds: {},
			RAW3: 0,
			XML0: 0,
			NME0: 0,
			MRU0: 0,
			FIL1: 0,
		};

		const results = [];

		while(offset < this.byteLength) {
			const r = this.parseBrief(offset);

			const cls = SimradEK80Raw.mapCls[r.title];

			// -- Saves counts
			if(typesCount.hasOwnProperty(r.title)) {
				typesCount[r.title]++;
			} else {
				if(typesCount.invalid.hasOwnProperty(r.title)) {
					typesCount.invalid[r.title]++;
				} else {
					typesCount.invalid[r.title] = 1;
				}
			}

			// -- Create instance
			if(cls && cls.cls) {
				const instance = new cls.cls(this.buffer, offset, r.length + SimradEK80Raw.BYTE_LENGTH);
				instance.setLittleEndian(this.littleEndian);
				instance.parseBrief();
				instance.parseDetail(); // -- but no samples

				// -- Raw3 Channel counts
				if('RAW3' === r.title) {
					const cid = instance.getDetail().channelId;
					if(typesCount.channelIds.hasOwnProperty(cid)) {
						typesCount.channelIds[cid]++;
					} else {
						typesCount.channelIds[cid] = 1;
					}
				}

				results.push(instance);
			}

			offset = offset + r.length + SimradEK80Raw.BYTE_LENGTH;

			i++;
		}

		typesCount.i = i;

		const obj = {
			counts: typesCount,
			results: results,
		};

		return obj;
	}
}

class SimradEK80RawBatch2020 extends SimradEK80Raw {
	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.types = undefined;
		this.datagrams = undefined;
	}

	batchSplitDataGrams() {
		const r = super.batchSplitDataGrams();
		this.types = r.counts;
		this.datagrams = r.results;

		return r;
	}

	batchParseChannel(cid) {
		if(!this.datagrams) {
			console.error(`No datagrams parsed, call 'batchSplitDataGrams' first`);
			return false;
		}

		const listRaw3s = [];
		this.datagrams.forEach((item) => {
			if(SimradEK80Raw.TYPE_RAW3 !== item.getBrief().title) {
				return;
			}

			if(cid !== item.getDetail().channelId) {
				return;
			}

			const clone = JSON.parse(JSON.stringify(item, (k, v) => {
				if('bigint' === typeof v) {
					return v.toString() + 'n';
				} else {
					return v;
				}
			}));
			clone.parsedDetail.samples = item.getValues();
			listRaw3s.push(clone);
		});

		return listRaw3s;

	}
}
