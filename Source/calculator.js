/*
 * Some header comment
 */

// $(document).ready(function(){
//    $("a").click(function(event){
//      alert("Thanks for visiting!");
//    });
//  });

/*
 * times     \u00D7
 * nbsp      \u00A0
 * empty set \u2205
 */

function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
    return 'AssertException: ' + this.message;
}

function assert( exp, msg )
{
    if( !exp )
    {
        throw new AssertionException( msg );
    }
}

function swap_values( a, b )
{
    // alert( "swap_values" );
    var temp = a.value;
    a.value = b.value;
    b.value = temp;
}

/* make_thing is just a convenience wrapper around createElement, setAttribute
 * and appendChild */
function make_thing( tag, attrs, children )
{
    var thing = document.createElement( tag );
    for( var i = 0; i < attrs.length; ++i )
    {
        thing.setAttribute( attrs[i][0], attrs[i][1] );
    }
    for( var i = 0; i < children.length; ++i )
    {
        thing.appendChild( children[i] );
    }
    return thing;
}

function make_super( text )
{
    return make_thing( "SUP", [], [ make_thing( "SPAN", [["style", "font-size:smaller"]], [ document.createTextNode( text ) ] ) ] )
}

/* Begin table parsing code */

/* Dumb get child returns the appropriate child or throws and exception */
function dumb_get_child( thing, name )
{
    if( true )
    {
        var name_lower = name.toLowerCase();
        for( var i = 0; i < thing.childNodes.length; ++i )
        {
            var child = thing.childNodes[ i ];
            if( ( child.name && child.name.toLowerCase() == name_lower )
                || ( child.getAttribute && child.getAttribute( "name" )
                     && child.getAttribute( "name" ).toLowerCase() == name_lower )
                || ( child.nodeName && child.nodeName.toLowerCase() == name_lower )
                || ( child.tagName && child.tagName.toLowerCase() == name_lower ) )
            {
                return child;
            }
        }
    }
    else
    {
        for( var i = 0; i < thing.childNodes.length; ++i )
        {
            var child = thing.childNodes[ i ];
            if( ( child.name && child.name == name )
                || ( child.getAttribute && child.getAttribute( "name" )
                     && child.getAttribute( "name" ) == name_lower )
                || ( child.nodeName && child.nodeName == name_lower )
                || ( child.tagName && child.tagName == name_lower ) )
            {
                return child;
            }
        }
    }
    
    throw "no child " + name + " in " + thing;
}

function dumb_get_child_opt( thing, name )
{
    try
    {
        return dumb_get_child( thing, name );
    }
    catch( e )
    {
        return null;
    }
}

function term_template()
{
    this.num = null;
    this.num_unit = null;
    this.den = null;
    this.den_unit = null;
}

function parse_term_structure( term_lmnt )
{
    var rv = new term_template();
    if( term_lmnt.rows.length == 1
        && term_lmnt.rows[0].cells.length == 2 )
    {
        var number_cell  = term_lmnt.rows[0].cells[0];
        var unit_cell    = term_lmnt.rows[0].cells[1];
        var unit_table   = dumb_get_child( unit_cell, "TABLE" );
        if( !( unit_table.rows.length == 2
               && unit_table.rows[0].cells.length == 1
               && unit_table.rows[1].cells.length == 1 ) )
        {
            throw "Couldn't parse term";
        }
        rv.num      = dumb_get_child( number_cell, "INPUT" );
        rv.num_unit = dumb_get_child( unit_table.rows[0].cells[0], "INPUT" );
        rv.den_unit = dumb_get_child( unit_table.rows[1].cells[0], "INPUT" );
    }
    else if( term_lmnt.rows.length == 2
        && term_lmnt.rows[0].cells.length == 1
        && term_lmnt.rows[1].cells.length == 1 )
    {
        var num_cell = term_lmnt.rows[0].cells[0];
        var den_cell = term_lmnt.rows[1].cells[0];
        rv.num      = dumb_get_child( num_cell, "numerator" );
        rv.den      = dumb_get_child( den_cell, "denominator" );
        rv.num_unit = dumb_get_child( num_cell, "numerator_unit" );
        rv.den_unit = dumb_get_child( den_cell, "denominator_unit" );
    }
    else
    {
        throw "parse_term shit's broke!" + term_lmnt.rows.length;
    }
    return rv;
}

