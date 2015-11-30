function SearchModel(id,name,lastUsed,instance)
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
    cryptedCredentials =  currentProfile.getProperty("cryptedCredential");
    passwordHash = currentProfile.getProperty("passwordHash");

    //Authentication:  {cryptedUserLogin}:{signature}
    return cryptedCredentials + ":" + Signature(basestring, passwordHash);
}

function search()
{
    method = "POST";
    searchApiPath = "/api/searches";   
    bodyContent = JSON.stringify(new SearchModel(0,"New mobile search",new Date(),guid()));

    timestamp = Timestamp();
    host = currentProfile.getProperty("apiUrl");
    basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    authentication = Authentication(basestring);

    searchApi = host + searchApiPath + "?asxcallback=?";

    $.ajax({
        url: searchApi,
        type: method,
        headers: {'Timestamp':timestamp, 'Authentication':authentication, 'Content-Type': 'application/json; charset=utf-8'},
        data: bodyContent,
        processData: false,
        crossDomain: false,
        dataType: 'jsonp',
        success: function (data) {
            debug.log("DEBUG",data);
            getSearchMessages(data.Id);
        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

var PageRange = function (cpage)
{
    numItemPerPage = configs.getProperty("resultsNumber");

    nMsgsFrom = (cpage-1) * numItemPerPage + 1;
    nMsgsTo = cpage * numItemPerPage;

    return nMsgsFrom + "-" + nMsgsTo;
}

function getSearchMessages(src_key, cpage)
{
    if(!cpage || cpage <= 0)
    {
        cpage = 1;
    }

    pagerange = PageRange(cpage);

    method = "GET";
    searchApiPath = "/api/searches/" + src_key + "/messages";   
    bodyContent = "";

    host = currentProfile.getProperty("apiUrl");
    timestamp = Timestamp();

    basestring = BaseString(host, method, timestamp, searchApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    authentication = Authentication(basestring);

    searchApi = host + searchApiPath + "?asxcallback=?"

    $.ajax({
        url: searchApi,
        type: method,
        headers: {'Timestamp':timestamp, 'Authentication':authentication},
        data: {"page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: 'jsonp',
        success: function (data) { 

            // load messages header template
            var h_template = $('#messagesHeaderTemplate').html();
            // bind data to template
            var header = Mustache.to_html(h_template, data);        
            
            // load messages template
            var i_template = $('#messagesItemTemplate').html();
            // bind data to template
            var items = Mustache.to_html(i_template, data.messagesList);

            // load data into ul...
            $('#search_result').html(header + items);
            
            $('#page_range').html(pagerange);

            // and show them 
            $("#search_result").css("margin-top","0.3em");
            $('#search_result').show();
            
            $(".date").css("margin-right","0");
            $(".ui-li-aside").css("right","1em").css("top","0.3em");                
            
            $("div[class='attach'][id!=attach0]").addClass("paperclip");

            /* click on search previous page */
            $(".search_previous").on("tap", getPreviousPage);
            /* click on search next page */
            $(".search_next").on("tap", getNextPage);
            /* click on search previous page */
            $(".search_first").on("tap", getFirstPage);
            /* click on search next page */
            $(".search_last").on("tap", getLastPage);


            // setup click event on <li> (message) item; click on result list -> call details page 
            $(".message").on("tap",vieMessageDetail);
            $(".message").on("swipeleft",vieMessageDetail);
        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        },

    });     
}


function getFirstPage(e)
{
    searchId = this.parentNode.id;
    $("input#cpage").val("1");
    getSearchMessages(searchId, 1);
}

function getPreviousPage(e)
{
    searchId = this.parentNode.id;

    numResultXPage = configs.getProperty("resultsNumber");
    totMsgs = $("#tot_msgs").data("totres");

    TotPages = Math.floor(totMsgs/numResultXPage) + 1;
    
    page = ($("input#cpage").val())*1;

    page -= 1;

    if (page > 0)
    {
       $("input#cpage").val(page);
       getSearchMessages(searchId, page);
    }
}

function getNextPage(e)
{
    searchId = this.parentNode.id;

    numResultXPage = configs.getProperty("resultsNumber");
    totMsgs = $("#tot_msgs").data("totres");

    TotPages = Math.floor(totMsgs/numResultXPage) + 1;
    
    page = ($("input#cpage").val())*1;

    page += 1;

    if (page <= TotPages)
    {
       $("input#cpage").val(page);
       getSearchMessages(searchId, page);
    }
}

function getLastPage(e)
{
    searchId = this.parentNode.id;

    numResultXPage = configs.getProperty("resultsNumber");
    totMsgs = $("#tot_msgs").data("totres");
    TotPages = Math.floor(totMsgs/numResultXPage) + 1;

    $("input#cpage").val(TotPages);
    getSearchMessages(searchId, TotPages);
}

function vieMessageDetail()
{
    $(this).addClass("msg_selected");
    // get message detail via ajax
    GetMessageDetail(this.id);
}

/* get message data via ajax */
GetMessageDetail = function(msg_key)
{
    method = "GET";
    apiPath = "/api/messages/" + msg_key;   
    bodyContent = "";

    host = currentProfile.getProperty("apiUrl");
    timestamp = Timestamp();

    basestring = BaseString(host, method, timestamp, apiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    authentication = Authentication(basestring);

    messageApi = host + apiPath + "?asxcallback=?"

    $.ajax({
        url: messageApi,
        type: method,
        headers: {'Timestamp':timestamp, 'Authentication':authentication},
        data: {"page_range":pagerange, "sort_column": "colDate", "sort_type":"1"},
        processData: true,        
        crossDomain: false,
        dataType: 'jsonp',
        success: function (data) { 
            /* load message template */
            var d_template = $('#messageTemplate').html();
            /* bind data to template */
            var msg = Mustache.to_html(d_template, data);       
            
            /* load data into ul... */
            $('#message_detail').html(msg);

            /* load attachments template */
            var a_template = $('#attachmentsItemTemplate').html();
            /* bind data to template */
            var attachments =  Mustache.to_html(a_template, data.AttachmentsList);  
            
            /* load data into ul... */
            $('#attachments').html(attachments);

            $("#attachments").css("margin-top","0.3em");

            /* make styles adjustment */
            $("#back_to_search").css("margin-top","1.5em");
            $("#txt_message").css("white-space","normal");
            $("#sbj").css("white-space","normal");      
            
            // show detail page
            //$.mobile.changePage("#details_page");
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#details_page", { transition : "none" } );

            $("#d_subject").html($("#sbj").html());

            /* click on "back to search" -> return to seach page */
            $("#back_to_search").on("tap", backToSearch);
            $("#message_detail").on("swiperight", backToSearch);

            /* click on attachment */
            $(".attachment").on("tap", dnlAndOpenAttach);

        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

function newSearch()
{
    $("#menu").fadeOut()
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
}

function backToSearch(e)
{
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
}


function onSuccess(fileSystem) {
    if(device.platform === 'iOS'){
        gPersistantPath = fileSystem.root.toInternalURL();
        debug.log("ERROR","<br>IOS persistent file path: " + gPersistantPath);
    }
    else{
        gPersistantPath = cordova.file.externalDataDirectory;
        debug.log("ERROR","<br>ANDROID persistent file path: " + gPersistantPath);
    }

    downloadAsset(gPersistantPath);

}

function onError(err) {
    debug.log("ERROR","Error in accessing requestFileSystem" + err);
}

function downloadAsset(gPersistantPath) {

    method = "GET";
    apiPath = "/api/attachments/" + cAttachId + "/" + guid();   
    bodyContent = "";

    host = currentProfile.getProperty("apiUrl");
    timestamp = Timestamp();

    attachUri = encodeURI(host + apiPath);   

    basestring = BaseString(host, method, timestamp, apiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    authentication = Authentication(basestring);

    var fileURL = gPersistantPath + cAttachName; 

    var fileTransfer = new FileTransfer();

    fileTransfer.download(attachUri, fileURL,
        function (entry) {
            alert("download complete: " + entry.fullPath);
            debug.log("ERROR","download complete: " + entry.toURL());
            window.open(entry.toNativeURL(), '_blank', 'location=no,closebuttoncaption=Close,enableViewportScale=yes');
        },
        function (error) {
            alert("Errore:" + error);
            debug.log("ERROR",error);
        },
        false,
        {
            headers: {
                "Connection": "close",
                "Accept":"application/octet-stream",
                "Timestamp": "123456",
                "Authentication": "elena",
            }
        }            
    );
}

function dnlAndOpenAttach(e)
{
    cAttachId = this.id;
    cAttachName = $(this).attr("data-attachFileName");

    try
    {
        // LocalFileSystem esiste solo su telefonino; il try catch mi permette di testare anche sul browser
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError); 
    }
    catch(err) 
    {
        debug.log("ERROR",err);
        debug.log("ERROR","No device detected! It's a browser call.");
        host = currentProfile.getProperty("apiUrl");
        attachUri = encodeURI(host + "/api/attachments/" + cAttachId + "/test");   
        document.location.href = attachUri;
    }
}