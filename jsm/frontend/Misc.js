/**
 * This file is for front-end
 */

// ##export="DOMUtil:DOMUtil"
// ##export="FileUtil:FileUtil"
// ##export="ScaleBox:ScaleBox"
// ##export="ColorUtil:ColorUtil"

export { DOMUtil, FileUtil, ScaleBox, ColorUtil }

class DOMUtil {
	static Span(str) {
		const e = document.createElement("span");
		e.innerHTML = str;
		return e;
	}

	static P(str) {
		const e = document.createElement("p");
		e.innerHTML = str;
		return e;
	}

	static SetHtml(id, html) {
		document.getElementById(id).innerHTML = html;
	}

	// -- DOMGetChecked('nameofinput')[0].value
	static GetChecked(name) {
		const elements = document.getElementsByName(name);
		const checked = [];
		for (let i = 0; i < elements.length; i++) {
			const e = elements[i];
			if (e.checked) {
				checked.push(e);
			}
		}
	
		return checked;
	}

	// DOMUtil.ParseURL(location.search);
	static ParseURL(url) {
		const str = decodeURI(url);
		const r = {
			path: str,
			strArgs: '',
			args: {},
		}
		
		if(-1 === str.indexOf('?')) {
			return r;
		}
	
		const m = str.match(/^(.*)\?(.*)$/);
		r.path = m[1];
		r.strArgs = m[2];
		r.args = {};
	
		const args = m[2].split('&');
		args.forEach(arg => {
			const p1 = arg.split('=');
			if(2 === p1.length) {
				r.args[p1[0]] = p1[1];
			} else if(1 === p1.length) {
				r.args[p1[0]] = '';
			}
		});
	
		return r;
	}
}

class FileUtil {
	// -- file object to string
	static async readFileString(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				resolve(reader.result);
			}
	
			reader.onerror = (e) => {
				reject(e);
			}
	
			reader.readAsText(file);
		})
	}

	// -- Only a chunk, just taste the file
	static async readFileChunkString(file) {
		const s = file.stream();
		const r = s.getReader();
		const uint8array = await r.read();
		return new TextDecoder().decode(uint8array.value.buffer);
	}

	// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
	static download(filename, text) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
}

// -- Just holds scale functions
// -- I need to know the domain and range sometimes
class ScaleBox {
	constructor() {
		// -- Box
		this.obj = {};
	}

	static ScaleLinear(domain, range) {
		const diffDomain = domain[1] - domain[0];
		const diffRange = range[1] - range[0];

		return (v) => {
			return range[0] + diffRange * ((v - domain[0]) / diffDomain);
		}
	};

	// -- Domain - input, range - output
	// -- domain : [], range : []
	set(name, domain, range) {
		const scale = ScaleBox.ScaleLinear(domain, range);
		const reverseScale = ScaleBox.ScaleLinear(range, domain);
		this.obj[name] = { domain: domain, range: range, scale: scale, reverseScale: reverseScale };
	}

	get(name, value) {
		if (this.obj[name]) {
			return this.obj[name].scale(value);
		}

		return false;
	}

	getReverse(name, value) {
		if (this.obj[name]) {
			return this.obj[name].reverseScale(value);
		}

		return false;
	}

	getDomain(name) {
		if (this.obj[name]) {
			return this.obj[name].domain;
		}

		return false;
	}

	getRange(name) {
		if (this.obj[name]) {
			return this.obj[name].range;
		}
	}
}

class ColorUtil {
	// -- https://css-tricks.com/converting-color-spaces-in-javascript/
	static HSLToHex(h, s, l) {
		s /= 100;
		l /= 100;

		let c = (1 - Math.abs(2 * l - 1)) * s,
			x = c * (1 - Math.abs((h / 60) % 2 - 1)),
			m = l - c / 2,
			r = 0,
			g = 0,
			b = 0;

		if (0 <= h && h < 60) {
			r = c; g = x; b = 0;
		} else if (60 <= h && h < 120) {
			r = x; g = c; b = 0;
		} else if (120 <= h && h < 180) {
			r = 0; g = c; b = x;
		} else if (180 <= h && h < 240) {
			r = 0; g = x; b = c;
		} else if (240 <= h && h < 300) {
			r = x; g = 0; b = c;
		} else if (300 <= h && h < 360) {
			r = c; g = 0; b = x;
		}

		const rgb = { r: r, g: g, b: b };

		const vr = Math.round((r + m) * 255);
		const vg = Math.round((g + m) * 255);
		const vb = Math.round((b + m) * 255);

		// !! notice it is not rgb, bgr !!
		let bgr = 0xFF000000 | vb << 16 | vg << 8 | vr;

		return {
			rgb: rgb,
			bgr: bgr
		}
	}

	static HSLModel(maxHue, s, l) {
		const hslColor = [];
		for(let i = 0; i <= maxHue; i++) {
			hslColor.push(ColorUtil.HSLToHex(i, s, l));
		}

		return hslColor;
	}

	createHSLModel(maxHue, s, l) {
		this.hslModel = ColorUtil.HSLModel(maxHue, s, l);
	}

	// -- no check! hahaha, can be danger
	getABGRHSLModel(i) {
		return this.hslModel[i].bgr;
	}

	getRGBHSLModel(i) {
		return this.hslModel[i].rgb;
	}
}