export {EndianDataView}

// -- Just not to use little endian all the time
class EndianDataView extends DataView {
	constructor(arrayBuffer, byteOffset, byteLength) {
		super(arrayBuffer, byteOffset, byteLength);

		this.littleEndian = false;
		this.initParser(); // -- this.mapParser
	}

	setLittleEndian(little) {
		this.littleEndian = little;
	}

	setParseOffset(offset) {
		this.parseOffset = offset;
	}

	addParseOffset(v) {
		this.parseOffset = this.parseOffset + v;
	}

	getInt16(byteOffset) {
		return super.getInt16(byteOffset, this.littleEndian);
	}

	getInt32(byteOffset) {
		return super.getInt32(byteOffset, this.littleEndian);
	}

	getUint16(byteOffset) {
		return super.getUint16(byteOffset, this.littleEndian);
	}

	getUint32(byteOffset) {
		return super.getUint32(byteOffset, this.littleEndian);
	}

	getBigInt64(byteOffset) {
		return super.getBigInt64(byteOffset, this.littleEndian);
	}

	getBigUint64(byteOffset) {
		return super.getBigUint64(byteOffset, this.littleEndian);
	}

	getFloat32(byteOffset) {
		return super.getFloat32(byteOffset, this.littleEndian);
	}

	getFloat64(byteOffset) {
		return super.getFloat64(byteOffset, this.littleEndian);
	}

	initParser() {
		const fn = {};
		fn['U1'] = [this.getUint8.bind(this), 1];
		fn['U2'] = [this.getUint16.bind(this), 2];
		fn['U4'] = [this.getUint32.bind(this), 4];
		fn['U8'] = [this.getBigUint64.bind(this), 8];
		fn['I1'] = [this.getInt8.bind(this), 1];
		fn['I2'] = [this.getInt16.bind(this), 2];
		fn['I4'] = [this.getInt32.bind(this), 4];
		fn['I8'] = [this.getBigInt64.bind(this), 8];
		fn['F4'] = [this.getFloat32.bind(this), 4];
		fn['F8'] = [this.getFloat64.bind(this), 8];

		this.mapParser = fn;

		this.parseOffset = 0;
	}

	// -- [offset] -> starts from this.parseOffset - starts from 0
	// -- TODO Object to Map, Object does not preserve the order
	parse(struct, offset) {
		const me = this;
		if(undefined !== offset && 0 <= offset) {
			this.parseOffset = offset;
		}

		if(!struct) {
			console.log(`Invalid struct ${struct}`);
			return false;
		}

		const fn = this.mapParser;
		const result = {};

		// -- Object Map
		if(true !== struct instanceof Map) {
			console.error(`map should be Map type, no other objects`);
			return false;
		}

		struct.forEach((value, key) => {
			const fc = fn[value][0];

			if('function' === typeof fc) {
				result[key] = fc(me.parseOffset);
				me.parseOffset = me.parseOffset + fn[value][1];
			}
		});

		return result;


		// Object.keys(struct).forEach((key) => {
		// 	const value = struct[key];
		// 	const fc = fn[value][0];

		// 	if('function' === typeof fc) {
		// 		result[key] = fc(this.parseOffset);
		// 		this.parseOffset = this.parseOffset + fn[value][1];
		// 	}
		// });

		// return result;
	}

	/**
	 * returns in array
	 * @param {*} type U1, U2..
	 * @param {*} count 1 2 ~ number of type
	 */
	parseArray(type, count, offset) {
		const me = this;
		if(undefined !== offset && 0 <= offset) {
			this.parseOffset = offset;
		}

		if(isNaN(count)) {
			console.log(`Invalid count ${count} should be number`);
			return false;
		}

		const fn = this.mapParser;
		const result = [];

		const fc = fn[type][0];
		const fcLen = fn[type][1];

		if('function' !== typeof fc) {
			console.log(`Invalid type ${type} should be in list`);
			return false;
		}

		for (let index = 0; index < count; index++) {
			const v = fc(this.parseOffset);
			result.push(v);
			this.addParseOffset(fcLen);
		}

		return result;
	}

	calcLengthStruct(struct) {
		// -- Object Map
		if(true !== struct instanceof Map) {
			console.error(`map should be Map type, no other objects`);
			return false;
		}

		let sum = 0;

		const fn = this.mapParser;

		struct.forEach((value, key) => {
			const counts = fn[value][1];
			sum = sum + counts;
		});

		return sum;
	}

	// -- Means Uint8Array
	toAsciiString(start, end) {
		// -- Using buffer directly, this.byteOffset should be added, otherwise it will start from the 0
		const ab = this.buffer.slice(this.byteOffset + start, this.byteOffset + end);
		return String.fromCharCode.apply(null, new Uint8Array(ab));
	}

	saveBrief(parsedBrief) {
		this.parsedBrief = parsedBrief;
	}

	saveDetail(parsedDetail) {
		this.parsedDetail = parsedDetail;
	}

	getBrief() {
		return this.parsedBrief;
	}

	getDetail() {
		return this.parsedDetail;
	}
}

