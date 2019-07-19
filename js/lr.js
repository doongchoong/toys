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
    return Object.keys(closure_set).sort();
}

function goto_lr(grammar,non, lr_state, item){
    var ret = [];
    for(var handle of lr_state){
        var rule = parseInt(handle/1000);
        var mark = handle % 1000;
        if(mark < grammar[rule]['body'].length){
            var h = grammar[rule]['body'][mark];
            // 해당 아이템일 경우
            if(item == h){
                // 핸들이동
                var cl = closure(grammar, non, rule*1000+mark+1);
                ret= ret.concat(cl);
            }
        }
    }
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
    var cl = closure(grammar,non, 0);
    lr0_list.push(cl);
    lr0_set[JSON.stringify(cl)] = lr0_pos;

    // makr lr0 sets
    while(lr0_pos < lr0_list.length){
        // lr 상태 하나 가져온다.
        var lr_state = lr0_list[lr0_pos];
        lr0_pos++;
        var table_row = new Array(non_size + ter_size + 1).fill(0);
        var goto = goto_set(grammar, non, ter, lr_state);

        for(var item of goto['non']){
            var t = goto_lr(grammar, non, lr_state, item);
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
        for(var item of goto['ter']){
            var t = goto_lr(grammar, non, lr_state, item);
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

function print_lr0_table(table, cols){
    var maxlen = 0;
    for(var col of cols){
        if(maxlen < col.length){
            maxlen = col.length;
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
        for(var cell of row){
            if(cell == 0){
                // type + number(maxlen-1)
                rowstr += ' ' + ' '.repeat(maxlen-1) + ' | ';
            }else{
                rowstr += 's' + ' '.repeat(
                    maxlen-1-(''+cell).length) + cell + ' | ';
            }
        }
        rowstr += '\n';
        ret += rowstr;
    }
    // end
    ret += line + '\n';
    return ret;
}