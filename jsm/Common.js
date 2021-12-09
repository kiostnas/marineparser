/**
 * This file is for back-end
 */

// ##export="MarineParserCommon:MarineParserCommon"
export { MarineParserCommon }

class MarineParserCommon {

    /**
    * 
    * @param {*} obj 
    * @param {*} exp expression to access obj's attributes, "Coefficients[1].A"
    * returns obj[exp[1].ABCD.EFG]; or undefined
    */
    static getValueFromObject(obj, exp) {
        const m = exp.match(/([^\.\[]*)/g);
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
}