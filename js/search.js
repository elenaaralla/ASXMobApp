function SearchModel(id,name,lastUsed,instance,srcText)
{
    this.Id = id;
    this.Name = name;
    this.LastUsed = lastUsed;
    this.Result = 0;
    this.Remove = 1;
    this.From = null;
    this.FromOperator = 1;
    this.To = null;
    this.ToOperator = 1;
    this.Subject = null;
    this.SubjectOperator  = 1;
    this.Body = null;
    this.DateFrom = null;
    this.DateTo = null;
    this.LastNDays = null;
    this.MsgWithAttach = 0;
    this.MsgAsSpam = -1;
    this.AttachName = null;
    this.AttachSize = null;
    this.UseFromAsTo = null;
    this.UsrIsExternal = null;
    this.UserId = 0;
    this.Instance = instance; 
    this.Type = 2; // 2=new mobile search
    this.Text = srcText; // seach field
}

/* click on search button -> display search result 
    result is a jason object like this:
    {
        "Id":<search id>,
        "TotNumResult":<tot. num. messages>,
        "messagesList":<messages>
    }       
    
    <messages> is an array of object (<message>)
    
    <message> is a json object like this
    {
        "Id":<message id>,
        "From":<message from>,
        "To":<message to>,
        "Subject":<message subject>,
        "Date":<message date>,
        "MsgSize":<message size>,
        "MsgPriority":<message priority>,
        "NrAttachments":<message number of attachments>,
        "MsgLocked":<message is locked>,
        "HtmlBody":<message html body>,
        "TextBody":<message text body>,
        "AttachmentsList":<attachments list
    }
*/

var Authentication = function(basestring)
{
    var cryptedCredentials =  currentProfile.getProperty("cryptedCredential");
    var passwordHash = currentProfile.getProperty("passwordHash");

    //Authentication:  {cryptedUserLogin}:{signature}
    return cryptedCredentials + ":" + Signature(basestring, passwordHash);
};

