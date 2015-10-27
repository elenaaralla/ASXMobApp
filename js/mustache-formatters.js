var daysIT = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
var monthsIT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
Mustache.Formatters = {
    "uppercase": function (str) {
        return str.toUpperCase();
    },
    "lowercase": function (str) {
        return str.toLowerCase();
    },
    "lpad": function (str, num, sep) {
        sep = sep || " ";
        str = "" + str;
        var filler = "";
        while ((filler.length + str.length) < num) { filler += sep };
        return (filler + str).slice(-num);
    },
    "leftN": function (str) {
        var regex = /(<([^>]+)>)/ig
        ,   result = str.replace(regex, " ");
        
        var regex2 = /(?:\r\n|\r|\n)/ig
        ,   result2 = result.replace(regex2, " ");

        return cutString(result2, 63);
    },    
    "date": function (str) {
        var dt = moment(str, 'YYYYMMDDTHHmmssZ');
        var day   = dt.date();
        var month = dt.month()+1;
        return  day + "/" + month + "/" + dt.year();
    },
    "datetime": function (str) {
        var dt = moment(str, 'YYYYMMDDTHHmmssZ');
        var day   = dt.date();
        var month = dt.month()+1;
        return  day + "/" + month + "/" + dt.year() + ' ' + dt.hour() + '.' +  dt.minute();
    },  
    "dayOfWeekAndMounth": function (str) {
        var dt = moment(str, 'YYYYMMDDTHHmmssZ');
        var day   = dt.date();
        var month = monthsIT[dt.month()];
        var dayOW = daysIT[dt.day()];
        return  dayOW + " " + day + " " + month;
    },   
    "time": function (str) {
        var dt = moment(str, 'YYYYMMDDTHHmmssZ').subtract(2, 'hours');
        
        var formattedTime = dt.format("HH.mm");

        if (formattedTime == "00.00") {
            formattedTime = "24.00";
        };

        return  formattedTime;
    },   
    "titleId": function (str) {
        var dt = moment(str, 'YYYYMMDDTHHmmssZ');
        var year   = dt.year();
        var month = dt.month()+1;
        var day   = dt.date();      
        return  year +''+ month +''+ day;
    },
    "add": function (one, two) {
        return one + two;
    },
    "wrap": function(str, begin, end) {
        return (begin + str + end);
    },
    "countArgs": function() {
        return arguments.length;
    }
};

function cutString(s, n){
    var cut = s.indexOf(' ', n);
    if(cut == -1) return s;
    return s.substring(0, cut) + '...'
}