// Device Event Listener
document.addEventListener("deviceready", onDeviceReady, false);

// debug - per provare senza ripple document.addEventListener("DOMContentLoaded", onDeviceReady, false);


var usedProfileName, loginProfiles, configs, currentProfile, debug;

function initApp()
{
    usedProfileName = "asx";

    loginProfiles = new LoginProfiles();
    loginProfiles.save();

    configs = new Configs(20, 20);
    configs.save();

    debug = new DebugLog();
}

function onDeviceReady() {
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

    /* click on login -> call search page */
    $('#login_button').on('tap', login);

    /* get messages data via ajax */
    $("#search_button").on('tap', search);

    /* click on home icon (up-left) -> logout */
    $(".ui-icon-home").on('tap', logout);
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

var isUrlValid = function(url) {
    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}

var guid = function () {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? p.substr(0,4) + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}