// lr.js

function set_is_equal(setA, setB){
    if((Object.keys(setA)).length !== (Object.keys(setB)).length) return false;
    for(var k of Object.keys(setA)){
        if(k in setB){
            // pass
        }else{
            return false;
        }
    }
    return true;
}

function set_union(setA, setB){
    var uni = {};
    for(var k in setA){
        uni[k] = '';
    }
    for(var k in setB){
        uni[k] = '';
    }
    return uni;
}
function set_ringsum(setA, setB){
    var ring = {};
    for(var k in setA){
        ring[k] = '';
    }
    if('epsilon' in ring){
        delete ring['epsilon'];
        ring = set_union(ring, setB);
    }
    return ring;
}


function get_first(gram){
    var grammar = gram['gram'];
    var non = gram['non'];
    var ter = gram['ter'];
    var first_set = {};
    var is_change = false;
    
    // 1. 첫번째 심볼이 터미널 전수조사
    for(var rule of grammar){
        var head = rule['head'];
        
        if(head in first_set){
            // pass
        }else{
            first_set[head] = {};
        }
        
        if(rule['body'].length > 0){
            if(rule['body'][0] in ter){
                is_change = true;
                first_set[head][rule['body'][0]] = '';
            }
        }else{
            is_change = true;
            first_set[head]['epsilon'] = '';
        }
    }
    // 2. first가 변하지 않을때까지 반복
    while(is_change){
        is_change = false;
        
        for(var rule of grammar){
            var head = rule['head'];
            var body = rule['body'];
            
            // 첫번째 심볼이 논터미널인 경우
            if(body.length > 0 && body[0] in non){
                var changer = first_set[body[0]];
                // 그 뒤 심볼도 고려
                for(var j=1; j < body.length; j++){
                    if(body[j] in non){
                        changer = set_ringsum(changer, first_set[body[j]]);
                    }else{
                        var t = {};
                        t[body[j]] = '';
                        changer = set_ringsum(changer, t);
                        break;
                    }
                }
                // 합집합을 구한다.
                changer = set_union(first_set[head], changer);
                //바뀌었나?
                if(!set_is_equal(first_set[head], changer)){
                    is_change = true;
                    first_set[head] = changer;
                } 
            }
        }// for
    } // while
    
    return first_set;
}




function closure(grammar, non, handle){
    var closure_set = {};
    var handles = [handle];
    var handles_pos = 0;

    while(handles_pos < handles.length){
        var h = handles[handles_pos];
        handles_pos++;
        var rule = parseInt(h / 1000);
        var mark = h % 1000;

        // 자기자신을 넣는다.
        closure_set[h] = '';

        // 마크가 논터미널이면
        if(mark < (grammar[rule]['body']).length){
            if(grammar[rule]['body'][mark] in non){
                for(var i=0; i < grammar.length; i++){
                    // 모든 생성규칙을 찾고
                    if(grammar[i]['head'] == grammar[rule]['body'][mark]){
                        if((i * 1000 + 0) in closure_set){
                            // pass
                        }else{
                            //클로저 집합에 없는 경우 핸들추가
                            handles.push(i * 1000 + 0);
                        }
                    }
                }
            }
        }
    }
    return closure_set;
    //return Object.keys(closure_set).sort();
}

function goto_lr(grammar,non, lr_state, item){
    var ret = [];
    var closure_set = {};
    for(var handle of lr_state){
        var rule = parseInt(handle/1000);
        var mark = handle % 1000;
        if(mark < grammar[rule]['body'].length){
            var h = grammar[rule]['body'][mark];
            // 해당 아이템일 경우
            if(item == h){
                // 핸들이동
                var cl = closure(grammar, non, rule*1000+mark+1);
                closure_set = set_union(closure_set, cl);
            }
        }
    }
    ret = Object.keys(closure_set).sort();
    return ret;
}

function goto_set(grammar, non, ter, lr_state){
    var non_goto = [];
    var non_set = {};
    var ter_goto = [];
    var ter_set = {};
    for(var handle of lr_state){
        var rule = parseInt(handle/1000);
        var mark = handle % 1000;
        if(mark < grammar[rule]['body'].length){
            var h = grammar[rule]['body'][mark];
            if (h in non){
                if(h in non_set){
                    // pass
                }else{
                    non_set[h] = '';
                    non_goto.push(h);
                }
            }
            if (h in ter){
                if(h in ter_set){
                    // pass
                }else{
                    ter_set[h] = '';
                    ter_goto.push(h);
                }
            }
        }
    }
    return {'non':non_goto, 'ter':ter_goto};
}


