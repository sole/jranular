// jranular -- a granular-synth inspired toy by http://5013.es
// ~~~

var JRANULAR =
{
	table : null,
	table_body : null,
	pool : null,
	pool_list : null,
	custom: null,

	// ------

	init : function(dstElement, srcSamples)
	{
		if(!!!document.createElement('audio').canPlayType)
		{
			dstElement.innerHTML = 'Your browser cannot play audio natively. <a href="http://firefox.com">UP</a> <a href="http://www.google.com/chrome">GRA</a> <a href="http://www.opera.com">DE</a>';
			return;
		}

		var canStoreLocally = (!!window.localStorage);

		dstElement.innerHTML =
			'<table id="main" class="chrome"><tbody></tbody></table>' +
			'<div id="pool" class="chrome"><ul></ul></div>';

		if(canStoreLocally)
		{
			dstElement.innerHTML +=
				'<div id="custom" class="chrome"><input type="text" id="sample_url" placeholder="Add your sample URL here" /><button>+</button></div>';
		}

		this.table = document.getElementById('main');
		this.table_body = this.table.querySelector('tbody');
		this.pool = document.getElementById('pool');
		this.pool_list = this.pool.querySelector('ul');
		this.custom = document.getElementById('custom');
		var input = document.getElementById('sample_url');
		
		if(canStoreLocally)
		{
			var btn = this.custom.querySelector('button');
			btn.addEventListener('click', function() {
				url = input.value;
				if(url.length == 0) { return; }
				JRANULAR.storeSample(url);
				JRANULAR.poolAddSample(url, true);
				input.value = '';
			}, false);
		}

		// Samples pool
		var i;
		for(i = 0; i < srcSamples.length; i++)
		{
			this.poolAddSample(srcSamples[i], false);
		}
		var localSamples = this.getStoredSamples();
		
		for(var k in localSamples)
		{
			this.poolAddSample(localSamples[k], true);
		}
		
		setInterval(this.loop, 1000/60);

		// Add a random sample to main
		var lis = this.pool_list.querySelectorAll('li');
		var num = lis.length;
		var random = Math.floor(Math.random() * num)
		this.mainAddSample(lis[random]);


		// deal with select...
		document.addEventListener('mousedown', this.onMouseDown, false);
		
	},
	
	loop : function()
	{
		var sounds = JRANULAR.table_body.querySelectorAll('audio');

		for(var i = 0; i < sounds.length; i++)
		{
			var s = sounds[i];
			
			JRANULAR.updateRow(s);
		}
		
	},

	onMouseDown : function(ev)
	{
		var tag = ev.target.tagName;

		if(tag.match(/input|button/i) == null)
		{
			event.preventDefault();
			return false;
		}
	},

	getFilename : function(url)
	{
		return ((url.split('/').pop()));
	},

	poolAddSample : function(url, local)
	{
		var elem = document.createElement('li');
		var filename = JRANULAR.getFilename(url);
		elem.innerHTML = '<button class="add">+</button>';
		if(local)
		{
			elem.innerHTML += ' <button class="remove">-</button>'
		}
		elem.innerHTML += ' ' + filename;

		elem.setAttribute('data-url', url);
		
		JRANULAR.pool_list.appendChild(elem);

		var btn_add = elem.querySelector('.add');
		btn_add.addEventListener('click', this.onButtonAddSampleClick, false);
		if(local)
		{
			var btn_remove = elem.querySelector('.remove');
			btn_remove.addEventListener('click', this.onButtonRemoveLocalSampleClick, false);
		}
	},

	storeSample : function(url)
	{
		var storedURLs = this.getStoredSamples();
		if(storedURLs.indexOf(url) == -1)
		{
			storedURLs.push(url);
			return this.setStoredSamples(storedURLs);
		}

		return true;
	},

	removeSample : function(url)
	{
		if(!!window.localStorage)
		{
			var samples = JRANULAR.getStoredSamples();
			var pos = samples.indexOf(url);
			if(pos > -1)
			{
				samples.splice(pos, 1);
				JRANULAR.setStoredSamples(samples);
			}
		}
	},

	getStoredSamples : function()
	{
		if(!!window.localStorage)
		{
			if(localStorage.urls === undefined || localStorage.urls === null)
			{
				return [];
			}

			var urls = JSON.parse(localStorage.urls);
			if(typeof(urls) != 'object')
			{
				urls = [];
			}
			return urls;
		}
		
	},

	setStoredSamples : function(samplesArray)
	{
		if(!!window.localStorage)
		{
			localStorage.urls = JSON.stringify(samplesArray);
		}
	},
	

	onButtonAddSampleClick : function()
	{
		JRANULAR.mainAddSample(this.parentNode);
	},

	onButtonRemoveLocalSampleClick : function()
	{
		var li = this.parentNode;
		JRANULAR.removeSample(li.getAttribute('data-url'));
		li.parentNode.removeChild(li);
	},

	mainAddSample : function(node)
	{
		var url = node.getAttribute('data-url');

		var tr = document.createElement('tr');
		
		this.table_body.appendChild(tr);

		tr.insertCell(-1).innerHTML = this.getFilename(url);
		
		var td_al = tr.insertCell(-1);
		td_al.className = 'audio_length';
		td_al.innerHTML = '--:--:--- / --:--:---';

		var td_ac = tr.insertCell(-1);
		td_ac.className = 'audio_container';
		var audio = document.createElement('audio');
		audio.setAttribute('data-start', 0);
		audio.setAttribute('data-end', 1);
		var source = document.createElement('source');
		source.src = url;
		audio.appendChild(source);
		td_ac.appendChild(audio);

		var td_sl = tr.insertCell(-1);
		td_sl.className = 'slider_container';
		var slider = document.createElement('div');
		slider.className = 'slider';
		td_sl.appendChild(slider);
		$(slider).slider({
			range: true,
			min: 0,
			max: 1,
			values: [0, 1],
			step: 0.005
		});
		$(slider).bind('slide', function() {JRANULAR.onSliderUpdate(slider, audio);});
		$(slider).bind('slidestop', function() {JRANULAR.onSliderUpdate(slider, audio);});

		var range = document.createElement('div');
		range.className = 'range';
		td_sl.appendChild(range);
		range.innerHTML = '[--:--:--- / --:--:---]';

		var td_re = tr.insertCell(-1);
		var btn_remove = document.createElement('button');
		btn_remove.addEventListener('click', this.onDeleteTrack, false);
		td_re.appendChild(btn_remove);
		btn_remove.innerHTML = '–';

		audio.addEventListener('ended', JRANULAR.onTrackFinish, false);
		audio.addEventListener('timeupdate', JRANULAR.onTrackProgress, false);
		audio.play();

		this.updateRemoveButtons();

	},

	updateRemoveButtons : function()
	{
		trs	= JRANULAR.table_body.querySelectorAll('tr');
		if(trs.length > 1)
		{
			for(var i = 0; i < trs.length; i++)
			{
				trs[i].querySelector('button').style.visibility = 'visible';
			}
		}
		else
		{
			trs[0].querySelector('button').style.visibility = 'hidden';
		}
	},

	onSliderUpdate : function(slider, audio)
	{
		var valStart = $(slider).slider('values', 0);
		var valEnd = $(slider).slider('values', 1);
		
		audio.setAttribute('data-start', valStart);
		audio.setAttribute('data-end', valEnd);
		JRANULAR.updateRow(audio);
	},

	updateRow : function(audio)
	{

		if(!isNaN(audio.duration) && audio.parentNode && audio.parentNode.parentNode)
		{
			var tr = audio.parentNode.parentNode;
			var range = tr.querySelector('.range');
			var duration = audio.duration;
			range.innerHTML = '[' + this.formatTime(audio.getAttribute('data-start') * duration) + ' / ' + this.formatTime(audio.getAttribute('data-end') * duration) + ']';

			var ct = isNaN(audio.currentTime) ? 0 : audio.currentTime;
			var length = tr.querySelector('.audio_length');
			length.innerHTML = this.formatTime(ct) + ' / ' + this.formatTime(duration);
		}
	},
	
	onTrackFinish : function()
	{
		var d = isNaN(this.duration) ? 0 : this.duration;
		var start = this.getAttribute('data-start');
		var startTime = start * d;

		this.currentTime = startTime;
	},

	onTrackProgress : function()
	{
		var ct = isNaN(this.currentTime) ? 0 : this.currentTime;
		var d = isNaN(this.duration) ? 0 : this.duration;
		var start = this.getAttribute('data-start');
		var end = this.getAttribute('data-end');
		var startTime = start * d;
		var endTime = end * d;
		if(ct < startTime || ct >= endTime)
		{
			this.currentTime = startTime;
		}
	},


	onDeleteTrack : function()
	{
		var tr = this.parentNode.parentNode;
		var audio = tr.querySelector('audio');
		audio.pause();
		audio.removeEventListener('ended', JRANULAR.onTrackFinish, false);
		audio.removeEventListener('timeupdate', JRANULAR.onTrackProgress, false);
		tr.parentNode.removeChild(tr);
		JRANULAR.updateRemoveButtons();
	},

	formatTime : function(t)
	{
		var rem;
		var h = Math.floor(t / 3600.0);
		rem = t - h * 3600;
		var m = Math.floor(rem / 60.0);
		rem = rem - m * 60;
		var s = Math.floor(rem);
		var ms = Math.round((rem - s) * 1000);

		return /*JRANULAR.padNumber(h, 2) + ":" +*/ JRANULAR.padNumber(m, 2) + ":" + JRANULAR.padNumber(s, 2) + ":" + JRANULAR.padNumber(ms, 3);
	},

	padNumber : function(v, amount)
	{
		v = String(v);
		if(v.length < amount)
		{
			var diff = amount - v.length;
			s = '';
			for(var i = 0; i < diff; i++)
			{
				s += '0';
			}
			s += v;
			return s;
		}
		return v;
	}

};
