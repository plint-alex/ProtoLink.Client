import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import React, { PropsWithChildren } from 'react';


const RootDiv = styled('div')(() => ({

    display: 'flex',
    minHeight: '100vh',
}));
const ContentMain = styled('main')(({ theme }) => ({
    padding: theme.spacing(3),
    width: '100%',
}));


type FooProps = {
    name: string
}

export const Layout: React.FC<PropsWithChildren<FooProps>> = (props) => {
    return (
        <RootDiv>
            <CssBaseline />
            <ContentMain >
                {props.children}
            </ContentMain>
        </RootDiv>
    )
}



//const styles = theme => ({
//    root: {
//        display: 'flex',
//        minHeight: '100vh',

//    },
//    logo: {
//        marginTop: theme.spacing(1),
//        height: theme.mixins.toolbar.minHeight - theme.spacing(2),
//        marginRight: theme.spacing(10),
//    },
//    content: {
//        //flexGrow: 1,
//        padding: theme.spacing(3),
//        width: '100%',
//    },
//});

//class Layout extends Component {
//    constructor(props) {
//        super(props);
//        this.state = {
//            canRedirect: false,
//        };
//    }

//    componentDidCatch(error, info) {

//        this.props.enqueueSnackbar({
//            message: error.message,
//            options: {
//                key: new Date().getTime() + Math.random(),
//                variant: 'error'
//            },
//        });
//    }

//    render() {
//        const { children, classes } = this.props;
//        return (
//                <div className={classes.root}>
//                    //<WaitDialog />
//                    //<Notifier />
//                    <CssBaseline />

//                    <main className={classes.content}>

//                        {children}
//                    </main>
//                </div>
//        );
//    }
//}

//let mapState = (state) => {

//    return {
//    };
//};

//let mapDispatch = (dispatch) => {
//    return {
//        enqueueSnackbar: bindActionCreators(notifierActionCreators.enqueueSnackbar, dispatch),
//    };
//};
//const ConnectedLayout = connect(mapState, mapDispatch)(Layout);

//const StyledLayout = (props) => {
//    return <ConnectedLayout {...props} />;
//}


//export default withStyles(styles)(StyledLayout);