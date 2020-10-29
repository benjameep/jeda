var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
require('./style.scss')
var template = require('./index.pug')
const Backbone = require('backbone')


const TEXT_SIZE = 12;
const LINE_HEIGHT = 16;
const BODY_PADDING = 6;

var DiscreteColumnModel = Backbone.Model.extend({
    defaults: {},

    pixel_to_value_index(y){
        var num_values = this.get('values').length
        var height = LINE_HEIGHT*num_values
        if(y < 0)
            return 0
        if(y > height)
            return this.get('na') ? null : num_values-1
        return Math.floor(y/height*num_values)
    },

    mousedown(y){ 
        this.selection_start = this.pixel_to_value_index(y) 
    },

    mouseup(y, append, stretch){
        var start = this.selection_start
        var end = this.pixel_to_value_index(y)
        
        if(start == null && end == null)
            return this.set({select_na:true})
        if(start == null)
            start = this.get('values').length-1
        if(end == null)
            end = this.get('values').length-1
        
        var [start, end] = [Math.min(start, end), Math.max(start, end)]
        
        var selections = this.get('selections')
        if(!append && !stretch)
            selections = []

        console.log(this.get('values')[start], this.get('values')[end])
    },
})

var ContinuousColumnModel = Backbone.Model.extend({    
    defaults: {
        min:0,
        max:0,
        num_labels: 6,
    },

    initialize(){
        this.set_labels()
        this.on('change:min change:max change:num_labels', this.set_labels, this)
    },

    set_labels(){
        var min = this.get('min')
        var max = this.get('max')
        var count = this.get('num_labels')
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
        this.set({labels: out})
    },

    pixel_to_value_range(y){
        var labels = this.get('labels')
        var height = LINE_HEIGHT*labels.length
        var px = (y,dmin,dmax) => Math.min(Math.max(dmin + (y/height) * (dmax-dmin), dmin),dmax)
        y -= TEXT_SIZE / 2
        height -= TEXT_SIZE

        if(y < 0)
            y = 0
        if(this.get('na') && y > height)
            return null
        else if(y > height)
            y = height-1
        
        var dmin = labels[0]
        var dmax = labels[labels.length-1]
        return [px(y-TEXT_SIZE/2, dmin, dmax), px(y+TEXT_SIZE/2, dmin, dmax)]
    },

    mousedown(y){ 
        this.selection_start = this.pixel_to_value_range(y)
    },
    mouseup(y, append, stretch){
        var max = this.get('labels').slice(-1)[0]
        var start = this.selection_start
        var end = this.pixel_to_value_range(y)
        
        if(start == null && end == null)
            return this.set({select_na:true})
        if(start == null)
            start = [max,max]
        if(end == null)
            end = [max,max]
        
        var [start, end] = [Math.min(start[0], end[0]), Math.max(start[1], end[1])]
        
        var selections = this.get('selections')
        if(!append && !stretch)
            selections = []

        console.log(start, end)
    },
})

var ColumnList = Backbone.Collection.extend({
    modelId(col){ return col.name },

    // model: DiscreteColumnModel,
    model: function(col, options){
        if(col.type == 'discrete')
            return new DiscreteColumnModel(col, options)
        else if(col.type == 'continuous')
            return new ContinuousColumnModel(col, options)
        else
            throw new Error('Unknown Column Type: ', col.type)
    },
})

var JedaModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'JedaModel',
        _view_name : 'JedaView',
        _model_module : 'jeda',
        _view_module : 'jeda',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        columns : [],
        selections: [],
    }),

    initialize(){
        widgets.DOMWidgetModel.prototype.initialize.apply(this, arguments)
        this.columns = new ColumnList(this.get('columns'))
        this.on('change:columns', () => this.columns.set(this.get('columns')))
    },
});

// Custom View. Renders the widget model.
var JedaView = widgets.DOMWidgetView.extend({
    className:'jeda',

    events: {
        'mousedown .column .body': 'mousedown',
    },

    initialize(){
        widgets.DOMWidgetView.prototype.initialize.apply(this, arguments)
        this.model.columns.on('change add remove reset', this.render, this)
        window.addEventListener('mouseup', this.mouseup.bind(this))
    },

    // Defines how the widget gets rendered into the DOM
    render: function() {
        this.el.innerHTML = template({columns:this.model.columns.toJSON()})        
    },

    mousedown(e){
        var $col = e.target.closest('.column')
        if(!$col) throw new Error('Mouse down was not in column')
        var col_name = $col.dataset.name
        var rect = $col.querySelector('.body').getBoundingClientRect();
        var y = e.clientY - rect.top - BODY_PADDING;
        var col = this.model.columns.get(col_name)
        col.mousedown(y)
        this.currently_mousedown_on = col
    },

    mouseup(e){
        if(!this.currently_mousedown_on) return
        var $col = this.el.querySelector(`.column[data-name="${this.currently_mousedown_on.get('name')}"]`)
        var rect = $col.querySelector('.body').getBoundingClientRect();
        var y = e.clientY - rect.top - BODY_PADDING;
        this.currently_mousedown_on.mouseup(y, e.ctrlKey, e.shiftKey)
        this.currently_mousedown_on = null
    },
});

module.exports = {
    JedaModel: JedaModel,
    JedaView: JedaView
};
