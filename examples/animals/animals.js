var Animals = (function(){
	
	var engine = new fullproof.BooleanEngine();
	engine.clear(function() {
		
	});
	var data = [];
	var dbName = "animals21";
	
	function makeInitializer(progressCallback) {
		return function(injector, callback) {
			var processData = function() {
				var synchro = fullproof.make_synchro_point(callback, data.length-1, true);
				var values = [];
				for (var i=0;i<data.length; ++i) {
					values.push(i);
				}
				injector.injectBulk(data, values, callback, progressCallback);
			};
			
			if (data.length ==0) {
				var loader = new fullproof.DataLoader();
				loader.setQueue("data.csv");
				loader.start(processData, function(txt) {data = txt.split("\n");}, function() { console.log("ERROR??");});
			} else {
				processData();
			}
		}
	}
	
	this.start = function(callback, progress) {
		
		function makeProgressFunction(modifier, base) {
			return function(val) {
				progress(base + (val*modifier));
			}
		}

		var loader = new fullproof.DataLoader();
		loader.setQueue("data.csv");
		loader.start(function() {
			engine.addIndex("normalindex", 
					new fullproof.StandardAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.normalizer.remove_duplicate_letters), 
					new fullproof.Capabilities().setStoreObjects(false).setUseScores(false).setDbName(dbName), 
					makeInitializer(makeProgressFunction(0.5,0)), 
					function(index) {
				engine.addIndex("metaphoneindex", 
						new fullproof.StandardAnalyzer(fullproof.normalizer.to_lowercase_nomark, fullproof.english.metaphone), 
						new fullproof.Capabilities().setStoreObjects(false).setUseScores(false).setDbName(dbName), 
						makeInitializer(makeProgressFunction(0.5,0.5)), 
						function(index) {
					callback(1);
				}, makeProgressFunction(0.5,0.5));
			}, makeProgressFunction(0.5,0));
		}, function(txt, file) {
			data = txt.split("\n");
		}, function() { console.log("ERROR??");});
		
	}

	this.lookup = function(txt, callback) {
		engine.lookup(txt, function(resultset) {

			if (!resultset) {
				return "no match.";
			}
			
			var result = "";
			if (resultset.getSize() == 0) {
				result += "<div style='font-weight:bold;'>No result found for query '" + txt + '"</div>';
			} else {
				result += "<div>" + resultset.getSize() + " entr" + (resultset.getSize()>1?"ies were":"y was") + " found</div>";
			}
			result += "<table><tr><th>Common Name</th><th>Scientific Name</th></tr>";
			resultset.forEach(function(line) {
				var split = data[line].split(";");
				result += "<tr><td>" + (split[0]?split[0]:"-") +"</td><td>" + (split[1]?split[1]:"-") + "</td></tr>"; 
			});
			result += "</table>";
			
			callback(result);
		});
	};
	
	this.reloadDatabase = function(callback) {
		engine.clear(callback);
	};
	
	
	return this;
	
})();