function search()
{
    stopCurrentSearch();

    numResultsToDisplay = $("#num_result_x_pages").val();
    configs.setProperty("resultsNumber",numResultsToDisplay);

    var dt = new Date($.now());
    var initSearchTime = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    var initSearchMsg = "Serch init at:" + initSearchTime;
    debug.log("DEBUG",initSearchMsg);
    $.mobile.loading( "show");

    var method = "POST";
    var searchApiPath = "/api/searches";   
    var bodyContent = JSON.stringify(new SearchModel(0,"New mobile search",new Date(),guid(),$("#search_criteria").val()));

    var timestamp = Timestamp();
    var host = currentProfile.getProperty("apiUrl");
    var basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    var authentication = Authentication(basestring);

    var searchApi = host + searchApiPath + "?asxcallback=?";

    $.ajax({
        url: searchApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication, "Content-Type": "application/json; charset=utf-8"},
        data: bodyContent,
        processData: false,
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) {
            debug.log("DEBUG",data);
            getSearchMessages(data.Id);
            $("#current_search_id").val(data.Id);
        },
        error: function (e) {
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

var PageRange = function (cpage)
{
    var numItemPerPage = configs.getProperty("resultsNumber");

    var nMsgsFrom = (cpage-1) * numItemPerPage + 1;
    var nMsgsTo = cpage * numItemPerPage;

    return nMsgsFrom + "-" + nMsgsTo;
};

var timerId=0;

function getSearchMessages(src_key, cpage)
{
    if(!cpage || cpage <= 0)
    {
        cpage = 1;
    }

    var pagerange = PageRange(cpage);

    var method = "GET";
    var searchApiPath = "/api/searches/" + src_key + "/messages";   
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    var searchApi = host + searchApiPath + "?asxcallback=?";

    $("#no_result").hide();

    $.ajax({
        url: searchApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication},
        data: {"action":"", "page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) { 
            if(data.TotNumResult > 0)
            {
                // load messages header template
                var h_template = $("#messagesHeaderTemplate").html();
                // bind data to template
                var header = Mustache.to_html(h_template, data);    
                // load messages template
                var i_template = $("#messagesItemTemplate").html();
                // bind data to template
                var items = Mustache.to_html(i_template, data.messagesList);

                $.mobile.loading("hide");

                // load data into ul...
                $("#search_result").html(header + items);
                
                var nMsgsFrom = pagerange.split("-")[0];
                var nMsgsTo = pagerange.split("-")[1];

                if(nMsgsTo > data.TotNumResult)
                {
                    pagerange = nMsgsFrom + "-" + data.TotNumResult;
                }

                $("#page_range").html(pagerange);

                // and show them 
                $("#no_result").hide();
                $("#search_result").css("margin-top","0.3em");
                $("#msgs_loader img").css("margin-bottom","-3px");
                $("#search_result").show();
                //show hourglass
                $("#msgs_loader").show();
                $(".date").css("margin-right","0");
                $(".ui-li-aside").css("right","1em").css("top","0.3em");                
                
                $("div[class='attach'][id!=attach0]").addClass("paperclip");

                if(nMsgsTo < data.TotNumResult)
                {
                    // click on search next page
                    $(".search_next").on("tap", getNextPage);
                    // click on search previous page
                    $(".search_last").on("tap", getLastPage);
                }

                if (nMsgsFrom > 1) {
                    // click on search previous page
                    $(".search_previous").on("tap", getPreviousPage);
                    $(".search_first").on("tap", getFirstPage);
                    // click on search next page
                }

                // setup click event on <li> (message) item; click on result list -> call details page 
                $(".message").on("tap",viewMessageDetail);
                $(".message").on("swipeleft",viewMessageDetail);

                //call function to refresh search count
                refreshMessagesCount(src_key, cpage);
            }
            else
            {
                $.mobile.loading("hide");
                $("#search_result").hide();
                $("#no_result").html("Nessun risultato.").css("margin-top","0.3em").show();   
            }

            var dt = new Date($.now());
            var endSearchTime = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            var endSearchMsg = "Serch ended at:" + endSearchTime;
            debug.log("DEBUG",endSearchMsg);
        },
        error: function (e) {  
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
            debug.log("DEBUG",new Date($.now()));
        },
    }); 
}


function dispSearchMessages(src_key, cpage)
{
    if(!cpage || cpage <= 0)
    {
        cpage = 1;
    }

    var pagerange = PageRange(cpage);

    var method = "GET";
    var searchApiPath = "/api/searches/" + src_key + "/messages";   
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    var searchApi = host + searchApiPath + "?asxcallback=?";

    $("#no_result").hide();

    $.ajax({
        url: searchApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication},
        data: {"action":"display_only", "page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) { 
            if(data.TotNumResult > 0)
            {
                // load messages header template
                var h_template = $("#messagesHeaderTemplate").html();
                // bind data to template
                var header = Mustache.to_html(h_template, data);    
                // load messages template
                var i_template = $("#messagesItemTemplate").html();
                // bind data to template
                var items = Mustache.to_html(i_template, data.messagesList);

                $.mobile.loading("hide");

                // load data into ul...
                $("#search_result").html(header + items);
                
                var nMsgsFrom = pagerange.split("-")[0];
                var nMsgsTo = pagerange.split("-")[1];

                if(nMsgsTo > data.TotNumResult)
                {
                    pagerange = nMsgsFrom + "-" + data.TotNumResult;
                }

                $("#page_range").html(pagerange);

                // and show them 
                $("#no_result").hide();
                $("#search_result").css("margin-top","0.3em");
                $("#search_result").show();

                $(".date").css("margin-right","0");
                $(".ui-li-aside").css("right","1em").css("top","0.3em");                
                
                $("div[class='attach'][id!=attach0]").addClass("paperclip");

                if(nMsgsTo < data.TotNumResult)
                {
                    // click on search next page
                    $(".search_next").on("tap", getNextPage);
                    // click on search previous page
                    $(".search_last").on("tap", getLastPage);
                }

                if (nMsgsFrom > 1) {
                    // click on search previous page
                    $(".search_previous").on("tap", getPreviousPage);
                    $(".search_first").on("tap", getFirstPage);
                    // click on search next page
                }

                // setup click event on <li> (message) item; click on result list -> call details page 
                $(".message").on("tap",viewMessageDetail);
                $(".message").on("swipeleft",viewMessageDetail);
            }
            else
            {
                $.mobile.loading("hide");
                $("#search_result").hide();
                $("#no_result").html("Nessun risultato.").css("margin-top","0.3em").show();   
            }

            var dt = new Date($.now());
            var endSearchTime = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            var endSearchMsg = "Serch ended at:" + endSearchTime;
            debug.log("DEBUG",endSearchMsg);
        },
        error: function (e) {  
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
            debug.log("DEBUG",new Date($.now()));
        },
    }); 
}

