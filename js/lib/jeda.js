var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
require('./style.css')
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


// Custom View. Renders the widget model.
var JedaView = widgets.DOMWidgetView.extend({
    // Defines how the widget gets rendered into the DOM
    render: function() {
        this.el.classList.add('jeda')

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
                dmin = col.labels[0]
                dmax = col.labels[col.labels.length-1]
                rmin = 6
                rmax = (col.labels.length * 20) - 14
                col.values.forEach(val => {
                    val.y = linear_map(val.name, dmin, dmax, rmin, rmax)
                })
            }
        })

        console.log(columns)

        this.el.innerHTML = template({columns});
    }
});


module.exports = {
    JedaModel: JedaModel,
    JedaView: JedaView
};
