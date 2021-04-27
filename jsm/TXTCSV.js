export { TXTCSVHelper, TXTCSV, TXTCSVMap, TXTCSVSeapath, TXTCSVPCO2 };

class TXTCSV {
	constructor(txt) {
		this.ignoreCount = 0;
		if(txt) {
			this.setDataSource(txt);
		}
		this.result = [];
	}

	setDataSource(txt) {
		this.dataSource = txt;
		this.lines = this.dataSource.split('\n');
	}

	// -- how many lines ignored, 3 will 0 4 8
	setIgnore(count) {
		if(count <= 0) {
			console.error(`setIgnore invalid count ${count}`);
			return false;
		}
		this.ignoreCount = count - 1;
	}

	// -- Implement this
	parseBrief() {
		console.error(`Implement this, result only`);
		return this.result;
	}

	// -- Implement this
	parseDetail() {
		console.error(`Optional Implement, result with original line`);
	}

	// -- Implement this
	getResult() {
		// console.error(`Implement this, brief or detail with this function`);
		return this.result;
	}

	// -- Implement this
	getTitle() {
		return 'TXTCSV Parent';
	}

	// -- to make sql string, "atb = 'abc',ccc = 'cab'""
	static objToCommas(obj) {
		const list = [];
		Object.keys(obj).forEach((key) => {
			const v = obj[key];
			list.push(`${key} = '${v}'`);
		});

		return list.join(',');
	}

	// -- Derieved class should implement this static function
	// -- returning how many lines are valid
	static try(str) {
		return false; // return boolean
	}

	static ParseMap(src, map) {
		if ('object' !== typeof map) {
			return false;
		}

		if (map.assert) {
			// -- Default value
			if (!map.assert.hasOwnProperty('failure')) {
				map.assert.failure = false;
			}

			// -- has - indexOf
			if (map.assert.has) {
				// -- If its array type
				const typeHas = typeof map.assert.has;
				if ('object' === typeHas) {
					const found = map.assert.has.findIndex(has => -1 !== src.indexOf(has));
					if (-1 === found) {
						// console.log(`Failed to assert has : '${map.assert.has.join(',')}' at '${src}'`);
						return map.assert.failure;
					}
				} else if ('string' === typeHas) {
					if (-1 === src.indexOf(map.assert.has)) {
						// console.log(`Failed to assert has : '${map.assert.has}' at '${src}'`);
						return map.assert.failure;
					}
				}
			}
		}

		const commas = src.split(',');

		// -- Assert count
		if (map.assert && map.assert.count) {
			if (commas.length !== map.assert.count) {
				// console.log(`Failed to assert count : ${map.assert.count} but ${commas.length}`);
				return map.assert.failure;
			}
		}

		const result = {};

		// -- result[name] = commas[idx]
		Object.keys(map.pair).forEach((k) => {
			const v = map.pair[k];

			result[v] = commas[k];
		});

		if (map.post) {
			Object.keys(map.post).forEach((k) => {
				const v = map.post[k];
				const name = map.pair[k];

				result[name] = v(result[name]);
			});
		}

		return result;
	}
}

class TXTCSVMap extends TXTCSV {
	static MapEA600DPT = {
		getTitle: () => 'MapEA600DPT',
		assert: {
			count: 3
		},
		pair: {
			1: 'dpt'
		},
		post: {
			1: parseFloat
		}
	};

	static MapEM122DPT = {
		getTitle: () => 'MapEM122DPT',
		assert: {
			count: 4
		},
		pair: {
			1: 'dpt',
			2: 'base',
		},

		post: {
			1: parseFloat,
			2: parseFloat,
		}
	}

	static MapWinch = {
		getTitle: () => 'MapWinch',
		assert: {
			has: '@RCWDM',
			count: 9,
			failure: false
		},

		pair: {
			1: 'no',
			3: 'length',
			5: 'speed',
			8: 'blockT',
		},

		post: {
			1: parseInt,
			3: parseFloat,
			5: parseFloat,
			8: parseFloat,
		}
	};

