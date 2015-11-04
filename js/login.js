function login()
{
    $(".login-error").html("").hide();

    if(!checkInputData())
    {
        return;
    }

	username  = $("#username").val();
	password  = $("#password").val();
	host = $("#host").val();

	//richiedo la chiave pubblica
	var asxpublicKey = "";
	var publickeysApi = host + '/api/publickeys?asxcallback=?';

	$.ajax({
	  url: publickeysApi,
	  type: 'GET',
	  dataType: 'jsonp',
	  success: function (data, status) {
		asxpublicKey = "<RSAKeyValue>" + data + "</RSAKeyValue>";
		debug.log("DEBUG","asxpublicKey = " + asxpublicKey);
		logInASX(asxpublicKey,host,username,password);
	  },
	  error: function (e) {
	    debug.log("ERROR",e);
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
    if($.trim($("#host").val()) == "")
    {
        emptyFields.push("host name");
    }      
    if($.trim($("#username").val()) == "")
    {
        emptyFields.push("username");
    }
    if($.trim($("#password").val()) == "")
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

var Timestamp = function()
{
    // init data 
    now = new Date();
    //ASX accepted date format "YYYY-MM-dd HH:mm:ssZ")
    timestamp = ((now.toISOString()).replace("T", " ")).split(".")[0] + "Z";

    debug.log("DEBUG","Timestamp = " + timestamp);

    return timestamp;
}

var PasswordHash = function(password)
{
    var md = forge.md.md5.create();
    md.update(password.toUpperCase());
    var md5pw = md.digest().toHex()
    debug.log("DEBUG","hashedpassword=" + md5pw);

    return md5pw;
}

var BaseString = function (host, method, timestamp, apiPath, bodyContent)
{
    absPath = getAbsolutePath(host + apiPath);

    basestring = method + "\n" + timestamp + "\n" +  absPath + "\n" + bodyContent;

    debug.log("DEBUG","basestring=" + basestring);

    return basestring;
}

function Signature(basestring, passwordHash)
{
     // CALCULATE SIGNATURE ({signature}: HMACSHA256 di {basestring} usando come chiave {md5(password.ToUpper)} )
    // define key for HMACSHA256
    ashKey = forge.util.createBuffer(forge.util.encodeUtf8(passwordHash.toUpperCase())).getBytes();

    hmac = forge.hmac.create();
    hmac.start('sha256', ashKey);
    hmac.update(forge.util.createBuffer(forge.util.encodeUtf8(basestring)).getBytes());

    signature = forge.util.encode64(hmac.digest().getBytes());

    debug.log("DEBUG","signature=" + signature);

    return signature;
}

var CryptedCredentials = function(asxpublicKey, username, password)
{
    // ENCRYPT USER CREDENTIAL ({cryptedUserLogin} = Encrypt RSA di {datatoencrypt} con {“<RSAKeyValue>" + {publicKey} + "</RSAKeyValue>})

    var datatoencrypt = forge.util.encode64(forge.util.encodeUtf8(username)) + ":" + forge.util.encode64(forge.util.encodeUtf8(password));

    debug.log("DEBUG","datatoencrypt:" + datatoencrypt );

    // create forge publickey
    var pubKey = pki.publicKeyFromXML(asxpublicKey);

    // encrypt and encode
    var inputBuffer = forge.util.createBuffer(forge.util.encodeUtf8(datatoencrypt.toString()));

    var crypted = pubKey.encrypt(inputBuffer.getBytes());

    var cryptedBuffer = forge.util.createBuffer(crypted);

    cryptedCredentials = forge.util.encode64(cryptedBuffer.getBytes());

    debug.log("DEBUG","cryptedCredentials=" + cryptedCredentials);

    return cryptedCredentials;
}

function logInASX(asxpublicKey,host,username,password)
{
    $(".login-error").html("").hide();

    method = "GET";
    loginApiPath = "/api/logins";
    bodyContent = "";

    timestamp = Timestamp();
    cryptedCredentials = CryptedCredentials(asxpublicKey, username, password);
    passwordHash = PasswordHash(password);
    basestring = BaseString(host, method, timestamp, loginApiPath, bodyContent);

    //Authentication:  {cryptedUserLogin}:{signature}
    authentication = cryptedCredentials + ":" + Signature(basestring, passwordHash);

    debug.log("DEBUG","Authentication=" + authentication);

    var loginApi = host + loginApiPath + "?asxcallback=?";

    $.ajax({
        url: loginApi,
        type: method,
        headers: {'Timestamp':timestamp, 'Authentication':authentication},
        crossDomain:false,
        dataType: 'jsonp',
        success: function (data) {
            debug.log("DEBUG",data);
            if(data.IsAuthenticated == true && data.userCanSearch == true)
            {
                // save user profile
                saveUserData(host,username,cryptedCredentials,passwordHash);
                // go to search page (simple search)
                //$.mobile.changePage("#search_page");
                $( ":mobile-pagecontainer" ).pagecontainer( "change", "#search_page", { transition : "none" } );
            }
        },
        error: function (e) {
            debug.log("ERROR",e);
            errMsg = e.status + "-" + e.statusText;
            $(".login-error").html(errMsg).show();
        }
    });
}

function saveUserData(host,username,cryptedCredential, passwordHash)
{
    now = new Date();
    currentProfile = new Profile(usedProfileName,host,username,cryptedCredential, passwordHash, now);
    loginProfiles.addProfile(currentProfile);
}

function logout()
{
    currentProfile.clearAuthenticationProperty();
    currentProfile.save();
    //$.mobile.changePage("#login_page");
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#login_page", { transition : "none" } );
}