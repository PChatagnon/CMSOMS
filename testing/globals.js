
module.exports = {
    sideMenu: {
        buttons: {
            open: "//*[@id='menuButton']", //button for opening "hamburger" menu
        },
        elements: {
            close: "//div[@role = 'document']//span[text() = 'Close']", //element for closing side menu
            currentPage: "//div[@*='Page']", //element on which Page name is written
            folder: "//div[@role = 'document']/nav/div[3]/div[1]", //element of the first folder
            page: "//div[@role = 'document']/nav/div[3]/div[2]/div/div/div/a[1]", //element of page in elements.folder folder
        },
    },
    appBar: {
        buttons: {
            menu: "//*[@id='toolsMenuButton']", //button for opening menu on the app bar
            close: "//button//span[text() = 'Cancel']", //button for closing menu
        },
        elements: {
            menu: "//*[@id='tools-menu']", //element that appears when buttons.menu is clicked
            about: "//*[@role = 'menuitem']//*[text() = 'About']", //menu item for about
            headerAbout: "//h2[contains(text(),'About')]", //header of about window
            workspace: "//header//div[@id='workspacesHeaderMenu']", //menu containing workspaces (on app bar)
            workspaceDropdown: "//div[@role='menu']",
            page: "//header//div[@id='pagesHeaderMenu']", //menu containing pages (on app bar)
            pageDropdown: "//div[@role='menu']",
            folder: "//header//div[@id='foldersHeaderMenu']", //menu containing folders (on app bar)
            folderDropdown: "//div[@role='menu']", //dropdown menu containing folders(is present when elements.folder is clicked)
            title: "//*[@id='main']/div/div[1]/div[1]/header/div/a[2]", //title element(brings to index page when clicked)
        },
    },
    fullScreen: {
        buttons: {
            open: "//button[contains(@*, 'Full') or (@*='Full Screen')]",// portlet button for full screen
            close: "//button[@aria-label='Close']",// button that closes the full screen window
            menu: "//*[@id='fullScreenHeader']/div/div/button", // menu button in fullscreen window

        },
        elements: {
            fullscreen: "//header[@id='fullScreenHeader']", // fullscreen window that appears when buttons.open is clicked 
            menu: "//ul[@role='menu']", // menu element that appears on screen when buttons.menu is clicked
            refresh: "//ul[@role='menu']//span[contains(.,'Refresh')]",
            print: "//ul[@role='menu']//span[contains(.,'Print')]",
            copy: "//ul[@role='menu']//span[contains(.,'Copy')]",
            copySuccessful: "//*[contains(text(), 'URL was successfully')]",//element that appears when element.copy is clicked
        },
    },
    portletComponent: {
        //if element is in a footer start xpath from the footer node. in tests the footer node will be added before the elements xpath
        columnIndex: 1, // column which is going to be sorted and will be removed and added again index
        portletComponent: "/cms/fills/summary", // portlet component to be tested
        portletComponentFilter: "/cms/fills/report/fullscreen/1173?cms_fill=6956", // portlet component for testing filtering. Must be in fullscreen mode
        filterColumns: ['Group', 'Category'], // column names for filtering. Has to be already present in a table header
        buttons: {
            refresh: "//button[@*='Refresh']",
            minimize: "//button[@*='Minimize']",//button to minimize portlet. elements.table should not be present in document when clicked
            maximize: "//button[@*='Maximize']",//button to maximize portlet
            tableConfig: "//button[@id='footerConfigBtn']",
            columns: "//button//span[contains(text(), 'Columns')]",//button on a footer
            rows: "//div[@id='footerRowSize']//button", // button on a footer for elements.rowsMenu to appear
            firstPage: "//button[@id='footerFirstPageBtn']",//button on a footer
            lastPage: "//button[@id ='footerLastPageBtn']",//button on a footer
            nextPage: "//button[@id='footerNextPageBtn']",//button on a footer
            previousPage: "//button[@id='footerPrevPageBtn']",//button on a footer
            filter: "//button[@id='footerFilterBtn']", //filter button
            info: "//button[contains(@title,'List of Fills') or (@*='List of Fills. Brief information about each Fill')]",
        },
        elements: {
            datatable: "//table",
            datatableFilter: "//header[@id='fullScreenHeader']//parent::*//table",
            tableHeader: "//table//th", //header of a table can be iterated through
            tableHeaderFilter: "//header[@id='fullScreenHeader']//parent::*//table//th",
            tableRow: "//table//tr", //row of a table. can be iterated through, has //td element(s)
            tableRowFilter: "//header[@id='fullScreenHeader']//parent::*//table//tr",
            columnsMenu: "//div[@role='menu']", // element on a footer of menu that appears when buttons.columns is clicked
            footer: "//div[@id = 'tableFooter']", // footer of a table. will be starting node if element is based in a footer
            footerFilter: "//header[@id='fullScreenHeader']//parent::*//div[@id = 'tableFooter']", //footer of a table that is for filtering tests
            rowsMenu: "//div[@role='menu']", // element on a footer containing slection of how much rows per page will be shown. Appears when buttons.rows is clicked.
            pageNumber: "//input[@id='footerPageNumber']//parent::div", //element on a footer, element has to have page numbers in itself(format (Page x of y))   
            loadingScreen: "//*[@class='Loader__message']",
            errorScreen: "//*[@*='Loader__message']/descendant-or-self::*[starts-with(text(),'Failed to fetch data')]",
            filterMenu: "//div[@role='menu']//span[@role='menuitem']",//menu for filters, appears when buttons.filter is clicked
            infoMessage: "//*[contains(text(),'List of Fills. Brief information about each Fill')]", // message that appears when you hover over buttons.info
        },
        inputs: {
            page: "//input[@id='footerPageNumber']", //input field in a footer for page number
            filter: "//input[@id='footerSearchField']", //input field for filtering
        }
    },
    controller: {
        //basic controller elements applicable to other controllers
        buttons: {
            apply: "//button//span[text()='Apply' or text()='apply' or text()='APPLY']",
            ok: "//button//span[text()='Ok' or text()='ok' or text()='OK']",
            reset: "//button//span[text()='Reset' or text()='reset' or text()='RESET']",
            close: "//button//span[text()='Close' or text()='close' or text()='CLOSE']",
            hide: "//button[contains(@*,'Hide') or (@*='Hide Controller')]"
        },
        elements: {
            controllerOpen: "(//header//div[@class='HeaderDropDownMenu'])[4]",//button in header that makes controller container appear
            //TODO: button ID. Too complicated to find
            controllerContainer: "//*[@id='controllerContainer']",//will be the base node to other xpaths. That will be done in test functions
        },
    },
    controllerFillReport: {
        fillReport: "/cms/fills/report",
        buttons: {
            previous: "//*[@id='prevButton']",
            next: "//*[@id='nextButton']",
        },
        elements: {
            fillNumber: "(//table//tr/td[text()='Fill']/parent::tr//td)[2]/div",// element that shows fill number(in fill details table)
        },
        inputs: {
            fill: "//label[contains(., 'Fill')]/ancestor::div/input",//input field for fill number
        },
    },
    controllerFillSummary: {
        protonsFrom: 7053,
        protonsTo: 7153,
        ionsFrom: 4650,
        ionsTo: 4750,
        protonsIonsFrom: 3500,
        protonsIonsTo: 3600,
        notStableFill: 7126,
        stableFill: 7125,
        era: "2018B",
        fillSummary: "/cms/fills/summary",
        radioButtons: {
            fillRange: "//input[contains(@type,'radio') and contains(@value, 'fill')]",
            dateRange: "//input[contains(@type,'radio') and contains(@value, 'date')]",
            era: "//input[contains(@type,'radio') and contains(@value, 'era')]",
        },
        checkboxes: {
            stable: "//label[contains(text(),'Stable')]/ancestor::*/input",
            protons: "//label[text()='Protons only']/ancestor::*/input",
            ions: "//label[text()='Ions only']/ancestor::*/input",
            protonsIons: "//label[contains(text(),'Protons-Ions')]/ancestor::*/input",
        },
        buttons: {
            era: "//*[@id='eraMenu']",
        },
        elements: {
            era: "//div[@role = 'menu']",
            eraItem: "//div[@role='menu']//span[@role = 'menuitem']",//items in elements.era. items will be searched by adding //*[contains(text(),era)]
        },
        inputs: {
            fillFrom: "//label[contains(. , 'Fill') and contains(.,'From')]/parent::*//input",
            fillTo: "//label[contains(. , 'Fill') and contains(.,'To')]/parent::*//input",
            dateFrom: "//label[contains(. , 'Date') and contains(.,'From')]/parent::*//input",
            dateTo: "//label[contains(. , 'Date') and contains(.,'To')]/parent::*//input",
        }
    },
    controllerRunReport: {
        runReport: "/cms/runs/report",
        runSequence: "AUG-GLOBAL-RUN",//runSequence used for change sequence test
        buttons: {
            previous: "//*[@id='prevButton']",
            next: "//*[@id='nextButton']",
            sequence: "//label[contains(text(), 'Sequence')]//parent::*//button",
        },
        elements: {
            sequenceMenu: "//div[@role='menu']",
            sequenceItem: "//div[@role='menu']//span[@role='menuitem']",//can be iterated through
            sequenceName: "(//td[text() = 'Sequence']/parent::tr/td)[2]",//element which includes current sequence name
            runNumber: "(//table//tr/td[text()='Run']/parent::tr//td)[2]/div",//element which includes run number
        },
        inputs: {
            run: "//label[contains(text(),'Run')]//parent::*//input",
        },
    },
    controllerRunSummary: {
        runSummary: "/cms/runs/summary",
        runRangeFrom: 322680,
        runRangeTo: 322780,
        sequenceName: 'DEFAULT',//name for changing sequence 
        radioButtons: {
            fill: "//input[contains(@type,'radio') and contains(@value, 'fill')]",
            runRange: "//input[contains(@type,'radio') and contains(@value, 'run')]",
            dateRange: "//input[contains(@type,'radio') and contains(@value, 'date')]",
        },
        checkboxes: {//checkboxes with corresponding label text
            castor: "//label[text()='Castor']/ancestor::*/input",
            csc: "//label[text()='CSC']/ancestor::*/input",
            ctpps_tot: "//label[text()='CTPPS_TOT']/ancestor::*/input",
            daq: "//label[text()='DAQ']/ancestor::*/input",
            pixel: "//label[text()='PIXEL']/ancestor::*/input",
            pixel_up: "//label[text()='PIXEL_UP']/ancestor::*/input",
            rpc: "//label[text()='RPC']/ancestor::*/input",
            scal: "//label[text()='SCAL']/ancestor::*/input",
            dqm: "//label[text()='DQM']/ancestor::*/input",
            tracker: "//label[text()='TRACKER']/ancestor::*/input",
            hcal: "//label[text()='HCAL']/ancestor::*/input",
            ecal: "//label[text()='ECAL']/ancestor::*/input",
            dt: "//label[text()='DT']/ancestor::*/input",
            es: "//label[text()='ES']/ancestor::*/input",
            hf: "//label[text()='HF']/ancestor::*/input",
            trg: "//label[text()='TRG']/ancestor::*/input",
        },
        buttons: {
            sequence: "//label[contains(text(), 'Sequence')]//parent::*//button",
        },
        elements: {
            sequence: "//div[@role='menu']",
            sequenceMenuItem: "//div[@role='menu']//span[@role='menuitem']",//items in the sequence element that can be iterated through
        },
        inputs: {
            fill: "//label[contains(text(), 'Fill')]//parent::*/input",
            runFrom: "//label[contains(text(), 'Run') and contains(text(),'From')]//parent::*/input",
            runTo: "//label[contains(text(), 'Run') and contains(text(),'To')]//parent::*/input",
            dateFrom: "//label[contains(text(), 'Date') and contains(text(),'From')]//parent::*/input",
            dateTo: "//label[contains(text(), 'Date') and contains(text(),'To')]//parent::*/input",
        }
    },
    router: {
        workspace: "/cms",
        folder: "/fills",
        page: "/report",
        transition1: "/cms/fills/summary",//first url for transition test
        transition2: "/cms/fills/report",//second url for transition test
        elements: {
            loadingScreen: "//*[@class='Loader__message']",
            portlet1: "//*[contains(text(),'Fill Summary')]", //portlet that is present when navigating to transition1
            portlet2: "//*[contains(text(),'Fill Details')]", //portlet too look for to know if transition has happened(when navigating to transition2)
        }
    },
};