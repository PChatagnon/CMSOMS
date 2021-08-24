exports.command = function (selector, time, fieldName = '') {
    this.perform(() => {
        this.waitForElementNotPresent(selector, time, "Waiting "+ time +" ms for element  " + fieldName + " to not be present.\nXpath selector:%s \nWaited for %d ms");
    });
}