// Device Event Listener
document.addEventListener("deviceready", onDeviceReady, false);

// debug - per provare senza ripple document.addEventListener("DOMContentLoaded", onDeviceReady, false);


var usedProfileName, loginProfiles, configs, currentProfile, debug, cpage, totResult, cAttachId, cAttachName;

function initApp()
{
    usedProfileName = "asx";

    if(!loginProfiles)
    {
        loginProfiles = new LoginProfiles();
        loginProfiles.save();
    }

    configs = new Configs(20, 20, 1);
    configs.save();

    debug = new DebugLog();
}

function onDeviceReady() {
    
    var store;
    var assetURL;
    var fileName;

    initApp();

    //nelle prossime versioni sarà un elemnto di una lista di profili
    currentProfile = loginProfiles.getProfileByName(usedProfileName);

    if( currentProfile != null 
        && currentProfile.getProperty("cryptedCredential") != null 
        && currentProfile.getProperty("passwordHash") != null
        && checkTimeout(currentProfile.getProperty("lastUseDate"), configs.getProperty("timeout")) 
        )
    {
        //$.mobile.changePage("#search_page");
        $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
    }
    else
    {
        //$.mobile.changePage("#login_page");
        $( ":mobile-pagecontainer" ).pagecontainer( "change", "#login_page", { transition : "none" } );
    }

    $("#login_page").on( "pagebeforeshow", function( event ) {
        
        if(currentProfile)
        {
            $("#host").val(currentProfile.getProperty("apiUrl"));
            $("#username").val(currentProfile.getProperty("username"));
            $("#password").val("");
        }

        $(".login-success").hide();
        $(".login-error").hide();
     } );


    $("#search_page").on( "pageshow", function( event ) {
        
        if($(".msg_selected").offset())
        {
            scrollto = $(".msg_selected").offset().top;
            $.mobile.silentScroll(scrollto);
            $(".msg_selected").removeClass("msg_selected");
        }

     } );    


    $("#details_page").on( "pageshow", function( event ) {
        
        if($("#html_message").html() != "")
        {
            $("#html_message").show();
            $("#txt_message").hide();
        }
        else
        {
            $("#html_message").hide();
            $("#txt_message").show();
        }

     } );    

    /* click on login -> call search page */
    $('#login_button').on('tap', login);

    /* get messages data via ajax */
    $("#search_button").on('tap', search);

    /* click on list icon (up-left) -> view menu */
    $(".menu_btn").on('tap', viewMenu);

    $(".home").on('tap', newSearch);
    $(".logout").on('tap', logout);
}

function viewMenu()
{
    $("#menu").slideDown();
}

function checkTimeout(lastUseDate, timeout)
{
    if(lastUseDate==null)
        return false;

    d2 = new Date();

    d1 = new Date(JSON.parse(lastUseDate));

    diff = d2.getTime() - d1.getTime(); //diff in millisecond

    if(diff/(1000*60) > timeout) // timeout in minutes
    {
        return false;
    }

    return true;
}

var getAbsolutePath = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l.pathname;
};

var guid = function () {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? p.substr(0,4) + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

