const PAUSE_TIME = 4000;
/** Finds the column in the datatble(reuses xpaths of the portletComponent). If there is none adds it and then 
 * columnName - name of the column that is being searched on the headers of the datatable
 * callback - callback function which is used to get back the result
*/
exports.command = function (columnName, callback) {
    let columnIndex = 0;
    tableRow = this.globals.portletComponent.elements.tableRow;
    tableConfig = this.globals.portletComponent.buttons.tableConfig;
    tableHeader = this.globals.portletComponent.elements.tableHeader;
    columns = this.globals.portletComponent.buttons.columns;
    columnsMenu = this.globals.portletComponent.elements.columnsMenu;
    datatable = this.globals.portletComponent.elements.datatable;

    this.waitForElementPresentCustom(datatable, PAUSE_TIME, "portletComponent.elements.datatable");
    this.waitForElementPresentCustom(tableRow, PAUSE_TIME, "portletComponent.elements.tableRow");
    this.waitForElementPresentCustom(tableConfig, PAUSE_TIME, "portletComponent.buttons.tableConfig");
    this.waitForElementPresentCustom(tableHeader, PAUSE_TIME, "portletComponent.elements.tableHeader");

    this.elements('xpath', datatable + "//th", elements => {
        this.perform(() => {
            for (let i = 1; i <= elements.value.length; i++) {
                this.getText("(" + datatable + "//th)[" + i + "]", result => {
                    if (result.value == columnName) {
                        columnIndex = i;
                    }
                });
            }
        });
    });
    this.perform(() => {
        if (columnIndex == 0) {
            this.click(tableConfig);
            this.waitForElementPresentCustom(columns, PAUSE_TIME, "portletComponent.buttons.column");
            this.click(columns);
            this.waitForElementPresentCustom(columnsMenu + "/descendant-or-self::*[text()='" + columnName + "']", PAUSE_TIME, "portletComponent.elements.columnsMenu //* that has text equal to " + columnName);
            this.click(columnsMenu + "/descendant-or-self::*[text()='" + columnName + "']");
            this.elements('xpath', datatable + "//th", elements => {
                this.perform(() => {
                    for (let i = 1; i <= elements.value.length; i++) {
                        this.getText("(" + datatable + "//th)[" + i + "]", result => {
                            if (result.value == columnName) {
                                columnIndex = i;
                            }
                        });
                    }
                });
            });
        }

    });
    this.perform(()=>{
            if (typeof callback === "function") {
                callback.call(this, columnIndex);
            }
    });


    return this;
};