// -- Just not to use little endian all the time
export default class EndianDataView extends DataView {
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
	parse(struct, offset) {
		if(undefined !== offset && 0 <= offset) {
			this.parseOffset = offset;
		}

		if(!struct) {
			console.log(`Invalid struct ${struct}`);
			return false;
		}

		const fn = this.mapParser;
		const result = {};

		Object.keys(struct).forEach((key) => {
			const value = struct[key];
			const fc = fn[value][0];

			if('function' === typeof fc) {
				result[key] = fc(this.parseOffset);
				this.parseOffset = this.parseOffset + fn[value][1];
			}
		});

		return result;
	}

	calcLengthStruct(struct) {
		let resultBytes = 0;

		Object.keys(struct).forEach((key) => {
			const value = struct[key];
			if(this.mapParser.hasOwnProperty(value)) {
				const byte = this.mapParser[value][1];
				resultBytes = resultBytes + byte;
			}
		});

		return resultBytes;
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