/* term should be the result of calling parse_term_structure */
function parse_term_values( term, opt )
{
    // alert( "parse_term_values" );
    var rv = new term_template();
    rv.num = parseFloat( term.num.value );
    if( isNaN( rv.num ) )
    {
        if( opt )
            rv.num = term.num.value;
        else
            throw "numerator is not a number";
    }
    if( term.den )
    {
        rv.den = parseFloat( term.den.value );
        if( isNaN( rv.den ) )
        {
            if( opt )
                rv.den = term.den.value;
            else
                throw "denominator is not a number";
        }
    }
    rv.num_unit = term.num_unit.value.split( /\s/ );
    rv.den_unit = term.den_unit.value.split( /\s/ );
    assert( rv.num_unit != null && rv.den_unit != null, "bad medicine" );
    return rv;
}

function parse_product( tb )
{
    var prod = [];
    assert( "rows" in tb && tb.rows.length > 0, "Expecting the table thing" );
    var row_lmnt = tb.rows[0];
    for( var j = 0, col; col = row_lmnt.cells[j]; ++j )
    {
        var l_tab = dumb_get_child_opt( col, "term" );
        if( l_tab )
        {
            var term = parse_term_values( parse_term_structure( l_tab ), true );
            ++prod.length;
            prod[ prod.length - 1 ] = term;
        }
    }
    assert( prod.length > 0, "NO TERMS!" );
    return prod;
}

/* End table parsing code */

/* Begin simplification code */

function copy_term( t )
{
    var rv = new term_template();
    rv.num = t.num;
    rv.den = t.den;
    rv.num_unit = [];
    rv.num_unit.length = t.num_unit.length;
    for( var i = 0; i < t.num_unit.length; ++i )
    {
        rv.num_unit[i] = t.num_unit[i];
    }
    rv.den_unit = [];
    rv.den_unit.length = t.den_unit.length;
    for( var i = 0; i < t.den_unit.length; ++i )
    {
        rv.den_unit[i] = t.den_unit[i];
    }
    return rv;
}

function copy_prod( p )
{
    var rv = [];
    rv.length = p.length;
    for( var i = 0; i < p.length; ++i )
    {
        rv[i] = p[i] ? copy_term( p[i] ) : null;
    }
    return rv;
}

function copy_prods( ps )
{
    var rv = [];
    rv.length = ps.length;
    for( var i = 0; i < ps.length; ++i )
    {
        rv[i] = ps[i] ? copy_prod( ps[i] ) : null;
    }
    return rv;
}

