export {MPLog};

/**
 * To track time consuming jobs
 */

class MPLog {
	constructor() {
		this.clear();
	}

	now(title) {
		this.timestamp.push({ts: new Date().getTime(), title: title});
	}

	clear() {
		this.timestamp = [];
	}

	outconsole() {
		for(let i = 1; i < this.timestamp.length; i++) {
			const prev = this.timestamp[i - 1];
			const curr = this.timestamp[i];
			const diff = curr.ts - prev.ts;
			console.log(`${diff}ms - ${prev.title} ~ ${curr.title}`);
		}
	}
}