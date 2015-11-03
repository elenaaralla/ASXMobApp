function SearchModel(id,name,lastUsed,result,userId,instance)
{
    this.Id = id;
    this.Name = name;
    this.LastUsed = lastUsed;
    this.Result = result;
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
    this.UserId = userId;
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

function search()
{
    // init data 
    now = new Date();
    //ASX accepted date format "YYYY-MM-dd HH:mm:ssZ")
    Timestamp = ((now.toISOString()).replace("T", " ")).split(".")[0] + "Z";
    
    bodyContent = JSON.stringify(new SearchModel(0,"Newmobilesearch",new Date(), ($.guid++)));

    method = "POST";
    searchApiPath = "/api/searches";   

    host = currentProfile.getProperty("apiUrl");

    absPath = getAbsolutePath(host + searchApiPath);

    basestring = method + "\n" + Timestamp + "\n" +  absPath + "\n" + bodyContent;

    debug.log("DEBUG", basestring);

    md5pw = currentProfile.getProperty("passwordHash");

    signature = encodeSignature(basestring, md5pw);

    debug.log("DEBUG", signature);

    cryptedCredential = currentProfile.getProperty("cryptedCredential");

    Authentication = cryptedCredential + ":" + signature;

    searchApi = host + searchApiPath + "?asxcallback=?";

 $.ajax({
        url: searchApi,
        type: method,
        headers: {'Timestamp':Timestamp, 'Authentication':Authentication, 'Content-Type': 'application/json; charset=utf-8'},
        data: bodyContent,
        processData: false,
        crossDomain: false,
        dataType: 'jsonp',
        success: function (data) {
            debug.log("DEBUG",data);
        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });

/*
    $.ajax({url: "./messages_data.js",
        dataType: "json",
        async: true,
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
            $(".message").click(function() {
            
                // get message detail via ajax
                GetMeddageDetail();
                // show detail page
                $.mobile.changePage("#details_page");
                $("#d_subject").html($("#s_subject").html());
            }); 
        },
        error: function (request,error) {
            alert('Network error has occurred please try again!');
        }
    });     */
}