function stopCurrentSearch()
{
    //elimino il timer id che richiede al server 
    // l'aggiornamento del numero di risultati
    clearTimeout(timerId);

    src_key = $("#current_search_id").val();

    if(src_key==0)//non ci sono ricerche in corso
    {
        return;
    }

    if(!cpage || cpage <= 0)
    {
        cpage = 1;
    }

    var pagerange = PageRange(cpage);

    var method = "GET";
    var searchApiPath = "/api/searches/" + src_key + "/messages/true";   
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    var searchApi = host + searchApiPath + "?asxcallback=?";

    $("#no_result").hide();

    //effettuo la chiamata per fermare l'eventuale processo di ricerca
    //sul server
    $.ajax({
        url: searchApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication},
        data: {"action":"stop_search", "page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) { 
            if(data.TotNumResult > 0)
            {
                $("#tot_msgs").html(" di " + data.TotNumResult);
                $("#tot_msgs").data("totres",data.TotNumResult);
                $("#msgs_loader").hide();
            }
            else
            {
                $.mobile.loading("hide");
                $("#search_result").hide();
                $("#no_result").html("Nessun risultato.").css("margin-top","0.3em").show();   
            }

            var dt = new Date($.now());
            var endSearchTime = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            var endSearchMsg = "Serch ended at:" + endSearchTime;
            debug.log("DEBUG",endSearchMsg);
        },
        error: function (e) {  
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
            debug.log("DEBUG",new Date($.now()));
        },
    }); 


}

function refreshMessagesCount(src_key, cpage)
{
    if(!cpage || cpage <= 0)
    {
        cpage = 1;
    }

    var pagerange = PageRange(cpage);

    var method = "GET";
    var searchApiPath = "/api/searches/" + src_key + "/messages/true";   
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    var searchApi = host + searchApiPath + "?asxcallback=?";

    $("#no_result").hide();

    $.ajax({
        url: searchApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication},
        data: {"action":"refresh_count", "page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) { 
            if(data.TotNumResult > 0)
            {
                if(data.Ended != 1)
                {
                    timerId = setTimeout(function(){
                        refreshMessagesCount(src_key, cpage);
                    }, 2000);
                }
                else
                {
                    $("#msgs_loader").hide();
                    clearTimeout(timerId);
                }

                $("#tot_msgs").html(" di " + data.TotNumResult); 
                $("#tot_msgs").data("totres",data.TotNumResult);             
            }
            else
            {
                $.mobile.loading("hide");
                $("#search_result").hide();
                $("#no_result").html("Nessun risultato.").css("margin-top","0.3em").show();   
            }

            var dt = new Date($.now());
            var endSearchTime = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
            var endSearchMsg = "Serch ended at:" + endSearchTime;
            debug.log("DEBUG",endSearchMsg);
        },
        error: function (e) {  
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
            debug.log("DEBUG",new Date($.now()));
        },
    }); 
}

function getFirstPage(e)
{
    var searchId = this.parentNode.id;
    $("input#cpage").val("1");
    dispSearchMessages(searchId, 1);
}

function getPreviousPage(e)
{
    var searchId = this.parentNode.id;

    var numResultXPage = configs.getProperty("resultsNumber");
    var totMsgs = $("#tot_msgs").data("totres");

    var TotPages = Math.floor(totMsgs/numResultXPage) + 1;
    
    var page = ($("input#cpage").val())*1;

    page -= 1;

    if (page > 0)
    {
       $("input#cpage").val(page);
       dispSearchMessages(searchId, page);
    }
}

function getNextPage(e)
{
    var searchId = this.parentNode.id;

    var numResultXPage = configs.getProperty("resultsNumber");
    var totMsgs = $("#tot_msgs").data("totres");

    var TotPages = Math.floor(totMsgs/numResultXPage) + 1;
    
    var page = ($("input#cpage").val())*1;

    page += 1;

    if (page <= TotPages)
    {
       $("input#cpage").val(page);
       dispSearchMessages(searchId, page);
    }
}

function getLastPage(e)
{
    var searchId = this.parentNode.id;

    var numResultXPage = configs.getProperty("resultsNumber");
    var totMsgs = $("#tot_msgs").data("totres");
    var TotPages = Math.floor(totMsgs/numResultXPage) + 1;

    $("input#cpage").val(TotPages);
    dispSearchMessages(searchId, TotPages);
}

function viewMessageDetail()
{
    $(this).addClass("msg_selected");
    // get message detail via ajax
    GetMessageDetail(this.id);
}