function gen_lr0(gram){
    // 최초 커널항목 추가
    var grammar = [{'head':'^START', 'body':[gram['gram'][0]['head']]}].concat(gram['gram']);
    var non = gram['non'];
    var ter = gram['ter'];
    var non_size = Object.keys(non).length;
    var ter_size = Object.keys(ter).length;

    var lr0_set = {};
    var lr0_list = [];
    var lr0_pos = 0;
    var lr0_table = [];

    // init lr0
    var cl = Object.keys(closure(grammar,non, 0)).sort();
    lr0_list.push(cl);
    lr0_set[JSON.stringify(cl)] = lr0_pos;

    // makr lr0 sets
    while(lr0_pos < lr0_list.length){
        // lr 상태 하나 가져온다.
        var lr_state = lr0_list[lr0_pos];
        lr0_pos++;

        if(lr0_pos > 200){
            break;
        }
        var table_row = new Array(non_size + ter_size + 1).fill(0);
        var goto = goto_set(grammar, non, ter, lr_state);

        for(var item of goto['non']){
            var t = goto_lr(grammar, non, lr_state, item);
            if(t.length > 0){
                var tk = JSON.stringify(t);
                if(tk in lr0_set){
                    //pass
                }else{
                    var l = lr0_list.length;
                    lr0_list.push(t);
                    lr0_set[tk] = l;
                }
                table_row[ter_size + non[item]+1] = lr0_set[tk];
            }
        }
        for(var item of goto['ter']){
            var t = goto_lr(grammar, non, lr_state, item);
            if(t.length > 0){
                var tk = JSON.stringify(t);
                if(tk in lr0_set){
                    // pass
                }else{
                    var l = lr0_list.length;
                    lr0_list.push(t);
                    lr0_set[tk] = l;
                }
                table_row[ter[item]+1] = lr0_set[tk];
            }
        }
        lr0_table.push(table_row);
    }

    // goto table column
    var lr0_table_cols = new Array(non_size + ter_size + 1).fill(0);
    for(var item in non){
        var idx = non[item] + ter_size + 1;
        lr0_table_cols[idx] = item;
    }
    for(var item in ter){
        var idx = ter[item] + 1;
        lr0_table_cols[idx] = item;
    }
    lr0_table_cols[0] = '$';


    var ret = {
        'lr0_states': lr0_list,
        'lr0_table' : lr0_table,
        'lr0_table_cols' : lr0_table_cols
    };
    return ret;
}

function print_table(gram, table, cols){
    var ter = gram['ter'];
    var ter_size = Object.keys(ter).length;

    var maxlen = 0;
    for(var col of cols){
        if(maxlen < col.length){
            maxlen = col.length;
        }
    }
    for(var row of table){
        for(var cell of row){
            if(maxlen < (''+cell).length+1){
                maxlen = (''+cell).length+1;
            }
        }
    }
    maxlen += 1;

    // header
    var line= '-------+-';
    var ret = '[    ] | ';
    for(var col of cols){
        line += '-'.repeat(maxlen) + '-+-';
        ret += ' '.repeat(maxlen - col.length) + col + ' | ';
    }
    ret = line + '\n' + ret + '\n' + line + '\n';

    // body
    for(var i=0; i < table.length; i++){
        var row = table[i];
        var rowstr = '[' + ' '.repeat(4 - (''+i).length) + i + '] | ';
        for(var j=0; j < row.length; j++){
            var cell = row[j];
            if(cell == 0){
                // type + number(maxlen-1)
                rowstr += ' ' + ' '.repeat(maxlen-1) + ' | ';
            }else{
                var prefix = '';
                var str_cell = ''+cell;
                
                if (j < ter_size){
                    if(cell < table.length){
                        prefix = 's';
                    }else{
                        prefix = 'r';
                        str_cell = '' + (cell - table.length);
                    }
                }else{
                    prefix = ' ';
                }
                if(cell < 0){
                    prefix = ' ';
                    str_cell = 'ACC';
                }

                rowstr += prefix + ' '.repeat(
                    maxlen-1-str_cell.length) + str_cell + ' | ';
            }
        }
        rowstr += '\n';
        ret += rowstr;
    }
    // end
    ret += line + '\n';
    return ret;
}


