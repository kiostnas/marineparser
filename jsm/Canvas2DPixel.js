// ##export="Canvas2DPixel:Canvas2DPixel"
export {Canvas2DPixel}

class Canvas2DPixel {
	constructor(elementId) {
		this.canvas = undefined;
		this.ctx = undefined;

		const canvas = document.getElementById(elementId);
		if(!canvas) {
			console.error(`Invalid Canvas id '${elementId}'`);
			return;
		}

		try {
			const ctx = canvas.getContext('2d');
			this.ctx = ctx;
		} catch(e) {
			console.error(`Invalid Canvas id '${elementId}' not a canvas`);
			return;
		}

		this.canvas = canvas;
		// -- do not use calculated value, this canvas should be explicit, hidden canvas is 0*0
		this.w = this.canvas.width;
		this.h = this.canvas.height;
	}

	newImage() {
		// this.imageData = new ImageData(this.w, this.h);
		this.imageData = this.ctx.getImageData(0, 0, this.w, this.h);
		this.buf = new ArrayBuffer(this.imageData.data.length);
		this.buf8 = new Uint8ClampedArray(this.buf);
		this.buf32 = new Uint32Array(this.buf);
	}

	// getImage() {
	// 	if(this.imageData) {
	// 		console.warn(`Image data is exist`);
	// 		return false;
	// 	}

	// 	this.imageData = this.ctx.getImageData(0, 0, this.w, this.h);
	// }

	// -- Where color is bgrA
	draw32(x, y, Abgr) {
		if(x < 0 || y < 0 || x >= this.w || y >= this.h) {
			return;
		}

		const idx = y * this.w + x;
		if(this.buf32.length > idx) {
			this.buf32[idx] = Abgr;
		}
	}

	// -- bgrA
	draw32triple(x, y, Abgr) {
		if(x < 0 || y < 0 || (x + 1) >= this.w || (y + 1) >= this.h) {
			return;
		}

		this.buf32[y * this.w + x] = Abgr;
		this.buf32[(y + 1) * this.w + x] = Abgr;
		this.buf32[y * this.w + x + 1] = Abgr;

	}

	draw8(x, y, color) {
		if(x < 0 || y < 0 || x >= this.w || y >= this.h) {
			return;
		}

		const index = (y * this.w + x) * 4;

		// A R G B 0xAACCDDFF
		this.imageData[index]   = color && 0x00FF0000 >> 16; // R
		this.imageData[index + 1] = color && 0x0000FF00 >> 8;  // G
		this.imageData[index + 2] = color && 0x000000FF;       // B
		this.imageData[index + 3] = color && 0xFF000000 >> 24; // Alpha
	}

	fill(Abgr) {
		for(let i = 0; i < this.buf32.length; i++) {
			this.buf32[i] = Abgr;
		}
	}
	
	fillBlack() {
		this.fill(0xFF000000);
	}

	putImage() {
		this.ctx.imageSmoothingEnabled = false;
		this.ctx.mozImageSmoothingEnabled = false;
		this.ctx.webkitImageSmoothingEnabled = false;
		this.ctx.msImageSmoothingEnabled = false;

		this.imageData.data.set(this.buf8);
		this.ctx.putImageData(this.imageData, 0, 0);
		// this.imageData = undefined;
	}
}

// const c = new Canvas2DPixel('canvas');
// c.newImage();
// c.draw32(10, 10, 0xFF000000);
// c.draw32(20, 20, 0xFFCC0000);
// c.putImage();