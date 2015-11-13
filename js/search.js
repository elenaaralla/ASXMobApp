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


function gotSys(fileSystem) {
    alert("Got FS");
    store = fileSystem.root;
    alert(store);
    alert('Checking file: ' + store.toURL() + fileName);
    window.resolveLocalFileSystemURL(store.toURL() + fileName, appStart, downloadAsset);
}

function downloadAsset() {
    
    var fileTransfer = new FileTransfer();

    alert("FileTransfer exists!!");
    debug.log("ERROR","OK - FileTransfer exists!!");

    fileTransfer.download(assetURL, "cdvfile://localhost/persistent/" + fileName,
        function (entry) {
            alert("download complete: " + entry.toURL())
            debug.log("ERROR","download complete: " + entry.toURL());
        },
        function (error) {
            alert(error);
            debug.log("ERROR","download error source " + error.source);
            debug.log("ERROR","download error target " + error.target);
            debug.log("ERROR","download error code " + error.code);
            debug.log("ERROR","download http_status " + error.http_status);
            debug.log("ERROR","download body " + error.body);
            debug.log("ERROR","download exception " + error.exception);
        });
}

function appStart() {
    alert('file exists');
    alert(store.toURL() + fileName);
}

function fail(error) {
    alert("fail error: " + error);
}

function dnlAndOpenAttach(e)
{
    attach_id = this.id;

    method = "GET";
    apiPath = "/api/attachments/" + attach_id + "/test";   
    bodyContent = "";

    host = currentProfile.getProperty("apiUrl");
    
    timestamp = Timestamp();

    basestring = BaseString(host, method, timestamp, apiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    authentication = Authentication(basestring);

    attachApi = host + apiPath

    assetURL = attachApi;
    fileName = "VOLANTINO 2015 pdf.pdf";

    try
    {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotSys, fail);
    }
    catch(err) 
    {
        debug.log("ERROR",err);
        debug.log("ERROR","No device detected!");
        document.location.href =  host + apiPath;
    }
}