/* get message data via ajax */
var GetMessageDetail = function(msg_key)
{
    var method = "GET";
    var apiPath = "/api/messages/" + msg_key;   
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var basestring = BaseString(host, method, timestamp, apiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    var messageApi = host + apiPath + "?asxcallback=?";

    $.ajax({
        url: messageApi,
        type: method,
        headers: {"Timestamp":timestamp, "Authentication":authentication},       
        crossDomain: false,
        dataType: "jsonp",
        success: function (data) { 
            /* load message template */
            var d_template = $("#messageTemplate").html();
            /* bind data to template */
            var msg = Mustache.to_html(d_template, data);       
            
            /* load data into ul... */
            $("#message_detail").html(msg);

            /* load attachments template */
            var a_template = $("#attachmentsItemTemplate").html();
            /* bind data to template */
            var attachments =  Mustache.to_html(a_template, data.AttachmentsList);  
            
            /* load data into ul... */
            $("#attachments").html(attachments);

            $("#attachments").css("margin-top","0.3em");

            $(".attachment").each(function( index ) {

                $(this).css("margin-top",".9em");

                if($(this).attr("data-deleted") == "1") //attachment deleted
                {
                    alert_msg = "<strong>L'allegato '" + $(this).attr("data-attachFileName") + "'' è stato cancellato.</strong>";
                    $(this).html(alert_msg);
                    $(this).css("padding",".7em 1em").css("white-space","normal").css("background-color","orange");
                }
            });
            /* make styles adjustment */
            $("#back_to_search").css("margin-top","1.5em");
            $("#txt_message").css("white-space","normal");
            $("#sbj").css("white-space","normal");      
            
            // show detail page
            if($("#html_message").html() !== "")
            {
                $("#html_message").show();
                $("#txt_message").hide();
            }
            else
            {
                $("#html_message").hide();
                $("#txt_message").show();
            }

            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#details_page", { transition : "none" } );

            $("#d_subject").html($("#sbj").html());

            /* click on "back to search" -> return to seach page */
            //$("#back_to_search").on("tap", backToSearch);
            $("#message_detail").on("swiperight", backToSearch);

            /* click on attachment */
            $(".attachment").on("tap", dnlAndOpenAttach);
        },
        error: function (e) {
            debug.log("ERROR",e);
            var errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
};

function newSearch()
{
    $("#menu").fadeOut();
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
}

function backToSearch(e)
{
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
    if($(".msg_selected").offset())
    {
        var scrollto = $(".msg_selected").offset().top;
        $(".msg_selected").removeClass("msg_selected");
        $.mobile.silentScroll(scrollto);
    }
}

function onSuccess(fileSystem) {
    var gPersistantPath;

    try
    {
        if(device.platform === "iOS"){
            gPersistantPath = fileSystem.root.toInternalURL();
            debug.log("ERROR","<br>IOS persistent file path: " + gPersistantPath);
        }
        else{
            gPersistantPath = cordova.file.externalDataDirectory;
            debug.log("ERROR","<br>ANDROID persistent file path: " + gPersistantPath);
        }
    }
    catch(err) 
    {
        debug.log("ERROR",err);
        gPersistantPath = "";
    }

    downloadAsset(gPersistantPath);
}

function onError(err) {
    debug.log("ERROR","Error in accessing requestFileSystem" + err);
}

function saveData(data, cAttachName) {
    var a = document.createElement("a");
    $("#attachments").append(a);
    a.style = "display: none";
    var blob = new Blob([data]);
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = cAttachName;
    a.click();
    window.URL.revokeObjectURL(url);
}


function downloadAsset(gPersistantPath) {
    var host = currentProfile.getProperty("apiUrl");
    var method = "GET";
    var apiPath = "/api/attachments/" + cAttachId; 
    var bodyContent = "";

    var host = currentProfile.getProperty("apiUrl");
    var timestamp = Timestamp();

    var attachUri = encodeURI(host + apiPath);   

    var basestring = BaseString(host, method, timestamp, apiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    var authentication = Authentication(basestring);

    if($.trim(gPersistantPath) === "")
    {
        $.ajax({
            url: attachUri,
            type: method,
            headers: { "Accept":"application/octet-stream", "Timestamp": timestamp, "Authentication": authentication,},     
            crossDomain: false,
            success: function (data) { 
                saveData(data, cAttachName);                
            },
            error: function (error) {
                debug.log("ERROR",error);
            }
        });
    }
    else
    {
        var fileURL = gPersistantPath + cAttachName; 

        var fileTransfer = new FileTransfer();

        fileTransfer.download(attachUri, fileURL,
            function (entry) {
                window.alert("download completato: " + entry.fullPath);
                debug.log("ERROR","download complete: " + entry.toURL());
                window.open(entry.toNativeURL(), "_blank", "location=no,closebuttoncaption=Close,enableViewportScale=yes");
            },
            function (error) {
                window.alert("Errore:" + error);
                debug.log("ERROR",error);
            },
            false,
            {
                headers: {
                    "Connection": "close",
                    "Accept":"application/octet-stream",
                    "Timestamp": timestamp,
                    "Authentication": authentication,
                }
            }
        );
    }
}

function dnlAndOpenAttach(e)
{
    cAttachId = this.id;
    cAttachName = $(this).attr("data-attachFileName");
    var cAttachDeleted = $(this).attr("data-deleted");
    
    if(cAttachDeleted != "1" )
    {
        try
        {
            // LocalFileSystem esiste solo su telefonino; il try catch mi permette di testare anche sul browser
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError); 
        }
        catch(err) 
        {
            debug.log("ERROR",err);
            debug.log("ERROR","No device detected! It's a browser call.");
            onSuccess();
        }
    }
}