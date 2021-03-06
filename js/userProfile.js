function Configs (timeout, resultsNumber)
{
	this.timeout = timeout;
	this.resultsNumber = resultsNumber;
}

function LoginProfiles ()
{
	this.name = "loginProfiles";
	this.profiles = [];
}

function Profile (profileName,apiUrl,username,cryptedCredential,passwordHash,lastUseDate)
{
	this.profileName = profileName;
	this.apiUrl = apiUrl;
    this.username = username;
    this.cryptedCredential = cryptedCredential; 
    this.passwordHash = passwordHash; 
    this.lastUseDate = lastUseDate;
}

Configs.prototype.save = function ()
{
	window.localStorage.setItem("configs", JSON.stringify(this));
};

Configs.prototype.get = function()
{
	return JSON.parse(window.localStorage.getItem("configs"));
};

Configs.prototype.getProperty = function(propertyKey)
{
	this.get();
	return this[propertyKey];
};

Configs.prototype.setProperty = function(propertyKey, propertyVal)
{
	this[propertyKey] = propertyVal;
	this.save();
	return this[propertyKey];
};

LoginProfiles.prototype.get = function()
{
	this.profiles = JSON.parse(window.localStorage.getItem(this.name));
	return this;
};

LoginProfiles.prototype.getProfiles = function()
{
	this.profiles = JSON.parse(window.localStorage.getItem(this.name));
	return this.profiles;
};

LoginProfiles.prototype.getLastUsed = function()
{
	var profiles = this.getProfiles().sort(compare);
	return profiles[0];
};

LoginProfiles.prototype.getProfileByName = function(profileName)
{
	var profiles = this.getProfiles();
	if (profiles !== null) {
		for (var i = profiles.length - 1; i >= 0; i--) {
			var profile = profiles[i];

			if(profile.profileName == profileName)
			{
				return profile;
			}
		}
	}
	return null;
};

// save array of profiles
LoginProfiles.prototype.save = function()
{
	window.localStorage.setItem(this.name, JSON.stringify(this.profiles));
};

// clear array of profiles
LoginProfiles.prototype.clear = function()
{
	window.localStorage.clear(this.name);
};

// remove array of profiles
LoginProfiles.prototype.remove = function()
{
	window.localStorage.removeItem(this.name);
};

LoginProfiles.prototype.addProfile = function(profile)
{
	//se non esiste lo aggiungo, altrimenti lo sostituisco
	var profile_ = this.getProfileByName(profile.profileName);

	if(profile_ === null)//non esiste
	{
		//lo aggiungo
		if(this.profiles !== null)
		{
			this.profiles.push(profile);
			this.save();
		}
	}
	else
	{
		this.saveProfile(profile);
	}
};

LoginProfiles.prototype.removeProfile = function(profile)
{
	var profileIndex=-1;
	var profiles = this.getProfiles();

	for (var i = profiles.length - 1; i >= 0; i--) {
		var _profile = profiles[i];

		if(_profile.profileName == profile.profileName)
		{
			profileIndex = i;
			break;
		}
	}

	if (profileIndex > -1) {
    	profiles.splice(profileIndex, 1);
    	this.save();
	}
};

LoginProfiles.prototype.saveProfile = function(profile)
{
	this.removeProfile(profile);
	this.addProfile(profile);
};


Profile.prototype.save = function()
{
	var loginProfiles = new LoginProfiles();
	loginProfiles.saveProfile(this);
};

Profile.prototype.getProperty = function(propertyKey)
{
	return this[propertyKey];
};

Profile.prototype.clearAuthenticationProperty = function()
{
	this.cryptedCredential = "";
	this.passwordHash = "";
	this.save();
};

function compare (a,b)
{
	if (a.lastUseDate < b.lastUseDate)
	{
		return -1;
	}
	if (a.lastUseDate > b.lastUseDate)
	{
		return 1;
	}
	return 0;
}
