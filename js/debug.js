var _LTracker = _LTracker || [];
_LTracker.push({'logglyKey': '6d1764a0-1603-4f80-af03-7e9ea0152e93',
'sendConsoleErrors' : true,
'tag' : 'asm'  });

function DebugLog ()
{
	this.level = "DEBUG";
	this.text = null;
}

DebugLog.prototype.log = function(level, text)
{
	this.level = level;
	this.text = text;

	if(this.text == null)
		return;

	if(this.level == "DEBUG")
	{
		console.log(this.text);
	}

	if(this.level == "ERROR")
	{
		console.log(this.text);
		_LTracker.push(text);
	}
}


/*
function debugLog(level, text)
{
	if(text == null)
		return;

	if(level == "DEBUG")
	{
		console.log(this.text);
	}

	if(level == "ERROR")
	{
		console.log(this.text);
		_LTracker.push(text);
	}
}*/