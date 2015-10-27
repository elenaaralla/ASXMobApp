// Device Event Listener
document.addEventListener("deviceready", onDeviceReady, false);

// debug - per provare senza ripple document.addEventListener("DOMContentLoaded", onDeviceReady, false);

function onDeviceReady() {

    /* adjust some style */
    $("#search_result").css("margin-top","0.3em").hide();

    $(".login-success").hide();
    $(".login-error").hide();

    /* click on login -> call search page */
    $("#login_button").click(function() {
        loginBtnHandler();
    });

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
    /* get messages data via ajax */
    $("#search_button").click(function() {
        $.ajax({url: "./messages_data.js",
            dataType: "json",
            async: true,
            success: function (data) { 
                /* ajax.parseJSONP(data); */
                
                
                /* load messages header template */
                var h_template = $('#messagesHeaderTemplate').html();
                /* bind data to template */
                var header = Mustache.to_html(h_template, data);        
                
                /* load messages template */
                var i_template = $('#messagesItemTemplate').html();
                /* bind data to template */
                var items = Mustache.to_html(i_template, data.messagesList);
                
                /* load data into ul... */
                $('#search_result').html(header + items);
                /* and show them */
                $('#search_result').show();
                
                $(".date").css("margin-right","0");
                $(".ui-li-aside").css("right","1em").css("top","0.3em");                
                
                /* setup click event on <li> (message) item; click on result list -> call details page */
                $(".message").click(function() {
                
                    /* get message detail via ajax */
                    GetMeddageDetail();
                    /* show detail page */  
                    $.mobile.changePage("#details_page");
                    $("#d_subject").html($("#s_subject").html());
                }); 
            },
            error: function (request,error) {
                alert('Network error has occurred please try again!');
            }
        });             
    });   
    
    /*
    var ajax = {  
        parseJSONP:function(result){
            $('#search_result').append('<li data-role="list-divider" data-swatch="a" data-form="ui-bar-a" role="heading" class="ui-li-divider ui-bar-a ui-first-child">Search result - found ' + result.TotNumResult + ' messages </li>');
        
            // <msg> is a json object like this
            //{
            //  "Id":<message id>,
            //  "From":<message from>,
            //  "To":<message to>,
            //  "Subject":<message subject>,
            //  "Date":<message date>,
            //  "MsgSize":<message size>,
            //  "MsgPriority":<message priority>,
            //  "NrAttachments":<message number of attachments>,
            //  "MsgLocked":<message is locked>,
            //  "HtmlBody":<message html body>,
            //  "TextBody":<message text body>,
            //  "AttachmentsList":<attachments list
            //}     
            
            $.each( result.messagesList.messages, function(i, msg) {

                //$('#search_result').append('<li class="message"><a class="ui-btn-a ui-btn ui-btn-icon-right ui-icon-carat-r" data-form="ui-btn-up-a" data-swatch="a" href="#"><p class="date //ui-li-aside ui-li-desc">' + msg.Date + '</p><h3 class="ui-li-heading">' + msg.From + '</h3><p class="ui-li-desc"><strong>' + msg.To + '</strong></p><p class="ui-li-desc">  //</p></a></li>');

                str = '';
                str += '<li class="message">';
                str += '        <a class="ui-btn-a ui-btn ui-btn-icon-right ui-icon-carat-r" data-form="ui-btn-up-a" data-swatch="a" href="#">';
                str += '        <p class="date ui-li-aside ui-li-desc">' + msg.Date + '</p>';
                str += '        <h3 class="ui-li-heading">' + msg.From + '</h3>';
                str += '        <p class="ui-li-desc"><strong>' + msg.To + '</strong></p>';
                str += '        <p class="ui-li-desc"></p>';
                str += '    </a>';
                str += '</li>';
                $('#search_result').append(str);
                
                
            });
            
            $('#search_result').listview('refresh');
        }
    */

    
    
    /* click on home icon (up-left) -> logout */
    $(".ui-icon-home").click(function() {
        $.mobile.changePage("#login_page");
    });    
}

