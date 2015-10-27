function loginBtnHandler()
{
    $(".login-error").html("").hide();

    if(!checkInputData())
    {
        return;
    }

	un  = $("#un").val();
	pw  = $("#pw").val();
	asxUrl = $("#url").val();

	//richiedo la chiave pubblica
	var asxpublicKey = "";
	var publickeysApi = asxUrl + '/api/publickeys?asxcallback=?';

	$.ajax({
	  url: publickeysApi,
	  type: 'GET',
	  dataType: 'jsonp',
	  success: function (data, status) {
		asxpublicKey = "<RSAKeyValue>" + data + "</RSAKeyValue>";
		console.log( "asxpublicKey = " + asxpublicKey);
		logInASX(asxpublicKey,asxUrl,un,pw);
	  },
	  error: function (e) {
	    console.log(e);
	    errMsg = e.status + "-" + e.statusText;
	    
        $(".login-error").html(errMsg).show();
	  }
	});
}

function checkInputData()
{
    $(".login-error").html("").hide();

    var errorMessage = "";
    var emptyFields = [];
    if($.trim($("#url").val()) == "")
    {
        emptyFields.push("host name");
    }      
    if($.trim($("#un").val()) == "")
    {
        emptyFields.push("username");
    }
    if($.trim($("#pw").val()) == "")
    {
        emptyFields.push("password");
    }    

    if(emptyFields.length > 0)
    {
        if(emptyFields.length == 1)
        {
            errorMessage = "Occorre specificare il campo " + emptyFields[0] + "."
        }
        else
        {
            errorMessage = "Occorre specificare i campi: ";
            for (var i = 0; i < emptyFields.length; i++) {
                errorMessage += emptyFields[i];
                if(i==emptyFields.length-1)
                {
                    errorMessage += ".";
                }
                else if(i==emptyFields.length-2)
                {
                    errorMessage += " e ";
                }
                else
                {
                    errorMessage += ", ";                    
                }
            };
        }

        $(".login-error").html("Attenzione: " + errorMessage).show();
        return false;
    }
    else
    {
        $(".login-error").html("").hide();
        return true;
    }
}

function logInASX(asxpublicKey,asxUrl,un,pw)
{
    $(".login-error").html("").hide();

	// init data 
    var d = new Date();
    //ASX accepted date format "YYYY-MM-dd HH:mm:ssZ")
    var Timestamp = ((d.toISOString()).replace("T", " ")).split(".")[0] + "Z";

    console.log( "Timestamp = " + Timestamp);

    var method = "GET";
    var loginApiPath = "/api/logins";
    var bodyContent = "";

    // CALCULATE SIGNATURE ({signature}: HMACSHA256 di {basestring} usando come chiave {md5(password.ToUpper)} )
	var absPath = getAbsolutePath(asxUrl + loginApiPath);

    var basestring = method + "\n" + Timestamp + "\n" +  absPath + "\n" + bodyContent;

    console.log("basestring=" + basestring);

    var md = forge.md.md5.create();
    md.update(pw.toUpperCase());
    var md5pw = md.digest().toHex()
    console.log("hashedpassword=" + md5pw);

    // define key for HMACSHA256
    var ashKey = forge.util.createBuffer(forge.util.encodeUtf8(md5pw.toUpperCase())).getBytes();

    var hmac = forge.hmac.create();
    hmac.start('sha256', ashKey);
    hmac.update(forge.util.createBuffer(forge.util.encodeUtf8(basestring)).getBytes());

    var signature = forge.util.encode64(hmac.digest().getBytes());

    console.log("signature=" + signature);

    // ENCRYPT USER CREDENTIAL ({cryptedUserLogin} = Encrypt RSA di {datatoencrypt} con {“<RSAKeyValue>" + {publicKey} + "</RSAKeyValue>})

    var datatoencrypt = forge.util.encode64(forge.util.encodeUtf8(un)) + ":" + forge.util.encode64(forge.util.encodeUtf8(pw));

    console.log( "datatoencrypt:" + datatoencrypt );

    // create forge publickey
    var pubKey = pki.publicKeyFromXML(asxpublicKey);

    // encrypt and encode
    var inputBuffer = forge.util.createBuffer(forge.util.encodeUtf8(datatoencrypt.toString()));

    var crypted = pubKey.encrypt(inputBuffer.getBytes());

    var cryptedBuffer = forge.util.createBuffer(crypted);

    var cryptedCredentials = forge.util.encode64(cryptedBuffer.getBytes());

    console.log("cryptedCredentials=" + cryptedCredentials);

    //Authentication:  {cryptedUserLogin}:{signature}
    var Authentication = cryptedCredentials + ":" + signature;
    console.log("Authentication=" + Authentication);
    
    var loginApi = asxUrl + loginApiPath + "?asxcallback=?";

    $.ajax({
        url: loginApi,
        type: 'GET',
        headers: {'Timestamp':Timestamp, 'Authentication':Authentication},
        crossDomain:false,
        dataType: 'jsonp',
        success: function (data) {
            console.log(data);
            if(data.IsAuthenticated == true && data.userCanSearch == true)
            {
                // save user credential
                saveUserData();
                // go to search page (simple search)
                $.mobile.changePage("#search_page");
            }
        },
        error: function (e) {
            console.log(e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

function saveUserData()
{
    console.log("ATTENZIONE: saveUserData() must be implemented!!!");
}