function gen_la(gram, lr0_info, first_set){
    //var grammar = gram['gram'];
    var grammar = [{'head':'^START', 'body':[gram['gram'][0]['head']]}].concat(gram['gram']);
    var non = gram['non'];
    var ter = gram['ter'];
    var non_size = Object.keys(non).length;
    var ter_size = Object.keys(ter).length;
    var table = lr0_info['lr0_table'];
    var lr_states = lr0_info['lr0_states'];

    // origin을 구함
    // marker가 룰의 마지막에 찍힌 LR0 상태에서
    // 어떤 상태(marker가 맨앞인 시작상태)에서 시작하여 
    // 이 상태로 도달했는지
    // 가능성있는 모든 LR0의 상태를 찾음
    function pred(state, rule, pos, pred_set){
        if(pos <= 0){
            pred_set[state] = '';
        }else{
            var sym = grammar[rule]['body'][pos-1];
            if(sym in non){
                var idx = non[sym] + ter_size + 1;
                for(var i=0; i < table.length; i++){
                    if(table[i][idx] == state){
                        pred(i, rule, pos-1, pred_set);
                    }
                }
            }else if(sym in ter){
                var idx = ter[sym] + 1;
                for(var i=0; i < table.length; i++){
                    if(table[i][idx] == state){
                        pred(i, rule, pos-1, pred_set);
                    }
                }
            }
        }
    }
    
    /*
    var prd = {};
    pred(1, 0, 1, prd );
    console.log(prd);

    var prd1 = {};
    pred(5, 6, 1, prd1);
    console.log(prd1);

    var prd2 = {};
    pred(9, 1, 3, prd2);
    console.log(prd2);
    */

    // 어떤 Rule의 handle에서 다음에 올수있는 첫번쨰 터미널의 집합
    function first(rule, pos){
        var ret = {};
        var body = grammar[rule]['body']; 
        if(pos < body.length){
            if(body[pos] in ter){
                ret[body[pos]] = '';
            }else if(body[pos] in non){
                ret = set_union(ret, first_set[body[pos]]);
                for(var i=pos+1; i < body.length; i++){
                    ret = set_ringsum(ret, first_set[body[i]]);
                }
            }else{
                ret['epsilon'] = '';
            }
        }else{
            ret['epsilon'] = '';
        }
        return ret;
    }
    /*
    console.log(first(2,1));
    console.log(first(5,0));
    console.log(first(6,1));
    console.log(first(1,2));
    */

    var la_stamp = {};

    function lookahead(state, rule, pos, la_set){
        if(grammar[rule]['head'] == '^START'){
            la_set['$'] = ''; // end terminal
            return la_set;
        }else{
            var pred_set = {};
            pred(state, rule, pos, pred_set);

            for(var lr_idx in pred_set){
                var lr = lr_states[lr_idx];
                for(var i=0; i < lr.length; i++){
                    var handle = lr[i];
                    var r = parseInt(handle/1000);
                    var mark = handle % 1000;
                    if(grammar[r]['body'][mark] == grammar[rule]['head']){
                        // pred중 rule head를 유도한 lr상태의 handle
                        var f = first(r, mark+1);
                        var stamp = lr_idx + ' ' + handle;

                        if('epsilon' in f){
                            if(stamp in la_stamp){
                                // pass
                            }else{
                                la_stamp[stamp] = '';
                                var n = {};
                                // lookahead를 해당 핸들에 대해 다시 구함
                                n = lookahead(lr_idx, r, mark, n);
                                f = set_ringsum(f, n);
                                la_set = set_union(la_set, f);
                            }
                        }else{
                            la_stamp[stamp] = '';
                            la_set = set_union(la_set, f);
                        }
                    }
                }
            }
            return la_set;
        }
    }
    /*
    la_stamp = {};
    var la0 = {};
    console.log(lookahead(1, 0, 1, la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(2,2,1,la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(3,4,1,la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(5,6,1,la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(9,1,3,la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(10,3,3,la0));

    la_stamp = {};
    la0 = {};
    console.log(lookahead(11,5,3,la0));
    */

    var ret = {};

    for(var i =0; i < lr_states.length; i++){
        var lr = lr_states[i];
        for(var j=0; j < lr.length; j++){
            var handle = lr[j];
            var r = parseInt(handle/1000);
            var mark = handle % 1000;
            // LR상태중 핸들이 끝에 도달한 rule을 찾는다. (r)
            // 그 핸들의 Lookahead를 찾는다.
            if(grammar[r]['body'].length == mark){
                la_stamp = {};
                var la = {};
                la = lookahead(i, r, mark, la);
                if( i in ret){
                    ret[i].push({'la_set': la, 'rule': r});
                }else{
                    ret[i] = [{'la_set': la, 'rule': r}];
                }
            }
        }
    }

    return ret;
}