	static MapFluke1620A = {
		getTitle: () => 'MapFluke1620A',
		assert: {
			count: 4
		},
		pair: {
			0: 't1',
			1: 'h1',
			2: 't2',
			3: 'h2',
		},
		post: {
			0: parseFloat,
			1: parseFloat,
			2: parseFloat,
			3: parseFloat,
		}
	};

	static MapWeather = {
		getTitle: () => 'MapWeather',
		assert: {
			count: 29
		},
		pair: {
			0: 'timestamp',
			1: 'lat',
			2: 'lon',
			3: 'ws',
			4: 'wd',
			5: 'ws_gust',
			6: 'wd_gust',
			7: 'ws_true',
			8: 'wd_true',
			9: 'ws_gust_true',
			10: 'wd_gust_true',
			11: 'tem',
			12: 'hum',
			13: 'pre',
			14: 'rain_hour',
			15: 'rain_day',
			16: 'pyr',
			17: 'uv',
			18: 'pyrge',
			19: 'quan',
			20: 'nr',
			21: 'lpc',
			22: 'heading',
			23: 'roll',
			24: 'pitch',
			25: 'course',
			26: 'horizontal_speed',
			27: 'panel_temp',
			28: 'batt_volt',
		},
		post: {
			3: parseFloat,
			4: parseFloat,
			5: parseFloat,
			6: parseFloat,
			7: parseFloat,
			8: parseFloat,
			9: parseFloat,
			10: parseFloat,
			11: parseFloat,
			12: parseFloat,
			13: parseFloat,
			14: parseFloat,
			15: parseFloat,
			22: parseFloat,
			23: parseFloat,
			24: parseFloat,
			25: parseFloat,
			26: parseFloat,
			27: parseFloat,
			28: parseFloat,
		}
	};

	static MapHIPAP = {
		getTitle: () => 'MapHIPAP',
		assert: {
			has: '$PSIMSSB',
			count: 17,
			failure: false
		},

		pair: {
			1: 'timestamp',
			2: 'id',
			8: 'lat',
			9: 'latD',
			10: 'lng',
			11: 'lngD',
			12: 'depth',
		},

		post: {
			1: parseFloat,
			8: parseFloat,
			10: parseFloat,
			12: parseFloat,
		}
	};

	static MapCTD = {
		getTitle: () => 'MapCTD',
		assert: {
			count: 7,
			failure: false
		},

		pair: {
			0: 'depth',
			1: 'altimeter',
			2: 'temp',
			3: 'sal',
			4: 'oxygen',
			5: 'par',
			6: 'fluore',
		},

		post: {
			0: parseFloat,
			1: parseFloat,
			2: parseFloat,
			3: parseFloat,
			4: parseFloat,
			5: parseFloat,
			6: parseFloat,
		}
	};

	setDefaultMap(obj) {
		this.defaultMap = obj;
	}

	parseBrief() {
		if(!this.defaultMap) {
			return false;
		}

		for (let i = 0; i < this.lines.length; i++) {
			const l = this.lines[i];
			this.result.push(TXTCSV.ParseMap(l, this.defaultMap))
		}

		return this.result;
	}

	parseDetail() {
		if(!this.defaultMap) {
			return false;
		}
	}

	getResult() {

	}
}


class TXTCSVSeapath extends TXTCSV {
	constructor(txt) {
		super(txt);
	}

	static try(line) {
		return TXTCSVSeapath.ParseSeapathLine(line);
	}

	static MapVTG = {
		assert: {
			count: 10
		},
		pair: {
			1: 'course',
			5: 'speed',
		},
		post: {
			1: parseFloat,
			5: parseFloat,
		}
	}

	static MapHDT = {
		assert: {
			count: 3,
		},
		pair: {
			1: 'hdt'
		},
		post: {
			1: parseFloat
		}
	}

	static MapPSXN = {
		assert: {
			count: 6,
			has: '$PSXN',
		},
		pair: {
			1: 'variable',
			2: 'roll',
			3: 'pitch',
			4: 'heading',
			5: 'heave',
		},
		post: {
			2: parseFloat,
			3: parseFloat,
			4: parseFloat,
			5: parseFloat,
		}
	}

