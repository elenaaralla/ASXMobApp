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

function getSearchMessages(src_key)
{
    numResultXPage = configs.getProperty("resultsNumber");

    pagerange = "1-" + numResultXPage;

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
            // and show them 
            $('#search_result').show();
            
            $(".date").css("margin-right","0");
            $(".ui-li-aside").css("right","1em").css("top","0.3em");                
            
            // setup click event on <li> (message) item; click on result list -> call details page 
            $(".message").on("tap",vieMessageDetail);
            $(".message").on("swipeleft",vieMessageDetail);
        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });     
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
            
            /* make styles adjustment */
            $("#back_to_search").css("margin-top","1.5em");
            $("#d_message").css("white-space","normal");
            $("#sbj").css("white-space","normal");      
            
            // show detail page
            //$.mobile.changePage("#details_page");
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#details_page", { transition : "none" } );
            $("#d_subject").html($("#s_subject").html());
            /* adjust some style */
            $("#search_result").css("margin-top","0.3em");

            /* click on "back to search" -> return to seach page */
            $("#back_to_search").on("tap", backToSearch);
            $("#message_detail").on("swiperight", backToSearch);

            $("#search_page").on( "pageshow", function( event ) {
                /* adjust some style */
                $("#search_result").css("margin-top","0.3em");

                if($(".msg_selected").offset())
                {
                    $.mobile.silentScroll($(".msg_selected").offset().top);
                }

                $(".message").removeClass("msg_selected");
             } );
        },
        error: function (request,error) {
            alert('Network error has occurred please try again!');
        }
    });
}

function backToSearch(e)
{
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
}