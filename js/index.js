// Device Event Listener
document.addEventListener("deviceready", onDeviceReady, false);

// debug - per provare senza ripple document.addEventListener("DOMContentLoaded", onDeviceReady, false);


var usedProfileName , loginProfiles, configs, currentProfile;

function initApp()
{
    usedProfileName = "asx";

    loginProfiles = new LoginProfiles();
    loginProfiles.save();

    configs = new Configs(20, 20);
    configs.save();
}

function onDeviceReady() {

    $.guid = 0;

    initApp();

    //nelle prossime versioni sarà un elemnto di una lista di profili
    currentProfile = loginProfiles.getProfileByName(usedProfileName);

    if( currentProfile != null 
        && currentProfile.getProperty("cryptedCredential") != null 
        && currentProfile.getProperty("passwordHash") != null
        && checkTimeout(currentProfile.getProperty("lastUseDate"), configs.getProperty("timeout")) 
        )
    {
        $.mobile.changePage("#search_page");
    }
    else
    {
        $.mobile.changePage("#login_page");
    }

    $("#login_page").on( "pageload", function( event ) {
        
        if(currentProfile)
        {
            $("#apiurl").val(currentProfile.getProperty("apiurl"));
            $("#username").val(currentProfile.getProperty("username"));
        }

        $(".login-success").hide();
        $(".login-error").hide();
     } );

    /* click on login -> call search page */
    $("#login_button").click(function() {
        login();
    });

    $("#search_page").on( "pageload", function( event ) {
        /* adjust some style */
        $("#search_result").css("margin-top","0.3em").hide();
     } );

    /* get messages data via ajax */
    $("#search_button").click(function() {
        search();        
    }); 

    /* click on home icon (up-left) -> logout */
    $(".ui-icon-home").click(function() {
        logout();
    });    
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

/* get message data via ajax */
GetMessageDetail = function()
{
    $.ajax({url: "./message_data.js",
        dataType: "json",
        async: true,
        success: function (data) { 
            /* load message template */
            var d_template = $('#messageTemplate').html();
            /* bind data to template */
            var msg = Mustache.to_html(d_template, data);       
            
            /* load data into ul... */
            $('#message_detail').html(msg);
            
            /* make styles adjustment */
            $("#back_to_search").css("margin-top","1.5em");
            $("#d_message").css("white-space","normal");
            $("#sbj").css("white-space","normal");      
            
            /* click on "back to search" -> return to seach page */
            $("#back_to_search").click(function() {
                $.mobile.changePage("#search_page");
            });  
        },
        error: function (request,error) {
            alert('Network error has occurred please try again!');
        }
    });
}

var getAbsolutePath = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l.pathname;
};

var isUrlValid = function(url) {
    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}