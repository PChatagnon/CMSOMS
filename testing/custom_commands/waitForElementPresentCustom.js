exports.command = function(selector, time, fieldName = ''){
    this.perform(()=>{
        this.waitForElementPresent(selector, time, "Waiting "+ time +" ms for element  " + fieldName + " to be present.\nXpath selector:%s \nWaited for %d ms");
    });
}

