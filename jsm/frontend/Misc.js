/**
 * This file is for front-end
 */

// ##export="DOMUtil:DOMUtil"
// ##export="FileUtil:FileUtil"
// ##export="ScaleBox:ScaleBox"

export { DOMUtil, FileUtil, ScaleBox }

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
		if(this.obj[name]) {
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