	// ---- Seapath
	static ParseSeapathZDA(str) {
		const commas = str.split(',');
		const hh = commas[1].substr(0, 2);
		const mm = commas[1].substr(2, 2);
		const ss = commas[1].substr(4, 2);
		const ms = commas[1].substr(7);

		const precise = `${commas[4]}-${commas[3]}-${commas[2]} ${hh}:${mm}:${ss}.${ms}Z`;
		const seconds = `${commas[4]}-${commas[3]}-${commas[2]} ${hh}:${mm}:${ss}`;
		const date = new Date(precise);
		const dateTrim = new Date(seconds);

		return {
			date: date,
			dateTrim: dateTrim
		}
	}

	static ParseSeapathGGA(str) {
		const result = {};
		const gga = str.split(',');

		if (15 !== gga.length) {
			return {};
		}

		const lat = gga[2].match(/(\d+)(\d\d)\.(.*)/);
		if(lat) {
			const latMin = parseFloat(lat[2] + '.' + lat[3]) / 60;
			result.lat = parseInt(lat[1]) + latMin;
			if ('S' === gga[3]) {
				result.lat = result.lat * -1;
			}
			result.latStr = `${gga[2]},${gga[3]}`;
		}

		var lng = gga[4].match(/(\d+)(\d\d)\.(.*)/);
		if(lng) {
			var lngMin = parseFloat(lng[2] + '.' + lng[3]) / 60;
			result.lng = parseInt(lng[1]) + lngMin;
			if ('W' === gga[5]) {
				result.lng = result.lng * -1;
			}
			result.lngStr = `${gga[4]},${gga[5]}`;
		}

		return result;
	}

	static ParseSeapathGroup(str) {
		const lines = str.split('\n');
		const obj = {};
		lines.forEach((line) => {
			if (-1 !== line.indexOf('ZDA,')) {
				obj.zda = TXTCSVSeapath.ParseSeapathZDA(line);
			} else if (-1 !== line.indexOf('GGA,')) {
				obj.gga = TXTCSVSeapath.ParseSeapathGGA(line);
			} else if (-1 !== line.indexOf('VTG,')) {
				obj.vtg = TXTCSV.ParseMap(line, TXTCSVSeapath.MapVTG);
			} else if (-1 !== line.indexOf('HDT,')) {
				obj.hdt = TXTCSV.ParseMap(line, TXTCSVSeapath.MapHDT);
			} else if (-1 !== line.indexOf('PSXN,')) {
				obj.psxn = TXTCSV.ParseMap(line, TXTCSVSeapath.MapPSXN);
			}
		});

		return obj;
	}

	static ParseSeapathLine(line, resultObj) {
		if(!resultObj) {
			resultObj = {};
		}

		if (-1 !== line.indexOf('ZDA,')) {
			resultObj.zda = TXTCSVSeapath.ParseSeapathZDA(line);
		} else if (-1 !== line.indexOf('GGA,')) {
			resultObj.gga = TXTCSVSeapath.ParseSeapathGGA(line);
		} else if (-1 !== line.indexOf('VTG,')) {
			resultObj.vtg = TXTCSV.ParseMap(line, TXTCSVSeapath.MapVTG);
		} else if (-1 !== line.indexOf('HDT,')) {
			resultObj.hdt = TXTCSV.ParseMap(line, TXTCSVSeapath.MapHDT);
		} else if (-1 !== line.indexOf('PSXN,')) {
			resultObj.psxn = TXTCSV.ParseMap(line, TXTCSVSeapath.MapPSXN);
		}

		return resultObj;
	}

	static getTitle() {
		return 'Seapath';
	}

