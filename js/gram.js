// gram.js
console.log('load_gram.js');

function gram_tok(text){
	var lines = text.split('\n');
	var preproc_list = [];
	var prec_set = {};
	var prec_score = 0;
	for(var line of lines){
		var typ = null;
		if(line.indexOf('%left') != -1){
			typ = 'left';
		}
		if(line.indexOf('%right') != -1){
			typ = 'right';
		}
		if(line.indexOf('%nonassoc') != -1){
			typ = 'nonassoc';
		}
		if(typ == null){
			preproc_list.push(line);
		}else{
			var symbols = line.split(/\s+/);
			for(var sym of symbols){
				if (sym != '%left' && sym != '%right' && sym != '%nonassoc') {
					if (sym.length > 0) {
						prec_score++;
						prec_set[sym] = { 'score': prec_score, 'type': typ };
					}
				}
			}
		}
	}
	text = preproc_list.join(' ');
	// 토큰은 기본적으로 공백으로 구분
	// 주석은 가장 바깥쪽 짝으로 맞춤 
	var toks = text.split(/\s+|\/\*(?:\s|.)*\*\//);
	var ret = [];
	for(var i=0; i < toks.length; i++){
		if(toks[i] == ''){
			// pass
		}else{
			// 공백, 주석 제거된 상태
			var pos = 0;
			var tok = toks[i];
			while(true){
				var tail = pos;
				// 토큰 : , ; , |  을 찾는다.
				tail = tok.substring(tail).search(/[:;|]/);
				//console.log('tok:[' + tok + '] pos:' + pos + ', tail:' + tail);
				if(tail < 0){
					// 더이상 찾지 못한경우 남아있는 문자열 토큰화
					if( pos < tok.length) {
						ret.push(tok.substring(pos));
					}
					break;
				}
				// 앞 문자열 존재하면 토큰화
				if( pos < tail){
					ret.push(tok.substring(pos, tail));
				}
				// 토큰화
				ret.push(tok.substring(tail, tail+1));
				pos = tail + 1;
			}
		}
	}
	//console.log(ret);
	return {'toks': ret, 'prec': prec_set};
}


/*
E : E + T | ;
T : T * F | ;
F : ( E ) | D ;

간단한 BNF 구조 문법 파싱
*/

function parse_gram(toks){
    var NLL = 0;
	var PRD = 1;
	var END = 2;
	var ORR = 3;
	var PRC = 4;
	var STR = 5;
    // 심볼종류
	function get_sym(tok){
		switch(tok){
		    case null: return NLL;
			case ':': return PRD;
			case ';': return END;
			case '|': return ORR;
			case '%prec': return PRC;
			default: return STR;
		}
	}

	var look = '';
	var looki = 0;
	look = toks[looki];
    // 매칭시키고 맞으면 진행
	function match(sym){
		if(sym != get_sym(look)){
			throw 'parse error' + sym + ' ' + look;
		}
		looki++;
		if( looki < toks.length) {
		    look = toks[looki];
		}else {
		    look = null;
		}
	}


	// parsing
	var grammar = [];
	var non = {}; // nonterminal
	var ter = {}; // terminal

	function gram(){
		while(true){
			if(get_sym(look) == STR){
			    var symbol = look;
				match(STR);
				match(PRD);
				body(symbol);
				match(END);
				continue;
			}
			break;
		}
	}
	function body(symbol){
		sub(symbol);
		body_(symbol);
	}
	function sub(symbol){
		var rule = [];
		var op = null;
		while(true){
			if(get_sym(look) == STR){
			    rule.push(look);
				match(STR);
				if(get_sym(look) == PRC){
					op = prec();
					break;
				}
				continue;
			}
			break;
		}
		grammar.push({'head': symbol, 'body': rule, 'op': op});
	}
	function body_(symbol){
		while(true){
			if(get_sym(look) == ORR){
				match(ORR);
				sub(symbol);
				continue;
			}
			break;
		}
	}
	// %prec 으로 새로운 operation 으로 지정
	function prec(){
		match(PRC);
		var symbol = look;
		match(STR);
		return symbol;
	}
    // start parsing
	try{
		gram();
	}catch(e){
		console.log(e);
		return {'error': true};
	}
	
	// 논터미널
	var cnt = 0;
	for(var i=0; i < grammar.length; i++){
		if(grammar[i]['head'] in non){
			// pass
		}else{
			non[grammar[i]['head']] = cnt++;
		}
	}
	
	// 터미널
	cnt=0;
	for(var i=0; i < grammar.length; i++){
		var last_ter = null;
	    for(var j=0; j < grammar[i]['body'].length; j++){
	        if(grammar[i]['body'][j] in non){
	            // pass
	        }else{ 
				if(grammar[i]['body'][j] in ter){
					// pass
				}else{
					ter[grammar[i]['body'][j]] = cnt++;
				}
				last_ter = grammar[i]['body'][j];
	        }
		}
		// 해당룰의 operation은 마지막 터미널로 한다.
		if(grammar[i]['op'] == null){
			grammar[i]['op'] = last_ter;
		}
	}
	
	
	return { 
	    'gram': grammar,
	    'non' : non,
	    'ter' : ter
	};
}



