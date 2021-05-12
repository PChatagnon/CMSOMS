import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Collapse from '@material-ui/core/Collapse';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { openLeftbar, hideLeftbar, openSnackbar } from '../actions/appActions';
import { openController, hideController } from '../actions/controllerActions';
import PortletGrid from './PortletGrid';
import Tour from 'reactour';

function mapStateToProps(state) {
    return {
        app: state.app,
        user: state.user,
        portlets: state.portlets,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({
            openLeftbar, hideLeftbar, openController, hideController, openSnackbar
        }, dispatch),
        dispatch
    };
}

const styles = theme => ({
    card: {
        margin: 10, marginBottom: 5, overflowX: 'hidden'
    },
    title: {
        fontSize: 15,
    },
    header: {
        padding: 14,
        paddingBottom: 0,
        paddingRight: 28
    },
    content: {
        padding: 0,
        paddingLeft: 16,
        overflowY: 'auto'
    },
    actions: {
        paddingBottom: 6,
        paddingLeft: 14,
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
});

class Tutorial extends React.PureComponent {

    constructor() {
        super()
        this.state = {
            tourOpen: false,
            expanded: true,
        }
    }

    closeTour = () => this.setState({ tourOpen: false });

    openTour = () => {
        const { layoutBreakpoint } = this.props.portlets;
        const largeScreen = layoutBreakpoint !== 'sm' && layoutBreakpoint !== 'xs' && layoutBreakpoint !== 'xxs';

        if (!largeScreen) return this.props.openSnackbar("It's only possible to take a tutorial on a high resolution devices.");
        this.setState({ tourOpen: true, expanded: false })
    };

    onExpand = () => this.setState({ expanded: !this.state.expanded });

    onMinimize = () => this.setState({ expanded: false });

    render() {
        const { classes } = this.props;
        return (
            <div>
                <Card className={classes.card} id='tutorialContainer'>
                    <CardHeader
                        title="Tutorial"
                        action={
                            <IconButton
                                className={classnames(classes.expand, {
                                    [classes.expandOpen]: this.state.expanded,
                                })}
                                onClick={this.onExpand}
                                aria-expanded={this.state.expanded}
                                aria-label="Show more"
                            >
                                <ExpandMoreIcon />
                            </IconButton>
                        }
                        classes={{
                            title: classes.title,
                            root: classes.header
                        }}
                    />
                    <Collapse in={this.state.expanded} timeout='auto'>
                        <CardContent className={classes.content}>
                            <p>
                                Hello {this.props.user.name}, welcome to Online Monitoring System (OMS) Portal tutorial.<br />
                                The purpose of this tutorial is to introduce you briefly with the main user interface elements and functionality of the Portal.<br />
                                Please press Begin to start the tutorial.
                                </p>
                        </CardContent>
                        <CardActions className={classes.actions}>
                            <Button onClick={this.openTour}>Begin</Button>
                        </CardActions>
                    </Collapse>
                </Card>
                <PortletGrid location={this.props.location}/>
                <Tour
                    isOpen={this.state.tourOpen}
                    onRequestClose={this.closeTour}
                    steps={this.tourConfig()}
                    className='tutorial-helper'
                    lastStepNextButton='Finish'
                    rounded={3}
                />
            </div >
        );
    }

    tourConfig = () => [
        {
            selector: '[data-tut="tutorial_workspaces"]',
            content: () => (
                <div>
                    <span>Workspace</span>
                    <p>Let's start with a Workspace - top-level container for Folders, Pages and eventually - Controllers and Portlets. While switching to different Workspace you are
                    moving to completely different organization of the Folders and Pages. But keep in mind - Portlets and Controllers, i.e. actual content containers can be
                    reused within different Workspaces! So do not get confused if you encounter the Plot previously seen in other Workspace!</p>
                </div>
            ),
            style: {
                maxWidth: 700,
            },
            position: 'bottom',
        },
        {
            selector: '[data-tut="tutorial_folders"]',
            content: () => (
                <div>
                    <span>Folder</span>
                    <p>Folder is just a usual folder... Just like anywhere else it keeps some items, in this case - Pages together and does not let them fall apart.
                    Oh, btw, pay attention to Folder name as it might mean something.</p>
                </div>
            ),
            style: {
                maxWidth: 550,
            },
            position: 'bottom',
        },
        {
            selector: '[data-tut="tutorial_pages"]',
            content: () => (
                <div>
                    <span>Page</span>
                    <p>Finally - this is a Page. It is the terminal content container that has a unique URL. Thus you can copy and share it! Each page is composed of Controller
                    (optional) and some Portlets (optional too). If both are not present so the Page is ...hmmm... empty?</p>
                </div>
            ),
            style: {
                maxWidth: 650,
            },
            position: 'bottom',
        },
        {
            selector: '[data-tut="tutorial_controller"]',
            content: () => (
                <div>
                    <span>Controller</span>
                    <p>
                        Page Controller is a box that provides means for the user (you) to apply selection on the Page.
                        I.e. select a date, date range, vehicle plate number or like here - Run number.
                        Go ahead and try to open the controller (if succeeded press next).
                    </p>
                </div>
            ),
            style: {
                top: 35,
                maxWidth: 700,
            }
        },
        {
            selector: '[data-tut="tutorial_controller_box"]',
            content: () => (
                <div>
                    <span>Controller</span>
                    <p>
                        As we said earlier in this controller you can select a Run number.
                        After selection is done you need to press OK or Apply for the query (as we call it) to be sent further,
                        to the Portlets. There are more buttons to consider but we leave them for you to try by yourself later.
                    </p>
                </div>
            ),
            action: () => { this.props.openController() },
            position: 'top',
            style: {
                left: 25,
                maxWidth: 700,
            }
        },
        {
            selector: '[data-tut="tutorial_portlet_2410"]',
            content: () => (
                <div>
                    <span>Portlet (Table)</span>
                    <p>This is the Portlet - a rectangular dummy content container that sits there on the screen and displays something. In this case we see a table with some possibly
                important values. We could end up there but the point is that this table is the reason this Portal (or say - website) has been created! Portlet can contain any
                content, i.e. tables, numerical values, some text, (psss - now you press Next) ...  </p>
                </div>
            ),
            style: {
                left: 25,
                maxWidth: 800,
            }
        },
        {
            selector: '[id=footerConfigBtn]',
            content: () => (
                <div>
                    <span>Table Footer</span>
                    <p>Each table has a special config button where it's possible to add/remove columns and filter table entries. Reset buton will get you back to the default.</p>
                </div>
            ),
            observe: '[data-tut="footerConfigToolbar"]',
            position: 'top',
            style: {
                maxWidth: 500,
            }
        },
        {
            selector: '[data-tut="tutorial_portlet_2411"]',
            content: () => (
                <div>
                    <span>Portlet (Chart)</span>
                    <p>Portlet can even contain charts, plots, etc. Along with the rectangle that marks the so deserved Portlet boundary on the screen.</p>
                </div>
            ),
            style: {
                maxWidth: 500,
            }
        },
        {
            selector: '[data-tut="tutorial_portlet_header_2411"]',
            content: () => (
                <div>
                    <span>Portlet Header</span>
                    <p>Each Portlet has a name and a set of buttons where they can be refreshed, collapsed or made full screen.</p>
                </div>
            ),
            style: {
                maxWidth: 400,
            }
        },
        {
            selector: '.highcharts-button',
            content: () => (
                <div>
                    <span>Chart Button</span>
                    <p>Dynamic chart portlets have a special feature to be downloaded in various image formats.</p>

                </div>
            ),
            observe: '.highcharts-container',
            style: {
                maxWidth: 400,
            }
        },
        {
            selector: '[data-tut="tutorial_hamburger"]',
            content: () => (
                <div>
                    <span>Hamburger</span>
                    <p>
                        For your convenience Folders and Pages in the Workspace can be accessed by clicking on the hamburger button in the left corner.
                    </p>
                </div>
            ),
            action: () => { this.props.hideController() },
            //observe: '.reactour__body',
            style: {
                maxWidth: 400,
                left: 15,
            }
        },
        {
            selector: '[data-tut="tutorial_toolsmenu"]',
            content: () => (
                <div>
                    <span>Menu button</span>
                    <p>
                        On another corner we have prepared a menu to access some additional services.
                        Here you will find a way to Print the Page, Copy Page URL, Refresh or even
                        Report an Issue if something goes wrong.
                        Also, as you have noticed already we know your name, so we provide you a button to make
                        us forget it (Sign Out button).
                    </p>
                </div>
            ),
            //observe: '.tools-menu',
            //action: this.props.hideLeftbar,
            style: {
                maxWidth: 600,
                top: 35,
            }
        },
        {
            selector: '[data-tut="tutorial_oms_title"]',
            content: () => (
                <div>
                    <span>The End!</span>
                    <p>
                        This concludes our brief tutorial about the Portal.
                        Thank you for spending your time with us.
                        We hope that you will find OMS useful in your daily work!
                        To go back to the index page you can press to the CMS OMS title. Good luck!
                    </p>
                </div>
            ),
            style: {
                maxWidth: 600,
                top: 35,
            }
        },
    ];
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(withStyles(styles)(Tutorial));