function simplification_step( simplification, phase )
{
    assert( simplification && "length" in simplification && simplification.length > 0,
            "Internal error: simplification_step got invalid data");
    var prods_orig = simplification[ simplification.length - 1 ];
    var prods = copy_prods( prods_orig );
    var simplified_anything = false;

    for( var i = 0; i < prods.length && !simplified_anything; ++i )
    {
        var prod_row = prods[i];
        if( !( prod_row && prod_row.length && prod_row.length > 0 ) )
        {
            continue;
        }
        var term1 = null, term2 = null;
        for( var j = 0; j < prod_row.length && !simplified_anything; ++j )
        {
            if( phase == 1 )
            {
                prod_row[j].num.toPrecision( 1 );
                if( prod_row[j].den )
                {
                    prod_row[j].den.toPrecision( 1 );
                }
                continue;
            }
            if( phase == 3 )
            {
                if( term1 ) term2 = prod_row[j];
                else        term1 = prod_row[j];
                if( !( term1 && term2 ) )
                    continue;
                simplified_anything = true;
                term1.num *= term2.num;
                if( term2.den )
                {
                    term1.den = term1.den ? ( term1.den * term2.den ) : term2.den;
                }
                term1.num_unit = term1.num_unit.concat( term2.num_unit );
                term1.den_unit = term1.den_unit.concat( term2.den_unit );
                prod_row[j] = null;
                break;
            }
            /* "else" (the preceeding conditonal either continues or breaks) */
            term1 = prod_row[j];
            if( !term1 )
            {
                continue;
            }
            if( phase == 4 )
            {
                if( !term1.den )
                {
                    continue;
                }
                var diff = Math.abs( term1.den - 1.0 );
                var epsilon = 0.00001;
                term1.num /= term1.den;
                term1.den = 1.0;
                if( diff < epsilon )
                {
                    continue;
                }
                simplified_anything = true;
                break;
            }
            /* "else" (the preceeding conditonal either continues or breaks) */
            for( var k = 0; k < term1.num_unit.length && !simplified_anything; ++k )
            {
                var unit1 = term1.num_unit[k];
                if( !unit1 )
                {
                    continue;
                }
                for( var j2 = 0; j2 < prod_row.length && !simplified_anything; ++j2 )
                {
                    term2 = prod_row[j2];
                    if( !term2 )
                    {
                        continue;
                    }
                    for( var k2 = 0; k2 < term2.den_unit.length && !simplified_anything; ++k2 )
                    {
                        var unit2 = term2.den_unit[k2];
                        if( unit1 == unit2 )
                        {
                            term1.num_unit[k] = null;
                            term2.den_unit[k2] = null;
                            simplified_anything = true;
                        }
                    }
                }
            }
        }
    }
    if( simplified_anything )
    {
        ++simplification.length;
        simplification[ simplification.length - 1 ] = prods;
    }
    return simplified_anything;
}

function find_term( prod )
{
    if( !prod )
    {
        return null;
    }
    for( var i = 0; i < prod.length; ++i )
    {
        if( prod[i] )
            return prod[i];
    }
    return null;
}

function perform_an_addition( simplification )
{
    assert( "length" in simplification && simplification.length > 0, "bad simpl" );
    var prods_orig = simplification[ simplification.length - 1 ];
    var prods = copy_prods( prods_orig );
    var added_anything = false;
    var term1 = null, term2 = null;
    for( var i = 0; i < prods.length && !added_anything; ++i )
    {
        if( !term1 )
        {
            term1 = find_term( prods[i] );
        }
        else
        {
            term2 = find_term( prods[i] );
        }
        if( !( term1 && term2 ) )
        {
            continue;
        }
        added_anything = true;
        term1.num += term2.num;
        /* check units */
        prods[i] = null;
    }
    if( added_anything )
    {
        ++simplification.length;
        simplification[ simplification.length - 1 ] = prods;
    }
    return added_anything;
}

/* End simplification code */

/* Begin rendering code */

function render_unit( unit, unit_next )
{
    var unit_lmnts = [];
    var first = true;
    for( var i = 0; i < unit.length; ++i )
    {
        var u = unit[ i ];
        if( !u ) { continue; }
        var attrs = [];
        if( !unit_next )
        {
            attrs = [ ["class","smpfy_unit_gone"] ];
        }
        else if( !unit_next[ i ] )
        {
            attrs = [ ["class","smpfy_unit_elim"] ];
        }
        unit_lmnts.push( make_thing( "SPAN", attrs, [ document.createTextNode( ( first ? "" : "\u00A0" ) + u ) ] ) ); 
        first = false;
    }
    return unit_lmnts;
}