function conflict_check(gram, lr0_info, la_set, prec_set){
    var grammar = [{'head':'^START', 'body':[gram['gram'][0]['head']]}].concat(gram['gram']);
    var non = gram['non'];
    var ter = gram['ter'];
    ter['$'] = -1; // end symbol
    var non_size = Object.keys(non).length;
    var ter_size = Object.keys(ter).length;
    var table = lr0_info['lr0_table'];

    var conflict_list = [];

    // copy table => r_table
    var r_table = [];
    for(var i=0; i < table.length; i++){
        var row = [];
        for(var j=0; j <  table[i].length; j++){
            row.push(table[i][j]);
        }
        r_table.push(row);
    }

    var ridx = table.length;

    // reduce 가지고 비교하여 conflict 체크
    for(var lr in la_set){
        for(var reduce of la_set[lr]){
            var la = reduce['la_set'];
            var rule = reduce['rule'];
            for(var sym in la){
                if(r_table[lr][ter[sym]+1] == 0){
                    if(rule == 0){
                        r_table[lr][ter[sym]+1] = -1; // accept
                    }else{
                        r_table[lr][ter[sym]+1] = ridx + rule;
                    }
                }else{
                    // conflict!!
                    if(r_table[lr][ter[sym]+1] > ridx){
                        // reduce-reduce conflict
                        // 먼저 나온생성규칙 선택
                        var ch_rule = Math.min(r_table[lr][ter[sym]+1]-ridx, rule);
                        r_table[lr][ter[sym]+1] = ch_rule + ridx;
                        conflict_list.push({
                            'type': 'reduce-reduce',
                            'rule1': grammar[rule1],
                            'rule2': grammar[rule2],
                            'choose_rule': ch_rule
                        });
                    }else{
                        // shift-reduce conflict
                        var sym_prec = 0;
                        var rule_prec = 0;
                        var choose = 'shift';
                        if(sym in prec_set){
                            sym_prec = prec_set[sym]['score'];
                        }
                        if(grammar[rule]['op'] in prec_set){
                            rule_prec = prec_set[grammar[rule]['op']]['score'];
                        }
                        if(sym_prec < rule_prec){
                            // 규칙이 더 우선순위 있는경우 reduce
                            r_table[lr][ter[sym]+1] = ridx + rule;
                            choose = 'reduce';
                        }else if(sym_prec == rule_prec){
                            //같은경우 assoc 방식 체크
                            if (sym in prec_set) {
                                if (prec_set[sym]['type'] == 'left') {
                                    //left면 감축을 선택
                                    r_table[lr][ter[sym] + 1] = ridx + rule;
                                    choose = 'left-reduce';
                                } else if (prec_set[sym]['type'] == 'nonassoc') {
                                    // nonassoc 이면 syntax error 선택
                                    r_table[lr][ter[sym] + 1] = 0;
                                    choose = 'nonassoc';
                                } else {
                                    choose = 'right';
                                }
                            }
                        }
                        conflict_list.push({
                            'type': 'shift-reduce',
                            'symbol': sym,
                            'rule': grammar[rule],
                            'choose': choose
                        });
                    }
                }
            }
        }
    }
    return {
        'table':r_table,
        'conflict': conflict_list
    };
}