function DNDLocalFile(area, fn) {
	// -- Prevent, Stop
	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
		area.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false)
	});

	// -- Highlight
	['dragenter', 'dragover'].forEach(eventName => {
		area.addEventListener(eventName, () => { area.classList.add('highlight') }, false)
	});

	// -- Unhighlight
	['dragleave', 'drop'].forEach(eventName => {
		area.addEventListener(eventName, () => { area.classList.remove('highlight') }, false)
	});

	// -- Drop
	area.addEventListener('drop', (e) => {
		let dt = e.dataTransfer;
		let files = dt.files;

		fn(files);
	}, false);

	const input = area.querySelector('input[type="file"]');
	input.addEventListener('change', () => {
		fn(input.files);
	});
}

function DOMSpan(str) {
	const e = document.createElement("span");
	e.innerHTML = str;
	return e;
}

function DOMP(str) {
	const e = document.createElement("p");
	e.innerHTML = str;
	return e;
}

function DOMSetHtml(id, html) {
	document.getElementById(id).innerHTML = html;
}

// -- DOMGetChecked('nameofinput')[0].value
function DOMGetChecked(name) {
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

/**
 * 
 * @param {*} obj 
 * @param {*} exp expression to access obj's attributes, "Coefficients[1].A"
 * returns obj[exp[1].ABCD.EFG]; or undefined
 */
function getValueFromObject(obj, exp) {
	const m = matchAttributeExpression(exp);
	const list = [];
	m.forEach(item => {
		if (0 === item.length) {
			return;
		}

		// -- [4] -> int 4
		if (item.match(/(\d+)\]$/)) {
			list.push(parseInt(item))
		} else {
			list.push(item);
		}
	});

	if (0 === list.length) {
		console.log(`getValueFromObject Invalid expression ${obj}, '${exp}'`);
		return undefined;
	}

	let dest = obj;
	list.forEach(name => dest = dest[name]);

	return dest;
}

// -- Used at CTD
function matchAttributeExpression(exp) {
	const m = exp.match(/([^\.\[]*)/g);
	return m;
}

// -- file object to string
async function readFileString(file) {
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
async function readFileChunkString(file) {
	const s = file.stream();
	const r = s.getReader();
	const uint8array = await r.read();
	return new TextDecoder().decode(uint8array.value.buffer);
}

// -- things like D3, moved from GeoSpatial
function scaleLinear(domain, range) {
	const diffDomain = domain[1] - domain[0];
	const diffRange = range[1] - range[0];

	return (v) => {
		return range[0] + diffRange * ((v - domain[0]) / diffDomain);
	}
};

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
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
		this.obj[name] = { domain: domain, range: range, scale: scale };
	}

	get(name, value) {
		if (this.obj[name]) {
			return this.obj[name].scale(value);
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