function render_prod_expression( prod, prod_next )
{
    // alert( "render_prod_expression" );
    try
    {
        var sig_figs = parseInt( document.getElementById( "num_sig_figs" ).value );
    }
    catch( e )
    {
        alert( "WHY?" );
        throw e;
    }
    var terms = [];
    for( var i = 0; i < prod.length; ++i )
    {
        var term = prod[ i ];
        if( !term )
        {
            continue;
        }
        var epsilon = 0.00001;
        var term_next = prod_next ? prod_next[ i ] : null;
        var term_next_diff = true;
        if( term_next )
        {
            term_next_diff = term_next != term;
        }
        var rendered_num_unit = render_unit( term.num_unit, term_next ? term_next.num_unit : null );
        var rendered_den_unit = render_unit( term.den_unit, term_next ? term_next.den_unit : null );
        var num_unit_vis = rendered_num_unit.length > 0;
        var den_unit_vis = rendered_den_unit.length > 0;
        var val_bot_row = [], unit_top_row = rendered_num_unit, unit_bot_row = rendered_den_unit;
        try
        {
            val_top_row = [ document.createTextNode( term.num.toPrecision( sig_figs ) ) ];
        }
        catch( e )
        {
            val_top_row = [ make_thing( "SPAN", [["class", "smpfy_bad_num"]], [ document.createTextNode( term.num ) ] ) ];
        }
        if( term.den )
        {
            try
            {
                term.den.toPrecision( sig_figs );
                if( Math.abs( term.den - 1.0 ) > epsilon )
                {
                    val_bot_row = [ document.createTextNode( term.den.toPrecision( sig_figs ) ) ];
                }
            }
            catch( e )
            {
                val_bot_row = [ make_thing( "SPAN", [["style", "background-color:lightblue"]],
                    [ document.createTextNode( term.den ) ] ) ];
            }
        }
        if( den_unit_vis && !num_unit_vis )
        {
            unit_top_row = [ document.createTextNode( "(" ) ].concat( rendered_den_unit,
                [ document.createTextNode( ")" ), make_thing( "SUP", [], [ document.createTextNode( "-1" ) ] ) ] );
            unit_bot_row = [];
        }
        ++terms.length;
        if( val_bot_row.length > 0 || unit_bot_row.length > 0 )
        {
            val_top  = [ make_thing( "TD", val_bot_row.length  > 0 ? [["align","right"]] : [["rowspan","2"]], val_top_row ) ];
            val_bot  = val_bot_row.length > 0  ? [ make_thing( "TD", [["align","right"]], val_bot_row ) ]  : [];
            unit_top = [ make_thing( "TD", unit_bot_row.length > 0 ? [["align","right"]] : [["rowspan","2"]], unit_top_row ) ];
            unit_bot = unit_bot_row.length > 0 ? [ make_thing( "TD", [["align","right"]], unit_bot_row ) ] : [];
            terms[ terms.length - 1 ] = 
                [ make_thing( "TABLE",
                    [["style", "display:inline-block; vertical-align:middle" + ( term_next_diff ? "; background-color:lightsalmon" : "" )],
                     ["border", "1"],  ["rules", "rows"], ["frame", "VOID"] ],
                    [ make_thing( "TBODY", [], [ make_thing( "TR", [], val_top.concat( unit_top ) ),
                        make_thing( "TR", [], val_bot.concat( unit_bot ) ) ] ) ] ) ]
        }
        else
        {
            terms[ terms.length - 1 ] =
                ( !term_next_diff ) ? val_top_row.concat( unit_top_row )
                : [ make_thing( "SPAN", [["style","background-color:lightsalmon"]], val_top_row.concat( unit_top_row ) ) ];
        }
    }
    return terms;
}

function render_expression( exp, exp_next, whole_lmnt )
{
    assert( exp.length == exp_next.length, "Bad lengths A ( "+exp.length+" != "+exp_next.length+" ) " );
    var prods = [];
    for( var i = 0; i < exp.length; ++i )
    {
        if( !exp[ i ] )
        {
            continue;
        }
        var terms = render_prod_expression( exp[ i ], exp_next[ i ] );
        if( terms.length > 0 )
        {
            ++prods.length;
            prods[ prods.length - 1 ] = terms;
        }
    }

    var first_prod = true;
    lmnts = [];
    for( var i = 0; i < prods.length; ++i )
    {
        terms = prods[i];
        var first_term = true;
        if( !first_prod )
        {
            lmnts.push( make_thing( "SPAN", [ ["style", "font-size:larger"] ], [ document.createTextNode( "\u00A0+\u00A0" ) ] ) );
        }
        if( prods.length > 1 && terms.length > 1 )
        {
            lmnts.push( make_thing( "SPAN", [ ["style", "font-size:larger"] ], [ document.createTextNode( "(" ) ] ) );
        }
        for( var j = 0; j < terms.length; ++j )
        {
            if( !first_term )
            {
                lmnts.push( make_thing( "SPAN", [ ["style", "font-size:larger"] ], [ document.createTextNode( "\u00A0\u00D7\u00A0" ) ] ) );
            }
            lmnts = lmnts.concat( terms[j] );
            first_term = false;
        }
        if( prods.length > 1 && terms.length > 1 )
        {
            lmnts.push( make_thing( "SPAN", [ ["style", "font-size:larger"] ], [ document.createTextNode( ")" ) ] ) );
        }
        first_prod = false;
    }
    whole_lmnt.appendChild( make_thing( "SPAN", [ ["style", "display:inline-block; vertical-align:middle"] ], lmnts ) );
}

