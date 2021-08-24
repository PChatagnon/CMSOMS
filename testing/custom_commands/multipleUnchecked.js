const PAUSE_TIME = 4000;
exports.command = function (checkboxesObj) {
    this.perform(()=>{
        for (let key in checkboxesObj) {
            if (checkboxesObj.hasOwnProperty(key)) {
                this.expect.element(checkboxesObj[key]).to.not.be.selected;
            }
        }
    });
    return this;
}
