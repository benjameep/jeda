var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
require('./style.scss')
var template = require('./index.pug')

// See example.py for the kernel counterpart to this file.


// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var JedaModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'JedaModel',
        _view_name : 'JedaView',
        _model_module : 'jeda',
        _view_module : 'jeda',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        columns : [],
        selecting: null,
        selections: [],
    })
});

function calc_labels(min, max, count=6){
    var n = (max-min)/count
    var lvl = Math.pow(10,Math.floor(Math.log10(n)))
    var powers = [1,2,5,10]
    // Don't use 2.5 if n is between 1-10, other wise put it in
    if(lvl != 1)
        powers.splice(2,0,2.5)
    var closest = 0
    var closest_dist = Math.abs(n-lvl)
    for(var i = 1; i < powers.length; i++){
        var dist = Math.abs(n - lvl*powers[i])
        if(dist < closest_dist){
        closest = i
        closest_dist = dist
        }
    }
    var gap = lvl*powers[closest]
    var out = []
    var i = Math.floor(min/gap)*gap
    var cap = Math.ceil(max/gap)*gap
    for(; i <= cap; i += gap)
        out.push(i)
    return out
}

function linear_map(val, dmin, dmax, rmin, rmax){
    return ((val-dmin)/(dmax-dmin))*(rmax-rmin)+rmin
}

const TEXT_SIZE = 14;
const LINE_HEIGHT = 16;
const BAR_HEIGHT = 6;
const BODY_PADDING = 6;

// Custom View. Renders the widget model.
var JedaView = widgets.DOMWidgetView.extend({
    tagName: 'div',
    className:'benjamin',

    // Defines how the widget gets rendered into the DOM
    render: function() {
        this.columns_changed();

        // Observe changes in the value traitlet in Python, and define
        // a custom callback.
        this.model.on('change:columns', this.columns_changed, this);
    },

    columns_changed: function() {
        var columns = this.model.get('columns')
        

        columns.forEach(col => {
            if(col.type == 'continuous'){
                col.labels = calc_labels(col.min, col.max)
                // dmin = col.labels[0]
                // dmax = col.labels[col.labels.length-1]
                // rmin = (TEXT_SIZE-BAR_HEIGHT)/2
                // rmax = (col.labels.length * LINE_HEIGHT) - (LINE_HEIGHT+BAR_HEIGHT)/2
                // col.values.forEach(val => {
                //     val.y = Math.round(linear_map(val.name, dmin, dmax, rmin, rmax))
                // })
            }
        })

        console.log(JSON.stringify(columns))


        this.el.innerHTML = template({columns});

        this.el.querySelectorAll('.column').forEach(($col,i) => {
            var $body = $col.querySelector('.body')
            $body.addEventListener('mousedown',this.on_column_mousedown.bind(this,$body,columns[i]))
            $body.addEventListener('mouseup',this.on_column_mouseup.bind(this,$body,columns[i]))
        })
    },

    calc_selection($body, _col, e){
        var rect = $body.getBoundingClientRect();
        var y = e.clientY - rect.top - BODY_PADDING;
        var nitems = _col.labels ? _col.labels.length : _col.values.length
        var height = LINE_HEIGHT*nitems
        var px = (y,dmin,dmax) => dmin + (y/height) * (dmax-dmin)
        if(_col.type == 'continuous'){
            y -= TEXT_SIZE / 2
            height -= TEXT_SIZE
        }

        // Deal with mouse being above highest number or lower than lowest
        if(y < 0)
            y = 0
        if(_col.na && y > height){
            return null
        }
        else if(y > height)
            y = height-1
        
        if(_col.type == 'discrete'){
            var item_index = Math.floor(y/height*nitems)
            return item_index
        }
        else if(_col.type == 'continuous'){
            var dmin = _col.labels[0]
            var dmax = _col.labels[_col.labels.length-1]
            return [px(y-6, dmin, dmax), px(y+6, dmin, dmax)]
        }
    },

    on_column_mousedown($body, _col, e){
        var selection = this.calc_selection($body, _col, e)
        console.log('mousedown', selection)

        this.model.set('selecting',{
            column:_col,
            selection:selection,
        })
    },

    combine_selections(start, end, column){
        console.assert(!(start === null && end === null))
        var selection = {
            column: column,
        }
        if(column.type == 'continuous'){
            if(start === null || end === null){
                selection.include_nan = true
                console.log('unimplimented null case')
            } else {
                selection.start = Math.min(start[0],end[0])
                selection.end = Math.max(start[0],end[1])
            }
        }
        else if(column.type == 'discrete'){
            if(start === null)
                start = column.values.length-1
            if(end === null)
                end = column.values.length-1
            selection.start = Math.min(start, end)
            selection.end = Math.max(start, end)
        }
        console.log(selection)
    },

    on_column_mouseup($body, _col, e){
        var end = this.calc_selection($body, _col, e)
        console.log('mouseup', end)

        var selecting = this.model.get('selecting')
        var start = selecting.selection

        if(selecting.column != _col){
            console.log('cross columns')
            this.model.set('selecting',null)
            return
        }

        var old_selections = this.model.get('selections').filter(n => n.column == _col)

        if(start === null && end === null){
            console.log('selecting null')
            this.model.set('selections', [...selections, {
                column:_col,
                includ_nan: true,
            }])
        }
        else if(selecting.column == _col){
            this.combine_selections(start, end, _col)
            console.log('cross columns')
        }
        this.model.set('selecting',null)
    }
});

// window.jeda_onclick = function(elm, e, line_height, nitems){
//     var rect = elm.getBoundingClientRect();
//     var y = e.clientY - rect.top - BODY_PADDING;
//     var has_nan = !!elm.querySelector('.nan')
//     var height = line_height*nitems
//     var px = (y,dmin,dmax) => dmin + (y/height) * (dmax-dmin)
    
//     if(y < 0)
//         y = 0
//     if(has_nan && y > height){
//         console.log('hit nan')
//         return
//     }
//     else if(y > height)
//         y = height

//     if(elm.classList.contains('discrete')){
//         var item_index = Math.floor(y/height*nitems)
//         console.log(item_index)
//     }

//     else if(elm.classList.contains('continuous')){
//         var labels = elm.querySelectorAll('.name:not(.nan)')
//         var dmin = +labels[0].textContent
//         var dmax = +labels[labels.length-1].textContent
//         console.log([px(y-6, dmin, dmax), px(y+6, dmin, dmax)])
//     }

//     // if(y < 6)
//     // console.log(y, height, percent)
// }

module.exports = {
    JedaModel: JedaModel,
    JedaView: JedaView
};