/* A simplification is an array of expressions */
function render_simplification( simplification )
{
    assert( "length" in simplification && simplification.length > 0, "Bad simplification" );
    var whole_simplification_lmnt = document.createElement( "DIV" );
    whole_simplification_lmnt.id = "span_for_simplification";
    for( var i = 1; i < simplification.length; ++i )
    {
        render_expression( simplification[ i - 1 ], simplification[ i ], whole_simplification_lmnt );
        whole_simplification_lmnt.appendChild( make_thing( "HR", [], [] ) );
    }
    render_expression( simplification[ simplification.length - 1 ], simplification[ simplification.length - 1 ], whole_simplification_lmnt );
    return whole_simplification_lmnt;
}

/* End rendering code */

/* Begin user modification code */

function invert_term_internal( term_lmnt )
{
    // alert( "invert_term_internal" );
    var term = parse_term_structure( term_lmnt );
    if( term.den )
    {
        swap_values( term.num, term.den );
    }
    else
    {
        term.num.value = 1.0 / parseFloat( term.num.value )
    }
    swap_values( term.num_unit, term.den_unit );
}

function invert_term( inv_button_lmnt )
{
    try
    {
        invert_term_internal( dumb_get_child( inv_button_lmnt.parentNode.parentNode.parentNode, "term" ) );
    }
    catch( e )
    {
        alert( e );
    }
}

function frac_term_internal( term_lmnt )
{
    // alert( "frac_term_internal" );
    var term = parse_term_structure( term_lmnt );
    var term_repl;
    if( term.den )
    {
        term_repl = make_term_helper( term.num.value / term.den.value, term.num_unit, term.den_unit );
    }
    else
    {
        term_repl = make_thing( "TABLE", [
            [ "style", "display:inline-block; vertical-align:middle; background-color:ghostwhite" ],
            [ "name", "term" ], [ "border", "1" ], [ "rules", "all" ], [ "frame", "void" ] ], [
            make_thing( "TBODY", [], [
                make_thing( "TR", [], [ make_thing( "TD", [], [
                    make_thing( "input", [ ["type", "text"], ["name", "numerator"], ["size", "5"], ["value", term.num.value] ], [] ),
                    term.num_unit
                ] ) ] ),
                make_thing( "TR", [], [ make_thing( "TD", [], [
                    make_thing( "input", [ [ "type", "text" ], [ "name", "denominator" ], [ "size", "5" ], [ "value", "1.0" ] ], [] ),
                    term.den_unit
                ] ) ] )
            ] )
        ] );
    }
    var parent = term_lmnt.parentNode;
    parent.replaceChild( term_repl, term_lmnt );
    // parent.removeChild( term_lmnt );
}

function frac_term( frac_button_lmnt )
{
    // alert( "frac_term "+frac_button_lmnt+" "+frac_button_lmnt.parentNode+" "+frac_button_lmnt.parentNode.parentNode+" "+frac_button_lmnt.parentNode.parentNode.parentNode );
    try
    {
        frac_term_internal( dumb_get_child( frac_button_lmnt.parentNode.parentNode.parentNode, "term" ) );
    }
    catch( e )
    {
        alert( e );
    }
}

