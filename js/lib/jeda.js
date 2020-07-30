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
        console.log(this.model.get('columns'))
        this.el.innerHTML = template({
            columns: this.model.get('columns')
        });
    }
});


module.exports = {
    JedaModel: JedaModel,
    JedaView: JedaView
};