/* get message data via ajax */
GetMeddageDetail = function()
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

/* 
//get all title in file json - called from onDeviceReady function
function getTitles(daysArray)
{
    $.each(daysArray, function(index, item) {
       item.titlesGroup.sort(sort_by('startDate', false, function(a){return a.toUpperCase()}));

       // load titleListTemplate template
        var titleListTemplate = $('#titleListTemplate').html();
        // bind data to template 
        var tList = Mustache.to_html(titleListTemplate, item);   
        // load data into ul  dateList 
        $('.itemsInAgenda').append(tList);

        $('.titleInAgenda').addClass("ui-btn ui-li-has-arrow ui-li ui-first-child ui-btn-up-c");
        $('.agendaTitle').addClass("ui-btn-text left");
        $('.agendaDetail').addClass("left");
    });
}

//funtction to "deactivate" button on navbar - called by onDeviceReady() function and onclick eventhandler on button in navbar
function resetDaysSelection()
{
    $('.dayInAgenda').each(function(i, obj) {
        $('#'+obj.id).removeClass("ui-btn-active");
    });
}

// function to display all title of a delected day - called by  - called by onDeviceReady() function and onclick eventhandler on button in navbar
function displaySelectedDayTitles(selDay)
{
    // reset day selection
    resetDaysSelection();

    // set selected item in days list
    $('#'+selDay).addClass("ui-btn-active"); 

    // reset highlightning
    $('.titleInAgenda').removeClass('highlight');

    //hide all li
    $('.titleInAgenda').hide();

    //hide all details
    $('.agendaDetail').hide();

    // Left part of the selDay until caratter T
    curDay = selDay.split('T')[0];
    // display all title which class start with "title-"+curDay 
    $("[id^=title-" + curDay + "]").show();
}

// function to display/hide details of a selected titles - called by onclick eventhandler on titles in titles list
function displaySelectedTitleDetails(daterange)
{
    obj = $("#details-"+daterange);

    if(obj.css("display") == "none")
    {
        obj.show();
    }
    else
    {
        obj.hide();
    }
}

// click event on button of navigation bar
function displayDayTitles (event) {
    selDay = event.target.id; // id of clicked li by directly accessing DOMElement property

    // display titles of selected day
    displaySelectedDayTitles(selDay);
 }

function displayDetails (event) {
    daterange = event.target.id; // id of clicked div with title
    //if there is a description, than show details...
    if($('#shortDesc-'+daterange).text() != "")
    {
        $('#'+daterange).addClass("ui-btn-active"); 
        // display detail of selected title
        displaySelectedTitleDetails(daterange);
    }
}

function viewDescription (event){

    evid = event.target.id;
    evIdArr = evid.split('-');

    evSD = evIdArr[1];
    evED = evIdArr[2];
    
    var myEvent;

    // ajax call to get data from agendaAchab.json
    $.ajax({url: "./agendaAchab.json",
        dataType: "json",
        async: true,
        success: function (data) { 

            $.each(data.days, function(i, v) {
                $.each(v.titlesGroup, function(j, o) {
                    if (o.startDate == evSD && o.endDate == evED) {
                        myEvent = o
                        return;
                    }
                });                
            });
         
        },
        error: function (request,error) {
            alert('Network error has occurred please try again!');
        },
        complete: function(data)
        {
            displaySelectedTitleDescription(myEvent);
        }
    });
}

// click event on title item in titles list
function viewSpeakerData (event) {

    speakerId = event.target.id;

    speakerIdArr = speakerId.split('-');

    spName = speakerIdArr[0];
    spLastname = speakerIdArr[1];
    if(speakerIdArr.length > 2)
    {
        spLastname = spLastname + '-' + speakerIdArr[2]
    }
    
    var mySpeaker;

    // ajax call to get data from agendaAchab.json
    $.ajax({url: "./agendaAchab.json",
        dataType: "json",
        async: true,
        success: function (data) { 

            $.each(data.days, function(i, v) {
                $.each(v.titlesGroup, function(j, o) {
                    $.each(o.speakers, function(h, s) {
                        if (s.name.toLowerCase() == spName && s.lastname.toLowerCase() == spLastname) {
                            mySpeaker = s
                            return;
                        }
                    });
                });                
            });
         
        },
        error: function (request,error) {
            alert('Network error has occurred please try again!');
        },
        complete: function(data)
        {
            displaySelectedSpeaker(mySpeaker);
        }
    });
 }


// function to display description of a selected titles - called by onclick eventhandler on titles in titles list
function displaySelectedTitleDescription(myevent)
{
    //get event template
    var eventTemplate = $('#eventTemplate').html();
    // bind data to template 
    var eventData = Mustache.to_html(eventTemplate, myevent);   

    // load data into eventContent div
    $('#eventContent').html(eventData);

    //$.mobile.navigate("#selectedEventPage");
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#selectedEventPage", { transition : "none" } );

}

// function to display curriculum of a selected speaker - called by onclick eventhandler on link in speakers list
function displaySelectedSpeaker(myspeaker)
{
    //get speakerContent template
    var speakerTemplate = $('#speakerTemplate').html();
    // bind data to template 
    var speakerData = Mustache.to_html(speakerTemplate, myspeaker);   

    // load data into speakerContent div
    $('#speakerContent').html(speakerData);

    //$.mobile.navigate("#selectedSpeakerPage");
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#selectedSpeakerPage", { transition : "none" } );
}

function highlightsCurrentEvent()
{
    var currentDateTime = moment();

    cdt = getURLParameter("cdt");

    // if exist url paramenter and it's not null
    if(cdt != null && $.trim(cdt) != "null")
    {
        // capire come funziona il time zone; moment js, quando trasforma una stringa nel formato YYYYMMDDTHHmmss,
        // ritorna la data con due ore in più, quindi sicuramente non è 
        // quella locale; per la versione beta sottraggo le due ore di troppo; asap investighero su come gestire 
        // l'ora locale, in modo da non dover correggere il codice con il cambio dell'ora :)
        currentDateTime = moment(cdt, 'YYYYMMDDTHHmmssZ').subtract(2, 'hours');
    }

    // day item (navbar): class="dayInAgenda" id="{{groupLabel}}" (i.e. id=date formatted in RFC882 (YYYYMMDDT000000Z)
    // hours range item (title) class="agendaTitle" id="{{startDate}}-{{endDate}}" (i.e. date range in RFC882)
    try
    {
        currentTime=currentDateTime.format("HHmm");
        
        // set current day button active 
        selDay = currentDateTime.format("YYYYMMDD") + "T000000Z";
        displaySelectedDayTitles(selDay);

        // highlight right title
        $(".agendaTitle").each(function() {
          if ($(this).css("display") == "block") {

            evid = this.id;

            evIdArr = evid.split('-');
            // event start date 
            evSD = moment(evIdArr[0], 'YYYYMMDDTHHmmssZ').subtract(2, 'hours');
            // event end date
            evED = moment(evIdArr[1], 'YYYYMMDDTHHmmssZ').subtract(2, 'hours');
    
            // current time
            //currentTime = (c_hour+c_min)*1;

            // current start time
            startTime = evSD.format("HHmm");//((evSD.hour()-2) + '' + evSD.minute() )*1;
            // current end time
            endTime =  evED.format("HHmm");//((evED.hour()-2)+''+(evED.minute()-1))*1;

            if (endTime == "0000") {
                endTime = "2400";
            };            

            // if current hour is between star date hour and end date hour and current minutes are between 
            //  star date hour and end date hour
            if(currentTime >= startTime && currentTime < endTime)
            {
                $(this).addClass("highlight");
            }
          }

        });
    }
    catch (err)
    {
        console.log("err = " + err);
    }
}

function goHome (event)
{
    //$.mobile.navigate( "#home" );
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#home", { transition : "none" } );
}

// function to sort data read from json data file - called from onDeviceReady() and getTitles() functions
var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}
*/