/* "rt" = row or term */
function delete_row_or_term( rt_lmnt, attr, attr_val, silly_name )
{
    var parent = rt_lmnt.parentNode;
    var rt_count = 0;
    for( var i = 0; i < parent.childNodes.length; ++i )
    {
        child = parent.childNodes[i];
        if( "getAttribute" in child && child.getAttribute( attr ) == attr_val )
            ++rt_count;
    }

    if( rt_count < 2 )
    {
        alert( "You don't want to delete the last one." );
        return;
    }
    var plus_times_node = null;
    var passed_this_rt = false;
    for( var i = 0; i < parent.childNodes.length && !( plus_times_node && passed_this_rt ); ++i )
    {
        var child = parent.childNodes[i];
        if( "getAttribute" in child && child.getAttribute( "name" ) == silly_name )
        {
            plus_times_node = child;
        }
        else if( child == rt_lmnt )
        {
            passed_this_rt = true;
        }
    }
    if( plus_times_node && passed_this_rt )
    {
        parent.removeChild( plus_times_node );
    }
    parent.removeChild( rt_lmnt );
}

function delete_row( del_button_lmnt )
{
    delete_row_or_term( del_button_lmnt.parentNode.parentNode.parentNode.parentNode, "name", "product_lmnt", "silly_plus_thing" );
}

function delete_term( del_button_lmnt )
{
    delete_row_or_term( del_button_lmnt.parentNode.parentNode.parentNode, "class", "term_main_td", "silly_times_thing" );
}

function make_term_helper( num_val, num_unit, den_unit )
{
    return make_thing( "TABLE", [["style", "display:inline-block; vertical-align:middle; background-color:ghostwhite"],
                                      ["name","term"]], [ make_thing( "TBODY", [], [
        make_thing( "TR", [], [
            make_thing( "TD", [], [
                make_thing( "input", [ ["type",  "text"], ["name",  "just_number"], ["size",  "5"],
                                       ["value", ""+num_val ] ], [] )
            ] ),
            make_thing( "TD", [], [
                make_thing( "TABLE", [ [ "style", "display:inline-block; vertical-align:middle; background-color:ghostwhite" ],
                                       [ "border", "1" ], [ "rules", "all" ], [ "frame", "void" ] ], [ make_thing( "TBODY", [], [
                    make_thing( "TR", [], [ make_thing( "TD", [], [num_unit] ) ] ),
                    make_thing( "TR", [], [ make_thing( "TD", [], [den_unit] ) ] )
                ] ) ] )
            ] )
        ] )
    ] ) ] );
}

function make_new_term()
{
    /* Begin main term table */
    var main_td = make_thing( "TD", [["style", "background-color:ghostwhite"],["class", "term_main_td"]],
     [make_term_helper(
         0,
         make_thing( "INPUT", [ ["type", "text"],["name", "numerator_unit"  ],["size", "5"],["value", ""] ], [] ),
         make_thing( "INPUT", [ ["type", "text"],["name", "denominator_unit"],["size", "5"],["value", ""] ], [] ) ),

     make_thing( "DIV", [["style", "display:inline-block; vertical-align:middle"]], [
         make_thing( "DIV", [], [
             make_thing( "BUTTON", [ [ "type","button" ],["OnClick", "delete_term( this )"],["title","Delete this number"] ],
                                   [ document.createTextNode( "\u2205" ) ] )
         ] ),
         make_thing( "DIV", [], [
             make_thing( "BUTTON", [ [ "type","button" ], [ "OnClick","invert_term( this )" ],["title","Invert this number"] ],
                         [ document.createTextNode( "x" ), make_super( "-1" ) ] )
         ] ),
         make_thing( "DIV", [], [
             make_thing( "BUTTON", [ [ "type","button" ], [ "OnClick","frac_term( this )" ],["title","Make this number fractional"] ],
                         [ make_thing( "SUP", [], [ document.createTextNode( "x" ) ] ),
                                                    document.createTextNode( "\u2044" ),
                           make_thing( "SUB", [], [ document.createTextNode( "y" ) ] ) ] )
         ] )
     ] ) ] );

    return main_td;
}

function add_term( add_button_lmnt )
{
    var last_cell_lmnt = add_button_lmnt.parentNode;
    last_cell_lmnt.parentNode.insertBefore(
        make_thing( "TD", [["name", "silly_times_thing"]], [ document.createTextNode( "\u00D7" ) ] ),
        last_cell_lmnt );
    last_cell_lmnt.parentNode.insertBefore( make_new_term(), last_cell_lmnt );
}