	// -- When GGA appears, separate the group
	parseBrief() {
		const resultList = [];
		let rGroup = {};
		let ignore = 0;

		for (let i = 0; i < this.lines.length; i++) {
			const l = this.lines[i];
			if(5 >= l.length) {
				continue;
			}

			if(-1 !== l.indexOf('GGA,')) {
				// -- countIgnore
				if(0 <= ignore) {
					ignore--;
				} else if(0 > ignore) {
					ignore = this.ignoreCount;
					continue;
				}

				// -- Separate
				if(rGroup.gga) {
					resultList.push(rGroup);
					rGroup = {};
				}
			}

			if(0 <= ignore) {
				continue;
			}

			// -- Save only when ignore is -1, b/c gga ignore--
			TXTCSVSeapath.ParseSeapathLine(l, rGroup);
		}

		// -- Last one, if any thing exists
		if(0 < Object.keys(rGroup).length) {
			resultList.push(rGroup);
		}

		this.result = resultList;

		return this.result;
	}
}

// -- not yet tested
class TXTCSVPCO2 extends TXTCSV {
	static ParsePCO2(str) {
		const tabs = str.split('\t');

		if (42 !== tabs.length) {
			return false;
		}

		const map = ["Type", "error", "PC_Date", "PC_Time", "GPS_date", "gps_time",
			"latitude", "longitude", "equ_temp", "std_val", "CO2a_W", "CO2b_W", "CO2_um/m",
			"H2Oa_W", "H2Ob_W", "H2O_mm", "licor_temp", "licor_press", "atm_press",
			"equ_press", "H2O_flow", "licor_flow", "equ_pump", "vent_flow", "atm_cond",
			"equ_cond", "drip_1", "drip_2", "cond_temp", "dry_box_temp", "deck_box_temp",
			"Press", "Temp", "Cond", "Sal", "O2", "O2ppm", "pH", "Temp2", "Chl", "Turb", "TSG38"];

		const obj = {};

		map.forEach((title, key) => {
			obj[title] = tabs[key];

			if (key > 7) {
				obj[title] = parseFloat(obj[title]);
			}
		});

		return obj;
	}

	static try(line) {
		return TXTCSVPCO2.ParsePCO2(line);
	}

	static getTitle() {
		return 'PCO2';
	}
}

class TXTCSVHelper {
	static ListParsers = [
		TXTCSVMap.MapCTD,
		TXTCSVMap.MapEA600DPT,
		TXTCSVMap.MapFluke1620A,
		TXTCSVMap.MapHIPAP,
		TXTCSVSeapath,
		TXTCSVPCO2,
	];

	static TryAll(str, countChar) {
		if(!countChar) {
			countChar = 1500;
		}

		const sample = str.substr(0, countChar);
		const lines = sample.split('\n');
		const countLines = lines.length;
		const result = [];
		TXTCSVHelper.ListParsers.forEach(p => result.push({
			p: p,
			title: p.getTitle(),
			valid: 0
		}));

		for (let index = 0; index < countLines; index++) {
			const line = lines[index];

			for (let j = 0; j < TXTCSVHelper.ListParsers.length; j++) {
				const p = TXTCSVHelper.ListParsers[j];

				let rObj = undefined;
				if('object' === typeof p) {
					// -- Map object type
					rObj = TXTCSV.ParseMap(line, p);
				} else {
					// -- Class type
					rObj = p.try(line);
				}

				// -- 0 or '' can cause problem but most of case it returns false
				if(rObj) {
					result[j].valid++;
				}
			}
		}

		return result;
	}

	/**
	 * create parser Instance
	 * if its Map(Object) type create TXTCSVMap and set the default MAP
	 * @param {*} idxOrTitle 
	 */
	static GetParserInstance(idxOrTitle, dataSource) {
		const type = typeof idxOrTitle;
		let selectedParser = undefined;
		if('number' === type) {
			selectedParser = TXTCSVHelper.ListParsers[idxOrTitle];
		} else if('string' === type) {
			selectedParser = TXTCSVHelper.ListParsers.find(p => p.getTitle() === idxOrTitle);
		}

		if(!selectedParser) {
			console.error(`getParserInstance : Invalid argument`)
			return false;
		}

		const typeParser = typeof selectedParser;
		if('object' === typeParser) {
			const instance = new TXTCSVMap(dataSource);
			instance.setDefaultMap(selectedParser);
			return instance;
		} else {
			// -- Class
			return new selectedParser(dataSource);
		}
	}
}


