function DNDLocalFile(area, fn) {
	// -- Prevent, Stop
	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
		area.addEventListener(eventName, (e) => {e.preventDefault();e.stopPropagation();}, false)
	});

	// -- Highlight
	['dragenter', 'dragover'].forEach(eventName => {
		area.addEventListener(eventName, () => {area.classList.add('highlight')}, false)
	});

	// -- Unhighlight
	['dragleave', 'drop'].forEach(eventName => {
		area.addEventListener(eventName, () => {area.classList.remove('highlight')}, false)
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
		if(0 === item.length) {
			return;
		}

		// -- [4] -> int 4
		if(item.match(/(\d+)\]$/)) {
			list.push(parseInt(item))
		} else {
			list.push(item);
		}
	});

	if(0 === list.length) {
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

