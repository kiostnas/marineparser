/**
 * This file is for front-end
 */

// ##export="DNDFileList:DNDFileList"
export {DNDFileList}

class DNDFileList {
	constructor(listExts) {
		this.listFiles = [];
		this.mapGroup = {};
		this.listExts = listExts;
	}

	addFile(file) {
		const name = file.name.match(/^(.*)\.([^.]*)$/i);
		if(name) {
			const filename = name[1];
			const ext = name[2];
			const lower = ext.toLowerCase();

			const found = this.listExts.findIndex(rawExts => lower === rawExts);
			if(-1 !== found) {
				this.listFiles.push(file);
				if(!this.mapGroup.hasOwnProperty(filename)) {
					this.mapGroup[filename] = [];
				}

				this.mapGroup[filename].push(file);
			}
		}
	}

	getGroup(name) {
		if(!this.mapGroup.hasOwnProperty(name)) {
			return undefined;
		}

		return this.mapGroup[name];
	}

	setButton(id, fn) {
		const parentFileGroup = document.getElementById(id);
		parentFileGroup.innerHTML = ''; // Clear

		Object.keys(this.mapGroup).forEach((fileName) => {
			const btn = document.createElement('button');
			btn.innerText = fileName;
			btn.addEventListener('click', () => {
				fn(this.mapGroup[fileName]);
			});
			parentFileGroup.append(btn);
		});
	}

	static async readFileArrayBuffer(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				resolve(reader.result);
			};

			reader.readAsArrayBuffer(file);
		});
	}

	static LocalFile(area, fn) {
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
}