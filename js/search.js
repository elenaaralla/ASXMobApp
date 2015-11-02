function SearchModel(id,name,lastUsed,result,userId,instance)
{
    this.id = id;
    this.name = name;
    this.lastUsed = lastUsed;
    this.result = result;
    this.userId = userId;
    this.instance = instance; 
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
    
    search = JSON.stringify(new SearchModel(0,"New mobile search",new Date(), ($.guid++)));

    method = "POST";
    searchApiPath = "/api/api/searches";
    bodyContent = search;    

    host = currentProfile.getProperty("apiUrl");

    absPath = getAbsolutePath(host + searchApiPath);

    basestring = method + "\n" + Timestamp + "\n" +  absPath + "\n" + bodyContent;

    signature = encodeSignature(basestring, md5pw);

    cryptedCredentials = currentProfile.getProperty("cryptedCredentials");

    Authentication = cryptedCredentials + ":" + signature;

    searchApi = host + loginApiPath + "?asxcallback=?";

 $.ajax({
        url: searchApi,
        type: method,
        headers: {'Timestamp':Timestamp, 'Authentication':Authentication},
        data:{"search": search},
        crossDomain:false,
        dataType: 'jsonp',
        success: function (data) {
            console.log(data);
        },
        error: function (e) {
            console.log(e);
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