function make_plus_thing()
{
    return make_thing( "DIV", [ ["name", "silly_plus_thing"] ], [ document.createTextNode( "+" ) ] );
}

function add_row( add_button_lmnt, want_plus_thing )
{
    if( add_button_lmnt )
    {
        var last_row_lmnt = add_button_lmnt.parentNode;
        var container_lmnt = last_row_lmnt.parentNode;
    }
    else
    {
        var container_lmnt = document.getElementById( "whole_shebang" );
        var last_row_lmnt = dumb_get_child( container_lmnt, "DIV" );
    }

    var term_add_td = make_thing( "TD", [], [make_thing( "BUTTON", [
        [ "style", "display:inline-block; vertical-align:middle" ], [ "type", "button" ], [ "name", "one" ],
        [ "OnClick", "add_term( this )" ],["title","Add a new number"] ],
         [ document.createTextNode( "\u00D7\u00A0\u22EF" ) ] )] );

         var main_tr =
             make_thing( "TABLE", [["name", "product_lmnt"], ["style", "background-color:lightcyan"]],
              [ make_thing( "TBODY", [], [ make_thing( "TR", [], [make_thing( "TD", [], [
                  make_thing( "BUTTON",
                      [["style", "display:inline-block; vertical-align:middle"], ["type", "button"],
                       ["OnClick", "delete_row( this )"],["title","Delete this product"]],
                      [ document.createTextNode( "\u2205" ) ] ) ] ),
                      make_new_term(),
                      //document.createTextNode( "blar" ),
                      term_add_td
                      ] ) ] ) ] );
/*
        var main_tr = make_thing( "DIV", [["style", "background-color:lightcyan"], ["name", "product_lmnt"]], [
            make_thing( "TABLE", [["name", "product_detail_lmnt"]],
             [ make_thing( "TBODY", [], [ make_thing( "TR", [], [make_thing( "TD", [], [
                 make_thing( "BUTTON",
                     [["style", "display:inline-block; vertical-align:middle"], ["type", "button"],
                      ["OnClick", "delete_row( this )"]],
                     [ document.createTextNode( "\u2205" ) ] ) ] ),
                     make_new_term(),
                     //document.createTextNode( "blar" ),
                     term_add_td
                     ] ) ] ) ] )] );
*/
    if( want_plus_thing )
    {
        container_lmnt.insertBefore( make_plus_thing(), last_row_lmnt );
    }
    container_lmnt.insertBefore( main_tr, last_row_lmnt );
}

/* End user modification code */

function simplify_internal( formula )
{
    var big_tab = document.getElementById( "whole_shebang" );
    var prods = [];
    for( var i = 0; i < big_tab.childNodes.length; ++i )
    {
        var child = big_tab.childNodes[ i ];
        if( "getAttribute" in child
            && child.getAttribute( "name" ) == "product_lmnt" )
        {
            var prod = parse_product( child );
            ++prods.length;
            prods[ prods.length - 1 ] = prod;
        }
    }
    assert( prods.length > 0, "NO PPPPP" );
    var simplification = [ prods ];
    
    var phase = 1;
    try
    {
        while( phase < 6 )
        {
            if( phase < 5 )
            {
                if( !simplification_step( simplification, phase ) )
                {
                    ++phase;
                }
            }
            if( phase == 5 )
            {
                if( !perform_an_addition( simplification ) )
                {
                    phase = 6;
                }
            }
        }
    }
    catch( e )
    {
        if( e instanceof TypeError )
        {
        }
        else
        {
            alert( e );
        }
    }
    var old_foo = document.getElementById( "span_for_simplification" );
    if( old_foo )
    {
        old_foo.parentNode.removeChild( old_foo );
    }
    document.getElementById( "WILL_THIS_WORK" ).appendChild( render_simplification( simplification ) );
}

function simplify( formula_id )
{
    try
    {
        simplify_internal( document.getElementById( formula_id ) );
    }
    catch( e )
    {
        alert( e );
    }
}
